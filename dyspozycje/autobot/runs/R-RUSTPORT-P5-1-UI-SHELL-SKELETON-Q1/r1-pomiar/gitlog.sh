#!/usr/bin/env bash
# Log Git dla P5.1 r1: jawne `git add` ścieżek z allowlisty, status, stat, --check, ścieżki zakazane.
WT=/home/user/The-Game/.claude/worktrees/wf_bcb1b0ee-f7d-1
L=$WT/dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/r1-logi/08-git.log
cd "$WT" || exit 2
git add src-tauri/frontend-v2 dyspozycje/rust-port/p5/P5-1-UI-SHELL-SKELETON.md dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1
# *.log jest w .gitignore:20 — logi bram dodawane jawnie z -f (precedens: 5 plików .log śledzonych w dyspozycje/autobot/runs)
touch "$L"
git add -f dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/r1-logi/0{1,2,3,4,5,6,7,8}-*.log
{
  echo "\$ git rev-parse HEAD"; git rev-parse HEAD
  echo "\$ git status --porcelain --untracked-files=all | grep -v '^A ' (niezaindeksowane / poza indeksem)"; git status --porcelain --untracked-files=all | grep -v '^A ' ; echo "(koniec)"
  echo "\$ git diff --cached --name-only | sed 's#/.*##' | sort | uniq -c   (korzenie zmian)"; git diff --cached --name-only | awk -F/ '{print $1"/"$2}' | sort | uniq -c
  echo "\$ git diff --cached --name-only | grep -v -E '^(src-tauri/frontend-v2/|dyspozycje/rust-port/p5/P5-1-UI-SHELL-SKELETON\.md$|dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/)'   (poza allowlistą)"
  git diff --cached --name-only | grep -v -E '^(src-tauri/frontend-v2/|dyspozycje/rust-port/p5/P5-1-UI-SHELL-SKELETON\.md$|dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/)'; echo "(koniec)"
  echo "\$ git diff --cached --name-only -- gra src-tauri/frontend src-tauri/src src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json rust-port .github   (zakazane)"
  git diff --cached --name-only -- gra src-tauri/frontend src-tauri/src src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json rust-port .github; echo "(koniec)"
  echo "\$ git diff --name-only -- gra src-tauri/frontend src-tauri/src src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json rust-port .github   (zakazane, drzewo robocze)"
  git diff --name-only -- gra src-tauri/frontend src-tauri/src src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json rust-port .github; echo "(koniec)"
  echo "\$ git diff --cached --name-only | grep -E 'node_modules|/dist/'"; git diff --cached --name-only | grep -E 'node_modules|/dist/'; echo "(koniec)"
  echo "\$ git diff --cached --stat | tail -n 1"; git diff --cached --stat | tail -n 1
  echo "\$ git diff --cached --check"; git diff --cached --check; echo "EXIT=$?"
} > "$L.tmp" 2>&1
mv "$L.tmp" "$L"
git add -f "$L"
