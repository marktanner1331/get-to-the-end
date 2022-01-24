import { PACKAGE_ROOT_URL } from "@angular/core";
import * as _ from "lodash";
import { CounterColor, flipColor } from "./counter-color";
import { Card, CardType, Deck } from "./deck";
import { GameCommand, GameCommandType } from "./game-command";
import { Player } from "./player";
import { TurnPhase } from "./TurnPhase";

export class Game {

    players: Map<CounterColor, Player> = new Map();
    currentTurnColor: CounterColor = CounterColor.green;
    currentPhase: TurnPhase = TurnPhase.preroll;
    currentDrawnCard?: Card;

    constructor() {
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
                    
                    player.discardedCards.putCardOnTop(command.data);
                    player.savedCards.removeFirstCardOfType(command.data);
                }
                break;
            case GameCommandType.USE_DRAWN_CARD:
                this.players.get(this.currentTurnColor)!
                    .discardedCards.putCardOnTop(command.data);

                this.currentDrawnCard = undefined;
                break;
            case GameCommandType.SAVE_CARD:
                this.players.get(this.currentTurnColor)!
                    .savedCards.putCardOnTop(command.data);

                if (this.currentPhase == TurnPhase.drawn) {
                    this.currentDrawnCard = undefined;
                }
                break;
            case GameCommandType.END_TURN:
                this.changePhase(TurnPhase.end);
                break;
            case GameCommandType.START_TURN:
                this.currentTurnColor = flipColor(this.currentTurnColor);
                this.changePhase(TurnPhase.preroll);
                break;
            case GameCommandType.START_GAME:
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
}
