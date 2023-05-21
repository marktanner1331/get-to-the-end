import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './game/game.component';
import { JoinComponent } from './join/join.component';
import { MenuComponent } from './menu/menu.component';
import { NewGameMenuComponent } from './new-game-menu/new-game-menu.component';

const routes: Routes = [
  { path: '', component: MenuComponent },
  { path: 'game', component: GameComponent },
  { path: 'new-game', component: NewGameMenuComponent },
  { path: 'join', component: JoinComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
