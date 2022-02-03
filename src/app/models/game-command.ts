import { Card, CardType, Deck } from "./deck";

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
      } else if(Array.isArray(this.data) && this.data.length > 0 && this.data[0] instanceof Card) {
        return "type: " + GameCommandType[this.type] +  ", data: " + this.data.map(x => CardType[x.cardType]);
      } else if(this.data instanceof Deck) {
        return "type: " + GameCommandType[this.type] +  ", data: " + JSON.stringify(this.data.toJson());
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
    SHOWING_REMOTE_CARD,
    SHOWN_REMOTE_CARD,
    SHOW_CARD,
    START_GAME
}