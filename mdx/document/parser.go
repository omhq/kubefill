package document

import (
	"bytes"
	"unicode"
	"unicode/utf8"

	"github.com/pkg/errors"
)

type ParsedSections struct {
	FrontMatter []byte
	Content     []byte
}

func ParseSections(source []byte) (result ParsedSections, _ error) {
	l := &itemParser{input: source}
	runItemParser(l, parseInit)
	for _, item := range l.items {
		switch item.Type() {
		case parsedItemFrontMatter:
			result.FrontMatter = item.Value(source)
		case parsedItemContent:
			result.Content = item.Value(source)
		case parsedItemError:
			return result, item.err
		}
	}
	return
}

const eof = -1

var crlf = []rune{'\r', '\n'}

func isEOL(r rune) bool {
	return r == crlf[0] || r == crlf[1]
}

type parsedItemType int

const (
	parsedItemFrontMatter parsedItemType = iota + 1
	parsedItemContent
	parsedItemError
)

type parsedItem struct {
	typ parsedItemType

	start int
	end   int

	err error
}

func (i parsedItem) String(source []byte) string {
	return string(source[i.start:i.end])
}

func (i parsedItem) Type() parsedItemType {
	return i.typ
}

func (i parsedItem) Value(source []byte) []byte {
	return source[i.start:i.end]
}

type itemParser struct {
	input []byte
	items []parsedItem
	pos   int
	start int
	width int
}

func (l *itemParser) backup() {
	l.pos -= l.width
}

func (l *itemParser) consume(runes []rune) bool {
	var consumed bool
	for _, r := range runes {
		if l.next() != r {
			l.backup()
		} else {
			consumed = true
		}
	}
	return consumed
}

func (l *itemParser) emit(t parsedItemType) {
	l.items = append(l.items, parsedItem{
		typ:   t,
		start: l.start,
		end:   l.pos,
	})
	l.start = l.pos
}

func (l *itemParser) errorf(format string, args ...interface{}) {
	l.items = append(l.items, parsedItem{
		typ: parsedItemError,
		err: errors.Errorf(format, args...),
	})
}

func (l *itemParser) hasPrefix(prefix []byte) bool {
	return bytes.HasPrefix(l.input[l.pos:], prefix)
}

func (l *itemParser) ignore() {
	l.start = l.pos
}

func (l *itemParser) next() rune {
	if l.pos >= len(l.input) {
		l.width = 0
		return eof
	}
	runeValue, runeWidth := utf8.DecodeRune(l.input[l.pos:])
	l.width = runeWidth
	l.pos += l.width
	return runeValue
}

func runItemParser(l *itemParser, startState parserStateFunc) {
	for stateFn := startState; stateFn != nil; {
		stateFn = stateFn(l)
	}
}

type parserStateFunc func(*itemParser) parserStateFunc

func parseInit(l *itemParser) parserStateFunc {
loop:
	for {
		r := l.next()
		if r == eof {
			break
		}

		switch {
		case r == '+':
			return parseFrontMatter(l, byte(r))
		case r == '-':
			return parseFrontMatter(l, byte(r))
		case r == '{':
			return parseFrontMatterJSON
		case r == '\ufeff':
			// skip
		case !unicode.IsSpace(r) && !isEOL(r):
			l.backup()
			break loop
		}
	}
	return parseContent
}

func parseContent(l *itemParser) parserStateFunc {
	// Ignore any new lines at the beginning.
	for consumed := true; consumed; {
		consumed = l.consume(crlf)
	}
	l.ignore()
	l.pos = len(l.input)
	return parseFinish
}

func parseFinish(l *itemParser) parserStateFunc {
	if l.pos > l.start {
		l.emit(parsedItemContent)
	}
	return nil
}
