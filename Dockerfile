ARG BASE_IMAGE=docker.io/library/ubuntu:22.04
####################################################################################################
# Builder image
# Initial stage which pulls prepares build dependencies and CLI tooling we need for our final image
# Also used as the image in CI jobs so needs all dependencies
####################################################################################################
FROM docker.io/library/golang:1.19 AS builder

RUN echo 'deb http://deb.debian.org/debian buster-backports main' >> /etc/apt/sources.list

RUN apt-get update && apt-get install --no-install-recommends -y \
    openssh-server \
    nginx \
    unzip \
    fcgiwrap \
    git \
    git-lfs \
    make \
    wget \
    gcc \
    sudo \
    zip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /tmp

####################################################################################################
# Base - used as the base for both the release and dev images
####################################################################################################
FROM $BASE_IMAGE AS kubefill-base

USER root

ENV USER_ID=999
ENV DEBIAN_FRONTEND=noninteractive

RUN groupadd -g $USER_ID kubefill && \
    useradd -r -u $USER_ID -g kubefill kubefill && \
    mkdir -p /home/kubefill && \
    chown kubefill:0 /home/kubefill && \
    chmod g=u /home/kubefill

RUN apt-get update && \
    apt-get dist-upgrade -y && \
    apt-get install -y \
    git git-lfs tini gpg tzdata && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY entrypoint.sh /usr/local/bin/entrypoint.sh

ENV USER=kubefill

USER $USER_ID
WORKDIR /home/kubefill

####################################################################################################
# UI stage
####################################################################################################
FROM docker.io/library/node:12.18.4 AS kubefill-ui

WORKDIR /src
COPY ["ui/package.json", "ui/package-lock.json", "./"]

RUN npm install && npm cache clean --force

COPY ["ui/", "."]

ARG TARGETARCH
RUN HOST_ARCH=$TARGETARCH NODE_ENV='production' NODE_OPTIONS=--max_old_space_size=8192 npm run build

####################################################################################################
# Build stage which performs the actual build of binaries
####################################################################################################
FROM docker.io/library/golang:1.19 AS kubefill-build

WORKDIR /go/src/github.com/kubefill/kubefill

COPY go.* ./
RUN go mod download

# Perform the build
COPY . .
COPY --from=kubefill-ui /src/build /go/src/github.com/kubefill/kubefill/ui/build
ARG TARGETOS
ARG TARGETARCH
RUN GOOS=$TARGETOS GOARCH=$TARGETARCH make kubefill-all

####################################################################################################
# Final image
####################################################################################################
FROM kubefill-base
COPY --from=kubefill-build /go/src/github.com/kubefill/kubefill/dist/kubefill* /usr/local/bin/

USER root
RUN ln -s /usr/local/bin/kubefill /usr/local/bin/kubefill-server && \
    ln -s /usr/local/bin/kubefill /usr/local/bin/kubefill-reposerver

USER $USER_ID
