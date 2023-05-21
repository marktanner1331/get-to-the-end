import { Component, HostBinding, OnInit } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { Card, CardType, Deck } from '../models/deck';
import { GameCommand, GameCommandType } from '../models/game-command';
import { CurrentGameService } from '../services/current-game.service';

@Component({
  selector: 'app-card-viewer',
  templateUrl: './card-viewer.component.html',
  styleUrls: ['./card-viewer.component.css']
})
export class CardViewerComponent implements OnInit {
  card?: Card;
  title: string = "";
  description: string = "";

  display: boolean = false;

  ourCard: boolean = false;

  constructor(private currentGameService: CurrentGameService) {
    currentGameService.postProcess.push(x => this.processCommand(x));
  }

  processCommand(command: GameCommand) {
    switch (command.type) {
      case GameCommandType.CARD_DRAWN:
        if (this.currentGameService.IsOurTurn()) {
          this.viewCard(command.data);
          this.ourCard = true;
        }
        break;
      case GameCommandType.SHOW_CARD:
        if (!this.currentGameService.IsOurTurn()) {
          this.currentGameService.showingDrawnCardAck();
          this.viewCard(command.data);
          this.ourCard = false;
        }
        break;
    }
  }

  viewCard(card: Card) {
    this.card = card;

    this.title = card.title;
    this.description = card.description;

    this.display = true;
  }

  ngOnInit(): void {
  }

  close() {
    this.card = undefined;
    this.title = "";
    this.description = "";
    this.display = false;
  }

  useNow() {
    this.close();
    this.currentGameService.useDrawnCard();
  }

  saveForLater() {
    let temp = this.card!;
    this.close();
    this.currentGameService.saveDrawnCard();
  }

  ok() {
    this.close();
    this.currentGameService.shownDrawnCardAck();
  }
}
