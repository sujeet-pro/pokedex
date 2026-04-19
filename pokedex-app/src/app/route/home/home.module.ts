import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { NgMaterialModule } from 'src/app/shared/ng-material/ng-material.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PipesModule } from 'src/app/shared/pipes/pipes.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';



@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgMaterialModule,
    RouterModule,
    PipesModule,
    ComponentsModule
  ]
})
export class HomeModule { }
