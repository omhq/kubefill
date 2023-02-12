package reposerver

import (
	"log"
	"net"
	"os"

	"google.golang.org/grpc"
)

func NewServer(config ServerConfig) *Server {
	return &Server{
		config,
	}
}

func (s *Server) Run() {
	lis, err := net.Listen("tcp", ":8081")
	if err != nil {
		log.Fatalf("Failed to listen to port 8081: %v", err)
	}

	service := RepoService{
		repoRoot: os.Getenv(REPO_ROOT),
		sshRoot:  os.Getenv(SSH_ROOT),
	}
	grpcServer := grpc.NewServer()

	service.Init()
	RegisterRepoServiceServer(grpcServer, &service)

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve gRPC server over port 8081: %v", err)
	}
}
