import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import * as localForage from 'localforage';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IndexDbCacheInterceptor implements HttpInterceptor {

  constructor() { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method !== 'GET' || !req.url.startsWith(environment.pokemonApiSlug)) {
      return next.handle(req);
    }
    return from(localForage.getItem<HttpEvent<any>>(req.url)).pipe(
      switchMap(res => {
        if (res) {
          return of(new HttpResponse({ status: 200, body: res }));
        } else {
          return throwError('Not Cached');
        }
      }),
      catchError(() => {
        return next.handle(req).pipe(
          tap(event => {
            if (event instanceof HttpResponse) {
              localForage.setItem(req.url, event.body);
            }
          })
        );
      }),
    );
  }
}
