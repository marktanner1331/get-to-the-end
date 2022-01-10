import { CounterColor } from "./counter-color";
import { GameCommand, GameCommandType } from "./game-command";

export class Game {
    greenCounterPos: number = 0;
    yellowCounterPos: number = 0;

    processCommand(command: GameCommand) {
        switch(command.type) {
            case GameCommandType.MOVE_COUNTER:
                if(command.data.color == CounterColor.green) {
                    this.greenCounterPos = command.data.position;
                } else {
                    this.yellowCounterPos = command.data.position;
                }
                break;
        }
    }
}
