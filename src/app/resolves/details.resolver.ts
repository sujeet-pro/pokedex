import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PokemonService } from '../services/pokemon.service';
import { IResolveResponseAny } from '../models/resolveResponse';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DetailsResolver implements Resolve<IResolveResponseAny> {
  constructor(
    private pokemonSvc: PokemonService
  ) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): IResolveResponseAny | Observable<IResolveResponseAny> | Promise<IResolveResponseAny> {
    if (route.data.type && route.data.routeKey && route.paramMap.get(route.data.routeKey)) {
      return this.pokemonSvc.getDetails<any>(route.data.type, route.paramMap.get(route.data.routeKey))
        .pipe(
          map(data => ({ data, error: null })),
          catchError((error) => of({ data: null, error })),
          tap(console.log)
        );
    }
    return {
      data: null,
      error: 'Invalid Routing Configuration: Invalid type or RouteKey.'
    };
  }




}
