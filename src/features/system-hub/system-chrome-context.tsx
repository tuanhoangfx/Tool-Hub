import { createContext, useContext, type RefObject } from "react";

export type SystemChromeContextValue = {
  stackChrome: boolean;
  filterAnchorRef: RefObject<HTMLDivElement | null>;
  filterAnchorReady: boolean;
};

export const SystemChromeContext = createContext<SystemChromeContextValue | null>(null);

export function useSystemChrome() {
  return useContext(SystemChromeContext);
}
