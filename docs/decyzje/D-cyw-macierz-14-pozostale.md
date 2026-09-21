# D-cyw-macierz-14-pozostale — macierz pozostałych 14 cywilizacji

Status: PASS-WITH-NOTES (pakiet dowodowy Operatora; bez integracji i deployu)
Temat: t_89eb5708
Data generacji: 2026-09-20T21:38:05+00:00

## Zakres

- Źródło: `gra/data/civ-matrix.json`, `_meta.source = "Cyw-macierz (11 arkuszy Cyw-01..11)"`.
- 14 ID poza `grecy`: `rzymianie, chinczycy, inkowie, zulusi, egipt, sumer, celtowie, germanie, harappa, hetyci, slowianie, babilonia, asyria, fenicjanie`.
- 113 definicji × 14 = **1582 komórki**.
- Workbook jest addytywny. Nie nadpisuje pilota Grecji ani istniejącego workbooka; Grecja jest wyłącznie opisana w `Alokacje_Grecja`.

## Pochodzenie wartości

Każda komórka jest pobrana bezpośrednio z wiersza celu w `gra/data/civ-matrix.json`. `copied_from_greece=false` jest zapisane dla wszystkich 1582 komórek. Równość liczb nie jest traktowana jako dowód kopiowania.

`CURRENT_RUNTIME_DATA` oznacza obserwowaną wartość bieżącego JSON-a. Nie wpisano propozycji do macierzy i nie nadano statusu `ACCEPTED_SPEC` bez jednoznacznego dowodu. Osiem starszych cywilizacji ma tekst encyklopedyczny; sześć rezerwowych ma tylko dowód draft/rezerwa i pozostaje `RESERVE_DRAFT_UNRESOLVED`.

## Konsumenci

- `REAL_GAMEPLAY`: 11 parametrów — 8 pól AI, `lud_wzrost_proc`, `dip_handlowosc_archetyp`, `dip_nastawienie_bazowe`.
- `UI_ONLY`: 5 pól dyplomatycznych używanych przez tagi w `diplomacy-display.ts`.
- Reszta jest `DEAD_UNWIRED` (nie-defaultowe dane bez gameplay call-site) albo `UNWIRED` (brak nie-defaultowych danych i call-site). `paramDefs.modul` nie jest dowodem użycia.
- Bonusy i mnożniki z `civs.json` są w osobnym arkuszu; nie są udawane jako aktywne parametry macierzy.

Komórki wg statusu: DEAD_UNWIRED=686, REAL_GAMEPLAY=154, UI_ONLY=70, UNWIRED=672. Komórki różne od defaultu: 459.

## Polityka poziomów

- AI `skala_1_10`: Normal = macierz; Easy = `max(1, Normal-1)`; Hard = `min(10, Normal+1)`.
- `lud_wzrost_proc`: Easy ×0.5 / Normal ×1 / Hard ×1.5, zaokrąglenie wkładu do punktów procentowych.
- `ai_profil_obronna`: flaga ownera, identyczna na poziomach.
- `dip_handlowosc_archetyp`: realny konsument, ale obecnie neutralny, bo `mul_abs` nie jest skalowane przez helper.
- `dip_nastawienie_bazowe`: realny konsument, lecz bieżący caller pomija difficulty i korzysta z Normal. Oba przypadki pozostają jawnymi decyzjami.

## Otwarte decyzje

1. `HIST-14-RESERVE`: zaakceptować albo pozostawić jako draft sześć pozycji rezerwowych.
2. `WIRE-113`: rozbić niepodłączone pola na osobne tematy implementacyjne.
3. `DIFF-TRADE` i `DIFF-TRUST`: zatwierdzić neutralność albo kierunek Easy/Normal/Hard przed kodem.
4. `ALLOC-14`: nie kopiować alokacji Grecji bez osobnej decyzji.
5. `SOURCE-XLSX`: `_meta.source` wskazuje 11 arkuszy, lecz current base nie zawiera kanonicznego XLSX; wymagane jest osobne źródło archiwalne.

## Weryfikacja

- Artifact readback: PASS — TSV 1582 wiersze danych, 14 ID, 113 parametrów, wszystkie `copied_from_greece=false`; workbook ma 10 oczekiwanych arkuszy, a `Pozostale_14` ma 1582 wiersze danych.
- `git diff --check`: PASS.
- `npm run typecheck --prefix gra`: PASS po środowiskowym `npm ci --ignore-scripts`; nie zmieniono zależności śledzonych przez Git.
- `npm ci` zgłosiło 5 istniejących advisory (1 moderate, 4 high); nie uruchamiano `npm audit fix`.
- Brak zmian w `gra/src`.

## Artefakty

- `panele-sterowania/cyw-macierz/Civ-macierz-14-pozostale.xlsx`
- `panele-sterowania/cyw-macierz/civ-matrix-14-coverage.tsv`
- `panele-sterowania/cyw-macierz/civ-matrix-14-audit.json`
- `dyspozycje/autobot/runs/t_89eb5708/00-dispatch.md`
- `dyspozycje/autobot/runs/t_89eb5708/01-operator.md`
- `dyspozycje/autobot/runs/t_89eb5708/build_artifacts.py` — reproducible local generator used for this evidence package

Brak zmian w `gra/src`, commitów, pushu, merge i deployu.
