import type { ReactNode } from "react";

type Props = {
  title: string;
  lede?: string;
  count?: number;
  children: ReactNode;
  actions?: ReactNode;
};

export function CatalogShell({ title, lede, count, children, actions }: Props) {
  return (
    <div>
      <header className="hero-head">
        <h1 className="page-title">{title}</h1>
        {lede ? <p className="page-lede">{lede}</p> : null}
        {actions ? <div className="hud-actions">{actions}</div> : null}
      </header>
      <div className="catalog-head">
        <h2>
          <span>{title}</span>
        </h2>
        {count != null ? (
          <span className="catalog-head__count">{count} entries</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
