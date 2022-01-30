import { AppInjector } from "../app.module";
import { CurrentGameService } from "../services/current-game.service";
import { Game } from "./game";

export class Saver {
    init() {
        let gameService = AppInjector.get(CurrentGameService);
        gameService.idle.subscribe(() => this.save());
    }

    save(): void {
        let gameService = AppInjector.get(CurrentGameService);

        if(gameService.currentGame.isRemote) {
            localStorage.setItem("remote_" + gameService.currentGame.gameId, JSON.stringify(gameService.currentGame.toJson()));
        } else {
            localStorage.setItem("currentGame", JSON.stringify(gameService.currentGame.toJson()));
        }
    }

    static hasCurrentGame(): boolean {
        return localStorage.getItem("currentGame") != null;
    }

    static getCurrentGame(): Game {
        let json: any = JSON.parse(localStorage.getItem("currentGame")!);
        return Game.fromJson(json);
    }
}