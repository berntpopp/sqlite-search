# Makefile for sqlite-search
# Modern Electron + Vite + Vue 3 application

.PHONY: help install dev build dist clean lint format typecheck test test-watch

# Default target - show help
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(CYAN)sqlite-search - Available commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)make %-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Install dependencies with pnpm
	@echo "$(CYAN)Installing dependencies...$(NC)"
	pnpm install

dev: ## Start development server
	@echo "$(CYAN)Starting development server...$(NC)"
	pnpm run dev

build: ## Build application for production
	@echo "$(CYAN)Building application...$(NC)"
	pnpm run build

dist: build ## Create distributable executables
	@echo "$(CYAN)Creating distributable executables...$(NC)"
	pnpm run build:dist

preview: build ## Preview production build
	@echo "$(CYAN)Previewing production build...$(NC)"
	pnpm run preview

clean: ## Remove build artifacts and dependencies
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf dist dist-electron node_modules/.vite .eslintcache

clean-all: clean ## Remove everything including node_modules
	@echo "$(YELLOW)Removing node_modules...$(NC)"
	rm -rf node_modules pnpm-lock.yaml

lint: ## Run ESLint and auto-fix issues
	@echo "$(CYAN)Running ESLint...$(NC)"
	pnpm run lint

format: ## Format code with Prettier
	@echo "$(CYAN)Formatting code with Prettier...$(NC)"
	pnpm run format

typecheck: ## Run TypeScript type checking
	@echo "$(CYAN)Running TypeScript type checking...$(NC)"
	pnpm run typecheck

test: ## Run tests with Vitest
	@echo "$(CYAN)Running tests...$(NC)"
	pnpm run test

test-watch: ## Run tests in watch mode
	@echo "$(CYAN)Running tests in watch mode...$(NC)"
	pnpm run test:watch

# Development workflow targets
check: lint typecheck ## Run linting and type checking
	@echo "$(GREEN)All checks passed!$(NC)"

ready: check test ## Run all checks and tests before committing
	@echo "$(GREEN)Ready to commit!$(NC)"

# Quick rebuild
rebuild: clean install build ## Clean, install, and build
	@echo "$(GREEN)Rebuild complete!$(NC)"
