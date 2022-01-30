import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    this.currentGameService.remote.joinRemoteGame(gameId)
      .subscribe(() => {
        this.router.navigateByUrl("/game");
      });
  }
}
