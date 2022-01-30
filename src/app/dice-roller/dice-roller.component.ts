import { Component, HostBinding, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GameCommand, GameCommandType } from '../models/game-command';
import { CurrentGameService } from '../services/current-game.service';

@Component({
  selector: 'app-dice-roller',
  templateUrl: './dice-roller.component.html',
  styleUrls: ['./dice-roller.component.css']
})
export class DiceRollerComponent implements OnInit {
  public rolling: boolean = false;
  public value: number = 0;

  constructor(private currentGameService: CurrentGameService) {
    currentGameService.postProcess.push(x => this.processCommand(x));
  }

  processCommand(command: GameCommand) {
    if (command.type == GameCommandType.ROLLING) {
      let value = Math.floor(this.currentGameService.currentGame.nextRand() * 6) + 1;

      this.startRolling(value, 600).subscribe(() => {
        this.currentGameService.processCommand(new GameCommand(GameCommandType.ROLLED, this.value));
      });
    }
  }

  ngOnInit(): void {
  }

  private imageArray: number[] = [1, 2, 3, 4, 5, 6];

  @HostBinding('style.--img0')
  public get img0(): string {
    return `url("assets/dice/${this.value}.png")`;
  }

  @HostBinding('style.--img1')
  private get img1(): string {
    return `url("assets/dice/${this.imageArray[0]}.png")`;
  }

  @HostBinding('style.--img2')
  private get img2(): string {
    return `url("assets/dice/${this.imageArray[1]}.png")`;
  }

  @HostBinding('style.--img3')
  private get img3(): string {
    return `url("assets/dice/${this.imageArray[2]}.png")`;
  }

  @HostBinding('style.--img4')
  private get img4(): string {
    return `url("assets/dice/${this.imageArray[3]}.png")`;
  }

  @HostBinding('style.--img5')
  private get img5(): string {
    return `url("assets/dice/${this.imageArray[4]}.png")`;
  }

  @HostBinding('style.--img6')
  private get img6(): string {
    return `url("assets/dice/${this.imageArray[5]}.png")`;
  }

  shuffle(array: any[]) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }

  startRolling(value: number, rollDurationMS: number): Observable<any> {
    return new Observable(x => {
      this.value = value;

      this.shuffle(this.imageArray);
      this.rolling = true;

      setTimeout(() => {
        this.rolling = false;
        x.next();
        x.complete();
      }, rollDurationMS);
    });
  }
}
