package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/kubefill/kubefill/pkg/client"
	log "github.com/sirupsen/logrus"
)

type IncomingMessage struct {
	Event             string                 `json:"event"`
	ResourceName      string                 `json:"resource_name"`
	ResourceNamespace string                 `json:"resource_namespace"`
	Data              map[string]interface{} `json:"data"`
}

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	Id   string
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

func wrapMessage(message string) string {
	return fmt.Sprintf("{\"data\": \"%s\"}", message)
}

func getAction(event string) string {
	eventParts := strings.Split(event, ":")
	return eventParts[1]
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	clientSet := client.NewClientset()

	defer func() {
		joinRoom := JoinRoom{client: c}
		c.hub.leaveRoom <- joinRoom
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()

		if err != nil {
			log.Error(err)
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Errorln(err)
			}
			break
		}

		var incomingMessage IncomingMessage
		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
		err = json.Unmarshal(message, &incomingMessage)

		if err != nil {
			log.Errorln(err)
		}

		action := getAction(incomingMessage.Event)

		if action == "subscribe" {
			_, ok := c.hub.rooms[c.Id]

			if ok {
				continue
			}

			joinRoom := JoinRoom{client: c}
			c.hub.joinRoom <- joinRoom

			ctx := context.Background()
			ctxWithCancel, cancel := context.WithCancel(ctx)
			resName := incomingMessage.ResourceName
			resNamespace := incomingMessage.ResourceNamespace

			go func(ctx context.Context) {
				input := make(chan string)
				stop := make(chan interface{})
				go clientSet.StreamPodLogs(ctxWithCancel, input, stop, resName, resNamespace)

				for {
					select {
					case lineOrErr := <-input:
						c.hub.broadcastToRoom <- RoomMessage{data: []byte(wrapMessage(lineOrErr)), Id: c.Id}
					case <-stop:
						return
					case <-ctx.Done():
						return
					}
				}
			}(ctxWithCancel)

			defer func() {
				cancel()
			}()
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)

	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
