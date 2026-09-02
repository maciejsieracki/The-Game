TEMAT:  R-KARTY-HISTORIA-U6-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 15/17 projektu `R-KARTY-HISTORIA-Q1`. SZÓSTY i OSTATNI batch treści
dla JEDNOSTEK (U1-U5 już zintegrowane, 65/75 — po tym temacie kategoria
„jednostki" będzie kompletna: 75/75, a WSZYSTKIE 5 kategorii encji poza
cudami będą mieć pełny rys historyczny).

## GOAL
Dopisz pole `Historia` (Capitalized, konwencja `units.json`) do KAŻDEJ z
poniższych 10 jednostek w `gra/data/units.json`:

1. Tyrski miecznik
2. Wojownik fenicki
3. Gwardia Tyreńska
4. Thorakites
5. Evocati
6. iButho z iklwa
7. Gwardzista z champi
8. Wojownik z żelaznym khopesh
9. Mur tarcz (Sargonid)
10. Miecznik galijski

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-U1-Q1`...`U5-Q1`:
- ~4-6 zdań prozy, styl Civilopedii, REALNA historia.
- ZAKAZANE: mechanika TEJ gry, identyfikatory repo, kopiowanie z Wikipedii.
- Tyrski miecznik/Wojownik fenicki/Gwardia Tyreńska — Fenicja (Tyr), kontekst
  handlu morskiego i kolonizacji (Kartagina), NIE mylić z Grecją.
- Thorakites/Evocati — DWIE RÓŻNE rzymskie/hellenistyczne formacje: Thorakites
  to hellenistyczna piechota średniozbrojna (pancerz kolczy/łuskowy, przejście
  od falangi do manipułu), Evocati to rzymscy weterani-ochotnicy wezwani
  ponownie do służby — odrębne konteksty historyczne, nie warianty.
- iButho z iklwa/Gwardzista z champi — Zulu (iklwa to krótki kolący dzirot
  Shaki), Inka (champi to maczuga/buława) — jeśli `Mur tarcz (Sargonid)` już
  ma pole `Uwagi` odnotowujące rozjazd kultura/nazwa (Sumerowie vs Sargonidzi
  neoasyryjscy — patrz `P-ZELAZO-T5-MUR-TARCZ-KULTURA-ROZJAZD-Q1` w
  REJESTR-PROSB-I-ZADAN.md), NIE rozstrzygaj tego rozjazdu w polu `Historia` —
  opisz ogólnie mezopotamską/sumeryjską taktykę muru tarcz (przedstawioną już
  na Steli Sępów), zgodnie z aktualnym stanem danych, bez fabrykowania
  rozstrzygnięcia nieudokumentowanej decyzji właściciela.
- Wojownik z żelaznym khopesh — egipski khopesz z żelaza (odróżnij od
  wcześniej opisanego brązowego khopesza w U3, jeśli taki istnieje — sprawdź
  `origin/main`).
- Miecznik galijski — Galowie, kontekst długiego miecza celtyckiego (spatha/
  gladius celtycki), odrębny od już opisanych Soldurii/Gaesatae (U4).
- Sprawdź już zintegrowane U1-U5 w `origin/main` — spójność tonu.

Format wpisu w JSON: pojedynczy string, bez HTML, UTF-8 z polskimi znakami
wprost. NIE zmieniaj żadnego innego pola żadnej jednostki. Waliduj
`jq . gra/data/units.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/units.json` bez błędu składni.
2. Wszystkie 10 wskazanych jednostek ma niepuste pole `Historia`, 4-6 zdań,
   zero identyfikatorów repo, zero mechaniki gry, zero duplikatów (sprawdź
   względem WSZYSTKICH jednostek z polem Historia w pliku — po tym batchu
   powinno być 75/75).
3. Żadna INNA jednostka i żadne INNE pole tych 10 nie zostały zmienione.
4. Realny, żywy dowód: karta DOWOLNEJ z tych 10 jednostek pokazuje sekcję
   „Rys historyczny" z wpisaną treścią.
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych + unit-replace-test/
   combat-test bez regresu + `entity-card-historia-section-test.cjs` W
   PEŁNI zielony (31/31).
6. Po tym batchu WSZYSTKIE 75 jednostek w pliku mają niepuste pole `Historia`
   (weryfikacja: `jq '[.[] | select((.Historia // "") == "")] | length'` = 0).

## ALLOWLISTA — nic poza tym
`gra/data/units.json` WYŁĄCZNIE. Zakazane bezwzględnie: wszelkie inne pliki
w `gra/data/**`, `gra/src/**`, `gra/tools/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-U6-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu z żywej
przeglądarki. Zakaz kopiowania tekstu między jednostkami tej samej
cywilizacji/rodziny (3 jednostki fenickie). Zakaz rozstrzygania
nieudokumentowanych rozjazdów danych (Mur tarcz Sargonid) samodzielną
decyzją — patrz wytyczne wyżej.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only. Po integracji: kategoria „jednostki"
KOMPLETNA (75/75) — zamyka WSZYSTKIE kategorie encji poza cudami (wonders),
wymagającymi osobnej infrastruktury renderowania (osobny temat).
