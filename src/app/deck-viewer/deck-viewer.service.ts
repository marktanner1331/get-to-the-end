import { Injectable } from "@angular/core";
import { Deck } from "../models/deck";
import { DeckViewerComponent } from "./deck-viewer.component";

@Injectable({
    providedIn: 'root'
})
export class DeckViewerService {
    deckViewerComponent!: DeckViewerComponent;

    show(deck: Deck) {
        this.deckViewerComponent.show(deck);
    }
}