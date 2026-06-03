#!/usr/bin/env bash
# Create GitHub repo (if needed) and push main. Requires: gh auth login
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="${HOME}/.local/bin:${PATH}"

REPO_NAME="${1:-Veil-Lumen}"
GITHUB_USER="${GITHUB_USER:-Thedoctorjpg}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: https://cli.github.com/ (or: curl gh release to ~/.local/bin)"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run once:"
  echo "  gh auth login"
  exit 1
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init -b main
  git config user.name "${GIT_AUTHOR_NAME:-$(gh api user -q .login 2>/dev/null || echo david)}"
  git config user.email "${GIT_AUTHOR_EMAIL:-$(gh api user -q .id 2>/dev/null | xargs -I{} echo {}+${GITHUB_USER}@users.noreply.github.com)}"
fi

if ! git rev-parse HEAD >/dev/null 2>&1; then
  git add -A
  git commit -m "Initial commit: Veil Lumen WebApp Browser Ghost v4.2"
fi

REMOTE="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

if gh repo view "${GITHUB_USER}/${REPO_NAME}" >/dev/null 2>&1; then
  echo "Repo exists: https://github.com/${GITHUB_USER}/${REPO_NAME}"
  git remote remove origin 2>/dev/null || true
  git remote add origin "$REMOTE"
  git push -u origin main
else
  echo "Creating public repo ${GITHUB_USER}/${REPO_NAME}…"
  gh repo create "$REPO_NAME" \
    --public \
    --source=. \
    --remote=origin \
    --push \
    --description "Veil Lumen — Vocaloid-inspired Browser Ghost v4.2 (static WebApp + CLI pipeline)"
fi

echo ""
echo "Done: https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo "Enable Pages: Settings → Pages → Source: GitHub Actions"
echo "Live URL (after workflow): https://${GITHUB_USER}.github.io/${REPO_NAME}/"