import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PokemonService } from '../services/pokemon.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IListResponse } from '../models/listResponse';
import { IResolveResponse } from '../models/resolveResponse';

export type IListResponseResolve = IResolveResponse<IListResponse>;

@Injectable({
  providedIn: 'root'
})
export class ListResolver implements Resolve<IListResponseResolve> {
  constructor(
    private pokemonSvc: PokemonService
  ) { }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): IListResponseResolve | Observable<IListResponseResolve> | Promise<IListResponseResolve> {
    if (route.data.type) {
      return this.pokemonSvc.getAllList(route.data.type)
        .pipe(
          map(data => ({ data, error: null })),
          catchError((error) => of({ data: null, error }))
        );
    }
    return {
      data: null,
      error: 'Invalid Route Configuration: invalid type'
    };
  }




}
