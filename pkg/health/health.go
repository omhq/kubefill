package health

import (
	"io"
	"log"
	"net/http"
	"time"
)

const (
	OK      = "OK"
	BAD     = "BAD"
	TIMEOUT = "TIMEOUT"
)

type State struct {
	status string
}

func NewState() *State {
	return &State{status: OK}
}

func (s *State) Health(rw http.ResponseWriter, r *http.Request) {
	log.Printf("Received /health request: source=%v status=%v", r.RemoteAddr, s.status)
	switch s.status {
	case OK:
		io.WriteString(rw, "I'm healthy")
	case BAD:
		http.Error(rw, "Internal Error", 500)
	case TIMEOUT:
		time.Sleep(30 * time.Second)
	default:
		io.WriteString(rw, "UNKNOWN")
	}
}
