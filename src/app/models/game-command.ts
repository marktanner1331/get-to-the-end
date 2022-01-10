export class GameCommand {
    constructor(public type: GameCommandType, public data: any) {}
}

export enum GameCommandType {
    MOVE_COUNTER
}