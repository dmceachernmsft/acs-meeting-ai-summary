// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import express from 'express';
import cors from 'cors';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import path from 'path';
import WebSocket from 'ws';

import issueToken from './routes/issueToken';
import refreshToken from './routes/refreshToken';
import summarizeTranscript from './routes/summarizeTranscript';
import startTranscription from './routes/startTranscription';
import fetchTranscript from './routes/fetchTranscript';
import startCallWithTranscription from './routes/startCallWithTranscription';
import createRoom from './routes/createRoom';
import addUserToRoom from './routes/addUserToRoom';
import { handleTranscriptionEvent } from './lib/callAutomationUtils';
import { getServerWebSocketPort } from './lib/envHelper';

const app = express();

app.use(logger('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, 'build')));

/**
 * route: /refreshToken
 * purpose: Chat,Calling: get a new token
 */
app.use('/api/refreshToken', cors(), refreshToken);

/**
 * route: /token
 * purpose: Chat,Calling: get ACS token with the given scope
 */
app.use('/api/token', cors(), issueToken);

/**
 * route: /summarizeTranscript
 * purpose: Sends transcript to AI summarization service
 */
app.use('/api/summarizeTranscript', cors(), summarizeTranscript);

/**
 * route: /startTranscription
 * purpose: Start transcription for an established call
 */
app.use('/api/startTranscription', cors(), startTranscription);

/**
 * route: /fetchTranscript
 * purpose: Fetch an existing transcription
 */
app.use('/api/fetchTranscript', cors(), fetchTranscript);

/**
 * route: /startCallWithTranscription
 * purpose: Start a new group call with transcription
 */
app.use('/api/startCallWithTranscription', cors(), startCallWithTranscription);

app.use('/api/callAutomationEvent', cors(), (req, res) => {
  console.log('/automationEvent received', req.body);
});

/**
 * route: /createRoom
 * purpose: Calling: create a new room
 */
app.use('/api/createRoom', cors(), createRoom);

/**
 * route: /addUserToRoom
 * purpose: Calling: add user to room with the given role
 */
app.use('/api/addUserToRoom', cors(), addUserToRoom);

/**
 * route: wss://<host>/
 * purpose: WebSocket endpoint to receive transcription events
 *
 * Don't forget to secure this endpoint in production
 * https://learn.microsoft.com/en-us/azure/communication-services/how-tos/call-automation/secure-webhook-endpoint?pivots=programming-language-javascript
 */
const wss = new WebSocket.Server({ port: getServerWebSocketPort() });
wss.on('connection', (ws) => {
  let transcriptionCorrelationId: string | undefined;

  ws.on('open', () => {
    console.log('WebSocket opened');
  });

  ws.on('message', (message) => {
    console.log('/message received', message);
    transcriptionCorrelationId = handleTranscriptionEvent(message, transcriptionCorrelationId);
  });

  ws.on('close', () => {
    console.log('WebSocket closed');
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log('404', req.url);
  next(createError(404));
});

export default app;
