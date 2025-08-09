.PHONY: clean
clean:
	npm run clean

.PHONY: dev
dev:
	npm run watch

.PHONY: build
build: clean
	npm run build
