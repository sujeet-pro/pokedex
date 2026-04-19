import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatButtonModule,
  MatIconModule,
  MatMenuModule,
  MatToolbarModule,
  MatFormFieldModule,
  MatListModule,
  MatInputModule,
  MatAutocompleteModule,
  MatCardModule,
  MatProgressBarModule,
  MatChipsModule,
  MatSidenavModule,
  MatTableModule,
  MatTooltipModule
} from '@angular/material';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    // MatButtonModule,
    // MatIconModule,
    // MatMenuModule,
    // MatToolbarModule,
    // MatAutocompleteModule,
    // MatFormFieldModule,
    // MatListModule,
    // MatInputModule,
    // MatCardModule,
    // MatListModule,
    // MatProgressBarModule,
    // MatChipsModule
  ],
  exports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatListModule,
    MatInputModule,
    MatCardModule,
    MatListModule,
    MatProgressBarModule,
    MatChipsModule,
    MatSidenavModule,
    MatTableModule,
    MatTooltipModule,
  ]
})
export class NgMaterialModule { }
