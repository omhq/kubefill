package main

import (
	"os"
	"path/filepath"

	cli "github.com/kubefill/kubefill/cmd/kubefill/commands"
	reposerver "github.com/kubefill/kubefill/cmd/reposerver/commands"
	server "github.com/kubefill/kubefill/cmd/server/commands"
	"github.com/spf13/cobra"
)

const (
	binaryNameEnv = "BINARY_NAME"
)

func main() {
	var command *cobra.Command

	binaryName := filepath.Base(os.Args[0])
	if val := os.Getenv(binaryNameEnv); val != "" {
		binaryName = val
	}

	switch binaryName {
	case "kubefill", "kubefill-linux-amd64", "kubefill-darwin-amd64", "kubefill-windows-amd64.exe":
		command = cli.NewCommand()
	case "kubefill-server":
		command = server.NewCommand()
	case "kubefill-reposerver":
		command = reposerver.NewCommand()
	default:
		command = cli.NewCommand()
	}

	if err := command.Execute(); err != nil {
		os.Exit(1)
	}
}
