# Synteza bramki P1 — port Rust/Tauri (`rust-port/parity-v2`)

**Temat:** R-RUSTPORT-P1-GATE-SYNTHESIS-Q1, runda 1/5 (Operator, Haiku 5.5 medium; korekta po obronie)
**Data:** 2026-10-20
**Źródło statusów:** `dyspozycje/rust-port/LEDGER.md` (wpisy PASS). Pliki wynikowe sprawdzone w `dyspozycje/rust-port/p1/`. Zero statusów przyjętych z pamięci lub z samych plików bez wpisu w LEDGER.
**Charakter:** synteza CZĘŚCIOWA — tematy P1.8, P1.9, P1.13b, P1.14b, P1.16b są w toku (bez wpisu PASS) i są tu jawnie oznaczone.

## Tabela punktów P1

| Punkt | Plik(i) wynikowe | Status wg LEDGER.md | Najważniejsze znalezisko |
|---|---|---|---|
| P1.1 | `p1/P1-1-FILE-CATALOG.md` | PASS (R-…-P1-1-FILE-CATALOG-Q1) | 751 plików / 429 .ts / 255 694 linii w 6 katalogach `gra/src`; lokalny checkout różni się od pinu `edb8fb56` w 138 plikach `gra/`, więc czytać z pinu. |
| P1.1b | `p1/P1-1B-REMAINING-DIRS.md` | PASS (R-…-P1-1B-REMAINING-DIRS-Q1) | Pełna suma `gra/src`: 892 pliki, 517 377 linii, 457 .ts. |
| P1.2 | `p1/P1-2-TOOLCHAIN.md` | PASS (R-…-P1-2-TOOLCHAIN-Q1) | Wersja Node niezadeklarowana (UNKNOWN); zakaz build/dev wynika z `R-PROC-AUTOBOT.md` §9, nie z samego CLAUDE.md. |
| P1.3 | `p1/P1-3-INTRO-START.md` | PASS (R-…-P1-3-INTRO-START-Q1) | Pilot zwalidowany: świeży checkout, vite bez `predev`, Playwright, zrzut 1600×900, obowiązkowe ubicie własnego procesu. |
| P1.4 | `p1/P1-4-EPOCH-SELECTION.md` | PASS (R-…-P1-4-EPOCH-SELECTION-Q1) | 3 epoki (Kamienia 8, Brązu 14, Żelaza 15 cywilizacji kumulacyjnie), blokada przez `epochHasCivs()`. |
| P1.5 | `p1/P1-5-CIV-SELECTION.md` | PASS (R-…-P1-5-CIV-SELECTION-Q1) | Liczby cywilizacji potwierdzone wizualnie, DOM-em i w `civs.json`; „bez przewijania” dotyczy tylko siatki kart. |
| P1.6 | `p1/P1-6-CIVCOUNT-MAPSIZE.md` (zacommitowany, czysty względem HEAD) | PASS (R-…-P1-6-CIVCOUNT-MAPSIZE-Q1, LEDGER.md:44) | 6 rozmiarów mapy; liczba cywilizacji zwykle 3 opcje/komórkę (wyjątek Super Huge/Kamień: 2); maksima w Kamieniu 5/6/7/8/8/8. Evaluator obalił błędną hipotezę Operatora o „duplikacie 8”. |
| P1.7 | `p1/P1-7-SETTINGS-VALIDATION.md` | PASS (R-…-P1-7-SETTINGS-VALIDATION-Q1) | Stan błędu walidacji jest nieosiągalny w normalnym UI (cywilizacja auto-wybierana) — nie trzeba go odtwarzać w P2/P6. |
| P1.8 | `p1/P1-8-WORLD-GENERATION.md` (istnieje, untracked; nie zaksięgowany) | **BRAK PASS — w toku** (brak wpisu w LEDGER.md; run-dir `runs/…-P1-8-…/01-operator.md` ma STATUS PASS-WITH-NOTES, temat nie zamknięty) | Wynik nie został jeszcze zaksięgowany; znaleziska nie przyjmuję do syntezy przed wpisem w LEDGER. |
| P1.9 | `p1/P1-9-MAP-HUD-PANELS.md` (istnieje, untracked; nie zaksięgowany) + zrzuty `p1/screenshots/P1-9-map-hud-*.png` (zmodyfikowane / untracked) | **W TOKU** — brak wpisu PASS w LEDGER.md | Brak zaksięgowanego znaleziska; zrzuty niezacommitowane. |
| P1.10 | `p1/P1-10-VIEWPORTS.md` | PASS (R-…-P1-10-VIEWPORTS-Q1) | 13 reguł `@media` w 11 plikach; Evaluator znalazł 6 realnych błędów zamiast pustej listy. |
| P1.11 | `p1/P1-11-ASSET-CATALOG.md` | PASS (R-…-P1-11-ASSET-CATALOG-Q1) | 441 plików / 49,5 MB; SFX są syntetyczne w Web Audio (nie pliki), a 88 plików geometrii jest proceduralnych (three.js) — trzeba to odtworzyć, nie tylko skopiować. |
| P1.12 | `p1/P1-12-DATA-CATALOG.md` | PASS (R-…-P1-12-DATA-CATALOG-Q1) | Wszystkie 30 plików `gra/data/*`; `diplomacy.json` ma 11 sekcji (pominięta wcześniej sekcja `params`, 132 klucze). |
| P1.13 | `p1/P1-13-COMMANDS-EVENTS.md` (zacommitowany, czysty względem HEAD) | PASS (R-…-P1-13-COMMANDS-EVENTS-Q1) | 157 typów komend/eventów plus literały UI (EntityCardAction, UnitPanelAction i in.) domknięte. |
| P1.13b | brak pliku wynikowego w `p1/` (jest `runs/…-P1-13B-…/` z trwającym łańcuchem rund) | **W TOKU** — brak PASS w LEDGER | Domknięcie luki ProposalActionId; brak zaksięgowanego znaleziska. |
| P1.14 | `p1/P1-14-GAMEPLAY-CATALOG.md` | PASS (R-…-P1-14-GAMEPLAY-CATALOG-Q1) | 751 plików przypisanych do 12 podsystemów + INNE/INFRA; hot-seat jest realnie konsumowany po stronie web (`main.ts:1253`, `human-owners.ts`) — korekta wcześniejszej oceny. |
| P1.14b | `p1/P1-14B-MISSING-SYSTEMS-RECHECK.md` (śledzony, zmodyfikowany `M`) | **W TOKU** — brak PASS w LEDGER | Re-weryfikacja „zero trafień” z audytu archiwum; brak zaksięgowanego znaleziska. |
| P1.15 | `p1/P1-15-SCREENSHOT-INDEX.md` | PASS (częściowy) (R-…-P1-15-SCREENSHOT-INDEX-Q1) | 19 PNG, 16 unikalnych (3 pary bajtowo identyczne = deterministyczny render); indeks wymaga aktualizacji po zaksięgowaniu P1.8/P1.9 (P1.6 już zaksięgowany, LEDGER.md:44). |
| P1.16 | `p1/P1-16-EDGE-CASES.md` | PASS (R-…-P1-16-EDGE-CASES-Q1) | 16 TODO w 9 plikach; Evaluator wyłapał 9/16 błędnych numerów linii przy poprawnych cytatach. |
| P1.16b | brak `P1-16B-*.md` w `p1/`; plik roboczy to `p1/P1-16-EDGE-CASES.md` (sekcja 8, zmodyfikowany `M`); run-dir: `01-operator.md`, `02-operator-obrona.md` (proponuje werdykt FAIL, kryterium binarne NIESPEŁNIONE), `03-operator.md` (PASS-WITH-NOTES, untracked, runda 3/5) | **W TOKU** — obrona zakończona, brak Final Control i wpisu w LEDGER | Brak zaksięgowanego znaleziska. Ryzyko: nierozstrzygnięte pozycje AUDYT-KODU/PARYTET (patrz `03-operator.md`). |
| P1.17 | `p1/P1-17-RUST-CLASSIFICATION.md` | PASS (R-…-P1-17-RUST-CLASSIFICATION-Q1) | REUSE=0, ADAPT=8, REPLACE=6, UNKNOWN=169 z 183 plików `gra/src/game` (~8% logiki web ma rozpoznany odpowiednik). |
| P1.17b | `p1/P1-17B-UI-CLASSIFICATION.md` | PASS (R-…-P1-17B-UI-CLASSIFICATION-Q1) | REUSE=0, ADAPT=6, REPLACE=4, UNKNOWN=107 z 117 plików `gra/src/ui`; `src-tauri/frontend/` to 2 pliki (vertical slice, nie port UI). |
| P1.18 | `p1/P1-18-HOTSEAT-MATRIX.md` | PASS (R-…-P1-18-HOTSEAT-MATRIX-Q1) | Hot-seat BRAK w `playable`/`bridge`/`save_load` na `rust-port/parity-v2`@`9e33fc77`; 24 wiersze macierzy. |

Liczba wierszy: 23 (18 punktów plus warianty b/1b). Wiersze PASS: 18 (P1.15 tylko częściowo). Wiersze bez PASS: 5.

## Gotowość bramki P1

**Bramka P1 NIE JEST OTWARTA.**

Stan na tę rundę: 23 wiersze, z tego **18 ze statusem PASS** (w tym P1.15 tylko częściowo) i **5 bez PASS**:

1. **P1.8** — W TOKU; plik `p1/P1-8-WORLD-GENERATION.md` istnieje, ale brak wpisu PASS w LEDGER.
2. **P1.9** — W TOKU; plik `p1/P1-9-MAP-HUD-PANELS.md` istnieje (untracked), brak wpisu PASS w LEDGER; zrzuty niezacommitowane.
3. **P1.13b** — W TOKU; brak wpisu PASS w LEDGER i brak pliku wynikowego w `p1/`.
4. **P1.14b** — W TOKU; brak wpisu PASS w LEDGER; plik śledzony, zmodyfikowany.
5. **P1.16b** — W TOKU; obrona zakończona, brak Final Control i wpisu w LEDGER.

Dodatkowo: **P1.15** jest PASS (częściowy) i wymaga aktualizacji po zaksięgowaniu P1.8/P1.9.

Uwaga o stanie roboczym (`git status`, stan na tę rundę): zmodyfikowane śledzone — `p1/P1-14B-MISSING-SYSTEMS-RECHECK.md`, `p1/P1-16-EDGE-CASES.md`, zrzuty `p1/screenshots/P1-9-map-hud-01..05`; untracked — `p1/P1-8-WORLD-GENERATION.md`, `p1/P1-9-MAP-HUD-PANELS.md`, `p1/screenshots/P1-9-map-hud-06-menu-w-grze.png` oraz run-dirs w toku. Pliki `P1-6-*.md` i `P1-13-*.md` są czyste względem HEAD (zacommitowane). Statusy w tej syntezie pochodzą z LEDGER.md, nie z working tree.

## Najważniejsze znaleziska fazy P1 dla właściciela

1. **REUSE = 0** w klasyfikacji logiki web (P1.17). Z 183 plików `gra/src/game`: ADAPT 8, REPLACE 6, UNKNOWN 169 (~92% nieznane).
2. **UI bez reużycia** (P1.17b): REUSE 0, UNKNOWN 107 z 117 plików `gra/src/ui`; `src-tauri/frontend` to 2 pliki.
3. **Rozmiar portu**: `gra/src` = 892 pliki, 517 377 linii (457 .ts) (P1.1 + P1.1b), wobec ok. 28 plików domenowych w `real24-staging` i 18 w `main` (wg AUDYT-ARCHIWUM).
4. **Hot-seat BRAK w Rust** (P1.18): tylko jeden człowiek wspierany w `playable`/`bridge`/`save_load`; po stronie web hot-seat jest realnie używany (P1.14, korekta).
5. **Stan błędu walidacji nieosiągalny w UI** (P1.7): nie odtwarzać w P2/P6 jako wymagania.
6. **Poprawka terenu Desert/Tundra** zintegrowana w `rust-port/parity-v2` (`9e33fc77`, osobny temat PASS).
7. **SFX syntetyczne w Web Audio** i 88 plików geometrii proceduralnej (P1.11): port wymaga odtworzenia, nie kopiowania plików.
8. **Pin ma znaczenie**: lokalny checkout różni się od `edb8fb56` w 138 plikach `gra/` (P1.1) — wszystkie czytania muszą iść z pinu.
9. **Dyscyplina procesu**: Operator pracował we współdzielonym checkoucie (P1.13); Obrona ubiła cudzy dev-server (P1.4) — wymóg ubijania wyłącznie własnego zapisanego PID.
10. **Dane kompletne, ale z lukami w opisie**: 30/30 plików `gra/data` (P1.12); sekcja `params` w `diplomacy.json` była wcześniej pominięta; Evaluatorzy wyłapali błędne numery linii (P1.16), nadmiarowe twierdzenia (P1.3) oraz braki dowodowe (P1.5).

## Obserwacja procesowa (nie blokuje tej rundy)

Bieżący checkout to `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, a nie `rust-port/parity-v2`. Synteza nie zmienia żadnych plików poza tym jednym.
