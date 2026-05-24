import { useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "../../../components";
import { HubShellPreviewHub } from "./hub-shell/HubShellPreviewHub";
import {
  DESIGN_TEMPLATE_RULE,
  DESIGN_TEMPLATES,
  readDesignTemplateId,
  setDesignTemplateId,
  type DesignTemplateId,
} from "./templates";
import "./design-template.css";

function TemplatePicker({
  active,
  onPick,
}: {
  active: DesignTemplateId;
  onPick: (id: DesignTemplateId) => void;
}) {
  return (
    <div className="dt-template-grid">
      {DESIGN_TEMPLATES.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t.id)}
            className={isActive ? "dt-template-card active" : "dt-template-card"}
          >
            <div className="dt-template-card-head">
              <span className="dt-template-label">{t.label}</span>
              <span className={`dt-status dt-status--${t.status}`}>{t.status}</span>
            </div>
            <p className="dt-template-feature">{t.feature}</p>
            <p className="dt-template-meta">
              {t.variants} variants · <code>{t.variantParam}</code>
            </p>
          </button>
        );
      })}
      <div className="dt-template-card dt-template-card--soon">
        <div className="dt-soon-title">
          <MaterialIcon name="layers" size={14} /> Activity / Sync …
        </div>
        <p>Thêm template khi bắt đầu tính năng mới</p>
      </div>
    </div>
  );
}

export function DesignTemplateHub() {
  const [tick, setTick] = useState(0);
  const templateId = useMemo(() => readDesignTemplateId(), [tick]);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("popstate", bump);
    return () => window.removeEventListener("popstate", bump);
  }, []);

  const pickTemplate = (id: DesignTemplateId) => {
    setDesignTemplateId(id);
    setTick((t) => t + 1);
  };

  return (
    <div className="design-template-hub anim-fade">
      <div className="dt-rule-banner">
        <MaterialIcon name="verified_user" size={18} />
        <div>
          <strong>Quy tắc Design Template</strong> — {DESIGN_TEMPLATE_RULE}
          <p>
            Chọn tính năng → so sánh ≥5 hướng → trả lời <code>Design: Vn</code> → mới code production.
          </p>
        </div>
      </div>

      <header className="dt-header">
        <h2>Design Template</h2>
        <p>Mẫu UI tĩnh — chỉ trong System, không ảnh hưởng Library production cho đến khi chốt.</p>
      </header>

      <TemplatePicker active={templateId} onPick={pickTemplate} />

      {templateId === "hub-shell" ? <HubShellPreviewHub /> : null}
    </div>
  );
}
