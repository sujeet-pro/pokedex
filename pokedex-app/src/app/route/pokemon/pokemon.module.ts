import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonComponent } from './pokemon.component';
import { NgMaterialModule } from 'src/app/shared/ng-material/ng-material.module';
import { RouterModule } from '@angular/router';
import { PipesModule } from 'src/app/shared/pipes/pipes.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';



@NgModule({
  declarations: [PokemonComponent],
  imports: [
    CommonModule,
    NgMaterialModule,
    RouterModule,
    PipesModule,
    ComponentsModule
  ]
})
export class PokemonModule { }
