#!/usr/bin/env node
import { runDbQuery } from "./db-query.mjs";

const rows = await runDbQuery(
  "fmnrafpzctuhxjaaomzt",
  `select
    (select count(*)::int from auth.users) as users,
    (select count(*)::int from public.projects) as projects,
    (select count(*)::int from public.project_members) as members,
    (select count(*)::int from public.legacy_user_map) as legacy_maps`,
);
console.log("Hub identity:", rows[0]);
