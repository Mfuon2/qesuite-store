#!/usr/bin/env bash
# QeSuite deploy script — builds and deploys worker + both Pages apps.
# Will refuse to deploy if there are uncommitted changes or unpushed commits.

set -euo pipefail

# ── colours ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

PASS="${GREEN}✔${RESET}"
FAIL="${RED}✖${RESET}"
INFO="${CYAN}▸${RESET}"
WARN="${YELLOW}!${RESET}"

# ── helpers ────────────────────────────────────────────────────────────────
step()  { echo -e "\n${BOLD}${CYAN}▶ $1${RESET}"; }
ok()    { echo -e "  ${PASS} $1"; }
fail()  { echo -e "  ${FAIL} ${RED}$1${RESET}"; }
warn()  { echo -e "  ${WARN} ${YELLOW}$1${RESET}"; }
info()  { echo -e "  ${INFO} ${DIM}$1${RESET}"; }
hr()    { echo -e "${DIM}──────────────────────────────────────────────────────${RESET}"; }
abort() { echo -e "\n${RED}${BOLD}ABORTED: $1${RESET}\n"; exit 1; }

# ── track results ──────────────────────────────────────────────────────────
declare -A BUILD_STATUS=()
declare -A DEPLOY_STATUS=()

record_build()  { BUILD_STATUS["$1"]="$2"; }
record_deploy() { DEPLOY_STATUS["$1"]="$2"; }

# ── summary table ──────────────────────────────────────────────────────────
print_summary() {
  echo ""
  hr
  echo -e "${BOLD}  Deployment Summary${RESET}"
  hr
  printf "  %-22s  %-12s  %-12s\n" "Target" "Build" "Deploy"
  hr
  for target in "worker-api" "qesuite-go" "qesuite-store"; do
    local b="${BUILD_STATUS[$target]:-skipped}"
    local d="${DEPLOY_STATUS[$target]:-skipped}"
    local bc dc
    [[ "$b" == "ok" ]]      && bc="${GREEN}${b}${RESET}"      || bc="${RED}${b}${RESET}"
    [[ "$d" == "ok" ]]      && dc="${GREEN}${d}${RESET}"      || dc="${RED}${d}${RESET}"
    [[ "$b" == "skipped" ]] && bc="${DIM}${b}${RESET}"
    [[ "$d" == "skipped" ]] && dc="${DIM}${d}${RESET}"
    printf "  %-22s  %-22b  %-22b\n" "$target" "$bc" "$dc"
  done
  hr
  echo ""
}

# ── cd to repo root (script is at repo root) ──────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${BOLD}  QeSuite — Build & Deploy${RESET}"
echo -e "  ${DIM}$(date '+%Y-%m-%d %H:%M:%S %Z')${RESET}"
hr

# ══════════════════════════════════════════════════════════════════════════
# 1. GIT SAFETY — must be clean and pushed
# ══════════════════════════════════════════════════════════════════════════
step "Git safety checks"

# Inside a git repo?
if ! git rev-parse --git-dir &>/dev/null; then
  abort "Not inside a git repository."
fi

# Uncommitted changes?
if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "You have uncommitted changes."
  echo ""
  git status --short | head -20 | sed 's/^/      /'
  echo ""
  abort "Commit or stash all changes before deploying."
fi
ok "Working tree is clean"

# Untracked files?
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')
if [[ "$UNTRACKED" -gt 0 ]]; then
  warn "$UNTRACKED untracked file(s) — not blocking but consider adding them"
  git ls-files --others --exclude-standard | head -10 | sed 's/^/        /'
fi

# On a branch?
BRANCH=$(git rev-parse --abbrev-ref HEAD)
ok "On branch: ${BOLD}${BRANCH}${RESET}"

# Remote tracking branch exists?
if ! git rev-parse --abbrev-ref "@{u}" &>/dev/null; then
  warn "No upstream set for '${BRANCH}' — skipping push check"
  warn "Push manually: git push -u origin ${BRANCH}"
else
  # Unpushed commits?
  AHEAD=$(git rev-list --count "@{u}..HEAD" 2>/dev/null || echo 0)
  if [[ "$AHEAD" -gt 0 ]]; then
    fail "${AHEAD} commit(s) not pushed to remote."
    git log --oneline "@{u}..HEAD" | sed 's/^/      /'
    echo ""
    abort "Push to VCS before deploying: git push"
  fi
  ok "Branch is up-to-date with remote (0 commits ahead)"

  # Check remote is ahead (warn only — someone may have pushed)
  BEHIND=$(git rev-list --count "HEAD..@{u}" 2>/dev/null || echo 0)
  if [[ "$BEHIND" -gt 0 ]]; then
    warn "Remote is ${BEHIND} commit(s) ahead — consider pulling first"
  fi
fi

# ══════════════════════════════════════════════════════════════════════════
# 2. TOOL CHECKS
# ══════════════════════════════════════════════════════════════════════════
step "Checking required tools"

for tool in bun wrangler curl; do
  if command -v "$tool" &>/dev/null; then
    ok "$tool $(${tool} --version 2>&1 | head -1)"
  else
    abort "'${tool}' not found in PATH. Install it and try again."
  fi
done

# ══════════════════════════════════════════════════════════════════════════
# 3. SECRETS CHECK — required secrets must exist on the Worker
# ══════════════════════════════════════════════════════════════════════════
step "Verifying Worker secrets"

REQUIRED_SECRETS=("JWT_SECRET" "SMS_API_KEY" "SMS_PARTNER_ID" "SMS_SHORTCODE")
OPTIONAL_SECRETS=("GOOGLE_PLACES_KEY" "MPESA_CONSUMER_KEY" "MPESA_CONSUMER_SECRET" "MPESA_PASSKEY" "MPESA_SHORTCODE")

info "Fetching secret list from Cloudflare..."
RAW_SECRETS=$(wrangler secret list 2>&1)
if echo "$RAW_SECRETS" | grep -q "Error\|error\|not found"; then
  warn "Could not fetch secrets (maybe not logged in to wrangler?)"
  warn "Skipping secrets check — continuing anyway"
else
  MISSING_REQUIRED=()
  for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$RAW_SECRETS" | grep -q "\"$secret\""; then
      ok "Required: ${secret}"
    else
      fail "MISSING required secret: ${RED}${secret}${RESET}"
      MISSING_REQUIRED+=("$secret")
    fi
  done

  for secret in "${OPTIONAL_SECRETS[@]}"; do
    if echo "$RAW_SECRETS" | grep -q "\"$secret\""; then
      ok "Optional: ${secret}"
    else
      warn "Optional not set: ${secret} (some features may not work)"
    fi
  done

  if [[ ${#MISSING_REQUIRED[@]} -gt 0 ]]; then
    echo ""
    echo -e "  Set missing secrets with:"
    for s in "${MISSING_REQUIRED[@]}"; do
      echo -e "    ${CYAN}wrangler secret put ${s}${RESET}"
    done
    echo ""
    abort "Required secrets are missing. Set them before deploying."
  fi
fi

# ══════════════════════════════════════════════════════════════════════════
# 4. CLOUDFLARE INFRA CHECK — D1, R2, Queue must exist
# ══════════════════════════════════════════════════════════════════════════
step "Verifying Cloudflare infrastructure"

# D1 database
info "Checking D1 database (qesuite_db)..."
D1_CHECK=$(wrangler d1 list 2>&1)
if echo "$D1_CHECK" | grep -q "qesuite_db"; then
  ok "D1 database: qesuite_db found"
else
  fail "D1 database 'qesuite_db' not found in your account"
  abort "Create the D1 database: wrangler d1 create qesuite_db"
fi

# R2 bucket
info "Checking R2 bucket (qesuite-images)..."
R2_CHECK=$(wrangler r2 bucket list 2>&1)
if echo "$R2_CHECK" | grep -q "qesuite-images"; then
  ok "R2 bucket: qesuite-images found"
else
  fail "R2 bucket 'qesuite-images' not found"
  abort "Create R2 bucket: wrangler r2 bucket create qesuite-images"
fi

# Queue
info "Checking Queue (qesuite-notifications)..."
QUEUE_CHECK=$(wrangler queues list 2>&1)
if echo "$QUEUE_CHECK" | grep -q "qesuite-notifications"; then
  ok "Queue: qesuite-notifications found"
else
  warn "Queue 'qesuite-notifications' not found — creating it now..."
  if wrangler queues create qesuite-notifications 2>&1; then
    ok "Queue created: qesuite-notifications"
  else
    fail "Could not create queue — check your Cloudflare plan (Queues require Workers Paid plan)"
    abort "Create queue manually: wrangler queues create qesuite-notifications"
  fi
fi

# Pages projects
info "Checking Pages projects..."
PAGES_CHECK=$(wrangler pages project list 2>&1)
for proj in "qesuite-go" "qesuite-store"; do
  if echo "$PAGES_CHECK" | grep -q "$proj"; then
    ok "Pages project: ${proj}"
  else
    warn "Pages project '${proj}' not found — wrangler will create it on first deploy"
  fi
done

# Migrations MUST be applied before the worker deploys — new code querying
# missing columns/tables is a guaranteed 500 in production.
info "Checking migrations (remote)..."
MIGRATION_CHECK=$(wrangler d1 migrations list qesuite_db --remote 2>&1)
if echo "$MIGRATION_CHECK" | grep -q "No migrations to apply"; then
  ok "All migrations applied"
elif echo "$MIGRATION_CHECK" | grep -qE "Error|error"; then
  fail "Could not read migration state from remote D1:"
  echo "$MIGRATION_CHECK" | tail -5 | sed 's/^/      /'
  abort "Fix wrangler auth (wrangler login) and retry — deploying without schema checks is unsafe."
else
  warn "Pending migration(s) on remote D1:"
  echo "$MIGRATION_CHECK" | grep -E "\.sql" | sed 's/^/        /'
  echo ""
  read -rp "  Apply pending migrations now? [y/N] " APPLY_MIGRATIONS
  if [[ "$APPLY_MIGRATIONS" == "y" || "$APPLY_MIGRATIONS" == "Y" ]]; then
    # Use `migrations apply` (NOT `d1 execute --file`) so d1_migrations is recorded
    # and the same migration is never re-applied on the next deploy.
    if wrangler d1 migrations apply qesuite_db --remote 2>&1 | tail -10 | sed 's/^/      /'; then
      ok "Migrations applied"
    else
      abort "Migration apply failed — fix the migration before deploying."
    fi
  else
    abort "Deploying code without its migrations causes production 500s. Apply migrations first."
  fi
fi

# ══════════════════════════════════════════════════════════════════════════
# 5. WORKER API — build (type-check) + deploy
# ══════════════════════════════════════════════════════════════════════════
step "Worker API  →  qesuite-worker-api.leemfo.workers.dev"

info "Type-checking worker-api..."
if bun run --cwd apps/worker-api tsc --noEmit 2>&1 | tee /tmp/qesuite_worker_tsc.log | grep -qE "error TS"; then
  fail "TypeScript errors in worker-api:"
  grep "error TS" /tmp/qesuite_worker_tsc.log | head -15 | sed 's/^/      /'
  record_build  "worker-api" "failed"
  record_deploy "worker-api" "skipped"
  print_summary
  abort "Fix worker-api TypeScript errors before deploying."
fi
ok "No TypeScript errors"
record_build "worker-api" "ok"

info "Deploying worker..."
if wrangler deploy 2>&1 | tee /tmp/qesuite_worker_deploy.log | tail -5 | sed 's/^/      /'; then
  WORKER_URL=$(grep -oE 'https://[^ ]+workers\.dev' /tmp/qesuite_worker_deploy.log | head -1 || echo "deployed")
  ok "Worker deployed → ${BOLD}${WORKER_URL}${RESET}"
  record_deploy "worker-api" "ok"
else
  fail "Worker deploy failed"
  record_deploy "worker-api" "failed"
  print_summary
  abort "Worker deploy failed — see output above."
fi

# Quick health check
info "Health check..."
if command -v curl &>/dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    "https://qesuite-worker-api.leemfo.workers.dev/health" 2>/dev/null || echo "000")
  if [[ "$HTTP_CODE" == "200" ]]; then
    ok "Health check passed (HTTP ${HTTP_CODE})"
  else
    warn "Health check returned HTTP ${HTTP_CODE} — may need a moment to propagate"
  fi

  # Smoke check a real DB-backed route — /health can pass while routes 500
  # on schema drift (missing columns), so hit the public storefront API too.
  info "Smoke check (DB-backed route)..."
  SMOKE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    "https://qesuite-worker-api.leemfo.workers.dev/api/storefront" 2>/dev/null || echo "000")
  if [[ "$SMOKE_CODE" == "200" ]]; then
    ok "Storefront API responding (HTTP ${SMOKE_CODE})"
  else
    fail "Storefront API returned HTTP ${SMOKE_CODE} — the deployed worker may be broken"
    record_deploy "worker-api" "failed"
    print_summary
    abort "Post-deploy smoke check failed. Check schema/migrations: wrangler d1 migrations list qesuite_db --remote"
  fi
fi

# ══════════════════════════════════════════════════════════════════════════
# 6. DASHBOARD APP (apps/app) → go.qesuite.com
# ══════════════════════════════════════════════════════════════════════════
step "Dashboard app  →  go.qesuite.com  (project: qesuite-go)"

info "Building apps/app..."
if bun run --cwd apps/app build 2>&1 | tee /tmp/qesuite_app_build.log | tail -8 | sed 's/^/      /'; then
  DIST_SIZE=$(du -sh apps/app/dist 2>/dev/null | cut -f1 || echo "?")
  ok "Build succeeded (dist: ${DIST_SIZE})"
  record_build "qesuite-go" "ok"
else
  fail "apps/app build failed:"
  tail -20 /tmp/qesuite_app_build.log | sed 's/^/      /'
  record_build  "qesuite-go" "failed"
  record_deploy "qesuite-go" "skipped"
  print_summary
  abort "Fix apps/app build errors before deploying."
fi

info "Deploying to Cloudflare Pages (qesuite-go)... (uploading, please wait)"
wrangler pages deploy apps/app/dist --project-name qesuite-go 2>&1 \
  | tee /tmp/qesuite_app_deploy.log \
  | sed 's/^/      /'
if grep -qE "✨|Deployment complete|Successfully deployed" /tmp/qesuite_app_deploy.log; then
  ok "Dashboard deployed → ${BOLD}https://go.qesuite.com${RESET}"
  record_deploy "qesuite-go" "ok"
else
  fail "Dashboard deploy failed"
  record_deploy "qesuite-go" "failed"
  print_summary
  abort "Dashboard deploy failed — see output above."
fi

# ══════════════════════════════════════════════════════════════════════════
# 7. STOREFRONT (apps/storefront) → store.qesuite.com
# ══════════════════════════════════════════════════════════════════════════
step "Storefront  →  store.qesuite.com  (project: qesuite-store)"

info "Building apps/storefront..."
if bun run --cwd apps/storefront build 2>&1 | tee /tmp/qesuite_storefront_build.log | tail -8 | sed 's/^/      /'; then
  DIST_SIZE=$(du -sh apps/storefront/dist 2>/dev/null | cut -f1 || echo "?")
  ok "Build succeeded (dist: ${DIST_SIZE})"
  record_build "qesuite-store" "ok"
else
  fail "apps/storefront build failed:"
  tail -20 /tmp/qesuite_storefront_build.log | sed 's/^/      /'
  record_build  "qesuite-store" "failed"
  record_deploy "qesuite-store" "skipped"
  print_summary
  abort "Fix storefront build errors before deploying."
fi

info "Deploying to Cloudflare Pages (qesuite-store)... (uploading ~10 MB, may take 1–2 min)"
wrangler pages deploy apps/storefront/dist --project-name qesuite-store 2>&1 \
  | tee /tmp/qesuite_storefront_deploy.log \
  | sed 's/^/      /'
if grep -qE "✨|Deployment complete|Successfully deployed" /tmp/qesuite_storefront_deploy.log; then
  ok "Storefront deployed → ${BOLD}https://store.qesuite.com${RESET}"
  record_deploy "qesuite-store" "ok"
else
  fail "Storefront deploy failed"
  record_deploy "qesuite-store" "failed"
  print_summary
  abort "Storefront deploy failed — see output above."
fi

# ══════════════════════════════════════════════════════════════════════════
# 8. DONE
# ══════════════════════════════════════════════════════════════════════════
print_summary

echo -e "${GREEN}${BOLD}  All deployments complete.${RESET}"
echo ""
echo -e "  Worker API  →  ${CYAN}https://qesuite-worker-api.leemfo.workers.dev${RESET}"
echo -e "  Dashboard   →  ${CYAN}https://go.qesuite.com${RESET}"
echo -e "  Storefront  →  ${CYAN}https://store.qesuite.com${RESET}"
echo ""
