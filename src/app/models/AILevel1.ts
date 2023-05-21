import { AppInjector } from "../app.module";
import { CurrentGameService } from "../services/current-game.service";
import { GameCommand, GameCommandType } from "./game-command";
import { Player } from "./player";
import { TurnPhase } from "./TurnPhase";

export class AILevel1 {
    init() {
        AppInjector.get(CurrentGameService).idle.push(() => this.refresh());
    }

    refresh() {
        console.log("ai.refresh()");

        let gameService = AppInjector.get(CurrentGameService);

        //'our' refers to the real player
        //todo: rename it to something more description
        if (gameService.IsOurTurn()) {
            return;
        }

        let phase = gameService.currentGame.currentPhase;

        if (phase == TurnPhase.preroll) {
            console.log("ai rolling");
            gameService.roll();
        } else if (phase == TurnPhase.predraw) {
            let hasDeck = gameService.getCurrentPlayer().deck.length > 0;

            if (hasDeck) {
                console.log("ai drawing card");
                gameService.drawCard();
            } else {
                console.log("ai ending turn");
                gameService.endTurn();
            }
        } else if (phase == TurnPhase.drawn) {
            console.log("ai using drawn card");
            gameService.useDrawnCard();
        } else if(phase == TurnPhase.postdraw) {
            console.log("AI ending turn");
            gameService.endTurn();
        }
    }
}