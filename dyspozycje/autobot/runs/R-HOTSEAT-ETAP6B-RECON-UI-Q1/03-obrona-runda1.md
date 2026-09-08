# R-HOTSEAT-ETAP6B-RECON-UI-Q1 — Obrona runda 1

**Metoda:** świeży `Read`/`grep -n` na `gra/src/main.ts` (worktree bieżący stan, zero
polegania na pamięci/raportach), punktowo dla każdego zarzutu Evaluatora.

## Zarzut 1 [ISTOTNY] — PRZYJMUJĘ

Sprawdzone `grep -n "function runWorldEndTurn"` → `28957`; `Read main.ts:29460-29470`
potwierdza dosłownie: `_lastLudnoscRate = cities.filter(c => c.ownerId === 0).reduce((s, c)
=> s + c.population, 0) - popBeforeTick;` na linii **29464**, wewnątrz `runWorldEndTurn()`,
poza U1/U2. Dodatkowo `Read main.ts:29395-29415` potwierdza `playerEcon =
sumEconomyForPlayerCities(econ, cities)` (linia 29403) zasilające `_lastPracaRate/
_lastPieniadzRate/_lastNaukaRate/_lastKulturaRate/_lastKultura` (29405-29411); `Read
main.ts:29570-29615` potwierdza `econ.upkeepByOwner.get(0)` (29578) i
`econ.resourceUpkeepByOwner.get(0)` (29590) zasilające `_lastBogactwoHandel/
UtrzymanieBudynkow/Jednostek/Surowcow/_lastBogactwoRate` (29608-29612). Wszystko dokładnie
zgodne z cytatem Evaluatora. §4 pierwotny był fałszywy — sprawdzał tylko punktowe przykłady
(4154,12563,17549,26499,35419), pomijając cały blok `runWorldEndTurn`. **Poprawione w
`01-operator-runda1-analiza.md` §4**: migracja U1/U2 NIE WYSTARCZY, `runWorldEndTurn()` to
trzeci write-site z własnymi literałami `ownerId===0`/`.get(0)`, oznaczony jako TWARDA
ZALEŻNOŚĆ dla rundy implementacji (ten sam hak `humanOwnerId` co klaster D+F Etapu 6a),
nie kosmetyka. Obie warstwy (zerowanie Etapu 5 + migracja write-site'u) potrzebne
niezależnie — zrewidowano też wnioski §5 pkt 3.

## Zarzut 2 [ŚREDNI] — PRZYJMUJĘ

Sprawdzone `Read main.ts:10088-10093`: `if (showPlayerHints && u.ownerId === 0) { ...
showHintMessage(msg, 4500); }` — linia 10091 dokładnie zgodna. `Read main.ts:29330-29335`:
`if (tick.ownerId === 0) { playerDamagedCount += ...; playerDestroyedCount += ...; }` (linia
29333) + `Read main.ts:29377-29384`: komentarz `// --- Komunikaty HUD gracza (tylko
ownerId===0 — AI głoduje po cichu) ---` i `showHintMessage('Głód: utracono ...')` /
`showHintMessage('Głód wojska: ...')` (29379-29382). `Read main.ts:29785-29834`: analogiczny
wzorzec przy deficycie złota/buncie — `if (tick.ownerId === 0) { gdPlayerDamagedCount +=
...}` (29787) i komentarz identyczny `// --- Komunikaty HUD gracza (tylko ownerId===0 ...)
---` + `showHintMessage('Deficyt Złota: utracono ...')` (29833). Wzorzec strukturalnie
identyczny do `extraCityPanelConfig` — bramkowanie WYŚWIETLENIA komunikatu po `ownerId`,
kategoria (b) wg definicji dispatchu. Faktycznie nieobecne w dokumencie pierwotnym — ani w
78, ani w 17 granicznych. **Dopisane w `01-operator-runda1-analiza.md` §5** jako nowy punkt
4: 3 klastry / 5 linii (`10091`; `29333`+`29379-29382`; `29787`+`29833`), z uzasadnieniem
analogicznym do `extraCityPanelConfig`, wliczone do zrewidowanej sumy granicznej (17→20).
Zweryfikowano też zasięg: `showHintMessage` ma 308 wystąpień w pliku, ale tylko te 3 klastry
mają bezpośrednią bramkę `ownerId===0`/`tick.ownerId===0` w bezpośrednim sąsiedztwie —
potwierdzone przeglądem kontekstu wokół każdego trafienia `grep -n "ownerId\s*===\s*0"`.

---

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6B-RECON-UI-Q1
GOAL: Recon-only kategorii UI Etapu 6 (podetap b), zero zmian kodu w `gra/`
ZMIANY-COMMIT: `01-operator-runda1-analiza.md` (§4 przepisane, §5 zrewidowane) +
  `03-obrona-runda1.md` (nowy) — commit w tym worktree
TESTY: nie dotyczy (docs-only, DOMAIN: INFORMATIONAL)
BLOKADY: brak
RUNDY: 1/5 (Obrona)
OBRONA: 1 -> PRZYJMUJE (dowód: `main.ts:29464` `_lastLudnoscRate = cities.filter(c =>
  c.ownerId === 0)...` wewnątrz `runWorldEndTurn()` 28957-33313, plus 29403/29578/29590/
  29608-29612 — świeży Read/grep, poprawione §4+§5)
OBRONA: 2 -> PRZYJMUJE (dowód: `main.ts:10091`, `29333`+`29379-29382`, `29787`+`29833` —
  showHintMessage bramkowany ownerId===0/tick.ownerId===0, strukturalnie identyczny do
  extraCityPanelConfig — świeży Read, dopisane jako pozycja graniczna (b)/(c) w §5)
NASTEPNY KROK: Evaluator runda 2
DEPLOY/PUSH: NIE WYKONANO
