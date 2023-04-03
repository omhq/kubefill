package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/kubefill/kubefill/mdx/document"
	runnerv1 "github.com/kubefill/kubefill/mdx/gen/proto/go/runme/runner/v1"
	"github.com/kubefill/kubefill/mdx/renderer/cmark"
	"github.com/kubefill/kubefill/mdx/runner"
	"github.com/kubefill/kubefill/mdx/runner/client"
	"github.com/kubefill/kubefill/mdx/shell"
)

func readMarkdownFile(args []string) ([]byte, error) {
	arg := ""
	if len(args) == 1 {
		arg = args[0]
	}

	if arg == "" {
		f, err := os.DirFS(fChdir).Open(fFileName)
		if err != nil {
			var pathError *os.PathError
			if errors.As(err, &pathError) {
				return nil, errors.Errorf("failed to %s markdown file %s: %s", pathError.Op, pathError.Path, pathError.Err.Error())
			}

			return nil, errors.Wrapf(err, "failed to read %s", filepath.Join(fChdir, fFileName))
		}
		defer func() { _ = f.Close() }()
		data, err := io.ReadAll(f)

		if err != nil {
			return nil, errors.Wrapf(err, "failed to read data")
		}
		return data, nil
	}

	var (
		data []byte
		err  error
	)

	if arg == "-" {
		data, err = io.ReadAll(os.Stdin)
		if err != nil {
			return nil, errors.Wrap(err, "failed to read from stdin")
		}
	} else if strings.HasPrefix(arg, "https://") {
		client := http.Client{
			Timeout: time.Second * 5,
		}
		resp, err := client.Get(arg)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to get a file %q", arg)
		}
		defer func() { _ = resp.Body.Close() }()
		data, err = io.ReadAll(resp.Body)
		if err != nil {
			return nil, errors.Wrap(err, "failed to read body")
		}
	} else {
		f, err := os.Open(arg)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to open file %q", arg)
		}
		defer func() { _ = f.Close() }()
		data, err = io.ReadAll(f)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to read from file %q", arg)
		}
	}

	return data, nil
}

func writeMarkdownFile(args []string, data []byte) error {
	arg := ""
	if len(args) == 1 {
		arg = args[0]
	}

	if arg == "-" {
		return errors.New("cannot write to stdin")
	}

	if strings.HasPrefix(arg, "https://") {
		return errors.New("cannot write to HTTP location")
	}

	fullFilename := arg
	if fullFilename == "" {
		fullFilename = filepath.Join(fChdir, fFileName)
	}
	err := os.WriteFile(fullFilename, data, 0)
	return errors.Wrapf(err, "failed to write to %s", fullFilename)
}

func getCodeBlocks() (document.CodeBlocks, error) {
	data, err := readMarkdownFile(nil)
	if err != nil {
		return nil, err
	}

	doc := document.New(data, cmark.Render)
	node, _, err := doc.Parse()
	if err != nil {
		return nil, err
	}

	blocks := document.CollectCodeBlocks(node)

	filtered := make(document.CodeBlocks, 0, len(blocks))
	for _, b := range blocks {
		if fAllowUnknown || (b.Language() != "" && runner.IsSupported(b.Language())) {
			filtered = append(filtered, b)
		}
	}
	return filtered, nil
}

func lookupCodeBlock(blocks document.CodeBlocks, name string) (*document.CodeBlock, error) {
	block := blocks.Lookup(name)
	if block == nil {
		return nil, errors.Errorf("command %q not found; known command names: %s", name, blocks.Names())
	}
	return block, nil
}

func validCmdNames(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
	blocks, err := getCodeBlocks()
	if err != nil {
		cmd.PrintErrf("failed to get parser: %s", err)
		return nil, cobra.ShellCompDirectiveError
	}

	names := blocks.Names()

	var filtered []string
	for _, name := range names {
		if strings.HasPrefix(name, toComplete) {
			filtered = append(filtered, name)
		}
	}
	return filtered, cobra.ShellCompDirectiveNoFileComp | cobra.ShellCompDirectiveNoSpace
}

func setDefaultFlags(cmd *cobra.Command) {
	usage := "Help for "
	if n := cmd.Name(); n != "" {
		usage += n
	} else {
		usage += "this command"
	}
	cmd.Flags().BoolP("help", "h", false, usage)

	// For the root command, set up the --version flag.
	if cmd.Use == "runme" {
		usage := "Version of "
		if n := cmd.Name(); n != "" {
			usage += n
		} else {
			usage += "this command"
		}
		cmd.Flags().BoolP("version", "v", false, usage)
	}
}

func printfInfo(msg string, args ...any) {
	var buf bytes.Buffer
	_, _ = buf.WriteString("\x1b[0;32m")
	_, _ = fmt.Fprintf(&buf, msg, args...)
	_, _ = buf.WriteString("\x1b[0m")
	_, _ = buf.WriteString("\r\n")
	_, _ = os.Stderr.Write(buf.Bytes())
}

func getDefaultConfigHome() string {
	// TODO(adamb): switch to os.UserConfigDir()
	dir, err := os.UserHomeDir()
	if err != nil {
		dir = os.TempDir()
	}
	return filepath.Join(dir, ".config", "stateful")
}

func setRunnerFlags(cmd *cobra.Command, serverAddr *string) func() ([]client.RunnerOption, error) {
	dir, _ := filepath.Abs(fChdir)

	var (
		SessionID       string
		SessionStrategy string
		TLSDir          string
	)

	cmd.Flags().StringVarP(serverAddr, "server", "s", os.Getenv("RUNME_SERVER_ADDR"), "Server address to connect runner to")
	cmd.Flags().StringVar(&SessionID, "session", os.Getenv("RUNME_SESSION"), "Session id to run commands in runner inside of")

	cmd.Flags().StringVar(&SessionStrategy, "session-strategy", func() string {
		if val, ok := os.LookupEnv("RUNME_SESSION_STRATEGY"); ok {
			return val
		}

		return "manual"
	}(), "Strategy for session selection. Options are manual, recent. Defaults to manual")

	cmd.Flags().StringVar(&TLSDir, "tls", func() string {
		if val, ok := os.LookupEnv("RUNME_TLS_DIR"); ok {
			return val
		}

		return defaultTLSDir
	}(), "Directory for TLS authentication")

	_ = cmd.Flags().MarkHidden("session")
	_ = cmd.Flags().MarkHidden("session-strategy")

	getRunOpts := func() ([]client.RunnerOption, error) {
		runOpts := []client.RunnerOption{
			client.WithDir(dir),
			client.WithSessionID(SessionID),
			client.WithCleanupSession(SessionID == ""),
			client.WithTLSDir(TLSDir),
			client.WithInsecure(fInsecure),
		}

		switch strings.ToLower(SessionStrategy) {
		case "manual":
			runOpts = append(runOpts, client.WithSessionStrategy(runnerv1.SessionStrategy_SESSION_STRATEGY_UNSPECIFIED))
		case "recent":
			runOpts = append(runOpts, client.WithSessionStrategy(runnerv1.SessionStrategy_SESSION_STRATEGY_MOST_RECENT))
		default:
			return nil, fmt.Errorf("unknown session strategy %q", SessionStrategy)
		}

		return runOpts, nil
	}

	return getRunOpts
}

type runFunc func(context.Context) error

const tlsFileMode = os.FileMode(int(0o700))

var defaultTLSDir = filepath.Join(getDefaultConfigHome(), "tls")

var (
	fAllowUnknown bool
	fChdir        string
	fFileName     string
	fInsecure     bool
)

func main() {
	fChdir = "."
	fFileName = "README.md"

	blocks, err := getCodeBlocks()
	if err != nil {
		fmt.Printf("%v\n", err)
	}

	for _, block := range blocks {
		lines := block.Lines()

		fmt.Printf("name=%s, first_command=%s, commands=%s, intro=%s\n", block.Name(),
			shell.TryGetNonCommentLine(lines),
			fmt.Sprintf("%d", len(shell.StripComments(lines))),
			block.Intro(),
		)
	}
}
