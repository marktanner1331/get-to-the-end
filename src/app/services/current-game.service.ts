import { Injectable } from '@angular/core';
import { BoardService } from '../board/board.service';
import { CounterColor } from '../models/counter-color';
import { Game } from '../models/game';
import { GameCommand, GameCommandType } from '../models/game-command';

@Injectable({
  providedIn: 'root'
})
export class CurrentGameService {
  currentGame!: Game;

  constructor(private boardService: BoardService) { }

  moveCounterByAmount(color: CounterColor, amount: number) {
    let command: GameCommand = new GameCommand(GameCommandType.MOVE_COUNTER, {
      color: color
    });

    if(color == CounterColor.green) {
      command.data.position = this.currentGame.greenCounterPos + amount;
    } else {
      command.data.position = this.currentGame.yellowCounterPos + amount;
    }

    //also need to save
    this.currentGame.processCommand(command);

    if(color == CounterColor.green) {
      this.boardService.greenCounterPos = command.data.position;
    } else {
      this.boardService.yellowCounterPos = command.data.position;
    }
  }
}
