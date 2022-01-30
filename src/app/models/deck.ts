import { AppInjector } from "../app.module";
import { CurrentGameService } from "../services/current-game.service";
import * as _ from 'lodash';
import { CounterColor, flipColor } from "./counter-color";
import { GameCommand, GameCommandType } from "./game-command";
import { TurnPhase } from "./TurnPhase";
import { Player } from "./player";

export class Deck {
    cards: Card[];

    constructor(public deckType: DeckType, cards?: Card[]) {
        if (cards) {
            this.cards = cards;
        } else {
            this.cards = CardFactory.cardTypes().map(x => CardFactory.getCard(x));
            Deck.shuffleArray(this.cards);
        }
    }

    get length(): number {
        return this.cards.length;
    }

    restoreCards() {
        this.cards.filter(x => x.active).forEach(x => x.restore());
    }

    removeFirstCardOfType(card: CardType) {
        let index = this.cards.findIndex(x => x.cardType == card);
        this.cards.splice(index, 1);
    }

    getCard(card: CardType): Card {
        return this.cards.find(x => x.cardType == card)!;
    }

    getCardFunction(card: CardType): () => void {
        return this.cards.find(x => x.cardType == card)!.action;
    }

    peekTopCard(): CardType {
        return this.cards[this.cards.length - 1].cardType;
    }

    removeTopCard(): Card {
        return this.cards.pop()!;
    }

    putCardOnBotton(card: Card) {
        this.cards.unshift(card);
    }

    putCardOnTop(card: Card) {
        this.cards.push(card);
    }

    static fromJson(json: any): Deck {
        let cards: Card[] = (json.cards as any[]).map(x => {
            let card = CardFactory.getCard(x.cardType);
            card.fromJson(x);
            return card;
        });

        return new Deck(json.deckTpe, cards);
    }

    toJson(): any {
        return {
            deckType: this.deckType,
            cards: this.cards.map(x => x.toJson())
        };
    }

    private static shuffleArray(array: any[]) {
        //todo maybe able to optimize
        //instead of having to send through the whole decks in START_GAME
        //we only need to send through a game id
        //and everything else can be generated from that
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
    doubleDice3,
    dieDoesNothing,
    swapPositions,
    //cancelNextCard,
    resurrectAll
}

export abstract class Card {
    //action is currently taking place
    active: boolean = false;

    constructor(public cardType: CardType, public title: string, public description: string) {
    }

    //card is used
    abstract action(): void;

    //active card is restored from a saved state
    abstract restore(): void;

    fromJson(json: any) {
        this.cardType = json.cardType;
        this.title = json.title;
        this.description = json.description;
        this.active = json.active;
    }

    toJson(): any {
        return {
            cardType: this.cardType,
            title: this.title,
            description: this.description,
            active: this.active
        }
    }
}

class TransientCard extends Card {
    constructor(public cardType: CardType, public title: string, public description: string, private _action: () => void) {
        super(cardType, title, description);
    }

    action(): void {
        this._action();
    }

    restore(): void {

    }
}

class ExtraRoll extends Card {
    player!: Player;
    tempSavedCards!: Deck;
    tempPhase!: TurnPhase;

    constructor() {
        super(CardType.extraRoll, "Extra Roll", "Roll the die and move the given amount.");
    }

    action(): void {
        let currentGameService = AppInjector.get(CurrentGameService);

        //as we are moving back to the preroll phase
        //we want to disable the saved cards
        this.player = currentGameService.getCurrentPlayer();
        this.tempSavedCards = this.player.savedCards;
        this.player.savedCards = new Deck(DeckType.saved, []);

        this.tempPhase = currentGameService.currentGame.currentPhase;

        this.restore();

        currentGameService.currentGame.changePhase(TurnPhase.preroll);
        currentGameService.roll();

    }

    restore(): void {
        let currentGameService = AppInjector.get(CurrentGameService);

        let callback = (command: GameCommand) => {
            if (command.type == GameCommandType.MOVED) {
                this.player.savedCards = this.tempSavedCards;
                currentGameService.currentGame.changePhase(this.tempPhase);

                _.remove(currentGameService.postProcess, x => x == callback);
                currentGameService.cardUsed();
            }
        };

        currentGameService.postProcess.push(callback);
    }

    override fromJson(json: any): void {
        super.fromJson(json);

        if (this.active) {
            let currentGameService = AppInjector.get(CurrentGameService);

            this.player = currentGameService.currentGame.players.get(json.playerColor)!;
            this.tempSavedCards = Deck.fromJson(json.tempSavedCards);
            this.tempPhase = json.tempPhase;
        }
    }

    override toJson() {
        let json = super.toJson();

        if (this.active) {
            json.playerColor = this.player.color;
            json.tempSavedCards = this.tempSavedCards.toJson();
            json.tempPhase = this.tempPhase;
        }

        return json;
    }
}

class Draw2 extends Card {
    player!: Player;
    numCardsDrawn: number = 0;

    constructor() {
        super(CardType.draw2, "Draw 2", "Draw 2 cards.",);
    }

    restore() {
        let callback = (command: GameCommand) => {
            switch (command.type) {
                case GameCommandType.CARD_USED:
                case GameCommandType.SAVE_DRAWN_CARD:
                    this.numCardsDrawn++;

                    if (this.numCardsDrawn == 2) {
                        currentGameService.currentGame.changePhase(TurnPhase.drawn);

                        _.remove(currentGameService.postProcess, x => x == callback);
                        this.player.activeCards.removeFirstCardOfType(CardType.draw2);
                    } else {
                        currentGameService.currentGame.changePhase(TurnPhase.predraw);
                    }
            }
        };

        let currentGameService = AppInjector.get(CurrentGameService);
        currentGameService.postProcess.push(callback);
    }

    action(): void {
        let currentGameService = AppInjector.get(CurrentGameService);
        this.player = currentGameService.getCurrentPlayer();
        this.numCardsDrawn = 0;

        this.player.activeCards.putCardOnTop(this);
        currentGameService.currentGame.changePhase(TurnPhase.predraw);

        currentGameService.cardUsed();

        //we add the callback after we have used the card
        //otherwise the command will come through in the above callback
        //we can still gaurentee that the callback will be hooked up before the idle notification fires
        //as that is async
        this.restore();
    }

    override fromJson(json: any): void {
        super.fromJson(json);

        if (this.active) {
            let currentGameService = AppInjector.get(CurrentGameService);
            this.player = currentGameService.currentGame.players.get(json.playerColor)!;
            this.numCardsDrawn = json.numCardsDrawn;
        }
    }

    override toJson() {
        let json = super.toJson();

        if (this.active) {
            json.playerColor = this.player.color;
            json.numCardsDrawn = this.numCardsDrawn;
        }

        return json;
    }
}

class DoubleDice extends Card {
    player!: Player;

    constructor() {
        super(CardType.doubleDice, "Double Die", "Double the die score for the next roll.");
    }

    action(): void {
        let currentGameService = AppInjector.get(CurrentGameService);
        this.player = currentGameService.getCurrentPlayer();

        this.restore();

        this.player.activeCards.putCardOnTop(this);
        currentGameService.cardUsed();
    }

    restore(): void {
        let currentGameService = AppInjector.get(CurrentGameService);

        let callback = (command: GameCommand) => {
            if (currentGameService.getCurrentPlayer() != this.player) {
                return;
            }

            if (command.type == GameCommandType.ROLLED) {
                command.data *= 2;
                this.player.activeCards.removeFirstCardOfType(CardType.doubleDice);
                _.remove(currentGameService.preProcess, x => x == callback);
            }
        };

        currentGameService.preProcess.push(callback);
    }

    override fromJson(json: any): void {
        super.fromJson(json);

        if (this.active) {
            let currentGameService = AppInjector.get(CurrentGameService);
            this.player = currentGameService.currentGame.players.get(json.playerColor)!;
        }
    }

    override toJson() {
        let json = super.toJson();

        if (this.active) {
            json.playerColor = this.player.color;
        }

        return json;
    }
}

class DieDoesNothing extends Card {
    player!: Player;

    constructor() {
        super(CardType.dieDoesNothing, "Die does nothing", "Die roll does nothing for opponents next turn.");
    }

    action(): void {
        let currentGameService = AppInjector.get(CurrentGameService);
        this.player = currentGameService.getCurrentPlayer();

        this.player.activeCards.putCardOnTop(this);
        this.restore();

        currentGameService.cardUsed();
    }

    restore(): void {
        let currentGameService = AppInjector.get(CurrentGameService);

        let callback = (command: GameCommand) => {
            //only applies to opponent
            if (currentGameService.getCurrentPlayer() == this.player) {
                return;
            }

            if (command.type == GameCommandType.ROLLED) {
                command.data = 0;
                this.player.activeCards.removeFirstCardOfType(CardType.dieDoesNothing);
                _.remove(currentGameService.preProcess, x => x == callback);
            }
        };

        currentGameService.preProcess.push(callback);
    }

    override fromJson(json: any): void {
        super.fromJson(json);

        if (this.active) {
            let currentGameService = AppInjector.get(CurrentGameService);
            this.player = currentGameService.currentGame.players.get(json.playerColor)!;
        }
    }

    override toJson() {
        let json = super.toJson();

        if (this.active) {
            json.playerColor = this.player.color;
        }

        return json;
    }
}

class DoubleDice3 extends Card {
    player!: Player;
    count: number = 0;

    constructor() {
        super(CardType.doubleDice3, "Double Die for 3 turns", "Double the die score for the next three rolls.");
    }

    action(): void {
        let currentGameService = AppInjector.get(CurrentGameService);
        this.player = currentGameService.getCurrentPlayer();

        this.restore();

        this.player.activeCards.putCardOnTop(this);
        currentGameService.cardUsed();
    }

    restore(): void {
        let currentGameService = AppInjector.get(CurrentGameService);

        let callback = (command: GameCommand) => {
            if (currentGameService.getCurrentPlayer() != this.player) {
                return;
            }

            if (command.type == GameCommandType.ROLLED) {
                command.data *= 2;
                this.count++;

                if (this.count == 3) {
                    this.player.activeCards.removeFirstCardOfType(CardType.doubleDice3);
                    _.remove(currentGameService.preProcess, x => x == callback);
                }
            }
        };

        currentGameService.preProcess.push(callback);
    }

    override fromJson(json: any): void {
        super.fromJson(json);

        if (this.active) {
            let currentGameService = AppInjector.get(CurrentGameService);
            this.player = currentGameService.currentGame.players.get(json.playerColor)!;
            this.count = json.count;
        }
    }

    override toJson() {
        let json = super.toJson();

        if (this.active) {
            json.playerColor = this.player.color;
            json.count = this.count;
        }

        return json;
    }
}

class BrokenTeleporter extends Card {
    constructor() {
        super(CardType.brokenTeleporter, "Random Teleporter", "Teleports you to a random square on the board.");
    }

    action(): void {
        let currentGameService = AppInjector.get(CurrentGameService);

        //don't want to be able to teleport to 99
        let location = Math.floor(currentGameService.currentGame.nextRand() * 99);
        currentGameService.teleportCounter(currentGameService.currentGame.currentTurnColor, location);

        currentGameService.cardUsed();
    }
    restore(): void {
    }
}

class BrokenTeleporterForOpponent extends Card {
    constructor() {
        super(CardType.brokenTeleporterForOpponent, "Random Teleporter for opponent", "Teleports your opponent to a random square on the board.");
    }

    action(): void {
        let currentGameService = AppInjector.get(CurrentGameService);

        //don't want to be able to teleport to 99
        let location = Math.floor(currentGameService.currentGame.nextRand() * 99);
        currentGameService.teleportCounter(flipColor(currentGameService.currentGame.currentTurnColor), location);

        currentGameService.cardUsed();
    }

    restore(): void {
    }
}

export class CardFactory {
    static cardTypes(): CardType[] {
        return Object.keys(CardType)
            .map(x => Number(x))
            .filter((x) => !isNaN(x));
    }

    static getCard(cardType: CardType): Card {
        switch (cardType) {
            case CardType.forward1:
                return new TransientCard(
                    CardType.forward1,
                    "Forward 1",
                    "Move Forward 1 square.",
                    () => this.moveUs(1)
                );
            case CardType.forward3:
                return new TransientCard(
                    CardType.forward3,
                    "Forward 3",
                    "Move Forward 3 squares.",
                    () => this.moveUs(3)
                );
            case CardType.forward5:
                return new TransientCard(
                    CardType.forward5,
                    "Forward 5",
                    "Move Forward 5 squares.",
                    () => this.moveUs(5)
                );
            case CardType.nothing:
                return new TransientCard(
                    CardType.nothing,
                    "Nothing",
                    "This card does nothing.",
                    () => this.nothing()
                );
            case CardType.back1:
                return new TransientCard(
                    CardType.back1,
                    "Opponent back 1",
                    "Move our opponent back 1 square.",
                    () => this.moveThem(-1)
                );
            case CardType.back3:
                return new TransientCard(
                    CardType.back3,
                    "Opponent back 3",
                    "Move our opponent back 3 squares.",
                    () => this.moveThem(-3)
                );
            case CardType.back5:
                return new TransientCard(
                    CardType.back5,
                    "Opponent back 5",
                    "Move our opponent back 5 squares.",
                    () => this.moveThem(-5)
                );
            case CardType.draw2:
                return new Draw2();
            case CardType.extraRoll:
                return new ExtraRoll();
            case CardType.doubleDice:
                return new DoubleDice();
            case CardType.doubleDice3:
                return new DoubleDice3();
            case CardType.dieDoesNothing:
                return new DieDoesNothing();
            case CardType.brokenTeleporter:
                return new BrokenTeleporter();
            case CardType.brokenTeleporterForOpponent:
                return new BrokenTeleporterForOpponent();
            case CardType.swapPositions:
                return new TransientCard(
                    CardType.swapPositions,
                    "Swap Positions",
                    "Swaps the positions of the pieces on the board.",
                    () => this.swapPositions()
                );
            case CardType.resurrectAll:
                return new TransientCard(
                    CardType.resurrectAll,
                    "Resurrect All",
                    "Move all used cards back to draw deck.",
                    () => this.resurrectAll()
                );
            default:
                throw new Error("unknown card: " + CardType[cardType]);
        }

        // cards.push(new Card
        //     (
        //         CardType.cancelNextCard,
        //         "Cancel next card",
        //         "The next card that our opponent uses is cancelled.",
        //         () => this.cancelNextCard()
        //     ));

        let unlockable: string[] = [
            "resurrect card from graveyard",
            "glue - when opponent moves onto square, their current turn ends",
            "hidden teleporter - when opponent moves onto square, they teleport back 10 squares",
            "swap saved cards",
            "swap Decks",
            "swap active cards",
            "remove opponents active cards",
            "untrap - removes first trap that is triggered",
            "one way only - when placed on a square, we cannot be moved backwards past this point, (except for by teleportation"
        ];
    }

    private static resurrectAll() {
        let currentGameService = AppInjector.get(CurrentGameService);
        let player: Player = currentGameService.getCurrentPlayer();

        player.deck.cards = player.discardedCards.cards.concat(player.deck.cards);
        currentGameService.cardUsed();
    }

    private static swapPositions() {
        let currentGameService = AppInjector.get(CurrentGameService);

        let greenPlayerPos = currentGameService.currentGame.players.get(CounterColor.green)!.position;
        let yellowPlayerPos = currentGameService.currentGame.players.get(CounterColor.yellow)!.position;

        currentGameService.teleportCounter(CounterColor.green, yellowPlayerPos);
        currentGameService.teleportCounter(CounterColor.yellow, greenPlayerPos);

        currentGameService.cardUsed();
    }

    private static nothing() {
        let currentGameService = AppInjector.get(CurrentGameService);
        currentGameService.cardUsed();
    }

    private static moveThem(amount: number) {
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

    private static moveUs(amount: number) {
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
