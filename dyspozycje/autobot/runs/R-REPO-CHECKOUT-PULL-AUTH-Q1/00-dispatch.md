# 00-dispatch — R-REPO-CHECKOUT-PULL-AUTH-Q1

STATUS: DISPATCHED (RECON)
TEMAT: R-REPO-CHECKOUT-PULL-AUTH-Q1
GOAL: Potwierdzić właściwy checkout repozytorium i bezpieczną możliwość synchronizacji z origin/main.
KRYTERIA KOŃCA: README.md obecny; HEAD/upstream/Fala 300 potwierdzone; stary katalog odrzucony; status poświadczeń i warunki ewentualnego pull jawne.
ALLOWLISTA: tylko artefakty tego runu; odczyt konfiguracji Git i plików identyfikacyjnych repozytorium.
IZOLACJA: Civ-clean-main-2026-08-20; nie pracować w starym katalogu Civ.
PLAN TESTÓW: git status/branch/remote, identyfikacja HEAD, obecność README.md i Fala 300; bez pull na nieczystym worktree.
ABC: brak — to audyt środowiska, nie zmiana gry.
DEPLOY/PUSH: NIE WYKONANO
