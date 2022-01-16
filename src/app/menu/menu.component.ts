import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CounterColor } from '../models/counter-color';
import { Deck, DeckType } from '../models/deck';
import { Difficulty } from '../models/Difficulty';
import { Game } from '../models/game';
import { Player } from '../models/player';
import { CurrentGameService } from '../services/current-game.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  Difficulty: typeof Difficulty = Difficulty;
  
  constructor(private currentGame: CurrentGameService, private router:Router) { }

  ngOnInit(): void {
  }

  onNewGameClick(difficulty:Difficulty):void {
    this.currentGame.currentGame = new Game();
    this.currentGame.currentGame.players.set(CounterColor.green, new Player(CounterColor.green, "us", new Deck(DeckType.unused)));
    this.currentGame.currentGame.players.set(CounterColor.yellow, new Player(CounterColor.yellow, "them", new Deck(DeckType.unused)));

    this.router.navigateByUrl("/game");
  }
}
