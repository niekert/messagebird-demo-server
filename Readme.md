## About this repository
This repository contains a tiny express app used to power the messagebird dashboard found in
this repository: https://bitbucket.org/niekert/messagebird-client

The express app does three things:

- Forwards all requests to `/messagebird/:path` to MessageBird's rest api `https://rest.messagebird.com/`
with the correct credentials.
- Rejects all incoming requests that don't have the correct access key token. This access key token
Can be configured through the `.env` file. Right now the only purpose of this is to prevent
random people from finding the URL from emptying my messagebird credit 👀
- A websocket server which the dashboard client can connect to
- And endpoint to validate user's API keys
- An endpoint for the [callback](https://developers.messagebird.com/docs/messaging#messaging-receive)
when a message is received on a MessageBird virtual number. This endpoint broadcasts the message
to all connected websockets.

## Running the app locally
1. Clone and `cd` to the repository
2. Create an `.env` file in the root of the repository with the following contents:
```
MESSAGEBIRD_API_KEY=<your messagebird API key>
ALLOWED_ACCESS_KEY=<access key that users have to enter to connect to the API in the dashboard app>
```
3. Run `yarn && yarn dev`
