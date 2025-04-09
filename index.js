const { spawn } = require('child_process');
const path = require('path');
const Browser = require('./browser');

class WebSocketClient {
  constructor(options = {}) {
    this.process = spawn('./websocket', [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stderr.on('data', (data) => {
      console.error(`Go Error: ${data}`);
    });

    this.process.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Go process exited with code ${code}`);
      }
    });

    // Set up error handling for stdin/stdout
    this.process.stdin.on('error', (err) => {
      if (err.code !== 'EPIPE') {
        console.error('Stdin error:', err);
      }
    });

    this.process.stdout.on('error', (err) => {
      console.error('Stdout error:', err);
    });

    // Apply JA3 fingerprint if provided
    if (options.ja3) {
      this.applyJa3(options.ja3, options.browser || Browser.CHROME)
        .catch(err => console.error('Failed to apply JA3:', err));
    }
  }

  _sendCommand(command) {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('WebSocket process is not initialized or has been closed'));
        return;
      }

      const responseHandler = (data) => {
        try {
          const response = JSON.parse(data);
          if (!response.success) {
            reject(new Error(response.error));
          } else {
            resolve(response.data);
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      };

      this.process.stdout.once('data', responseHandler);
      
      try {
        this.process.stdin.write(JSON.stringify(command) + '\n');
      } catch (err) {
        this.process.stdout.removeListener('data', responseHandler);
        reject(err);
      }
    });
  }

  applyJa3(ja3, browser = Browser.CHROME) {
    return this._sendCommand({
      action: 'apply_ja3',
      ja3,
      browser
    });
  }

  connect(url, headers = {}) {
    return this._sendCommand({
      action: 'connect',
      url,
      headers
    });
  }

  send(message) {
    return this._sendCommand({
      action: 'send',
      message
    });
  }

  receive() {
    return this._sendCommand({
      action: 'receive'
    });
  }

  async close() {
    if (!this.process) {
      return; // Already closed
    }
    
    try {
      // Only try to send close command if process is still running
      if (!this.process.killed) {
        await this._sendCommand({
          action: 'close'
        });
      }
    } catch (err) {
      // Ignore errors during close command
    } finally {
      // Ensure process is killed
      if (this.process && !this.process.killed) {
        this.process.kill();
      }
      this.process = null;
    }
  }
}

module.exports = WebSocketClient; 