#!/bin/bash
# Ensures .env / .env.local exist with all required keys.
# Run on server startup if env files might have been wiped.
# Secrets are generated locally — never hardcoded, never committed.
cd /home/z/my-project

ensure_file() {
  local file="$1"
  if [ ! -f "$file" ]; then
    if [ -f .env.example ]; then
      # Copy the template, then strip placeholder secrets so a fresh
      # .env.local can never override a real value from .env with
      # a "change-me" placeholder (Next.js gives .env.local priority).
      sed -e 's|^JWT_SECRET=.*|JWT_SECRET=|' \
          -e 's|^INNGEST_SIGNING_KEY=.*|INNGEST_SIGNING_KEY=|' \
          -e 's|^NEXT_PUBLIC_RP_ID=.*|NEXT_PUBLIC_RP_ID=|' \
          -e 's|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=|' \
          .env.example > "$file"
      echo "✓ $file created from .env.example (secrets stripped to not override .env)"
    else
      echo "DATABASE_URL=file:/home/z/my-project/db/custom.db" > "$file"
      echo "✓ $file created with defaults"
    fi
  fi
}

ensure_file .env
ensure_file .env.local

# Ensure a strong JWT_SECRET exists in every env file that is present.
# (An empty or placeholder value in .env.local would OVERRIDE the real
# secret from .env, because Next.js gives .env.local higher priority —
# and an empty string makes the app fall back to the weak dev default.)
ensure_strong_secret() {
  local file="$1"
  [ -f "$file" ] || return 0
  local needs_fix=0
  if ! grep -q '^JWT_SECRET=' "$file"; then needs_fix=1; fi
  if grep -q '^JWT_SECRET=change-me' "$file"; then needs_fix=1; fi
  if grep -q '^JWT_SECRET=$' "$file"; then needs_fix=1; fi
  if [ "$needs_fix" = "1" ]; then
    local SECRET
    SECRET=$(openssl rand -base64 48 | tr -d '\n' | tr '/+' '_-')
    if grep -q '^JWT_SECRET=' "$file"; then
      sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=${SECRET}|" "$file" && rm -f "$file.bak"
    else
      echo "JWT_SECRET=${SECRET}" >> "$file"
    fi
    echo "✓ Strong JWT_SECRET generated in $file"
  fi
}

ensure_strong_secret .env
ensure_strong_secret .env.local

echo "✓ Environment guard passed"
