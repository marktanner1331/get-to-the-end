import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';
import { DiceRollerComponent } from "./dice-roller.component";

@Injectable({
    providedIn: 'root'
})
export class DiceRollerService {
    diceRollercomponent!: DiceRollerComponent;

    rollRandom(): Observable<number> {
        let value = Math.floor(Math.random() * 6) + 1;
        return this.diceRollercomponent.startRolling(value, 600)
            .pipe(map(() => value));
    }

    reset() {
        this.diceRollercomponent.value = 0;
    }
}