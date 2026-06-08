import uiScreensCatalog from "../../../public/workspace-snapshots/schemas/ui-screens.catalog.json";

export type P0004CatalogScreen = {
  screen: string;
  template: string;
  golden: string;
  goldenScreenPath?: string;
  goldenTablePath?: string;
  goldenCardPath?: string;
  notes?: string;
};

const P0004_DEFAULTS = (uiScreensCatalog as { defaults: { P0004: P0004CatalogScreen[] } }).defaults.P0004;

/** P0004 ui-screens.catalog defaults keyed by screen id. */
export function p0004CatalogByScreen(): Map<string, P0004CatalogScreen> {
  return new Map(P0004_DEFAULTS.map((row) => [row.screen, row]));
}

export function catalogGoldenRef(screen: string): string | undefined {
  return p0004CatalogByScreen().get(screen)?.golden;
}

export function catalogTemplate(screen: string): string | undefined {
  return p0004CatalogByScreen().get(screen)?.template;
}
