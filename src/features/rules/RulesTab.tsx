import { useEffect, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import type { RuleSource } from "../../data/repositories";

type RulesTabProps = {
  rules: RuleSource[];
};

function pathToFileUrl(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/");
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return `file:///${normalized}`;
  }
  return `file://${normalized}`;
}

export function RulesTab({ rules }: RulesTabProps) {
  const [selectedLabel, setSelectedLabel] = useState(rules[0]?.label ?? "");
  const selected = rules.find((rule) => rule.label === selectedLabel) ?? rules[0];
  const [preview, setPreview] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!rules.some((rule) => rule.label === selectedLabel)) {
      setSelectedLabel(rules[0]?.label ?? "");
    }
  }, [rules, selectedLabel]);

  useEffect(() => {
    if (!selected?.previewPath) {
      setPreview("");
      setPreviewError(selected ? "Không có bản xem trước trên web." : "");
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);
    setPreviewError("");

    fetch(`${selected.previewPath}?t=${Date.now()}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((text) => {
        if (!cancelled) {
          setPreview(text);
          setPreviewError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPreview("");
          setPreviewError(error instanceof Error ? error.message : "Không tải được preview");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected?.previewPath, selected?.label]);

  async function copyPath(rule: RuleSource) {
    try {
      await navigator.clipboard.writeText(rule.path);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="rules-layout">
      <div className="rules-list">
        {rules.map((rule) => (
          <button
            type="button"
            key={rule.label}
            className={rule.label === selected?.label ? "rule-card selected" : "rule-card"}
            onClick={() => setSelectedLabel(rule.label)}
          >
            <MaterialIcon name="rule" size={18} />
            <div>
              <h2>{rule.label}</h2>
              <p>{rule.summary}</p>
              <span className="rule-path">{rule.path}</span>
            </div>
          </button>
        ))}
        {rules.length === 0 ? <p className="muted-inline">Không có rule khớp bộ lọc.</p> : null}
      </div>

      {selected ? (
        <aside className="rules-preview">
          <div className="rules-preview-head">
            <h2>{selected.label}</h2>
            <div className="rules-preview-actions">
              <a className="btn secondary" href={pathToFileUrl(selected.path)} target="_blank" rel="noreferrer">
                <MaterialIcon name="folder_open" size={16} />
                Mở file
              </a>
              <button className="btn secondary" type="button" onClick={() => void copyPath(selected)}>
                <MaterialIcon name="content_copy" size={16} />
                Copy path
              </button>
            </div>
          </div>
          <p className="rule-path mono">{selected.path}</p>
          {loadingPreview ? <p className="muted-inline">Đang tải preview…</p> : null}
          {previewError ? <p className="inline-banner warn">{previewError}</p> : null}
          {preview ? <pre className="rules-preview-body custom-scrollbar">{preview}</pre> : null}
        </aside>
      ) : null}
    </section>
  );
}
