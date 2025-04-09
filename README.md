# go-ws

A WebSocket client with customizable TLS handshake using Go and azuretls, exposed to Node.js.

## Installation

```bash
npm install go-ws
```

## Usage

```javascript
const WebSocketClient = require('go-ws');

// Create a new WebSocket client
const ws = new WebSocketClient();

// Connect to a WebSocket server
ws.connect('wss://example.com/ws', {
  'User-Agent': 'Custom User Agent',
  'Custom-Header': 'Custom Value'
});

// Send a message
ws.send({
  type: 'message',
  content: 'Hello, World!'
});

// Receive a message
try {
  const message = ws.receive();
  console.log('Received:', message);
} catch (error) {
  console.error('Error receiving message:', error);
}

// Close the connection
ws.close();
```

## JA3 Fingerprint Support

You can customize the TLS handshake by applying a JA3 fingerprint:

```javascript
const WebSocketClient = require('go-ws');
const Browser = require('go-ws/browser');

// Available browser types:
// - Browser.CHROME  ('chrome')
// - Browser.FIREFOX ('firefox')
// - Browser.SAFARI  ('safari')
// - Browser.EDGE    ('edge')
// - Browser.OPERA   ('opera')
// - Browser.IOS     ('ios')
// - Browser.ANDROID ('android') // deprecated

// Apply JA3 fingerprint during construction
const ws = new WebSocketClient({
  ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,45-13-43-0-16-65281-51-18-11-27-35-23-10-5-17613-21,29-23-24-25-26,0',
  browser: Browser.CHROME
});

// Or apply JA3 fingerprint manually
const ws = new WebSocketClient();
ws.applyJa3('771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,45-13-43-0-16-65281-51-18-11-27-35-23-10-5-17613-21,29-23-24-25-26,0', Browser.CHROME);
```

## Features

- Customizable TLS handshake using azuretls
- JA3 fingerprint support for TLS handshake customization
- Simple Node.js interface
- Thread-safe implementation
- JSON message support
- Custom headers support

## Requirements

- Go 1.21 or later
- Node.js 14 or later
- Build tools for compiling Go code

## License

MIT 