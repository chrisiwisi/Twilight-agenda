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
} from '@angular/fire/firestore';
import {Observable, of, switchMap} from 'rxjs';

const LOBBY_ADJECTIVES = [
    'amber', 'azure', 'brave', 'calm', 'dark', 'deep', 'elder', 'ember',
    'feral', 'frost', 'grand', 'grim', 'hollow', 'iron', 'jade', 'keen',
    'lone', 'misty', 'noble', 'obsidian', 'pale', 'quiet', 'rapid', 'silent',
    'stark', 'swift', 'thorn', 'twilight', 'vast', 'wild',
];

const LOBBY_NOUNS = [
    'arc', 'bastion', 'comet', 'dawn', 'drift', 'dusk', 'echo', 'ember',
    'flare', 'forge', 'frontier', 'gate', 'haven', 'isle', 'light', 'moon',
    'nebula', 'nexus', 'peak', 'realm', 'rift', 'ring', 'rise', 'shore',
    'shard', 'sky', 'star', 'tide', 'vale', 'void',
];

function generateLobbyCode(): string {
    const adj = LOBBY_ADJECTIVES[Math.floor(Math.random() * LOBBY_ADJECTIVES.length)];
    const noun = LOBBY_NOUNS[Math.floor(Math.random() * LOBBY_NOUNS.length)];
    const num = Math.floor(Math.random() * 900) + 100; // 100-999
    return `${adj}-${noun}-${num}`;
}

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

const USER_TITLES = [
    'The ',
    'The Argent ',
    'The Barony of ',
    'The Clan of ',
    'The Council ',
    'The Crimson ',
    'The Deepwrought ',
    'The Emirates of ',
    'The Embers of ',
    'The Federation of ',
    'The Ghosts of ',
    'The L1Z1X ',
    'The Mahact ',
    'The Mentak ',
    'The Naalu ',
    'The Naaz-Rokha ',
    'The Nekro ',
    'The Ral Nel ',
    'The Titans of ',
    'The Universities of ',
    'The Vuil\'Raith ',
    'The Xxcha ',
    'The Yin ',
    'The Tribes of ',
    'Last ',
    'Sardakk ',
];

const USER_NOUN = [
    'Alliance',
    'Arborec',
    'Bastion',
    'Brotherhood',
    'Cabal',
    'Coalition',
    'Collective',
    'Consortium',
    'Creuss',
    'Empyrean',
    'Firmament',
    'Flight',
    'Gene Sorcerers',
    'Hacan',
    'Jol-Nar',
    'Keleres',
    'Kingdom',
    'Letnev',
    'Mindnet',
    'Muaat',
    'N\'orr',
    'Nomad',
    'Obsidian',
    'Rebellion',
    'Saar',
    'Scholarate',
    'Sol',
    'Yssaril',
    'Ul',
    'Virus',
    'Winnu',
    'Xxcha',
];

@Injectable({providedIn: 'root'})
export class SessionService {
    private firestore = inject(Firestore);

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

    /** Set (or clear) the active session that `session` signal will track. */
    setActiveSession(id: string | null): void {
        this._activeSessionId.set(id);
    }

    /** Get or generate a persistent random username stored in localStorage. */
    getOrCreateUsername(): string {
        let name = localStorage.getItem('twilight_username');
        if (!name) {
            name = this.generateUsername();
            localStorage.setItem('twilight_username', name);
        }
        return name;
    }

    /** Generate and persist a brand-new random username, replacing any existing one. */
    rerollUsername(): string {
        const name = this.generateUsername();
        localStorage.setItem('twilight_username', name);
        return name;
    }

    private generateUsername(): string {
        const title = USER_TITLES[Math.floor(Math.random() * USER_TITLES.length)];
        const noun = USER_NOUN[Math.floor(Math.random() * USER_NOUN.length)];
        return `${title}${noun}`;
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
        const id = generateLobbyCode();
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
                [playerId]: {name: playerName, speaker: false, location: 'lobby'},
            },
        });
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
        if (session.players?.[playerId]) return true; // already in session, don't overwrite
        await updateDoc(sessionRef, {
            [`players.${playerId}`]: {name: playerName, speaker: false, location: 'lobby'},
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
                snap => observer.next(snap.exists() ? ({id: snap.id, ...snap.data()} as Session) : null),
                err => observer.error(err),
            );
            return () => unsubscribe();
        });
    }

    /** Advance session status (host only). */
    async setStatus(sessionId: string, status: Session['status']): Promise<void> {
        const sessionRef = doc(this.firestore, 'sessions', sessionId);
        await updateDoc(sessionRef, {status});
    }
}
