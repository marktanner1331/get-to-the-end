import { Component, OnInit } from '@angular/core';
import { CurrentGameService } from '../services/current-game.service';
import { JoinLinkService } from './join-link.service';

@Component({
  selector: 'app-join-link',
  templateUrl: './join-link.component.html',
  styleUrls: ['./join-link.component.css']
})
export class JoinLinkComponent implements OnInit {
  display: boolean = false;
  link!: string;

  constructor(joinLinkService: JoinLinkService, private currentGameService: CurrentGameService) {
    joinLinkService.joinLinkComponent = this;
  }

  ngOnInit(): void {
  }

  show() {
    this.display = true;
    this.link = window.location.origin + "/join?id=" + this.currentGameService.currentGame.gameId;
  }

  close() {
    console.log("close()");
    this.display = false;
  }
}
