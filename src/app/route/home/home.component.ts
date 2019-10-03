import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { map, startWith, debounceTime } from 'rxjs/operators';
import { PokemonService, ListType } from 'src/app/services/pokemon.service';
import { MatAutocompleteSelectedEvent } from '@angular/material';
import { Router } from '@angular/router';
import { IPokemon } from 'src/app/models/pokemon';

interface IPokemonAutocomplete {
  name: string;
  id: string;
}

@Component({
  selector: 'pokedex-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly searchPrefix = 'search::';
  pokemonQueryControl = new FormControl('');
  allPokemon: IPokemonAutocomplete[] = [];
  private pokemonListSubscribe: Subscription | null = null;
  filteredPokemon: Observable<IPokemonAutocomplete[]>;

  // Featured Pokemon
  featuredPokemon: any = null;
  images: string[] = [];
  activeImage = '';
  constructor(
    private pokemonSvc: PokemonService,
    private router: Router
  ) { }

  ngOnInit() {
    this.pokemonSvc.getAllList(ListType.POKEMON).subscribe(listResponse => {
      this.allPokemon = listResponse.results.map((list) => ({
        id: list.name,
        name: list.name.toLowerCase().replace(/[_-]/, ' ')
      }));
      this.setFeaturedPokemonOfTheDay();
      this.filteredPokemon = this.pokemonQueryControl.valueChanges.pipe(
        startWith(this.pokemonQueryControl.value || ''),
        debounceTime(150),
        map(query => query.toLowerCase()),
        map(query => query ?
          this.allPokemon.filter(pokemon => pokemon.name.includes(query)) :
          this.allPokemon
        )
      );
    });

  }

  ngOnDestroy() {
    if (this.pokemonListSubscribe) {
      this.pokemonListSubscribe.unsubscribe();
    }
  }

  onPokemonSelection(event: MatAutocompleteSelectedEvent) {
    const query: string = event.option.value;
    if (query.startsWith(this.searchPrefix)) {
      this.router.navigateByUrl(`/search?q=${query.substring(this.searchPrefix.length)}`);
    } else {
      this.router.navigateByUrl(`/pokemon/${event.option.value}`);
    }
  }

  setFeaturedPokemonOfTheDay() {
    const today = new Date();
    const todaysIndex = (today.getDate() * 100 + today.getMonth()) % this.allPokemon.length;
    this.pokemonSvc.getDetails<IPokemon>(ListType.POKEMON, this.allPokemon[todaysIndex].id).subscribe(pokemon => {
      this.featuredPokemon = pokemon;
      this.images = Object.values(pokemon.sprites).filter(Boolean);
      this.activeImage = this.images[0];

    });
  }
}
