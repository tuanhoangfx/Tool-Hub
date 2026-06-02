#!/usr/bin/env node
/**
 * Phase 1: Export users, profiles, projects, memberships from Data Box (yhnqwx).
 * Uses service role REST API, or Management API SQL when project is egress-restricted.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadMigrationEnv } from "./load-env.mjs";
import { fetchServiceRole } from "./fetch-service-role.mjs";
import { runDbQuery } from "./db-query.mjs";

const env = loadMigrationEnv();

function isQuotaBlocked(err) {
  const msg = String(err?.message ?? err ?? "");
  return (
    err?.status === 402 ||
    /exceed_egress_quota|restricted due to/i.test(msg)
  );
}

async function safeSql(ref, query) {
  try {
    return await runDbQuery(ref, query);
  } catch (e) {
    if (/does not exist|relation.*does not exist/i.test(e.message)) return [];
    throw e;
  }
}

async function exportViaSql(ref) {
  console.log("Project REST blocked (egress quota) — exporting via Management API SQL …");
  const [authRows, profiles, projects, members, activityRows] = await Promise.all([
    runDbQuery(
      ref,
      `select id, email, created_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data
       from auth.users`,
    ),
    safeSql(ref, "select * from public.profiles"),
    safeSql(ref, "select * from public.projects"),
    safeSql(ref, "select * from public.project_members"),
    safeSql(
      ref,
      `select user_id, created_at from public.activity_logs
       order by created_at desc nulls last limit 50000`,
    ),
  ]);

  const authUsers = authRows.map((r) => ({
    id: r.id,
    email: r.email,
    created_at: r.created_at,
    last_sign_in_at: r.last_sign_in_at,
    user_metadata: r.raw_user_meta_data ?? {},
    app_metadata: r.raw_app_meta_data ?? {},
  }));

  return {
    authUsers,
    profiles: { data: profiles, error: null },
    projects: { data: projects, error: null },
    members: { data: members, error: null },
    activity: { data: activityRows, error: null },
  };
}

let sourceServiceKey = env.sourceServiceKey;
if (!sourceServiceKey) {
  console.log("No P0020 service role in .env.local — trying Management API for", env.sourceRef, "…");
  try {
    sourceServiceKey = await fetchServiceRole(env.sourceRef);
    console.log("Got service_role via Management API.");
  } catch (e) {
    console.error(e.message);
    console.error("Add SUPABASE_SERVICE_ROLE_KEY to P0020 .env.local OR grant PAT access to yhnqwx project.");
    process.exit(1);
  }
}

const source = createClient(env.sourceUrl, sourceServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await source.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return users;
}

async function fetchRestBundle() {
  const [authUsers, profilesRes, projectsRes, membersRes, activityRes] = await Promise.all([
    listAllAuthUsers(),
    source.from("profiles").select("*"),
    source.from("projects").select("*"),
    source.from("project_members").select("*"),
    source
      .from("activity_logs")
      .select("user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50000),
  ]);
  return { authUsers, profilesRes, projectsRes, membersRes, activityRes };
}

async function main() {
  console.log("Exporting from", env.sourceUrl, "ref", env.sourceRef);

  let authUsers;
  let profilesRes;
  let projectsRes;
  let membersRes;
  let activityRes;

  try {
    const bundle = await fetchRestBundle();
    authUsers = bundle.authUsers;
    profilesRes = bundle.profilesRes;
    projectsRes = bundle.projectsRes;
    membersRes = bundle.membersRes;
    activityRes = bundle.activityRes;
  } catch (err) {
    if (!isQuotaBlocked(err)) throw err;
    const sql = await exportViaSql(env.sourceRef);
    authUsers = sql.authUsers;
    profilesRes = sql.profiles;
    projectsRes = sql.projects;
    membersRes = sql.members;
    activityRes = sql.activity;
  }

  if (profilesRes.error && !/does not exist|relation/i.test(profilesRes.error.message)) {
    throw profilesRes.error;
  }
  if (projectsRes.error && !/does not exist|relation/i.test(projectsRes.error.message)) {
    throw projectsRes.error;
  }
  if (membersRes.error && !/does not exist|relation/i.test(membersRes.error.message)) {
    throw membersRes.error;
  }

  const activityByUser = new Map();
  if (!activityRes.error && activityRes.data) {
    for (const row of activityRes.data) {
      const uid = row.user_id;
      if (!uid) continue;
      const cur = activityByUser.get(uid) ?? { count: 0, last_at: null };
      cur.count += 1;
      if (!cur.last_at || (row.created_at && row.created_at > cur.last_at)) {
        cur.last_at = row.created_at;
      }
      activityByUser.set(uid, cur);
    }
  }

  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

  const users = authUsers.map((u) => {
    const p = profileById.get(u.id);
    return {
      legacy_user_id: u.id,
      email: (u.email ?? p?.email ?? "").trim().toLowerCase(),
      full_name:
        p?.full_name ??
        u.user_metadata?.full_name ??
        u.email?.split("@")[0] ??
        u.id,
      role: p?.role ?? u.app_metadata?.role ?? "user",
      avatar_url: p?.avatar_url ?? u.user_metadata?.avatar_url ?? null,
      created_at: u.created_at ?? p?.created_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? p?.last_sign_in_at ?? null,
      default_project_id: p?.default_project_id ?? null,
      activity_count: activityByUser.get(u.id)?.count ?? 0,
      last_activity_at: activityByUser.get(u.id)?.last_at ?? u.last_sign_in_at ?? null,
    };
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    sourceRef: env.sourceRef,
    sourceUrl: env.sourceUrl,
    counts: {
      users: users.length,
      profiles: profilesRes.data?.length ?? 0,
      projects: projectsRes.data?.length ?? 0,
      members: membersRes.data?.length ?? 0,
    },
    users,
    projects: projectsRes.data ?? [],
    projectMembers: membersRes.data ?? [],
  };

  fs.mkdirSync(env.exportDir, { recursive: true });
  const outFile = path.join(env.exportDir, `databox-identity-${env.sourceRef}.json`);
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf8");
  console.log("Wrote", outFile);
  console.log("Counts:", payload.counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
