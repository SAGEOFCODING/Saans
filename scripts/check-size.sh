#!/usr/bin/env bash
set -euo pipefail

# Max allowed size in KB (5 MB = 5120 KB, hard limit is 10 MB)
MAX_KB=5120

# Scan for banned binaries or images per submission constraints
BANNED_EXTS="\.(png|jpg|jpeg|webp|gif|mp4|zip|tar|gz|woff|woff2|ttf|pdf)$"
if command -v git >/dev/null 2>&1; then
  BANNED_FILES=$(git ls-files 2>/dev/null | grep -E "$BANNED_EXTS" || true)
  if [ -n "$BANNED_FILES" ]; then
    echo "ERROR: Banned binary or asset files detected in git tracking:" >&2
    echo "$BANNED_FILES" >&2
    exit 1
  fi
fi

# Calculate directory size excluding node_modules and .next
if command -v du >/dev/null 2>&1; then
  SIZE_KB=$(du -sk --exclude='node_modules' --exclude='.next' . 2>/dev/null | awk '{print $1}')
else
  echo "Warning: du not found. Falling back to git tracked file size."
  SIZE_KB=$(git ls-files -z | xargs -0 wc -c 2>/dev/null | tail -n 1 | awk '{print int($1/1024)}')
fi

echo "Repository size (excluding node_modules/.next): ${SIZE_KB} KB (Limit: ${MAX_KB} KB)"

if [ "$SIZE_KB" -gt "$MAX_KB" ]; then
  echo "ERROR: Repo size exceeds 5 MB limit!" >&2
  exit 1
fi

echo "Repo size check passed: ${SIZE_KB} KB <= ${MAX_KB} KB."
exit 0
