import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card, CardType, Deck, DeckType } from '../models/deck';

@Component({
  selector: 'app-deck-viewer-card',
  templateUrl: './deck-viewer-card.component.html',
  styleUrls: ['./deck-viewer-card.component.css']
})
export class DeckViewerCardComponent implements OnInit {
  _card!: Card;
  title: string = "";
  description: string = "";

  showUseButton: boolean = false;

  @Output() use: EventEmitter<Card> = new EventEmitter();

  @Input() set card(value: Card) {
    this._card = value;

    this.title = value.title;
    this.description = value.description;
  }

  @Input() set type(value: DeckType) {
    switch(value) {
      case DeckType.saved:
        this.showUseButton = true;
        break;
      default:
        this.showUseButton = false;
        break;
    }
  }

  constructor() { }

  ngOnInit(): void {
  }

  useNow() {
    this.use.next(this._card);
  }
}
