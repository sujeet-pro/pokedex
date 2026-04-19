import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from './search.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgMaterialModule } from 'src/app/shared/ng-material/ng-material.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';



@NgModule({
  declarations: [SearchComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgMaterialModule,
    ComponentsModule
  ]
})
export class SearchModule { }
