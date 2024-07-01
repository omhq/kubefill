package wsserver

import (
	"flag"
	"net/http"

	log "github.com/sirupsen/logrus"

	"github.com/gorilla/mux"
)

var addr = flag.String("addr", ":9090", "http service address")

func Run() {
	flag.Parse()
	hub := newHub()
	go hub.run()
	router := mux.NewRouter()

	router.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	http.Handle("/", router)
	err := http.ListenAndServe(*addr, nil)

	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
