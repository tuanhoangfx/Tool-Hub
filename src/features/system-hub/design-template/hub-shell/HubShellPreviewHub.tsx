import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { MaterialIcon } from "../../../../components";
import {
  HUB_SHELL_VARIANTS,
  readHubShellVariant,
  setHubShellVariant,
  type HubShellVariant,
} from "./mock";
import {
  V1UnifiedSidebar,
  V2ClassicMac,
  V3SearchFirst,
  V4TopNav,
  V5BentoDashboard,
} from "./variants";

const RENDER: Record<HubShellVariant, () => ReactNode> = {
  V1: () => <V1UnifiedSidebar />,
  V2: () => <V2ClassicMac />,
  V3: () => <V3SearchFirst />,
  V4: () => <V4TopNav />,
  V5: () => <V5BentoDashboard />,
};

export function HubShellPreviewHub() {
  const [tick, setTick] = useState(0);
  const variant = useMemo(() => readHubShellVariant(), [tick]);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("popstate", bump);
    return () => window.removeEventListener("popstate", bump);
  }, []);

  const pick = useCallback((v: HubShellVariant) => {
    setHubShellVariant(v);
    setTick((t) => t + 1);
  }, []);

  const current = HUB_SHELL_VARIANTS.find((x) => x.id === variant);

  return (
    <div className="hub-shell-preview anim-fade">
      <header className="hsp-header">
        <MaterialIcon name="hub" size={22} />
        <div>
          <h3>Hub Shell · 5 design options</h3>
          <p>
            {variant} · {current?.label} — {current?.desc}
          </p>
        </div>
      </header>

      <nav className="hsp-variant-nav">
        {HUB_SHELL_VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => pick(v.id)}
            className={variant === v.id ? "hsp-variant active" : "hsp-variant"}
          >
            <span className="hsp-variant-id">{v.id}</span>
            <span className="hsp-variant-label">{v.label}</span>
            <span className="hsp-variant-desc">{v.desc}</span>
            <span className="hsp-variant-mood">{v.mood}</span>
          </button>
        ))}
      </nav>

      <div className="hsp-stage" aria-label={`Preview ${variant}`}>
        {RENDER[variant]()}
      </div>
    </div>
  );
}
