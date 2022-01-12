import { AppInjector } from "../app.module";
import { CurrentGameService } from "../services/current-game.service";
import { GameCommand, GameCommandType } from "./game-command";
import { Player } from "./player";
import { TurnPhase } from "./TurnPhase";

export class AILevel1 {
    processCommand(command: GameCommand) {
        let gameService = AppInjector.get(CurrentGameService);
        switch(command.type) {
            case GameCommandType.START_TURN:
                gameService.roll();
                break;
            case GameCommandType.MOVED:
                if(gameService.currentGame.currentPhase == TurnPhase.predraw) {
                    setTimeout(() => {
                        let player: Player = gameService.getCurrentPlayer();
                        if(player.deck.length > 0) {
                            gameService.currentGame.currentDrawnCard = player.deck.removeTopCard();
                            gameService.currentGame.currentPhase = TurnPhase.drawn;
                            gameService.useDrawnCard(gameService.currentGame.currentDrawnCard);
                        } else {
                            gameService.endTurn();
                        }
                    }, 300);
                }
                break;
        }
    }
}