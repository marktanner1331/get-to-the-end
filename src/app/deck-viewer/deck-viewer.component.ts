import { Component, OnInit } from '@angular/core';
import { CardType, Deck } from '../models/deck';
import { CurrentGameService } from '../services/current-game.service';
import { DeckViewerService } from './deck-viewer.service';

@Component({
  selector: 'app-deck-viewer',
  templateUrl: './deck-viewer.component.html',
  styleUrls: ['./deck-viewer.component.css']
})
export class DeckViewerComponent implements OnInit {
  display: boolean = false;
  deck?: Deck;

  constructor(private currentGameService: CurrentGameService, deckViewerService: DeckViewerService) {
    deckViewerService.deckViewerComponent = this;
  }

  ngOnInit(): void {
    
  }

  useCard(card: CardType) {
    this.display = false;
    this.currentGameService.useSavedCard(card);
  }

  show(deck: Deck) {
    this.deck = deck;
    this.display = true;
  }

  close() {
    this.deck = undefined;
    this.display = false;
  }
}
