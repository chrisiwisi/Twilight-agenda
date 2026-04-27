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

        // Get the parent vote doc to find the session
        const voteSnap = await db.doc(`votes/${voteId}`).get();
        if (!voteSnap.exists) return;
        const { sessionId } = voteSnap.data()!;

        // Get the session to know total player count
        const sessionRef = db.doc(`sessions/${sessionId}`);
        const sessionSnap = await sessionRef.get();
        if (!sessionSnap.exists) return;
        const players = sessionSnap.data()!['players'] as Record<string, { voted: boolean }>;

        const totalPlayers = Object.keys(players).length;

        // Mark this player as voted + check if all done — atomically
        const votedCount = Object.values(players).filter(p => p.voted).length + 1; // +1 for current

        const update: Record<string, any> = {
            [`players.${playerId}.voted`]: true,
        };

        if (votedCount >= totalPlayers) {
            update['status'] = 'results';
        }
        logger.info(`Player ${playerId} voted in session ${sessionId}. ${votedCount}/${totalPlayers} voted. Updating session with:`, update);
        await sessionRef.update(update);
    },
);
