import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteField,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface PlayerInfo {
  name: string;
  speaker: boolean;
  location: 'lobby' | 'voting' | 'results';
}

export interface Session {
  id: string;
  players: Record<string, PlayerInfo>;
  status: 'lobby' | 'voting' | 'results';
}

const ADJECTIVES = ['Swift', 'Brave', 'Silent', 'Clever', 'Bold', 'Calm', 'Eager', 'Fierce', 'Gentle', 'Happy'];
const ANIMALS = ['Fox', 'Bear', 'Wolf', 'Hawk', 'Lion', 'Owl', 'Deer', 'Tiger', 'Raven', 'Lynx'];

const LOBBY_COLORS = ['Red', 'Blue', 'Gold', 'Jade', 'Teal', 'Rose', 'Onyx', 'Sage', 'Coral', 'Amber'];
const LOBBY_NOUNS  = ['Tower', 'Forge', 'Haven', 'Vault', 'Spire', 'Cove', 'Grove', 'Keep', 'Gate', 'Hall'];

@Injectable({ providedIn: 'root' })
export class SessionService {
  private firestore = inject(Firestore);

  /** Get or generate a persistent random username stored in localStorage. */
  getOrCreateUsername(): string {
    let name = localStorage.getItem('twilight_username');
    if (!name) {
      const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      const num = Math.floor(Math.random() * 100);
      name = `${adj}${animal}${num}`;
      localStorage.setItem('twilight_username', name);
    }
    return name;
  }

  /** Get or generate a persistent player ID stored in localStorage. */
  getOrCreatePlayerId(): string {
    let id = localStorage.getItem('twilight_player_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('twilight_player_id', id);
    }
    return id;
  }

  /** Generate a readable lobby ID like "GoldHaven42". Retries on collision. */
  private async generateLobbyId(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const color = LOBBY_COLORS[Math.floor(Math.random() * LOBBY_COLORS.length)];
      const noun  = LOBBY_NOUNS[Math.floor(Math.random() * LOBBY_NOUNS.length)];
      const num   = Math.floor(Math.random() * 100);
      const id    = `${color}${noun}${num}`;
      const snap  = await getDoc(doc(this.firestore, 'sessions', id));
      if (!snap.exists()) return id;
    }
    // Fallback: append extra entropy
    return `${LOBBY_COLORS[0]}${LOBBY_NOUNS[0]}${Date.now()}`;
  }

  /** Create a new lobby session, add self as first player, return session ID. */
  async createSession(): Promise<string> {
    const playerId = this.getOrCreatePlayerId();
    const playerName = this.getOrCreateUsername();
    const sessionId = await this.generateLobbyId();
    const sessionRef = doc(this.firestore, 'sessions', sessionId);
    await setDoc(sessionRef, {
      status: 'lobby',
      players: {
        [playerId]: { name: playerName, speaker: false, location: 'lobby' },
      },
    });
    return sessionId;
  }

  /** Join an existing session. Returns false if session not found. */
  async joinSession(sessionId: string): Promise<boolean> {
    const playerId = this.getOrCreatePlayerId();
    const playerName = this.getOrCreateUsername();
    const sessionRef = doc(this.firestore, 'sessions', sessionId);
    const snap = await getDoc(sessionRef);
    if (!snap.exists()) return false;
    await updateDoc(sessionRef, {
      [`players.${playerId}`]: { name: playerName, speaker: false, location: 'lobby' },
    });
    return true;
  }

  /** Remove self from a session. */
  async leaveSession(sessionId: string): Promise<void> {
    const playerId = this.getOrCreatePlayerId();
    const sessionRef = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      [`players.${playerId}`]: deleteField(),
    });
  }

  /** Subscribe to real-time session updates. */
  watchSession(sessionId: string): Observable<Session | null> {
    return new Observable(observer => {
      const sessionRef = doc(this.firestore, 'sessions', sessionId);
      const unsubscribe = onSnapshot(
        sessionRef,
        snap => observer.next(snap.exists() ? ({ id: snap.id, ...snap.data() } as Session) : null),
        err => observer.error(err),
      );
      return () => unsubscribe();
    });
  }

  /** Advance session status (host only). */
  async setStatus(sessionId: string, status: Session['status']): Promise<void> {
    const sessionRef = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(sessionRef, { status });
  }
}
