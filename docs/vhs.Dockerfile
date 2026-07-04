# Image used to record docs/demo.gif — vhs plus enough dev tools
# for onmymachine to detect something interesting.
#
#   docker build -t onmymachine-vhs -f docs/vhs.Dockerfile .
#   docker run --rm -v "$PWD:/vhs" onmymachine-vhs docs/demo.tape
FROM ghcr.io/charmbracelet/vhs
RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm git python3 \
    && rm -rf /var/lib/apt/lists/*
