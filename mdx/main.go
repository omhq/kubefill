package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/pkg/errors"

	"github.com/kubefill/kubefill/mdx/document"
	"github.com/kubefill/kubefill/mdx/renderer/cmark"
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

	return blocks, nil
}

type Attributes struct {
	Image          string `json:"image"`
	RequestsMemory string `json:"requestsMemory"`
	RequestsCpu    string `json:"requestsCpu"`
}

func getAttributes(lines []string) (Attributes, error) {
	var attributes Attributes
	for index, line := range lines {
		line = strings.TrimSpace(line)
		/* When we encounter an empty line, we stop looking for attributes. */
		if line == "" {
			break
		}

		commentParts := strings.SplitN(line, "#", 2)

		/* This is not a comment. We stop looking for attributes when we encounter
		 * an empty line.
		 */
		if len(commentParts) == 1 {
			return attributes, errors.New(
				fmt.Sprintf(
					"[syntax error at line %d] Line break expected between attributes and commands",
					index+1,
				),
			)
		} else {
			attributeParts := strings.SplitN(commentParts[1], ":", 2)

			/* We consider a comment an attribute only it is splittable
			 * at ":". Otherwise we stop looking for attributes at this point by
			 * erroring out.
			 */
			if len(attributeParts) != 2 {
				return attributes, errors.New(
					fmt.Sprintf(
						"[syntax error at line %d] Unexpected non-attribute comment lines",
						index+1,
					),
				)
			}

			attributeName := strings.TrimSpace(attributeParts[0])
			attributeValue := strings.TrimSpace(attributeParts[1])
			switch attributeName {
			case "image":
				{
					attributes.Image = attributeValue
					break
				}

			case "requests.memory":
				{
					attributes.RequestsMemory = attributeValue
					break
				}

			case "requests.cpu":
				{
					attributes.RequestsCpu = attributeValue
					break
				}

			default:
				{
					return attributes, errors.New(
						fmt.Sprintf(
							"[syntax error at line %d] Unknown attribute '%s'",
							index+1,
							attributeName,
						),
					)
				}
			}
		}
	}
	return attributes, nil
}

func main() {
	blocks, err := getCodeBlocks(false, "./README.md")
	if err != nil {
		fmt.Printf("%v\n", err)
	}

	for _, block := range blocks {
		lines := block.Lines()
		attributes, err := getAttributes(lines)
		if err != nil {
			log.Fatal(err)
		}

		bytes, err := json.MarshalIndent(attributes, "", "    ")
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println(string(bytes))
	}
}
