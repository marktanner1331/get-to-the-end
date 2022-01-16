import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DiceRollerService } from '../dice-roller/dice-roller.service';
import { AILevel1 } from '../models/AILevel1';
import { CounterColor } from '../models/counter-color';
import { CardType, Deck } from '../models/deck';
import { Game } from '../models/game';
import { GameCommand, GameCommandType } from '../models/game-command';
import { Player } from '../models/player';
import { TurnPhase } from '../models/TurnPhase';

@Injectable({
  providedIn: 'root'
})
export class CurrentGameService {
  currentGame!: Game;
  AI: AILevel1 = new AILevel1();

  idleCounter: number = 0;
  idle: Subject<void> = new Subject();

  preProcess: ((command: GameCommand) => void)[] = [];
  postProcess: ((command: GameCommand) => void)[] = [];

  constructor(
    private diceRollerService: DiceRollerService) { }

  startGame() {
    this.AI.init();
    this.processCommand(new GameCommand(GameCommandType.START_GAME));
  }

  getUs(): Player {
    return Array.from(this.currentGame.players.values()).find(x => x.name == "us")!;
  }

  getCurrentPlayer(): Player {
    return this.currentGame.players.get(this.currentGame.currentTurnColor)!;
  }

  getTheirColor(): CounterColor {
    return Array.from(this.currentGame.players.values()).find(x => x.name != "us")!.color;
  }

  getOurColor(): CounterColor {
    return Array.from(this.currentGame.players.values()).find(x => x.name == "us")!.color;
  }

  isOurTurn(): boolean {
    return this.currentGame.currentTurnColor == this.getOurColor();
  }

  moveCounterByAmount(color: CounterColor, amount: number) {
    let position = this.currentGame.getPositionOfPlayer(color) + amount;
    position = Math.min(99, Math.max(0, position));

    let command: GameCommand = new GameCommand(GameCommandType.MOVE_COUNTER, { color: color, position: position });
    this.processCommand(command);
  }

  teleportCounter(color: CounterColor, position: number) {
    let command: GameCommand = new GameCommand(GameCommandType.TELEPORT_COUNTER, { color: color, position: position });
    this.processCommand(command);
  }

  processCommand(command: GameCommand) {
    console.log(command.toString());

    this.idleCounter++;

    for(let callback of this.preProcess) {
      callback(command);
    }

    let initialPhase = this.currentGame.currentPhase;
    this.currentGame.processCommand(command);
    if (this.currentGame.currentPhase != initialPhase) {
      console.log("phase: previous: " + TurnPhase[initialPhase] + ", new: " + TurnPhase[this.currentGame.currentPhase]);
    }

    switch(command.type) {
      case GameCommandType.ROLLING:
      case GameCommandType.MOVING:
      case GameCommandType.DRAW_CARD:
      case GameCommandType.SHOWING_CARD:
        this.idleCounter++;
        break;
      case GameCommandType.ROLLED:
      case GameCommandType.MOVED:
      case GameCommandType.CARD_DRAWN:
      case GameCommandType.SHOWN_CARD:
        this.idleCounter--;
        break;
    }

    switch (command.type) {
      case GameCommandType.MOVED:
        if (this.currentGame.isComplete()) {
          this.processCommand(new GameCommand(GameCommandType.GAME_COMPLETE, this.currentGame.getWinningPlayer()));
          return;
        }
        break;
      case GameCommandType.USE_SAVED_CARD:
      case GameCommandType.USE_DRAWN_CARD:
        Deck.getCardFunction(command.data)();
        break;
    }

    for(let callback of this.postProcess) {
      callback(command);
    }

    this.idleCounter--;
    if(this.idleCounter == 0) {
      console.log("idle");
      this.idle.next();
    }
  }

  showingDrawnCardAck() {
    this.processCommand(new GameCommand(GameCommandType.SHOWING_CARD));
  }

  shownDrawnCardAck() {
    this.processCommand(new GameCommand(GameCommandType.SHOWN_CARD));
  }

  viewActiveCards() {
    this.processCommand(new GameCommand(GameCommandType.VIEW_CARDS, this.getCurrentPlayer().activeCards));
  }

  viewSavedCards() {
    this.processCommand(new GameCommand(GameCommandType.VIEW_CARDS, this.getCurrentPlayer().savedCards));
  }

  saveCard(card: CardType) {
    this.processCommand(new GameCommand(GameCommandType.SAVE_CARD, card));

    if (this.currentGame.currentPhase == TurnPhase.drawn) {
      this.endTurn();
    }
  }

  useSavedCard(card: CardType) {
    this.processCommand(new GameCommand(GameCommandType.USE_SAVED_CARD, card));
  }

  useDrawnCard() {
    this.processCommand(new GameCommand(GameCommandType.USE_DRAWN_CARD, this.currentGame.currentDrawnCard!));
  }

  cardUsed() {
    this.processCommand(new GameCommand(GameCommandType.CARD_USED));
    
    if (this.currentGame.currentPhase == TurnPhase.drawn) {
      this.endTurn();
    }
  }

  drawCard() {
    this.processCommand(new GameCommand(GameCommandType.DRAW_CARD));
    this.processCommand(new GameCommand(GameCommandType.CARD_DRAWN, this.currentGame.currentDrawnCard!));
  }

  endTurn() {
    this.processCommand(new GameCommand(GameCommandType.END_TURN));
    this.processCommand(new GameCommand(GameCommandType.START_TURN));
  }

  roll() {
    this.processCommand(new GameCommand(GameCommandType.ROLLING));
    this.diceRollerService.rollRandom().subscribe(x => {
      setTimeout(() => {
        this.processCommand(new GameCommand(GameCommandType.ROLLED, x));
        setTimeout(() => {
        }, 400);
      }, 400);
    });
  }
}
