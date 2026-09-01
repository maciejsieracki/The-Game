TEMAT:  R-KARTY-HISTORIA-B3-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 9/17 projektu `R-KARTY-HISTORIA-Q1`. TRZECI i OSTATNI batch treści dla
BUDYNKÓW (B1, B2 już zintegrowane — po tym temacie kategoria „budynki"
będzie kompletna: 41/41).

## GOAL
Dopisz pole `historia` (lowercase, konwencja `buildings.json`) do KAŻDEGO z
poniższych 13 budynków w `gra/data/buildings.json`:

1. wielka_kuznia
2. fort
3. baszta
4. warsztat_oblezniczy
5. akademia
6. teatr
7. sad
8. dom_starszyzny
9. dwor_zarzadcy
10. pretorium
11. trybunal
12. laznia_publiczna
13. akademia_wojskowa

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-B1-Q1`/`B2-Q1` (przeczytaj
`B1-Q1` dla pełnego przykładu kalibracyjnego „Tarasy uprawne" i zasad):
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia (nie mechanika gry).
- ZAKAZANE: suche fakty bez narracji, mechanika TEJ gry, identyfikatory
  repo, kopiowanie 1:1 z Wikipedii.
- Sprawdź już zintegrowane `R-KARTY-HISTORIA-B1-Q1`/`B2-Q1` w `origin/main`
  dla przykładów faktycznie zaakceptowanej treści — spójność tonu.
- „Fort"/„Baszta"/„Warsztat oblężniczy" — militarne, konkretne kontrapunkty
  historyczne (fortyfikacje polowe/wieże obronne/machiny oblężnicze).
  „Akademia"/„Akademia wojskowa" — dwa RÓŻNE typy edukacji (ogólna vs
  wojskowa), odrębne teksty.

Format wpisu w JSON: pojedynczy string, bez HTML, bez akapitów, UTF-8 z
polskimi znakami wprost. NIE zmieniaj żadnego innego pola żadnego budynku.
Waliduj `jq . gra/data/buildings.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/buildings.json` bez błędu składni.
2. Wszystkie 13 wskazanych budynków ma niepuste pole `historia`, 4-6 zdań,
   zero identyfikatorów/nazwisk repo, zero odniesień do mechaniki gry, zero
   duplikatów (w tym między akademia/akademia_wojskowa).
3. Żaden INNY budynek i żadne INNE pole tych 13 nie zostały zmienione —
   `git diff` wyłącznie dodane linie `"historia": "..."`.
4. Realny, żywy dowód (headless Chromium): karta DOWOLNEGO z tych 13
   budynków pokazuje sekcję „Rys historyczny" z wpisaną treścią.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   `entity-card-historia-section-test.cjs` W PEŁNI zielony (31/31 — fixture
   testu jest już naprawiony na trwałe, brak dopuszczalnych wyjątków).

## ALLOWLISTA — nic poza tym
`gra/data/buildings.json` WYŁĄCZNIE. Zakazane bezwzględnie: wszelkie inne
pliki w `gra/data/**`, `gra/src/**`, `gra/tools/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-B3-Q1`, baza JAWNIE
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
