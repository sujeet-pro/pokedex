import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { HomePage } from "~/pages/Home";
import { SearchPage } from "~/pages/Search";
import { PokemonDetailPage } from "~/pages/PokemonDetail";
import { TypeDetailPage } from "~/pages/TypeDetail";
import { AbilityDetailPage } from "~/pages/AbilityDetail";
import { SpeciesDetailPage } from "~/pages/SpeciesDetail";
import { FormDetailPage } from "~/pages/FormDetail";
import { NotFoundPage } from "~/pages/NotFound";

export const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
  notFoundComponent: NotFoundPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

type SearchParams = { q?: string };

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
});

const pokemonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pokemon/$name",
  component: PokemonDetailPage,
});

const typeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/type/$id",
  component: TypeDetailPage,
});

const abilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ability/$id",
  component: AbilityDetailPage,
});

const speciesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pokemon-species/$id",
  component: SpeciesDetailPage,
});

const formRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pokemon-form/$id",
  component: FormDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  searchRoute,
  pokemonRoute,
  typeRoute,
  abilityRoute,
  speciesRoute,
  formRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { indexRoute, searchRoute, pokemonRoute, typeRoute, abilityRoute, speciesRoute, formRoute };
