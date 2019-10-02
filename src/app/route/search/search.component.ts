import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { IListResponse } from 'src/app/models/listResponse';
import { NameAndUrl } from 'src/app/models/pokemon';
import { debounceTime, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { FormControl } from '@angular/forms';
const allSynonyms = new Set(environment.searchAllSynonyms);

@Component({
  selector: 'pokedex-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  searchQueryControl = new FormControl('');
  allPokemonList: IListResponse | null = null;
  filteredPokemon: NameAndUrl[] = [];
  showingCount = 0;
  resultIncrementBy = 10;

  private routeDataSubscription: Subscription | null = null;
  private queryChangeSubscription: Subscription | null = null;
  private searchSubscription: Subscription | null = null;
  constructor(
    private activateRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.routeDataSubscription = this.activateRoute.data.subscribe(data => {
      console.log(data);
      if (data.pokemonList && data.pokemonList.data) {
        this.allPokemonList = data.pokemonList.data;
      }
    });
    this.queryChangeSubscription = this.searchQueryControl.valueChanges.pipe(
      debounceTime(100),
    ).subscribe(query => {
      this.router.navigate([], { queryParams: { q: query } });
    });
    this.searchSubscription = this.activateRoute.queryParamMap
      .pipe(
        debounceTime(100),
        map(paramMap => (paramMap.get('q') || '').toLowerCase()),
        tap(console.log),
      ).subscribe(query => {
        if (this.allPokemonList && Array.isArray(this.allPokemonList.results)) {
          if (!query || allSynonyms.has(query)) {
            this.filteredPokemon = this.allPokemonList.results;
          } else {
            this.filteredPokemon = this.allPokemonList.results.filter(u => u.name.includes(query));
          }
        } else {
          this.filteredPokemon = [];
        }
        this.showingCount = this.filteredPokemon.length < this.resultIncrementBy ? this.filteredPokemon.length : this.resultIncrementBy;

      });

  }
  ngOnDestroy() {
    if (this.routeDataSubscription) {
      this.routeDataSubscription.unsubscribe();
    }
    if (this.queryChangeSubscription) {
      this.queryChangeSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

}
