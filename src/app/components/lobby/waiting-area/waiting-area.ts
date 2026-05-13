import {Component, computed, inject, signal} from '@angular/core';
import {Session, SessionService} from "../../../services/session.service";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzTagComponent} from "ng-zorro-antd/tag";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {PlayerList} from "../../player-list/player-list";
import {NzModalModule} from "ng-zorro-antd/modal";
import {VoteType} from "../../../services/vote.service";

@Component({
    selector: 'app-waiting-area',
  imports: [
    NzIconDirective,
    NzTagComponent,
    NzButtonComponent,
    PlayerList,
    NzModalModule,
  ],
    templateUrl: './waiting-area.html',
    styleUrl: './waiting-area.scss',
})
export class WaitingArea {
    sessionService: SessionService = inject(SessionService);

    protected copyLabel = signal('Copy Code');
    protected voteTypeModalVisible = false;

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

    protected openVoteTypeModal() {
        this.voteTypeModalVisible = true;
    }

    protected startVote(type: VoteType) {
        this.voteTypeModalVisible = false;
        this.sessionService.startVote(type).then();
    }

    protected takeSpeaker() {
        this.sessionService.takeSpeaker();
    }
}
