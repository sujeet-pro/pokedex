import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IPokemon, Move, NameAndUrl, Stat } from 'src/app/models/pokemon';
import { IChips } from 'src/app/models/chips.model';

@Component({
  selector: 'pokedex-pokemon',
  templateUrl: './pokemon.component.html',
  styleUrls: ['./pokemon.component.scss']
})
export class PokemonComponent implements OnInit {
  // details: IPokemon | null;
  error: any;
  pokemon: IPokemon | null = null;
  // Images
  images: string[] = [];
  activeImage = '';
  // Chips
  chipsMove: IChips[] = [];
  chipsForm: IChips[] = [];
  chipsAbilities: IChips[] = [];
  chipsItemHeld: IChips[] = [];
  chipsTypes: IChips[] = [];
  chipsGameIndices: IChips[] = [];
  // moves
  allMoves: Move[] = [];
  activeMoveDetails: Move | null = null;
  activeMoveSlideStatus = true;
  activeMoveCols = ['level_learned_at', 'move_learn_method', 'version_group'];

  // stats
  stats: Stat[] = [];

  constructor(private activateRoute: ActivatedRoute) { }

  ngOnInit() {
    this.activateRoute.data.subscribe(data => {
      console.log('pokemon resolver data', data)
      this.resetValues();
      if (data.details && data.details.data) {
        this.processPokemonDetails(data.details.data as IPokemon);
      } else if (data.details && data.details.error) {
        this.error = data.details.error;
      }
    });
  }

  private processPokemonDetails(pokemon: IPokemon) {
    this.error = null;

    // Images
    this.images = Object.values(pokemon.sprites).filter(Boolean);
    this.activeImage = this.images.length ? this.images[0] : null;
    // Chips
    this.chipsMove = pokemon.moves.map(move => move.move);
    this.chipsForm = pokemon.forms;
    this.chipsAbilities = pokemon.abilities.map((ability): IChips => ({
      icon: ability.is_hidden ? 'visibility_off' : 'visibility',
      name: ability.ability.name,
      url: ability.ability.url
    }));
    this.chipsItemHeld = pokemon.held_items.map(item => item.item);
    this.chipsTypes = pokemon.types.map(type => type.type);
    this.chipsGameIndices = pokemon.game_indices.map(gi => ({
      name: `${gi.game_index} : ${gi.version.name}`,
      url: gi.version.url
    }));
    // moves
    this.allMoves = pokemon.moves || [];
    this.activeMoveDetails = this.allMoves.length ? this.allMoves[0] : null;
    this.activeMoveSlideStatus = true;
    // Stats
    this.pokemon = pokemon;

  }
  private resetValues() {
    this.error = null;
    this.pokemon = null;
    // Images
    this.images = [];
    this.activeImage = '';
    // Chips
    this.chipsMove = [];
    this.chipsForm = [];
    this.chipsAbilities = [];
    this.chipsItemHeld = [];
    this.chipsTypes = [];
    this.chipsGameIndices = [];
    // moves
    this.allMoves = [];
    this.activeMoveDetails = null;
    this.activeMoveSlideStatus = true;
    // Stats
    this.stats = [];
  }

}
