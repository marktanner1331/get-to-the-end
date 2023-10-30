import { CounterColor } from "./counter-color";
import { Deck, DeckType } from "./deck";

export class Player {
    public position: number = 0;
    public color: CounterColor;
    public deck: Deck;
    public savedCards: Deck = new Deck(DeckType.saved, []);
    public discardedCards: Deck = new Deck(DeckType.used, []);
    public activeCards: Deck = new Deck(DeckType.active, []);

    constructor(color: CounterColor, deck: Deck) {
        this.color = color;
        this.deck = deck;
    }

    static fromJson(json: any): Player {
        let player: Player = new Player(json.color, Deck.fromJson(json.deck));

        player.position = json.position;
        player.savedCards = Deck.fromJson(json.savedCards);
        player.discardedCards = Deck.fromJson(json.discardedCards);
        player.activeCards = Deck.fromJson(json.activeCards);

        return player;
    }

    toJson() {
        return {
            position: this.position,
            color: this.color,
            deck: this.deck.toJson(),
            savedCards: this.savedCards.toJson(),
            discardedCards: this.discardedCards.toJson(),
            activeCards: this.activeCards.toJson()
        };
    }
}
