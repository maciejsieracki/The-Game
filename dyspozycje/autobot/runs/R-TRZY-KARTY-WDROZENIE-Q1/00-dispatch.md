# DISPATCH — `R-TRZY-KARTY-WDROZENIE-Q1`

**GOAL:** wdrożyć trzy zatwierdzone makiety Designu (paczka `TRZY-KARTY-2026-08-19`)
do realnego kodu gry, do stanu `READY_FOR_DEPLOY`. Nie deployować, nie pushować —
osobna bramka po integracji.

**Źródła:**
- Makiety: `C:\Users\macie\Downloads\trzy-karty-2026-08-19\_dist\TRZY-KARTY-2026-08-19\`
  (3× `*.html` standalone, `DYSPOZYCJA-WDROZENIE.md`, `MANIFEST.txt`).
- Kod docelowy: `gra/src/ui/techDiscoveryNotice.ts`, `gra/src/ui/unitInfoCard.ts`,
  `gra/src/ui/sidePanelHud.ts`, `gra/src/ui/bottomBarHud.ts`,
  `gra/src/ui/icons/brand/tokens.css` (live token file, NIE kopie w `docs/ux/`).

**ECHO właściciela (2026-08-20), wiążące, nie do ponownego rozstrzygania:**
1. Blokada tury: **NIE** — karty decyzyjne zostają sygnałem (WYKONAJ świeci, licznik
   rośnie), `canEndTurn()`/`bottomBarHud.ts` NIE dostaje `getBlockingCount() > 0`.
   Zgodne z decyzją z 6 lipca. Wizualne 3 warstwy blokady z Karty 3 klatka 5
   (rant przerywany + ikona na przycisku, pasek nad HUD, tooltip) WCHODZĄ —
   to czysto wizualna sygnalizacja, przycisk pozostaje klikalny i kończy turę.
2. Przycisk „Zignoruj — bunt potrwa dalej" przy karcie buntu: **TAK, dodać.**
3. Rant slotu 3D w Karcie 2: **złoto kanonu**, nie błękit `rgba(130,200,224,.28)`
   z makiety — dostosuj CSS do tokenów 1E.

**Kolejność (uniknięcie kolizji na wspólnym `tokens.css`):**
- Runda 1 — Operator A: `tokens.css` (5 tokenów z `DYSPOZYCJA-WDROZENIE.md` §1,
  rant slotu 3D w złocie zamiast błękitu) + Karta 1 (`techDiscoveryNotice.ts`).
- Runda 2 (po scaleniu rundy 1) — Operator B: Karta 2 (`unitInfoCard.ts`,
  3 zmiany kodu z §3: usuwanie pustej sekcji, kontry jako tablica/plakietki,
  stała wysokość slotu 3D) i Operator C: Karta 3 (`sidePanelHud.ts` +
  `bottomBarHud.ts`, bez wpinania blokady do `canEndTurn`) — mogą iść równolegle,
  nie dotykają tych samych plików.

**Każda runda:** Operator → Evaluator (adwokat diabła, sprawdza SCOPE, diff,
zgodność z makietą i z ECHO wyżej, testy) → ja jako Final Control/integracja.
`FAIL` wraca do tego samego ID. Bramki: `npx tsc --noEmit` (0), testy istniejące
dla dotykanych plików jeśli są, `git diff --check`.

**Allowlist całości:** wyłącznie pięć plików wymienionych wyżej + ewentualny nowy
plik testu w `gra/tools/` per zmieniony plik. Nic poza tym, żadnych zmian w
`gra/data`, silniku gry, ani w plikach niezwiązanych.

**DEPLOY/PUSH:** nie wykonywać. Po `READY_FOR_DEPLOY` czekać na wyraźne polecenie
właściciela.
