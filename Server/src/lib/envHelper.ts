// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const appSettings = require('../../appsettings.json');

export const getResourceConnectionString = (): string => {
  const resourceConnectionString = process.env['ResourceConnectionString'] || appSettings.ResourceConnectionString;

  if (!resourceConnectionString) {
    throw new Error('No ACS connection string provided');
  }

  return resourceConnectionString;
};

const throwIfUnset = (envVar: string): string => {
  const value = process.env[envVar] || appSettings[envVar];
  if (!value) {
    throw new Error(`No ${envVar} provided`);
  }
  return value;
};

export const getLanguageAPIKey = (): string => throwIfUnset('LanguageAPIKey');
export const getCognitionAPIEndpoint = (): string => throwIfUnset('CognitionAPIEndpoint');
export const getServerHttpUrl = (): string => throwIfUnset('ServerHttpUrl');
export const getServerWebSocketPort = (): number => Number(throwIfUnset('ServerWebSocketPort'));
export const getServerWebSocketUrl = (): string => throwIfUnset('ServerWebSocketUrl');
export const getCallAutomationCallbackUrl = (): string => getServerHttpUrl() + '/api/callAutomationEvent';
