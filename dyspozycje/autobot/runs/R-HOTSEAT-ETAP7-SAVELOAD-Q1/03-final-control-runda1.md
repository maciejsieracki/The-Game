# R-HOTSEAT-ETAP7-SAVELOAD-Q1 — Final Control, runda 1

Niezależna weryfikacja, wszystko uruchomione osobiście w worktree na commicie `c42f6aff`.

1. **Diff vs baza `eadb3d44`**: `git diff --stat eadb3d44..HEAD` — dokładnie allowlista:
   `gra/src/game/save.ts`, `gra/src/main.ts`, nowy `gra/tools/hotseat-etap7-saveload-test.cjs`,
   artefakty runu (dispatch/operator/evaluator + 2 PNG). Zero plików spoza allowlisty.
2. **Bramki, osobiste uruchomienie**: `tsc --noEmit` 0 błędów; logic 213/213; tech-tree
   19/19; research 33/33; unit-replace 13/13; combat 6/6; nowa bramka
   `hotseat-etap7-saveload-test.cjs` 59/59 — wszystkie zgodne z raportami.
3. **Przeczytany osobiście cały diff `save.ts`/`main.ts`**: `SAVE_VERSION` 2→3;
   `IncompatibleSaveFormatError` odróżnialny, próg `if (ver < 3) throw ...` PRZED
   destrukturyzacją `obj2.gracze`/`exploredByHuman` (zapobiega cichemu `undefined`);
   zero identyfikatorów migracyjnych (potwierdzone też negatywnymi asercjami bramki).
   `restoreGameFromSave`: alias gracza 0 zachowany przez mutację (`explored.clear()+add`,
   `player` mutowany in-place), pozostali właściciele dostają nowy `Set`/`PlayerState` —
   zgodne z projektem recon §2. Kolejność w `catch`: `openStartupMainMenu()` PRZED
   `showHintMessage(e.message, 6000)`, wzorzec N-ZINDEX-TOAST. `loadFromLocal(slot, opts)`
   domyślnie nie rzuca (zachowanie `summarizeSaveSlots()` niezmienione) — rethrow tylko
   przy jawnej fladze z `loadGameFromSlot`. ABC-4 spełnione co do litery.
4. **Oba dowody PNG obejrzane**: `zrzut-...komunikat-stary-format.png` pokazuje realny
   toast nad menu startowym z dokładnym tekstem z kodu ("Ten zapis pochodzi ze starszej
   wersji gry (v2)..."); `zrzut-...roundtrip-po-wczytaniu.png` pokazuje niepusty stan po
   wczytaniu (Nauka 725, miasta Ardea/Lanuvium, tura 1) — realny render, nie deklaracja.
5. **Dwa kolateralne FAIL uruchomione osobiście**: `barb-camp-blacklist-test.cjs` —
   crashuje `IncompatibleSaveFormatError: ... (v1)` dokładnie jak zgłoszono, fixture
   `wersja:1`, poza allowlistą tego tematu. `fsa-autosave-test.cjs` — `53 pass, 2 fail`,
   przyczyna `IncompatibleSaveFormatError` na fixturze `wersja:2` w pliku FSA na dysku,
   złapana wewnętrznie przez `loadFsaAutosaveFile` (zwraca `null`, zgodnie z jego własnym
   kontraktem „nigdy nie rzuca") — to NIE jest regres logiki zapisu, to fixture sprzed
   bumpu SAVE_VERSION. `load-fail-toast-zindex-test.cjs`: 14/15, 1 FAIL potwierdzony
   pre-istniejący i niezwiązany (formuła z-index z innego, już zintegrowanego tematu) —
   plik poza allowlistą, nietknięty tym diffem. Oba kolateralne MUSZĄ trafić do
   `REJESTR-PROSB-I-ZADAN.md` jako jawny follow-up przy integracji (nie są jeszcze
   wpisane w bazowym `main`) — do wykonania przez orkiestratora, nie naprawiać teraz.
6. **Nakładanie z równoległymi lanami**: `wt-hotseat-etap6e-render` ma niescommitowane
   hunki `main.ts` w liniach 2444-2502/3437-3473/5379-5394/7986-8112/11752-11887/
   17787-17812 — poza regionem `buildSaveGameSnapshot`(28308)/`restoreGameFromSave`
   (35682)/`loadGameFromSlot`(35513). `wt-hotseat-etap6d-diplomacy-engine` — drzewo
   czyste, zero diffu. Zero nakładania potwierdzone.

Ślad kompletny: dispatch→Operator (PASS-WITH-NOTES)→Evaluator (zero zarzutów, lista
pusta → bezpośrednio Final Control zgodnie z §3c pkt 1). GOAL identyczny w trzech
raportach. Licznik rund 1/5, bez cichego resetu.

STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP7-SAVELOAD-Q1
GOAL: Format zapisu v3 (gracze[]/exploredByHuman/humanOwnerIds/activeHumanOwnerId), BEZ
migracji v2→v3, czytelny IncompatibleSaveFormatError dla starego formatu (ABC-4).
ZMIANY/COMMIT: `gra/src/game/save.ts`, `gra/src/main.ts`, nowy
`gra/tools/hotseat-etap7-saveload-test.cjs`; HEAD worktree `c42f6aff`.
TESTY: tsc 0 błędów; 5/5 bramek referencyjnych zielone; nowa bramka 59/59; oba żywe
dowody Chromium potwierdzone osobiście.
BLOKADY: brak dla tego tematu. Follow-up wymagany przy integracji: zarejestrować w
REJESTR bump fixture'ów `tools/barb-camp-blacklist-test.cjs` i `tools/fsa-autosave-test.cjs`
(wersja:1/2→3), poza allowlistą tej rundy. 1 pre-istniejący FAIL
`load-fail-toast-zindex-test.cjs` niezwiązany.
RUNDY: 1/5
GOTOWOŚĆ DO INTEGRACJI: TAK.
NASTĘPNY KROK: integracja allowlist-only przez orkiestratora + wpis follow-up do
REJESTR-PROSB-I-ZADAN.md dla dwóch fixture'ów.
DEPLOY/PUSH: NIE WYKONANO
