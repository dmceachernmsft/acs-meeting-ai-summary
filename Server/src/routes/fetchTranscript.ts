// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as express from 'express';
import { TRANSCRIPTION_STORE } from '../lib/callAutomationUtils';
import { TranscriptionData } from '@azure/communication-call-automation';

const router = express.Router();
interface FetchTranscriptRequest {
  callId: string;
}
interface FetchTranscriptResponse {
  transcript: TranscriptionData[];
}

router.post('/', async function (req, res, next) {
  const { callId }: FetchTranscriptRequest = req.body;
  console.log('Fetching transcript for call:', callId, 'available calls:', Object.keys(TRANSCRIPTION_STORE));

  if (!TRANSCRIPTION_STORE[callId]) {
    res.status(404).send('Transcription not found');
    return;
  } else {
    console.log('Transcription found:', TRANSCRIPTION_STORE[callId]);
  }

  const response: FetchTranscriptResponse = { transcript: TRANSCRIPTION_STORE[callId]?.data ?? [] };
  res.status(200).send(response);
});

export default router;
