import { Component, HostListener } from '@angular/core';
import { CounterColor } from './models/counter-color';
import { Deck } from './models/deck';
import { Game } from './models/game';
import { Player } from './models/player';
import { CurrentGameService } from './services/current-game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'get-to-the-end';

  constructor(private currentGame: CurrentGameService) {
    currentGame.currentGame = new Game();
    currentGame.currentGame.players.set(CounterColor.green, new Player(CounterColor.green, "us", new Deck()));
    currentGame.currentGame.players.set(CounterColor.yellow, new Player(CounterColor.yellow, "them", new Deck()));
  }
}
