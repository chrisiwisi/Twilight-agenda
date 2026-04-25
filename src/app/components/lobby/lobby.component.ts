import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionService, PlayerInfo } from '../../services/session.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
})
export class LobbyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sessionService = inject(SessionService);

  protected sessionId = '';
  protected players = signal<{ id: string; info: PlayerInfo }[]>([]);
  protected copyLabel = signal('Copy Code');

  private subscription?: Subscription;

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.subscription = this.sessionService.watchSession(this.sessionId).subscribe(session => {
      if (!session) {
        this.router.navigate(['/']).then();
        return;
      }
      this.players.set(
        Object.entries(session.players).map(([id, info]) => ({ id, info }))
      );
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
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
