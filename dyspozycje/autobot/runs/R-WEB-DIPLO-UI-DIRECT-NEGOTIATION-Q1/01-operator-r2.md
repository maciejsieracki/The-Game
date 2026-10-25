STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-UI-DIRECT-NEGOTIATION-Q1
GOAL: Klik cywilizacji na liście dyplomacji otwiera od razu negocjacje/audiencję (bez pośredniego dymka). Wojny, sojusze i handel widoczne na karcie cywilizacji na liście.
ZMIANY/COMMIT: baza odtworzona z commita Operatora r1 `35b87fe0` (detached HEAD). Commit r2 (SHA w odpowiedzi Operatora i w `git log`). Allowlista r2:
- `gra/src/main.ts`: TYLKO hak testowy `__audienceRelTestDebug.setupListRelationsFixture` (kontakty 2..5 + wojna / sojusz wojskowy / umowa szlaków / pakt wyłącznie z ME()). Logika UI bez zmian względem r1.
- `gra/tools/diplomacy-direct-negotiation-live-test.cjs`: asercje dokładnych wierszy (Chińczycy „Wojny: Grecy, Ty”, Inkowie „Sojusze: Grecy, Ty”, Egipt „Handel: Grecy, Ty”, Zulusi 3 x „brak”), liczba kart = liczba kontaktów (mgła wojny), sekcja 360 px (brak przewijania poziomego, wiersze w karcie), zrzut `lista-karta-relacje-360px.png`.
- `gra/tools/diplomacy-lista-podglad-przed-wizyta-test.cjs`: nowa część 5b (źródło kontaktów listy = źródło audiencji, 3 asercje).
- `gra/tools/hotseat-etap6d-podetap-b-live-test.cjs`: w scenariuszu ZEPSUTY klik karty pomijany, gdy brak wierszy listy (zamiast wyjątku Playwright po 30 s).
- `dyspozycje/autobot/runs/R-WEB-DIPLO-UI-DIRECT-NEGOTIATION-Q1/01-operator-r2.md` (ten plik), `evidence/lista-karta-relacje-360px.png`.
- Bez `WERSJE.md`, `rust-port/**`, `test-hook.ts`. Bez `git add -A`. Bez push.

TESTY (commit r2 / stan roboczy po poprawkach):
- `tsc --noEmit`: OK (exit 0), po dodaniu haka testowego.
- `logic-test`: 213/213.
- `endturn-battle-deadlock-test`: 38 pass / 0 fail. `endturn-battle-deadlock-exec-test`: 46 pass / 0 fail.
- `load-game-regression-test`: 34 PASS / 0 FAIL.
- `diplomacy-test`: 148 passed / 0 failed.
- `diplomacy-lista-podglad-przed-wizyta-test`: 52 pass / 1 fail. Jedyna czerwień: 6e (`id===0 ||` vs `isMe(id) ||`). Potwierdzone jako ZASTANA: w `d49c21c6` main.ts:6931 ma `isMe(id) ||` (ta sama linia w `35b87fe0` main.ts:6950). Nie regresja.
- Mutacja „przywróć dymek” w `onSelectEntry` (przywrócono `showDiploPairSummary`, potem `git checkout` pliku): guard 7b, 7c, 7d CZERWIENIE (46 pass / 4 fail). Przywrócono plik, `git diff` czysty.
- `diplomacy-direct-negotiation-live-test` (Chromium, prawdziwy bundle w katalogu tymczasowym poza repo, finalny przebieg r2): 15 pass / 0 fail, 0 pageerror. Obejmuje: klik karty → audiencja, brak `.civ-diplo-pair-summary`, wiersze Wojny/Sojusze/Handel dokładnie wg wstrzykniętego stanu, liczba kart = liczba kontaktów, 360 px (brak przewijania poziomego, wiersze w karcie), konsola czysta.
- `hotseat-etap6d-podetap-b-live-test` (r3, po poprawce ZEPSUTY): część PO: WSZYSTKIE asercje OK (PO.0, PO.1, PO.1b, PO.2, PO.3 x2, E0). Część ZEPSUTY: ZEPSUTY.1/.1b/.3 i MUT.3/MUT.4 CZERWIENIE (oczekiwane dla mutanta ME()=>99, ale asercje „MUSI CZERWIENIEĆ” nie wszystkie trafiają w oczekiwany tekst; to część testu sprzed tej zmiany, nie tkniętą poprawką).
- Baseline `d49c21c6` (ten sam skrypt, wyeksportowane źródła `git archive`): część PO OK (stare asercje: pop-up, audiencja z pop-upu); część ZEPSUTY przerywa się wyjątkiem Playwright na kliku `.dl-item` (ten sam wiersz co w r2, linia 186 w bazie). Wniosek: mutant-sekcja była czerwona/przerywana również na bazie. Zawieszenie na `[data-act="diplo"]` z r1 NIE odtworzyło się ani na bazie, ani na r2 (przebieg r2 i baseline przeszły krok otwarcia listy) — był to efekt obciążenia hosta (load avg ~45 na 4 rdzeniach, cudze procesy symulacji).
- Nie uruchomiono ponownie `diplomacy-relacje-ai-ai-audiencja-live-test` (r1: 19/0) ani `diplomacy-audience-close-flush-test` (r1: A4, A4f czerwone, znane). Zmiana r2 w main.ts to wyłącznie dodatkowa metoda w obiekcie `__audienceRelTestDebug`; nie zmienia ścieżek, na których te testy stoją.
- Sprzątanie: symlink `gra/node_modules` (do cudzego worktree, tylko do odczytu) wskazuje poza repo i jest ignorowany przez `gra/.gitignore`; do usunięcia przed zamknięciem. Katalogi tymczasowe w scratchpadzie.

ODPOWIEDZI NA ZARZUTY FC/EVALUATORA (runda 1):
1. (brak toastu z powodem) ODRZUCAM z dowodem. Karty listy budowane są z `buildPlayerDiploRelations`, które iteruje `getDiplomaticContacts()`. Stan audiencji (`openDiplomacyAudience.getState`) zwraca null wyłącznie dla `!contacted.has(ownerId)` — ten sam zbiór. Więc klik karty z listy zawsze ma stan. Powody niedostępnych akcji (np. wojna blokująca, zamknięte okno) pokazuje już sama audiencja: `audienceActionBarLockNote` w pasku akcji. Dowód: test 5b-1..3 (guard, zielony) + asercja „liczba kart = liczba kontaktów”.
2. (test live bez wojny/sojuszu/handlu, bez mgły) PRZYJMUJĘ. Dodano hak `setupListRelationsFixture` i asercje dokładnych wierszy dla wojny, sojuszu, handlu i paktu (Chromium, zielone w przebiegu r2). Mgła wojny: asercja „liczba kart = liczba kontaktów” (niespotkane cywilizacje nie trafiają na listę). Nie dowodzę po nazwie konkretnej niespotkanej cywilizacji — dowód jest zbiorczy.
3. (brak mobile 360 px) PRZYJMUJĘ. Asercje: brak poziomego przewijania strony, wiersze relacji w granicach karty przy `innerWidth=360`; zrzut `evidence/lista-karta-relacje-360px.png`. UWAGA (NOTA, nie naprawiona w tym temacie): na zrzucie 360 px lista jest pełnym panelem; kontrolka zoomu mapy (dolny lewy róg, `-  100%  +`) leży NAD listą i zasłania fragment pierwszej karty, w tym wiersz „Wojny”. Wiersze są w DOM (asercje zielone), ale na tej szerokości nie są w pełni widoczne. Overlay mapy nad panelem listy jest wzorcem istniejącym przed tym tematem (zasłania też dawne linie karty); naprawa wymaga zmiany z-index/układu HUD mapy — poza allowlistą tego tematu, zgłoszona do FC.
4. (hotseat nie przeszedł) PRZYJMUJĘ z dowodem. Zawieszenie z r1 nie odtworzyło się (r2, r3 i baseline przeszły krok listy); przyczyna: obciążenie hosta. Część PO testu (zmienione asercje 1b, 2, 3) — zielona. Część ZEPSUTY — czerwona także na bazie (przerwanie wyjątkiem); poprawka r3 zamienia przerwanie na czerwone asercje; pełne zazielenienie sekcji mutanta wymaga przeprojektowania (poza zakresem tego tematu) — zgłoszone jako NOTA dla FC.
5. (brak dowodu mutacji) PRZYJMUJĘ z dowodem: mutacja guardu → 7b/7c/7d czerwone (patrz wyżej). Mutacja w Chromium nie wykonana (koszt buildu pod obciążeniem); guard source-level pokrywa wymóg „przywrócenie dymka → czerwień”.
6. (brak raportu w runie) PRZYJMUJĘ: ten plik.
7. (gates na końcowym SHA) PRZYJMUJĘ: tsc, logic 213/213, endturn 38/0 + exec 46/0, load-game 34/0, diplomacy 148/0 powtórzone po ostatniej zmianie w `main.ts`.
8. (martwy moduł dymka) PRZYJMUJĘ jako NOTĘ: `showDiploPairSummary` i moduł pop-upu NIE są otwierane przez ścieżkę gracza (lista). Zostają dla hooka `__audienceRelTestDebug.openPairSummary`, używanego przez test relacji AI-AI. Usunięcie modułu = osobny temat.
9. (rozjazd lista vs audiencja) PRZYJMUJĘ jako NOTĘ zamierzoną: karta listy liczy wojny/sojusze/handel z `buildDiploPairSummaryData` (z mgłą wojny, jak dawny dymek); sekcja „Relacje z innymi” w audiencji (R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1) nie stosuje mgły. Różnica jest znana, nie zmieniana w tym temacie.

ZAŁOŻENIA:
- Brak toastu (zarzut 1) — patrz pkt 1 wyżej.
- Nazwy partnerów w karcie = te same dane co w dawnym dymku; mgła wojny jak w dymku.
- Gracz jako „Ty”, zgodnie z dymkiem.

BLOKADY: brak technicznych po zakończeniu sprzątania. Zawieszenie hosta pod obciążeniem wydłużało przebiegi Chromium (nie blokada kodu).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (ponowna weryfikacja r2) i Final Control. Otwarte dla FC: sekcja ZEPSUTY hotseat-testu (czerwona także na bazie).
DEPLOY/PUSH: NIE WYKONANO
