import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CounterColor } from '../models/counter-color';
import { Deck, DeckType } from '../models/deck';
import { Game } from '../models/game';
import { Player } from '../models/player';
import { CurrentGameService } from '../services/current-game.service';

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.css']
})
export class JoinComponent implements OnInit {

  constructor(private currentGameService: CurrentGameService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    let gameId: string = this.route.snapshot.queryParams["id"];

    this.currentGameService.reset();
    this.currentGameService.currentGame = new Game(gameId);
    this.currentGameService.currentGame.players.set(CounterColor.green, new Player(CounterColor.green, "us", new Deck(DeckType.unused)));
    this.currentGameService.currentGame.players.set(CounterColor.yellow, new Player(CounterColor.yellow, "them", new Deck(DeckType.unused)));

    this.currentGameService.currentGame.isRemote = true;
    this.currentGameService.currentGame.isHost = false;
    this.currentGameService.currentGame.hasStarted = true;

    this.router.navigateByUrl("/game");
  }
}
