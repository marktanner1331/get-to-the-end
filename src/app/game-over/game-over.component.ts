import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameCommand, GameCommandType } from '../models/game-command';
import { CurrentGameService } from '../services/current-game.service';

@Component({
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.css']
})
export class GameOverComponent implements OnInit {
  display: boolean = false;
  description: string = "";

  constructor(private currentGameService: CurrentGameService, private router:Router) {
    currentGameService.postProcess.push(command => this.processCommand(command));
  }

  processCommand(command: GameCommand) {
    if(command.type == GameCommandType.GAME_COMPLETE) {
      this.display = true;
      console.log("complete");
      if(command.data == this.currentGameService.getOurColor()) {
        this.description = "Congratulations, you won!";
      } else {
        this.description = "unlucky, you lost!";
      }
    }
  }

  ngOnInit(): void {
  }

  ok() {
    this.display = false;
    this.router.navigateByUrl("/");
  }
}
