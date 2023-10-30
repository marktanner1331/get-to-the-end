import { PACKAGE_ROOT_URL } from "@angular/core";
import * as _ from "lodash";
import { AppInjector } from "../app.module";
import { RandomService } from "../services/random.service";
import { CounterColor } from "./counter-color";
import { Card, CardFactory, CardType, Deck } from "./deck";
import { GameCommand, GameCommandType } from "./game-command";
import { Player } from "./player";
import { TurnPhase } from "./TurnPhase";

export class Game {
    private randomService: RandomService;

    players: Map<CounterColor, Player> = new Map();
    currentTurnColor: CounterColor = CounterColor.green;
    currentPhase: TurnPhase = TurnPhase.preroll;
    currentDrawnCard?: Card;
    hasStarted: boolean = false;
    ourColor: CounterColor = CounterColor.green;
    gameId: string = "";

    //used by the remote to keep track of things
    numUpdates: number = 0;

    constructor(gameId: string) {
        this.gameId = gameId;

        this.randomService = AppInjector.get(RandomService);
        this.randomService.seed(this.gameId);
    }
    
    processCommand(command: GameCommand) {
        switch (command.type) {
            case GameCommandType.MOVE_COUNTER:
            case GameCommandType.TELEPORT_COUNTER:
                this.players.get(command.data.color)!.position = (command.data.position as number);
                break;
            case GameCommandType.DRAW_CARD:
                let temp = this.players.get(this.currentTurnColor)!.deck.removeTopCard();
                this.currentDrawnCard = temp;
                this.changePhase(TurnPhase.drawn);
                break;
            case GameCommandType.ROLLED:
                {
                    this.changePhase(TurnPhase.predraw);
                    let player = this.players.get(this.currentTurnColor)!;
                    player.position = Math.min(99, player.position + (command.data as number));
                }
                break;
            case GameCommandType.USE_SAVED_CARD:
                {
                    let player = this.players.get(this.currentTurnColor)!;
                    const card = player.savedCards.removeFirstCardOfType(command.data);
                    card.action();
                }
                break;
            case GameCommandType.USE_DRAWN_CARD:
                const tempCard = this.currentDrawnCard!;
                this.currentDrawnCard = undefined;
                this.changePhase(TurnPhase.postdraw);
                tempCard.action();
                break;
            case GameCommandType.CARD_USED:
                //we have to generate a brand new version of the card for the discardedPile
                //otherwise, if we ever restore it, it would have it's old values stored on it
                this.players.get(this.currentTurnColor)!
                    .discardedCards.putCardOnTop(CardFactory.getCard(command.data));
            break;
            case GameCommandType.SAVE_DRAWN_CARD:
                this.players.get(this.currentTurnColor)!
                    .savedCards.putCardOnTop(command.data);

                if (this.currentPhase == TurnPhase.drawn) {
                    this.currentDrawnCard = undefined;
                    this.changePhase(TurnPhase.postdraw);
                }
                break;
            case GameCommandType.END_TURN:
                this.changePhase(TurnPhase.end);
                break;
            case GameCommandType.START_TURN:
                this.currentTurnColor = CounterColor.flipColor(this.currentTurnColor);
                this.changePhase(TurnPhase.preroll);
                break;
        }
    }

    changePhase(newPhase: TurnPhase) {
        this.currentPhase = newPhase;
    }

    isComplete(): boolean {
        return this.players.get(CounterColor.green)?.position == 99
            || this.players.get(CounterColor.yellow)?.position == 99;
    }

    getWinningPlayer(): CounterColor {
        if (this.players.get(CounterColor.green)!.position > this.players.get(CounterColor.yellow)!.position) {
            return CounterColor.green;
        } else {
            return CounterColor.yellow;
        }
    }

    getPositionOfPlayer(color: CounterColor): number {
        return this.players.get(color)!.position;
    }

    getOurPosition(): number {
        return this.players.get(this.ourColor)!.position;
    }

    getTheirPosition(): number {
        return this.players.get(CounterColor.flipColor(this.ourColor))!.position;
    }

    isOurTurn(): boolean {
        return this.ourColor == this.currentTurnColor;
      }

    restoreCards() {
        if (this.currentDrawnCard?.active) {
            this.currentDrawnCard!.restore();
        }

        this.players.get(CounterColor.green)!.activeCards.restoreCards();
        this.players.get(CounterColor.yellow)!.activeCards.restoreCards();
    }

    static fromJson(json: any): Game {
        let game: Game = new Game(json.gameId);
        game.players.set(CounterColor.green, Player.fromJson(json.players[0]));
        game.players.set(CounterColor.yellow, Player.fromJson(json.players[1]));

        game.currentTurnColor = json.currentTurnColor;
        game.currentPhase = json.currentPhase;
        game.hasStarted = json.hasStarted;
        game.numUpdates = json.numUpdates;
        game.gameId = json.gameId;
        game.ourColor = json.ourColor;

        if (json.currentDrawnCard) {
            game.currentDrawnCard = CardFactory.getCard(json.currentDrawnCard.cardType);
            game.currentDrawnCard.fromJson(json.currentDrawnCard);
        }

        return game;
    }

    toJson(): any {
        return {
            players: [
                this.players.get(CounterColor.green)!.toJson(),
                this.players.get(CounterColor.yellow)!.toJson(),
            ],
            currentTurnColor: this.currentTurnColor,
            currentPhase: this.currentPhase,
            currentDrawnCard: this.currentDrawnCard?.toJson(),
            hasStarted: this.hasStarted,
            numUpdates: this.numUpdates,
            gameId: this.gameId,
            ourColor: this.ourColor
        }
    }
}
