# ACS Meeting AI Summarization Sample

Project for displaying AI generated meeting summary for ACS meetings

## Prerequisites

- Node.js
- npm
- Azure account with access to Azure Cognitive Services and Azure Communication Services

## Setup

1. Create an Azure Communication Services resource
1. Create an Azure Cognitive Services resource
1. Using managed identity, grant the Azure Communication Services resource access to the Azure Cognitive Services resource
1. Clone the repository
1. Install dependencies

   ```bash
   npm run setup
   ```

1. Open a port or dev tunnel on your machine to allow the Azure Communication Services Call Automation to reach the server. This can be done using GitHub Codespaces, ngrok, or other similar services.

1. Setup the `Server/appsettings.json` file **note:** the ports that you should be forwarding are to be forwarded after the server and client app have started.

   - Copy the `Server/appsettings.json TEMPLATE` file and rename it to `Server/appsettings.json`
      - `ResourceConnectionString`: Connection string for the Azure Communication Services resource
      - `LanguageAPIKey`: API key for the Azure Cognitive Services resource
      - `CognitionAPIEndpoint`: Endpoint for the Azure Cognitive Services resource
      - `ServerHttpUrl`: Callback URL used for the Azure Communication Services Call Automation. This should be the URL of the deployed server e.g., `http://localhost:3000/` This should also be a forwarded port.
      - `ServerWebSocketPort`: Port used for the Azure Communication Services Call Automation. This should be the port exposed in the previous step e.g., `8081`
      - `ServerWebSocketUrl`: Websocket URL used for the Azure Communication Services Call Automation. This should be the URL of the deployed server, along with the port number in the previous step, with the `ws` protocol e.g., `ws://localhost:8081/`

## Running the project

1. Start the server and client

   ```bash
   npm run start
   ```

   Forward the needed ports after the app has started. These ports should also be public.
