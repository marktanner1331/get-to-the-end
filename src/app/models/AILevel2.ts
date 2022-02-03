import { AppInjector } from "../app.module";
import { CurrentGameService } from "../services/current-game.service";
import { Card, CardType } from "./deck";
import { GameCommand, GameCommandType } from "./game-command";
import { Player } from "./player";
import { TurnPhase } from "./TurnPhase";

export class AILevel2 {
    init() {
        AppInjector.get(CurrentGameService).idle.push(() => this.refresh());
    }

    refresh() {
        let gameService = AppInjector.get(CurrentGameService);

        //'our' refers to the real player
        //todo: rename it to something more description
        if (gameService.IsHostsTurn()) {
            return;
        }

        setTimeout(() => {
            let phase = gameService.currentGame.currentPhase;

            if (phase == TurnPhase.preroll) {
                let savedCard: Card | null = this.useSavedCard();
                if (savedCard) {
                    console.log("ai using saved card");
                    gameService.useSavedCard(savedCard);
                } else {
                    console.log("ai rolling");
                    gameService.roll();
                }
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
                if (this.shouldUseDrawnCard()) {
                    console.log("ai using drawn card");
                    gameService.useDrawnCard();
                } else {
                    console.log("ai saving drawn card");
                    gameService.saveDrawnCard();
                }
            } else if (phase == TurnPhase.postdraw) {
                console.log("AI ending turn");
                gameService.endTurn();
            }
        }, 200);
    }

    useSavedCard(): Card | null {
        let gameService = AppInjector.get(CurrentGameService);

        for (let card of gameService.getCurrentPlayer().savedCards.cards) {
            if (this.shouldUseCard(card)) {
                return card;
            }
        }

        return null;
    }

    shouldUseDrawnCard(): boolean {
        let gameService = AppInjector.get(CurrentGameService);
        return this.shouldUseCard(gameService.currentGame.currentDrawnCard!);
    }

    shouldUseCard(card: Card) {
        let gameService = AppInjector.get(CurrentGameService);
        let ourPosition = gameService.getCurrentPlayer().position;
        let theirPosition = gameService.getNonCurrentPlayer().position;

        switch (card.cardType) {
            case CardType.back1:
                return theirPosition > 0;
            case CardType.back3:
                return theirPosition > 2;
            case CardType.back5:
                return theirPosition > 4;
            case CardType.brokenTeleporter:
                return ourPosition < 50;
            case CardType.brokenTeleporterForOpponent:
                return theirPosition > 50;
            case CardType.dieDoesNothing:
            case CardType.doubleDice:
            case CardType.doubleDice3:
            case CardType.draw2:
            case CardType.extraRoll:
            case CardType.forward1:
            case CardType.forward3:
            case CardType.forward5:
            case CardType.nothing:
                return true;
            case CardType.resurrectAll:
                return gameService.getCurrentPlayer().deck.length == 0;
            case CardType.swapPositions:
                return theirPosition - ourPosition > 50;
            default:
                return true;
        }
    }
}