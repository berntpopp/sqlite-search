# Makefile for sqlite-search
# Electron + Vue 3 + Vuetify 3 + electron-vite

.PHONY: help install dev build dist clean clean-all \
        lint format typecheck test test-run test-coverage test-ui \
        test-e2e test-e2e-headed test-e2e-setup \
        check ci rebuild

.DEFAULT_GOAL := help

## ── Help ─────────────────────────────────────────────────
help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

## ── Development ──────────────────────────────────────────
install: ## Install dependencies with pnpm
	pnpm install

dev: ## Start dev server with hot-reload
	pnpm run dev

## ── Build ────────────────────────────────────────────────
build: ## Build electron-vite output
	pnpm run build

dist: ## Build and create distributable installer
	pnpm run dist

## ── Code Quality ─────────────────────────────────────────
lint: ## Run ESLint with auto-fix
	pnpm run lint

format: ## Format code with Prettier
	pnpm run format

typecheck: ## Run TypeScript type checking
	pnpm run typecheck

check: lint typecheck ## Run lint + typecheck

## ── Unit Tests (Vitest) ──────────────────────────────────
test: ## Run unit tests (watch mode)
	pnpm run test

test-run: ## Run unit tests (single run)
	pnpm run test:run

test-coverage: ## Run unit tests with coverage
	pnpm run test:coverage

test-ui: ## Open Vitest UI
	pnpm run test:ui

## ── E2E Tests (Playwright) ──────────────────────────────
test-e2e: build ## Run E2E tests (headless, requires build)
	pnpm run test:e2e

test-e2e-headed: build ## Run E2E tests with visible window
	pnpm run test:e2e:headed

test-e2e-setup: ## Generate test database
	pnpm run test:e2e:setup

## ── CI Pipeline ──────────────────────────────────────────
ci: lint typecheck test-run build ## Full CI check (lint → typecheck → test → build)

## ── Maintenance ──────────────────────────────────────────
clean: ## Remove build artifacts
	rm -rf dist dist-electron .eslintcache playwright-report e2e-results

clean-all: clean ## Remove build artifacts + node_modules
	rm -rf node_modules

rebuild: clean install build ## Clean → install → build
