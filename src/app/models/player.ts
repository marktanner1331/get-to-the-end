import { CounterColor } from "./counter-color";
import { Deck } from "./deck";

export class Player {
    public position: number = 0;
    public color: CounterColor;
    public name: string;
    public deck: Deck;
    public savedCards: Deck = new Deck([]);
    public discardedCards: Deck = new Deck([]);
    public activeCards: Deck = new Deck([]);

    constructor(color: CounterColor, name: string, deck: Deck) {
        this.color = color;
        this.name = name;
        this.deck = deck;
    }
}
