import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { Observable, of, timer } from 'rxjs';
import { delay, map, share, tap } from 'rxjs/operators';
import { AppInjector } from "../app.module";
import { JoinLinkService } from '../join-link/join-link.service';
import { CurrentGameService } from "../services/current-game.service";
import { Game } from './game';
import { GameCommand, GameCommandType } from "./game-command";
import { TurnPhase } from './TurnPhase';

export class Remote {
    private httpClient: HttpClient = AppInjector.get(HttpClient);
    private apiBase: string = "https://localhost:44362/";

    private currentGameService!: CurrentGameService;

    private commandQueue: GameCommand[] = [];
    private updateObservable?: Observable<void>;
    private isIdle: boolean = false;

    init() {
        this.currentGameService = AppInjector.get(CurrentGameService);

        this.currentGameService.idle.push(() => {
            console.log("remote idle, our turn? " + this.currentGameService.IsOurTurn());
            if (!this.currentGameService.IsOurTurn()) {
                if(this.commandQueue.length) {
                    this.processRemoteCommand(this.commandQueue.shift()!);
                } else if(this.currentGameService.currentGame.currentPhase == TurnPhase.postdraw) {
                    this.currentGameService.endTurn();
                } else {
                    this.checkForUpdatesLooped();
                }
            }
        });

        //we want to push it right to the start of the preprocess
        //before anything has had a chance to fuck with it
        this.currentGameService.preProcess.unshift(x => this.processCommand(x));
    }

    checkForUpdatesLooped() {
        console.log("checkForUpdatesLooped()");
        this.checkForUpdates().subscribe(x => {
            if (this.commandQueue.length == 0) {
                setTimeout(() => this.checkForUpdatesLooped(), 500);
            } else {
                console.log("checkForUpdatesLooped() exit");
                this.processRemoteCommand(this.commandQueue.shift()!);
            }
        })
    }

    checkForUpdates(): Observable<void> {
        console.log("checkForUpdates()");
        if (this.commandQueue.length) {
            throw new Error("no need to check for updates as we still have some to process");
        }

        if (this.updateObservable) {
            throw new Error("currently updating");
        }

        this.updateObservable = this.httpClient.get<string[]>(this.apiBase + `api/game?skip=${this.currentGameService.currentGame?.numUpdates ?? 0}&gameid=${this.currentGameService.currentGame.gameId}`)
            .pipe(map(x => {
                this.updateObservable = undefined;
                this.currentGameService.currentGame.numUpdates += x.length;

                if (x.length) {
                    for (let command of x) {
                        this.commandQueue.push(GameCommand.fromJson(JSON.parse(command)));
                    }
                } 
            }));

        return this.updateObservable;
    }

    processRemoteCommand(command: GameCommand) {
        console.log("Processing remote command: " + command.toString());

        switch (command.type) {
            case GameCommandType.ROLLING:
                this.currentGameService.roll();
                break;
            case GameCommandType.DRAW_CARD:
                this.currentGameService.drawCard();
                break;
            case GameCommandType.SAVE_DRAWN_CARD:
                this.currentGameService.saveDrawnCard();
                break;
            case GameCommandType.USE_DRAWN_CARD:
                this.currentGameService.useDrawnCard();
                break;
            case GameCommandType.USE_SAVED_CARD:
                this.currentGameService.useSavedCard(command.data);
                break;
            default:
                break;
        }
    }

    processCommand(command: GameCommand) {
        if(command.type == GameCommandType.ROLLING && this.currentGameService.currentGame.currentPhase != TurnPhase.preroll) {
            //we are probably in the middle of a card
            //the command hasn't been user initiated
            //so we don't to send it
            //otherwise it will happen twice on the remote
            //i.e. once by the remote command, and once by the card
            //e.g. EXTRA_ROLL would roll twice
            return;
        }

        if (command.type == GameCommandType.START_GAME) {
            AppInjector.get(JoinLinkService).show();
            return;
        }

        if (this.currentGameService.IsOurTurn()) {
            console.log("processing command for remote: " + command.toString());

            switch (command.type) {
                case GameCommandType.ROLLING:
                    this.sendCommand(command);
                    break;
                case GameCommandType.DRAW_CARD:
                case GameCommandType.SAVE_DRAWN_CARD:
                case GameCommandType.USE_DRAWN_CARD:
                case GameCommandType.USE_SAVED_CARD:
                    this.sendCommand(command);
                    break;
            }

            return;
        }
    }

    sendCommand(command: GameCommand) {
        console.log("sending remote command: " + command.toString());
        this.httpClient.post<void>(
            this.apiBase + `api/game?skip=${this.currentGameService.currentGame.numUpdates}&gameid=${this.currentGameService.currentGame.gameId}`,
            JSON.stringify({
                command: JSON.stringify(command)
            }),
            {
                headers: {
                    'content-type': 'application/json'
                }
            })
            .subscribe();
        this.currentGameService.currentGame.numUpdates++;
    }
}
