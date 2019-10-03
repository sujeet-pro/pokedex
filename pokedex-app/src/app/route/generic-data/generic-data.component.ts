import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { PokemonService } from 'src/app/services/pokemon.service';
import { environment } from 'src/environments/environment';
import { HttpErrorResponse } from '@angular/common/http';
const validApiTypes = new Set(environment.validApiTypes);
@Component({
  selector: 'pokedex-generic-data',
  templateUrl: './generic-data.component.html',
  styleUrls: ['./generic-data.component.scss']
})
export class GenericDataComponent implements OnInit, OnDestroy {
  details: any = null;
  type = '';
  id = '';
  error: any = null;
  private paramsSubscription: Subscription | null = null;
  constructor(
    private activatedRoute: ActivatedRoute,
    private pokemonSvc: PokemonService
  ) { }

  ngOnInit() {
    this.paramsSubscription = this.activatedRoute.paramMap.pipe(
      switchMap(
        paramsMap => {
          this.type = paramsMap.get('type');
          this.id = paramsMap.get('id');
          return this.pokemonSvc.getDetails(this.type, this.id);
        })
    ).subscribe((details) => {
      this.details = details;
      this.error = null;
    }, err => {
      this.details = null;
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.error = `Invalid id: ${this.id} for the give ${this.type}`;
      } else {
        this.error = err;
      }
    });
  }

  ngOnDestroy() {
    if (this.paramsSubscription) {
      this.paramsSubscription.unsubscribe();
    }
  }

  back() {
    history.back();
  }

}
