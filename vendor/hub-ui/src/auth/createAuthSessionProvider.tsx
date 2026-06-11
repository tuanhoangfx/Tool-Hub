import { createContext, useContext, type Context, type ReactNode } from "react";

export type AuthSessionProviderBundle<TState> = {
  AuthSessionProvider: ({ children }: { children: ReactNode }) => ReactNode;
  useAuth: () => TState;
  Context: Context<TState | null>;
};

/** Factory — one Provider + hook per workspace tool (P0016 useHubAuth, P0020 useNotesAuth, …). */
export function createAuthSessionProvider<TState>(
  useAuthState: () => TState,
  hookName: string,
): AuthSessionProviderBundle<TState> {
  const Context = createContext<TState | null>(null);
  Context.displayName = `${hookName}Context`;

  function AuthSessionProvider({ children }: { children: ReactNode }) {
    const value = useAuthState();
    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useAuth(): TState {
    const ctx = useContext(Context);
    if (!ctx) {
      throw new Error(`${hookName} must be used within AuthSessionProvider`);
    }
    return ctx;
  }

  return { AuthSessionProvider, useAuth, Context };
}
