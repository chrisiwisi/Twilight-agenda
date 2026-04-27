/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

initializeApp();
const db = getFirestore();

export const onBallotSubmitted = onDocumentCreated(
  'votes/{voteId}/ballots/{playerId}',
  async (event) => {
    const { voteId, playerId } = event.params;

    const [voteSnap, sessionId] = await getSessionId(voteId);
    if (!voteSnap || !sessionId) return;

    const sessionRef = db.doc(`sessions/${sessionId}`);
    const players = await getPlayers(sessionRef);
    if (!players) return;

    const totalPlayers = Object.keys(players).length;
    const votedCount = Object.values(players).filter(p => p.voted).length + 1;
    const allVoted = votedCount >= totalPlayers;

    const update: Record<string, any> = {
      [`players.${playerId}.voted`]: true,
      ...(allVoted && { status: 'results' }),
    };

    if (allVoted) {
      const results = await aggregateBallots(voteId);
      await db.doc(`votes/${voteId}`).update({ results });
    }

    logger.info(`Player ${playerId} voted in session ${sessionId}. ${votedCount}/${totalPlayers} voted. Updating session with:`, update);
    await sessionRef.update(update);
  },
);

async function getSessionId(voteId: string): Promise<[FirebaseFirestore.DocumentSnapshot | null, string | null]> {
  const voteSnap = await db.doc(`votes/${voteId}`).get();
  if (!voteSnap.exists) return [null, null];
  return [voteSnap, voteSnap.data()!['sessionId']];
}

async function getPlayers(sessionRef: FirebaseFirestore.DocumentReference): Promise<Record<string, { voted: boolean }> | null> {
  const snap = await sessionRef.get();
  if (!snap.exists) return null;
  return snap.data()!['players'];
}

async function aggregateBallots(voteId: string): Promise<Record<string, number>> {
  const ballotsSnap = await db.collection(`votes/${voteId}/ballots`).get();
  return ballotsSnap.docs.reduce((acc, doc) => {
    const { choice, influence } = doc.data();
    const normalized = choice.trim().toLowerCase();
    acc[normalized] = (acc[normalized] ?? 0) + influence;
    return acc;
  }, {} as Record<string, number>);
}
