package document

import "bytes"

func parseFrontMatter(l *itemParser, delimiter byte) parserStateFunc {
	// lexFrontMatter was trigger when a dilimiter was observer.
	// According to the spec, there must be three delimiter characters.
	for i := 0; i < 2; i++ {
		if r := l.next(); r != rune(delimiter) {
			l.errorf("expected %q rune, got %q", delimiter, r)
			return nil
		}
	}

	wasEndOfLine := l.consume(crlf)

	var r rune
	for {
		if !wasEndOfLine {
			r = l.next()
			if r == eof {
				l.errorf("got EOF while looking for the end of the front matter delimiter")
				return nil
			}
		}
		if wasEndOfLine || isEOL(r) {
			if l.hasPrefix(bytes.Repeat([]byte{delimiter}, 3)) {
				l.pos += 3
				l.emit(parsedItemFrontMatter)
				l.consume(crlf)
				l.ignore()
				break
			}
		}
		wasEndOfLine = false
	}

	return parseContent
}

func parseFrontMatterJSON(l *itemParser) parserStateFunc {
	l.backup()

	var (
		inQuote bool
		level   int
	)

	for {
		r := l.next()

		switch {
		case r == eof:
			l.errorf("got EOF while looking for the end of the JSON front matter")
			return nil
		case r == '{':
			if !inQuote {
				level++
			}
		case r == '}':
			if !inQuote {
				level--
			}
		case r == '"':
			inQuote = !inQuote
		case r == '\\':
			// This may be an escaped quote. Make sure it's not marked as a
			// real one.
			l.next()
		}

		if level == 0 {
			break
		}
	}

	l.emit(parsedItemFrontMatter)
	l.consume(crlf)
	l.ignore()

	return parseContent
}
