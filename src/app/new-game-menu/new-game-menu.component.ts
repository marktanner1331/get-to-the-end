import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { CounterColor } from '../models/counter-color';
import { Deck, DeckType } from '../models/deck';
import { Difficulty } from '../models/Difficulty';
import { Game } from '../models/game';
import { Player } from '../models/player';
import { CurrentGameService } from '../services/current-game.service';

@Component({
  selector: 'app-new-game-menu',
  templateUrl: './new-game-menu.component.html',
  styleUrls: ['./new-game-menu.component.css']
})
export class NewGameMenuComponent implements OnInit {
  Difficulty: typeof Difficulty = Difficulty;

  constructor(private currentGameService: CurrentGameService, private router:Router) { }

  ngOnInit(): void {
  }

  onNewGameClick(Difficulty: Difficulty):void {
    this.currentGameService.reset();
    this.currentGameService.createNewLocalGame(2, CounterColor.green);
    this.router.navigateByUrl("/game");
  }

  onNewMultiplayerGameClick() {
    // this.currentGameService.reset();
    // this.currentGameService.currentGame = new Game(Guid.create().toString());
    // this.currentGameService.currentGame.players.set(CounterColor.green, new Player(CounterColor.green, "us", new Deck(DeckType.unused)));
    // this.currentGameService.currentGame.players.set(CounterColor.yellow, new Player(CounterColor.yellow, "them", new Deck(DeckType.unused)));

    // this.currentGameService.currentGame.isRemote = true;

    // this.router.navigateByUrl("/game");
  }
}
