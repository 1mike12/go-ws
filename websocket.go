package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"sync"

	"github.com/Noooste/azuretls-client"
)

type Command struct {
	Action  string      `json:"action"`
	URL     string      `json:"url,omitempty"`
	Headers [][]string  `json:"headers,omitempty"`
	Message interface{} `json:"message,omitempty"`
	Ja3     string      `json:"ja3,omitempty"`
	Browser string      `json:"browser,omitempty"`
}

type Response struct {
	Success bool        `json:"success"`
	Error   string      `json:"error,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// WebSocketClient represents our websocket client
type WebSocketClient struct {
	session *azuretls.Session
	ws      *azuretls.Websocket
	mu      sync.Mutex
}

// NewWebSocketClient creates a new websocket client
func NewWebSocketClient() *WebSocketClient {
	return &WebSocketClient{
		session: azuretls.NewSession(),
	}
}

// ApplyJa3 applies a JA3 fingerprint to the session
func (c *WebSocketClient) ApplyJa3(ja3 string, browser string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	err := c.session.ApplyJa3(ja3, browser)
	if err != nil {
		return fmt.Errorf("failed to apply JA3: %v", err)
	}

	return nil
}

// Connect establishes a websocket connection
func (c *WebSocketClient) Connect(url string, headers [][]string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Convert the array of [key, value] pairs to OrderedHeaders
	orderedHeaders := azuretls.OrderedHeaders{}
	for _, header := range headers {
		if len(header) == 2 {
			orderedHeaders = append(orderedHeaders, header)
		}
	}

	var err error
	c.ws, err = c.session.NewWebsocket(url, 1024, 1024, orderedHeaders)
	if err != nil {
		return fmt.Errorf("failed to connect: %v", err)
	}

	return nil
}

// Send sends a message through the websocket
func (c *WebSocketClient) Send(message interface{}) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.ws == nil {
		return fmt.Errorf("websocket not connected")
	}

	return c.ws.WriteJSON(message)
}

// Receive receives a message from the websocket
func (c *WebSocketClient) Receive() ([]byte, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.ws == nil {
		return nil, fmt.Errorf("websocket not connected")
	}

	_, message, err := c.ws.ReadMessage()
	if err != nil {
		return nil, fmt.Errorf("failed to read message: %v", err)
	}

	return message, nil
}

// Close closes the websocket connection
func (c *WebSocketClient) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.ws != nil {
		c.ws.Close()
		c.ws = nil
	}
	c.session.Close()
	return nil
}

func main() {
	client := NewWebSocketClient()
	scanner := bufio.NewScanner(os.Stdin)

	for scanner.Scan() {
		var cmd Command
		if err := json.Unmarshal(scanner.Bytes(), &cmd); err != nil {
			writeResponse(Response{Success: false, Error: fmt.Sprintf("invalid command: %v", err)})
			continue
		}

		switch cmd.Action {
		case "connect":
			err := client.Connect(cmd.URL, cmd.Headers)
			if err != nil {
				writeResponse(Response{Success: false, Error: err.Error()})
				continue
			}
			writeResponse(Response{Success: true})

		case "send":
			err := client.Send(cmd.Message)
			if err != nil {
				writeResponse(Response{Success: false, Error: err.Error()})
				continue
			}
			writeResponse(Response{Success: true})

		case "receive":
			msg, err := client.Receive()
			if err != nil {
				writeResponse(Response{Success: false, Error: err.Error()})
				continue
			}
			writeResponse(Response{Success: true, Data: string(msg)})

		case "apply_ja3":
			err := client.ApplyJa3(cmd.Ja3, cmd.Browser)
			if err != nil {
				writeResponse(Response{Success: false, Error: err.Error()})
				continue
			}
			writeResponse(Response{Success: true})

		case "close":
			err := client.Close()
			if err != nil {
				writeResponse(Response{Success: false, Error: err.Error()})
				continue
			}
			writeResponse(Response{Success: true})
			return

		default:
			writeResponse(Response{Success: false, Error: "unknown command"})
		}
	}
}

func writeResponse(resp Response) {
	json.NewEncoder(os.Stdout).Encode(resp)
}
