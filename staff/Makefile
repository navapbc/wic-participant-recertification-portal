.PHONY : \
  release-build

release-build:
  docker buildx build \
    --target prod \
    --platform=linux/amd64 \
    $(OPTS) \
    .
