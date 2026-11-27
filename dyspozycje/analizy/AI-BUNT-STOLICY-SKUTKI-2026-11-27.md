# AI-BUNT-STOLICY — skutki buntu stolicy AI przy ≥ 2 miastach (R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1, tag CAPREBEL)

Data: 2026-11-27. Baza kodu: `659e2d01c` (origin/main). Runda 2/5 (obrona Operatora po FC c26d0bf58; Operator HAIKU 5.5).
Surowe dane (`dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1/dane/`):
- `capital-s4242-5t-buntu-max.txt` — bunt wymuszony, 5 tur po buncie, wygrana włączona (runda 2).
- `capital-s4242-5t-kontrola-max.txt` — ten sam start BEZ buntu, kontrafaktyk do skarbca (runda 2).
- `capital-s4242-3t.txt` — pierwszy bieg rundy 1 (3 tury, wygrana wyłączona; zostawiony dla historii).

Raporty: `dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1/10-operator-claude.md` (runda 1), `30-obrona-claude.md` (runda 2).

## Ustawienia maksymalne (runda 2)

Poziom MAKSYMALNY nowej gry, potwierdzony odczytem `__settingsLive.getSettings()` w obu biegach:
`difficulty: hard` (Trudny), `kulturaReligiaLevel` i `kulturaReligiaLevelAI: trudny`, `kosztJednostekPace: wysoki` (×4), `diplomacyWarLevel: trudna`, `wzrostSurowcowZEpoka: true` (ON).

Uzasadnienie „maksimum” dla flagi wzrostu surowców: ustawienie ma dwa stany (WYŁ./ON, `newGameFlow.ts` ~1903–1908). Stan ON daje wyższą produkcję, więc jest poziomem maksymalnym. W rundzie 1 był błędnie WYŁ. (poprawione). Nie ma innego poziomu tego ustawienia do porównania.

Start przez `__settingsLive.startNewGame` (realny `doStartGame`). Zwycięstwo WŁĄCZONE: runner nie wywołuje już `disableVictoryCheckForTest` ani `suppressVictoryForTest`.

## Tabela skutków

| Pozycja | Skutek | Z kodu | Zmierzone żywo | OCENA |
|---|---|---|---|---|
| (a) Nowa stolica | Po buncie stolicy AI `capitalCityIdForOwner` (`main.ts` ~40154–40158) nie znajduje jawnego wpisu, więc spada na `oldestCityOfOwner`. | Bunt (`transferCityToRebelFactionWithLedger`, `main.ts` ~41815–41821) zmienia tylko `ownerId`. Nie woła relokacji ani nie czyści mapy. | Bieg buntu: tura 1 stolica city16 (miasta city16, city17). Tury 2–6 stolica **city17**, miasta właściciela [city17], city16 należy do −99. Jawny wpis `explicitCapitalOf` = null we wszystkich wierszach. | ZAMIERZONE wg komentarza kodu (fallback). Sukcesja inna niż przy podboju — patrz (a2). |
| (a2) Sukcesja: bunt vs podbój | Podbój stolicy uruchamia relokację i wpis jawny (`maybeRelocateThreatenedAiCapital`, `main.ts` ~40332, zapis ~40370; `runCapitalCapturePlunder`, zapis/kasowanie ~40788–40790). Bunt ich nie wywołuje. | Kod: różnica potwierdzona przez odczyt wywołań. | Zmierzono tylko ścieżkę buntu (nowa stolica = najstarsze pozostałe miasto; bez wyboru). Ścieżka podboju NIE ZMIERZONO w tym temacie. | PODEJRZANE — decyzja gry (patrz „Pytanie”). Ryzyko: jawny wpis zostaje po buncie i po odbiciu miasta wraca stara stolica (ścieżka kodu, NIE ZMIERZONO — brak scenariusza odbicia). |
| (b) Pałac/budynki stołeczne | Budynki są przypisane do ID miasta (`cityBuilt`) i przechodzą razem z miastem do rebeliantów. | Kod: brak usuwania budynków przy buncie. | `buildingsOf` = [] w obu biegach (żadne miasto nie zbudowało budynku przez 5–6 tur, bez zapisu stanu gry). | NIE ZMIERZONO — brak budynków w biegu. |
| (b) Mennica | Mennica liczy się z AKTUALNEJ stolicy (`turn-economy.ts` ~298, `cityPanel.ts`). Po buncie właściciel traci bonus Mennicy, dopóki nowa stolica nie ma Mennicy. | Kod: zgodne z R-WEB-MINT-CAPITAL-ONLY-Q1. | Mennica nie powstała naturalnie w żadnym wierszu (`mennicaAnyCities` = [], `mennicaWCapitalOwner` = false). Budowa Mennicy wymaga hooka zapisu, którego nie ma w allowliście rundy. | NIE ZMIERZONO (próba naturalnego powstania: 2 biegi po 5 tur, bez wyniku). Do zrobienia po zgodzie na hak zapisu. |
| (c) Efekty stolicy w ekonomii tury (MINTDEBT / FALA 920) | Korupcja i efekty stolicy liczone wg AKTUALNEJ stolicy (`capitalCityIdForOwner`, `turn-economy.ts` ~267, `society-inputs.ts` `stolicaEasyBonusActive`). | Kod: przełączenie w tej samej turze. | Skarbiec właściciela 13, bunt: t1 0 → t2 16 → t3 17 → t4 18 → t5 19 → t6 22. Kontrola (bez buntu): t1 0 → t2 9 → t3 5 → t4 88 → t5 63 → t6 72. Trajektorie rozchodzą się od tury 2 (wymuszenie zmienia dalszy bieg AI), więc nie wyodrębniają efektu stolicy. Korupcji nie odczytano. | NIE ZMIERZONO (wyodrębnienie niemożliwe z 1 ziarna; brak pomiaru korupcji). |
| (d) Zwycięstwo / eliminacja | Eliminacja przy 0 miastach (`eliminateOwner`, `main.ts` ~40513). Właściciel z 1 miastem nie jest eliminowany. | Kod: zgodne. | Zwycięstwo WŁĄCZONE. `gameOver` = false (odczyt `__defeatTestDebug.isGameOver`, `main.ts` ~31697) we wszystkich wierszach obu biegów; `ownerEliminated` = false; tury kończą się normalnie. | ZMIERZONO (6 tur po buncie, seed 4242). Wpis dla gracza o buncie AI: patrz AIREBELVER/AIREBELNEWS (nie w tym pomiarze). |
| (e) Crash / pageerror / zawieszenie tury | — | — | Bieg buntu: 6 wierszy, `errors` = []. Bieg kontrolny: 6 wierszy, `errors` = []. | ZMIERZONO do tury 6. Dłuższe biegi NIE ZMIERZONO. |
| (f) Dyplomacja: relacja z rebeliantami | `getDiploRelation(owner, −99)` (`main.ts` ~11206). Specjalny przypadek tylko dla barbarzyńców (`isBarbarian` = `ownerId === BARBARIAN_OWNER_ID`, `barbarians.ts` ~54). | Kod: −99 to `REBEL_FACTION_OWNER_ID` (`society-breakdown.ts` ~232), czyli ID właściciela frakcji, a nie wartość relacji. Dla −99 nie ma reguły rebelianckiej, więc zwraca relację domyślną (neutralną) — zgodnie z kodem. | `relOwnerRebel` = „neutralni” w każdym wierszu obu biegów; `relOwnerPlayer` = „neutralni”. | ZGODNE Z KODEM (relacja neutralna; poprzednie „oczekiwane −99” było błędną interpretacją ID). Wojny AI↔frakcja NIE ZMIERZONO (brak odczytu stanu wojny). |
| (g) Zapis/wczytanie po buncie (round-trip) | Mapa `capitalCityIdByOwner` jest serializowana (`main.ts` ~42791) i odczytywana (~52692–52694). Bunt jej nie czyści. | Kod: zapis i odczyt istnieją. | NIE ZMIERZONO: bieg nie zawierał zapisu/wczytania. W obu biegach wpis jawny dla właściciela był pusty (null), więc round-trip nie dotyczy wpisu. | NIE ZMIERZONO (round-trip wymaga biegu z zapisem). |

## Co dokładnie zmierzono

- Runner `gra/tools/caprebel-capital-live.cjs` (runda 2): wygrana włączona, maksimum (w tym `wzrostSurowcowZEpoka: true`), odczyty: stolica (fallback i jawna), miasta, skarbiec, budynki, Mennica, eliminacja, `gameOver`, relacje. Tryb `--control 1` = ten sam start bez wymuszenia buntu.
- Kandydaci AI z ≥ 2 miastami w t1 (seed 4242): [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37]; wybrany owner 13.
- Hak `__capRebelReadTestDebug` w `gra/src/main.ts` (odczyt, bez zapisu stanu gry): rundy 1 i 2 dodały `treasuryOf` (`ownerTreasury`) i `explicitCapitalOf` (`capitalCityIdByOwner.get`).
- Wymuszenie buntu: `__rebelNotifyTestDebug.forceRevoltEligible(city16)` (próg buntu skrajnego 14% → 95%, grace 0), jak w AIREBELVER.
- Bramki po zmianie hooka: `tsc --noEmit` exit 0; `ai-city-rebellion-gate-test` PASS=37 FAIL=0; `ai-city-rebellion-news-test` PASS 24/0; `logic-test` LOGIC OK (213/213); `ai-test` 297 passed 0 failed; `combat-test` 6/6; `unit-replace-test` 21/21 (wszystkie w tej rundzie, exit 0).

## Wnioski ostrożne

1. Bunt stolicy AI przy 2 miastach: stolica przechodzi na najstarsze pozostałe miasto (city17), właściciel żyje z 1 miastem, zwycięstwo nie jest wyzwalane (ZMIERZONO, 6 tur, seed 4242, poziom maksymalny).
2. Sukcesja po buncie różni się od sukcesji po podboju (kod, a2). Nowa stolica jest wybierana automatycznie, bez relokacji. Ryzyko odbicia miasta ze starym wpisem jawnym jest opisane w kodzie, nie zmierzone.
3. Efekty ekonomiczne (Mennica, skarbiec, korupcja) nie są wyodrębnione. Wynik z 1 ziarna jest zbyt szumowy (skarbiec skacze niezależnie od buntu), a Mennicy nie udało się zbudować bez hooka zapisu.
4. Relacja z rebeliantami jest neutralna zgodnie z kodem. To nie jest rozbieżność.

## Pytanie do właściciela (nie blokuje zamknięcia pomiaru)

DECISION_REQUIRED (gra, wariant wg skutku dla gracza): po buncie stolicy AI nowa stolica to dziś najstarsze pozostałe miasto bez wyboru.
- A: zostaje jak jest — AI wybiera nową stolicę automatycznie (najstarsze miasto). Gracz widzi to w grze tylko przez zmianę miejsca stolicy AI.
- B: jak przy podboju — AI relokuje stolicę (wpis jawny) przy zachowaniu wiarygodności wyboru; po odbiciu miasta stolica nie wraca do starego miasta.
- C: po buncie stolicy AI bez nowej stolicy przez N tur (AI traci efekty stolicy aż do wyboru).
Konsekwencja implementacyjna: A = brak zmian; B = zmiana w `maybeRelocate`/bunt, testy sukcesji; C = nowy stan i testy ekonomii tury.

## Otwarte (NIE ZMIERZONO)

- (b) Mennica i Pałac: wymaga hooka zapisu (budowa) poza allowlistą tej rundy — propozycja osobnego tematu z hakiem civTest (zapis tylko w bloku testowym).
- (c) Korupcja i skarbiec z wyodrębnieniem efektu stolicy: wymaga wielu ziaren albo hooka pomiaru korupcji.
- (g) Zapis przed buntem i wczytanie po buncie.
- Ścieżka podboju stolicy i odbicie miasta (ryzyko starego wpisu jawnego).
- Wojny AI↔frakcja.
- Dłuższe biegi (>6 tur).
