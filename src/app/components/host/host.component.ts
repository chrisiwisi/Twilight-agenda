import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SessionService, Session } from '../../services/session.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="host" *ngIf="session">
      <h1>Hosting: {{ session.agenda }}</h1>
      <p>Session code: <strong>{{ session.id }}</strong></p>
      <p>Status: {{ session.status }}</p>

      <div class="actions">
        <button (click)="startVoting()" *ngIf="session.status === 'waiting'">Start Voting</button>
        <button (click)="showResults()" *ngIf="session.status === 'voting'">Show Results</button>
      </div>

      <h2>Players</h2>
      <ul>
        <li *ngFor="let player of players">
          {{ player.name }} —
          <span *ngIf="session.status === 'results'">{{ player.vote ?? 'No vote' }}</span>
          <span *ngIf="session.status !== 'results'">
            {{ player.vote ? '✓ Voted' : 'Waiting...' }}
          </span>
        </li>
      </ul>
    </div>
    <p *ngIf="!session">Loading session...</p>
  `,
})
export class HostComponent implements OnInit, OnDestroy {
  session: Session | null = null;
  players: { name: string; vote: string | null }[] = [];

  private route = inject(ActivatedRoute);
  private sessionService = inject(SessionService);
  private sub?: Subscription;

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId')!;
    this.sub = this.sessionService.watchSession(sessionId).subscribe(s => {
      this.session = s;
      this.players = s ? Object.values(s.players) : [];
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  startVoting(): void {
    this.sessionService.setStatus(this.session!.id!, 'voting');
  }

  showResults(): void {
    this.sessionService.setStatus(this.session!.id!, 'results');
  }
}
