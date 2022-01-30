import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentGameService } from '../services/current-game.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  constructor(
    public currentGameService: CurrentGameService,
    private router: Router) { }

  ngOnInit(): void {
    if (!this.currentGameService.currentGame) {
      this.router.navigateByUrl("");
    } else {
      setTimeout(() => {
        this.currentGameService.startGame();
      }, 100);
    }
  }
}
