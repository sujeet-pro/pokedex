import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { IChips } from 'src/app/models/chips.model';

@Component({
  selector: 'pokedex-chips',
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss']
})
export class ChipsComponent implements OnInit, OnChanges {
  @Input() chips: IChips[];
  @Input() defaultCount = 5;
  renderedChips: IChips[] = [];
  showingAll = false;
  showAllRequired = false;
  constructor() { }

  ngOnInit() {

  }
  ngOnChanges() {
    if (this.chips) {
      if (this.chips.length > this.defaultCount) {
        this.showAllRequired = true;
      }
      this.updateChips();
    }
  }

  toggleAll() {
    this.showingAll = !this.showingAll;
    this.updateChips();
  }

  private updateChips() {
    if (this.showingAll) {
      this.renderedChips = this.chips;
    } else {
      this.renderedChips = this.chips.slice(0, this.defaultCount || this.chips.length);
    }
  }

}
