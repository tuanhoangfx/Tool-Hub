import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SystemTab } from "./components/SystemTabs";

type Registry = Partial<Record<SystemTab, ReactNode>>;

type SystemFilterRegistryValue = {
  register: (tabId: SystemTab, node: ReactNode | null) => void;
  get: (tabId: SystemTab) => ReactNode | null;
};

const SystemFilterRegistryContext = createContext<SystemFilterRegistryValue | null>(null);

export function SystemFilterRegistryProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef<Registry>({});
  const [, bump] = useState(0);

  const register = useCallback((tabId: SystemTab, node: ReactNode | null) => {
    const prev = registryRef.current[tabId];
    if (prev === node) return;
    if (node == null) delete registryRef.current[tabId];
    else registryRef.current[tabId] = node;
    bump((n) => n + 1);
  }, []);

  const get = useCallback((tabId: SystemTab) => registryRef.current[tabId] ?? null, []);

  return (
    <SystemFilterRegistryContext.Provider value={{ register, get }}>
      {children}
    </SystemFilterRegistryContext.Provider>
  );
}

export function useSystemFilterRegistry() {
  const ctx = useContext(SystemFilterRegistryContext);
  if (!ctx) throw new Error("useSystemFilterRegistry must be used within SystemFilterRegistryProvider");
  return ctx;
}

/** Renders the active tab filter in `HubTabChrome` filterBar slot (non-stacked — Hub parity). */
export function SystemFilterBarOutlet({ tabId }: { tabId: SystemTab }) {
  const { get } = useSystemFilterRegistry();
  return get(tabId);
}

/** Register / clear inline filter for a System sub-tab. */
export function useRegisterSystemTabFilter(
  tabId: SystemTab,
  filterBar: ReactNode | null,
  opts: { enabled: boolean; stacked: boolean; isActiveTab: boolean },
) {
  const { register } = useSystemFilterRegistry();

  useLayoutEffect(() => {
    if (!opts.enabled || !filterBar || opts.stacked || !opts.isActiveTab) {
      register(tabId, null);
      return () => register(tabId, null);
    }
    register(tabId, filterBar);
    return () => register(tabId, null);
  }, [tabId, filterBar, opts.enabled, opts.stacked, opts.isActiveTab, register]);
}
