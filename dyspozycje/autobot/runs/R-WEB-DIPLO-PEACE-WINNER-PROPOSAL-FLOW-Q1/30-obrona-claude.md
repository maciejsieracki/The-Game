# R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1 — Obrona Operatora (runda 3, odpowiedź na zarzuty Evaluatora 06b1e8dc4)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1
GOAL: pkt 3 (konkretny powód odmowy AI z liczbami w UI) — poprawka dla ścieżki odmowy na stole; pkt 2 (kierunek płatności) — DECISION_REQUIRED, kod nietknięty; dowód live — CZĘŚCIOWO (fixture wojny 11 tur osiągnięty, panel bez potwierdzonego przycisku, NIE ZMIERZONO).
ZMIANY-COMMIT: baza kandydata `ebca63c2c`; commit kodu i testów: patrz sekcja ZMIANY poniżej (SHA w polu sha wyniku).

## Odpowiedzi na zarzuty

| Nr | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1a | Brak powodu odmowy AI w UI (ścieżka `resolveNegotiationEntryAt`) | PRZYJMUJĘ — poprawka | `main.ts` ~21650: toast odrzucenia pokazywał tylko `negotiationSummary`, `outcome.reason` (z `resolveNegotiationAsResponder` → `evaluateProposal`) był pomijany. Dodano `peaceRejectReasonSuffix` (`diplomacy-peace-proposal-timing.ts`): dla `pokoj`/`rozejm` dopisuje ` — powód: …`, czas toastu 7000 ms (zamiast 4000). Pozostałe akcje bez zmiany. |
| 1b | Ogólny fallback „Nie można przyjąć — warunki niespełnione" (`main.ts:21741`, `diplomacyAcceptanceBalance.ts:529`) | ODRZUCAM (dla odmowy AI) | Te gałęzie obsługują PRZYJĘCIE OFERTY AI przez gracza (`handleNegotiationAccept`, `preview = previewNegotiationEntry(...)`), nie odmowę AI. Fallback odpala się tylko przy `preview.reason` nullish; `evaluateProposal` zwraca `reason: string` (`diplomacy-proposals.ts:291`). Odmowa AI idzie przez `resolveNegotiationEntryAt` — poprawione w 1a. |
| 2 | Brak dowodu live (wyszarzony przycisk + licznik + powód w Chromium) | PRZYJMUJĘ — NIE ZMIERZONO w pełni | Dowód live (Chromium 141, `/usr/bin/chromium`, build vite poza repo, `gra/node_modules` z `npm ci --ignore-scripts`): hook `window.__civTest` działa przy `?civTest=1&playtest=mapa`; `foundCity` + `setWar(0,1)` + 11× `endTurn` → `turn: 12`, miasto gracza „Rzym” (skrypt: `scratchpad/live/scenario2.mjs`). Nie udało się zlokalizować w DOM przycisku pokoju/licznika po otwarciu zakładki „Dyplomacja” (`scratchpad/live/scenario4.mjs`/`scenario5.mjs`: brak tekstów „dostępne za/Pokój/Brakuje”; zrzut `scratchpad/live/diplo-war11.png`). Stan UI (wyszarzenie, licznik) — NIE ZMIERZONO. |
| 3 | Słabe asercje tabeli (tylko niepusty reason, brak liczb i rodzaju powodu; tylko `pokoj`; zmęczenie bez jawnych wartości) | PRZYJMUJĘ — poprawka | `gra/tools/diplo-winner-proposal-table-test.cjs`: dodano asercje na konkretne liczby i rodzaj powodu (blokada 10 tur dla wszystkich wierszy t5; zmęczenie t11/m0 = 28%, t10/m0 = 25%, t10/m8 = 100%; słabsza t10/m0 = „Brakuje 4050 PW … (baza 4500 PW)”; silniejsza t11/m0 = „militarnie silniejsza … ≥ 4350 PW … wymagane 4350 PN … miasta warte 0 PN”; AI-autor accepted; rozejm t5 blokada; helper toastu). Wynik: PASS=77 FAIL=0 (było 41). |
| 4 | Komunikat „Brakuje N PW” — rozjazd N vs „baza” | PRZYJMUJĘ — zgłaszam DECISION_REQUIRED, kod bez zmian | Dane z tabeli: N = 0,9 × baza we wszystkich wierszach gracz→słabszy (4050/4500, 3510/3900, 2430/2700, 810/900, 3915/4350). „baza” jest przed rabatem relacji. Reguła nietknięta (pkt 2 czeka na ABC). |

## Zmiany (commit kodu)

- `gra/src/game/diplomacy-peace-proposal-timing.ts`: nowa funkcja `peaceRejectReasonSuffix(actionId, reason)` (czysta, testowana).
- `gra/src/main.ts`: import + użycie w toście odrzucenia w `resolveNegotiationEntryAt` (2 linie logiki, czas 7000 ms przy dopisku). Blok dyplomacji, reszta pliku nietknięta.
- `gra/tools/diplo-winner-proposal-table-test.cjs`: asercje konkretnych liczb/powodów (zarzut 3) + testy helpera toastu.

## Testy (surowe wyniki, worktree po zmianach)

- `npx tsc --noEmit` → exit 0
- `node tools/diplo-winner-proposal-table-test.cjs` → `SUMA: PASS=77 FAIL=0`
- `node tools/diplo-peace-winner-proposal-flow-test.cjs` → `SUMA: PASS=49 FAIL=0`
- `node tools/diplomacy-locks-test.cjs` → `88 passed, 0 failed`
- `logic-test` → `LOGIC OK (213/213)`; `tech-tree-test` → `20 pass, 0 fail`; `research-test` → `ALL GREEN`; `unit-replace-archer-slinger-test` → `51 OK, 0 FAIL`; `combat-test` → `All sanity checks passed.`
- `diplo-peace-balance-accept-test` → `32 pass / 0 fail`; `diplo-war-peace-gate-test` → `24 pass / 0 fail`; `diplo-truce-r1-test` → `31 pass / 0 fail`
- Nie uruchamiano znanych długów bazowych (weaker-seeks, main-guard, gate G, truce-r4).
- Vite build (poza repo, `scratchpad/live/dist`) → `✓ built in 16.54s`.
- Mutacja nowego dopisku: NIE WYKONANO (zmiana w `main.ts` jest jednowierszowym wiązaniem; helper testowany bezpośrednio).

## DECISION_REQUIRED (do właściciela, ABC)

1. **Kierunek płatności za pokój (GOAL pkt 2)** — bramka `diplomacy-proposals.ts` ~1660–1676 nadal wymaga dopłaty od gracza-autora przy ujemnym bilansie PW (komentarz ECHO 2026-09-07). Opcje: A — usunąć bramkę PW dla gracza-autora, przegrany płaci miastami (rekomendacja, zgodna z GOAL pkt 2); B — zostawić bramkę i komunikat „dopłać N PW”; C — hybryda (bez dopłaty przy oddaniu miasta). Wada A: zmiana reguły ECHO; wada B: sprzeczna z GOAL pkt 2.
2. **Etykieta „Brakuje N PW”** — N jest po rabacie relacji (0,9 × baza w fixture), „baza” przed rabatem. Opcje: A — bez zmian; B — dopisać „(po rabacie relacji)” zamiast samej bazy (rekomendacja; tylko tekst, bez zmiany liczb). Wada B: wymaga decyzji o tekście.

## Otwarte / NIE ZMIERZONO

- Stan UI przycisku „Zaproponuj pokój” w wojnie ≥11 tur (wyszarzenie + licznik „dostępne za N tur”) — NIE ZMIERZONO na żywo (patrz zarzut 2). Engine-level: `resolveDiplomacyActionLock` z `turnsAtWar` pokryte w `diplo-peace-winner-proposal-flow-test` (49/0).
- Toast z powodem odmowy AI — NIE ZMIERZONO w przeglądarce (ścieżka na stole AI; wymaga zdarzenia AI).

## RUNDY / NASTĘPNY KROK

RUNDY: 3/5 (obrona). Następny krok: Evaluator r3 — weryfikacja dopisku toastu w kodzie i tabeli; DECISION_REQUIRED 1–2 do właściciela; osobny temat na live przycisku pokoju po wskazaniu selektora panelu dyplomacji.
UWAGI-DLA-ORKIESTRATORA: `gra/node_modules` zainstalowane w worktree (`npm ci --ignore-scripts`, nie w commicie). Zrzuty i skrypty live w scratchpadzie (poza repo). Nie tworzono sesji, zadań ani harmonogramów; nie integrowano, nie pushowano. Plik `30-obrona-claude.md` nadpisany wersją r3 (wersja r1 zachowana w historii git).

DEPLOY/PUSH: NIE WYKONANO
