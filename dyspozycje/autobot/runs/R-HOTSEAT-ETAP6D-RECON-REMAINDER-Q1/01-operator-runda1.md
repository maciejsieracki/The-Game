STATUS: PASS (zamknięte przez orkiestratora po LIMIT-5-EXCEEDED, patrz notatka niżej)
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6D-RECON-REMAINDER-Q1
RUNDA 2 — poprawka po FAIL Evaluatora (4 zarzuty, wszystkie PRZYJĘTE, dowody i korekty w §1b,
§2, §3, §6 niżej; pełna obrona punkt-po-punkcie w 02-obrona-runda2.md).

**NOTATKA ORKIESTRATORA (po rundzie 5, LIMIT-5-EXCEEDED):** rundy 3-5 znalazły wyłącznie
drobne błędy cytowania/arytmetyki (numery linii, liczby funkcji), nigdy błąd merytoryczny
klasyfikacji aliasu czy zakresu — powtarzający się wzorzec sugerował malejący zwrot z
kolejnej rundy agenta. Dwa ostatnie zarzuty rundy 5 (niedoliczony hardkod
`playerDeclareWarOnOwner` 7→9, sprzeczność 13 vs 15 funkcji Podetapu B) poprawione
BEZPOŚREDNIO przez orkiestratora (nie kolejną rundą agenta) po świeżej weryfikacji
`sed`/`Read` obu miejsc w `gra/src/main.ts` — dokument jest teraz gotowy do integracji jako
docs-only (zero zmian w `gra/`). Pozostałe znane, jawnie odłożone kwestie (alias
`finalizeAllianceObligationRefusals`/`resolvePendingDiplomacy`, dokładne granice
`runWorldEndTurn` Blok A/B) czekają na dispatch odpowiednich podetapów, nie na dalsze rundy
tego recon.
GOAL: Dokończyć inwentaryzację pod-etapu 6d (dyplomacja) POZA już zmigrowanym podzbiorem 20
funkcji (`R-HOTSEAT-ETAP6D-DIPLOMACY-ENGINE-Q1`, commit `6ce48d7d`), osobna sekcja dev-harness/
border-march, propozycja podziału 2-4 podetapów. Dokument, ZERO zmian w `gra/src`.
METODA: świeży `git log`/`Read` main.ts (36762 linii, dziś); brace-matched ekstrakcja ciał
funkcji (Python, dopasowanie nawiasów `{}`, nie heurystyka nazw); dwa regexy jak w poprzednich
reconach (zmienna pary `===0`/`!==0`; literał `0` jako argument do 16 śledzonych funkcji
dyplomacji, rozszerzone o `syncRelationFromDeals`); manualny odczyt ciała każdego trafienia
(zakaz zgadywania z nazwy, zgodnie z REGUŁĄ PRZECIW SAMOOSZUKIWANIU dispatchu).

## 0. Już zmigrowane (WYŁĄCZONE z tej inwentaryzacji) — 20 funkcji, `6ce48d7d`
isMe/ME(): `isActiveDiploOwner`(6379), `buildPlayerDiploSummary`(6507), `recordWarDeclarationEvent`
(8348), `setDiploRelation`(8818), `playerIsAtWarWith`(9858), `ownerDeclareWarOn`(9907),
`collectWarsWithPlayer`(17645), `collectKnownWarsBetweenOthers`(17662),
`establishDiplomaticContact`(17714), `checkNewDiplomaticContacts`(17748), `buildDiploTreasury`
(17769, migracja przejęta wcześniej przez 6b), `joinAllyToWar`(18676),
`applyAllianceObligationsOnWar`(18738), `runDiplomacyTurnTick`(19067),
`buildDiplomacyLockContextBase`(19871), `openDiplomacyAudience`(20064).
isHuman(): `applyDiploEventTracked`(9178), `buildDiplomacyTickCtxForPair`(17956),
`getRelationBreakdown`(17990), `resolveForcedWarDurationLimits`(27345).
Linie dziś (świeży grep) zgodne z raportem inżynierskim — main.ts się przesunął od recon do
inżynierii, ale wszystkie 20 nazw i ich ciała potwierdzone bez dryfu numeracji > kilku linii.

## 1. NOWE odkrycie krytyczne: funkcja pominięta przez ENGINE (poza 20)
**`playerDeclareWarOnOwner` (main.ts:9864-9897) — 9 hardkodów, NIE zmigrowana.** Pierwotny
recon (`RECON-DIPLOMACY-Q1` §3, punkt "akcje inicjowane przez aktywnego gracza") jawnie
przypisał ją do `isMe/ME()` razem z `ownerDeclareWarOn` — ale tabela §4 tegoż recon (klaster
"hardkod wewnątrz ciała", metoda brace-matched) jej NIE zawierała (bo `playerDeclareWarOnOwner`
nie pasuje do wzorca nazw `Diplo|War|Alliance|...` użytego tam? — **pasuje** (zawiera "War"),
więc to prawdopodobnie przeoczenie ENGINE-dispatchu, nie recon). ENGINE zmigrował
`ownerDeclareWarOn` (funkcja WOŁANA przez `playerDeclareWarOnOwner` poniżej) ale nie samą
`playerDeclareWarOnOwner`. Cytat ciała (świeży Read):
```
9864: function playerDeclareWarOnOwner(ownerId: number): boolean {
9866:   if (isPeaceLockedBetween(0, ownerId)) { ... }
9880:   chargeWarDeclarationCredibility(0, ownerId);
9881:   breakTreatiesOnWar(0, ownerId, true);
9882:   applyAllianceObligationsOnWar(0, ownerId);
9884:   0, (pierwszy argument setDiploRelation — POPRAWKA RUNDY 5, zarzut Evaluatora:
       pominięty w rundach 1-4)
9886:   applyDiploEventTracked(0, ownerId, getDiploRelation(0, ownerId), 'wojna_wypowiedziana'),
       (DWA hardkody: `0` jako 1. arg. applyDiploEventTracked ORAZ `0` jako 1. arg.
       zagnieżdżonego getDiploRelation — POPRAWKA RUNDY 5: rundy 1-4 liczyły to jako jeden)
9888:   pruneTributeNegotiationsBetween(0, ownerId);
9889:   recordWarDeclarationEvent(0, ownerId);
9897: }
```
**Poprawka rundy 5 (zarzut 1 Evaluatora, PRZYJĘTE):** poprzednie rundy (1-4) liczyły 7
hardkodów, pomijając literał `0` na linii 9884 (pierwszy argument `setDiploRelation`) i
licząc linię 9886 jako JEDEN hardkod zamiast dwóch (`applyDiploEventTracked` ORAZ
zagnieżdżony `getDiploRelation` mają oba `0` jako pierwszy argument). Pełne, świeże
przeliczenie: 9866+9880+9881+9882+9884+9886(×2)+9888+9889 = **9 hardkodów**, nie 7.
Alias: **isMe/ME()** — nazwa i ciało: gracz aktywny wypowiada wojnę wybranemu `ownerId`, każde
wywołanie ma `0` na pozycji "ja". **Poprawka rundy 4 (zarzut 4 Evaluatora, PRZYJĘTE):** sygnatura
zwraca `boolean` (nie `void`) — dwa wczesne `return false;` (guard `isPeaceLockedBetween` i guard
`playerDiplomacyActionAllowed`) oraz `return true;` na końcu po sukcesie. Nie zmienia to
klasyfikacji aliasu (nadal jednoargumentowa akcja gracza z `0` na pozycji "ja"), ale kolejny
podetap MUSI zachować wartość zwracaną przy migracji sygnatury (wołający może sprawdzać wynik).
Ryzyko integracyjne: dzieli plik z już zmigrowanym
`ownerDeclareWarOn` tuż obok (9907) — kolejny podetap MUSI to uwzględnić jako sąsiedztwo, nie
duplikować edycji.

## 1b. NOWE odkrycie krytyczne: cała rodzina „stołu negocjacyjnego" pominięta w rundzie 1
**Runda 2, poprawka po zarzucie 1 Evaluatora — PRZYJĘTE.** Świeży `Read` ciała każdej z 14
funkcji operujących na `negotiationTable` (moduł „stół negocjacyjny"/audiencja, wprost
wymieniony w dispatchu jako część klastra dyplomacji) — WSZYSTKIE mają hardkod `proposerOwnerId`/
`responderOwnerId`/`awaitingOwnerId` `===0`/`!==0` lub literał `0` jako argument, i ŻADNA nie
była wymieniona w rundzie 1 (poza `handleNegotiationReject`, już w §2, ale z błędną linią —
patrz poprawka niżej). isMe/ME() dla wszystkich — moduł stołu operuje wyłącznie na parach
gracz(0)↔AI, brak stanu generycznej pary.

| Funkcja | Linie | Cytat |
|---|---|---|
| `negotiationPartnerOwnerIdOf` | 16024 | `entry.proposerOwnerId === 0 ? entry.responderOwnerId : entry.proposerOwnerId` |
| `resolveNegotiationEntryAt` | 16131,16133,16134 | `if (entry.proposerOwnerId === 0) { playerDeclareWarOnOwner(...) } else if (entry.responderOwnerId === 0) { ownerDeclareWarOn(entry.proposerOwnerId, 0) }` |
| `resolvePendingNegotiationsForOwner` | 16178,16190 | `n.proposerOwnerId === 0 \|\| n.responderOwnerId === 0` (filtr scopeIds); `entry.proposerOwnerId !== 0 && entry.responderOwnerId !== 0` (guard pętli) |
| `handleNegotiationAccept` | 16231 | `if (entry.awaitingOwnerId !== 0) { ... previewNegotiationEntry ... }` |
| `handleNegotiationCounter` | 16399 | `entry.proposerOwnerId === 0 ? entry.responderOwnerId : entry.proposerOwnerId` (aiOwnerId) |
| `handleRequestAiNegotiationResponse` | 16454 | `if (entry.awaitingOwnerId === 0) return;` |
| `getNegotiationsForPair` | 16464,16465 | `(n.proposerOwnerId === ownerId && n.responderOwnerId === 0) \|\| (n.proposerOwnerId === 0 && n.responderOwnerId === ownerId)` |
| `negotiationSummary` | 16485 | `entry.proposerOwnerId !== 0` (incoming) |
| `previewNegotiationEntry` | 16545 | `const incoming = entry.awaitingOwnerId === 0;` |
| `collectTurnEvents` | 14697,14698 | `if (n.awaitingOwnerId !== 0) continue; const aiOwnerId = n.proposerOwnerId === 0 ? n.responderOwnerId : n.proposerOwnerId;` |
| `collectOpenDiploProposalQueue` | 14818,14820 | `if (n.awaitingOwnerId !== 0) continue;` … `n.proposerOwnerId === 0 ? ...` |
| `openDiplomacyAudienceForNegotiation` | 14873 | `entry.proposerOwnerId === 0 ? entry.responderOwnerId : entry.proposerOwnerId` |
| `actionableNegotiationIdsForPair` | 16341 | `n.awaitingOwnerId === 0 \|\| n.awaitingOwnerId === ownerId` |
| `findIncomingNegotiationForAction` | 19804,19806 | `n.awaitingOwnerId === 0 && n.proposerOwnerId === ownerId && n.responderOwnerId === 0` |

Wszystkie 14 świeżo zweryfikowane `Read` w tej rundzie (linie potwierdzone `grep -n` + odczyt
ciała, nie zgadywane z nazwy).

## 2. Pozostałe miejsca — klaster HUD/render (perspektywa aktywnego fotela) → isMe/ME()
| Funkcja | Linie | Cytat / uzasadnienie |
|---|---|---|
| `relationColorFn` | 3461,3462 | `if(ownerId===0)return civColorFn(0); return relationBorderColor(getDiploRelation(0,ownerId).status)` — kolor obwódki mapy z perspektywy fotela |
| `unitRingStanceForPlayer` | 7986,7988 | nazwa dosłowna "ForPlayer"; `getDiploRelation(0,ownerId)` do koloru pierścienia jednostki |
| `playerFormalRelationLabel` | 5555,5558 | nazwa "player…Label"; `d.strony.includes(0)` (linia 5550, sąsiednia) + `getDiploRelation(0,ownerId)` |
| `cityMapOutlineKindForOwner` | 17787,17788 | komentarz w ciele: "kolor wg relacji **z graczem**" |
| `buildPlayerDiploRelations` | 6395 | nazwa "Player…", zasila panel dyplomacji aktywnego fotela |
| `buildDiploPairSummaryData` | 6469 + `id===0` (isPlayer flaga wewnątrz `toPartner`) | zasila pop-up pary audiencji; `revealAll` już świadomie wyjątkuje `id===0` (komentarz "gracz zawsze widoczny") |
| `buildAudienceActions` | 19944 | panel audiencji dla aktywnego fotela, deleguje do już zmigrowanej `buildDiplomacyLockContextBase` |
| `buildPendingNegotiationRows` | 16581 | wiersze UI audiencji (komentarz w ciele: "diplomacyAudience.ts") |
| `foreignCivsMissingTradeTreatyForCity` | 14617,14621 | komentarz: "Wywoływana tylko dla miast **gracza** (panel miasta jest gracz-only)" |
| `collectDiploChipCounts` | 14889,14896,14897 | liczniki-ikony HUD (sojusze/pakty/wojny) **aktywnego fotela** |
| `handleNegotiationReject` | **POPRAWKA rundy 2 (zarzut 2 Evaluatora, PRZYJĘTE):** 16264 (`entry.awaitingOwnerId !== 0`, NIE 16273 jak błędnie w rundzie 1 — 16273 to `const aiPartnerId = negotiationPartnerOwnerId(...)`, sąsiednia linia bez literału), + brakujące w rundzie 1: 16274 (`entry.proposerOwnerId !== 0`), 16275 (`ownerDeclareWarOn(entry.proposerOwnerId, 0)` — literał 0 jako argument, ten sam wzorzec co §1) | komentarz "Gracz Odrzuca wpis stołu" — akcja inicjowana kliknięciem aktywnego gracza; 3 hardkody, nie 1 |
| `enqueueNegotiationFromAiCmd` | 15826,15844,15888,15907 (+dalsze `,0)` w treasury/basket) | AI konstruuje ofertę zawsze **do** aktywnego fotela (`aiCommandToPendingProposal(cmd,ownerId,0,turn)`) |
| `applyProposalOutcome` | wywołania `getDiploRelation`/`setDiploRelation(proposerId,responderId,...)` BEZ literału 0 | **NIE ma hardkodu** — już parametryzowana przez `proposerId`/`responderId`; wypisana tylko jako sąsiad `enqueueNegotiationFromAiCmd`, do wykluczenia |
| `buildEmpireDetailSnap` | 15191 | `ownerDiploLabel(0)` — fallback etykiety cywilizacji **aktywnego** gracza gdy `civRow` nie ma nazwy |
| `applyBorderMarchPenaltiesEndTurn` | 4848 | `classifyPlayerBorderMarchNotice(enriched, resolveBorderMarchCtx, 0)` — produkcyjna kara graniczna, wołanie z literałem 0 do funkcji z `diplomacy-border-march.ts` (plik sam jest czysty, patrz §4) |
| `currentVisibleForOwner` | 9816 | `allianceFormalKindBetween(activeDeals,0,ownerId)!==null` → dodaje widoczność **sojusznika gracza**; hardkod = "sojusz **z aktywnym fotelem**", nie stan dowolnej pary |
| `peacefulArchetypeForOwner` | 18636 | `if(ownerId===0)return false` — gracz nie ma archetypu AI; predykat jednoargumentowy jak `isActiveDiploOwner`, więc `isMe` (nie `isHuman`, bo to nie stan PARY) |

## 3. Pozostałe miejsca — klaster silnika/stanu pary → isHuman
| Funkcja | Linie | Cytat / uzasadnienie |
|---|---|---|
| `applyClusterStartPlan` | 8526-8530 | `setDiploRelation(0, oid, applyWiarygodnoscD4ToRelation(rel, getWiarygodnosc(0), getWiarygodnosc(oid)))` — inicjalizacja startowych relacji WSZYSTKICH par przy tworzeniu świata; zapisuje stan pary, nie ekran → `isHuman` |
| `spawnPendingSameTypeRivals` | 8653 | `getWiarygodnosc(0)` obok `getWiarygodnosc(oid)` przy tworzeniu nowego rywala tego samego typu — liczy wiarygodność DLA PARY nowo powstałej, silnik nie HUD → `isHuman` |
| `finalizeAllianceObligationRefusals` | 18733 | `syncRelationFromDeals(0, allyId)` po odmowie obowiązku sojuszniczego — synchronizacja stanu pary po wojnie, ten sam wzorzec co `runDiplomacyTurnTick` (już `isMe` w tabeli ENGINE) — **wymaga jawnej decyzji: podążyć za precedensem `isMe` (spójność z siostrzanymi `joinAllyToWar`/`applyAllianceObligationsOnWar`) czy `isHuman` (czysta reguła "stan pary")** — NIE rozstrzygnięte w tej rundzie, flagowane do dispatchu implementacji |
| `resolvePendingDiplomacy` | 16788,16825 | `getDiploRelation(0,p.ownerId)`/`setDiploRelation(0,p.ownerId,...)` przy rozwiązywaniu zaległych ofert trybutu — ciało NIE odczytane w pełni (budżet rundy), nazwa i literał sugerują pętlę **wyłącznie** po ofertach DO gracza → `isMe` (kandydat), do potwierdzenia pełnym Read przy dispatchu implementacji |
| `restoreGameFromSave` | **POPRAWKA rundy 2 (zarzut 3 Evaluatora, PRZYJĘTE) — DWA hardkody w tej samej funkcji, nie jeden:** (a) 36533 `const otherOwnerId = entry.proposerOwnerId === 0 ? entry.responderOwnerId : entry.proposerOwnerId;` w bloku odtwarzania `negotiationTable` przy wczytaniu zapisu — pominięte w rundzie 1 mimo że ta sama funkcja była już analizowana; (b) 36600 (dryf funkcji: start 35833, nie wcześniej podane) `if(oid!==0) syncRelationFromDeals(0,oid)` w pętli `for (const oid of diplomaticContactEstablished)` | (b): `diplomaticContactEstablished` to zbiór kontaktów **odkrytych przez aktywny fotel** → `isMe`. (a): ten sam wzorzec co cała rodzina §1b (stół negocjacyjny) — spójne z `isMe` tamtej rodziny, bo to ten sam typ danych (`negotiationTable`) tylko wczytywany z zapisu, nie tworzony na żywo |

## 4. NOWE odkrycie: duplikat logiki tick w `runWorldEndTurn` (async, poza wzorcem nazw)
`runWorldEndTurn` (main.ts, sygnatura `async function runWorldEndTurn(humanOwnerId: number)`,
nie pasuje do filtra nazw `Diplo|War|Alliance|...` recon — **luka metody, nie luka danych**) ma
DWA duże bloki dyplomacji z hardkodem `0`, nigdy nieujęte w żadnym poprzednim reconie 6d:
- **Blok A (ok. 30977-31023, ok. 12 hardkodów)** — "DOW klastra PM NA GRACZA" (komentarz w
  kodzie): `getDiploRelation(csOwnerId,0)`, `isPeaceLockedBetween(csOwnerId,0)`,
  `hasTreaty(...,csOwnerId,0,...)`, `chargeWarDeclarationCredibility(csOwnerId,0)`,
  `breakTreatiesOnWar(csOwnerId,0,false)`, `applyAllianceObligationsOnWar(csOwnerId,0)`,
  `applyDiploEventTracked(csOwnerId,0,...)`, `setDiploRelation(csOwnerId,0,newRel)`,
  `pruneTributeNegotiationsBetween(csOwnerId,0)`, `recordWarDeclarationEvent(csOwnerId,0)` —
  strukturalny bliźniak `playerDeclareWarOnOwner`/`ownerDeclareWarOn`, ale to miasto-państwo
  wypowiada wojnę GRACZOWI (kierunek odwrotny) → **isMe** (mechanika jawnie "vs gracz").
- **Blok B (ok. 31577-31687, ok. 12 hardkodów)** — właściwy per-AI-owner tick dyplomacji
  wewnątrz pętli tury świata: `getDiploRelation(0,ownerId)` (dwa razy), `setDiploRelation(0,
  ownerId,...)` (dwa razy), `getWiarygodnosc(0)`, `ownersShareLandBorderLive(ownerId,0)`,
  `citiesHaveTradeConnection(cities.filter(c=>c.ownerId===0),...)`, `relacjeDip.push({
  partnerId:'0',...})`, `aiDiplomacyStance(aiStub,humanStub,...)` z `humanStub={ownerId:0,...}`
  — funkcjonalny odpowiednik już zmigrowanego `runDiplomacyTurnTick`, ale to OSOBNY kod
  (potwierdzone: różne numery linii, różna sygnatura, `runWorldEndTurn` woła to bezpośrednio
  we własnym ciele, nie przez `runDiplomacyTurnTick`) → **isMe** (ten sam precedens co
  `runDiplomacyTurnTick`). **To pojedynczy największy nieujęty blok tej rundy — zasługuje na
  własny podetap, patrz §6.**

## 5. Dev-harness / `diplomacy-border-march.ts` / `forced-war-*.ts` — POZA zakresem migracji
- `game/forced-war-bronze.ts`, `game/forced-war-stone.ts`, `game/diplomacy-border-march.ts` —
  świeży `grep -nE "===0|!==0|,\s*0\)|\(0,"` nad wszystkimi trzema: **ZERO trafień** (jedyny
  hit w border-march to `Math.max(0, Math.min(100, z))`, false-positive niezwiązany z
  ownerId). Pliki są już parametryzowane, migracja niepotrzebna. Import main.ts:1109/1122/1346
  potwierdza brak literałowych wywołań na granicy.
- `forceBronzeForcedWarDominoOnPlayer` (main.ts ok. 21924-22050+, dryf względem 21895-22000 z
  recon 1) — dev/test hook (nazwa jawnie "OnPlayer"), `setDiploRelation(attackerId,targetId,...)`,
  `getDiploRelation(attackerId,0)`/`(targetId,0)`, `activeDeals.push({strony:[0,sideOwner]})`.
- `doStartPlaytestWalkaMapy` (34886+): L35040 `setDiploRelation(0,preset.aiOwnerId,{...
  status:'wojna'})`.
- `doStartPlaytestMapaSwiata` (35398+): L35510 ten sam wzorzec — **dispatch nazwał to zbiorczo
  "playtestWalkaMapy-owe", ale to DWIE odrębne funkcje** (`doStartPlaytestWalkaMapy` i
  `doStartPlaytestMapaSwiata`), korekta nazewnictwa dla przyszłego dispatchu.
- **NOWE odkrycie (nieujęte w żadnym poprzednim reconie):** dwa kolejne testowe hooki
  Playwright na `window`, ten sam wzorzec co wyżej: `__dyploMapaOdkrycieTestDebug` (main.ts ok.
  19487, `prepareContact` woła `setDiploRelation(0,ownerId,...)` na L19516) i
  `__audienceRelTestDebug` (main.ts ok. 22275, `setDiploRelation(1,2,...)` na L22281 — **ten
  jeden NIE hardkoduje gracza=0**, więc technicznie poza kryterium dispatchu, ale wart
  wymienienia dla kompletności rodziny hooków).
Wszystkie POZOSTAJĄ poza zakresem migracji bez osobnej, jawnej decyzji właściciela — zgodnie z
dispatchem (ryzyko: dev-harness może celowo testować z literałem 0).

## 6. Propozycja podziału na podetapy implementacyjne
Kryterium podziału: mechanika + rozmiar (1-2 rundy Operator→Evaluator każdy, wzorem ENGINE).

**Podetap A — "Wypowiedzenie wojny gracza" (mały, ok. 9 miejsc, ryzyko NISKIE)**
Wyłącznie `playerDeclareWarOnOwner` (§1). Sąsiaduje z już zmigrowaną `ownerDeclareWarOn` — jeden
plik, jeden mały blok, izolowany funkcjonalnie (akcja gracza). Dobry pierwszy podetap: mały,
bezsporny alias (isMe), niski koszt weryfikacji regresji.

**Podetap B — "HUD/panel dyplomacji" (średni, ok. 24 miejsca z §2, ryzyko ŚREDNIE — wymaga
Chromium)** 15 funkcji renderujących/zasilających UI (poprawiona liczba rundy 2 — poprzednia
"13" w rundzie 1 była niespójna z listą 16 nazw pomniejszoną o `applyProposalOutcome`, wyłączoną
jako "NIE ma hardkodu") (relationColorFn, unitRingStanceForPlayer,
playerFormalRelationLabel, cityMapOutlineKindForOwner, buildPlayerDiploRelations,
buildDiploPairSummaryData, buildAudienceActions, buildPendingNegotiationRows,
foreignCivsMissingTradeTreatyForCity, collectDiploChipCounts,
enqueueNegotiationFromAiCmd, buildEmpireDetailSnap, applyBorderMarchPenaltiesEndTurn,
currentVisibleForOwner, peacefulArchetypeForOwner) — `handleNegotiationReject` PRZENIESIONA do
nowego Podetapu E (poprawka rundy 2, patrz niżej) — wszystkie isMe, wzorem precedensu 6c/ENGINE
dowód no-op wymaga żywego Chromium (panel audiencji, mapa, HUD) — zgodnie z §9 pkt 6(a)
R-PROC-AUTOBOT.

**Podetap C — "Silnik: inicjalizacja i save/load" (mały-średni, ok. 7-9 miejsc, ryzyko ŚREDNIE
— dotyka `applyClusterStartPlan` = tworzenie świata i `restoreGameFromSave` = wczytywanie, oba
wysokiego ryzyka regresji przy błędzie)** applyClusterStartPlan, spawnPendingSameTypeRivals,
finalizeAllianceObligationRefusals (po rozstrzygnięciu isMe/isHuman z §3), resolvePendingDiplomacy
(po pełnym Read), restoreGameFromSave. Bramka referencyjna: pełny cykl save→load w bramce
istniejącej + `tsc --noEmit`.

**Podetap D — "Duplikat tick w runWorldEndTurn" (średni, ok. 24 miejsca z §4, ryzyko WYSOKIE —
serce pętli tury świata, wysoka gęstość logiki AI-vs-gracz i AI-vs-AI w jednej funkcji)** Blok A
+ Blok B z §4, osobno od pozostałych bo to jedna ogromna funkcja (`runWorldEndTurn`) dzielona z
resztą silnika końca tury — wymaga najostrożniejszej izolacji przez Evaluatora (ryzyko konfliktu
z równoległymi lanami dotykającymi end-turn, jak 6e-render). Rekomendacja: dispatchować jako
OSTATNI, po ustabilizowaniu A-C.

**Podetap E — "Stół negocjacyjny / audiencja" (NOWY w rundzie 2, zarzut 1 Evaluatora — duży,
14 funkcji z §1b, ok. 22 hardkody, ryzyko ŚREDNIE-WYSOKIE — wymaga Chromium dla ścieżek UI
(handleNegotiationAccept/Counter/Reject, previewNegotiationEntry, negotiationSummary) i osobno
weryfikacji silnikowej dla ścieżek bez UI (collectTurnEvents, collectOpenDiploProposalQueue,
resolvePendingNegotiationsForOwner, resolveNegotiationEntryAt))** Cała rodzina operująca na
`negotiationTable`: negotiationPartnerOwnerIdOf, resolveNegotiationEntryAt,
resolvePendingNegotiationsForOwner, handleNegotiationAccept, handleNegotiationCounter,
handleRequestAiNegotiationResponse, getNegotiationsForPair, negotiationSummary,
previewNegotiationEntry, collectTurnEvents, collectOpenDiploProposalQueue,
openDiplomacyAudienceForNegotiation, actionableNegotiationIdsForPair,
findIncomingNegotiationForAction — wszystkie isMe/ME(), ten sam moduł logiczny (stół
negocjacyjny), dlatego jeden podetap a nie rozproszenie po B/C. Rekomendacja: dispatchować PO
Podetapie A, PRZED B (dzieli literały `0` z `handleNegotiationReject`, już przeniesionej z §2 do
tej rodziny logicznie — patrz poprawka §2 rundy 2 — więc B powinien czekać, żeby nie dzielić
jednego pliku logicznego na dwa równoległe lany).

**Poprawka §6 (runda 2, zarzuty 2-3 Evaluatora, PRZYJĘTE):** Podetap B traci
`handleNegotiationReject` na rzecz nowego Podetapu E (przynależy tam logicznie, nie do HUD/panel
ogólnego) — licznik B spada z 25 do **ok. 24 miejsc** (16→15 funkcji, jedna mniej — POPRAWKA
RUNDY 5: rundy 2-4 błędnie pisały "13 funkcji" mimo że lista obok wymienia 15 nazw; 15 jest
liczbą poprawną, zgodną z listą). Podetap C zyskuje
drugi hardkod `restoreGameFromSave` (36533, poprawka zarzutu 3) — bez zmiany listy funkcji (już
tam była), licznik C rośnie z ok. 6-8 do **ok. 7-9 miejsc**.

Podetapy A-E sumują się do **ok. 88 nowych miejsc** (9+24+9+24+22 — POPRAWKA RUNDY 5: składnik A
podniesiony z 7 na 9, zgodnie z korektą §1, zaokrąglone, bez podwójnego liczenia call-site vs.
body-internal) — wzrost o ok. 23 względem błędnej sumy rundy 1 (65), w większości z nowego
Podetapu E plus poprawka Podetapu A. Floor całościowy z pierwotnego recon (≥136) obejmował też
literały już policzone w 20 zmigrowanych i w §5 (poza zakresem), więc liczby nie sumują się 1:1
do ≥136; to jest znane ograniczenie metody, nie sprzeczność (patrz RECON-DIPLOMACY-Q1 §4).

BLOKADY: `finalizeAllianceObligationRefusals` i `resolvePendingDiplomacy` mają NIEROZSTRZYGNIĘTY
alias (isMe vs isHuman) — wymaga pełnego Read ciała przy dispatchu Podetapu C, nie w tej rundzie
(budżet recon). `runWorldEndTurn` Blok A/B ma przybliżone, nie brace-matched dokładnie granice
(funkcja jest bardzo duża, async, zagnieżdżone domknięcia) — dokładne linie startu/końca do
potwierdzenia przy dispatchu Podetapu D.
ZMIANY/COMMIT: ten plik, brak zmian w `gra/`.
TESTY: brak (recon-only, docs-only) — metoda i cytaty udokumentowane wyżej.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator ocenia kompletność poprawki rundy 2 (rodzina §1b, korekty §2/§3,
przeliczony §6 A-E); po PASS — orkiestrator albo dispatchuje Podetap A bezpośrednio, albo
przedstawia właścicielowi wybór kolejności/aliasu spornego (§3 finalizeAllianceObligationRefusals/
resolvePendingDiplomacy).
DEPLOY/PUSH: NIE WYKONANO
