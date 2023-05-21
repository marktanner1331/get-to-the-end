import * as _ from "lodash";
import { AppInjector } from "../app.module";
import { CurrentGameService } from "../services/current-game.service";
import { Game } from "./game";
import { GameCommand, GameCommandType } from "./game-command";

export class Saver {
    init() {
        let gameService = AppInjector.get(CurrentGameService);
        gameService.idle.push(() => this.save());
        gameService.postProcess.push(x => this.processCommand(x));
    }

    processCommand(command: GameCommand) {
        if (command.type == GameCommandType.GAME_COMPLETE) {
            let gameService = AppInjector.get(CurrentGameService);
            if (gameService.currentGame.isRemote) {
                localStorage.removeItem("remote_" + gameService.currentGame.gameId);
            } else {
                localStorage.removeItem("local_" + gameService.currentGame.gameId);
            }
        }
    }

    save(): void {
        let gameService = AppInjector.get(CurrentGameService);

        if (gameService.currentGame.isRemote) {
            localStorage.setItem("remote_" + gameService.currentGame.gameId, JSON.stringify(gameService.currentGame.toJson()));
        } else {
            localStorage.setItem("local_" + gameService.currentGame.gameId, JSON.stringify(gameService.currentGame.toJson()));
        }
    }

    static listAllGames(): Game[] {
        return Object.keys(localStorage)
        .map(x => localStorage.getItem(x)!)
        .map(x => JSON.parse(x))
        .map(x => Game.fromJson(x));
    }

    static listRemoteGames():Game[] {
        return Object.keys(localStorage)
        .filter(x => x.startsWith("remote_"))
        .map(x => localStorage.getItem(x)!)
        .map(x => JSON.parse(x))
        .map(x => Game.fromJson(x));
    }

    static listLocalGames():Game[] {
        return Object.keys(localStorage)
        .filter(x => x.startsWith("remote_"))
        .map(x => localStorage.getItem(x)!)
        .map(x => JSON.parse(x))
        .map(x => Game.fromJson(x));
    }

    static hasCurrentGame(): boolean {
        return _.some(Object.keys(localStorage), x => x.startsWith("local_"));
    }

    static getCurrentGame(): Game {
        let jsonString = localStorage.getItem(Object.keys(localStorage).find(x => x.startsWith("local_"))!)!;
        let json: any = JSON.parse(jsonString);
        return Game.fromJson(json);
    }
}