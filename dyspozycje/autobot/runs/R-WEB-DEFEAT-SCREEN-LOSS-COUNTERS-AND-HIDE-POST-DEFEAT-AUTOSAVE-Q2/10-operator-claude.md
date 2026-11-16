# R-WEB-DEFEAT-SCREEN-LOSS-COUNTERS-AND-HIDE-POST-DEFEAT-AUTOSAVE-Q2 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES (Operator; wymaga Evaluatora, Obrony i Final Control)
DOMAIN: GAME (UI końca gry, stan gry, zapis)
TEMAT: R-WEB-DEFEAT-SCREEN-LOSS-COUNTERS-AND-HIDE-POST-DEFEAT-AUTOSAVE-Q2
GOAL: (1) liczniki strat na ekranie porażki („Utracone miasta: N”, „Utracone jednostki: M”); (2) autozapis po porażce nie trafia na listę „Wczytaj grę”.
BAZA: b160459c9dea67e082ec59dc7770d10cc59c08d4 (origin/main, FALA 772). Worktree: detach od bazy, zmiany w gałęzi roboczej tego worktree.

## ZMIANY / COMMIT

Liczniki strat (ABC B):
- `gra/src/game/loss-counters.ts` (NOWY, czysty moduł): `LossCounters {lostCities, lostUnits}`, `emptyLossCounters`, `isPlayerCityLoss`, `recordCityLoss`, `recordUnitLosses`, `normalizeLossCounters` (odczyt niezaufanego JSON, brak/zła wartość -> 0), `isDefeatedState` (reguła autozapisu = `checkDefeat` z victory.ts).
- `gra/src/main.ts`:
  - stan `lossCounters` (obok `playerEverOwnedCityByOwner`), reset w `doStartGame`, `doStartPlaytestWalkaMapy`, `doStartPlaytestMiastoEkonomia`;
  - utrata miasta gracza (owner 0, zmiana na innego właściciela) liczona w 5 miejscach: kapitulacja/głód (`city.ownerId = newOwner` ~l.18509), aneksja miasta-państwa (~l.37828), zdobycie w bitwie `applyCityCaptureToMap` (~l.38802; obejmuje też barbarzyńców), bunt `transferCityToRebelFactionWithLedger` (~l.39037), cesja traktatowa `transferCityByTreaty` (~l.39075). Zmiana właściciela z AI na gracza NIE jest stratą;
  - utracone jednostki: przed `applyPostBattleMap` zbierane są id jednostek gracza (owner 0) obecnych w rosterach bitwy; po rozstrzygnięciu te, których nie ma już w `units`, dodawane do licznika (~l.37000-37045). Rozwiązanie jednostki (`disbandPlayerUnit`) nie przechodzi przez bitwę, więc się nie liczy; straty AI nie są liczone;
  - zapis: `meta.lossCounters` dopisywane TYLKO gdy niezerowe (obok `playerEverOwnedCityByOwner`); odczyt w `restoreGameFromSave` przez `normalizeLossCounters` (stary zapis -> 0/0);
  - `sprawdzPrzegranaPoUtracieMiasta` i koniec tury (przegrana) przekazują `utraconeMiasta` / `utraconeJednostki` do statystyk ekranu.
- `gra/src/ui/victoryScreen.ts`: `VictoryScreenStats` + pola opcjonalne `utraconeMiasta`, `utraconeJednostki`; `buildDefeatSummary` w sekcji „Straty” pokazuje dwie karty (liczby; brak pola -> „—”, bez zgadywania). Zwycięstwa bez zmian.

Autozapis po porażce (ABC A, opcja „nie twórz”):
- `doRotatingAutosave` na początku: jeśli `isDefeatedState({cities, graczKiedysMialMiasto})` -> nie zapisuje (`console.warn`). Zapisy sprzed porażki zostają, nic nie jest kasowane. Lista „Wczytaj grę” nie dostaje autozapisu ze stanu porażki.

Testy:
- `gra/tools/loss-counters-test.cjs` (NOWY): 28 asercji (esbuild bundle realnego `loss-counters.ts`), mutacja na kopii (`LC_SRC`, reguła „każda zmiana właściciela = strata”) daje 3 FAIL.
- `gra/tools/defeat-screen-summary-test.cjs` (zaktualizowany pod liczniki): 25/0 (w tym: brak liczników -> myślniki; liczby w DOM).

ZMIANY-COMMIT: patrz sekcja DEPLOY/PUSH — commit wykonany na gałęzi worktree (SHA w polu `sha` odpowiedzi).

## TESTY (surowe wyniki, uruchomione w tym worktree po zmianach)

- `npx tsc --noEmit` (gra/): exit 0, 0 linii błędów.
- `node tools/loss-counters-test.cjs`: `loss-counters-test: 28 OK, 0 FAIL` (exit 0).
- `node tools/defeat-screen-summary-test.cjs`: `passed=25 failed=0` (exit 0).
- `node tools/victory-test.cjs`: `12 passed, 0 failed` (exit 0).
- `node tools/victory-screen-test.cjs`: `11 passed, 0 failed` (exit 0).
- `node tools/load-game-regression-test.cjs`: `34 PASS / 0 FAIL` (exit 0).
- Bramki referencyjne: `logic-test` `LOGIC OK (213/213)`; `research-test` `PASSED: 33 / FAILED: 0`; `combat-test` `All sanity checks passed.`; `tech-tree-test` exit 0 (bez linii podsumowania); `unit-replace-test` exit 0.
- Mutacja: `loss-counters-test` na kopii z błędną regułą -> `25 OK, 3 FAIL` (test wykrywa).
- `git diff --check`: czysto.

NIE ZMIERZONO (świadomie, poza zakresem tej rundy lub bez środowiska):
- żywy Chromium: ekran porażki ze zrzutem i lista „Wczytaj grę” po porażce w przeglądarce (kryterium (b) i (c) z dispatchu w wersji żywej) — NIE uruchamiano;
- integracja `applyPostBattleMap` z liczeniem poległych w realnej bitwie (test jednostkowy liczący poległe jest pominięty; zmiana w main.ts nie ma osobnego testu, tylko tsc + przegląd kodu);
- ścieżka „stary zapis z realnego pliku” (test objął `normalizeLossCounters` i brak pola, nie wczytanie prawdziwego zapisu z dysku);
- mutacja na kopii reguły autozapisu (testowana jest `isDefeatedState`, nie wywołanie w `doRotatingAutosave`).

## BLOKADY

Brak twardych blokad. Odchylenia i ograniczenia (LUKI ROZSTRZYGNIĘTE ZAŁOŻENIEM):
1. Gracz = owner 0 (`HUMAN_OWNER_PRIMARY`, zgodnie z `checkDefeat({gracz: 0})`). Straty drugiego fotela hotseat NIE są liczone. Założenie: ekran porażki dotyczy pierwszego fotela, jak sama reguła porażki.
2. Zniszczenie miasta: w kodzie nie znalazłem ścieżki kasującej miasto gracza (poza resetem przy wczytaniu/nowej grze), więc „zniszczone” nie ma osobnego licznika. Założenie: miasto zniszczone = nieobecne, nie jest liczone osobno.
3. Jednostki liczone są tylko w ścieżce `applyPostBattleMap` (bitwa rozstrzygnięta przez `applyMapBattleOutcome` w main.ts). Jednostki usunięte poza bitwą (np. wymuszone rozwiązanie przez system, nie gracz) nie wchodzą do licznika. Założenie: to nie są „polegli”.
4. Zmiana `post-battle-map.ts` została wycofana (poza allowlistą); liczenie jest w `main.ts`.
5. Autozapis: blokada w `doRotatingAutosave` pomija też zapis, gdy stan jest porażką przed zakończeniem tury; nie zmienia zachowania zwycięstw ani zapisów ręcznych.

## RUNDY

1/5. Ostatni werdykt: brak (pierwsza runda). Decyzja wymagana: brak.

## NASTĘPNY KROK

Evaluator: przegląd diffu (`git diff b160459c9..HEAD`), test live w Chromium (zrzut ekranu porażki + lista „Wczytaj grę” po porażce) i wzięcie pod uwagę pozycji NIE ZMIERZONO powyżej. Final Control: po PASS integracja przez orkiestratora.

## DEPLOY/PUSH: NIE WYKONANO

Nie integrowałem, nie deployowałem, nie pushowałem na main. Gałąź worktree i commit tylko lokalnie.

## UWAGI-DLA-ORKIESTRATORA

- Wiadomość użytkownika w kontekście wspominająca gwiazdkę generała i egipskich łuczników dotyczy tematów #445 (R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1) i #448 (archers), NIE tego tematu. Nie wykonywałem ich.
- Sprzątanie: `gra/node_modules` zainstalowany na potrzeby testów; usuwany po commicie (zgodnie z dispatchem). `/tmp` nie zostawiam poza scratchpadem sesji.
- Sugestia do osobnego tematu (nie wykonywałem, zakres): test live w Chromium dla tej funkcji i ewentualnie test integracyjny liczenia poległych w `applyMapBattleOutcome`.
