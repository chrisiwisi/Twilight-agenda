import {Component, effect, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzListModule} from 'ng-zorro-antd/list';
import {NzTagModule} from 'ng-zorro-antd/tag';
import {SessionService} from '../../services/session.service';
import {WaitingArea} from "./waiting-area/waiting-area";
import {VotingArea} from "./voting-area/voting-area";
import {ResultsArea} from "./results-area/results-area";

@Component({
    selector: 'app-lobby',
    standalone: true,
    imports: [NzButtonModule, NzIconModule, NzListModule, NzTagModule, WaitingArea, VotingArea, ResultsArea],
    templateUrl: './lobby.component.html',
    styleUrl: './lobby.component.scss',
})
export class LobbyComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    protected sessionService = inject(SessionService);

    protected sessionId = '';

    constructor() {
        effect(() => {
            if (this.sessionId && this.sessionService.session() === null) {
                this.router.navigate(['/']).then();
            }
        });
    }

    ngOnInit() {
        this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';
        this.sessionService.joinSession(this.sessionId).then(found => {
            if (!found) this.router.navigate(['/']).then();
        });
    }

    protected async leaveLobby() {
        await this.sessionService.leaveSession();
        await this.router.navigate(['/']);
    }

    protected share() {
        navigator.share({
            title: this.sessionId,
            url: window.location.href
        }).then(() => console.log('Shared successfully'))
            .catch((error) => console.log('Error sharing:', error));
    }

    protected shareExists() {
        return !!navigator.share;
    }
}
