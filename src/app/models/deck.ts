import { AppInjector } from "../app.module";
import { CurrentGameService } from "../services/current-game.service";
import * as _ from 'lodash';
import { flipColor } from "./counter-color";
import { GameCommandType } from "./game-command";

export class Deck {
    cards: CardType[];

    constructor(cards?: CardType[]) {
        if (cards) {
            this.cards = cards;
        } else {
            this.cards = Cards.cards.map(x => x.cardType);
            Deck.shuffleArray(this.cards);
        }
    }

    get length(): number {
        return this.cards.length;
    }

    removeFirstCardOfType(card: CardType) {
        let index = this.cards.findIndex(x => x == card);
        this.cards.splice(index, 1);
    }

    static getCard(card: CardType): Card {
        return Cards.cards.find(x => x.cardType == card)!;
    }

    static getCardFunction(card: CardType): () => void {
        return Cards.cards.find(x => x.cardType == card)!.action;
    }

    peekTopCard(): CardType {
        return this.cards[this.cards.length -1];
      }

    removeTopCard(): CardType {
        return this.cards.pop()!;
    }

    putCardOnBotton(card: CardType) {
        this.cards.unshift(card);
    }

    putCardOnTop(card: CardType) {
        this.cards.push(card);
    }

    private static shuffleArray(array: any[]) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}


export enum CardType {
    forward3,
    forward1,
    forward5,
    nothing,
    back1,
    back3,
    back5,
    draw2
}

export class Card {
    constructor(public cardType: CardType, public title: string, public description: string, public action: () => void) { }
}

class Cards {
    static cards: Card[] = Cards.generateCards();

    static generateCards(): Card[] {
        let cards: Card[] = [];

        cards.push(new Card
            (
                CardType.forward1,
                "Forward 1",
                "Move Forward 1 square.",
                () => this.moveUs(1)
            ));

        cards.push(new Card
            (
                CardType.forward3,
                "Forward 3",
                "Move Forward 3 squares.",
                () => this.moveUs(3)
            ));

        cards.push(new Card
            (
                CardType.forward5,
                "Forward 5",
                "Move Forward 5 squares.",
                () => this.moveUs(5)
            ));

        cards.push(new Card
            (
                CardType.nothing,
                "Nothing",
                "This card does nothing.",
                () => this.nothing()
            ));

        cards.push(new Card
            (
                CardType.back1,
                "Opponent back 1",
                "Move our opponent back 1 square.",
                () => this.moveThem(-1)
            ));

        cards.push(new Card
            (
                CardType.back3,
                "Opponent back 3",
                "Move our opponent back 3 squares.",
                () => this.moveThem(-3)
            ));

        cards.push(new Card
            (
                CardType.back5,
                "Opponent back 5",
                "Move our opponent back 5 squares.",
                () => this.moveThem(-5)
            ));

        cards.push(new Card
            (
                CardType.draw2,
                "Draw 2",
                "Draw 2 cards",
                () => this.draw2()
            ));

        let inProgress = [
            "extra roll",
            "double dice score for next roll",
            "double dice score for next 3 rolls",
            "next dice roll does nothing for opponent",
            "next card that opponent uses is cancelled",
        ];

        let unlockable: string[] = [
            "resurrect card from graveyard",
            "remove card from saved cards",
            "move all graveyard cards back to deck",
            "broken teleporter",
            "broken teleporter for opponent",
            "glue - when opponent moves onto square, their current turn ends",
            "hidden teleporter - when opponent moves onto square, they teleport back 10 squares",
            "swap saved cards",
            "swap unused cards",
            "swap active cards",
            "remove opponents active cards",
            "untrap - removes first trap that is triggered",
            "one way only - when placed on a square, we cannot be moved backwards past this point, (except for by teleportation"
        ];

        return cards;
    }

    static draw2() {
        let currentGameService = AppInjector.get(CurrentGameService);

        //maybe have a custom command processor
        //that returns a boolean
        //if true, it means that the command was processed
        //and the games processCommand() should quit
        //something like:
        //currentGameService.customCommandProcessor = (command) => {
        // return true;
        //};
        //we will have to do this regardless
        //as what if we have two 'draw 2' cards
        //we will be drawing 4
        //but simply listening to game events and keeping a count won't cut it
        //but a custom command processor will
        //as it check if there is already a processor in place
        //and save it locally, before restoring it at the end of the cards function

        let subscription = currentGameService.command.subscribe(x => {
            switch(x.type) {
                case GameCommandType.USE_CARD:

            }
        });
        currentGameService.drawCard();

        subscription.unsubscribe();
        currentGameService.cardUsed();
    }

    static nothing() {
        let currentGameService = AppInjector.get(CurrentGameService);
        currentGameService.cardUsed();
    }

    static moveThem(amount: number) {
        let currentGameService = AppInjector.get(CurrentGameService);
        currentGameService.moveCounterByAmount(flipColor(currentGameService.currentGame.currentTurnColor), amount);

        currentGameService.command.subscribe(x => {
            if (x.type == GameCommandType.MOVED) {
                currentGameService.cardUsed();
            }
        });
    }

    static moveUs(amount: number) {
        let currentGameService = AppInjector.get(CurrentGameService);
        currentGameService.moveCounterByAmount(currentGameService.currentGame.currentTurnColor, amount);

        currentGameService.command.subscribe(x => {
            if (x.type == GameCommandType.MOVED) {
                currentGameService.cardUsed();
            }
        });
    }
}
