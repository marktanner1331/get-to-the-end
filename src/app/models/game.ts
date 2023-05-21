import { PACKAGE_ROOT_URL } from "@angular/core";
import * as _ from "lodash";
import { CounterColor, flipColor } from "./counter-color";
import { Card, CardFactory, CardType, Deck } from "./deck";
import { GameCommand, GameCommandType } from "./game-command";
import { Player } from "./player";
import { TurnPhase } from "./TurnPhase";

export class Game {
    players: Map<CounterColor, Player> = new Map();
    currentTurnColor: CounterColor = CounterColor.green;
    currentPhase: TurnPhase = TurnPhase.preroll;
    currentDrawnCard?: Card;
    hasStarted: boolean = false;
    isHost: boolean = true;
    isRemote: boolean = false;
    gameId: string = "";
    rngSeed: number = 0;

    //used by the remote to keep track of things
    numUpdates: number = 0;

    constructor(gameId: string) {
        this.gameId = gameId;
        this.rngSeed = this.xmur3(this.gameId)();
    }

    nextRand() {
        var t = this.rngSeed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    private xmur3(str: string): () => number {
        for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = h << 13 | h >>> 19;
        } return () => {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return (h ^= h >>> 16) >>> 0;
        }
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
                this.currentTurnColor = flipColor(this.currentTurnColor);
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
        let ourName = this.isHost ? "us" : "them";
        return Array.from(this.players.values()).find(x => x.name == ourName)!.position;
    }

    getTheirPosition(): number {
        let ourName = this.isHost ? "us" : "them";
        return Array.from(this.players.values()).find(x => x.name != ourName)!.position;
    }

    isOurTurn(): boolean {
        let ourName = this.isHost ? "us" : "them";
        return Array.from(this.players.values()).find(x => x.name == ourName)!.color == this.currentTurnColor;
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
        game.isHost = json.isHost;
        game.numUpdates = json.numUpdates;
        game.isRemote = json.isRemote;
        game.gameId = json.gameId;

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
            isHost: this.isHost,
            numUpdates: this.numUpdates,
            isRemote: this.isRemote,
            gameId: this.gameId
        }
    }
}
