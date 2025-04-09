const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const WebSocketClient = require('./index');
const Browser = require('./browser');

chai.use(chaiAsPromised);
const expect = chai.expect;

const ECHO_SERVER = 'wss://ws.postman-echo.com/raw';

function cleanResponse(response) {
  try {
    // Try to parse as JSON first
    return JSON.parse(response);
  } catch {
    // If not JSON, remove quotes and newlines
    return response.replace(/^"|"$/g, '').replace(/\n$/, '');
  }
}

describe('WebSocketClient', () => {
  let ws;

  beforeEach(() => {
    ws = new WebSocketClient();
  });

  afterEach(async function() {
    this.timeout(15000); // Increase timeout for cleanup
    if (ws) {
      try {
        await ws.close();
      } catch (err) {
        console.warn('Error during cleanup:', err);
      }
    }
  });

  describe('Connection', () => {
    it('should connect to echo websocket server with plain object headers', async () => {
      await ws.connect(ECHO_SERVER, {
        'User-Agent': 'Test Client'
      });
    });

    it('should connect to echo websocket server with Map headers', async () => {
      const headers = new Map([
        ['User-Agent', 'Test Client'],
        ['Accept', 'application/json'],
        ['Content-Type', 'application/json']
      ]);
      await ws.connect(ECHO_SERVER, headers);
    });

    it('should throw error when connecting to invalid URL', async () => {
      await expect(
        ws.connect('wss://invalid-url-that-does-not-exist.com')
      ).to.be.rejectedWith(Error);
    });
  });

  describe('JA3 Fingerprint', () => {
    it('should apply JA3 fingerprint during construction', async () => {
      const ja3 = '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,45-13-43-0-16-65281-51-18-11-27-35-23-10-5-17613-21,29-23-24-25-26,0';
      const wsWithJa3 = new WebSocketClient({ ja3, browser: Browser.CHROME });
      
      // Wait a bit for the JA3 to be applied
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Connect to verify the JA3 was applied
      await wsWithJa3.connect(ECHO_SERVER, {
        'User-Agent': 'Test Client with JA3'
      });
      
      await wsWithJa3.close();
    });

    it('should apply JA3 fingerprint manually', async () => {
      const ja3 = '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,45-13-43-0-16-65281-51-18-11-27-35-23-10-5-17613-21,29-23-24-25-26,0';
      await ws.applyJa3(ja3, Browser.CHROME);
      
      // Connect to verify the JA3 was applied
      await ws.connect(ECHO_SERVER, {
        'User-Agent': 'Test Client with JA3'
      });
    });
  });

  describe('Message Exchange', () => {
    beforeEach(async () => {
      await ws.connect(ECHO_SERVER, {
        'User-Agent': 'Test Client'
      });
    });

    it('should send and receive a simple string message', async () => {
      const testMessage = 'Hello, WebSocket!';
      await ws.send(testMessage);
      const response = await ws.receive();
      expect(cleanResponse(response)).to.equal(testMessage);
    });

    it('should send and receive a JSON message', async () => {
      const testMessage = {
        type: 'test',
        data: {
          message: 'Hello, WebSocket!',
          timestamp: Date.now()
        }
      };
      await ws.send(testMessage);
      const response = await ws.receive();
      expect(cleanResponse(response)).to.deep.equal(testMessage);
    });

    it('should handle multiple messages in sequence', async () => {
      const messages = [
        'First message',
        'Second message',
        'Third message'
      ];

      for (const msg of messages) {
        await ws.send(msg);
        const response = await ws.receive();
        expect(cleanResponse(response)).to.equal(msg);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error when sending message without connection', async () => {
      await expect(
        ws.send('test message')
      ).to.be.rejectedWith(Error);
    });

    it('should throw error when receiving message without connection', async () => {
      await expect(
        ws.receive()
      ).to.be.rejectedWith(Error);
    });

    it('should handle connection close gracefully', async () => {
      await ws.connect(ECHO_SERVER, {
        'User-Agent': 'Test Client'
      });
      await ws.close();
    });
  });
}); 