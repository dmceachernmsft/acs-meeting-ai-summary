// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ParticipantRole } from '@azure/communication-calling';
import {
  CommunicationIdentifier,
  CommunicationTokenCredential,
  CommunicationUserIdentifier
} from '@azure/communication-common';
import {
  CallAdapter,
  createAzureCommunicationCallAdapterFromClient,
  createStatefulCallClient
} from '@azure/communication-react';

export const navigateToHomePage = (): void => {
  window.location.href = window.location.href.split('?')[0];
};

export const WEB_APP_TITLE = document.title;

export const createRoom = async (): Promise<string> => {
  const requestOptions = {
    method: 'POST'
  };
  const response = await fetch(`/api/createRoom`, requestOptions);
  if (!response.ok) {
    throw 'Unable to create room';
  }

  const body = await response.json();
  return body['id'];
};

const addUserToRoom = async (userId: string, roomId: string, role: ParticipantRole): Promise<void> => {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId: userId, roomId: roomId, role: role })
  };
  const response = await fetch('/api/addUserToRoom', requestOptions);
  if (!response.ok) {
    throw 'Unable to add user to room';
  }
};

export const placeCall = async (callDetails: {
  userId: CommunicationUserIdentifier;
  token: CommunicationTokenCredential;
  displayName: string;
  roomId: string;
  role: ParticipantRole;
}): Promise<CallAdapter> => {
  await addUserToRoom(callDetails.userId.communicationUserId, callDetails.roomId, callDetails.role);

  const callClient = createStatefulCallClient({
    userId: callDetails.userId
  });

  const callAgent = await callClient.createCallAgent(callDetails.token, {
    displayName: callDetails.displayName
  });

  const callLocator = { roomId: callDetails.roomId };

  const adapter = await createAzureCommunicationCallAdapterFromClient(callClient, callAgent, callLocator);
  adapter.joinCall();

  const response = await fetch('/api/startCallWithTranscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      roomId: callDetails.roomId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to start call with transcription');
  }

  return adapter;
};

export type CallTranscription = Array<{
  text: string;
  confidence: number;
  offsetInTicks: number;
  durationInTicks: number;
  participant: CommunicationIdentifier;
  resultState: 'intermediate' | 'final';
}>;

export const fetchTranscript = async (callId: string): Promise<CallTranscription> => {
  const response = await fetch(`/api/fetchTranscript`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      callId
    })
  });
  if (!response.ok) {
    console.error('Failed to fetch transcript:', response);
    return [];
  }

  return ((await response.json()) as { transcript: CallTranscription }).transcript;
};
