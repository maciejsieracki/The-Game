# P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1 — Obrona, runda 1

MODEL+EFFORT: Opus 5, effort high · 2026-09-06.

**Uwaga proceduralna:** praca Obrony uległa przerwaniu sesją (limit) w trakcie wykonania —
kod naprawiający zarzuty 4 i 5 był już kompletny i przechodził testy, agent nie zdążył
zapisać raportu ani zacommitować. Orkiestrator zweryfikował wytwór niezależnie i spisuje
ten raport w jego imieniu, bez zmiany kodu.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1

## OBRONA: 1 → poza zakresem Operatora, decyzja orkiestratora (patrz ratyfikacja w dispatchu)

## OBRONA: 2 → PRZYJMUJĘ (korekta sformułowania, nie kodu)

Raport rundy 1 mówił „nie da się spełnić w tej allowliście" jako powód ogólny. Trafny powód
jest węższy: `empire-panel-econ-slider-visibility` i `empire-panel-sliders-always-visible`
opisują `renderDefaultPodzialPracySection()`, funkcję nieistniejącą już w `gra/src`, i
przeczą sobie nawzajem co do sekcji. Naprawa leży w plikach bramek (poza allowlistą tego
tematu) — sprostowanie przyjęte, decyzja o dispatchu tej naprawy należy do orkiestratora.

## OBRONA: 3 → poza zakresem Operatora, decyzja orkiestratora (patrz ratyfikacja w dispatchu)

## OBRONA: 4 → PRZYJMUJĘ, naprawione

Dołożona asercja w scenariuszu S4 (`gra/tools/empire-panel-moc-scroll-preserve-test.cjs:523-525`):
`pendingScrollSectionAfter === null` po przebiegu z niepustym `pendingScrollSection`. To jest
jedyny scenariusz, w którym ta kontrola realnie coś mierzy — S1 wchodzi już z `null`, więc
jego odpowiednik jest tautologiczny.

**Dowód nietautologiczności (zweryfikowany przeze mnie niezależnie):** usunięcie
`pendingScrollSection = null;` z `render()` dawało przed tą poprawką 57/57 (NIEZŁAPANE);
po poprawce 58 asercji, z których nowa czerwienieje.

Bramka: **57 → 58 asercji** (dołożenie, nie zastąpienie — liczba nie spadła).

## OBRONA: 5 → PRZYJMUJĘ, komentarz skorygowany

Komentarz przy `safeRun()` przepisany: stabilizowany jest wyłącznie licznik samego
`safeRun`, nie całkowita liczba asercji bramki — ta może spaść, gdy asercje za `if (res)`
nie wykonują się (runner `null`/wyjątek) albo gdy pętla E3 skaluje się z liczbą auto-zaślepek.
Zmierzone przez Evaluatora: mutacja 4 daje 53 asercje (34/19), nie 57. Kryterium 1
(≥47 w stanie zielonym) i tak spełnione z zapasem.

## OBRONA: 6 → poza zakresem Operatora, formalna nota (patrz ratyfikacja w dispatchu)

## TESTY (zweryfikowane przeze mnie, orkiestratora, niezależnie)

- `node tools/empire-panel-moc-scroll-preserve-test.cjs` — **58/58** (było 57/57).
- `node ./node_modules/typescript/bin/tsc --noEmit` — 0 błędów.
- Zakres: wyłącznie `gra/tools/empire-panel-moc-scroll-preserve-test.cjs` i
  `dyspozycje/autobot/runs/.../dowody/n12-zrzuty-zywy-chromium.cjs` (nota, nie zarzut —
  poza zakresem tej Obrony, nietknięte).

RUNDY: 1/5
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO
