import * as _ from "lodash";
import { CounterColor, flipColor } from "./counter-color";
import { CardType, Deck } from "./deck";
import { GameCommand, GameCommandType } from "./game-command";
import { Player } from "./player";
import { TurnPhase } from "./TurnPhase";

export class Game {
    players: Map<CounterColor, Player> = new Map();
    currentTurnColor: CounterColor = CounterColor.green;
    currentPhase: TurnPhase = TurnPhase.preroll;
    currentDrawnCard?: CardType;

    //when set to true, phase processing will not occur during processCommand calls
    //this is useful for cards that have complex effects, and need to manage the phase themselves
    suspendPhaseProcessing: boolean = false;

    processCommand(command: GameCommand) {
        switch (command.type) {
            case GameCommandType.MOVE_COUNTER:
                this.players.get(command.counterColor)!.position = (command.data as number);
                break;
            case GameCommandType.DRAW_CARD:
                let temp = this.players.get(this.currentTurnColor)!.deck.removeTopCard();
                if(temp != command.data) {
                    throw new Error("cards do not match");
                }

                this.currentDrawnCard = command.data;
                this.changePhase(TurnPhase.drawn);
                break;
            case GameCommandType.ROLLED:
                {
                    this.changePhase(TurnPhase.predraw);
                    let player = this.players.get(command.counterColor)!;
                    player.position = Math.min(99, player.position + (command.data as number));
                }
                break;
            case GameCommandType.USE_CARD:
                Deck.getCardFunction(command.data)();
                this.players.get(command.counterColor)!
                    .discardedCards.putCardOnTop(command.data);
                break;
            case GameCommandType.SAVE_CARD:
                this.players.get(command.counterColor)!
                    .savedCards.putCardOnTop(command.data);
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
        if(!this.suspendPhaseProcessing) {
            this.currentPhase = newPhase;
        }
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
