import {Component, computed, inject, signal} from '@angular/core';
import {Session, SessionService} from "../../../services/session.service";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzTagComponent} from "ng-zorro-antd/tag";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {PlayerList} from "../../player-list/player-list";

@Component({
    selector: 'app-waiting-area',
  imports: [
    NzIconDirective,
    NzTagComponent,
    NzButtonComponent,
    PlayerList
  ],
    templateUrl: './waiting-area.html',
    styleUrl: './waiting-area.scss',
})
export class WaitingArea {
    sessionService: SessionService = inject(SessionService);

    protected copyLabel = signal('Copy Code');

    get session(): Session | null | undefined {
        return this.sessionService.session();
    }

    protected players = computed(() => {
        if (!this.session) {
            return null;
        }
        return Object.entries(this.session!.players)
            .map(([id, info]) => ({id, info}));
    });

    protected copyCode() {
        if (!this.session) {
            return;
        }
        navigator.clipboard.writeText(this.session!.id).then(() => {
            this.copyLabel.set('Copied!');
            setTimeout(() => this.copyLabel.set('Copy Code'), 2000);
        });
    }

    protected startVote() {
        // TODO open dialog to chose which agenda
        this.sessionService.startVote().then();
    }

    protected takeSpeaker() {
        this.sessionService.takeSpeaker();
    }
}
