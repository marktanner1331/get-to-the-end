import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { CounterColor } from '../models/counter-color';
import { Deck, DeckType } from '../models/deck';
import { Difficulty } from '../models/Difficulty';
import { Game } from '../models/game';
import { Player } from '../models/player';
import { Saver } from '../models/Saver';
import { CurrentGameService } from '../services/current-game.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  Difficulty: typeof Difficulty = Difficulty;
  
  constructor(private currentGameService: CurrentGameService, private router:Router) { }

  ngOnInit(): void {
  }


  onNewGameClick():void {
    this.router.navigateByUrl("/new-game");
  }

  listAllExistingGames() : Game[] {
    return Saver.listAllGames();
  }

  playExisting(game: Game) {
    this.currentGameService.reset();
    this.currentGameService.currentGame = game;
    
    this.router.navigateByUrl("/game");
  }
}
