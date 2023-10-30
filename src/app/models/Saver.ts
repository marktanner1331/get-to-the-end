import * as _ from "lodash";
import { AppInjector } from "../app.module";
import { CurrentGameService, GameController } from "../services/current-game.service";
import { Game } from "./game";
import { GameCommand, GameCommandType } from "./game-command";

export class Saver implements GameController {
    init() {
        let gameService = AppInjector.get(CurrentGameService);
        gameService.idle.push(() => this.save());
        gameService.postProcess.push(x => this.processCommand(x));
    }

    toJson(): {type: string} {
        return { type: "SAVER" };
    }

    private processCommand(command: GameCommand) {
        if (command.type == GameCommandType.GAME_COMPLETE) {
            let gameService = AppInjector.get(CurrentGameService);
            localStorage.removeItem(gameService.currentGame.gameId);
        }
    }

    private save(): void {
        let gameService = AppInjector.get(CurrentGameService);
        
        localStorage.setItem(gameService.currentGame.gameId, JSON.stringify(gameService.currentGame.toJson()));
    }

    static listAllGames(): LocalGameUri[] {
        return Object.keys(localStorage)
        .map(x => localStorage.getItem(x)!)
        .map(x => LocalGameUri.fromString(x));
    }
}

export class LocalGameUri {
    constructor(public id: string, public difficulty: number) {}

    toString() {
        return this.id + "|" + this.difficulty;
    }

    static fromString(s: string): LocalGameUri {
        const split = s.split('|');
        return new LocalGameUri(split[0], parseInt(split[1]));
    }
}