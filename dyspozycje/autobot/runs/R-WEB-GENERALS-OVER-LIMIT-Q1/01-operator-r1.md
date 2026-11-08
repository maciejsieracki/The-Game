STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-GENERALS-OVER-LIMIT-Q1
GOAL: liczba zywych jednostek z `isGeneral` nigdy nie przekracza `generalLimitForEra` epoki wlasciciela; nadmiar ze starych zapisow tracony tylko jako flaga (nic nie ginie).

PRZYCZYNA (udowodniona modelem + analiza kodu, baza 9b019a7d8):
- Zakup wodza jest bramkowany poprawnie (`purchaseRecruitmentUnit` main.ts:4325-4342 -> `attemptGeneralPurchase` -> `canRecruitGeneral`, zlicza zywych + zakolejkowanych we WSZYSTKICH miastach wlasciciela). Hipotezy (a) skroty/panel imperium/zmiana ilosci/AI: kazda sciezka konczy sie w tej samej bramce (29253, 42491, 7319, 7433 wolaja `purchaseRecruitmentUnit`; ilosc != 1 odrzucana) -- NIE przeciekaja.
- Wyciek: pozycja `isGeneral` w `cityProd.rekrutacja` PRZECHODZI Z MIASTEM przy zmianie wlasciciela (podboj/kapitulacja: main.ts ~16698, cesja ~34528 "kolejka przechodzi", aneksja ~33362, odbicie zbuntowanego miasta ~37566). Slot zarezerwowany przez poprzedniego wlasciciela znika, a miejsce narodzin jednostki (main.ts:4284 i 37830) kopiowalo `isGeneral` z kolejki BEZ ponownego sprawdzenia limitu -> zdobywca dostaje dodatkowego wodza ponad swoj limit; poprzedni wlasciciel ma zwolniony slot i kupuje nastepnego. To tlumaczy "generuje sie wiecej" bez zadnego dodatkowego zakupu gracza (AI kupuje wodza w stolicy co turze: shouldAiBuyGeneral).
- Drugi wyciek: stare zapisy z nadmiarem nie byly korygowane przy wczytaniu.
- Wykluczone (kod): `{...tpl}` w main.ts 25841/26562/27825 to haki testowe, produkcyjne `units.push` (10398, 23439/23474, 30160, 41009) nie kopiuja isGeneral; `armyMerge.ts` tylko czyta flage; epoka nie spada (hipoteza c). Nie mierzono live (brak Chromium w srodowisku).

POPRAWKA:
- `gra/src/game/generals.ts`: `canSpawnQueuedGeneral(era, aliveGenerals)` (bramka narodzin) + `planGeneralLimitDemotions(roster, eraForOwner)` (migracja; zasada: dla kazdego wlasciciela zostaja NAJSTARSI wodzowie wg kolejnosci tablicy = kolejnosci narodzin, mlodsi ponad limit epoki -> zwykla jednostka tego samego typu).
- `gra/src/main.ts`: `generalMaySpawnForOwner(ownerId)`; oba miejsca narodzin z kolejki: `isGeneral: x.isGeneral === true && generalMaySpawnForOwner(city.ownerId)` (jednostka powstaje zawsze, nic nie przepada); migracja po wczytaniu zapisu (po sanityzacji cityProd) demotuje nadmiar.

ZMIANY/COMMIT: allowlista: gra/src/game/generals.ts, gra/src/main.ts, gra/tools/generals-limit-invariant-test.cjs (nowy), ten raport. Commit: patrz SHA w odpowiedzi orkiestratora/`git log` brancha (SHA nie moze byc w pliku, ktory jest czescia tego commita). Baza: origin/main 9b019a7d8. Uwaga: worktree wystartowal z niezacommitowanymi zmianami generals.ts/main.ts (wczesniejsza praca nad tym tematem); zweryfikowalem je w calosci niezaleznie, zakres zgodny z allowlista.

TESTY (logi gate-*.txt z EXIT= w katalogu scratchpad operatora):
- NOWY `node tools/generals-limit-invariant-test.cjs`: na poprawce 23/23 PASS, EXIT=0.
- Scenariusze: S1 zdobycie miasta z wodzem w kolejce (BAZA lamie: 3 wodzow w limicie 2); S2 dwie kapitulacje naraz (BAZA lamie: 4/2); S3 zakup w 4 miastach w jednej turze (kontrola: bramka zakupu trzyma juz na bazie, 2 z 4); S4 zakup + zmiana epoki (kontrola, Kamien 1 -> Braz 2); S5 zapis/wczytanie ze starym nadmiarem 3 -> 2 (BAZA lamie; wybor najstarszych; liczba jednostek bez zmian); S6 idempotencja migracji.
- Test na BAZIE (stare generals.ts + main.ts): 10 FAIL (EXIT=1). Mutacja (cofniecie jednego guardu narodzin w main.ts na poprawce): 2 FAIL (straznik zrodla) -> mutacja lamie test.
- `tsc --noEmit`: EXIT=0.
- `logic-test`: 213/213 OK. `ai-test`: 274 passed / 20 failed = identycznie jak baza.
- general-eligible-unit-roster, ai-army-all-civs-general-muster, ai-general-war-campaign, army-leadership, recruitment-batch-contract, recruit-rally-default-save: EXIT=0.

BLOKADY / NIE_ZMIERZONO:
- army-stack-commander-identity-test: INFRA (brak chromium /usr/bin/chromium) -- NIE_ZMIERZONO. Pozostale testy przegladarkowe (empire-recruit-*, army-panel-*) nie uruchamiane z tego samego powodu.
- Test niezmiennika jest modelowy (prawdziwe funkcje generals.ts + straznik zrodla main.ts), nie sterowanie realnym main.ts w przegladarce; brak dowodu live. Do rozwazenia przez Evaluatora/FC: test live w Chromium na srodowisku z przegladarka.
- Osierocona pozycja kolejki wodza po zdobyciu miasta nadal blokuje slot zdobywcy (liczy sie jako `queued`) do narodzin; powstaje wtedy zwykla jednostka. Swiadome zalozenie (minimalna zmiana, nic nie przepada).
- Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, gra/data, gra/src/render. Build/dev nie uruchamiane; node_modules usuniete.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet 5.5) -- niezalezna weryfikacja przyczyny i bramek.
DEPLOY/PUSH: NIE WYKONANO
