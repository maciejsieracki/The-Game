# P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1 — Evaluator, runda 1/5

MODEL+EFFORT: Sonnet 5, effort high · worktree `/home/user/wt-wojna-epoki-hard`, gałąź
`autobot/P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1`, weryfikacja niezależna diffu operatora
(`git diff 9acc5037` — potwierdzone jako realna baza dispatchu przez `git merge-base main HEAD`).

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1
GOAL: wymuszona wojna epoki (Kamień/Brąz/Żelazo) wybucha niezależnie od tego, czy strony
formalnie "poznały" się dyplomatycznie.

## Co zweryfikowałem niezależnie (i potwierdziłem)

- Diff faktyczny vs baza `9acc5037` (nie lokalny `main`, który w tym worktree zdążył
  odjechać o niezwiązane tematy — `git diff main` dawał mylący, dużo większy stat; właściwy
  diff to wyłącznie `gra/src/main.ts` (+91/-1), dwie nowe bramki testowe i raport — zgodnie z
  allowlistą i ZMIANY/COMMIT operatora).
- Źródłowo: `forced-war-common.ts`, `forced-war-bronze/stone/iron.ts` i budowa
  `bronze/stone/ironTriggeredSubjects` (main.ts ~31210-31330) nie zawierają żadnego warunku
  zależnego od `contact`/`discover`/widoczności — potwierdza to diagnozę operatora, że
  eligibility/pairing same w sobie są czyste, a blokada jest wyłącznie w routingu komend w
  `ownerLoop`.
- `powod` z prefiksem `R-EPOKA-(BRAZU|KAMIEN|ZELAZO)-WYMUSZONA-WOJNA:` jest rzeczywiście
  stałym, jedynym miejscem ustawianym w `ai.ts` dla tych trzech gałęzi (linie ~5111/5132/5157);
  jedyne inne miejsce generujące `wypowiedz_wojne` (linia ~5373, "wrogie nastawienie...") ma
  zupełnie inny `powod` — zero ryzyka fałszywego dopasowania regexu.
- `filterDiplomacyCommandsForEstablishedContact` (wołane PO nowym podziale) filtruje tylko
  `ESTABLISHED_CONTACT_CMDS`, które NIE zawiera `wypowiedz_wojne` — nowy koszyk "forced" nie
  jest przypadkiem wycinany drugi raz przez tę bramkę.
- Uruchomiłem niezależnie: `tsc --noEmit` (0 błędów), 5 bramek referencyjnych (213/19/33/13/6,
  wszystkie zielone), oraz 18 istniejących bramek "forced-war"/dyplomacji (bronze/stone/iron/
  trojstronna-test + wszystkie \*-main-guard-test + reguly-multi-turn-simulation +
  p-wojna-wymuszona-trzy-naprawy + diplomacy-layers + ai-war-gate + diplomacy-war-gates +
  wojna-wymuszona-parowanie + wojna-wymuszona-prog-tury-gracz + bronze-new-game-reset +
  iron-era-enter-turn-save-load + iron-mutant-probe) — WSZYSTKIE zielone, liczby identyczne z
  raportem operatora, zero regresji w D3-Q2 dla normalnych wypowiedzeń wojny/handlu/sojuszu.
- Uruchomiłem obie nowe bramki: `forced-war-player-pre-contact-gate-test.cjs` (45/45) i
  `forced-war-player-no-contact-live-test.cjs` (13/13, żywy Chromium, realny `vite build`,
  realny `endTurn()` do tury 25 — relacja attacker↔gracz faktycznie `'wojna'` bez uprzedniego
  `isDiplomaticallyDiscovered`).
- Dodatkowo uruchomiłem (nie wymienione explicite w TESTY operatora, ale nazwa pasuje do
  "forced-war" w `gra/tools/`) `forced-war-player-target-live-test.cjs` (scenariusz "gracz JUŻ
  poznał" — 12/12, bez regresji po zmianie routingu).
- `git diff --check` na commitowanych plikach: czysty.

Wniosek co do rdzenia zadania: **operator znalazł i naprawił dokładne, źródłowo potwierdzone
miejsce blokady** (routing `dipCmdsPlayerFacing` przez `dipLayer` w `ownerLoop`, main.ts), nie
tylko obszedł objaw — naprawa jest chirurgicznie ograniczona do komend z markerem `powod`
wymuszonej wojny epoki i nie dotyka ogólnej reguły D3-Q2 dla żadnej innej komendy (potwierdzone
testami regresji). Żywy dowód POTWIERDZA, że wojna faktycznie wybucha bez wcześniejszego
kontaktu.

## ZARZUTY

1. **Nieprzeanalizowany, prawdopodobny efekt uboczny wybranego podejścia (b): gracz zostaje
   wciągnięty w wojnę ze stroną, którą jego własny UI dalej traktuje jako "brak kontaktu" —
   operator nie zbadał ani nie odnotował tego w raporcie, mimo że dispatch wprost porównywał
   (b) z (a) ("tak jak realnie wypowiedzenie wojny ujawnia przeciwnika") i prosił o
   uzasadnienie wyboru względem takich konsekwencji.**
   Naprawa NIE dodaje `attackerId`/`targetId` do `diplomaticallyDiscoveredOwners` ani do
   `diplomaticContactEstablished` przy skutecznym wypowiedzeniu wymuszonej wojny (main.ts,
   blok wykonania `wypowiedz_wojne` ~32232-32300 — sprawdziłem, brak takiego wywołania w
   diffie ani w kodzie wykonawczym). Skutki, prześledzone źródłowo:
   - `buildAudienceActions`/`applyAudienceAction` liczą `layer` z
     `diplomacyLayerForOwner(ownerId, ..., getDiplomaticContacts())` — dla ownera, którego
     gracz nadal formalnie "nie odkrył", `layer==='pre_contact'`, więc
     `playerDiplomacyActionAllowed(layer, 'peace')` zwraca `false` i panel audiencji pokazuje
     `allowedActionsForLayer('pre_contact') === ['Brak kontaktu']` — gracz może realnie utknąć
     w wojnie bez formalnego dostępu do panelu tej cywilizacji, dopóki jej nie odkryje zwykłą
     eksploracją.
   - Sam operator, w nagłówku nowej bramki żywej (`forced-war-player-no-contact-live-test.cjs`,
     krok E), odnotowuje, że bez kolokacji (czyli w dokładnie tym nowo odblokowanym przez tę
     naprawę scenariuszu) wpis w `warEventLog` ląduje jako **generyczna karta `kind:'info'`
     (tytuł pusty, treść w `subtitle`)**, NIE jako dedykowana karta `kind:'enemy'` z portretem/
     nazwą napastnika, którą dostaje siostrzany scenariusz "gracz już poznał"
     (`forced-war-player-target-live-test.cjs`, potwierdzone przeze mnie uruchomieniem — karta
     `kind:'enemy'` z tytułem). To jest zweryfikowana (nie domniemana) degradacja jakości
     powiadomienia dokładnie w przypadku, który ta naprawa dopiero czyni osiągalnym: gracz
     dowiaduje się o wojnie z ogólnikowego wpisu, bez jasnej identyfikacji napastnika.
   Nie twierdzę, że to dyskwalifikuje naprawę (opcja (a) miała własne ryzyka, a wymuszone
   wojny i tak kończą się automatycznie progiem zdobytych miast/odpoczynkiem, niezależnie od
   panelu dyplomacji) — ale raport operatora **nie odnotowuje ani nie waży tego kompromisu w
   ogóle**, mimo że dispatch explicite prosił o uzasadnienie wyboru (b) względem (a) w
   kontekście istniejącego systemu, i mimo że sam test operatora zawiera dowód tej degradacji
   w swoim własnym komentarzu. Minimalna łatka w zakresie tego samego pliku/allowlisty
   (dodanie `diplomaticallyDiscoveredOwners.add(...)` dla obu stron przy skutecznym
   wypowiedzeniu KONKRETNIE wymuszonej wojny epoki, analogicznie do testowego haka
   `forceBronzeForcedWarOnPlayer` który to robi) usunęłaby obie konsekwencje bez naruszania
   zakresu "nie dotykaj D3-Q2 dla zwykłych wypowiedzeń wojny".

2. **Żywy dowód PRZED/PO wymagany explicite przez dispatch (pkt 1 i 4 ZADANIA) okazał się, wg
   własnego przyznania operatora, niedeterministyczny i nie dostarcza wiążącego rozróżnienia
   PRZED/PO na poziomie żywej rozgrywki — wiążący dowód jest wyłącznie jednostkowy.**
   Operator to jawnie przyznaje (sekcja TESTY, akapit "PRZED/PO na żywym silniku") i podaje
   wiarygodne wyjaśnienie (odświeżanie mgły w `?playtest=mapa` powoduje naturalne "odkrycie" w
   trakcie tej samej tury niezależnie od stanu naprawy) — nie jest to próba ukrycia luki
   (zgodnie z C-058). Niemniej formalnie: BINARNE KRYTERIUM SUKCESU dispatchu żąda dowodu
   "symulacja, nie domysł z czytania kodu" na poziomie żywej rozgrywki, a punkt 1 ZADANIA żąda
   dwóch porównywalnych symulacji (z kontaktem od startu vs bez) pokazujących różnicę. Tego
   PRZED/PO na poziomie żywej rozgrywki nie ma — jest tylko jednostkowy dowód logiki routingu
   (Dowód 1, rzetelny, na realnych funkcjach silnika) plus żywy dowód wyłącznie na stanie PO
   naprawie. Traktuję to jako częściowe niespełnienie litery dispatchu, złagodzone przez jakość
   i szczerość zastępczego dowodu jednostkowego — nie jako dowód, że naprawa nie działa (żywy
   test PO naprawie 13/13 potwierdza realny skutek).

## TESTY (uruchomione niezależnie w tej rundzie)

`tsc --noEmit`: 0 błędów. Bramki referencyjne §6: logic-test 213/213, tech-tree-test 19/19,
research-test 33/33, unit-replace-test 13/13, combat-test 6/6. Forced-war/dyplomacja (18
bramek jednostkowych, liczby identyczne z raportem operatora): bronze/stone/iron/trojstronna-
test, \*-main-guard-test ×4, reguly-multi-turn-simulation, p-wojna-wymuszona-trzy-naprawy,
diplomacy-layers, ai-war-gate, diplomacy-war-gates, wojna-wymuszona-parowanie,
wojna-wymuszona-prog-tury-gracz, bronze-new-game-reset, iron-era-enter-turn-save-load,
iron-mutant-probe — wszystkie zielone. Nowe bramki operatora: pre-contact-gate-test 45/45,
no-contact-live-test 13/13 (żywy Chromium). Dodatkowo `forced-war-player-target-live-test.cjs`
12/12 (regresja scenariusza "już poznał" — zielono). `git diff --check` czysty.

## BLOKADY

Brak blokad technicznych do dalszej weryfikacji. Zarzut 1 wymaga decyzji: czy (i) naprawić
teraz w tej samej rundzie (dodanie discovery jako efekt uboczny skutecznego DOW wymuszonej
wojny epoki, zakres minimalny, ten sam plik z allowlisty), czy (ii) świadomie zaakceptować
obecny stan jako wystarczający wobec zgłoszenia właściciela ("wojna ma wybuchać", bez
wymogu, by panel dyplomacji był od razu dostępny) i odłożyć jako osobny temat/ECHO. To jest
dokładnie rozwidlenie (a)/(b) z dispatchu, które operator rozstrzygnął bez zważenia tego
konkretnego kosztu — proponuję DECISION_REQUIRED do właściciela/orkiestratora, nie kolejną
rundę Operatora "w ciemno".

## RUNDY: 1/5

## NASTĘPNY KROK: Obrona operatora (odniesienie się do Zarzutu 1 i 2) → jeśli obrona nie
rozwiewa Zarzutu 1 merytorycznie, ABC do właściciela (czy akceptowalne, że gracz po wymuszonej
wojnie epoki nadal formalnie "nie zna" napastnika w panelu dyplomacji) → Final Control.

## DEPLOY/PUSH: NIE WYKONANO
