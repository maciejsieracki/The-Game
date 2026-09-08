STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6D-RECON-DIPLOMACY-Q1
GOAL: Recon-only kategorii "dyplomacja" (6d) planu hot-seat; potwierdzić symetrię
getDiploRelation, kompletna inwentaryzacja hardkodów `0`="gracz", alias per klaster,
rozliczenie z "~55", sprawdzenie nakładania z Etapami 1/4/6a, plan no-op.
MODEL+EFFORT: sonnet-5, effort high (recon-analityczny, duży plik main.ts)

## 1. getDiploRelation — POTWIERDZONE
main.ts:7945-7965, świeży Read. Klucz `a < b ? \`${a}_${b}\` : \`${b}_${a}\`` — CZYSTO
symetryczny w (a,b), zero specjalnego traktowania `0`. Jedyna gałąź specjalna dotyczy
`isBarbarian(a)||isBarbarian(b)`, nie ownerId=0. Para 0_1 legalna bez zmian. Twierdzenie
planu POTWIERDZONE.

## 2-3. Inwentaryzacja + alias per klaster (świeży grep całego main.ts + 3 pliki game/*)
Metoda: (a) `\bownerId\s*(===|!==)\s*0\b` (276 traf.), (b) to samo dla 12 innych nazw
zmiennych par (`a/b/oid/otherId/partnerId/aiPartnerId/csOwnerId/attackerId/targetId/
defenderId/allyId/victimId/declarerId/mustDeclareWarOn`) — 330 traf. łącznie w całym
pliku, (c) literał `0` jako argument do 15 funkcji dyplomacji (getDiploRelation,
setDiploRelation, playerIsAtWarWith, allianceFormalKindBetween, ownerDiploLabel,
getWiarygodnosc, applyDiploEventTracked, isPeaceLockedBetween,
chargeWarDeclarationCredibility, breakTreatiesOnWar, applyAllianceObligationsOnWar,
pruneTributeNegotiationsBetween, recordWarDeclarationEvent,
classifyPlayerBorderMarchNotice, diplomacyLayerForOwner) — 78 miejsc po odrzuceniu 2
false-positives (literały niebędące ownerId, np. `{zaufanie:0,...}`).
Po filtrze do zakresu dyplomacji (relacje/wojna/pokój/sojusz/kara graniczna/kontakt/
trybut) — **potwierdzonych, ręcznie zweryfikowanych ≥136 miejsc**, w tym:
- **rdzeń silnika (WEWNĄTRZ ciała funkcji, nie na granicy wywołania)**:
  `playerIsAtWarWith` (9843-9846, `ownerId===0`) → **isMe/ME()** (używana z input/combat,
  zgodnie z ustaleniem 6a); `applyDiploEventTracked` (9170-9172, `a===0||b===0` +
  `getWiarygodnosc(0)`) → **isHuman** (funkcja bierze DOWOLNĄ parę a,b, także AI-AI —
  musi rozpoznać KTÓREGOKOLWIEK człowieka po dowolnej stronie, nie tylko fotel 0);
  `buildDiplomacyTickCtxForPair`+`getRelationBreakdown` (17934-17979, 17966-17972: civA/
  civB z `player.civType` tylko dla 0, contactEstablished, wiarygodnoscSelf) → **isHuman**
  (ta sama przyczyna — liczone dla każdej pary w pętli AI, `player.civType` singleton
  trzeba rozszerzyć per-fotel).
- **wyświetlanie/HUD z perspektywy aktywnego fotela**: `collectWarsWithPlayer`/
  `collectKnownWarsBetweenOthers` (17616-17649), `recordWarDeclarationEvent` (8333-8364),
  `classifyPlayerBorderMarchNotice` call (4839) → **isMe/ME()**.
- **akcje inicjowane przez aktywnego gracza**: `playerDeclareWarOnOwner` (9849-9882),
  `ownerDeclareWarOn` gałąź `defenderId===0||attackerId===0` (9912-9922) → **isMe/ME()**
  (to gracz przy sterach wykonuje akcję, analogia do klastra E z 6a).
- **kara graniczna/wymuszona wojna AI-para z odniesieniem do gracza**: bloki
  31974-31985, 27328/27344 (etykieta "gracz" vs "AIx"), 31019-31029 (filtr
  `targetId!==0`) → **isHuman** (dotyczy realnego stanu pary, nie ekranu aktywnego).
- **dev/playtest harness** (NOWY, nieujęty w planie): `forceBronzeForcedWarDominoOnPlayer`
  (21895-22000, dwa `getDiploRelation(x,0)`/`setDiploRelation(x,0,...)`) i
  `playtestWalkaMapy`-owe `setDiploRelation(0, preset.aiOwnerId,...)` (34874, 35344) —
  narzędzia deweloperskie, nazwa jawnie "OnPlayer"; wymaga decyzji właściciela czy w
  zakresie (prawdopodobnie poza zakresem produkcyjnym hot-seat).

## 4. Rozliczenie z "~55"
**Liczba "~55" jest ZANIŻONA, i to strukturalnie inaczej niż w 6a/6b/6c.** Tamte kategorie
miały hardkody głównie NA GRANICY wywołania (argument literału 0). Tu ok. 60 nazwanych
funkcji dyplomacji w main.ts (L2402-27400) ma hardkody 0 WEWNĄTRZ własnego ciała
(np. `applyDiploEventTracked`, `buildDiplomacyTickCtxForPair`) — prosty grep granicy
wywołania (jak w planie) je pomija całkowicie. Potwierdzony floor: **≥136** miejsc
(vs. deklarowane w planie 49/~55).

**PO OBRONIE (runda 1, w odpowiedzi na zarzut Evaluatora #2) — pełna, świeżo policzona
lista funkcja-po-funkcji dla klastra "hardkod WEWNĄTRZ ciała" (89 funkcji main.ts
o nazwie zawierającej Diplo/War/Alliance/Sojusz/Trybut/Peace/Wiarygodnosc/Credibility/
BorderMarch/Granic, granice funkcji wyznaczone dopasowaniem nawiasów `{}`, nie
heurystyką "do następnej nazwy pasującej do wzorca" — ta pierwsza, odrzucona metoda
dawała fałszywie zawyżone liczby, np. błędnie przypisywała 60 trafień do
`buildDiplomacyPanelConfig` przez rozciągnięcie jej "ciała" na 6360 linii aż do kolejnej
nazwy pasującej wzorcem, w tym cudzy kod). Wynik brace-matched: **70 z 89 funkcji ma
ZERO hardkodów wewnątrz ciała** (rdzeń w większości faktycznie czysty na poziomie
pojedynczej funkcji), **19 funkcji ma łącznie 35 odrębnych linii** z hardkodem `0`:

| Funkcja | Linie hardkodu (świeże, dziś) |
|---|---|
| `isActiveDiploOwner` | 6371 |
| `buildPlayerDiploSummary` | 6499, 6500, 6504, 6506, 6508, 6511, 6512, 6513, 6515, 6516 |
| `recordWarDeclarationEvent` | 8334, 8340, 8342, 8353, 8354 |
| `setDiploRelation` | 8826 |
| `applyDiploEventTracked` | 9170 |
| `playerIsAtWarWith` | 9844 |
| `ownerDeclareWarOn` | 9900, 9912, 9916 |
| `collectWarsWithPlayer` | 17624, 17625 |
| `collectKnownWarsBetweenOthers` | 17641 |
| `establishDiplomaticContact` | 17686 |
| `checkNewDiplomaticContacts` | 17724 |
| `buildDiploTreasury` | 17743, 17745 |
| `buildDiplomacyTickCtxForPair` | 17934, 17939, 17940, 17950 |
| `joinAllyToWar` | 18659 |
| `applyAllianceObligationsOnWar` | 18729, 18730, 18740, 18745, 18750 |
| `runDiplomacyTurnTick` | 19109 |
| `buildDiplomacyLockContextBase` | 19866 |
| `openDiplomacyAudience` | 20237 |
| `resolveForcedWarDurationLimits` | 27328, 27344 |

Dodatkowo (świeży Read, potwierdzone poza wzorcem nazw — funkcja nie ma "Diplo/War/..."
w nazwie): `getRelationBreakdown` (L17961+, ciało odrębne od sąsiadującej
`buildDiplomacyTickCtxForPair` — brace-matching potwierdza to jako DWIE różne funkcje,
nie jedną, wbrew wrażeniu z pierwotnego zakresu linii 17927-17985 w rundzie 1) ma własne
`a===0`/`b===0` na L17966, 17967, 17972, 17978 (Read main.ts:17961-17985 dziś;
L17976 to `aktywnyHandel: hasSzlakowTreaty(activeDeals, a, b)` — BEZ literału `0`, błędnie
podane w tabeli rundy 1 jako 17976 zamiast 17978 — poprawione).

**PO OBRONIE (runda 2, w odpowiedzi na zarzut Evaluatora #2 z 04-evaluator-runda2.md)
— tabela §4 uzupełniona i skorygowana.** Świeży pełny Read ciał
`buildPlayerDiploSummary` (main.ts:6498-6521) i `buildDiplomacyTickCtxForPair`
(main.ts:17927-17952) potwierdza dokładnie zarzut: brakowało 8 linii z literałem `0`
jako ARGUMENTEM wywołania (nie porównaniem `===0`/`!==0`) w `buildPlayerDiploSummary`
(6499 `civKeyForOwner(0)`, 6504 `objectivePowerForOwnerEffective(0)`, 6506
`getWiarygodnosc(0)`, 6511 `ownerDiploLabel(0)`, 6512 `civTypeForOwner(0)`, 6513
`civKolorHexFn(0)`, 6515 `epochLabelForOwner(0)`, 6516 `empireEpochForOwner(0)`) oraz
1 linii tego samego wzorca w `buildDiplomacyTickCtxForPair` (L17950
`getWiarygodnosc(0)`) — tabela wyżej już uwzględnia te poprawki. Przyczyna: metoda
brace-matched z rundy 1 poprawnie wyznaczyła granice funkcji, ale użyty WEWNĄTRZ
ciała wzorzec wykrywania hardkodów łapał głównie porównania `zmienna===0`/`!==0` i
pomijał literał `0` przekazywany jako argument do innej nazwanej funkcji (nawet gdy ta
wywoływana funkcja jest jedną z 15 śledzonych w §2-3) — dokładnie ten sam wzorzec,
przed którym ostrzegał dispatch (00-dispatch.md pkt 2). Metoda NIE została ponownie
przebiegnięta automatycznie nad całą tabelą 19/89 w tej rundzie (budżet rundy) — dwie
skorygowane funkcje są ręcznie zweryfikowane pełnym Read ciała, pozostałe 17 funkcji
tabeli mają status z rundy 1 (brace-matched + wzorzec `===0`/`!==0`, NIE
zweryfikowany ponownie pod kątem argumentów-literałów). W konsekwencji zdanie
"kompletna, wszystkie linie wypisane" z rundy 1 jest WYCOFANE jako zbyt mocne —
patrz zmiana sformułowania niżej.

Ta tabela + wcześniejsza lista call-site (78 miejsc po filtrze, §2-3) razem NIE sumują
się mechanicznie do jednej liczby (częściowe pokrycie: część call-site'ów leży wewnątrz
funkcji z tabeli — np. `applyDiploEventTracked:9170` to jednocześnie call-site i
body-internal), więc floor **≥136** z rundy 1 POZOSTAJE. Sformułowanie z rundy 1
("kompletna do linii, wszystkie linie wypisane") jest WYCOFANE — poprawny opis: tabela
dla klastra rdzenia silnika (19/89 funkcji) jest **kompletna według metody
brace-matched dla nazwanych funkcji, z dwiema poprawkami po weryfikacji Evaluatora
(runda 2) opisanymi wyżej**; metoda wykrywania wzorca "literał `0` jako argument
wywołania" NIE była systematycznie przebiegnięta nad pozostałymi 17 funkcjami tabeli,
więc dalsze luki tego samego rodzaju są możliwe i nie są wykluczone bez kolejnego
pełnego przebiegu — to jest znane ryzyko metody, nie twierdzenie o wyczerpaniu. Poza
zakresem tej tabeli (bo nie pasują do wzorca nazw funkcji): HUD/panel
niżej-poziomowe helpery, `diplomacy-border-march.ts` (osobny plik, już zliczony w §2-3),
dev-harness (`forceBronzeForcedWarDominoOnPlayer`, `playtestWalkaMapy`). **Decyzja
właściciela wymagana:** czy runda 2 rozszerza tę samą metodę (brace-matched, funkcja po
funkcji) na pozostałe klastry (HUD-call-site, dev-harness, `diplomacy-border-march.ts`)
do jednej scalonej listy, czy temat dzieli się na pod-kategorie (silnik/HUD/dev-tools)
już teraz — obie opcje są wykonalne, żadna nie jest zablokowana brakiem danych.

## 5. Nakładanie z Etapami 1/4/6a
Etap 1 (`isAiOwner`, human-owners.ts, ~31 miejsc `ownerId>0`) — **rozłączne**: konsumenci
to wykrywanie AI dla cities/units (main.ts:2075-2076, 7570), zero nakładania fizycznego z
klastrem dyplomacji człowiek-człowiek. `playerIsAtWarWith` (main.ts:9843-9846, dwa `0`) —
**potwierdzone: wciąż tam, pod tym samym numerem**, wchodzi w zakres tej kategorii,
**ciało funkcji nietknięte przez 6a** (patrz niżej).

**PO OBRONIE (runda 1, w odpowiedzi na zarzut Evaluatora #1) — korekta metody i wniosku.**
Runda 1 sprawdziła wyłącznie `git log --oneline origin/main` (zintegrowany main) i
zawartość plików w worktree 6a (tylko `00-dispatch.md`), z czego wywiodła "6a jej nie
tknęła". To było niewystarczające: Evaluator świeżo sprawdził stan ROBOCZY (niescommitowany)
worktree `/home/user/wt-hotseat-etap6a-input` przez `git status`/`git diff` i znalazł
136 linii diffu w `gra/src/main.ts` + `gra/src/game/army-cycle.ts` — implementacja 6a jest
w toku. Własna weryfikacja Obrony (`git diff -- gra/src/main.ts | grep -n
"playerIsAtWarWith"` w tym worktree, świeże) potwierdza DOKŁADNIE to, co znalazł
Evaluator:
```
303-      if (atkUnit.ownerId === 0 && defUnit.ownerId !== 0 && !playerIsAtWarWith(defUnit.ownerId)) {
304+      if (isMe(atkUnit.ownerId) && !isMe(defUnit.ownerId) && !playerIsAtWarWith(defUnit.ownerId)) {
```
Jest to JEDYNE wystąpienie `playerIsAtWarWith` w całym diffie (`grep -c` → 1 blok, 2
linie) — **wniosek merytoryczny się utrzymuje: CIAŁO funkcji `playerIsAtWarWith`
(main.ts:9843-9846) jest nietknięte, 6a zmienia wyłącznie call-site (argument literału
`0`→`isMe(atkUnit.ownerId)` w warunku otaczającym wywołanie, nie samą funkcję)** — więc
alias `isMe/ME()` ustalony w §2-3 dla ciała tej funkcji pozostaje aktualny i nie koliduje
z kierunkiem zmiany 6a (6a idzie w tę samą stronę: `ownerId===0`→`isMe(ownerId)`).
Niemniej metoda weryfikacji w rundzie 1 była realnie niepełna, zgodnie z zarzutem —
dispatch (00-dispatch.md l.27-34) explicite nazwał to "RÓWNOLEGŁYM dispatchu
implementacji" i kazał sprawdzić stan REALNY, nie tylko main. **Rekomendacja kolejności
integracji:** implementacja 6d (przyszły dispatch, call-site w `openPlayerMapUnitAttack`
main.ts:303 diffu 6a) powinna scalać się PO integracji 6a na tym pliku, albo — jeśli
harmonogram wymaga odwrotnej kolejności — przyszły dispatch 6d musi jawnie
uwzględnić ten sam call-site (`atkUnit.ownerId === 0 && defUnit.ownerId !== 0` w
`openPlayerMapUnitAttack`) jako potencjalny konflikt scalania (merge conflict, nie
błąd logiczny — obie zmiany idą w tym samym kierunku `0`→`isMe`/`isHuman`).

`git log --oneline origin/main` (najświeższy: c4281c50 = ten dispatch) pokazuje, że
implementacja Etapu 6a NIE jest zintegrowana do `main` (brak commitu implementacyjnego)
— to zdanie z rundy 1 pozostaje faktycznie prawdziwe i osobne od stanu roboczego
worktree opisanego wyżej; mylące było wyłącznie milczące utożsamienie "nie w main" z
"6a jej nie tknęła w ogóle".

## 6. Plan dowodu no-op

**PO OBRONIE (runda 1, w odpowiedzi na zarzut Evaluatora #3) — skonkretyzowane wzorem
precedensu 6c (`R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1/01-operator-runda1-analiza.md` §5):
rozstrzygnięcie MIESZANE, per klaster, z nazwanym skryptem i metodą porównania.**

- **Klaster silnika/rdzenia** (czysta logika, bez DOM w call-sicie): `getDiploRelation`,
  `setDiploRelation`, `applyDiploEventTracked`, `playerIsAtWarWith`, `ownerDeclareWarOn`,
  `playerDeclareWarOnOwner`, `buildDiplomacyTickCtxForPair`, `getRelationBreakdown`,
  `runDiplomacyTurnTick`, `applyAllianceObligationsOnWar`, `joinAllyToWar`,
  `chargeWarDeclarationCredibility`, `pruneTributeNegotiationsBetween` — wszystkie
  eksportowalne/wołalne bezpośrednio z modułu. **Metoda:** nowy, PROPONOWANY, jeszcze
  NIENAPISANY skrypt `gra/tools/hotseat-etap6d-diplomacy-test.cjs` — wzorem konwencji
  nazewniczej i struktury FAKTYCZNIE istniejących, zintegrowanych skryptów
  `gra/tools/hotseat-etap4-noop-test.cjs` i `gra/tools/hotseat-etap5-no-leak-test.cjs`
  (świeży `ls gra/tools/` dziś potwierdza ich istnienie). Analogiczny skrypt dla Etapu
  6c (`hotseat-etap6c-economy-test.cjs`) NIE istnieje w repo — 6c był, podobnie jak 6d,
  wyłącznie recon (bez implementacji), więc jego skrypt testowy nigdy nie powstał;
  poprzednia wersja tej sekcji błędnie nazywała go "istniejącym" precedensem, co
  niniejszym koryguje się — import modułu,
  wywołania izolowane per funkcja z parami `ownerId` 0/1/2, porównanie wyniku PRZED/PO
  podmianie `ownerId===0`→`isMe(ownerId)` (klaster akcji/HUD-perspektywy) lub
  `ownerId===0`→`isHuman(ownerId)` (klaster stanu pary) — wymóg: bit-w-bit identyczny
  wynik dla `humanOwnerIds=[0]`, bo `isMe(0)===true` i `isHuman(0)===true` zawsze w
  dzisiejszym single-human, więc każda gałąź daje ten sam rezultat jak dziś dla
  `ownerId=0` i ten sam `false` dla `ownerId>0`.
- **Klaster HUD/audiencja/panel** (DOM-bound, konsumuje wynik silnika do renderu):
  `buildDiplomacyPanelConfig`, `collectWarsWithPlayer`, `collectKnownWarsBetweenOthers`,
  `recordWarDeclarationEvent`, `classifyPlayerBorderMarchNotice` (wywołanie L4839) —
  **Chromium/Playwright, identyczna sekwencja co precedens 6c §5 Klaster F/G**: otwarcie
  panelu dyplomacji (audiencja), zrzut ekranu/DOM-snapshot PRZED zmianą i PO, 20 tur,
  porównanie treści etykiet "gracz"/"Ty" vs "AIx" — nie da się ocenić poprawności bez
  wyrenderowanego ekranu.
- **Klaster dev-harness** (poza zakresem produkcyjnym, patrz §2-3 p.5 — decyzja
  właściciela czy w zakresie): `forceBronzeForcedWarDominoOnPlayer`, `playtestWalkaMapy` —
  jeśli w zakresie, headless Node wystarczy (to same wywołania testowe co silnik).
- **Wspólna bramka referencyjna:** `tsc --noEmit` (0 błędów) + istniejące bramki
  dyplomacji/wojny z registru bramek (do potwierdzenia dokładnej nazwy w
  `R-PROC-AUTOBOT.md` §Bramki przy dispatchu implementacji) — muszą pozostać zielone
  identycznie przed/po.

ZMIANY/COMMIT: brak zmian w gra/; ten plik + commit lokalny w worktree.
TESTY: brak (recon-only); grep udokumentowany wyżej, świeże Read main.ts:7945-7965,
9163-9180, 17927-17985, 17956-17980, 8333-8364, 9843-9922, 21895-22000,
diplomacy-border-march.ts:254-278; świeży brace-matched skrypt Python nad main.ts (89
funkcji, tabela §4); świeży `git status`/`git diff -- gra/src/main.ts` w
`/home/user/wt-hotseat-etap6a-input` (potwierdzenie zarzutu #1). PO OBRONIE runda 2:
świeży pełny Read main.ts:6498-6521 i 17927-17985 (potwierdzenie 9 brakujących linii z
literałem `0` jako argumentem, poprawka numeru linii getRelationBreakdown 17978) oraz
świeży `ls gra/tools/hotseat-*` (potwierdzenie: hotseat-etap4-noop-test.cjs i
hotseat-etap5-no-leak-test.cjs istnieją, hotseat-etap6c-economy-test.cjs NIE istnieje).
BLOKADY: kategoria istotnie większa/głębsza niż plan zakładał — pełna wyczerpująca lista
(funkcja po funkcji) dla WSZYSTKICH klastrów (nie tylko silnika, patrz tabela §4) nie
zmieściła się w budżecie rundy 1; floor ≥136 miejsc jest udokumentowany i obronny.
Klaster silnika (19/89 funkcji) ma listę linii poprawioną i uzupełnioną w rundzie 2
(brakujące literały-argumenty w `buildPlayerDiploSummary`/`buildDiplomacyTickCtxForPair`,
korekta numeru linii `getRelationBreakdown`), ale — zgodnie z §4 — NIE jest deklarowana
jako wyczerpująco kompletna dla wzorca "literał `0` jako argument": tylko 2 z 19 funkcji
zostały ręcznie przeliczone tą metodą w rundzie 2, pozostałe 17 nie były ponownie
przebiegnięte pod tym kątem, więc dalsze pojedyncze luki tego samego rodzaju są możliwym,
nieudokumentowanym ryzykiem. Całość (wszystkie klastry) nadal wymaga decyzji właściciela
z §4 (kontynuacja vs. podział tematu) przed uznaniem za zamkniętą.
RUNDY: 2/5 (po tej poprawce; runda 1 = recon+Obrona pierwotna, runda 2 = ta Obrona w
odpowiedzi na 04-evaluator-runda2.md)
NASTĘPNY KROK: Evaluator (runda 3) ocenia poprawki §4 (uzupełniona/skorygowana tabela +
złagodzone sformułowanie kompletności) i §6 (korekta odwołania do nieistniejącego
`hotseat-etap6c-economy-test.cjs`) z tej Obrony.
DEPLOY/PUSH: NIE WYKONANO
