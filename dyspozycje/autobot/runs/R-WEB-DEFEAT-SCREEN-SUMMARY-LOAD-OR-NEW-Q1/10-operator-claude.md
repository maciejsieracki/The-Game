# R-WEB-DEFEAT-SCREEN-SUMMARY-LOAD-OR-NEW-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI końca gry: ekran porażki)
TEMAT: R-WEB-DEFEAT-SCREEN-SUMMARY-LOAD-OR-NEW-Q1
GOAL: porażka = pełny koniec gry z ekranem podsumowania (co gracz osiągnął, co stracił) i wyborem „Wczytaj grę” albo „Rozpocznij od nowa”; zwycięstwa bez zmian; reguła porażki, balans i zapis gry nietknięte.
BAZA: origin/main = 8265bbec0e8d040562fc73bbafaf57ae3aef50ed (ancestor OK, worktree detach na tym SHA).
ZMIANY/COMMIT:
- kod + testy: commit `1a021cbd3` (gra/src/ui/victoryScreen.ts, gra/src/main.ts, gra/tools/defeat-screen-summary-test.cjs, gra/tools/defeat-screen-summary-live-test.cjs)
- raport: ten plik, osobny commit (czubek gałęzi = SHA zwrócony w polu sha)
- allowlista: zgodna z dispatchem. Nie dotknięto: WERSJE.md, manifest, gra-robocza/, rust-port/, SaveGame, checkDefeat, balansu.
- wykryte pliki uboczne: gra/tools/.victory-screen-bundle.css zmienia się przy uruchomieniu istniejącego victory-screen-test.cjs; przywrócony `git checkout`, NIE w commicie.

## Co zrobiono
1. victoryScreen.ts
   - przegrana: sekcje „Osiągnięcia” (Tur przetrwanych / Ostatnia epoka / Zbadane technologie / Cywilizacja) i „Straty” (Utracone miasta: Wszystkie).
   - dwa przyciski: „Wczytaj grę” (`#vsc-load-game`, callback wczytania) i „Rozpocznij od nowa” (`#vsc-new-game`, callback nowej gry, dotychczasowe `location.reload()`).
   - zwycięstwo (dominacja, nauka): bez zmian, jeden przycisk „Nowa gra”.
   - eksport `buildDefeatSummary(stats)` (testowalne bez DOM), `showVictoryScreen(data, onNewGame, onLoadGame?)`.
2. main.ts
   - `pokazEkranPorazki(screenData)` (nowa funkcja w tym samym zakresie co `sprawdzPrzegranaPoUtracieMiasta`), użyta w obu miejscach porażki: `sprawdzPrzegranaPoUtracieMiasta` (~36487) oraz blok VICTORY CHECK (~46349, gałąź `vResult.rodzaj === 'przegrana'`).
   - „Wczytaj grę”: chowa overlay, sprawdza `savePresence.refresh()`, otwiera `showLoadGameDialog`. Po wyborze zapisu `loadGameFromSlot(slot, true)`; jeśli po wczytaniu `gameOver` nadal true, ekran porażki wraca. „Anuluj” w dialogu też przywraca ekran porażki. Brak zapisów → hint „Brak zapisów na tym urządzeniu.” i powrót ekranu.
   - stats: `technologieZbadane: player.zbadane.size` (dodane w obu call site).
3. Dlaczego `gameOver` nie zostaje ślepo ustawione: overlay ma z-index 10150, dialog zapisu 520, więc overlay trzeba schować przed dialogiem. Stąd helper przywraca ekran zamiast zostawiać grę z `gameOver=true` bez ekranu.

## Liczby i źródła (ZMIERZONO w kodzie/grze)
- Tury przetrwane: `turn` (zmienna tury w main.ts, przekazana w `stats.turn`).
- Ostatnia epoka: `eraLabelsDefeat[player.era]` (main.ts, ta sama tablica co dotychczas).
- Zbadane technologie: `player.zbadane.size` (`gra/src/game/playerState.ts:95`, typ `Set<string>`). ZMIERZONO w teście live: nie pokazano liczby w zrzucie — sprawdzone tylko w teście jednostkowym (karta z wartością ze stats).
- Cywilizacja: `player.civType`.
- Utracone miasta: wartość stała „Wszystkie”, bo przegrana z definicji oznacza utratę wszystkich miast (`checkDefeat`). NIE ZMIERZONO liczby utraconych miast w trakcie gry: nie istnieje licznik w stanie gry i nie dodawano nowego pola (zgodnie z dispatchem, bez zmiany SaveGame).
- Utracone jednostki, największa liczba miast jednocześnie, zbudowane cuda: NIE ZMIERZONO, brak wiarygodnego licznika, nie dodawano.

## TESTY
- `npx tsc --noEmit` (gra/): exit 0, 0 błędów (po zmianach w src).
- `node tools/defeat-screen-summary-test.cjs` (nowy, jsdom): passed=23 failed=0.
  - mutacja na kopii (`VS_SRC`, usunięty przycisk Wczytaj grę przez `(false && onLoadGame)`): failed=7 (passed=16), exit 1. Test czerwony, jak wymaga dispatch.
- `node tools/defeat-screen-summary-live-test.cjs` (nowy, Chromium headless, build vite do katalogu tymczasowego, bez `npm run build`): 24 passed, 0 failed.
  - C0 (kontrola bez porażki): zwykły zapis → endTurn → loadSlot → endTurn: endTurn NIE przesunął tury (ten sam komunikat `[EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)`). Blokada po wczytaniu występuje bez porażki, więc nie jest skutkiem tego tematu.
  - L1: porażka po realnym endTurn → ekran z sekcjami Osiągnięcia/Straty, dokładnie 2 przyciski (WCZYTAJ GRĘ, ROZPOCZNIJ OD NOWA w textContent), klik Wczytaj grę → dialog `.civ-sl`, ekran schowany; wybór zapisu „Tura 1” → ekran zniknął, gameOver=false, tura=1, gracz ma 1 miasto.
  - L2: nowa gra, porażka → Wczytaj grę → Anuluj → ekran porażki wraca, gameOver=true.
  - zero pageerror / console.error.
  - zrzuty (poza repo): scratchpad `defeat-live/evidence/`.
- Regresja (bramki referencyjne i testy powiązane), wszystkie exit 0:
  - logic-test: LOGIC OK (213/213)
  - tech-tree-test: 20 pass, 0 fail
  - research-test: ALL GREEN
  - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
  - combat-test: All sanity checks passed.
  - victory-screen-test: 11 passed, 0 failed
  - victory-test: 12 passed, 0 failed
  - load-game-regression-test: 34 PASS / 0 FAIL

## BLOKADY
- Brak blokad po stronie kodu.
- Znany, NIE związany z tym tematem: po wczytaniu zapisu z tury 1 w playtest endTurn jest blokowany przez bramkę NNS (prognoza skarbca/spichlerza < 0). Pokazane kontrolą C0, bez porażki. Dług #417/#390 (opisany już w rejestrze).

## RUNDY
- runda 1/5, ostatni werdykt: brak (Operator). Decyzja wymagana: brak.

## NASTĘPNY KROK
- Evaluator (SONNET) i Final Control (SONNET) według dispatchu. Potwierdzić na pliku powyżej: commit `1a021cbd3` (kod) + commit raportu.

## DEPLOY/PUSH: NIE WYKONANO
(Operator nie pushuje na main ani nie deployuje.)

## UWAGI-DLA-ORKIESTRATORA
1. Lista „Wczytaj grę” pokazuje też autozapis zrobiony po porażce (widziany w dialogu: „Autozapis · tura 2”, zapisany po tym, jak miasto zostało utracone). NIE ZMIERZONO, co zawiera ten zapis (czy gameOver / 0 miast), bo nie wczytywano go w teście. Warto to sprawdzić przed integracją.
2. ABC do właściciela (decyzja produktowa, nie wybieram sam): „Straty” pokazują dziś tylko „Utracone miasta: Wszystkie”. Opcje: A) zostawić jak jest (bez nowego licznika, zero ryzyka dla zapisu); B) dodać opcjonalne pola liczników (utracone miasta, utracone jednostki) z wartością domyślną 0 i testem starego zapisu; C) wyrzucić sekcję Straty. Rekomendacja: A teraz, B jako osobny temat, jeśli właściciel chce liczb.
3. Pliki tooling-owe: uruchomienie istniejącego `gra/tools/victory-screen-test.cjs` przepisuje śledzony `gra/tools/.victory-screen-bundle.css` (artefakt esbuild). Warto to naprawić osobnym tematem (nie w tym).
4. Stan gry po porażce i wczytaniu/anulowaniu przetestowany w Chromium na playtest, nie na prawdziwej partii z wieloma turami.
