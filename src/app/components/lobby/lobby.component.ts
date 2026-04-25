import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lobby">
      <h1>Twilight Agenda</h1>
      <p>Real-time voting for Twilight Imperium agenda phase</p>

      <section>
        <h2>Create Session (Host)</h2>
        <input [(ngModel)]="hostName" placeholder="Your name" />
        <input [(ngModel)]="agenda" placeholder="Agenda card title" />
        <button (click)="createSession()" [disabled]="!hostName || !agenda">
          Create Session
        </button>
      </section>

      <hr />

      <section>
        <h2>Join Session (Player)</h2>
        <input [(ngModel)]="playerName" placeholder="Your name" />
        <input [(ngModel)]="sessionCode" placeholder="Session code" />
        <button (click)="joinSession()" [disabled]="!playerName || !sessionCode">
          Join Session
        </button>
      </section>

      <p *ngIf="error" class="error">{{ error }}</p>
    </div>
  `,
})
export class LobbyComponent {
  hostName = '';
  agenda = '';
  playerName = '';
  sessionCode = '';
  error = '';

  private sessionService = inject(SessionService);
  private router = inject(Router);

  async createSession(): Promise<void> {
    try {
      const id = await this.sessionService.createSession(this.hostName, this.agenda);
      this.router.navigate(['/host', id]);
    } catch (e) {
      this.error = `Failed to create session: ${(e as Error).message}`;
    }
  }

  async joinSession(): Promise<void> {
    try {
      const joined = await this.sessionService.joinSession(this.sessionCode, this.playerName);
      if (joined) {
        this.router.navigate(['/player', this.sessionCode], { state: { playerName: this.playerName } });
      } else {
        this.error = 'Session not found. Check the session code.';
      }
    } catch (e) {
      this.error = `Failed to join session: ${(e as Error).message}`;
    }
  }
}
