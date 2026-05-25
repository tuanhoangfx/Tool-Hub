import type { ReactNode } from "react";

export function PreviewSection({
  num,
  title,
  lang,
  children,
}: {
  num: string;
  title: string;
  lang: string;
  children: ReactNode;
}) {
  return (
    <section className="tv-preview-section">
      <header className="tv-preview-section-head">
        <span className="tv-preview-num">{num}</span>
        <div>
          <h3 className="tv-preview-title">{title}</h3>
          <p className="tv-preview-lang">{lang}</p>
        </div>
      </header>
      <div className="tv-preview-frame tv-preview-frame--wide">{children}</div>
    </section>
  );
}
