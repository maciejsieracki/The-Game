TEMAT:  R-KARTY-HISTORIA-U3-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 12/17 projektu `R-KARTY-HISTORIA-Q1`. TRZECI z sześciu batchy treści
dla JEDNOSTEK (U1+U2 już zintegrowane, 26/75).

## GOAL
Dopisz pole `Historia` (Capitalized, konwencja `units.json`) do KAŻDEJ z
poniższych 13 jednostek w `gra/data/units.json`:

1. Rydwan egipski
2. Wojownik z khopesh
3. Medżaj (Gwardia Faraona)
4. Łucznik nubijski
5. Łucznik sumeryjski
6. Rydwan sumeryjski
7. Włócznik sumeryjski
8. Gwardia Królewska Sumeru
9. Wojownik mykeński
10. Rydwan mykeński
11. Wojownik Sherden
12. Halabardnik Shang
13. Rydwan Shang

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-U1-Q1`/`U2-Q1`:
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia.
- ZAKAZANE: mechanika TEJ gry, identyfikatory repo, kopiowanie z Wikipedii.
- Każda jednostka ma jasny kontekst cywilizacyjny w nazwie (Egipt, Sumer,
  Mykeny, dynastia Shang) — napisz o KONKRETNEJ, właściwej cywilizacji/
  okresie, nie ogólnikowo. „Lud Morza"/Sherden — opisz jako część zjawiska
  najazdów Ludów Morza pod koniec epoki brązu, nie jako jednolite państwo.
  „Medżaj" — pierwotnie egipska formacja strażnicza/policyjna wywodząca się
  z Nubii, potem elitarna gwardia faraona — zaznacz obie warstwy znaczenia.
- Sprawdź już zintegrowane `U1-Q1`/`U2-Q1` w `origin/main` — spójność tonu.

Format wpisu w JSON: pojedynczy string, bez HTML, UTF-8 z polskimi znakami
wprost. NIE zmieniaj żadnego innego pola żadnej jednostki (Atak/Obrona/
Koszt/Uwagi nietknięte). Waliduj `jq . gra/data/units.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/units.json` bez błędu składni.
2. Wszystkie 13 wskazanych jednostek ma niepuste pole `Historia`, 4-6 zdań,
   zero identyfikatorów repo, zero mechaniki gry, zero duplikatów.
3. Żadna INNA jednostka i żadne INNE pole tych 13 nie zostały zmienione.
4. Realny, żywy dowód: karta DOWOLNEJ z tych 13 jednostek pokazuje sekcję
   „Rys historyczny" z wpisaną treścią.
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych + unit-replace-test/
   combat-test bez regresu + `entity-card-historia-section-test.cjs` W
   PEŁNI zielony (31/31).

## ALLOWLISTA — nic poza tym
`gra/data/units.json` WYŁĄCZNIE. Zakazane bezwzględnie: wszelkie inne pliki
w `gra/data/**`, `gra/src/**`, `gra/tools/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-U3-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz kopiowania tekstu między jednostkami tej samej
cywilizacji (np. Rydwan sumeryjski vs Włócznik sumeryjski muszą mieć różne
teksty, nawet jeśli pochodzą z tego samego źródła — sztandaru z Ur).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
