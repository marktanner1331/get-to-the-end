import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { AILevel1 } from '../models/AILevel1';
import { AILevel2 } from '../models/AILevel2';
import { CounterColor, flipColor } from '../models/counter-color';
import { Card, CardType, Deck, DeckType } from '../models/deck';
import { Game } from '../models/game';
import { GameCommand, GameCommandType } from '../models/game-command';
import { Player } from '../models/player';
import { Remote } from '../models/Remote';
import { Saver } from '../models/Saver';
import { TurnPhase } from '../models/TurnPhase';

@Injectable({
  providedIn: 'root'
})
export class CurrentGameService {
  currentGame!: Game;
  AI: AILevel2 = new AILevel2();
  remote: Remote = new Remote();
  saver: Saver = new Saver();

  idleCounter: number = 0;

  idle: (() => void)[] = [];

  preProcess: ((command: GameCommand) => void)[] = [];
  postProcess: ((command: GameCommand) => void)[] = [];

  commandQueue: GameCommand[] = [];
  isProcessing: boolean = false;

  constructor() { }

  startGame() {
    if (this.currentGame.isRemote) {
      this.remote.init();
    } else {
      this.AI.init();
    }

    this.saver.init();

    if (this.currentGame.hasStarted) {
      //i.e. from a saved game
      this.restore();
    } else {
      this.currentGame.hasStarted = true;
      this.pushCommand(new GameCommand(GameCommandType.START_GAME, null));
    }
  }

  reset() {
    this.idleCounter = 0;
    this.idle = [];
    this.preProcess = [];
    this.postProcess = [];
    this.commandQueue = [];
    this.isProcessing = false;
  }

  restore() {
    this.currentGame.restoreCards();

    let needsNop = true;
    if (this.IsOurTurn()) {
      if (this.currentGame.currentPhase == TurnPhase.drawn) {
        //we have drawn a card, so the idleCounter is at 1
        //let's restore that first
        this.idleCounter = 1;

        //then fire the card drawn so that the card viewer can kick in
        this.pushCommand(new GameCommand(GameCommandType.CARD_DRAWN, this.currentGame.currentDrawnCard!));
        needsNop = false;
      }
    }

    if (needsNop) {
      this.pushCommand(new GameCommand(GameCommandType.NOP));
    }
  }

  getUs(): Player {
    return this.currentGame.players.get(this.getOurColor())!;
  }

  getCurrentPlayer(): Player {
    return this.currentGame.players.get(this.currentGame.currentTurnColor)!;
  }

  getNonCurrentPlayer(): Player {
    return this.currentGame.players.get(flipColor(this.currentGame.currentTurnColor))!;
  }

  getTheirColor(): CounterColor {
    return flipColor(this.getOurColor());
  }

  getOurColor(): CounterColor {
    let ourName = this.currentGame.isHost ? "us" : "them";
    return Array.from(this.currentGame.players.values()).find(x => x.name == ourName)!.color;
  }

  IsOurTurn(): boolean {
    return this.currentGame.currentTurnColor == this.getOurColor();
  }

  moveCounterByAmount(color: CounterColor, amount: number) {
    let position = this.currentGame.getPositionOfPlayer(color) + amount;
    position = Math.min(99, Math.max(0, position));

    let command: GameCommand = new GameCommand(GameCommandType.MOVE_COUNTER, { color: color, position: position });
    this.pushCommand(command);
  }

  teleportCounter(color: CounterColor, position: number) {
    let command: GameCommand = new GameCommand(GameCommandType.TELEPORT_COUNTER, { color: color, position: position });
    this.pushCommand(command);
  }

  pushCommand(command: GameCommand) {
    console.log("Pushing Command: " + command.toString());
    this.commandQueue.push(command);

    if (this.isProcessing == false) {
      this.processCommand();
    }
  }

  processCommand() {
    this.isProcessing = true;

    while (this.commandQueue.length) {
      let command: GameCommand = this.commandQueue.shift()!;
      console.log("Processing Command: " + command.toString());

      for (let callback of this.preProcess) {
        callback(command);
      }

      let initialPhase = this.currentGame.currentPhase;
      this.currentGame.processCommand(command);
      if (this.currentGame.currentPhase != initialPhase) {
        console.log("phase: previous: " + TurnPhase[initialPhase] + ", new: " + TurnPhase[this.currentGame.currentPhase]);
      }

      switch (command.type) {
        case GameCommandType.ROLLING:
        case GameCommandType.MOVING:
        case GameCommandType.DRAW_CARD:
        case GameCommandType.SHOWING_REMOTE_CARD:
        case GameCommandType.END_TURN:
          this.idleCounter++;
          break;
        case GameCommandType.ROLLED:
        case GameCommandType.MOVED:
        case GameCommandType.CARD_DRAWN:
        case GameCommandType.SHOWN_REMOTE_CARD:
        case GameCommandType.START_TURN:
          this.idleCounter--;
          break;
      }

      switch (command.type) {
        case GameCommandType.MOVED:
          if (this.currentGame.isComplete()) {
            this.commandQueue.length = 0;
            this.pushCommand(new GameCommand(GameCommandType.GAME_COMPLETE, this.currentGame.getWinningPlayer()));

            //we don't want the idle event firing
            this.idleCounter++;
            continue;
          }
          break;
      }

      for (let callback of this.postProcess) {
        callback(command);
      }

      if (this.commandQueue.length == 0) {
        console.log("idle counter: " + this.idleCounter);
        if (this.idleCounter == 0) {
          console.log("idle");
          for (let callback of this.idle) {
            callback();
          }
        }
      }
    }

    this.isProcessing = false;
  }

  showingDrawnCardAck() {
    this.pushCommand(new GameCommand(GameCommandType.SHOWING_REMOTE_CARD));
  }

  shownDrawnCardAck() {
    this.pushCommand(new GameCommand(GameCommandType.SHOWN_REMOTE_CARD));
  }

  viewActiveCards() {
    this.pushCommand(new GameCommand(GameCommandType.VIEW_CARDS, DeckType.active));
  }

  viewSavedCards() {
    this.pushCommand(new GameCommand(GameCommandType.VIEW_CARDS, DeckType.saved));
  }

  saveDrawnCard() {
    this.pushCommand(new GameCommand(GameCommandType.SAVE_DRAWN_CARD, this.currentGame.currentDrawnCard!));
  }

  useSavedCard(cardType: CardType) {
    if (this.IsOurTurn()) {
      this.pushCommand(new GameCommand(GameCommandType.USE_SAVED_CARD, cardType));
    } else {
      this.pushCommand(new GameCommand(GameCommandType.SHOW_CARD, this.getCurrentPlayer().savedCards.getFirstCardOfType(cardType)));
      let callback = (command: GameCommand) => {
        if (command.type == GameCommandType.SHOWN_REMOTE_CARD) {
          this.pushCommand(new GameCommand(GameCommandType.USE_SAVED_CARD, cardType));
          _.remove(this.postProcess, x => x == callback);
        }
      };

      this.postProcess.push(callback);
    }
  }

  useDrawnCard() {
    if (this.IsOurTurn()) {
      this.pushCommand(new GameCommand(GameCommandType.USE_DRAWN_CARD));
    } else {
      this.pushCommand(new GameCommand(GameCommandType.SHOW_CARD, this.currentGame.currentDrawnCard!));
      let callback = (command: GameCommand) => {
        if (command.type == GameCommandType.SHOWN_REMOTE_CARD) {
          this.pushCommand(new GameCommand(GameCommandType.USE_DRAWN_CARD));

          _.remove(this.postProcess, x => x == callback);
        };
      }

      this.postProcess.push(callback);
    }
  }

  cardUsed(cardType: CardType) {
    this.pushCommand(new GameCommand(GameCommandType.CARD_USED, cardType));
  }

  drawCard() {
    this.pushCommand(new GameCommand(GameCommandType.DRAW_CARD));
    this.pushCommand(new GameCommand(GameCommandType.CARD_DRAWN, this.currentGame.currentDrawnCard!));
  }

  endTurn() {
    this.pushCommand(new GameCommand(GameCommandType.END_TURN));
    this.pushCommand(new GameCommand(GameCommandType.START_TURN));
  }

  roll() {
    this.pushCommand(new GameCommand(GameCommandType.ROLLING));
  }
}
