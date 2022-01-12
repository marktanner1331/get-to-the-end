import { CounterColor } from "./counter-color";

export class GameCommand {
    constructor(public type: GameCommandType, public counterColor: CounterColor, public data: any) {}

    toString() {
      return "type: " + GameCommandType[this.type] + ", color: " + CounterColor[this.counterColor] + ", data: " + JSON.stringify(this.data);
    }
}

export enum GameCommandType {
  MOVE_COUNTER,
  ROLLING,
  ROLLED,
  USE_CARD,
  SAVE_CARD,
  END_TURN,
  START_TURN,
  START_GAME,
  GAME_COMPLETE,
  MOVING,
  MOVED,
  DRAW_CARD
}