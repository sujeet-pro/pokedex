import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { HomePage } from "~/pages/Home";
import { PokemonListPage } from "~/pages/PokemonList";
import { SearchPage } from "~/pages/Search";
import { PokemonDetailPage } from "~/pages/PokemonDetail";
import { TypeDetailPage } from "~/pages/TypeDetail";
import { AbilityDetailPage } from "~/pages/AbilityDetail";
import { SpeciesDetailPage } from "~/pages/SpeciesDetail";
import { FormDetailPage } from "~/pages/FormDetail";
import { BerryDetailPage } from "~/pages/BerryDetail";
import { BerryListPage } from "~/pages/BerryList";
import { ItemDetailPage } from "~/pages/ItemDetail";
import { ItemListPage } from "~/pages/ItemList";
import { LocationListPage } from "~/pages/LocationList";
import { MoveDetailPage } from "~/pages/MoveDetail";
import { MoveListPage } from "~/pages/MoveList";
import { GenerationListPage } from "~/pages/GenerationList";
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

type SearchParams = { q?: string; kind?: string };

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
    kind: typeof search.kind === "string" ? search.kind : undefined,
  }),
});

const pokemonListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pokemon",
  component: PokemonListPage,
});

const pokemonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pokemon/$name",
  component: PokemonDetailPage,
});

const typeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/type/$name",
  component: TypeDetailPage,
});

const abilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ability/$name",
  component: AbilityDetailPage,
});

const speciesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pokemon-species/$name",
  component: SpeciesDetailPage,
});

const formRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pokemon-form/$name",
  component: FormDetailPage,
});

const berryListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/berries",
  component: BerryListPage,
});

const berryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/berry/$name",
  component: BerryDetailPage,
});

const itemListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items",
  component: ItemListPage,
});

const itemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/item/$name",
  component: ItemDetailPage,
});

const locationListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/locations",
  component: LocationListPage,
});

const moveListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/moves",
  component: MoveListPage,
});

const moveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/move/$name",
  component: MoveDetailPage,
});

const generationListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/generations",
  component: GenerationListPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  searchRoute,
  pokemonListRoute,
  pokemonRoute,
  typeRoute,
  abilityRoute,
  speciesRoute,
  formRoute,
  berryListRoute,
  berryRoute,
  itemListRoute,
  itemRoute,
  locationListRoute,
  moveListRoute,
  moveRoute,
  generationListRoute,
]);

const basepath = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export const router = createRouter({
  routeTree,
  basepath,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export {
  indexRoute,
  searchRoute,
  pokemonListRoute,
  pokemonRoute,
  typeRoute,
  abilityRoute,
  speciesRoute,
  formRoute,
  berryListRoute,
  berryRoute,
  itemListRoute,
  itemRoute,
  locationListRoute,
  moveListRoute,
  moveRoute,
  generationListRoute,
};
