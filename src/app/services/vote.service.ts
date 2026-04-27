import {Injectable, inject} from "@angular/core";
import {
    Firestore,
    Timestamp,
    doc,
    setDoc,
} from '@angular/fire/firestore';

export interface Ballot {
    choice: string;
    influence: number;
}

export interface Vote {
    id: string;
    sessionId: string;
    createdAt: Timestamp;
}

@Injectable()
export class VotingService {
    private firestore = inject(Firestore);

    /**
     * Submit or overwrite a player's ballot.
     * Path: votes/{voteId}/ballots/{playerId}
     * Cloud Functions will react to new ballots and update the players voting state accordingly
     */
    async submitVote(voteId: string, playerId: string, ballot: Ballot): Promise<void> {
        if (ballot.influence < 0) {
            console.warn('influence must be >= 0.');
            return;
        }
        const ballotRef = doc(this.firestore, 'votes', voteId, 'ballots', playerId);
        await setDoc(ballotRef, {
            ...ballot,
            submittedAt: Timestamp.now(),
        });
    }
}