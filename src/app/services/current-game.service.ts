import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { AILevel1 } from '../models/AILevel1';
import { CounterColor, flipColor } from '../models/counter-color';
import { Card, CardType, Deck } from '../models/deck';
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
  AI: AILevel1 = new AILevel1();
  remote: Remote = new Remote();
  saver: Saver = new Saver();

  private _idleCounter: number = 0;
  public get idleCounter(): number {
    return this._idleCounter;
  }
  public set idleCounter(value: number) {
    this._idleCounter = value;
  }

  idle: Subject<void> = new Subject();

  preProcess: ((command: GameCommand) => void)[] = [];
  postProcess: ((command: GameCommand) => void)[] = [];
  commandQueue: GameCommand[] = [];

  constructor() { }

  startGame() {
    if(this.currentGame.isRemote) {
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
      this.processCommand(new GameCommand(GameCommandType.START_GAME, this.currentGame.toJson()));
    }
  }

  restore() {
    this.currentGame.restoreCards();

    let needsNop = true;
    if (this.isOurTurn()) {
      if (this.currentGame.currentPhase == TurnPhase.drawn) {
        //we have drawn a card, so the idleCounter is at 1
        //let's restore that first
        this.idleCounter = 1;

        //then fire the card drawn so that the card viewer can kick in
        this.processCommand(new GameCommand(GameCommandType.CARD_DRAWN, this.currentGame.currentDrawnCard!));
        needsNop = false;
      }
    }

    if (needsNop) {
      this.processCommand(new GameCommand(GameCommandType.NOP));
    }
  }

  getUs(): Player {
    return this.currentGame.players.get(this.getOurColor())!;
  }

  getCurrentPlayer(): Player {
    return this.currentGame.players.get(this.currentGame.currentTurnColor)!;
  }

  getTheirColor(): CounterColor {
    return flipColor(this.getOurColor());
  }

  getOurColor(): CounterColor {
    let ourName = this.currentGame.isHost ? "us" : "them";
    return Array.from(this.currentGame.players.values()).find(x => x.name == ourName)!.color;
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

    /*

      process command
      call callbacks
      that add more commands
      after process command has finished
      it checks if there is a queue
      if so, it processes the next command
      if not, it fires the idle event
      also need an idle counter
      that says "we don't have one in the queue right now, but we will do"
      so pushCommand and processCommand need to be different
      but, if we are pushing a command
      and not currently processing a command
      i.e. from an idle
      then we need to start processing a command
      so maybe we need a boolean
      that tracks if we are processing a command currently
      and if not, push command can fire off to pushCommand
      but what about the idle?
      I suppose we wait until the idle has finished?
      but then, if we are pushing to the queue
      we will want the idle event to run first
      but we won't have an idle event
      we'll have a INCREMENT_IDLE and DECREMENT_IDLE
      so in pushCommand
      that is what'll process those events, not the process command
      and if a DECREMENT_IDLE comes in
      and the idle counter is 0
      then we fire the idle there too
      otherwise we call process command
      so maybe we need 3 functions
        PUSH
        PROCESS
        RUN
      and RUN is called either from PROCESS, or from PUSH
        and either calls PROCESS, or fires the idle
        or just not have RUN, and just duplicate hte code for the other two
        might be simpler to be honest
        so both PROCESS and PUSH can fire idle
        if the PUSH recieves a decrement idle and the idle is 0
          and the command queue is 0
        or from PROCESS
          if idle is 0
          and the command queue is 0
        but what if we are in PUSH, we get a decrement, which is now 0
        and we have commands
          well then call the PROCESS
    */
    
    console.log("idle counter at start: " + this.idleCounter);
    //this.idleCounter++;
    
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
      case GameCommandType.SHOW_REMOTE_CARD:
      case GameCommandType.END_TURN:
        console.log("incrementing idle counter " + this.idleCounter +", from: " + GameCommandType[command.type]);
        this.idleCounter++;
        break;
      case GameCommandType.ROLLED:
      case GameCommandType.MOVED:
      case GameCommandType.CARD_DRAWN:
      case GameCommandType.SHOWN_REMOTE_CARD:
      case GameCommandType.START_TURN:
        console.log("decrementing idle counter: " + this.idleCounter +", from: " + GameCommandType[command.type]);
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
        (command.data as Card).action();
        break;
    }

    //this.idleCounter--;

    console.log("idle counter at end: " + this.idleCounter +", from: " + GameCommandType[command.type]);

    for (let callback of this.postProcess) {
      callback(command);
    }

    if (this.idleCounter == 0) {
      console.log("idle");
      this.idle.next();
    }
  }

  showingDrawnCardAck() {
    this.processCommand(new GameCommand(GameCommandType.SHOW_REMOTE_CARD));
  }

  shownDrawnCardAck() {
    this.processCommand(new GameCommand(GameCommandType.SHOWN_REMOTE_CARD));
  }

  viewActiveCards() {
    this.processCommand(new GameCommand(GameCommandType.VIEW_CARDS, this.getCurrentPlayer().activeCards));
  }

  viewSavedCards() {
    this.processCommand(new GameCommand(GameCommandType.VIEW_CARDS, this.getCurrentPlayer().savedCards));
  }

  saveDrawnCard() {
    if (this.currentGame.currentPhase == TurnPhase.drawn) {
      //we don't want to trigger a idle after the command if we are ending the turn immediately
      this.idleCounter++;
      this.processCommand(new GameCommand(GameCommandType.SAVE_DRAWN_CARD, this.currentGame.currentDrawnCard!));
      this.idleCounter--;

      this.endTurn();
    } else {
      this.processCommand(new GameCommand(GameCommandType.SAVE_DRAWN_CARD, this.currentGame.currentDrawnCard!));
    }
  }

  useSavedCard(card: Card) {
    if (this.isOurTurn()) {
      this.processCommand(new GameCommand(GameCommandType.USE_SAVED_CARD, card));
    } else {
      this.processCommand(new GameCommand(GameCommandType.SHOW_CARD, card));
      let callback = (command: GameCommand) => {
        if (command.type == GameCommandType.SHOWN_REMOTE_CARD) {
          this.processCommand(new GameCommand(GameCommandType.USE_SAVED_CARD, card));

          _.remove(this.postProcess, x => x == callback);
        };

        this.postProcess.push(callback);
      }
    }
  }

  useDrawnCard() {
    if (this.isOurTurn()) {
      this.processCommand(new GameCommand(GameCommandType.USE_DRAWN_CARD, this.currentGame.currentDrawnCard!));
    } else {
      this.processCommand(new GameCommand(GameCommandType.SHOW_CARD, this.currentGame.currentDrawnCard!));
      let callback = (command: GameCommand) => {
        if (command.type == GameCommandType.SHOWN_REMOTE_CARD) {
          this.processCommand(new GameCommand(GameCommandType.USE_DRAWN_CARD, this.currentGame.currentDrawnCard!));

          _.remove(this.postProcess, x => x == callback);
        };
      }

      this.postProcess.push(callback);
    }
  }

  /*
  so the problem
  and it's a horrible one
  that is fucking us over
  is that we need to fire the idle event only when we really want a decision from the player
  which is either a real decision from the control panel
  or a command from the remote
  this is simple in theory
  but it hasn't turned out that way
  so we have the idle counter
  that in theory tracks the current state
  and when it hits 0 we know we are idle
  so things like MOVING increases it and MOVED decreases it
  that way we know if we are currently moving, then we aren't idle
  same for ROLLING/ROLLED
  and SHOW_CARD/SHOWN_CARD
  AND END_TURN/START_TURN
  but what gets complicated is the recursive nature of the preprocess and postprocess
  and the card actions
  in theory when we end the turn, the idleCounter should be back to 1
  and the fact that it's not is causing issues
  still don't fully get why though
  i suppose we need to check specific flows
  because something really isn't adding up

  */

  cardUsed() {
    if (this.currentGame.currentPhase == TurnPhase.drawn) {
      //we don't want to trigger a idle after the command if we are ending the turn immediately
      this.idleCounter++;
      this.processCommand(new GameCommand(GameCommandType.CARD_USED, this.currentGame.currentDrawnCard!));
      this.idleCounter--;

      this.endTurn();
    } else {
      this.processCommand(new GameCommand(GameCommandType.CARD_USED, this.currentGame.currentDrawnCard!));
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
  }
}
