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
  numActiveCards: number = 0;

  constructor(public currentGameService: CurrentGameService) {
    currentGameService.idle.subscribe(() => this.refresh());
    //currentGameService.command.subscribe(x => this.processCommand(x));
  }

  ngOnInit(): void {
  }

  refresh() {
    this.canRoll = false;
    this.canDraw = false;
    this.canViewSavedCards = false;
    this.canEndTurn = false;

    //start off by disabling this button
    //in case it's not our turn
    this.numActiveCards = 0;
    
    if (!this.currentGameService.isOurTurn()) {
      return;
    }

    let player: Player = this.currentGameService.getCurrentPlayer();
    this.numActiveCards = player.activeCards.length;

    let phase = this.currentGameService.currentGame.currentPhase;
    if(phase == TurnPhase.preroll) {
      this.canRoll = true;
      let hasSaved = this.currentGameService.getCurrentPlayer().savedCards.length > 0;
      this.canViewSavedCards = hasSaved;
    } else if(phase == TurnPhase.predraw) {
      let hasDeck = this.currentGameService.getCurrentPlayer().deck.length > 0;
      this.canDraw = hasDeck;
      this.canEndTurn = !hasDeck;
    }
  }

  viewActiveCards() {
    this.currentGameService.viewActiveCards();
  }

  endTurn() {
    this.currentGameService.endTurn();
  }

  roll() {
    //todo: hide roll button
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
