.PHONY : \
	release-build

ifeq ($(ENV_NAME), dev)
TARGET := lower-envs
else
TARGET := prod
endif

release-build:
	docker buildx build \
		--target $(TARGET) \
		--platform=linux/amd64 \
		$(OPTS) \
		.
