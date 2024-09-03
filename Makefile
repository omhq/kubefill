CURRENT_DIR=$(shell pwd)
DIST_DIR=${CURRENT_DIR}/dist
CLI_NAME=kubefill
BIN_NAME=kubefill
DEV_IMAGE?=false

DOCKER_PUSH?=false

ORGANIZATION=kubefill
IMAGE=kubefill
IMAGE_TAG=1.0.7

.PHONY: all
all: clean-debug image push

.PHONY: clean-debug
clean-debug:
	-find ${CURRENT_DIR} -name debug.test -exec rm -f {} +

.PHONY: kubefill-all
kubefill-all: clean-debug
	go build -v -o ${DIST_DIR}/${BIN_NAME} ./cmd

.PHONY: build-ui
build-ui:
	DOCKER_BUILDKIT=1 docker build build --platform=linux/amd64 -t $(ORGANIZATION)/kubefill-ui --target kubefill-ui .
	find ./ui/build -type f -not -name gitkeep -delete
	docker run -v ${CURRENT_DIR}/ui/build:/tmp/app --rm -t $(ORGANIZATION)/kubefill-ui sh -c 'cp -r ./build/* /tmp/app/'

.PHONY: image
ifeq ($(DEV_IMAGE), true)
IMAGE_TAG="dev-$(shell git describe --always --dirty)"
image: build-ui
	DOCKER_BUILDKIT=1 docker build --platform=linux/amd64 -t $(ORGANIZATION)/kubefill-base --target kubefill-base .
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o ${DIST_DIR}/kubefill ./cmd
	ln -sfn ${DIST_DIR}/kubefill ${DIST_DIR}/kubefill-server
	ln -sfn ${DIST_DIR}/kubefill ${DIST_DIR}/kubefill-reposerver
	cp Dockerfile.dev dist
	DOCKER_BUILDKIT=1 docker build --platform=linux/amd64 -t $(ORGANIZATION)/$(IMAGE):$(IMAGE_TAG) -f dist/Dockerfile.dev dist
else
image:
	DOCKER_BUILDKIT=1 docker build --platform=linux/amd64 -t $(ORGANIZATION)/$(IMAGE):$(IMAGE_TAG) .
endif
	@if [ "$(DOCKER_PUSH)" = "true" ] ; then docker push $(ORGANIZATION)/$(IMAGE):$(IMAGE_TAG) ; fi

.PHONY: push
push:
	docker push $(ORGANIZATION)/$(IMAGE):$(IMAGE_TAG)
