# Cel AutoBot: doprowadzić każdy otwarty błąd do etapu 11

**Cel:** Każdy zarejestrowany, nadal otwarty błąd ma dojść do etapu 11: niezależny cykl
Operatora → Evaluatora → Obrony, jeśli są konkretne zarzuty → Final Control → integracja
do `main` → deploy do Roboczej → `git push` i odczyt potwierdzający. Nie przedstawiam
etapu jako aktywnego bez żywego operatora lub konkretnego, wykonywanego zadania.

## Skala postępu

1. Zarejestrowany temat, zakres i kryteria końca zapisane w runie.
2. Operator uruchomiony, baza i zakres sprawdzone.
3. Przyczyna błędu odtworzona albo ograniczenie diagnostyczne zapisane.
4. Poprawka przygotowana i testy Operatora wykonane.
5. Niezależny Evaluator zakończył sprawdzenie.
6. Operator odpowiedział na konkretne uwagi Evaluatora (jeśli wystąpiły).
7. Obrona zamknięta; niezależna kontrola może przejść dalej.
8. Final Control zakończony wynikiem PASS lub jawnie określoną blokadą.
9. Zmiana zintegrowana do `main` i wymagane testy integracyjne zaliczone.
10. Deploy do Roboczej wykonany i sprawdzony.
11. `git push` potwierdzony przez zdalny odczyt oraz run/rejestr zaktualizowane.

Etap jest ostatnim potwierdzonym przejściem, nie oceną procentową. Gdy brak wymaganego
artefaktu lub działającego procesu, temat otrzymuje status **WSTRZYMANY/BLOCKED** oraz
przyczynę; numer etapu nie rośnie na podstawie samego planu. Po każdym raporcie
orkiestrator odczytuje runy, status operatorów, commity i testy, a następnie uruchamia
kwalifikowany następny etap bez czekania na kolejne ponaglenie.

## Bieżące otwarte tematy

| ID | Temat | Etap | Operator / stan | Następny krok |
|---|---|---:|---|---|
| `R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1` | Atak: łucznicy omijają szyk zamiast podejść do zasięgu i strzelać | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned GitHub Raw readback zgodny; `80-deploy-and-push.md` | Zamknięte; ograniczenie pełnej macierzy pozostało udokumentowane przez FC |
| `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1` | Ręczne rozkazy dla dużej armii i kolejne cykle rozkazów | **11/11 PASS-WITH-NOTES** | R3 live Chromium 28v28: kolejka 28/28→0, subset move w następnym cyklu, exact attack HP 80→62. Attack-march wydano przy aktorze eligible; nowy cios zarejestrował rout celu, a naturalna aktywacja kolejnej rundy przesunęła jednostkę o 1 heks ku waypointowi (4→3), rozkaz zachowany. Evaluator PASS-WITH-NOTES, Obrona PASS, Final Control PASS-WITH-NOTES; typecheck i regresje PASS. Brak nowej zmiany produktu; Robocza już zawiera ten sam `battleScene.ts`. | Zamknięte i wypchnięte; szczegóły oraz ograniczenie exact-target fixture: `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1/50-final-control-after-queue-release.md`; trace: `evidence/live-multicycle-r3/execution-trace.json` |
| `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1` | Usunąć stare ID z kolejki po aktywacji, by kolejne rozkazy podzbioru działały | 11/11 PASS-WITH-NOTES — zamknięte | Produkt commit `96d088b4`, release commit `87aa8678`, oba w `origin/main`. Robocza smoke `SMOKE OK`, `VERIFY OK`; pinned GitHub Raw bundle i pole bitwy zwróciły SHA-256 zgodne z lokalnym buildem, zdalny manifest potwierdził MD5 i rozmiary; `git ls-remote` potwierdził push `87aa8678`. 28v28/15 assertions; nie twierdzi to nic o limicie 120. Ograniczenie: brak wykazanego drugiego ruchu w 60 s nie dowodzi niemożliwości overlapu w każdej konfiguracji. Pełny receipt: `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1/80-deploy-and-push.md`. | Zamknięte w zakresie lifecycle kolejki; szerokie sterowanie armią pozostaje osobnym otwartym tematem |
| `R-BITWA-DEAD-UNIT-DISAPPEARS-Q1` | Jednostka zabita w bitwie znika z pola, routowana nadal ucieka | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned readback hash/size zgodny; `80-deploy-and-push.md` | Zamknięte |
| `R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1` | Piechota w ręcznym Ataku ma wykonać atak po dojściu do zwarcia | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned readback hash/size zgodny; `80-deploy-and-push.md` | Zamknięte |
| `R-BITWA-ATAK-MARSZEM-HEX-Q1` | Rozkaz „atakuj-marszem” ma atakować napotkanych wrogów i kontynuować do wskazanego pustego heksu | 11/11 | Robocza i `origin/main` commit `6b7f40b4`; pinned readback hash/size zgodny; `80-deploy-and-push.md` | Zamknięte |
| `R-AI-KAMPANIA-MARSZ-REKRUTACJA-Q1` | AI ma po pięciu turach zbiórki ruszyć na cel; priorytet ataku morskiego | 11/11 PASS-WITH-NOTES; Robocza/push/readback commit `0e85b438` | R3: po 5 EOT jeden follower rendezvous wstrzymywał główną grupę. Opt-in wyłącznie dla kampanii wodza pozwala jej ruszyć po pięciu turach; zwykły all-in bez flagi nadal czeka. Evaluator i Final Control PASS-WITH-NOTES; live Chromium 28/28, 0 page errors, EOT6 4/4 głównej grupy przemieściły się, follower również rendezvous. Zintegrowane `e84d4328`; kampania 51/51, planner sea priority/tech gate, typecheck PASS. Robocza: MD5 `38218e5327c8ee2979ed70658a238cd1`, SHA-256 `f0fed0bddcf6fc76a6a50e63911504f5786f579f3c728a655404c6ff83fa6b4f`, 70,045,527 B. Pinned Raw bundle/manifest/START HTTP 200; hash/readback zgodny; `git ls-remote` potwierdził push. Live scenario lądowy, bez exact player save; nie jest to live test morski. | Zamknięte w zakresie poprawki i testów; pozostawić notę o braku pełnego testu morskiego |
| `R-AI-FOOD-IMPROVEMENT-PRIORITY-Q1` | AI i auto-budowanie gracza: las przy rzekach → farmy na polach obywateli → hodowla → irygacja/tarasy | 11/11 PASS-WITH-NOTES | Po uwadze Evaluatora etap hodowlany zawiera tylko bydło/owce/lamy; pozostałe jedzenie nie blokuje irygacji/tarasów. Test 11/11, typecheck/build PASS; niezależny Evaluator r2 i Final Control PASS-WITH-NOTES. Produkt `aa540f35`/`cf236daf` jest w źródle release `96d088b4`, opublikowanym jako `87aa8678`; pinned bundle/manifest/readback SHA-256 zgodny, `origin/main` zawiera release. Pełne potwierdzenie `R-AI-FOOD-IMPROVEMENT-PRIORITY-Q1/06-deploy-readback-followup.md`. | Zamknięte; broad baseline failures pozostały jawne, bez nowych regresji |
| `R-IMPROVEMENT-BUILD-HIGHLIGHT-LIFECYCLE-Q1` | Podświetlenie pól ulepszeń +20%; znika po budowie i wraca zgodnie z aktualną kwalifikacją po odznaczeniu | 11/11 PASS-WITH-NOTES | Final Control `3b99ea8d`: lifecycle 39/39, kopalnie 76/76, Chromium 50/50, TypeScript/build 918 modułów PASS. Produktowy commit `f8b31678` ma ten sam stabilny patch-id co `90f26b22` w bieżącym `main`; zawiera on produkcyjny moduł/build hunk. Source commit `96d088b4` (zawierający `90f26b22`) został opublikowany w Roboczej przez `87aa8678`; pinned bundle/manifest/raw readback SHA-256 `2c6e0e44…` PASS, a `origin/main` później przesunął się do `6abc4ed3`. Osobny plik `52-deploy-readback-followup.md` wyjaśnia rozbieżność nazwy kandydata w starszym `51-integration.md`. | Zamknięte; pozostawić obserwowalny receipt i nie otwierać ponownie bez konkretnej regresji |
| `R-NEWGAME-SETTINGS-LAND-DIPLO-REPOSITION-Q1` | W kreatorze „Udział lądu” ma zastąpić „Wojna epoki z udziałem gracza”, a „Rozpatrzenie ofert” ma zastąpić „Trudność miast-państw” | 11/11 PASS-WITH-NOTES; Robocza/push/readback commit `0e85b438` | Operator R3 stage6, niezależny Evaluator PASS-WITH-NOTES, obrona Operatora i Final Control stage8 PASS-WITH-NOTES. Zintegrowano selektywnie jako `c46d6c47`, bez przywracania starych etykiet Bitwy. Layout Chromium potwierdza sloty 5 i 7, persistence i game-start params; tooltip 31/31; typecheck/static PASS. Bundle MD5/SHA/bytes zgodny; pinned Raw bundle/manifest/START HTTP 200 i `git ls-remote` potwierdza push `0e85b438`. Raporty: `12-operator-correction-r3.md`, `16-operator-defense-after-r3.md`, `22-evaluator-r3-current-main.md`, `50-final-control-main-integration.md`, receipt `R-INTEGRATION-SETTINGS-BATTLE-FOOD-20261029/41-ready-subset-release-20261030.json`. | Zamknięte; bez cofania preferencji lub zmiany etykiet trybu bitwy |
| `R-BITWA-LARGE-MIXED-ARMY-SCENARIOS-Q1` | Macierz dużych, mieszanych bitew dla doktryn i ustawień | 11/11 PASS-WITH-NOTES; zamknięte w zakresie headless matrix | Final Control: PASS-WITH-NOTES; harness i run scalone w `0d0367f6`. Main po integracji: typecheck PASS, formacje PASS, doktryny dystansowe/konne 10/10, pełna macierz 36×42×5 i repro 2×42×8 — 0 czerwonych. Deploy gry do Roboczej N/A, bo kod produktu nie zmieniał się; etap 11 push/readback potwierdzony (`origin/main=0d0367f6`; hash Final Control `2437b989…`, macierzy `bc66c2c5…`). Ograniczenie pozostaje jawne: to test headless, nie pełna bitwa 42v42 w Chromium ani test otwierania linii po stratach. | Zamknięte w zweryfikowanym zakresie; ponownie otworzyć tylko przy konkretnym błędzie z żywej bitwy |
| `R-PERF-LARGE-EMPIRE-STRESS-Q1` | Narastający koszt CPU/pamięci w dużej cywilizacji | 3/11 WSTRZYMANY ZGODNIE Z PRIORYTETEM | Ostatni test niekompletny: 38/100 tur; 39. tura 70,205 ms, RSS ok. 1.99 GiB. Celowo brak Operatora teraz, bo właściciel wskazał testy dużej cywilizacji jako ostatni etap po poprawkach pozostałych tematów. | Dopiero gdy inne otwarte zgłoszenia osiągną 11/11: posprzątać stare profile/cache i uruchomić pełne profilowanie seryjnie |

## Tematy zamknięte na etapie 11

| ID | Wynik |
|---|---|
| `R-PROC-AUTOBOT-KANBAN-RETIRED-Q1` | PASS 11/11. Commit `dac5bcc4` na `main`; deploy gry jawnie N/A dla dokumentacji; `git ls-remote` potwierdził push. |
| `R-AI-GENERAL-WAR-5TURN-ATTACK-Q1` | PASS 11/11 dla cyklu wojny: pięć pełnych tur zbiórki, atak w szóstej, ponowne zbieranie po utracie wodza. Chromium 24/24 i logika 31/31; release `c72cd08a` w `origin/main` z odczytem Raw HTTP 200, zgodność SHA-256 i manifestu. Obecny świeży test seedów 981044 pozostaje osobną diagnostyką jakości/scenariusza; nie cofa poprzedniego dowodu ani nie potwierdza nowego defektu produktu. |
| `R-WOJSKO-ARMIA-REKRUTACJA-DO-WODZA-Q1` | PASS 11/11. Przełącznik dobrowolnego marszu po rekrutacji i synchronizacja po EOT; test obserwujących 20/20, release `fb2d613b` w `origin/main`, bundle Raw byte-identical. Uwaga pozostaje jawna: EOT sprawdzono na ścieżce helper/queue, nie pełnym wieloturnowym runtime. |
| `R-ARMY-COMMANDER-UNIT-MARKERS-20261028` | PASS 11/11. Osobna gwiazda wodza/generała nad doświadczeniem i emblemat cywilizacji ×4; test 11/11, Final Control PASS-WITH-NOTES, publikacja `c72cd08a`. Ograniczenie: kompozycję dowodzi harness produkcyjnego `UnitRenderer`, nie pełny zrzut ekranu aktywnej armii na mapie. |
| `R-ARMY-STACK-COMMANDER-IDENTITY-Q1` | PASS 11/11 po zintegrowaniu do `main` i wydaniu `682a6b9a`: tożsamość dowódcy jest przypisana po ID, nazwa jednostki ma etykietę Wódz/Generał, zwykły wojownik tego samego typu nie jest mylony z nim. Kandydat 89 kart Chromium 5/5 i produkcyjny save/deserialize; pozostaje ograniczenie pełnego save/load wieloturówki opisane w raporcie. |
| `R-GENERAL-ELIGIBLE-UNIT-ROSTER-Q1` | PASS 11/11, włączone w wydanie `682a6b9a`: roster wodza według epok i cywilizacji, Wheel-aware rydwan wołów, preferowane rydwany/konnica po technologiach, tymczasowa najlepsza jednostka przed odblokowaniem, wyłączenie klas Dystans/Oblężnicza. Final Control R2: roster 137 checks, purchase test, typecheck PASS; wydanie Roboczej w `70-integrated-release-20261029.md`. |
| `R-ULEPSZENIA-TARTAK-WZGÓRZE-LAS-Q1` | PASS 11/11. Tartak zbudowany na leśnym wzgórzu zachowuje forest overlay i relief; render proof wykazał dekor lasu 3→3 i model na skarpie. Product `b3cc4c5d`, Robocza/release `eb6e0824`, remote readback SHA-256 `5c10865a…`. Run: `R-ULEPSZENIA-TARTAK-WZGÓRZE-LAS-Q1/03-remote-readback.md`. |
| `R-NEWGAME-CIV-PROFILE-COLLAPSE-Q1` | PASS 11/11. Profil cywilizacji zwijany, a nawigacja kreatora zostaje w przypiętym stopce; product `b3cc4c5d`, Robocza/release `eb6e0824`. Należy mówić „parametry cywilizacji”, zgodnie z nazwą wybraną przez właściciela. |
| `R-ARMY-STACK-ICONS-MERGE-PANEL-Q1` / `R-ARMY-MERGE-SPLIT-ICONS-Q2` | PASS 11/11. Rozdzielenie ma strzałki na zewnątrz, łączenie do środka; lista ma własne przewijanie, ograniczenie viewportu i margines przy 150%. Po trzeciej rundzie panel Chromium 26/26 (DPR 1.5, margines ≥27.88 px), ikony 7/7, typecheck/build PASS. Commity `29c98643`, `8d7446db` są w bieżącym `main`; release 2026-10-29 zachował zakres, a późniejszy release na `main` zawiera aktualny artefakt Roboczej. Run panelu `R-ARMY-STACK-ICONS-MERGE-PANEL-Q1/04-integration.md`; ikony `R-ARMY-MERGE-SPLIT-ICONS-Q2/`. |
| `R-HANDLOWA-WYMIANA-CZAS-BEZTERMINOWY-30T-Q1` | PASS 11/11. Cykliczna wymiana zasobu: 1–30 tur albo `Bezterminowo`; inne typy umów bez zmian. Final Control PASS-WITH-NOTES, typecheck, domena 53/53, UI 12/12; release `40189341` w `origin/main`; Robocza bundle SHA-256 `f0177a64…`, byte-identical remote readback. Pełny receipt `R-HANDLOWA-WYMIANA-CZAS-BEZTERMINOWY-30T-Q1/06-release-receipt.json`. |

## Wydania już potwierdzone na etapie 11

Cztery poprawki bitewne (znikanie zabitych jednostek, atak piechoty w Ataku,
atakuj-marszem, zbliżanie łuczników do zasięgu) wdrożono do Roboczej i wypchnięto
w `6b7f40b4`. Pinned GitHub Raw potwierdził bundel `b3d82220…`, SHA-256
`7632cbf4…`, 70,045,045 B, manifest i START. Szczegóły znajdują się w runach
każdego tematu, w `80-deploy-and-push.md`.

Ostatni odczyt `main`/Roboczej/pusha znajduje się w runie
[`R-INTEGRATION-SETTINGS-BATTLE-FOOD-20261029`](R-INTEGRATION-SETTINGS-BATTLE-FOOD-20261029/).
Pozostałe wcześniej potwierdzone wydania pozostają w swoich runach. Nie obniżam ich
etapu i nie otwieram ponownie bez nowego, konkretnego objawu.

## Reguła aktywacji

Każdy wiersz powyżej ma odpowiadający mu run z pełnym ID. Po zakończeniu fazy
orkiestrator sprawdza artefakt i bezzwłocznie dispatchuje następnego uprawnionego
operatora/ewaluatora/kontrolera. Przekazanie musi zawierać numer etapu, commit lub wynik,
blokady i dokładny następny krok. Brak operatora oznacza **WSTRZYMANY**, nigdy „w trakcie”.
