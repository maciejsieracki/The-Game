# R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1 — raport Evaluatora, runda 3/5 (Sonnet 5.5)

STATUS: PASS-WITH-NOTES (zarzuty 1-4 otwarte; Evaluator nie wydaje werdyktu końcowego)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1
GOAL: niezależna ocena kandydata a0e93631b (r3 Operatora: pomiar Z4 i Z2) względem bazy dcf743709 (origin/main).
ZMIANY/COMMIT: `git diff --name-only dcf743709 a0e93631b` = 4 pliki, wszystkie w allowliście (`10-operator-claude.md`, `evidence/entry.ts`, `evidence/sim-respekt-wojna.cjs`, `evidence/wynik-pomiaru.txt`). Zero zmian w gra/src, gra/data, gra/tools, WERSJE.md. Brak zmian w testach, więc nie ma osłabionych testów. Ten raport jest jedynym plikiem dodanym przez Evaluatora.
TESTY (odtworzone przeze mnie na a0e93631b, `npm ci --ignore-scripts` w gra/):
- `npx tsc --noEmit`: exit 0, 0 błędów.
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/tech-tree-test.cjs`: 20 pass, 0 fail.
- `node tools/research-test.cjs`: PASSED 33 / FAILED 0.
- `node tools/unit-replace-test.cjs`: 21/21.
- `node tools/combat-test.cjs`: 6/6.
- Wszystkie 5 bramek referencyjnych i tsc zielone, więc brak długu bazowego do rozróżniania. Nie ma testu tematu (`diplo-respect-power-test.cjs`), bo brak zmian kodu; to zgodne z dispatchem (test tylko jeśli naprawa).
- Dowód mutacyjny: N/A (brak poprawki w src).
- Powtórka symulacji: `node .../evidence/sim-respekt-wojna.cjs` exit 0, wyjście identyczne z `wynik-pomiaru.txt` (diff pusty). Liczby tabel A/B/C są więc odtwarzalne.
BLOKADY: brak stanu żywej gry (nie mam zapisu z Grecy/Chińczycy), więc zarzuty 1-2 nie da się rozstrzygnąć pomiarem po mojej stronie; wskazuję je na podstawie kodu.
RUNDY: 3/5. Zarzuty Z1/Z3/Z5 z r2 poza zakresem.
NASTĘPNY KROK: Obrona Operatora zamyka zarzuty 1-4 pomiarem/korektą raportu (bez zmian w gra/src); potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Co zweryfikowałem jako PRAWDZIWE (ZMIERZONE / sprawdzone w kodzie na dcf743709)
- Z4c: żaden call-site `applyDiploEventTracked` nie przekazuje `wygrana_bitwa` / `przewaga_militarna` / `slabszy_militarnie`. Literały tych zdarzeń występują w gra/src tylko w diplomacy.ts:874-876, 1012-1022 (typ + switch) oraz w etykietach diplomacy-factors.ts:71-73. Zmienne `ev` w main.ts:23031 (`zerwanie_*`) i main.ts:23949 (`zlamana_obietnica*`) nie zawierają zdarzeń militarnych; wieloliniowe 13341, 41017, 42507 to `'wojna_wypowiedziana'`. Jedyny bezpośredni wywołujący `applyDiplomaticEvent` poza main.ts to sama definicja (diplomacy.ts:913). Lista wywołań operatora jest niepełna (brak m.in. 11840, 12071, 12222, 13304, 24062, 28991, 29083, 29151, 29276 — wszystkie literały niemilitarne), ale wniosek jest poprawny.
- Z4b: w wojnie `wiarygodnoscSelf` jest `undefined`, gdy gracz jest w parze (main.ts:23090 buildDiplomacyTickCtxForPair, `atWar || !playerInPair ? wiarygodnoscAiAi : ...`; `wiarygodnoscAiAi` = undefined dla pary z graczem), a `applyWiarygodnoscTempoDoDelty(dZ, undefined)` zwraca dZ bez zmian (diplomacy-credibility.ts:621-625). Dryf od Wiarygodności i mnożnik tempa nie wchodzą w −1,5. Dominuje kara graniczna (diplomacy.json:28-30; sharedBorderPenaltyForEpochs diplomacy.ts:598-607).
- Clamp wojenny: `clampRelationForWar` (diplomacy.ts:1121) tnie Z, potem R do Z+R <= 29 (`WAR_RELATION_SCORE_CAP` diplomacy.ts:1105); tick stosuje go po każdej turze. Sim potwierdza R=29, Z=0 po 30 turach, także po 30 x `wygrana_bitwa`.
- Hipoteza r2 „−2 × spadekMult ≈ 0,75” jest rzeczywiście błędna w wojnie.

## ZARZUTY (do zamknięcia przez Obronę)

### Zarzut 1 (istotny) — wyjaśnienie „29 vs 67” (Z2) opisuje stan sprzed poprawki, a źródło paska jest wskazane błędnie
Raport (sekcja Z2, pkt 2) twierdzi, że pasek „Respekt 29 / 100” czyta ZAPISANY `rel.respekt` (`respekt: rel.respekt ?? 0`, main.ts:25397) i że „panel łączy dwa źródła w jednym ekranie”. Na dcf743709 to nieprawda:
- main.ts:25397 należy do `buildDiplomacyLockContextBase` (bramkowanie akcji), nie do paska.
- Pasek Respekt na audiencji = `st.respekt` = `respektNorm = powerLine.respekt` = `computeRespekt` z mocy EFEKTYWNYCH (main.ts:25604-25605), wyświetlany przez `effectiveNastawienieScores(st.zaufanie, st.respekt)` (diplomacyAudience.ts:1460, 1485). Ta funkcja po ffefa9df7 (R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1, 2026-11-09) zwraca wartości bez clampu (diplomacy-display.ts:337-346).
- `relacjaTotal` = Zaufanie + ten sam LIVE Respekt (main.ts:25365-25369, 25650). Na obecnym main pasek i Relacja używają więc tego samego źródła i NIE mogą dać pary „Respekt 29 + Zaufanie 0 → Relacja 67”.
- Prawdziwe źródło „29” ze zrzutów: przed ffefa9df7 `effectiveNastawienieScores(.., atWar)` w wojnie wołało `clampRelationForWar` na wartościach panelu (git show ffefa9df7 — usunięty blok `if (!atWar) return ...; clampRelationForWar(...)`). Zrzuty właściciela pochodzą więc z wersji sprzed tej poprawki albo z innej ścieżki niż opisana.
- Konsekwencja: konkluzja „rozjazd jest skutkiem reguły limitu wojennego i rozdziału źródeł w UI” jest nieaktualna dla main; rozjazd w audiencji już nie występuje. Raport nie sprawdził daty zrzutów ani wersji, której dotyczą (NIE_ZMIERZONO, a powinno być jawnie zapisane). Wymagane: przepisać Z2, wskazać ffefa9df7 jako zmianę, która usunęła rozjazd, oraz zaznaczyć, że przy aktualnym main bar = 67 (nie 29).

### Zarzut 2 (istotny) — Z2 niezamknięte: 67 vs 89 nadal bez wyjaśnienia
Dispatch (Z2 NAPRAW) wymagał znalezienia źródła 67 vs `computeRespekt(14682,1854)=89` albo potwierdzenia błędu raportu. Raport stwierdza tylko, że wejścia nie są wartościami rankingu i oznacza „NIE_ZMIERZONO”. Nie sprawdzono, czy `objectivePowerForOwnerEffective` (main.ts:2863 i okolice) różni się od liczb rankingu (np. mnożniki trudności/weteran/fortyfikacje, normalizacja), ani czy 14682:1854 to w ogóle moc „objective”. Wynik 67 odpowiada stosunkowi ok. 2:1 po stronie efektywnej, co przeczy 8:1 z rankingu — to wymagało co najmniej policzenia obu stron z kodu na jakimś stanie (headless) albo jawnego „błąd raportu użytkownika/inna metryka”. Z2 pozostaje otwarte. Dodatkowo numery linii w Z2 nie były weryfikowane zgodnie z dispatchem: `computeTickZaufanieDelta` zaczyna się w diplomacy.ts:1779 (raport: 1785-1812), `buildDiplomacyLockContextBase` ok. 25376 (raport: 25377).

### Zarzut 3 (istotny) — skład −1,5/turę jest nieosiągalny dla pary Grecy/Chińczycy w tabeli operatora
Tabela Z4b przypisuje −1,5 do „granica −2 + wspólna religia +0,5” oraz „granica −3 + wspólny wróg +1 + wspólna religia +0,5”. Ale `wspolnaReligia` w ctx wymaga `sameCultureCircle(civKeyA, civKeyB)` (main.ts:23090 ctx; diplomacy-display.ts:216-221, porównanie `typCywilizacji`), a Grecy i Chińczycy to różne okręgi kulturowe (ZMIERZONO: gra/data/civs.json — `typCywilizacji` = „grecy” vs „chinczycy”), więc +0,5 nie wystąpi; przy różnych religiach wystąpi −0,5. Realistyczne składy dające −1,5 dla tej pary to np. granica −2 + wspólny wróg +1 − odmienna religia 0,5 (= −1,5). Operator nie sprawdził tego warunku ani aktywnych flag, a symulacja B ma `wspolnaReligia: true` na sztywno. Wniosek „dominuje karaWspolnaGranica” jest prawdopodobny, ale konkretny skład (i trajektoria B) nie odpowiada parze ze zrzutów. Wymagane: albo odtworzyć flagi dla Grecy–Chińczycy (civKey, religia, wspólny wróg) z kodu/danych, albo oznaczyć tabelę jako ilustracyjną z jawnym NIE_ZMIERZONO dla składu w grze. Dodatkowo `wiarygodnoscSkalaMin/Max` (diplomacy.json:93-94) nie są cytowane w raporcie wbrew dispatchowi; podano tylko `wiarygodnoscTempoAmplituda`.

### Zarzut 4 (mniejszy) — symulacja 30 tur nie odpowiada scenariuszowi „gracz 10x silniejszy”
Trajektoria B nie zawiera żadnego wejścia mocy: `tickDiplomacy` operuje na zapisanym Respekcie (start Z=40, R=30, nie wartości ze zrzutu), a „10x” pojawia się tylko jako osobne `computeRespekt(100,10)=91`. Wynik tabeli (R=29 od tury 1) jest więc skutkiem clampu startowego, nie 30-turową dynamiką przewagi i wygranych bitew. Sekcja C (`applyDiplomaticEvent` w wojnie) jest poprawna jako dowód, że limit zjada przyrosty, ale „dwie cywilizacje, 10x, 30 tur z wygranymi bitwami” nie została odtworzona w silniku gry (tylko w funkcjach czystych). Należy to wyraźnie opisać jako ograniczenie (raport mówi to częściowo w BLOKADZIE 1).

### Uwaga (bez zarzutu numerowanego)
Rekomendacja „jawny komunikat w panelu «limit wojenny 29» zamiast cichego ścięcia” jest już zrealizowana na main (`warRelationCapApplies`, diplomacy-display.ts:349-353, dopisek w diplomacyAudience.ts:1275). Powinna zostać usunięta z rekomendacji lub oznaczona jako istniejąca.

## Kryteria binarne (dispatch + DODATEK)
- Z4a symulacja z trajektoriami w evidence/: SPEŁNIONE formalnie, z zastrzeżeniem zarzutu 3 i 4.
- Z4b źródło −1,5 z diplomacy.json: SPEŁNIONE częściowo (dominacja kary granicznej zmierzona; skład dla pary i skale Wiarygodności — zarzut 3).
- Z4c dowód liniowy dla zdarzeń militarnych: SPEŁNIONE.
- Z2 źródło 67 + poprawne numery linii: NIESPEŁNIONE (zarzuty 1, 2).
- Zakaz zmian w gra/src, WERSJE.md, JSON balansu, push: SPEŁNIONE.
- NIE_ZMIERZONO uczciwie: w większości tak; wyjątek to twierdzenie o źródle paska 29 przedstawione jako zmierzone (zarzut 1).
