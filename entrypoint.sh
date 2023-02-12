#!/bin/bash

if test "$$" = "1"; then
	exec tini -- $@
else
	exec "$@"
fi
