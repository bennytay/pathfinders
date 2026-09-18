#!/bin/sh

set -eu

circle_script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
circle_repo_root=$(dirname -- "$circle_script_dir")
cd "$circle_repo_root"

python3 scripts/sync_ios_demo.py --watch &
circle_sync_pid=$!
cleanup() {
  kill "$circle_sync_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd web
python3 -m http.server 4173
