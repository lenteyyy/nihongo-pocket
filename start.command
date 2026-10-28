#!/bin/bash
cd "$(dirname "$0")" || exit 1
NODE_BIN="$(command -v node 2>/dev/null || true)"
if [ -z "$NODE_BIN" ]; then NODE_BIN="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; fi
if [ ! -x "$NODE_BIN" ]; then printf 'Node.js が見つかりません。\n'; exit 1; fi
if curl -fsS http://127.0.0.1:4173/ 2>/dev/null | grep -q '日本語 Pocket'; then open http://127.0.0.1:4173/; exit 0; fi
"$NODE_BIN" scripts/build.mjs || exit 1
"$NODE_BIN" scripts/dev.mjs &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1:4173/ >/dev/null 2>&1; then open http://127.0.0.1:4173/; wait "$SERVER_PID"; exit; fi
  sleep 0.2
done
printf 'サーバーを起動できませんでした。\n'
exit 1
