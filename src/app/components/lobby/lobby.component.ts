import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [],
  templateUrl: './lobby.component.html',
})
export class LobbyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sessionService = inject(SessionService);

  protected sessionId = '';
  protected copyLabel = signal('Copy Code');

  protected players = computed(() => {
    const session = this.sessionService.session();
    return session ? Object.entries(session.players).map(([id, info]) => ({ id, info })) : [];
  });

  constructor() {
    effect(() => {
      if (this.sessionId && this.sessionService.session() === null) {
        this.router.navigate(['/']).then();
      }
    });
  }

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.sessionService.setActiveSession(this.sessionId);
    this.sessionService.joinSession(this.sessionId).then(found => {
      if (!found) this.router.navigate(['/']).then();
    });
  }

  protected async leaveLobby() {
    await this.sessionService.leaveSession(this.sessionId);
    await this.router.navigate(['/']);
  }

  protected copyCode() {
    navigator.clipboard.writeText(this.sessionId).then(() => {
      this.copyLabel.set('Copied!');
      setTimeout(() => this.copyLabel.set('Copy Code'), 2000);
    });
  }

  protected startVote() {
    // future: advance to voting phase
  }
}
