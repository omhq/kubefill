package server

type Message []byte

type RoomMessage struct {
	Message
	Id string
}

type JoinRoom struct {
	client *Client
}

type Hub struct {
	clients         map[*Client]bool
	rooms           map[string]map[*Client]bool
	joinRoom        chan JoinRoom
	leaveRoom       chan JoinRoom
	broadcast       chan Message
	broadcastToRoom chan RoomMessage
	register        chan *Client
	unregister      chan *Client
}

func newHub() *Hub {
	return &Hub{
		clients:         make(map[*Client]bool),
		rooms:           make(map[string]map[*Client]bool),
		joinRoom:        make(chan JoinRoom),
		leaveRoom:       make(chan JoinRoom),
		broadcastToRoom: make(chan RoomMessage),
		broadcast:       make(chan Message),
		register:        make(chan *Client),
		unregister:      make(chan *Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case m := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- m:
				default:
					delete(h.clients, client)
					close(client.send)
				}
			}
		case joinRoom := <-h.joinRoom:
			connections := h.rooms[joinRoom.client.Id]
			if connections == nil {
				connections = make(map[*Client]bool)
				h.rooms[joinRoom.client.Id] = connections
			}
			h.rooms[joinRoom.client.Id][joinRoom.client] = true
		case leaveRoom := <-h.leaveRoom:
			connections := h.rooms[leaveRoom.client.Id]
			if connections != nil {
				if _, ok := connections[leaveRoom.client]; ok {
					delete(connections, leaveRoom.client)
					if len(connections) == 0 {
						delete(h.rooms, leaveRoom.client.Id)
					}
				}
			}
		case m := <-h.broadcastToRoom:
			connections := h.rooms[m.Id]
			for c := range connections {
				select {
				case c.send <- m.Message:
				default:
					if len(connections) == 0 {
						delete(h.rooms, m.Id)
					}
				}
			}
		}
	}
}
