import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { NgMaterialModule } from './shared/ng-material/ng-material.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { InitService } from './services/init.service';
import { IndexDbCacheInterceptor } from './interceptors/index-db-cache.interceptor';
import { InProgressCacheInterceptor } from './interceptors/in-progress-cache.interceptor';
import { GenericDataComponent } from './route/generic-data/generic-data.component';
import { NgxJsonViewerModule } from 'ngx-json-viewer';


@NgModule({
  declarations: [
    AppComponent,
    NavBarComponent,
    GenericDataComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgMaterialModule,
    NgxJsonViewerModule
  ],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: (initSvc: InitService) => () => initSvc.init(),
    deps: [InitService],
    multi: true,
  }, {
    provide: HTTP_INTERCEPTORS,
    useClass: IndexDbCacheInterceptor,
    multi: true
  }, {
    provide: HTTP_INTERCEPTORS,
    useClass: InProgressCacheInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
