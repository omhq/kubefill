package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/pkg/errors"

	"github.com/kubefill/kubefill/mdx/document"
	"github.com/kubefill/kubefill/mdx/renderer/cmark"
	util "github.com/kubefill/kubefill/mdx/shell"
)

func readMarkdownFile(path string) ([]byte, error) {
	var (
		data []byte
		err  error
	)

	if path == "-" {
		data, err = io.ReadAll(os.Stdin)
		if err != nil {
			return nil, errors.Wrap(err, "failed to read from stdin")
		}
	} else if strings.HasPrefix(path, "https://") {
		client := http.Client{
			Timeout: time.Second * 5,
		}
		resp, err := client.Get(path)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to get a file %q", path)
		}
		defer func() { _ = resp.Body.Close() }()
		data, err = io.ReadAll(resp.Body)
		if err != nil {
			return nil, errors.Wrap(err, "failed to read body")
		}
	} else {
		f, err := os.Open(path)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to open file %q", path)
		}
		defer func() { _ = f.Close() }()
		data, err = io.ReadAll(f)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to read from file %q", path)
		}
	}

	return data, nil
}

var supportedExecutables = []string{
	"bash",
	"bat", // fallback to sh
	"sh",
	"sh-raw",
	"shell",
	"zsh",
	"go",
}

func isSupported(lang string) bool {
	for _, item := range supportedExecutables {
		if item == lang {
			return true
		}
	}
	return false
}

func getCodeBlocks(
	allowUnknown bool,
	path string,
) (document.CodeBlocks, error) {
	data, err := readMarkdownFile(path)
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
		if allowUnknown || (b.Language() != "" && isSupported(b.Language())) {
			filtered = append(filtered, b)
		}
	}
	return filtered, nil
}

const tlsFileMode = os.FileMode(int(0o700))

func main() {
	blocks, err := getCodeBlocks(false, "./README.md")
	if err != nil {
		fmt.Printf("%v\n", err)
	}

	for _, block := range blocks {
		lines := block.Lines()

		fmt.Printf("name=%s, first_command=%s, commands=%s, intro=%s\n", block.Name(),
			util.TryGetNonCommentLine(lines),
			fmt.Sprintf("%d", len(util.StripComments(lines))),
			block.Intro(),
		)
	}
}
