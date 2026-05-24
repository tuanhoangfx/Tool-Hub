import { MOCK_TOOLS } from "./mock";
import { MockMetrics, MockToolGrid } from "./shared";

export function V1UnifiedSidebar() {
  return (
    <div className="hs-frame hs-v1">
      <aside className="hs-v1-side">
        <div className="hs-v1-brand">Tool Hub</div>
        <nav className="hs-v1-nav">
          <span className="active">Library</span>
          <span>Dashboard</span>
          <span>System</span>
        </nav>
      </aside>
      <main className="hs-v1-main">
        <header className="hs-v1-head">Library · 13 tools</header>
        <MockMetrics />
        <MockToolGrid tools={MOCK_TOOLS} />
      </main>
    </div>
  );
}

export function V2ClassicMac() {
  return (
    <div className="hs-frame hs-v2">
      <aside className="hs-v2-side">
        <div className="hs-v2-lights">
          <span />
          <span />
          <span />
        </div>
        <div className="hs-v2-brand">Tool Hub</div>
        <div className="hs-v2-foot">Registry live</div>
      </aside>
      <main className="hs-v2-main">
        <header className="hs-v2-head">
          <h2>Tool Hub</h2>
          <span>Auto-refresh on</span>
        </header>
        <MockMetrics />
        <MockToolGrid tools={MOCK_TOOLS} />
      </main>
    </div>
  );
}

export function V3SearchFirst() {
  return (
    <div className="hs-frame hs-v3">
      <div className="hs-v3-search">
        <span className="hs-v3-kbd">⌘K</span>
        <input readOnly placeholder="Search tools, repos, ports…" />
      </div>
      <div className="hs-v3-results">
        {MOCK_TOOLS.slice(0, 4).map((t) => (
          <div key={t.code} className="hs-v3-row">
            <strong>{t.code}</strong> {t.name} <em>:{t.port}</em>
          </div>
        ))}
      </div>
      <p className="hs-v3-hint">Chrome tối thiểu — sidebar ẩn, mở bằng ⌘K</p>
    </div>
  );
}

export function V4TopNav() {
  return (
    <div className="hs-frame hs-v4">
      <header className="hs-v4-top">
        <strong>Tool Hub</strong>
        <nav>
          <span className="active">Library</span>
          <span>Metrics</span>
          <span>System</span>
        </nav>
      </header>
      <main className="hs-v4-main">
        <MockMetrics />
        <MockToolGrid tools={MOCK_TOOLS} />
      </main>
    </div>
  );
}

export function V5BentoDashboard() {
  return (
    <div className="hs-frame hs-v5">
      <header className="hs-v5-head">Tool Hub · Executive</header>
      <div className="hs-v5-bento">
        <div className="hs-v5-tile large">13 tools tracked</div>
        <div className="hs-v5-tile">11 ready</div>
        <div className="hs-v5-tile warn">2 drift</div>
        <div className="hs-v5-tile wide">Last sync: 2m ago</div>
      </div>
      <section className="hs-v5-lib">
        <h4>Library</h4>
        <MockToolGrid tools={MOCK_TOOLS} />
      </section>
    </div>
  );
}
