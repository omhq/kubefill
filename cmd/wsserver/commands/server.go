package commands

import (
	"github.com/kubefill/kubefill/wsserver"
	"github.com/spf13/cobra"
)

func NewCommand() *cobra.Command {
	var command = &cobra.Command{
		Use:               "kubefill-server",
		Short:             "Run the kubefill API server",
		Long:              "The API server is a REST server which exposes the API consumed by the Web UI, and CLI.  This command runs API server in the foreground.  It can be configured by following options.",
		DisableAutoGenTag: true,
		Run: func(c *cobra.Command, args []string) {
			wsserver.Run()
		},
	}

	return command
}
