import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { switchMap, tap, first } from "rxjs/operators";
import { IListResponse } from "../models/listResponse";
import { of, Observable, ReplaySubject, throwError } from "rxjs";
import { IPokemon } from "../models/pokemon";
export const ListType = {
  ABILITY: "ability",
  MOVE: "move",
  POKEMON: "pokemon",
  SPECIES: "pokemon-species",
  STATS: "stat",
  TYPE: "type"
};
const slug = environment.pokemonApiSlug;
const validApiTypes = new Set(environment.validApiTypes);
@Injectable({
  providedIn: "root"
})
export class PokemonService {
  private cache: Map<string, IListResponse> = new Map();
  private detailsCache: Map<string, Map<string, any>> = new Map();

  constructor(private http: HttpClient) {}

  getDetails<T>(type: string, id: string): Observable<T> {
    if (!validApiTypes.has(type)) {
      return throwError("Invalid type");
    }
    if (this.detailsCache.has(type)) {
      const typeDetailsMap = this.detailsCache.get(type);
      if (typeDetailsMap.has(id)) {
        return of<T>(typeDetailsMap.get(id));
      }
    } else {
      this.detailsCache.set(type, new Map());
    }

    return this.http.get<T>(`${slug}${type}/${id}`).pipe(
      tap(details => {
        this.cacheDetails<T>(type, id, details);
      })
    );
  }

  getAllList(type: string): Observable<IListResponse> {
    if (!validApiTypes.has(type)) {
      return throwError("Invalid type");
    }
    if (this.cache.has(type)) {
      return of(this.cache.get(type));
    }
    return this.http
      .get<IListResponse>(`${slug}${type}?limit=${environment.defaultListSize}`)
      .pipe(
        switchMap(listResponse => {
          if (listResponse.count > listResponse.results.length) {
            this.http.get<IListResponse>(
              `${slug}${type}?limit=${listResponse.count}`
            );
          }
          return of(listResponse);
        }),
        tap(listResponse => {
          // Cache the response for future use
          this.cacheList(type, listResponse);
        })
      );
  }
  // getImagePath(id: number) {
  //   // tslint:disable-next-line: max-line-length
  //   return `https://firebasestorage.googleapis.com/v0/b/pokemon-explorer-by-sujeet.appspot.com/o/pokemon%2F${id
  //     .toString()
  //     .padStart(3, "0")}.png?alt=media`;
  // }

  private cacheList(type: string, listResponse: IListResponse) {
    // Cache in the map, for same session usage
    this.cache.set(type, listResponse);
    // TODO: Add caching using indexDB to support persist data in browser and for offline
  }

  private cacheDetails<T>(type: string, id: string, response: T) {
    if (!this.detailsCache.has(type)) {
      this.detailsCache.set(type, new Map());
    }
    const typeDetailsMap = this.detailsCache.get(type);
    typeDetailsMap.set(id, response);
  }
}
