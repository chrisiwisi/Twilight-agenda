import {Injectable, inject, InjectionToken, signal, OnDestroy} from "@angular/core";
import {
  Firestore,
  Timestamp,
  doc,
  collection,
  setDoc, onSnapshot,
} from '@angular/fire/firestore';
import {Observable} from "rxjs";

export const VOTE_ID = new InjectionToken<string>('VOTE_ID');

export interface Ballot {
  playerId: string;
  choice: string;
  influence: number;
}

export interface Vote {
  id: string;
  sessionId: string;
  createdAt: Timestamp;
  results?: Record<string, number>; // choice -> total influence
}

@Injectable()
export class VotingService implements OnDestroy {
  private firestore = inject(Firestore);
  private voteId = inject(VOTE_ID);

  readonly vote = signal<Vote | null | undefined>(undefined);

  private readonly unsubscribe: (() => void);

  constructor() {
    const voteRef = doc(this.firestore, 'votes', this.voteId);
    this.unsubscribe = onSnapshot(
      voteRef,
      snap => this.vote.set(snap.exists() ? ({ id: snap.id, ...snap.data() } as Vote) : null),
      err => console.error('VotingService snapshot error', err),
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  /**
   * Submit or overwrite a player's ballot.
   * Path: votes/{voteId}/ballots/{playerId}
   * Cloud Functions will react to new ballots and update the players voting state accordingly
   */
  async submitVote(ballot: Ballot): Promise<void> {
    if (!ballot.playerId) return;
    const ballotRef = doc(this.firestore, 'votes', this.voteId, 'ballots', ballot.playerId);
    return setDoc(ballotRef, {
      ...ballot,
      submittedAt: Timestamp.now(),
    });
  }

  getVoteDetails(): Observable<Ballot[]> {
    return new Observable<Ballot[]>(observer => {
      const ballotsRef = collection(this.firestore, 'votes', this.voteId, 'ballots');
      return onSnapshot(
        ballotsRef,
        snap => observer.next(
          snap.docs.map(d => ({ playerId: d.id, ...d.data() } as Ballot))
        ),
        err => observer.error(err),
      );
    });
  }
}