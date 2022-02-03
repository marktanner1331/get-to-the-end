import { Component, OnInit } from '@angular/core';
import { Card, CardType, Deck, DeckType } from '../models/deck';
import { GameCommand, GameCommandType } from '../models/game-command';
import { CurrentGameService } from '../services/current-game.service';
@Component({
  selector: 'app-deck-viewer',
  templateUrl: './deck-viewer.component.html',
  styleUrls: ['./deck-viewer.component.css']
})
export class DeckViewerComponent implements OnInit {
  display: boolean = false;
  deck?: Deck;
  headerValue: string = "";

  constructor(private currentGameService: CurrentGameService) {
    currentGameService.postProcess.push((command) => this.processCommand(command));
  }

  ngOnInit(): void {

  }

  useCard(card: Card) {
    this.display = false;
    this.currentGameService.useSavedCard(card);
  }

  processCommand(command: GameCommand) {
    if (command.type == GameCommandType.VIEW_CARDS) {
      this.deck = command.data;
      console.log(DeckType[this.deck!.deckType]);
      
      switch (this.deck!.deckType) {
        case DeckType.active:
          this.headerValue = "Active Cards";
          break;
        case DeckType.saved:
          this.headerValue = "Saved Cards";
          break;
        case DeckType.used:
          this.headerValue = "Used Cards";
          break;
        case DeckType.unused:
          this.headerValue = "Unused Cards";
          break;
      }

      this.display = true;
    }
  }

  close() {
    this.deck = undefined;
    this.headerValue = "";
    this.display = false;
  }
}
