STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) - AI obrona wlasnego terytorium vs mgla wojny
TEMAT: R-WEB-AI-HOME-WAR-SEES-OWN-LAND-Q1
GOAL: AI broniaca wlasnego terytorium moze zaatakowac wroga na nim mimo mgly; poza wlasnym terytorium mgla bez zmian (decyzja ABC=A, 2026-11-08).
BAZA: origin/web-wip/aizfog-fc e30c824ec (detached); kod gry = origin/main 247f1ef2a.
ZMIANY/COMMIT: allowlista zachowana, git diff --check czysto, SHA w sekcji COMMIT ponizej.
  - gra/src/main.ts: bramka "Atak na niewidoczny cel" (blok komend AI, ok. linii 40832-40845). Dodany wyjatek
    targetOnOwnTerritory = territoryOwnerAtLive(defender.q, defender.r) === ownerId; fog-gate pod !targetOnOwnTerritory.
    Predykat: istniejacy territoryOwnerAtLive (buildAllTerritoryNodes + territoryOwnerAt). Nowy kod predykatu nie powstal.
  - gra/src/game/ai.ts: NIE zmieniany (planner juz planuje atak; egzekucja byla jedynym blokerem).
  - gra/tools/ai-fog-test.cjs: W2 przepisany (atak na niewidocznego wroga NA WLASNYM terytorium: planowany i zgodny z predykatem bramki);
    nowy W2b (wrog POZA terytorium, niewidoczny = brak ataku). Naglowek bez "celowo czerwony". Entry eksportuje territoryOwnerAt.
  - NOWY gra/tools/ai-home-war-sees-own-land-test.cjs: K1 okablowanie (zrodlowy check main.ts), K2 granica N-1/N/N+1
    (miasto pop 5, zasieg 5), K3 sasiedni obcy wezel (hex wygrany przez obcego nie jest wyjatkiem), K4 hex bez wezla.
  - Dyspozycja runu: dyspozycje/autobot/runs/R-WEB-AI-HOME-WAR-SEES-OWN-LAND-Q1/01-operator-r1.md.
  Brak zmian w gra/data, gra-robocza/**, WERSJE.md, rust-port/**.
TESTY (zmierzone przeze mnie; gra/node_modules = symlink do node_modules innego worktree, usuniety po pracy):
  - ai-fog-test: exit 0, 9/9 (W1, W2, W2b, W3-W8). Przed zmiana: W2 FAIL (ERR_ASSERTION), exit 1.
  - ai-home-war-sees-own-land-test: exit 0, 4/4 (K1-K4).
  - ai-test: 289 passed, 0 failed.
  - logic-test: LOGIC OK (213/213).
  - tsc: lokalny gra/node_modules/.bin/tsc niedostepny (node_modules z innego worktree niekompletny, brak typescript).
    Uzyto /opt/node22/bin/tsc 6.0.2 --noEmit --ignoreDeprecations 6.0: 294 linii bledow, wszystkie srodowiskowe/istniejace
    (brak typow 'three', implicit any). Zero bledow na edytowanych liniach (main.ts:40837-40838) i w testach.
    NIE_ZMIERZONO: czysty tsc z wersja TypeScript projektu.
  - ai-zdobycie-miasta-adiacencja-test: NIE uruchamiany w tej rundzie (zmiana dotyczy tylko bramki ataku AI w main.ts; do sprawdzenia przez FC).
BLOKADY: brak. Nie zmierzono w przegladarce (zmiana logiczna, bez UI).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) -> Obrona (Haiku, jesli FAIL) -> Final Control (Sonnet). Punkt kontrolny: wyjatek nie moze otworzyc ataku poza terytorium; bramka dla gracza bez zmian.
DEPLOY/PUSH: NIE WYKONANO
