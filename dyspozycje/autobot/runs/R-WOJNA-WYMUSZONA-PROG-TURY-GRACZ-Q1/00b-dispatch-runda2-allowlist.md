# R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1 — runda 2, rozszerzenie allowlisty

Evaluator rundy 1 znalazł FAIL: 4 zastałe bramki kodujące STARE zachowanie gracza (bez
progu tury), teraz celowo zmienione decyzją właściciela. Obrona słusznie odmówiła
naprawy — pliki były poza literalną allowlistą dispatchu 00-dispatch.md.

**Orkiestrator AUTORYZUJE rozszerzenie allowlisty o cztery pliki** (mechaniczna
konsekwencja jawnej, już podjętej decyzji właściciela „dodaj próg tury dla gracza" —
to jest re-anchoring testów pod już zaakceptowaną zmianę zachowania, nie nowa decyzja
produktowa wymagająca kolejnego ABC):

- `gra/tools/forced-war-iron-main-guard-test.cjs`
- `gra/tools/forced-war-iron-mutant-probe.cjs`
- `gra/tools/forced-war-iron-player-target-live-test.cjs`
- `gra/tools/forced-war-player-target-live-test.cjs`

## Wytyczne naprawy per plik

**`forced-war-iron-main-guard-test.cjs` i `forced-war-iron-mutant-probe.cjs`** — asercje
strukturalne (regex/string-match) dopasowujące STARY, dwuwarunkowy blok Kroku C. Zaktualizuj
dopasowywany fragment na nowy, trzywarunkowy blok (`playerCity && turn >= ... &&
totalActiveForcedWarsByOwner(0) === 0`) — czysty re-anchor, zero zmiany intencji testu
(nadal pilnuje że main.ts faktycznie zawiera ten kod, tylko już w nowym kształcie).

**`forced-war-iron-player-target-live-test.cjs` i `forced-war-player-target-live-test.cjs`**
(live Playwright, bootstrap `?playtest=mapa` @ turn=1, `__eraTestDebug.forceIronForcedWarOnPlayer()`/
`forceBronzeForcedWarOnPlayer()`) — **NIE osłabiaj tych testów do „w turze 1 gracz NIE jest
celem"**. Prawdziwa wartość tych bramek to dowód na żywym silniku, że mechanizm wyboru celu
i wypowiedzenia wojny FAKTYCZNIE działa dla gracza (SEDNO D/E z nagłówka pliku) — ta wartość
musi zostać zachowana, tylko przesunięta za próg tury. Sprawdź, czy istnieje już hak
testowy w `__eraTestDebug` do przesunięcia/ustawienia licznika tury (grep `__eraTestDebug`
w main.ts — jest ich sporo, przeczytaj co oferują) — jeśli TAK, użyj go, żeby scenariusz
uruchamiał się przy `turn >= 25` zamiast `turn === 1`. Jeśli NIE istnieje żaden hak do
przesunięcia tury, a jedyna droga to wielokrotne wołanie `endTurn()` z `__eraTestDebug`
w pętli (24× do tury 25) — to jest akceptowalne, o ile nie wymaga zmiany kodu produkcyjnego
poza allowlistą (jeśli jednak wymagałoby dodania NOWEGO haka do main.ts poza tym co już
tam jest — STOP, DECISION_REQUIRED, nie dodawaj nowego haka produkcyjnego samodzielnie
w tej rundzie). Kryterium sukcesu: test nadal dowodzi SEDNO D/E na żywym silniku, tylko
w kontekście tury ≥25 zamiast tury 1; zero console.error/pageerror pozostaje jako wymóg F.

## Binarne kryterium sukcesu tej rundy

- Wszystkie 4 pliki zielone, PLUS cała reszta rodziny `forced-war-*-test.cjs` (17 plików
  wg rejestru) nadal zielona, PLUS 5 bramek referencyjnych, PLUS `tsc --noEmit` czysto.
- Realna weryfikacja (nie tylko przeczytanie kodu) że dowód „gracz faktycznie zostaje
  celem wymuszonej wojny" nadal istnieje i przechodzi na żywym silniku (Playwright),
  teraz przy turze ≥25.
- Zero zmian w `gra/src/game/forced-war-*.ts` (progi AI nietknięte, to nie ich zakres).

Dalej obowiązują REGUŁA PRZECIW SAMOOSZUKIWANIU i GRANICE z `00-dispatch.md`.
