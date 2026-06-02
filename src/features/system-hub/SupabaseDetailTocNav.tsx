import { TocSectionNav } from "../overview/TocSectionNav";
import { SUPABASE_DETAIL_TOC } from "./supabase-detail-toc";

export function SupabaseDetailTocNav({
  idPrefix = "",
  scrollRootSelector,
}: {
  idPrefix?: string;
  scrollRootSelector?: string;
}) {
  return (
    <TocSectionNav
      items={SUPABASE_DETAIL_TOC}
      idPrefix={idPrefix}
      scrollRootSelector={scrollRootSelector}
    />
  );
}
