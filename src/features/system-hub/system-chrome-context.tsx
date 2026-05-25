import { createContext, useContext, type ReactNode } from "react";

export type SystemChromeContextValue = {
  stackChrome: boolean;
  registerFilter: (node: ReactNode | null) => void;
};

export const SystemChromeContext = createContext<SystemChromeContextValue | null>(null);

export function useSystemChrome() {
  return useContext(SystemChromeContext);
}
