import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { IPokemon } from 'src/app/models/pokemon';
import { IChips } from 'src/app/models/chips.model';

const SWIPE_DIR = {
  NEXT: 'swipeleft',
  PREV: 'swiperight'
};

@Component({
  selector: 'pokedex-pokemon-card',
  templateUrl: './pokemon-card.component.html',
  styleUrls: ['./pokemon-card.component.scss']
})
export class PokemonCardComponent implements OnInit, OnChanges {
  @Input() pokemon: IPokemon | null;
  @Input() allowNav = false;
  chipsTypes: IChips[] = [];
  images: string[] = [];
  activeImage = '';
  height = '';

  constructor() { }

  ngOnInit() {
  }
  ngOnChanges(changes: SimpleChanges) {
    if ('pokemon' in changes) {
      this.update();
    }
  }

  private update() {
    if (this.pokemon && this.pokemon.sprites) {
      const heightInches = this.pokemon.height * 3.937;
      const foot = Math.floor(heightInches / 12);
      const inch = Math.round(heightInches % 12 * 10 / 10);
      this.height = `${foot}' ${inch}"`;
      this.images = Object.values(this.pokemon.sprites).filter(Boolean);
      this.activeImage = this.images.length ? this.images[0] : '/assets/unknown.png';
      this.chipsTypes = this.pokemon.types.map(type => type.type);
    } else {
      this.images = [];
      this.chipsTypes = [];
      this.height = '';
      this.activeImage = '/assets/unknown.png';
    }
  }

  swipeImage(dir) {
    const currentIdx = this.images.indexOf(this.activeImage);
    if (currentIdx === -1) {
      return;
    }
    switch (dir) {
      case SWIPE_DIR.NEXT:
        if (currentIdx === this.images.length - 1) {
          this.activeImage = this.images[0];
        } else {
          this.activeImage = this.images[currentIdx + 1];
        }
        break;
      case SWIPE_DIR.PREV:
        if (currentIdx === 0) {
          this.activeImage = this.images[this.images.length - 1];
        } else {
          this.activeImage = this.images[currentIdx - 1];
        }
      default:
        break;
    }
  }

}
