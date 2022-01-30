import { Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BoardComponent } from './board/board.component';
import { GameComponent } from './game/game.component';
import { ControlPanelComponent } from './control-panel/control-panel.component';
import { DiceRollerComponent } from './dice-roller/dice-roller.component';
import { CardViewerComponent } from './card-viewer/card-viewer.component';
import { DeckViewerComponent } from './deck-viewer/deck-viewer.component';
import { DeckViewerCardComponent } from './deck-viewer-card/deck-viewer-card.component';
import { GameOverComponent } from './game-over/game-over.component';
import { MenuComponent } from './menu/menu.component';
import { JoinComponent } from './join/join.component';
import { JoinLinkComponent } from './join-link/join-link.component';

export let AppInjector: Injector;

@NgModule({
  declarations: [
    AppComponent,
    BoardComponent,
    GameComponent,
    ControlPanelComponent,
    DiceRollerComponent,
    CardViewerComponent,
    DeckViewerComponent,
    DeckViewerCardComponent,
    GameOverComponent,
    MenuComponent,
    JoinComponent,
    JoinLinkComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { 
  constructor(private injector: Injector) {
    AppInjector = this.injector;
  }
}
