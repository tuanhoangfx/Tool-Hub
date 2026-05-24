import type { MockTool } from "./mock";

function MiniToolCard({ tool }: { tool: MockTool }) {
  return (
    <div className="hs-mini-card">
      <span className="hs-mini-code">{tool.code}</span>
      <span className="hs-mini-name">{tool.name}</span>
      <span className={`hs-mini-status hs-mini-status--${tool.status.toLowerCase()}`}>{tool.status}</span>
    </div>
  );
}

export function MockToolGrid({ tools }: { tools: MockTool[] }) {
  return (
    <div className="hs-mini-grid">
      {tools.map((t) => (
        <MiniToolCard key={t.code} tool={t} />
      ))}
    </div>
  );
}

export function MockMetrics() {
  return (
    <div className="hs-mini-metrics">
      <div>
        <strong>13</strong>
        <span>Tools</span>
      </div>
      <div>
        <strong>11</strong>
        <span>Ready</span>
      </div>
      <div>
        <strong>2</strong>
        <span>Drift</span>
      </div>
      <div>
        <strong>15</strong>
        <span>Catalog</span>
      </div>
    </div>
  );
}
