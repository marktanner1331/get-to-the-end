import { Injectable } from "@angular/core";
import { JoinLinkComponent } from "./join-link.component";

@Injectable({
    providedIn: 'root'
})
export class JoinLinkService {
    joinLinkComponent!: JoinLinkComponent;

    show() {
        this.joinLinkComponent.show();
    }
}