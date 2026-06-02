import { DesignTemplateEmpty } from "./DesignTemplateEmpty";

/** Design previews removed after Agent context locked to V2 (System → Agent tab). */
export function DesignTemplatePage() {
  return (
    <div className="design-template-page px-6 pb-10 pt-4">
      <DesignTemplateEmpty />
    </div>
  );
}
