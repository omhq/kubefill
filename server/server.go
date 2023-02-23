package server

import (
	"context"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/kubefill/kubefill/pkg/client"
	"github.com/kubefill/kubefill/pkg/db"
	"github.com/kubefill/kubefill/pkg/health"
	"github.com/kubefill/kubefill/pkg/job"
	"github.com/kubefill/kubefill/pkg/repo"
	"github.com/kubefill/kubefill/pkg/secret"
	"github.com/kubefill/kubefill/reposerver"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/kubefill/kubefill/pkg/application"

	"github.com/gorilla/mux"
	ui "github.com/kubefill/kubefill"
	log "github.com/sirupsen/logrus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var uiFS fs.FS

type ServerConfig struct {
	RepoServerAddress     string
	PostgresAddressNoPort string
	LogsPath              string
	KubeConfig            string
	SecretsKey            string
}

type Server struct {
	ServerConfig
	log             *log.Entry
	refreshInterval int
	db              *db.Connection
	clientset       *client.Clientset
	repoService     *repo.Service
	router          *mux.Router
	stopCh          chan struct{}
	hub             *Hub
}

func NewServer(config ServerConfig) *Server {
	dbConfig := db.NewConfig(
		config.PostgresAddressNoPort,
		"5432",
		"postgres",
		"postgres",
		"postgres",
	)
	newDb := db.NewDb(dbConfig)

	return &Server{
		ServerConfig:    config,
		db:              newDb,
		log:             log.NewEntry(log.StandardLogger()),
		refreshInterval: 15,
		clientset:       client.NewClientset(),
		repoService:     repo.NewService(newDb),
		router:          mux.NewRouter().StrictSlash(true),
		hub:             newHub(),
	}
}

func (s *Server) Init() {
	var err error
	uiFS, err = fs.Sub(ui.UI, "ui/build")
	if err != nil {
		log.Fatal("failed to get ui fs", err)
	}

	go s.hub.run()
	s.db.InitialMigration()
}

func (s *Server) Run() {
	httpState := health.NewState()
	jobService := job.NewService(s.db)
	secretService := secret.NewService(s.db)
	applicationService := application.NewService(s.db)
	informer := client.NewInformer(s.clientset, jobService)
	jwtKeySecret, err := s.clientset.CoreV1().Secrets("kubefill").Get(context.TODO(), "jwt", metav1.GetOptions{})

	if err != nil {
		log.Fatalf("%v", err)
	}

	jwtKey := string(jwtKeySecret.Data["key"])

	s.router.HandleFunc("/api/v1/", s.apiRoot())
	s.router.HandleFunc("/api/v1/repos", s.reposHandler(s.repoService))
	s.router.HandleFunc("/api/v1/repos/{id:[0-9]+}", s.repoHandler(s.repoService))
	s.router.HandleFunc("/api/v1/repos/{id:[0-9]+}/{action:[a-z]+}", s.repoHandler(s.repoService))
	s.router.HandleFunc("/api/v1/applications", s.applicationsHandler(applicationService))
	s.router.HandleFunc("/api/v1/applications/{id:[0-9]+}", s.applicationHandler(applicationService, s.repoService))
	s.router.HandleFunc("/api/v1/applications/{id:[0-9]+}/jobs", s.applicationJobHandler(applicationService, jobService, secretService))
	s.router.HandleFunc("/api/v1/applications/{id:[0-9]+}/secrets", s.applicationSecretsHandler(applicationService, secretService))
	s.router.HandleFunc("/api/v1/applications/{appId:[0-9]+}/secrets/{secretId:[0-9]+}", s.applicationSecretHandler(applicationService, secretService))
	s.router.HandleFunc("/api/v1/jobs/{id:[0-9]+}", s.jobHandler(jobService))
	s.router.HandleFunc("/api/v1/jobs/{id:[0-9]+}/logs", s.logsHandler())
	s.router.HandleFunc("/api/v1/settings", s.settingsHandler())

	s.router.HandleFunc("/api/v1/auth/login", s.loginHandler())
	s.router.HandleFunc("/api/v1/auth/self", s.selfHandler())

	s.router.HandleFunc("/health", httpState.Health)
	s.router.HandleFunc("/ws", s.wsHandler(s.hub))

	spa := spaHandler{indexPath: "index.html"}
	s.router.PathPrefix("/").Handler(spa)

	s.router.Use(corsMiddleware)
	s.router.Use(authMiddleware(jwtKey))

	http.Handle("/", s.router)

	conn, err := grpc.Dial(s.ServerConfig.RepoServerAddress, grpc.WithTransportCredentials(insecure.NewCredentials()))

	if err != nil {
		log.Fatalf("%v", err)
	}

	defer conn.Close()

	rp := reposerver.NewRepoServiceClient(conn)

	go func() {
		ticker := time.NewTicker(time.Minute * time.Duration(s.refreshInterval))
		defer ticker.Stop()

		for range ticker.C {
			repos := s.repoService.List()

			for _, repo := range repos {
				message := reposerver.SyncRequest{Repo: repo.Url, Branch: repo.Branch, RepoId: strconv.FormatInt(int64(repo.Id), 10)}
				resp, err := rp.Sync(context.Background(), &message)

				if err != nil {
					log.Errorln(err)
					continue
				}

				updateRepo, err := s.repoService.Get(uint(repo.Id))

				if err != nil {
					log.Errorln(err)
					continue
				}

				updateRepo.Commit = resp.Commit
				updateRepo.Hash = resp.Hash
				s.repoService.Update(updateRepo)
			}
		}
	}()

	go informer.StartInformer(s.ServerConfig.LogsPath)
	go func() {
		log.Infof("Starting server...")
		s.checkServeErr("http", http.ListenAndServe(":8080", nil))
	}()

	s.stopCh = make(chan struct{})
	<-s.stopCh
}

type spaHandler struct {
	indexPath string
}

func (h spaHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	path, err := filepath.Abs(r.URL.Path)
	rw.Header().Set("Cache-Control", "max-age=3600")

	if err != nil {
		http.Error(rw, err.Error(), http.StatusBadRequest)
		return
	}

	if strings.Contains(path, "/api/") {
		JSONError(rw, errorResp{Message: "path not found"}, http.StatusNotFound)
		return
	}

	if path == "/" {
		path = "index.html"
	}

	_, err = uiFS.Open(strings.TrimPrefix(path, "/"))

	if os.IsNotExist(err) {
		index, err := uiFS.Open(h.indexPath)

		if err != nil {
			http.Error(rw, err.Error(), http.StatusInternalServerError)
			return
		}

		buf := make([]byte, 1024)

		for {
			_, err := index.Read(buf)
			if err == io.EOF {
				break
			}
			if err != nil {
				continue
			}
		}

		if err != nil {
			http.Error(rw, err.Error(), http.StatusInternalServerError)
			return
		}

		mimeType := http.DetectContentType(buf)
		rw.Header().Set("Content-Type", mimeType)
		io.WriteString(rw, string(buf))
		return
	} else if err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
		return
	}

	http.FileServer(http.FS(uiFS)).ServeHTTP(rw, r)
}

func (a *Server) checkServeErr(name string, err error) {
	if err != nil {
		if a.stopCh == nil {
			log.Infof("graceful shutdown %s: %v", name, err)
		} else {
			log.Fatalf("%s: %v", name, err)
		}
	} else {
		log.Infof("graceful shutdown %s", name)
	}
}

func (s *Server) Shutdown() {
	log.Info("Shut down requested")
	stopCh := s.stopCh
	s.stopCh = nil
	s.db.Close()
	if stopCh != nil {
		close(stopCh)
	}
}
