import {Injectable, inject} from '@angular/core';
import {
    Firestore,
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    updateDoc,
    deleteField,
} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {generate, suffixGenerators} from 'memorable-ids';

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

    /** Get or generate a persistent random username stored in localStorage. */
    getOrCreateUsername(): string {
        let name = localStorage.getItem('twilight_username');
        if (!name) {
            const title = USER_TITLES[Math.floor(Math.random() * USER_TITLES.length)];
            const noun = USER_NOUN[Math.floor(Math.random() * USER_NOUN.length)];
            name = `${title}${noun}`;
            localStorage.setItem('twilight_username', name);
        }
        return name;
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
        const id = generate({components: 2, suffix: suffixGenerators.number});
        const snap = await getDoc(doc(this.firestore, 'sessions', id));
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

    /** Join an existing session. Returns false if session not found. */
    async joinSession(sessionId: string): Promise<boolean> {
        const playerId = this.getOrCreatePlayerId();
        const playerName = this.getOrCreateUsername();
        const sessionRef = doc(this.firestore, 'sessions', sessionId);
        const snap = await getDoc(sessionRef);
        if (!snap.exists()) return false;
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
