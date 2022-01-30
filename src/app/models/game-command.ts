import { Card, CardType } from "./deck";

export class GameCommand {
    constructor(public type: GameCommandType, public data: any = null) {}

    static fromJson(json: any): GameCommand {
      return new GameCommand(json.type, json.data);
    }

    toJson():any {
      return {
        type: this.type,
        data: this.data
      }
    }

    toString() {
      if(this.data instanceof Card) {
        return "type: " + GameCommandType[this.type] +  ", data: " + CardType[this.data.cardType];
      } else {
        return "type: " + GameCommandType[this.type] +  ", data: " + JSON.stringify(this.data);
      }
    }
}


export enum GameCommandType {
    MOVE_COUNTER,
    ROLLING,
    ROLLED,
    USE_DRAWN_CARD,
    SAVE_DRAWN_CARD,
    END_TURN,
    START_TURN,
    NOP,
    GAME_COMPLETE,
    MOVING,
    MOVED,
    DRAW_CARD,
    CARD_DRAWN,
    USE_SAVED_CARD,
    CARD_USED,
    TELEPORT_COUNTER,
    VIEW_CARDS,
    SHOW_REMOTE_CARD,
    SHOWN_REMOTE_CARD,
    SHOW_CARD,
    START_GAME
}