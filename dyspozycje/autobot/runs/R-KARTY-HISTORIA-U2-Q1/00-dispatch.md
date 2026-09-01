TEMAT:  R-KARTY-HISTORIA-U2-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 11/17 projektu `R-KARTY-HISTORIA-Q1`. DRUGI z sześciu batchy treści
dla JEDNOSTEK (U1 już zintegrowany, 13/75).

## GOAL
Dopisz pole `Historia` (Capitalized, konwencja `units.json`) do KAŻDEJ z
poniższych 13 jednostek w `gra/data/units.json`:

1. Triari
2. Jeździec chiński
3. Hu Ben Wei (Gwardia Tygrysa)
4. Impi
5. Oszczepnik Zulu (Izijula)
6. uThulwana (Białe Tarcze)
7. Wojownik z maczugą (Chaska)
8. Wojownik z toporem
9. Procarz (Huaracoc)
10. Oszczepnik (Estólica)
11. Królewska Gwardia
12. Rydwan konny
13. Łucznik egipski

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-U1-Q1`:
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia.
- ZAKAZANE: mechanika TEJ gry, identyfikatory repo, kopiowanie z Wikipedii.
- Wiele z tych jednostek ma jasny kontekst cywilizacyjny w nazwie (Chińska
  gwardia Hu Ben Wei, Zulu Impi/uThulwana/Izijula, Inka Chaska, andyjski
  Huaracoc, sumeryjska/inna Estólica, egipski łucznik) — napisz o
  KONKRETNEJ, właściwej cywilizacji/okresie, nie ogólnikowo. Jeśli nazwa
  jednostki w grze jest fikcyjnym/uproszczonym zlepkiem bez jasnego
  jednego historycznego odpowiednika, opisz najbliższy realny kontekst
  wojskowy tej kultury/okresu, zaznaczając to naturalnie.
- Sprawdź już zintegrowany `U1-Q1` w `origin/main` — spójność tonu.

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
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-U2-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz kopiowania tekstu między jednostkami tej samej
cywilizacji (np. trzy jednostki Zulu muszą mieć trzy różne teksty).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
