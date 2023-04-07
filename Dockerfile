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

ENV KUBEFILL_USER_ID=999
ENV DEBIAN_FRONTEND=noninteractive

RUN groupadd -g $KUBEFILL_USER_ID kubefill && \
    useradd -r -u $KUBEFILL_USER_ID -g kubefill kubefill && \
    mkdir -p /home/kubefill && \
    chown kubefill:0 /home/kubefill && \
    chmod g=u /home/kubefill && \
    apt-get update && \
    apt-get dist-upgrade -y && \
    apt-get install -y \
    curl git git-lfs tini gpg unzip tzdata && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir -p /home/kubefill/.ssh && touch /home/kubefill/.ssh/known_hosts
RUN echo "github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=" >> /home/kubefill/.ssh/known_hosts

COPY entrypoint.sh /usr/local/bin/entrypoint.sh

ENV USER=kubefill

USER $KUBEFILL_USER_ID
WORKDIR /home/kubefill

####################################################################################################
# UI stage
####################################################################################################
FROM --platform=$BUILDPLATFORM docker.io/library/node:16 AS kubefill-ui

WORKDIR /src
COPY ["ui/package.json", "./"]

RUN yarn install && yarn cache clean --all

COPY ["ui/", "."]

RUN NODE_ENV='production' NODE_OPTIONS=--max_old_space_size=8192 yarn build

####################################################################################################
# Build stage which performs the actual build of binaries
####################################################################################################
FROM --platform=$BUILDPLATFORM docker.io/library/golang:1.19 AS kubefill-build

WORKDIR /go/src/github.com/kubefill/kubefill

COPY go.* ./
RUN go mod download

# Perform the build
COPY . .
COPY --from=kubefill-ui /src/build /go/src/github.com/kubefill/kubefill/ui/build
RUN make kubefill-all

####################################################################################################
# Final image
####################################################################################################
FROM kubefill-base
COPY --from=kubefill-build /go/src/github.com/kubefill/kubefill/dist/kubefill* /usr/local/bin/

USER root
RUN ln -s /usr/local/bin/kubefill /usr/local/bin/kubefill-server && \
    ln -s /usr/local/bin/kubefill /usr/local/bin/kubefill-reposerver

USER $KUBEFILL_USER_ID
