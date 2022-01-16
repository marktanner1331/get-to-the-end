import { CounterColor } from "./counter-color";
import { Deck, DeckType } from "./deck";

export class Player {
    public position: number = 0;
    public color: CounterColor;
    public name: string;
    public deck: Deck;
    public savedCards: Deck = new Deck(DeckType.saved, []);
    public discardedCards: Deck = new Deck(DeckType.used, []);
    public activeCards: Deck = new Deck(DeckType.active, []);

    constructor(color: CounterColor, name: string, deck: Deck) {
        this.color = color;
        this.name = name;
        this.deck = deck;
    }
}
