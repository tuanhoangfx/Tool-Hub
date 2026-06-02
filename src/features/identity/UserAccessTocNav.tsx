import { TocSectionNav } from "../overview/TocSectionNav";
import { USER_ACCESS_TOC } from "./user-access-toc";

export function UserAccessTocNav({
  idPrefix = "",
  scrollRootSelector,
}: {
  idPrefix?: string;
  scrollRootSelector?: string;
}) {
  return (
    <TocSectionNav
      items={USER_ACCESS_TOC}
      idPrefix={idPrefix}
      scrollRootSelector={scrollRootSelector}
    />
  );
}
