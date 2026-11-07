#!/bin/bash
# Ensures .env.local exists with all required keys.
# Run this on server startup if .env.local might have been wiped.
# Secrets are loaded from environment variables or .env — NOT hardcoded here.
cd /home/z/my-project
if [ ! -f .env.local ]; then
  echo "⚠ .env.local MISSING — recreating from .env.example template..."
  # Copy the template — the user must fill in real values
  cp .env.example .env.local
  echo "✓ .env.local created from .env.example"
  echo "⚠ Please edit .env.local with real API keys before using Circle Brain / Inngest."
fi
