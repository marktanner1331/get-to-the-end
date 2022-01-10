import { Injectable } from "@angular/core";
import { BoardComponent } from "./board.component";

@Injectable({
    providedIn: 'root'
})
export class BoardService {
    boardComponent!:BoardComponent;

    get greenCounterPos():number {
        return this.boardComponent.greenCounterPos;
    }

    set greenCounterPos(value: number) {
        this.boardComponent.greenCounterPos = value;
        this.boardComponent.resetCounterPositions();
    }

    get yellowCounterPos():number {
        return this.boardComponent.yellowCounterPos;
    }

    set yellowCounterPos(value: number) {
        this.boardComponent.yellowCounterPos = value;
        this.boardComponent.resetCounterPositions();
    }
}