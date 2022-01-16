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

  constructor(private currentGameService: CurrentGameService) {
    currentGameService.postProcess.push(x => this.processCommand(x));
    //currentGameService.command.subscribe(x => this.processCommand(x));
  }

  processCommand(command: GameCommand) {
    switch(command.type) {
      case GameCommandType.CARD_DRAWN:
        if(this.currentGameService.isOurTurn()) {
          this.viewCard(command.data);
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
    this.currentGameService.useDrawnCard();
    this.close();
  }

  saveForLater() {
    this.currentGameService.saveCard(this.cardType!);
    this.close();
  }
}
