// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RemoteParticipantState } from '@azure/communication-react';
import { Stack } from '@fluentui/react';
import { TranscriptionSentence } from 'app/utils/AppUtils';
import React from 'react';

/**
 * Props for the TranscriptionPane component.
 * @property {CallTranscription} transcript - The transcript data to be displayed.
 */
export type TranscriptionPaneProps = {
  /**
   * The transcript data to be displayed.
   */
  transcript: TranscriptionSentence[];
  /**
   * The list of participants in the call.
   */
  participants?: { [keys: string]: RemoteParticipantState } | undefined;
};

export const TranscriptionPane = (props: TranscriptionPaneProps): JSX.Element => {
  const { transcript, participants } = props;

  const transcriptionItems = transcript.map((message: TranscriptionSentence) => {
    let participant;
    if (participants) {
      participant = Object.values(participants)?.find(
        (p: RemoteParticipantState) => p.identifier === message.participant
      ) as RemoteParticipantState;
    }

    // TODO: should be keyed off something else, will figure that out later
    return <TranscriptionItem key={message.text} participant={participant} message={message} />;
  });

  return (
    <Stack style={{ width: '17rem', minHeight: '40rem' }}>
      <Stack>
        <Stack style={{ fontWeight: 700 }}>Transcription</Stack>
      </Stack>
      <Stack styles={{ root: { padding: '0.5rem', borderBottom: '1px solid #ccc' } }}>{transcriptionItems}</Stack>
    </Stack>
  );
};

/**
 * Type for the transcription items
 */
type TranscriptionItemProps = {
  /**
   * id for the participant
   */
  participant?: RemoteParticipantState;
  /**
   * message data for the transcriptionItem
   */
  message: TranscriptionSentence;
};

const TranscriptionItem = (props: TranscriptionItemProps): JSX.Element => {
  const { participant, message } = props;

  return (
    <Stack styles={{ root: { padding: '0.5rem', borderBottom: '1px solid #ccc' } }}>
      <Stack styles={{ root: { fontWeight: 700 } }}>{participant ? participant?.displayName : `you`}</Stack>
      <Stack>{message.text}</Stack>
    </Stack>
  );
};
