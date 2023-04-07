package shell

import (
	"strings"
	"unicode"
)

func StripComments(lines []string) (result []string) {
	for _, line := range lines {
		line = strings.TrimSpace(line)
		split := strings.SplitN(line, "#", 2)

		if len(split) == 0 || split[0] == "" {
			continue
		}

		result = append(
			result,
			strings.TrimRightFunc(split[0], unicode.IsSpace),
		)
	}

	return
}

func TryGetNonCommentLine(lines []string) string {
	stripped := StripComments(lines)

	if len(stripped) > 0 {
		return stripped[0]
	}

	if len(lines) > 0 {
		return lines[0]
	}

	return ""
}
