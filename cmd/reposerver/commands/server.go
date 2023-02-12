package commands

import (
	"os"

	"github.com/kubefill/kubefill/reposerver"
	"github.com/spf13/cobra"
)

func NewCommand() *cobra.Command {
	var command = &cobra.Command{
		Use:               "kubefill-reposerver",
		Short:             "Run the kubefill repo server",
		Long:              "",
		DisableAutoGenTag: true,
		Run: func(c *cobra.Command, args []string) {
			rootDir, exists := os.LookupEnv("ROOT_DIR")

			if !exists {
				rootDir = ""
			}

			serverConfig := reposerver.ServerConfig{RootDir: rootDir}
			server := reposerver.NewServer(serverConfig)
			server.Run()
		},
	}

	return command
}
