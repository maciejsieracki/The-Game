# R-WEB-ARMY-CONSOLIDATION-Q1 — runda 1, odpowiedź Operatora na zarzuty Evaluatora (obrona)

Baza odtworzenia: `refs/keep/armycon-eeb60f0a` (commity `0f7b4fbc`, `6c14961c`, `eeb60f0a` na `d49c21c6`).
Ten dokument zastępuje raport „Waiting on the gate runner" (nie zawierał wyniku).
Nie zmieniono kodu gry w `gra/`. Zmiana tej rundy: wyłącznie ten dokument.

## Odpowiedzi punkt po punkcie

1. **Brak implementacji (flaga, `army-consolidation*.ts`, params JSON, etap pokój/wojna, wiring main.ts/ai.ts).**
   PRZYJMUJĘ. Dowód: `git grep ARMY_CONSOLIDATION refs/keep/armycon-eeb60f0a` trafia tylko w `01-diagnoza.md` (linie 62 i 74); `git diff --name-only d49c21c6 refs/keep/armycon-eeb60f0a` nie zawiera żadnego pliku `army-consolidation*` ani `army-consolidation-params.json`. Implementacja nie została wykonana w rundzie 1. Nie jest to poprawione w tej odpowiedzi.

2. **Brak testów jednostkowych z mutacjami i testu wiringu.**
   PRZYJMUJĘ. Brak testów konsolidacji w `refs/keep/armycon-eeb60f0a` (diff powyżej). Istniejący `test-hook-guard-test.cjs` dotyczy wyłącznie strażnika haka, nie konsolidacji.

3. **Brak pomiaru ON vs OFF w prawdziwej grze, brak zrzutu porównawczego w `evidence/`.**
   PRZYJMUJĘ. Pomiar istnieje tylko dla stanu OFF (baza), seed 101, tura 20, w pokoju (`01-diagnoza.md` sekcja 3). Brak przebiegu ON, brak ≥3 seedów, brak 60 tur, brak zrzutu porównawczego.

4. **Pomiar bazowy niepełny (jeden seed, tylko tura 20; tury 40/60 niezmierzone; `Target crashed` przy 60 turach).**
   PRZYJMUJĘ. Potwierdzone w `01-diagnoza.md` sekcje 2, 3 i 3a. Tury 40 i 60 nie zostały zmierzone. Przebiegi 60-turowe zakończyły się `Target crashed` (dwa razy). Nie podaję tego jako pomiaru kompletnego. Skala tury 20 (2–3 grupy polowe na cywilizację, 1–4 jednostki na właściciela) jest mniejsza niż na zrzutach właściciela; diagnoza to odnotowuje.

5. **Brak raportów bramek regresji (tsc, logic, ai-test, war-*, ai-move-range, barbarzyncy, endturn, exec, load-game, diplomacy, forced-war, Vite build do scratch).**
   PRZYJMUJĘ. Stan: NIE_ZMIERZONO. Powód konkretny: w worktree nie ma `gra/node_modules` (`ls gra/node_modules` → brak), więc żadna bramka nie była uruchomiona. Bramki nie zostały uruchomione w tej rundzie. Nie podaję wyników.

6. **Brak jawnej listy ZAŁOŻEŃ (garnizony, stolica, limit armii, ikona przekreślonego kółka, własność wojska z zrzutu 3).**
   PRZYJMUJĘ CZĘŚCIOWO, z uzupełnieniem poniżej.
   - Garnizony zostają: ZAŁOŻENIE, zapisane w `01-diagnoza.md` sekcja 4.
   - Stolica = `city` z najwyższą populacją do czasu znalezienia pola stolicy w danych AI: ZAŁOŻENIE, `01-diagnoza.md` sekcja 4. Do potwierdzenia w kodzie przed implementacją.
   - Limit armii (`armyMerge.ts`): NIE ZWERYFIKOWANO. `grep` po `armyMerge.ts` (wersja z `d49c21c6`) nie wskazał czytelnej stałej limitu wielkości stosu; trafienia dotyczą HP i ruchu. Limit trzeba wskazać w kodzie w rundzie 2 i zapisać tu jako fakt.
   - Ikona „przekreślonego kółka" i własność wojska z zrzutu 3: NIE USTALONO. Zrzut 3 nie jest zapisany w repo (dispatch to przyznaje), więc nie da się odczytać legendy. Nie zgaduję znaczenia ikony. Do ustalenia przez właściciela albo z hak-snapshotu (`rawPositions`, `6c14961c`).

7. **Diagnoza to hipotezy bez weryfikacji danymi (główny podejrzany `assignHomeDefenders`).**
   PRZYJMUJĘ, z dowodem na kotwice kodu. Dowód: `git show d49c21c6:gra/src/game/ai.ts` — `assignHomeDefenders(` zaczyna się w linii 2967; w linii 3329 `concentrationExcludedUnitIds` zawiera `...homeDefenderAssignments.keys()`. Wskazania kodu są poprawne. Zależność przyczynowa (że to ONA odrywa jednostki od armii w pokoju) NIE jest potwierdzona pomiarem. Status: hipoteza.

8. **Zmiany `main.ts` (~94 linie haka) poza minimalnym wiringiem; oddzielić commity haka od konsolidacji; brak weryfikacji kolizji z R-WEB-MEASURE-ROBOCZA-Q1 i R-WEB-WAR-EPOCH-NOSHOW-DIAG-Q1.**
   PRZYJMUJĘ W CZĘŚCI, ODRZUCAM W CZĘŚCI.
   - Oddzielenie commitów: ODRZUCAM jako zarzut otwarty. Commity haka (`6711dae9`, `0f7b4fbc`, `6c14961c`) są osobno od `eeb60f0a` (diagnoza). Commitów konsolidacji w tym refie nie ma, więc nie ma czego mieszać. Dowód: `git log --oneline refs/keep/armycon-eeb60f0a` (6 commitów: 3 hak, 1 diagnoza, 2 starsze z `d49c21c6`).
   - Kolizje: PRZYJMUJĘ. `git log --all --format='%h %s' -- gra/src/game/test-hook.ts` pokazuje, że plik ma kilka równoległych linii historii (`e33883b2` z R-WEB-AI-ARMY-UPKEEP-Q1, duplikaty `642198d4`/`5b879bbf`/`6888162c`/`351b2b02`). Żaden z 8 commitów nie ma w temacie „MEASURE" ani „WAR-EPOCH"; konflikt z tymi tematami nie jest jednak wykluczony, bo ich gałęzi nie zidentyfikowano w `git ls-remote`. Do sprawdzenia przed integracją.
   - Ponadto: w repo istnieje lokalny commit `d5bcf55a` (`feat(ai): R-WEB-ARMY-CONSOLIDATION-Q1 runda 2`) na gałęzi innego worktree (`worktree-wf_6dc83a2f-dca-3`). Nie jest na `origin`, nie jest w `refs/keep/armycon-eeb60f0a` i nie był przeze mnie weryfikowany ani scalany. Nie opieram się na nim w tej odpowiedzi. Orkiestrator powinien ustalić, czy to właściwy kanał rundy 2.

9. **Nie da się potwierdzić „flaga OFF = hash jak baza" ani determinizmu (brak flagi). Zakazy procesowe nie zweryfikowane.**
   PRZYJMUJĘ część o fladze (brak flagi, brak testu determinizmu). ODRZUCAM część o zakazach procesowych, z dowodem:
   - `git diff --name-only d49c21c6 refs/keep/armycon-eeb60f0a` — brak `WERSJE.md`, brak `rust-port/**`, brak plików `gra/` poza allowlistą (`gra/src/game/test-hook.ts`, `gra/src/main.ts`, `gra/tools/**`).
   - Brak `npm run build|dev` w repo: w `gra/` nie ma `node_modules` ani `dist` z tej rundy; brak `git add -A` (commity kontrolowane ścieżkami).
   - Brak push: `refs/keep/*` są lokalne; `DEPLOY/PUSH: NIE WYKONANO`.

## Stan po odpowiedzi

- Zarzuty przyjęte: 1, 2, 3, 4, 5 (jako NIE_ZMIERZONO), 6 (częściowo), 7, 8 (w części), 9 (w części o fladze).
- Zarzuty odrzucone z dowodem: 8 (oddzielenie commitów), 9 (zakazy procesowe).
- Implementacja, testy, bramki i pomiar ON vs OFF NIE zostały wykonane w tej odpowiedzi. FAIL z rundy 1 pozostaje ważny dla treści funkcjonalnej.

## Plan rundy 2 (ten sam ID)

1. Implementacja za flagą `ARMY_CONSOLIDATION_ENABLED` (params JSON, `army-consolidation.ts`, wiring ai/main), OFF = baza.
2. Testy jednostkowe z mutacjami i test wiringu.
3. Bramki regresji z listy dispatchu, z wynikami wpisanymi dosłownie.
4. Pomiar ON vs OFF: seedy 101/102/103 × 60 tur × 5 AI, zrzut porównawczy do `evidence/`.
5. Ustalenie limitu armii (`armyMerge.ts`) i ikony „przekreślonego kółka" przed kodowaniem.

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-ARMY-CONSOLIDATION-Q1
GOAL: Odpowiedź na zarzuty Evaluatora rundy 1; implementacja za flagą do rundy 2.
ZMIANY/COMMIT: allowlista = `dyspozycje/autobot/runs/R-WEB-ARMY-CONSOLIDATION-Q1/02-odpowiedz-na-zarzuty-r1.md`; SHA: patrz commit odpowiedzi; commity bazowe `0f7b4fbc`, `6c14961c`, `eeb60f0a`.
TESTY: NIE_ZMIERZONO (brak `gra/node_modules`); żadna bramka nie uruchomiona w tej rundzie.
BLOKADY: brak implementacji (przyjęte); brak pomiaru ON; brak limitu armii w ustaleniach; ikona zrzutu 3 nieustalona.
RUNDY: 1/5 (bez zmiany; ta odpowiedź to obrona rundy 1, nie nowa runda).
NASTĘPNY KROK: Evaluator ponownie na tym samym ID; Operator rundy 2 implementuje plan powyżej.
DEPLOY/PUSH: NIE WYKONANO
