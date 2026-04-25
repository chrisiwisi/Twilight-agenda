import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService, Session } from '../../services/session.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="player" *ngIf="session">
      <h1>{{ session.agenda }}</h1>
      <p>Status: {{ session.status }}</p>

      <div *ngIf="session.status === 'voting' && !hasVoted">
        <h2>Cast Your Vote</h2>
        <button (click)="vote('FOR')">FOR</button>
        <button (click)="vote('AGAINST')">AGAINST</button>
        <button (click)="vote('ABSTAIN')">ABSTAIN</button>
      </div>

      <p *ngIf="hasVoted">You voted: <strong>{{ myVote }}</strong></p>

      <div *ngIf="session.status === 'results'">
        <h2>Results</h2>
        <ul>
          <li *ngFor="let player of players">
            {{ player.name }}: {{ player.vote ?? 'No vote' }}
          </li>
        </ul>
      </div>

      <p *ngIf="session.status === 'waiting'">Waiting for host to start voting...</p>
    </div>
    <p *ngIf="!session">Loading session...</p>
  `,
})
export class PlayerComponent implements OnInit, OnDestroy {
  session: Session | null = null;
  players: { name: string; vote: string | null }[] = [];
  playerName = '';
  hasVoted = false;
  myVote: string | null = null;

  private route = inject(ActivatedRoute);
  private sessionService = inject(SessionService);
  private sub?: Subscription;

  ngOnInit(): void {
    this.playerName = history.state?.playerName ?? '';
    const sessionId = this.route.snapshot.paramMap.get('sessionId')!;
    this.sub = this.sessionService.watchSession(sessionId).subscribe(s => {
      this.session = s;
      this.players = s ? Object.values(s.players) : [];
      if (s && this.playerName && s.players[this.playerName]) {
        this.myVote = s.players[this.playerName].vote;
        this.hasVoted = this.myVote !== null;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  vote(choice: string): void {
    if (this.session?.id && this.playerName) {
      this.sessionService.castVote(this.session.id, this.playerName, choice);
    }
  }
}
