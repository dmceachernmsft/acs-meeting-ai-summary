// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommunicationUserIdentifier } from '@azure/communication-common';
import { setLogLevel } from '@azure/logger';
import { initializeIcons, Spinner } from '@fluentui/react';
import React, { useEffect, useState } from 'react';
import { createRoom, navigateToHomePage, placeCall, WEB_APP_TITLE } from './utils/AppUtils';
import { CallError } from './views/CallError';
import { CallScreen } from './views/CallScreen';
import { HomeScreen } from './views/HomeScreen';
import { CallAdapter, toFlatCommunicationIdentifier } from '@azure/communication-react';
import { createAutoRefreshingCredential, fetchTokenResponse } from './utils/credential';

setLogLevel('error');

initializeIcons();

type AppPages = 'home' | 'call';

const App = (): JSX.Element => {
  const [page, setPage] = useState<AppPages>('home');

  // User credentials to join a call with - these are retrieved from the server
  const [token, setToken] = useState<string>();
  const [userId, setUserId] = useState<CommunicationUserIdentifier>();
  const [adapter, setAdapter] = useState<CallAdapter>();
  const [userCredentialFetchError, setUserCredentialFetchError] = useState<boolean>(false);

  // Call details to join a call - these are collected from the user on the home screen
  const [displayName, setDisplayName] = useState<string>('');

  // Get Azure Communications Service token from the server
  useEffect(() => {
    (async () => {
      try {
        const { token, user } = await fetchTokenResponse();
        setToken(token);
        setUserId(user);
      } catch (e) {
        console.error(e);
        setUserCredentialFetchError(true);
      }
    })();
  }, []);

  switch (page) {
    case 'home': {
      document.title = `home - ${WEB_APP_TITLE}`;
      return (
        <HomeScreen
          startCallHandler={async (callDetails) => {
            setDisplayName(callDetails.displayName);
            setPage('call');

            if (!token || !userId) {
              throw new Error('Token or userId not available');
            }

            const credential = createAutoRefreshingCredential(toFlatCommunicationIdentifier(userId), token);

            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('roomId') ?? (await createRoom());
            const adapter = await placeCall({
              userId: userId,
              token: credential,
              displayName: callDetails.displayName,
              roomId: roomId,
              role: 'Presenter'
            });

            window.history.pushState({}, '', `?roomId=${roomId}`);
            setAdapter(adapter);
          }}
        />
      );
    }

    case 'call': {
      if (userCredentialFetchError) {
        document.title = `error - ${WEB_APP_TITLE}`;
        return (
          <CallError
            title="Error getting user credentials from server"
            reason="Ensure the sample server is running."
            rejoinHandler={() => setPage('call')}
            homeHandler={navigateToHomePage}
          />
        );
      }

      if (!token || !userId || !displayName) {
        document.title = `credentials - ${WEB_APP_TITLE}`;
        return <Spinner label={'Getting user credentials from server'} ariaLive="assertive" labelPosition="top" />;
      }

      if (!adapter) {
        document.title = `connecting - ${WEB_APP_TITLE}`;
        return <Spinner label="Connecting to call..." ariaLive="assertive" labelPosition="top" />;
      }

      document.title = `connected - ${WEB_APP_TITLE}`;
      return <CallScreen adapter={adapter} userId={userId} />;
    }
    default:
      document.title = `error - ${WEB_APP_TITLE}`;
      return <>Invalid page</>;
  }
};

export default App;
