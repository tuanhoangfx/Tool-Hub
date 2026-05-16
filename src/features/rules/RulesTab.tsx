import { useMemo } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import { ruleSources } from "../../data/repositories";

type RulesTabProps = {
  query: string;
};

export function RulesTab({ query }: RulesTabProps) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ruleSources;
    return ruleSources.filter((rule) => [rule.label, rule.summary, rule.path].join(" ").toLowerCase().includes(q));
  }, [query]);

  return (
    <section className="rules-page">
      {filtered.map((rule) => (
        <article className="rule-card" key={rule.label}>
          <MaterialIcon name="rule" size={18} />
          <div>
            <h2>{rule.label}</h2>
            <span>{rule.path}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
