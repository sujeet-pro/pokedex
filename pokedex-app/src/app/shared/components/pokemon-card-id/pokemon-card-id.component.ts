import { Component, OnInit, Input } from '@angular/core';
import { PokemonService, ListType } from 'src/app/services/pokemon.service';
import { IPokemon } from 'src/app/models/pokemon';

@Component({
  selector: 'pokedex-pokemon-card-id',
  templateUrl: './pokemon-card-id.component.html',
  styleUrls: ['./pokemon-card-id.component.scss']
})
export class PokemonCardIdComponent implements OnInit {
  @Input() pokemonId: string | null = null;
  pokemon: IPokemon | null = null;
  error: any = null;
  constructor(
    private pokemonSvc: PokemonService
  ) { }

  ngOnInit() {
    if (this.pokemonId) {
      this.pokemonSvc.getDetails<IPokemon>(ListType.POKEMON, this.pokemonId)
        .subscribe(pokemon => {
          this.pokemon = pokemon;
        }, err => {
          this.error = err;
        });
    }
  }

}
