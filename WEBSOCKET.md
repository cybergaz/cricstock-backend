# WebSocket Implementation for Live Cricket Updates

This document explains the WebSocket implementation for receiving live cricket match updates from a third-party API and forwarding them to connected clients.

## Architecture

The system consists of three main components:

1. **Third-Party WebSocket Client**: Connects to the external API to receive live match updates
2. **Database Integration**: Updates the MongoDB database with the latest match data
3. **Socket.io Server**: Forwards updates to connected frontend clients

## Flow of Data

```
Third-Party WebSocket API → Backend WebSocket Client → MongoDB Database & Socket.io Server → Frontend Clients
```

## Connection Details

### Third-Party WebSocket Connection

- URL: `ws://webhook.entitysport.com:8087/connect?token=YOUR_TOKEN`
- The connection automatically reconnects if disconnected
- Incoming data is parsed and processed based on the event type

### Socket.io Server for Clients

- Port: 3001 (configurable via environment variable `SOCKET_PORT`)
- Allows cross-origin connections for development and production
- Emits the following events:
  - `initial_matches`: Sent when a client first connects, contains all current match data
  - `match_update`: Sent when a match is updated with new data from the third-party API

## Data Processing

When data is received from the third-party WebSocket:

1. The data is parsed and validated
2. The database is updated with the new match information
3. The data is forwarded to all connected clients via Socket.io

## Client Connection Example

Frontend clients can connect to the Socket.io server using:

```javascript
import { io } from "socket.io-client";

// Connect to the WebSocket server
const socket = io("http://your-backend-url:3001");

// Listen for initial match data
socket.on("initial_matches", (matches) => {
  console.log("Received initial matches:", matches);
  // Update your UI with the matches data
});

// Listen for match updates
socket.on("match_update", (matchData) => {
  console.log("Match update received:", matchData);
  // Update your UI with the new match data
});
```

## Error Handling

- The WebSocket client automatically attempts to reconnect if the connection is lost
- Errors during data processing are logged but don't crash the server
- Invalid data is filtered out before being sent to clients

## Environment Variables

- `TOKEN`: Your API token for the third-party WebSocket service
- `SOCKET_PORT`: The port for the Socket.io server (default: 3001)

## Database Updates

Match data is stored in the `Todays` collection with the match ID as the primary identifier. The system uses upsert operations to ensure data consistency. 