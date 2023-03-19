PROJECT=kubefill
IMAGE=kubefill
CURRENT_DIR=$(shell pwd)
DIST_DIR=${CURRENT_DIR}/dist
CLI_NAME=kubefill
BIN_NAME=kubefill
DEV_IMAGE?=false

DOCKER_PUSH?=false
IMAGE_TAG=1.0.0

.PHONY: all
all: image

.PHONY: clean-debug
clean-debug:
	-find ${CURRENT_DIR} -name debug.test -exec rm -f {} +

.PHONY: kubefill-all
kubefill-all: clean-debug
	go build -v -o ${DIST_DIR}/${BIN_NAME} ./cmd

.PHONY: build-ui
build-ui:
	DOCKER_BUILDKIT=1 docker build -t kubefill/kubefill-ui --target kubefill-ui .
	find ./ui/build -type f -not -name gitkeep -delete
	docker run -v ${CURRENT_DIR}/ui/build:/tmp/app --rm -t kubefill/kubefill-ui sh -c 'cp -r ./build/* /tmp/app/'

.PHONY: image
ifeq ($(DEV_IMAGE), true)
IMAGE_TAG="dev-$(shell git describe --always --dirty)"
image: build-ui
	DOCKER_BUILDKIT=1 docker build --platform=linux/amd64 -t kubefill/kubefill-base --target kubefill-base .
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o ${DIST_DIR}/kubefill ./cmd
	ln -sfn ${DIST_DIR}/kubefill ${DIST_DIR}/kubefill-server
	ln -sfn ${DIST_DIR}/kubefill ${DIST_DIR}/kubefill-reposerver
	cp Dockerfile.dev dist
	DOCKER_BUILDKIT=1 docker build --platform=linux/amd64 -t kubefill/kubefill:$(IMAGE_TAG) -f dist/Dockerfile.dev dist
else
image:
	DOCKER_BUILDKIT=1 docker build -t kubefill/kubefill:$(IMAGE_TAG) .
endif
	@if [ "$(DOCKER_PUSH)" = "true" ] ; then docker push kubefill/kubefill:$(IMAGE_TAG) ; fi
