import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeModule } from './route/home/home.module';
import { HomeComponent } from './route/home/home.component';
import { PokemonModule } from './route/pokemon/pokemon.module';
import { SearchModule } from './route/search/search.module';
import { SearchComponent } from './route/search/search.component';
import { PokemonComponent } from './route/pokemon/pokemon.component';
import { ErrorModule } from './route/error/error.module';
import { ErrorComponent } from './route/error/error.component';
import { ListType } from './services/pokemon.service';
import { DetailsResolver } from './resolves/details.resolver';
import { ListResolver } from './resolves/list.resolver';
import { GenericDataComponent } from './route/generic-data/generic-data.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent
  },
  {
    path: 'search',
    component: SearchComponent,
    data: {
      type: ListType.POKEMON
    },
    resolve: {
      pokemonList: ListResolver
    }
  },
  {
    path: 'pokemon/:pokemonId',
    component: PokemonComponent,
    data: {
      type: ListType.POKEMON,
      routeKey: 'pokemonId'
    },
    resolve: {
      details: DetailsResolver
    }
    // }, {
    //   path: 'ability',
    //   loadChildren: () => import('./route/abilities/abilities.module').then(u => u.AbilitiesModule)
    // }, {
    //   path: 'moves',
    //   loadChildren: () => import('./route/moves/moves.module').then(m => m.MovesModule)
    // }, {
    //   path: 'type',
    //   loadChildren: () => import('./route/types/types.module').then(m => m.TypesModule)
    // }, {
    //   path: 'stats',
    //   loadChildren: () => import('./route/stats/stats.module').then(m => m.StatsModule)
    // }, {
    //   path: 'species',
    //   loadChildren: () => import('./route/species/species.module').then(m => m.SpeciesModule)
  },
  {
    path: ':type/:id',
    component: GenericDataComponent
  },
  {
    path: '**',
    component: ErrorComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top',
      urlUpdateStrategy: 'eager'
    }),
    HomeModule,
    SearchModule,
    PokemonModule,
    ErrorModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
