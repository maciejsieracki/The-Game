# R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 — raport Final Control (runda 1/5)

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1
GOAL: zwycięska armia w AUTO/SKIP ściga rozbitego wroga pełnym zasięgiem ruchu własnej jednostki, bez „dziobania”.

## ZMIANY/COMMIT
Oceniany kandydat: 15a6279e6 (kod = 80c31eb96; 15a6279e6 dodaje tylko 30-obrona-claude.md). Baza fef330d84 jest przodkiem kandydata
(`git merge-base --is-ancestor fef330d84 15a6279e6` = 0). origin/main poszedł dalej (6c1687274, FALA 725/726) i NIE zawiera fef330d84
(merge-base = ac3352c25); `git merge-tree` kandydat + origin/main = czysty (bez konfliktów). Diff vs baza: 10 plików, wszystkie w allowliście
(battleScene.ts +33/-3, 4 narzędzia gra/tools, 3 evidence JSON, 2 raporty); `git diff --check fef330d84 15a6279e6` czysty.

## TESTY (własne uruchomienia, surowe wyniki)
Na kandydacie 15a6279e6:
- `npx tsc --noEmit` (gra/): EXIT 0.
- `battle-pace-latch-test.cjs`: 5/5 pass, mutacja MELEE_LATCH wykryta, EXIT 0. NA BAZIE (battleScene.ts z fef330d84): 2/5 pass, 3 FAIL ((a), (a2), (a3)), EXIT 1 — czerwone na bazie potwierdzone.
- `battle-pace-equal-line-live-test.cjs`: 23 pass, 0 fail.
- `battle-line-advance-uniform-test.cjs`: EXIT 0, wszystkie PASS.
- `battle-skip-equals-auto-resolve-test.cjs`: 42 ok, 0 fail (seed 7: auto=70336 ms, skip=70320 ms).
- `battle-skip-siege-parity-test.cjs`: pass=17 fail=0.
- logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
Na drzewie scalonym kandydat + origin/main (merge --no-commit, potem abort): tsc EXIT 0; latch 5/5; line-advance PASS; skip=auto 42 ok / 0 fail.
NIE URUCHOMIONO ponownie: pomiar w Chromium (battle-pursuit-pace-measure.cjs) — dowód oceniony z zapisanego evidence/pp-scen1-fix.json.

## WERDYKT PER ZARZUT
1. NAPRAW (powód FAIL). Cel niedomknięty, a przyczyna reszty NIE jest zmierzona. W pp-scen1-fix.json konnica (mp 7, paceCap None, wróg w całości
   routed0=True) w turach 12-16 robi `steps` = 3 w niemal każdym wierszu (np. t13: 3,3,3,1; t14: 3,3,3,3; t15: 3,3,3,7) przy stepsPlan 5-7 i
   leftover 4-7. Tak jednolite „3” (= pula piechoty) w kilku turach z rzędu nie przypomina przypadkowych kolizji z własnymi; Operator przypisał to
   `_resolveAutoBatchMovement` (occupant) wyłącznie z lektury kodu, bez instrumentacji — kryterium 2 dispatchu („przyczyna wskazana liczbami”)
   dla reszty niespełnione, a skarga właściciela („dziobią”) w mierzonym scenariuszu nadal występuje (t10-16: 1-3 z 7). Dispatch ETAP 2b wymaga
   dokładnej przyczyny z tabeli pomiarowej; tu jej brak. Runda 2 (ten sam ID): zinstrumentować gdzie ucina się ścieżka/ruch (zajęte pole vs
   nieprzejezdne vs inny sufit/limit równy 3; log per jednostka powód końca ruchu), potem albo naprawić (jeśli to ten sam rodzaj sufitu
   co reguła właściciela), albo DECYZJA z liczbami.
2. ODDAL (z notą). Test jednostkowy na atrapie sceny sprawdza cap/zatrzask (to, co dispatch (a) opisuje jako „sufit nie wraca”), ma mutację i jest
   czerwony na bazie; ruch rzeczywisty pokazuje pomiar przeglądarkowy. Zalecenie na r2: dodać do pomiaru wynik końcowy (steps vs mp) jako asercję.
3. DO DECYZJI CZŁOWIEKA. `!rangedBase` (rangedBase = zasięg ataku >= 2, np. Hastati) to istniejąca definicja wzwarcia z W19/W40; zmiana przesuwa
   moment „do pierwszego wzwarcia” (reguła właściciela). Skutek zbadać w r2 (czy walka samymi jednostkami z zasięgiem >=2 zostawia sufit).
4. ODDAL z notą NIE_ZMIERZONO. Determinizm: zatrzask ustawiany w tym samym miejscu co cache.contact i monotoniczny; skip=auto 42/0 także na
   drzewie scalonym; zapis w bitwie wyłączony (W27). Tryb watch (AUTO sceniczny), seedy 2-3, scen. 2 pozostają NIE ZMIERZONE — dołączyć do r2.
5. ODDAL. REPIN Rust (UWAGA-3) zapisany w 10-operator; wpis do rejestru po FC należy do orkiestratora. Brak hasła o tempie w docs/encyklopedia
   (grep bez trafień) — nic do dopisania w allowliście.
6. ODDAL. Evidence wymagane dispatchem.

## BLOKADY
Brak technicznych. Zarzut 1 wymaga r2 Operatora. UWAGA-2 / zarzut 3 = DECISION_REQUIRED (nie blokuje r2).

## RUNDY
Final Control po rundzie 1/5 Operatora. Werdykt: FAIL. Wraca do Operatora tego samego ID, bazą kandydat 15a6279e6 (merge z origin/main przed końcem rundy).

## NASTĘPNY KROK
Operator r2 (HAIKU; Sonnet dopiero po 2 nieudanych rundach Haiku): instrumentacja przyczyny reszty „dziobania” w scen. 1 (powód zakończenia ruchu per
jednostka, hex zajęty/kto, nieprzejezdny, inny limit), pomiar także w trybie watch i seedach 2-3, potem naprawa lub DECISION_REQUIRED z liczbami.
Zachować zatrzask (poprawny i zielony).

DEPLOY/PUSH: NIE WYKONANO
