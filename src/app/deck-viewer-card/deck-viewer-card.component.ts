import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CardType, Deck } from '../models/deck';

@Component({
  selector: 'app-deck-viewer-card',
  templateUrl: './deck-viewer-card.component.html',
  styleUrls: ['./deck-viewer-card.component.css']
})
export class DeckViewerCardComponent implements OnInit {
  cardType!: CardType;
  title: string = "";
  description: string = "";

  @Output() use: EventEmitter<CardType> = new EventEmitter();

  @Input() set card(value: CardType) {
    this.cardType = value;

    let card = Deck.getCard(value);
    this.title = card.title;
    this.description = card.description;
  }

  constructor() { }

  ngOnInit(): void {
  }

  useNow() {
    this.use.next(this.cardType);
  }
}
