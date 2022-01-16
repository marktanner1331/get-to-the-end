import { Component, OnInit } from '@angular/core';
import { CardType, Deck } from '../models/deck';
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

  constructor(private currentGameService: CurrentGameService) {
    currentGameService.postProcess.push((command) => this.processCommand(command));
  }

  ngOnInit(): void {
    
  }

  useCard(card: CardType) {
    this.display = false;
    this.currentGameService.useSavedCard(card);
  }

  processCommand(command: GameCommand) {
    if(command.type == GameCommandType.VIEW_CARDS) {
      this.deck = command.data;
      this.display = true;
    }
  }

  close() {
    this.deck = undefined;
    this.display = false;
  }
}
