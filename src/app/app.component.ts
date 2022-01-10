import { Component, HostListener } from '@angular/core';
import { CounterColor } from './models/counter-color';
import { Game } from './models/game';
import { CurrentGameService } from './services/current-game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'get-to-the-end';

  @HostListener('click', ['$event.target'])
  onClick(target:any) {
    console.log("clicked");
    this.currentGame.moveCounterByAmount(CounterColor.green, 1);
  }

  constructor(private currentGame: CurrentGameService) {
    currentGame.currentGame = new Game();
  }
}
