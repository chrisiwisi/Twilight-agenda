import {Injectable, inject, signal} from '@angular/core';
import {toSignal, toObservable} from '@angular/core/rxjs-interop';
import {
    Firestore,
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    updateDoc,
    deleteField,
    serverTimestamp,
} from '@angular/fire/firestore';
import {Observable, of, switchMap} from 'rxjs';
import {NameGenerationService} from './name-generation.service';
import {VoteType} from './vote.service';

export interface PlayerInfo {
    name: string;
    voted: boolean;
}

export interface Session {
    id: string;
    players: Record<string, PlayerInfo>;
    status: 'lobby' | 'voting' | 'results';
    /** The player ID of whoever currently holds the speaker token. */
    speakerId?: string;
    /** Set when the session transitions to 'voting'. Points to the active vote document. */
    voteId?: string;
}

@Injectable({providedIn: 'root'})
export class SessionService {
    private firestore = inject(Firestore);
    private nameGen = inject(NameGenerationService);

    private _activeSessionId = signal<string | null>(null);

    /**
     * The current session as a reactive signal. Reflects real-time Firestore updates.
     * - `undefined` → not yet loaded (or no active session set)
     * - `null`      → Firestore confirmed the document does not exist
     * - `Session`   → live session data
     */
    readonly session = toSignal(
        toObservable(this._activeSessionId).pipe(
            switchMap(id => id ? this.watchSession(id) : of(undefined)),
        ),
    );


    getOrCreateUsername(): string {
        return this.nameGen.getOrCreateUsername();
    }

    rerollUsername(): string {
        return this.nameGen.rerollUsername();
    }

    getOrCreatePlayerId(): string {
        let id = localStorage.getItem('twilight_player_id');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('twilight_player_id', id);
        }
        return id;
    }

    private async generateLobbyId(): Promise<string> {
        const id = this.nameGen.generateLobbyCode();
        await getDoc(doc(this.firestore, 'sessions', id));
        return id;
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
                [playerId]: {name: playerName, voted: false},
            },
        });
        this._activeSessionId.set(sessionId);
        return sessionId;
    }

    /** Join an existing session. No-ops if already a player. Returns false if session not found. */
    async joinSession(sessionId: string): Promise<boolean> {
        const playerId = this.getOrCreatePlayerId();
        const playerName = this.getOrCreateUsername();
        const sessionRef = doc(this.firestore, 'sessions', sessionId);
        const snap = await getDoc(sessionRef);
        if (!snap.exists()) return false;
        const session = snap.data() as Session;
        if (!session.players?.[playerId]) {
            await updateDoc(sessionRef, {
                [`players.${playerId}`]: {name: playerName, voted: false},
            });
        }
        this._activeSessionId.set(sessionId);
        return true;
    }

    /** Remove self from the active session. */
    async leaveSession(): Promise<void> {
        const playerId = this.getOrCreatePlayerId();
        await this.updateSession({[`players.${playerId}`]: deleteField()});
        this._activeSessionId.set(null);
    }

    /** Subscribe to real-time session updates. */
    watchSession(sessionId: string): Observable<Session | null> {
        return new Observable(observer => {
            const sessionRef = doc(this.firestore, 'sessions', sessionId);
            const unsubscribe = onSnapshot(
                sessionRef,
                snap => observer.next(snap.exists() ? ({id: snap.id, ...snap.data()} as Session) : null),
                err => observer.error(err),
            );
            return () => unsubscribe();
        });
    }

    async startVote(type: VoteType): Promise<void> {
        if (!this.isSpeaker()) { return; }
        const sessionId = this._activeSessionId();
        if (!sessionId) { return; }

        const voteId = crypto.randomUUID();
        const voteRef = doc(this.firestore, 'votes', voteId);
        await setDoc(voteRef, {
            sessionId,
            type,
            createdAt: serverTimestamp(),
        });

        await this.updateSession({ status: 'voting', voteId });
    }

    isSpeaker(): boolean {
        const playerId = this.getOrCreatePlayerId();
        return this.session()?.speakerId === playerId;
    }

    private async updateSession(data: {[p: string]: any}): Promise<void> {
        const sessionId = this._activeSessionId();
        if (!sessionId) {
            console.warn('Session id not set.');
            return;
        }
        const sessionRef = doc(this.firestore, 'sessions', this._activeSessionId()!);
        await updateDoc(sessionRef, data);
    }

    takeSpeaker() {
        const playerId = this.getOrCreatePlayerId();
        this.updateSession({ speakerId: playerId }).then();
    }


  async resetState(): Promise<void> {
    const session = this.session();
    if (!session) return;

    const updates: Record<string, any> = {
      status: 'lobby',
      voteId: deleteField(),
    };

    for (const playerId of Object.keys(session.players)) {
      updates[`players.${playerId}.voted`] = false;
    }

    await this.updateSession(updates);
  }
}
