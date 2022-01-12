import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DeckViewerService } from '../deck-viewer/deck-viewer.service';
import { DiceRollerService } from '../dice-roller/dice-roller.service';
import { AILevel1 } from '../models/AILevel1';
import { CounterColor } from '../models/counter-color';
import { CardType } from '../models/deck';
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

  command: Subject<GameCommand> = new Subject();

  constructor(
    private diceRollerService: DiceRollerService,
    private deckViewerService: DeckViewerService) { }

  startGame() {
    this.processCommand(new GameCommand(
      GameCommandType.START_GAME,
      this.currentGame.currentTurnColor,
      null
    ));
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

    let command: GameCommand = new GameCommand(GameCommandType.MOVE_COUNTER, color, position);

    this.processCommand(command);
  }

  processCommand(command: GameCommand) {
    console.log("command: " + GameCommandType[command.type] + ", color: " + CounterColor[command.counterColor] + ", data: " + JSON.stringify(command.data));

    //let initialPhase = this.currentGame.currentPhase;
    this.currentGame.processCommand(command);

    // if (this.currentGame.currentPhase != initialPhase) {
    //   console.log("previous phase: " + TurnPhase[initialPhase] + ", new phase: " + TurnPhase[this.currentGame.currentPhase]);
    //   this.command.next(new GameCommand(
    //     GameCommandType.TURN_PHASE_CHANGED,
    //     this.currentGame.currentTurnColor,
    //     this.currentGame.currentPhase
    //   ));
    // }

    this.command.next(command);

    if (this.getCurrentPlayer().name == "them") {
      this.AI.processCommand(command);
    }

    switch (command.type) {
      case GameCommandType.ROLLED:
      case GameCommandType.MOVE_COUNTER:
        if (this.currentGame.isComplete()) {
          this.processCommand(new GameCommand(GameCommandType.GAME_COMPLETE, this.currentGame.getWinningPlayer(), null))
        }
    }
  }

  viewSavedCards() {
    this.deckViewerService.show(this.getCurrentPlayer().savedCards);
  }

  saveCard(card: CardType) {
    let player: Player = this.getCurrentPlayer();
    player.savedCards.putCardOnTop(card);

    if (!this.currentGame.suspendPhaseProcessing) {
      //make sure they aren't using a card from the saved cards
      if (this.currentGame.currentPhase > TurnPhase.preroll) {
        this.endTurn();
      }
    }
  }

  useSavedCard(card: CardType) {
    let player = this.getCurrentPlayer();
    player.savedCards.removeFirstCardOfType(card);

    this.processCommand(new GameCommand(GameCommandType.USE_CARD, this.currentGame.currentTurnColor, card));
  }

  useDrawnCard(card: CardType) {
    this.processCommand(new GameCommand(GameCommandType.USE_CARD, this.currentGame.currentTurnColor, card));
  }

  cardUsed() {
    if (!this.currentGame.suspendPhaseProcessing) {
      if (this.currentGame.currentPhase == TurnPhase.drawn) {
        this.endTurn();
      }
    }
  }

  drawCard() {
    let player: Player = this.getCurrentPlayer();

    //not ideal
    //we want the game to be able to manage it's own state
    //including managing the decks when we push a draw_card command
    //but we also need to know the name of the top card so the card viewer can show it
    //ideally we would have multiple events
    //DRAW_CARD and CARD_DRAWN
    let topCard = player.deck.peekTopCard();

    this.processCommand(new GameCommand
      (
        GameCommandType.DRAW_CARD,
        this.currentGame.currentTurnColor,
        topCard
      ));
  }

  endTurn() {
    this.processCommand(new GameCommand(GameCommandType.END_TURN, this.currentGame.currentTurnColor, null));
    this.processCommand(new GameCommand(GameCommandType.START_TURN, this.currentGame.currentTurnColor, null));
  }

  roll() {
    this.processCommand(new GameCommand(GameCommandType.ROLLING, this.currentGame.currentTurnColor, null));
    this.diceRollerService.rollRandom().subscribe(x => {
      setTimeout(() => {
        this.processCommand(new GameCommand(GameCommandType.ROLLED, this.currentGame.currentTurnColor, x));
        setTimeout(() => {
        }, 400);
      }, 400);
    });
  }
}
