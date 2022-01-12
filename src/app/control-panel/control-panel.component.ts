import { Component, OnInit } from '@angular/core';
import { CounterColor } from '../models/counter-color';
import { GameCommand, GameCommandType } from '../models/game-command';
import { Player } from '../models/player';
import { TurnPhase } from '../models/TurnPhase';
import { CurrentGameService } from '../services/current-game.service';

@Component({
  selector: 'app-control-panel',
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.css']
})
export class ControlPanelComponent implements OnInit {
  canViewSavedCards: boolean = false;
  canRoll: boolean = false;
  canDraw: boolean = false;
  canEndTurn: boolean = false;

  constructor(public currentGameService: CurrentGameService) {
    currentGameService.command.subscribe(x => this.processCommand(x));
  }

  ngOnInit(): void {
  }

  processCommand(command: GameCommand) {
    if (!this.currentGameService.isOurTurn()) {
      return;
    }

    switch (command.type) {
      case GameCommandType.START_TURN:
      case GameCommandType.START_GAME:
        this.canRoll = true;
        let hasSaved = this.currentGameService.getCurrentPlayer().savedCards.length > 0;
        this.canViewSavedCards = hasSaved;
        break;
      case GameCommandType.ROLLING:
        this.canRoll = false;
        this.canViewSavedCards = false;
        break;
      case GameCommandType.ROLLED:
      case GameCommandType.MOVED:
        {
          let hasDeck = this.currentGameService.getCurrentPlayer().deck.length > 0;
          this.canDraw = hasDeck;
          this.canEndTurn = !hasDeck;
        }
        break;
      case GameCommandType.MOVING:
        this.canDraw = false;
        break;
      case GameCommandType.END_TURN:
        {
          this.canViewSavedCards = false;
          this.canRoll = false;
          this.canDraw = false;
          this.canEndTurn = false;
        }
        break;
    }
  }

  endTurn() {
    this.currentGameService.endTurn();
  }

  roll() {
    this.currentGameService.roll();
  }

  viewSavedCards() {
    this.currentGameService.viewSavedCards();
  }

  drawCard() {
    this.currentGameService.drawCard();
  }

  getCounterPath(counterColor: CounterColor): string {
    if (counterColor == CounterColor.green) {
      return "/assets/green-counter.svg";
    } else {
      return "/assets/yellow-counter.svg";
    }
  }
}
