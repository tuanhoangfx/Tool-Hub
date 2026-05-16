import { MaterialIcon } from "../../components/MaterialIcon";
import type { ResolvedTool } from "../../types";

type ReleaseChecklistTabProps = {
  selectedTool: ResolvedTool;
};

export function ReleaseChecklistTab({ selectedTool }: ReleaseChecklistTabProps) {
  const files = selectedTool.remote?.files ?? [];
  const checks = [
    { label: "README", passed: Boolean(files.find((f) => f.path === "README.md" && f.ok)) },
    {
      label: "CHANGELOG",
      passed: Boolean(files.find((f) => f.path === "CHANGELOG.md" && f.ok)) && selectedTool.driftAlerts.every((a) => !a.includes("CHANGELOG")),
    },
    { label: "Manifest", passed: Boolean(files.find((f) => f.path === selectedTool.manifestPath && f.ok)) },
    { label: "No drift", passed: selectedTool.driftAlerts.length === 0 },
    { label: "Release", passed: Boolean(selectedTool.remote?.latestRelease) },
    { label: "Scripts", passed: selectedTool.scriptFiles.every((s) => files.find((f) => f.path === s && f.ok)) },
  ];
  const passed = checks.filter((c) => c.passed).length;

  return (
    <section className="release-layout">
      <div className="admin-main">
        <div className="panel-title-row slim">
          <h2>{selectedTool.name}</h2>
          <span className={passed === checks.length ? "status-dot ok" : "status-dot warn"}>
            {passed}/{checks.length}
          </span>
        </div>

        <div className="checklist compact-checks">
          {checks.map((check) => (
            <article className={check.passed ? "check-row passed" : "check-row warning"} key={check.label}>
              <MaterialIcon name={check.passed ? "check_circle" : "warning"} size={16} />
              <strong>{check.label}</strong>
            </article>
          ))}
        </div>
      </div>

      <aside className="admin-side">
        <div className="panel-title-row">
          <h2>v{selectedTool.version}</h2>
        </div>
        {selectedTool.suggestions.length > 0 ? (
          <ul className="suggestions">
            {selectedTool.suggestions.slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="muted-inline">San sang publish</p>
        )}
      </aside>
    </section>
  );
}
