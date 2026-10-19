.PHONY: install test test-python test-contracts build run-api run-web seed-data clean

install:
	@echo "Installing Python dependencies in virtualenv..."
	python3 -m venv .venv
	.venv/bin/pip install -r services/api/requirements.txt
	@echo "Installing Contracts dependencies..."
	cd contracts && npm install
	@echo "Installing Web dependencies..."
	cd apps/web && npm install

seed-data:
	@echo "Ingesting real climate observations for Sylhet..."
	PYTHONPATH=. .venv/bin/python3 ml/data/seed_data.py

test-python:
	@echo "Running Python test suite..."
	PYTHONPATH=. .venv/bin/pytest tests/ -v

test-contracts:
	@echo "Running Hardhat smart contract test suite..."
	cd contracts && npx hardhat test

test: test-python test-contracts

build:
	@echo "Building Next.js frontend..."
	cd apps/web && npm run build

run-api:
	@echo "Starting FastAPI backend on port 8000..."
	PYTHONPATH=. .venv/bin/uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload

run-web:
	@echo "Starting Next.js frontend on port 3000..."
	cd apps/web && npm run dev

clean:
	rm -rf .pytest_cache contracts/cache contracts/artifacts apps/web/.next
