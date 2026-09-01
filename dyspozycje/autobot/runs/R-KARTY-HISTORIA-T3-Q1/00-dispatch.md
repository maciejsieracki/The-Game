TEMAT:  R-KARTY-HISTORIA-T3-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 10/17 projektu `R-KARTY-HISTORIA-Q1`. TRZECI i OSTATNI batch treści
dla TECHNOLOGII (T1, T2 już zintegrowane — po tym temacie kategoria
„technologie" będzie kompletna: 32/32).

## GOAL
Dopisz pole `Historia` (Capitalized, konwencja `tech.json`) do KAŻDEJ z
poniższych 10 technologii w `gra/data/tech.json` (tablica `technologie`):

1. Astronomia
2. Hutnictwo żelaza
3. Inżynieria
4. Oblężnictwo
5. Filozofia
6. Prawo
7. Drogi brukowane
8. Medycyna
9. Obróbka żelaza
10. Sztuka wojenna

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-T1-Q1`/`T2-Q1`:
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia.
- ZAKAZANE: mechanika TEJ gry, identyfikatory repo, kopiowanie z Wikipedii.
- „Hutnictwo żelaza" i „Obróbka żelaza" to DWIE RÓŻNE technologie w tym
  drzewie — sprawdź w `tech.json` czym się różnią mechanicznie i napisz
  ODRĘBNE teksty historyczne (np. jedna o wytopie/pozyskaniu żelaza z rudy,
  druga o kowalstwie/obróbce gotowego metalu — dopasuj do faktycznego
  rozróżnienia w grze, nie zgaduj).
- Sprawdź już zintegrowane `T1-Q1`/`T2-Q1` w `origin/main` — spójność tonu.

Format wpisu w JSON: pojedynczy string, bez HTML, UTF-8 z polskimi znakami
wprost. NIE zmieniaj żadnego innego pola żadnej technologii. Waliduj
`jq . gra/data/tech.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/tech.json` bez błędu składni.
2. Wszystkie 10 wskazanych technologii ma niepuste pole `Historia`, 4-6
   zdań, zero identyfikatorów repo, zero mechaniki gry, zero duplikatów (w
   tym między Hutnictwo żelaza a Obróbka żelaza).
3. Żadna INNA technologia i żadne INNE pole tych 10 nie zostały zmienione.
4. Realny, żywy dowód: karta DOWOLNEJ z tych 10 technologii pokazuje sekcję
   „Rys historyczny" z wpisaną treścią.
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych + tech-tree-test/
   research-test bez regresu + `entity-card-historia-section-test.cjs` W
   PEŁNI zielony (31/31).

## ALLOWLISTA — nic poza tym
`gra/data/tech.json` WYŁĄCZNIE. Zakazane bezwzględnie: wszelkie inne pliki
w `gra/data/**`, `gra/src/**`, `gra/tools/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-T3-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
