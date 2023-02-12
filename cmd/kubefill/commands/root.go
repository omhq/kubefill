package commands

import (
	"github.com/spf13/cobra"
)

func NewCommand() *cobra.Command {
	var command = &cobra.Command{
		Use:   "kubefill",
		Short: "kubefill controls a kubefill server",
		Run: func(c *cobra.Command, args []string) {
			c.HelpFunc()(c, args)
		},
		DisableAutoGenTag: true,
		SilenceUsage:      true,
	}

	return command
}
