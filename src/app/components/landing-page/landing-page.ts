import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-landing-page',
  imports: [FormsModule, NzButtonModule, NzIconModule, NzInputModule, NzAlertModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  private router = inject(Router);
  private sessionService = inject(SessionService);

  protected username = signal(this.sessionService.getOrCreateUsername());
  protected showJoinInput = signal(false);
  protected lobbyCode = '';
  protected errorMessage = signal('');
  protected loading = signal(false);

  protected rerollUsername() {
    this.username.set(this.sessionService.rerollUsername());
  }

  protected async createLobby() {
    this.loading.set(true);
    try {
      const sessionId = await this.sessionService.createSession();
      await this.router.navigate(['/lobby', sessionId]);
    } finally {
      this.loading.set(false);
    }
  }

  protected toggleJoin() {
    this.showJoinInput.set(!this.showJoinInput());
    this.errorMessage.set('');
    this.lobbyCode = '';
  }

  protected async joinLobby() {
    const code = this.lobbyCode.trim();
    if (!code) return;
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const success = await this.sessionService.joinSession(code);
      if (success) {
        await this.router.navigate(['/lobby', code]);
      } else {
        this.errorMessage.set('Lobby not found. Check the code and try again.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected editUsername() {
    const newName = prompt('Enter a new username:', this.username());
    if (newName && newName.trim()) {
      this.username.set(newName.trim());
      localStorage.setItem('twilight_username', this.username());
    }
  }
}
