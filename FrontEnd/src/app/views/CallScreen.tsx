// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommunicationUserIdentifier } from '@azure/communication-common';
import { CallAdapter, CallComposite } from '@azure/communication-react';

import type { CallAdapterState, CallCompositeOptions } from '@azure/communication-react';
import React, { useCallback, useEffect, useState } from 'react';
import { PrimaryButton, Spinner, Stack, Text } from '@fluentui/react';
import { useIsMobile } from '../utils/useIsMobile';
import { useSwitchableFluentTheme } from '../theming/SwitchableFluentThemeProvider';
import { fetchTranscript } from '../utils/AppUtils';

export interface CallScreenProps {
  userId: CommunicationUserIdentifier;
  adapter: CallAdapter;
}

export type ConversationSummaryInput = {
  author: string;
  text: string;
}[];

interface SummarizeTranscriptRequest {
  useTestData: boolean;
  transcript: ConversationSummaryInput;
}

export type SummarizeResult = {
  recap: string;
  chapters: {
    chapterTitle: string;
    narrative: string;
  }[];
};

const callCompositeOptions: CallCompositeOptions = {
  callControls: {
    displayType: 'compact'
  }
};

export const CallScreen = (props: CallScreenProps): JSX.Element => {
  const [summarizationStatus, setSummarizationStatus] = useState<'None' | 'InProgress' | 'Complete'>('None');
  const [summary, setSummary] = useState<SummarizeResult>();
  const [callAutomationStarted, setCallAutomationStarted] = useState(false);

  const [callConnected, setCallConnected] = useState(props.adapter.getState().call?.state === 'Connected');
  useEffect(() => {
    const onStateChange = (state: CallAdapterState): void => {
      setCallConnected(state.call?.state === 'Connected');
    };
    props.adapter.onStateChange(onStateChange);
    return () => {
      props.adapter.offStateChange(onStateChange);
    };
  }, [props.adapter]);

  const isMobileSession = useIsMobile();
  const { currentTheme, currentRtl } = useSwitchableFluentTheme();

  useEffect(() => {
    if (callConnected) {
      const onStateChange = async (state: CallAdapterState): Promise<void> => {
        if (state.call?.info !== undefined && state.call?.state === 'Connected' && callAutomationStarted === false) {
          const serverCallID = await state.call.info.getServerCallId();
          const response = await fetch('/api/connectRoomsCall', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              serverCallId: serverCallID
            })
          });
          if (!response.ok) {
            throw new Error('Failed to start call with transcription');
          } else {
            setCallAutomationStarted(true);
          }
        }
      };
      onStateChange(props.adapter.getState());
    }
  }, [callAutomationStarted, callConnected, props.adapter]);

  const pullTranscriptionFromServer = useCallback(async () => {
    console.log('Pulling transcription from server...');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callId = props.adapter.getState().call?.id;
    if (!callId) {
      console.error('Call ID not found');
      return;
    }

    const transcript = await fetchTranscript(callId);
    console.log('Transcript', transcript);
  }, [props.adapter]);

  const getCallSummaryFromServer = async (): Promise<void> => {
    console.log('Getting summary from server...');

    setSummary(undefined);
    setSummarizationStatus('InProgress');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callId = props.adapter.getState().call?.id;
      if (!callId) {
        console.error('Call ID not found');
        throw new Error('Call ID not found');
      }

      const response = await fetch('/api/summarizeTranscript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ callId })
      });
      console.log('/summarizeTranscript response', response);

      if (!response.ok) {
        alert('Summarization request failed');
        console.error('Response Failed: ', response.statusText);
        throw new Error('Summarization request failed');
      }

      const result = await response.json();
      console.log('Summary result:', result);
      setSummary(result);
    } finally {
      setSummarizationStatus('Complete');
    }
  };

  return (
    <Stack verticalFill>
      <Stack.Item styles={{ root: { minHeight: '40rem', width: '70vw', minWidth: '30rem', margin: '0 auto' } }}>
        <CallComposite
          adapter={props.adapter}
          fluentTheme={currentTheme.theme}
          rtl={currentRtl}
          formFactor={isMobileSession ? 'mobile' : 'desktop'}
          options={callCompositeOptions}
        />
      </Stack.Item>
      <Stack.Item styles={{ root: { maxHeight: '30rem', overflow: 'auto', margin: '2rem', maxWidth: '70rem' } }}>
        {callConnected && (
          <Stack horizontal tokens={{ childrenGap: '1rem' }}>
            <PrimaryButton onClick={pullTranscriptionFromServer}>Log transcription</PrimaryButton>
            <PrimaryButton disabled={summarizationStatus === 'InProgress'} onClick={getCallSummaryFromServer}>
              Summarize Transcription
            </PrimaryButton>
          </Stack>
        )}
        {summarizationStatus === 'InProgress' && (
          <Spinner styles={{ root: { marginTop: '2rem' } }} label="Summarizing conversation..." />
        )}
        {summarizationStatus === 'Complete' && summary && (
          <Stack styles={{ root: { marginTop: '1rem' } }}>
            <Text styles={{ root: { marginTop: '0.5rem', fontWeight: 600 } }} variant="large">
              Summary
            </Text>
            <Text styles={{ root: { marginTop: '0.5rem', marginBottom: '1rem', fontStyle: 'italic' } }}>
              {summary.recap}
            </Text>
            {summary.chapters.map((chapter, index) => (
              <Chapter key={index} title={chapter.chapterTitle} narrative={chapter.narrative} />
            ))}
          </Stack>
        )}
      </Stack.Item>
    </Stack>
  );
};

const Chapter = (props: { title: string; narrative: string }): JSX.Element => {
  return (
    <Stack
      styles={{
        root: {
          paddingLeft: '2rem',
          marginTop: '0.5rem',
          marginBottom: '0.5rem',
          borderLeft: '2px solid #ccc'
        }
      }}
    >
      <Text styles={{ root: { marginBottom: '0.25rem', fontWeight: 600 } }}>{props.title}</Text>
      <Text>{props.narrative}</Text>
    </Stack>
  );
};
