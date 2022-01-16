export class GameCommand {
    constructor(public type: GameCommandType, public data: any = null) {}

    toString() {
      return "type: " + GameCommandType[this.type] +  ", data: " + JSON.stringify(this.data);
    }
}

export enum GameCommandType {
  MOVE_COUNTER,
  ROLLING,
  ROLLED,
  USE_DRAWN_CARD,
  SAVE_CARD,
  END_TURN,
  START_TURN,
  START_GAME,
  GAME_COMPLETE,
  MOVING,
  MOVED,
  DRAW_CARD,
  CARD_DRAWN,
  USE_SAVED_CARD,
  CARD_USED,
  TELEPORT_COUNTER,
  VIEW_CARDS
}