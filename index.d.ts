declare module 'go-ws' {
  export interface Command {
    action: 'connect' | 'send' | 'receive' | 'apply_ja3' | 'close';
    url?: string;
    headers?: [string, string][];
    message?: any;
    ja3?: string;
    browser?: string;
  }

  export interface Response {
    success: boolean;
    error?: string;
    data?: any;
  }

  export class WebSocketClient {
    constructor();
    
    /**
     * Applies a JA3 fingerprint to the session
     * @param ja3 - The JA3 fingerprint string
     * @param browser - The browser to emulate
     */
    applyJa3(ja3: string, browser: string): Promise<void>;
    
    /**
     * Establishes a websocket connection
     * @param url - The WebSocket URL to connect to
     * @param headers - Array of [key, value] header pairs
     */
    connect(url: string, headers?: [string, string][]): Promise<void>;
    
    /**
     * Sends a message through the websocket
     * @param message - The message to send
     */
    send(message: any): Promise<void>;
    
    /**
     * Receives a message from the websocket
     * @returns The received message as a string
     */
    receive(): Promise<string>;
    
    /**
     * Closes the websocket connection
     */
    close(): Promise<void>;
  }

  export default WebSocketClient;
} 