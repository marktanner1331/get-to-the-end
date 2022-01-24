import { Component, HostBinding, OnInit } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { CardType, Deck } from '../models/deck';
import { GameCommand, GameCommandType } from '../models/game-command';
import { CurrentGameService } from '../services/current-game.service';

@Component({
  selector: 'app-card-viewer',
  templateUrl: './card-viewer.component.html',
  styleUrls: ['./card-viewer.component.css']
})
export class CardViewerComponent implements OnInit {
  cardType?: CardType;
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
        if (this.currentGameService.isOurTurn()) {
          this.viewCard(command.data);
          this.ourCard = true;
        }
        break;
      case GameCommandType.SHOW_CARD:
        if (!this.currentGameService.isOurTurn()) {
          this.currentGameService.showingDrawnCardAck();
          this.viewCard(command.data);
          this.ourCard = false;
        }
        break;
    }
  }

  viewCard(cardType: CardType) {
    this.cardType = cardType;

    let card = Deck.getCard(cardType);
    this.title = card.title;
    this.description = card.description;

    this.display = true;
  }

  ngOnInit(): void {
  }

  close() {
    this.cardType = undefined;
    this.title = "";
    this.description = "";
    this.display = false;
  }

  useNow() {
    this.close();
    this.currentGameService.useDrawnCard();
  }

  saveForLater() {
    let temp = this.cardType!;
    this.close();
    this.currentGameService.saveCard(temp);
  }

  ok() {
    this.close();
    this.currentGameService.shownDrawnCardAck();
  }
}
