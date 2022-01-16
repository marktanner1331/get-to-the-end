import { AppInjector } from "../app.module";
import { CurrentGameService } from "../services/current-game.service";
import * as _ from 'lodash';
import { flipColor } from "./counter-color";
import { GameCommand, GameCommandType } from "./game-command";
import { TurnPhase } from "./TurnPhase";
import { Player } from "./player";

export class Deck {
    cards: CardType[];

    constructor(public deckType: DeckType, cards?: CardType[]) {
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
        return this.cards[this.cards.length - 1];
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

export enum DeckType {
    unused,
    saved,
    used,
    active
}




export enum CardType {
    forward3,
    forward1,
    forward5,
    nothing,
    back1,
    back3,
    back5,
    draw2,
    extraRoll,
    brokenTeleporter,
    brokenTeleporterForOpponent,
    doubleDice,
    doubleDice3
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

        cards.push(new Card
            (
                CardType.extraRoll,
                "Extra Roll",
                "Roll the die and move the given amount",
                () => this.extraRoll()
            ));

        cards.push(new Card
            (
                CardType.doubleDice,
                "Double Die",
                "Double the die score for the next roll",
                () => this.doubleDice()
            ));

        cards.push(new Card
            (
                CardType.doubleDice3,
                "Double Die for 3 turns",
                "Double the die score for the next three rolls",
                () => this.doubleDice3()
            ));

        let inProgress = [
            "next dice roll does nothing for opponent",
            "next card that opponent uses is cancelled",
        ];

        //unlockable
        cards.push(new Card
            (
                CardType.brokenTeleporter,
                "Broken Teleporter",
                "Teleports you to a random square on the board",
                () => this.brokenTeleporter()
            ));

        cards.push(new Card
            (
                CardType.brokenTeleporterForOpponent,
                "Broken Teleporter for opponent",
                "Teleports your opponent to a random square on the board",
                () => this.brokenTeleporterForOpponent()
            ));

        let unlockable: string[] = [
            "resurrect card from graveyard",
            "move all used cards back to deck",
            "glue - when opponent moves onto square, their current turn ends",
            "hidden teleporter - when opponent moves onto square, they teleport back 10 squares",
            "swap saved cards",
            "swap Decks",
            "swap active cards",
            "remove opponents active cards",
            "untrap - removes first trap that is triggered",
            "one way only - when placed on a square, we cannot be moved backwards past this point, (except for by teleportation",
            "swap positions"
        ];

        return cards;
    }

    static doubleDice3() {
        let currentGameService = AppInjector.get(CurrentGameService);
        let player: Player = currentGameService.getCurrentPlayer();
        
        //really need to store these so that we can quit halfway through
        //and save the game state
        //same with the draw 2 card
        //we the best option would be to store tha actual card on the deck
        //that way we can deserialize it and use it
        //so how is that going to work for the whole callback stuff
        //as the callback chooses to hook into the callback
        //so and when we call doubleDice3 we don't have a link to the card that was used
        //almost like we need to pass in the card instance through to the method
        //or if not the card instance
        //then just a data object that can be used to save and load data from and too
        //maybe the whole card would be best
        //as we will need to store the card type along with the data for easier deserialization
        
        //we are also going to need multiple 'current drawn cards' stored on the game
        //for example, if the user has "draw 2" twice
        //or maybe that should be stored as an active card instead?
        //maybe we can do away with the "current drawn cards" property

        //so what is our flow gonna be?
        //well we have two flows:
        //we use a card
        //we get it's card instance 
        //and call the function with the instance
        //if it's an active card then we push the instance onto the active cards
        //this will mean rebuilding the deck to store card instances instead of cardTypes
        //but that's not necessarily a bad thing
        //although if we are starting to store data on the cards
        //then we will need seperate instances
        //so Card will have to be a factory
        //rather than just a list
        //this is actually a really good idea
        //as then active cards can change their own descriptions
        //i.e. they can say how many turns they have left
        //need to ensure they only do this in the callback
        //and not the action function itself
        //as that might multiple times
        //if we are serializing and deserializing a lot
        //as the modified description will get saved out
        
        //then for the deserialization flow
        //clone the active cards
        //then clear it
        //and call the functions with their instances
        
        //we can probably be a bit clever here
        //instead of doing card.apply(card)
        //we can just call card.apply()
        //and it passes itself to the function

        //so first things first
        //really
        //is to rework the draw 2 as an active card
        //as technically it is

        let count = 0;

        let callback = (command: GameCommand) => {
            if (currentGameService.getCurrentPlayer() != player) {
                return;
            }

            if (command.type == GameCommandType.ROLLED) {
                command.data *= 2;
                count++;

                if(count == 3) {
                    player.activeCards.removeFirstCardOfType(CardType.doubleDice3);
                    _.remove(currentGameService.preProcess, x => x == callback);
                }
            }
        };
        
        player.activeCards.putCardOnTop(CardType.doubleDice3);

        currentGameService.cardUsed();
        currentGameService.preProcess.push(callback);
    }

    static doubleDice() {
        let currentGameService = AppInjector.get(CurrentGameService);
        let player: Player = currentGameService.getCurrentPlayer();

        let callback = (command: GameCommand) => {
            if (currentGameService.getCurrentPlayer() != player) {
                return;
            }

            if (command.type == GameCommandType.ROLLED) {
                command.data *= 2;
                player.activeCards.removeFirstCardOfType(CardType.doubleDice);
                _.remove(currentGameService.preProcess, x => x == callback);
            }
        };

        player.activeCards.putCardOnTop(CardType.doubleDice);

        currentGameService.preProcess.push(callback);
        currentGameService.cardUsed();
    }

    static brokenTeleporterForOpponent() {
        let currentGameService = AppInjector.get(CurrentGameService);

        //don't want to be able to teleport to 99
        let position = Math.floor(Math.random() * 99);
        currentGameService.teleportCounter(flipColor(currentGameService.currentGame.currentTurnColor), position);

        currentGameService.cardUsed();
    }

    static brokenTeleporter() {
        let currentGameService = AppInjector.get(CurrentGameService);

        //don't want to be able to teleport to 99
        let position = Math.floor(Math.random() * 99);
        currentGameService.teleportCounter(currentGameService.currentGame.currentTurnColor, position);

        currentGameService.cardUsed();
    }

    static extraRoll() {
        let currentGameService = AppInjector.get(CurrentGameService);

        let callback = (command: GameCommand) => {
            if (command.type == GameCommandType.MOVED) {
                player.savedCards = tempSavedCards;
                currentGameService.currentGame.changePhase(tempPhase);

                _.remove(currentGameService.postProcess, x => x == callback);
                currentGameService.cardUsed();
            }
        };

        currentGameService.postProcess.push(callback);

        //as we are moving back to the preroll phase
        //we want to disable the saved cards
        let player: Player = currentGameService.getCurrentPlayer();
        let tempSavedCards = player.savedCards;
        player.savedCards = new Deck(DeckType.saved, []);

        let tempPhase = currentGameService.currentGame.currentPhase;
        currentGameService.currentGame.changePhase(TurnPhase.preroll);
        currentGameService.roll();
    }

    static draw2() {
        let currentGameService = AppInjector.get(CurrentGameService);
        let player: Player = currentGameService.getCurrentPlayer();
        let numCardsDrawn = 0;

        let callback = (command: GameCommand) => {
            switch (command.type) {
                case GameCommandType.CARD_USED:
                case GameCommandType.SAVE_CARD:
                    numCardsDrawn++;

                    if (numCardsDrawn == 2) {
                        currentGameService.currentGame.changePhase(TurnPhase.drawn);
                        
                        _.remove(currentGameService.postProcess, x => x == callback);
                        player.activeCards.removeFirstCardOfType(CardType.draw2);
                    } else {
                        currentGameService.currentGame.changePhase(TurnPhase.predraw);
                    }
                    break;
            }
        };

        player.activeCards.putCardOnTop(CardType.draw2);
        currentGameService.currentGame.changePhase(TurnPhase.predraw);

        currentGameService.cardUsed();

        //need add the callback after we have used the card
        //otherwise the command will come through in the above callback
        //we can still gaurentee that the callback will be hooked up before the idle notification fires
        //as that is async
        currentGameService.postProcess.push(callback);
    }

    static nothing() {
        let currentGameService = AppInjector.get(CurrentGameService);
        currentGameService.cardUsed();
    }

    static moveThem(amount: number) {
        let currentGameService = AppInjector.get(CurrentGameService);

        let callback = (command: GameCommand) => {
            if (command.type == GameCommandType.MOVED) {
                _.remove(currentGameService.postProcess, x => x == callback);
                currentGameService.cardUsed();
            }
        };

        currentGameService.postProcess.push(callback);

        currentGameService.moveCounterByAmount(flipColor(currentGameService.currentGame.currentTurnColor), amount);
    }

    static moveUs(amount: number) {
        let currentGameService = AppInjector.get(CurrentGameService);

        let callback = (command: GameCommand) => {
            if (command.type == GameCommandType.MOVED) {
                _.remove(currentGameService.postProcess, x => x == callback);
                currentGameService.cardUsed();
            }
        };

        currentGameService.postProcess.push(callback);

        currentGameService.moveCounterByAmount(currentGameService.currentGame.currentTurnColor, amount);
    }
}
