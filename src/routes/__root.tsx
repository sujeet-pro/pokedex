/// <reference types="vite/client" />
import type { ReactNode } from "react";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

import resetCss from "~/styles/reset.css?url";
import consoleCss from "~/styles/console.css?url";
import globalCss from "~/styles/global.css?url";
import layoutCss from "~/styles/layout.css?url";

type RouterContext = { queryClient: QueryClient };

const BOOT_PREFS_SCRIPT = `(function(){try{var r=document.documentElement;var p=JSON.parse(localStorage.getItem('pokedex.prefs')||'{}');if(p.theme)r.dataset.theme=p.theme;if(p.mode)r.dataset.mode=p.mode;if(p.scale)r.dataset.scale=p.scale;if(p.dir)r.dir=p.dir;}catch(e){}})();`;

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Pokédex" },
      { name: "description", content: "A retro handheld-console Pokédex powered by PokéAPI." },
      { name: "color-scheme", content: "dark light" },
      { name: "theme-color", content: "#bb2a2a" },
    ],
    links: [
      { rel: "stylesheet", href: resetCss },
      { rel: "stylesheet", href: consoleCss },
      { rel: "stylesheet", href: globalCss },
      { rel: "stylesheet", href: layoutCss },
      { rel: "icon", type: "image/svg+xml", href: `${import.meta.env.BASE_URL}favicon.svg` },
    ],
    scripts: [{ children: BOOT_PREFS_SCRIPT }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="red" data-mode="dark" data-scale="md" dir="ltr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
