TEMAT:  R-KARTY-HISTORIA-T2-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 7/17 projektu `R-KARTY-HISTORIA-Q1`. DRUGI z trzech batchy treści dla
TECHNOLOGII (T1 już zintegrowany do `main`).

## GOAL
Dopisz pole `Historia` (Capitalized, konwencja `tech.json`) do KAŻDEJ z
poniższych 11 technologii w `gra/data/tech.json` (tablica `technologie`):

1. Brązownictwo
2. Żegluga
3. Pismo
4. Religia
5. Jeździectwo
6. Wojskowość
7. Matematyka
8. Handel
9. Kodeks
10. Budownictwo
11. Waluta

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-T1-Q1` (przeczytaj ten dispatch
dla pełnego przykładu kalibracyjnego i zasad):
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia.
- ZAKAZANE: mechanika TEJ gry, identyfikatory repo, kopiowanie z Wikipedii.
- „Religia" i „Kodeks" to szerokie, uniwersalne pojęcia — opisz ogólne
  zjawisko cywilizacyjne (pierwsze systemy wierzeń zorganizowanych / pierwsze
  spisane kodeksy prawne, np. Kodeks Hammurabiego) zamiast fałszywej,
  jednej wąskiej definicji.
- Sprawdź już zintegrowany `R-KARTY-HISTORIA-T1-Q1` w `origin/main` dla
  przykładów faktycznie zaakceptowanej treści — spójność tonu.

Format wpisu w JSON: pojedynczy string, bez HTML, UTF-8 z polskimi znakami
wprost. NIE zmieniaj żadnego innego pola żadnej technologii. Waliduj
`jq . gra/data/tech.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/tech.json` bez błędu składni.
2. Wszystkie 11 wskazanych technologii ma niepuste pole `Historia`, 4-6
   zdań, zero identyfikatorów repo, zero mechaniki gry, zero duplikatów.
3. Żadna INNA technologia i żadne INNE pole tych 11 nie zostały zmienione.
4. Realny, żywy dowód: karta DOWOLNEJ z tych 11 technologii pokazuje sekcję
   „Rys historyczny" z wpisaną treścią.
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych + tech-tree-test/
   research-test bez regresu (struktura drzewa badań niezmieniona).
   `entity-card-historia-section-test.cjs`: jeśli `P-KARTY-HISTORIA-TEST-FIXTURE-REALNE-DANE-Q1`
   jest już zintegrowany, test MUSI być w pełni zielony; jeśli nie, te SAME
   2 znane FAIL (Łowiectwo) są dopuszczalne.

## ALLOWLISTA — nic poza tym
`gra/data/tech.json` WYŁĄCZNIE. Zakazane bezwzględnie: wszelkie inne pliki
w `gra/data/**`, `gra/src/**`, `gra/tools/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-T2-Q1`, baza JAWNIE
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
