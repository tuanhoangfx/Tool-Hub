import { MaterialIcon } from "../../components";

export function SystemOverviewPanel() {
  return (
    <div className="system-overview anim-fade">
      <section className="system-card">
        <h3>Tool Hub · System</h3>
        <p>
          Catalog workspace tools — GitHub health, local path, version drift. Production shell hiện tại là{" "}
          <strong>Library-only</strong> (classic macOS sidebar).
        </p>
      </section>
      <section className="system-card">
        <h3>Design Template</h3>
        <p>
          Trước khi đổi shell production, so sánh ≥5 hướng UI trong tab{" "}
          <strong>Design Template</strong> → trả lời <code>Design: Vn</code> để chốt.
        </p>
        <a className="system-link" href="?screen=system&stab=template&dtpl=hub-shell&hsdesign=V1">
          <MaterialIcon name="palette" size={16} />
          Mở Hub Shell preview
        </a>
      </section>
      <section className="system-card system-card--muted">
        <h3>Registry</h3>
        <ul className="system-kv">
          <li>
            <span>scan:local</span>
            <code>pnpm scan:local</code>
          </li>
          <li>
            <span>sync:workspace</span>
            <code>pnpm sync:workspace</code>
          </li>
          <li>
            <span>Production</span>
            <code>https://infix1.io.vn</code>
          </li>
        </ul>
      </section>
    </div>
  );
}
