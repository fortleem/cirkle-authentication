#!/bin/bash
# Cirkle Authentication — backup script
# Creates:
#   1. A consistent SQLite snapshot (VACUUM INTO — safe while the DB is in use)
#   2. A git bundle of the full repository history (code + commits)
#   3. An SHA-256 manifest for integrity verification
# Usage: bash scripts/backup.sh
set -euo pipefail
cd /home/z/my-project

STAMP=$(date -u +%Y%m%d-%H%M%S)
DIR="backups/${STAMP}"
mkdir -p "${DIR}"

# 1) Database snapshot — VACUUM INTO produces a consistent, compacted copy
#    without interrupting readers/writers on the live database.
bun -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$executeRawUnsafe(\"VACUUM INTO '${DIR}/cirkle-auth.db'\")
  .then(() => { console.log('✓ DB snapshot: ${DIR}/cirkle-auth.db'); return p.\$disconnect(); })
  .catch((e) => { console.error('✗ DB backup failed:', e.message); process.exit(1); });
"

# 2) Code + full history as a git bundle (restorable with git clone)
git bundle create "${DIR}/cirkle-authentication.bundle" --all
echo "✓ Git bundle: ${DIR}/cirkle-authentication.bundle"

# 3) Integrity manifest
sha256sum "${DIR}/cirkle-auth.db" "${DIR}/cirkle-authentication.bundle" > "${DIR}/SHA256SUMS"
echo "✓ Manifest: ${DIR}/SHA256SUMS"

# Keep the last 10 backups (prune older ones)
ls -1d backups/*/ 2>/dev/null | sort | head -n -10 | xargs -r rm -rf

echo ""
echo "Backup complete → ${DIR}"
du -sh "${DIR}"/* | sed 's|^|  |'
echo ""
echo "Restore database:  cp ${DIR}/cirkle-auth.db db/custom.db"
echo "Restore code:      git clone ${DIR}/cirkle-authentication.bundle cirkle-authentication"
