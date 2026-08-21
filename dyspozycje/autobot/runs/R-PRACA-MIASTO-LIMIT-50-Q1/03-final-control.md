# 03-final-control — R-PRACA-MIASTO-LIMIT-50-Q1

STATUS: BLOCK
TEMAT: R-PRACA-MIASTO-LIMIT-50-Q1
GOAL: Lokalny podział Pracy miasta respektuje kontrakt: budynki 50–100%, ulepszenia maksymalnie 50%, suma 100%; wspólny resolver dla gracza i AI, override per miasto oraz migracja starego zapisu.
RUNDY: korekta po poprzednim BLOCK; nie dispatchuję nowej rundy samodzielnie

## Zakres kontroli

- Izolacja odczytu: `Civ-clean-main-2026-08-20`, branch `work/clean-main-2026-08-20`, HEAD `47cdca15757efb89d5e634e9e9ddff370925708d8`.
- Przeczytano `README.md`, `docs/procesy/INDEX-PROCESU.md`, `docs/decyzje/R-PROC-AUTOBOT.md`, `playbook.md`, bieżący handoff, `KANAL-PRACA.md`, oba lokalne `.claude/skills/*/SKILL.md` oraz `00-dispatch.md`, `01-operator.md`, `02-evaluator.md` tego runu.
- Nie wykonano integracji, commita, deployu ani pushu.

## Kontrola implementacji

- **PASS** — `cities.ts`: wspólny clamp `procentBudynki` do `[50, 100]` oraz normalizacja istniejących danych przez `ensureCityPodzialDefaults`.
- **PASS** — `empire-city-defaults.ts`: resolver w kolejności override → owner default → city value → fallback; clamp źródeł i migracja starego zapisu z zachowaniem flagi override.
- **PASS** — `main.ts`/load: wywołanie `migratePodzialPracyOnLoad` i podpięcie resolvera do ścieżki zapisu/odczytu.
- **PASS** — `cityPanel.ts`: lokalny suwak i event clampują do 50–100%; ulepszenia są dopełnieniem do 100%.
- **PASS** — `ai.ts`: końcowy clamp AI nie pozwala zejść poniżej 50% budynków.
- **PASS** — `turn-economy.ts`: preview i tick używają rozwiązanego `econCity.podziałPracy`; remainder zachowuje całą pulę.
- **PASS-WITH-NOTES** — panel parity potwierdza panel/runtime i prosty round-trip save/load, ale nie zastępuje wymaganej bramki `13/13`.

## Testy i typecheck

Uruchomiono z `gra/`:

- `node tools/praca-miasto-limit-50-test.cjs` — **4/4 PASS**.
- `node tools/empire-city-defaults-test.cjs` — **49/49 PASS**.
- `node tools/ai-slider-test.cjs` — **38/38 PASS**.
- `node tools/production-overflow-test.cjs` — **51/51 PASS**; sekcja 13 wiring checks przechodzi, ale cały test nie raportuje `13/13`.
- `node tools/praca-split-ui-test.cjs` — **7/7 PASS**; plik jest zmieniony przez sąsiedni temat `R-PRACA-JEDEN-SUWAK-UI-Q1`.
- `node tools/praca-panel-parity-test.cjs` — **16/16 PASS**; obejmuje panel, runtime, 0/100, 50/50, 100/0 i prosty round-trip save/load.
- `node tools/ai-praca-split-parity-test.cjs` — **19/19 PASS**.
- `node tools/empire-praca-panel-coverage-test.cjs` — **15/15 PASS**.
- `node tools/praca-global-default-live-test.cjs` — **3 PASS / 4 FAIL**: test nadal oczekuje globalnego `0%` budynków, sprzecznego z bieżącym minimum 50%.
- W checkoutcie nie znaleziono tematycznego artefaktu ani komendy raportującej wymagane **13/13 PASS**.
- `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` — **PASS**, exit 0.
- `git diff --check` — **PASS**.
- `node dyspozycje/autobot/tools/process-docs-audit.cjs` — **FAIL**: dokumentacja zmienia również `gra/` poza paczką tego runu.

Pierwsza próba testów zakończyła się `EPERM`, ponieważ testy tworzą tymczasowe pliki `.ts` w `gra/tools`; ponowienie z uprawnieniem do wskazanego worktree zakończyło się wynikami powyżej.

## Allowlista / izolacja

**BLOCK — rzeczywisty diff względem `HEAD` nie jest allowlist-only.** Poza zakresem tego runu są m.in. `gra/src/main.ts`, `gra/src/game/economy-upkeep.ts`, pliki procesu/skills, `gra/src/ui/empireDetailPanel.ts`, `gra/tools/praca-split-ui-test.cjs` oraz nieśledzone artefakty innych runów/testów. `cityPanel.ts` i `empire-city-defaults-test.cjs` zawierają współdzielone hunki; bez rozdzielenia provenance nie można przypisać całego diffu temu runowi.

Brak zmian produkcyjnych w sensie deploy/push potwierdzony: **NIE WYKONANO**. Nie wykonano również integracji ani commita.

## Werdykt

Kontrakt max 50% ulepszeń / minimum 50% budynków, player/AI parity, override per miasto, runtime panel oraz migracja starego save mają pozytywne dowody cząstkowe. Final Control pozostaje jednak **BLOCK**, ponieważ brak dowodu wymaganego `13/13`, jedna bramka live ma `4 FAIL`, a rzeczywisty diff względem `HEAD` nie jest allowlist-only. Nie można kierować do integracji.

BLOKADY:
1. Brak wyniku wymaganego testu `13/13`; dostępne wyniki to m.in. `7/7`, `16/16`, `19/19` i `51/51`.
2. `praca-global-default-live-test.cjs`: 3/7; oczekiwania testu są niespójne z kontraktem minimum 50% budynków.
3. Worktree zawiera zmiany i artefakty spoza allowlisty; provenance `cityPanel.ts`/testów jest współdzielone.

NASTĘPNY KROK: Orkiestrator ma wrócić do **tego samego Operatora i tego samego ID**, bez duplikatu, po guardzie rund: rozdzielić provenance/allowlistę, dostarczyć właściwy test `13/13`, uzgodnić albo poprawić niespójny test live, następnie ponowić Evaluator → Final Control. Nie wystawiać `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO
