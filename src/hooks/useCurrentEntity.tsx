import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Locale } from "~/types/locales";

/**
 * A per-page declaration of the currently displayed entity. Used by
 * LocaleSwitcher to produce the canonical URL in the target locale.
 */
export type CurrentEntity = {
  resource: string;                  // e.g. "pokemon", "type", "berry"
  slugs: Record<Locale, string>;     // locale → slug
};

const ctx = createContext<{
  entity: CurrentEntity | null;
  setEntity: (e: CurrentEntity | null) => void;
}>({ entity: null, setEntity: () => undefined });

type ProviderProps = {
  entity: CurrentEntity | null;
  setEntity: (e: CurrentEntity | null) => void;
  children: ReactNode;
};

export function CurrentEntityProvider({ entity, setEntity, children }: ProviderProps) {
  return (
    <ctx.Provider value={{ entity, setEntity }}>
      {children}
    </ctx.Provider>
  );
}

export function useCurrentEntity(): CurrentEntity | null {
  return useContext(ctx).entity;
}

/**
 * Effect helper: call from detail-page components to register the
 * displayed entity for the lifetime of the component.
 */
export function useRegisterEntity(entity: CurrentEntity | null): void {
  const { setEntity } = useContext(ctx);
  useEffect(() => {
    setEntity(entity);
    return () => setEntity(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity?.resource, entity?.slugs.en, entity?.slugs.fr]);
}
