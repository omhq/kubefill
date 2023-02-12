package commands

import (
	"github.com/kubefill/kubefill/common"
	"github.com/kubefill/kubefill/server"
	"github.com/kubefill/kubefill/util/env"
	"github.com/spf13/cobra"
)

func NewCommand() *cobra.Command {
	var (
		repoServerAddress     string
		postgresAddressNoPort string
		logsPath              string
		kubeConfig            string
		secretsKey            string
	)
	var command = &cobra.Command{
		Use:               "kubefill-server",
		Short:             "Run the kubefill API server",
		Long:              "The API server is a REST server which exposes the API consumed by the Web UI, and CLI.  This command runs API server in the foreground.  It can be configured by following options.",
		DisableAutoGenTag: true,
		Run: func(c *cobra.Command, args []string) {
			serverConfig := server.ServerConfig{
				RepoServerAddress:     repoServerAddress,
				PostgresAddressNoPort: postgresAddressNoPort,
				LogsPath:              logsPath,
				KubeConfig:            kubeConfig,
				SecretsKey:            secretsKey,
			}
			server := server.NewServer(serverConfig)
			server.Init()
			server.Run()
		},
	}

	command.Flags().StringVar(&repoServerAddress, "repo-server", env.StringFromEnv("KUBEFILL_SERVER_REPO_SERVER", common.DefaultRepoServerAddr), "Repo server address")
	command.Flags().StringVar(&postgresAddressNoPort, "postgres", env.StringFromEnv("KUBEFILL_POSTGRES", common.DefaultPostgresAddrNoPort), "PostgreSQL address")
	command.Flags().StringVar(&logsPath, "logs-path", env.StringFromEnv("LOGS_PATH", common.DefaultLogsPath), "Logs path")
	command.Flags().StringVar(&kubeConfig, "kubeconfig", env.StringFromEnv("KUBECONFIG", common.KubeConfig), "Kube config path")
	command.Flags().StringVar(&secretsKey, "secrets-key", env.StringFromEnv("SECRETS_KEY", common.SecretsKey), "Secrets key")

	return command
}
