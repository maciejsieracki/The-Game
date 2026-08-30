TEMAT:  P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1
RUNDA:  1/5
DATA:   2026-08-30
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high / Final Control Sonnet 5 effort=high (osobne wywołanie Workflow)

## WYZWALACZ
Właściciel: „wojny między cywilizacjami miały być po turze 20 w Kamieniu i w Brązie...
nikt mi nie wypowiada wojen, nic też nie widzę, że wojny prowadzone są między
cywilizacjami AI." Recon (subagent, czyste czytanie źródła, bez zmian w kodzie)
potwierdził dwie osobne, wcześniej zarejestrowane, wciąż otwarte bramki blokujące
(`P-WOJNA-JUZ-W-WOJNIE-LICZY-BARBARZYNCOW-Q1`, `P-WOJNA-PRE-CONTACT-BLOKUJE-AI-AI-Q1`,
obie 2026-08-28, status OTWARTE). Mechanizm sam w sobie (progi, wywołania co turę dla
Kamienia/Brązu/Żelaza) jest potwierdzony jako poprawny i aktywny.

Po przedstawieniu diagnozy właściciel odpowiedział (2026-08-30, dosłownie, trzy punkty):
„trzeba usunąć te przeciwwskazania. Po pierwsze, barbarzyńcy nie mogą się liczyć w tej
wojnie; muszą być wyłączeni. Po drugie, trzeba wyłączyć mechanizm związany z [mgłą]
wojny, żeby nie resetował wojny między dwoma AI. Po trzecie, gracz musi być liczony
tak samo jak wszystkie [cywilizacje] — jeśli jakaś cywilizacja jest blisko gracza, to
ona wypowiada mu wojnę... żeby rozgrywka stała się bardziej emocjonująca, bo teraz w
ogóle nikt nikomu nie wypowiada wojen i nic się nie dzieje."

**UWAGA ORKIESTRATORA — jawne odnotowanie odwrócenia wcześniejszej decyzji:** punkt
trzeci ODWRACA świadomą decyzję Q2 z `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` („cel to
najbliższy sąsiad AI, NIE gracz" — filtr `oid > 0` w puli kandydatów), skopiowaną
1:1 do Brązu i Żelaza. To NIE jest błąd do naprawienia, tylko ŚWIADOMA, bieżąca zmiana
projektowa właściciela — zarejestrować jako nową decyzję zastępującą Q2, nie jako
kontynuację starej.

## GOAL
Trzy naprawy w tym samym temacie (Operator decyduje czy robić jako jedną rundę czy
podzielić na węzły -a/-b/-c, jeśli razem okażą się za duże — zgłosić to jawnie zamiast
robić wszystkie na siłę):

**(a) Barbarzyńcy nie mogą blokować wymuszonej wojny jako „już w wojnie".**
`countActiveWarsForOwner(ownerId)` (main.ts:17132-17139) iteruje `allPowerOwnerIds()`
i liczy `getDiploRelation(ownerId, oid).status === 'wojna'` — relacja z barbarzyńcami
(`BARBARIAN_OWNER_ID = -1`, `game/barbarians.ts:49`, helper `isBarbarian()` tamże
linia 53) jest STRUKTURALNIE zawsze 'wojna' dla każdego ownera (decyzja C-BARB-Q1).
Skutek: gdy barbarzyńcy istnieją gdziekolwiek na mapie (niemal zawsze),
`alreadyAtWarAnyRole = countActiveWarsForOwner(ownerId) > 0` jest prawdą dla
praktycznie KAŻDEJ cywilizacji, blokując `isEligibleFor{Stone,Bronze,Iron}ForcedWar`
we wszystkich trzech epokach naraz — trzy wywołania w main.ts: ~28445 (Brąz), ~28519
(Kamień), ~28593 (Żelazo), każde jako `const alreadyAtWarAnyRole =
countActiveWarsForOwner(ownerId) > 0`.

WAŻNE — NIE zmieniać samej funkcji `countActiveWarsForOwner` globalnie: jest też
wołana z innego kontekstu (main.ts:17164, `buildAllianceWarObligationCtx`, decyzja
sojusznika czy honorować wezwanie do wojny) — TAM wojna z barbarzyńcami MOŻE być
zasadnym powodem odmowy. Naprawa dotyczy WYŁĄCZNIE trzech wywołań przy bramce
wymuszonej wojny — nowa funkcja pomocnicza (np.
`countActiveWarsForOwnerExcludingBarbarians`) użyta TYLKO w tych trzech miejscach,
wykluczająca `oid` gdy `isBarbarian(oid)`.

**(b) Wypowiedzenie wojny między dwiema AI nie może zależeć od widoczności GRACZA.**
`dipLayer = diplomacyLayerForOwner(ownerId, simplifiedDiplomacyOwners,
foreignTypeOwners, contactedOwners)` (main.ts:~28221-28226) + `filterDiplomacy
CommandsForLayer` (`game/diplomacy-layers.ts:260-268`) kasują WSZYSTKIE komendy
dyplomatyczne danej AI (w tym `wypowiedz_wojne`), jeśli `contactedOwners` (=
`getDiplomaticContacts()` = `diplomaticallyDiscoveredOwners`, main.ts:7474) nie
zawiera `ownerId` tej AI — a ten zbiór jest budowany WYŁĄCZNIE z widoczności
GRACZA-CZŁOWIEKA (`currentVisible()`, main.ts:9144-9154, filtruje jednostki/miasta
`ownerId===0`). Skutek: AI(X) nie może wypowiedzieć wojny AI(Y), jeśli TY (gracz) nie
odkryłeś AI(X) na mapie — mimo że to zdarzenie światowe niezwiązane z Twoją
widocznością. Pomiar audytu: 1 wypowiedzenie na 3 ziarna zamiast wielu.

Naprawa: gdy komenda dyplomatyczna `wypowiedz_wojne` dotyczy DWÓCH stron, z których
ŻADNA nie jest graczem (po naprawie (c) niżej „gracz" nadal oznacza konkretnie
ownerId===0 jako PODMIOT tej pary — patrz uwaga w (c) o kolejności prac), bramka
`pre_contact` oparta o widoczność gracza NIE powinna kasować tej komendy. Komendy, w
których gracz JEST stroną (ownerId===0 lub target===0), zostają BEZ ZMIAN pod
dotychczasową bramką `pre_contact` (D3-Q2, 2026-07-21, świadoma decyzja „brak
odkrycia w mgle → brak dyplomacji AI/UI" dla interakcji Z GRACZEM — nie unieważniać
jej tam). Operator ma znaleźć dokładne miejsce, gdzie komenda `wypowiedz_wojne` niesie
identyfikator celu, i dodać rozróżnienie PRZED `filterDiplomacyCommandsForLayer`, bez
zmiany semantyki samej funkcji `diplomacyLayerForOwner`/`filterDiplomacyCommandsForLayer`
używanej gdzie indziej dla komend z graczem.

**(c) Gracz ma wejść do puli kandydatów wymuszonej wojny na równi z AI — NOWA DECYZJA
właściciela, zastępuje Q2 z `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1`.** Pula kandydatów
budowana jest dziś z `aiOwnerList` (main.ts:~27634-27640), który SAM W SOBIE wyklucza
gracza już u ŹRÓDŁA (`if (u.ownerId > 0) s.add(u.ownerId)` — linia 27636, analogicznie
27637 dla miast) — dodatkowy filtr `oid > 0` w trzech blokach kandydatów (main.ts:28383,
28461, 28544, 28615 — cztery wystąpienia, zmapować dokładnie które do której epoki)
jest więc WTÓRNY wobec wykluczenia u źródła. Samo usunięcie `oid > 0` NIE WYSTARCZY —
gracz nigdy nie trafi do `aiOwnerList`. Operator musi:
  1. Dodać ownerId gracza (0) i współrzędne jego reprezentatywnego miasta do puli
     kandydatów budowanej w każdym z trzech bloków (Kamień/Brąz/Żelazo) — analogicznie
     do `const c = cities.find(cc => cc.ownerId === oid)` już istniejącego dla AI.
  2. Usunąć/dostosować filtr `oid > 0` tak, by NIE wykluczał już gracza z tej
     konkretnej puli (przy zachowaniu wykluczenia barbarzyńców/miast-państw/
     wyeliminowanych — te warunki zostają).
  3. Zweryfikować, że ŚCIEŻKA WYKONANIA wypowiedzenia wojny (nie tylko wybór celu)
     poprawnie obsługuje target=gracz — czy komunikat/log wydarzenia/UI (np.
     `warEventLog`, powiadomienie gracza) faktycznie POWIADAMIA gracza o wypowiedzeniu
     mu wojny (inaczej naprawa byłaby niewidoczna dla właściciela identycznie jak dziś).
  4. Sprawdzić czy istnieją inne miejsca kodu zakładające niezmiennik „wymuszona wojna
     nigdy nie celuje w gracza" (np. testy, komentarze, logika trudności) — jeśli tak,
     zaktualizować je jawnie z odniesieniem do tej nowej decyzji, nie zostawiać
     sprzecznych założeń w kodzie.
Ta zmiana wpływa na trudność/balans (gracz może dostać wypowiedzenie wojny od
najbliższej cywilizacji AI po awansie epoki) — to jest ZAMIERZONY efekt tej decyzji
(„żeby rozgrywka stała się bardziej emocjonująca"), NIE zgłaszać jako DECISION_REQUIRED.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. (a) Nowy test jednostkowy (real execution, nie regex) dowodzący: cywilizacja z
   barbarzyńcami obecnymi na mapie (relacja 'wojna' wymuszona) i ZERO wojen z innymi
   cywilizacjami kwalifikuje się do wymuszonej wojny (Kamień/Brąz/Żelazo) — dawniej
   `alreadyAtWarAnyRole` dawało `true` w tym scenariuszu, po naprawie `false`.
2. (a) Test dowodzący, że `buildAllianceWarObligationCtx`/`activeWarCount` (main.ts:17164)
   NIE ZMIENIŁ zachowania — wojna z barbarzyńcami nadal liczy się tam, gdzie liczyła
   się wcześniej (brak regresji w logice zobowiązań sojuszniczych).
3. (b) Nowy test dowodzący: komenda `wypowiedz_wojne` między dwoma ownerId != 0
   PRZECHODZI przez filtr nawet gdy `contactedOwners` (widoczność gracza) nie zawiera
   żadnej ze stron; komenda dotycząca gracza (ownerId===0 lub target===0) NADAL jest
   kasowana w warstwie `pre_contact` tak jak dotychczas (brak regresji D3-Q2).
4. (c) Nowy test dowodzący: gdy gracz (ownerId=0) jest geograficznie NAJBLIŻSZYM
   kandydatem dla AI spełniającej próg wymuszonej wojny (dowolna z trzech epok), gracz
   ZOSTAJE WYBRANY jako cel — nie jest już strukturalnie wykluczony. Test dowodzący
   też, że barbarzyńcy/miasta-państwa/wyeliminowani NADAL są wykluczeni z tej samej
   puli (brak regresji istniejących wykluczeń).
5. (c) Dowód (test lub jawny opis w raporcie z cytatem kodu), że komunikat o
   wypowiedzeniu wojny faktycznie dociera do gracza tą samą ścieżką co inne zdarzenia
   wojny (nie ginie po cichu) — patrz punkt 3 sekcji (c) w GOAL.
6. Realna weryfikacja w headless Chromium (Playwright, wzorem `era-change-toast-live-
   test.cjs`): symulacja stanu, w którym AI osiąga próg epoki, gracz jest najbliższym
   kandydatem, brak innych wojen poza barbarzyńcami — potwierdzić że dochodzi do
   RZECZYWISTEGO wypowiedzenia wojny graczowi (widoczne w UI/dzienniku zdarzeń), NIE
   tylko w teście jednostkowym. Dozwolony wzorzec `__eraTestDebug`-owy (fast-forward
   stanu) zamiast grania dziesiątek realnych tur, jeśli losowość utrudnia pewny wynik.
7. `node ./node_modules/typescript/bin/tsc --noEmit` (z gra/) → 0 błędów.
8. Pięć bramek referencyjnych zielone bez pogorszenia: logic-test (213/213), tech-tree-
   test (19/19), research-test (33/33), unit-replace-test (13/13), combat-test (6/6).
9. Wszystkie istniejące testy odwołujące się do `countActiveWarsForOwner`,
   `diplomacyLayerForOwner`, `filterDiplomacyCommandsForLayer`,
   `buildAllianceWarObligationCtx`, oraz wszelkie `forced-war-*-test.cjs` (sprawdzić
   `gra/tools/`) — zielone bez pogorszenia.
10. Jeśli naprawa (b) wymaga zmiany sygnatury/nowego parametru w eksportowanych
    funkcjach `game/diplomacy-layers.ts` używanych też gdzie indziej — zgłosić to
    jawnie jako potencjalny szerszy wpływ, status `DECISION_REQUIRED`, nie integrować
    cicho.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (WYŁĄCZNIE: `countActiveWarsForOwner`-owe wywołania bramki
wymuszonej wojny; pętla per-owner budująca `dipLayer` i filtrująca komendy
dyplomatyczne ok. linii 28220-28680; bloki budowy puli kandydatów Kamień/Brąz/Żelazo
ok. linii 28380-28620 — dokładny zakres do ustalenia przez Operatora po realnym
odczytaniu kodu, NIE z pamięci tego dispatchu), `gra/src/game/diplomacy-layers.ts`
(WYŁĄCZNIE jeśli naprawa (b) wymaga tu zmiany — patrz kryterium 10),
`gra/src/game/barbarians.ts` (WYŁĄCZNIE odczyt/import `isBarbarian`,
`BARBARIAN_OWNER_ID` — bez zmian logiki barbarzyńców), `gra/src/game/forced-war-
stone.ts`, `forced-war-bronze.ts`, `forced-war-iron.ts`, `forced-war-common.ts`
(WYŁĄCZNIE jeśli funkcje `isEligibleForXForcedWar` albo dokumentacja tam zakładają
niezmiennik „nigdy gracz" wymagający aktualizacji po (c) — patrz GOAL (c) pkt 4),
nowy plik(i) testowe w `gra/tools/`.
Zakazane bezwzględnie: `docs/decyzje/<ID>.md` (poza jawnym zapisem NOWEJ decyzji
zastępującej Q2, jeśli Operator uzna to za konieczne — w takim wypadku dopisać PLIK,
nie nadpisywać istniejącej treści), `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`, zmiana progów liczbowych
wyzwalacza wymuszonej wojny (tura/miasta/odpoczynek/cooldown) — to POZA zakresem tego
tematu.

## IZOLACJA
worktree własny, gałąź `autobot/P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania (b) za naprawione, jeśli poprawka po prostu WYŁĄCZA bramkę `pre_contact`
globalnie (unieważniłoby świadomą decyzję D3-Q2 dla interakcji z graczem) — musi
rozróżniać komendy AI↔AI od komend z udziałem gracza. Zakaz uznania (c) za naprawione
przez samo usunięcie `oid > 0` bez dodania gracza do źródłowej puli (`aiOwnerList`
wyklucza go strukturalnie, patrz GOAL (c)) — to dałoby ZIELONY test przy zerowej
realnej zmianie zachowania, dokładnie ten błąd, który poprzedni audyt nazwał „zielona
bramka nie jest dowodem zachowania w rozgrywce" (§13a). Zakaz zamknięcia kryteriów 4
i 6 samym testem jednostkowym bez realnej weryfikacji w przeglądarce.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje dokładny plik/funkcję z błędem; runda N+1 na TYM SAMYM ID i TEJ
SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli zakres (a)+(b)+(c) razem okaże się
za duży na jedną rundę, dozwolony podział na węzły -a (barbarzyńcy)/-b (pre_contact
AI-AI)/-c (gracz w puli kandydatów), zgłoś to jawnie zamiast robić wszystkie na siłę.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck wyłącznie
`tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, model sędziego §3c) → Operator (obrona, jeśli zarzuty)
→ Final Control (werdykt per zarzut, osobne wywołanie Workflow) → integracja
orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
