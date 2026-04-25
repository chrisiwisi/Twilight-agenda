import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Session {
  id?: string;
  hostName: string;
  agenda: string;
  players: Record<string, { name: string; vote: string | null }>;
  status: 'waiting' | 'voting' | 'results';
  createdAt?: unknown;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private firestore = inject(Firestore);

  /** Create a new voting session and return its generated ID. */
  async createSession(hostName: string, agenda: string): Promise<string> {
    const sessionsRef = collection(this.firestore, 'sessions');
    const docRef = await addDoc(sessionsRef, {
      hostName,
      agenda,
      players: {},
      status: 'waiting',
      createdAt: serverTimestamp(),
    } satisfies Omit<Session, 'id'>);
    return docRef.id;
  }

  /** Join an existing session as a player; returns false if session not found. */
  async joinSession(sessionId: string, playerName: string): Promise<boolean> {
    const sessionRef = doc(this.firestore, 'sessions', sessionId);
    const snap = await getDoc(sessionRef);
    if (!snap.exists()) return false;
    await updateDoc(sessionRef, {
      [`players.${playerName}`]: { name: playerName, vote: null },
    });
    return true;
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

  /** Cast a vote for a player. */
  async castVote(sessionId: string, playerName: string, vote: string): Promise<void> {
    const sessionRef = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(sessionRef, { [`players.${playerName}.vote`]: vote });
  }

  /** Advance session status (host only). */
  async setStatus(sessionId: string, status: Session['status']): Promise<void> {
    const sessionRef = doc(this.firestore, 'sessions', sessionId);
    await updateDoc(sessionRef, { status });
  }
}
