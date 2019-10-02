import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiToAppUrlPipe } from './api-to-app-url.pipe';



@NgModule({
  declarations: [ApiToAppUrlPipe],
  imports: [
    CommonModule
  ],
  exports: [ApiToAppUrlPipe]
})
export class PipesModule { }
