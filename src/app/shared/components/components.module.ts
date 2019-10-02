import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChipsComponent } from './chips/chips.component';
import { PipesModule } from '../pipes/pipes.module';
import { NgMaterialModule } from '../ng-material/ng-material.module';
import { RouterModule } from '@angular/router';
import { PokemonCardComponent } from './pokemon-card/pokemon-card.component';
import { PokemonCardIdComponent } from './pokemon-card-id/pokemon-card-id.component';



@NgModule({
  declarations: [ChipsComponent, PokemonCardComponent, PokemonCardIdComponent],
  imports: [
    CommonModule,
    PipesModule,
    NgMaterialModule,
    RouterModule
  ],
  exports: [ChipsComponent, PokemonCardComponent, PokemonCardIdComponent]
})
export class ComponentsModule { }
