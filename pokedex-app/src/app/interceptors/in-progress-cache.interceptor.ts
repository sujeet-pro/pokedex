import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, of, throwError, ReplaySubject } from 'rxjs';
import { catchError, switchMap, tap, take, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InProgressCacheInterceptor implements HttpInterceptor {
  private apisInProgress: Map<string, ReplaySubject<HttpResponse<any>>> = new Map();

  constructor() { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method !== 'GET' || !req.url.startsWith(environment.pokemonApiSlug)) {
      return next.handle(req);
    }
    if (this.apisInProgress.has(req.url)) {
      return this.apisInProgress.get(req.url).asObservable().pipe(
        take(1),
        switchMap(res => of(new HttpResponse({ status: 200, body: res }))),
      );
    } else {
      const futureResponse = new ReplaySubject<HttpResponse<any>>(1);
      this.apisInProgress.set(req.url, futureResponse);
    }
    console.log('progress interceptor', req.url);
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse && this.apisInProgress.has(req.url)) {
          const sub = this.apisInProgress.get(req.url);
          sub.next(event.clone());
          sub.complete();
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error instanceof HttpResponse && this.apisInProgress.has(req.url)) {
          this.apisInProgress.get(req.url).error(error.clone());
        }
        return throwError(error);
      }),
      finalize(() => {
        this.apisInProgress.delete(req.url);
      })
    );
  }
}
