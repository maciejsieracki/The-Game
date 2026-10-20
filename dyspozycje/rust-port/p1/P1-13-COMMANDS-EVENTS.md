# P1.13 — Katalog komend, eventów i przejść stanu (web, referencja read-only)

**Temat:** R-RUSTPORT-P1-13-COMMANDS-EVENTS-Q1 · **Runda:** 2/5 · **Rola:** Operator, obrona (Haiku 5.5 medium)
**Pin webowy:** `main` = `edb8fb56` (wszystkie ścieżki i linie odnoszą się do tego commita)
**Metoda:** `git archive edb8fb56 gra/src` do katalogu roboczego poza repo (scratchpad); worktree repo (inna gałąź, bez `edb8fb56` jako HEAD) NIE był używany jako źródło odczytu. Zapis katalogu następuje w allowliście w worktree (patrz sekcja „Izolacja” w odpowiedzi rundy 2). Zero zapisu w `gra/**`.
**Zakres:** `gra/src/main.ts` (39 350 linii w pinie) oraz `gra/src/game/*.ts` (183 pliki), plus typy `ui/*` i `map/*`/`battle/*` tam, gdzie są typami komend/akcji/eventów gracza.
**Konwencja:** `ścieżka:linia` — cytat z kodu w backtickach. Wpisy bez cytatu nie wchodzą do katalogu.

> Uwaga architektoniczna dla portu: web NIE ma busa zdarzeń (`emit`/`CustomEvent` = 0 trafień w `gra/src`, `dispatchEvent` tylko na `Event('input')`/`Event('resize')`). Komendy są typami unii + bezpośrednimi wywołaniami funkcji, a przejścia stanu są zaszyte w sekwencji `triggerPlayerEndTurn → endActiveHumanTurn → runWorldEndTurn` w jednej domknięciowej funkcji `boot()`.

---

## A. Komendy / akcje

### A1. Komendy AI (jednostki i miasta) — `AICommand`

Deklaracja: `gra/src/game/ai.ts:156` — `export type AICommand =`

| Typ | Ścieżka:linia (deklaracja) | Cytat | Egzekucja w main.ts |
|---|---|---|---|
| `move` | `game/ai.ts:85` | `export interface AICmdMove { type: 'move';` | `main.ts:34836` `if (cmd.type === 'move') {` |
| `foundCityAt` | `game/ai.ts:95` | `export interface AICmdFoundCityAt { type: 'foundCityAt';` | `main.ts:34928` `if (cmd.type === 'foundCityAt') {` |
| `attack` | `game/ai.ts:102` | `export interface AICmdAttack { type: 'attack';` | `main.ts:34977` `if (cmd.type === 'attack') {` |
| `build` | `game/ai.ts:109` | `export interface AICmdBuild { type: 'build';` | `main.ts:35038` `if (cmd.type === 'build') {` |
| `buildImprovement` | `game/ai.ts:142` | `export interface AICmdBuildImprovement { type: 'buildImprovement';` | `main.ts:35227` `if (cmd.type === 'buildImprovement') {` |
| `endTurn` | `game/ai.ts:151` | `export interface AICmdEndTurn { type: 'endTurn';` | `main.ts:34831` `if (cmd.type === 'endTurn') {` (no-op) |

Pętla wykonująca: `main.ts:34831`–`35227`, wewnątrz `runWorldEndTurn` (`main.ts:31169`). Liczba członków: **6**.

### A2. Komendy dyplomatyczne AI — `AIDiplomacyCommand`

Deklaracja: `gra/src/game/ai.ts:5039` — `export type AIDiplomacyCommand =`

| Typ | Linia (deklaracja) | Cytat | Obsługa |
|---|---|---|---|
| `wypowiedz_wojne` | `game/ai.ts:5040` | `{ type: 'wypowiedz_wojne'; targetId: string; powod: string }` | `main.ts:34392` `if (cmd.type === 'wypowiedz_wojne') {` |
| `zaproponuj_pokoj` | `game/ai.ts:5041` | `{ type: 'zaproponuj_pokoj'; ... }` | `main.ts:34512` → `enqueueDiplomacyPendingFromCmd` (`main.ts:16806`) → `enqueueNegotiationFromAiCmd` (`main.ts:16840`) |
| `zadaj_trybut` | `game/ai.ts:5042` | `{ type: 'zadaj_trybut'; ... }` | `main.ts:34514` → `enqueueDiplomacyPendingFromCmd` |
| `oferuj_trybut_za_pokoj` | `game/ai.ts:5043` | `{ type: 'oferuj_trybut_za_pokoj'; ...; goldOnce?: number }` | `main.ts:34516` → `enqueueDiplomacyPendingFromCmd` |
| `zaproponuj_sojusz` | `game/ai.ts:5044` | `{ type: 'zaproponuj_sojusz'; ...; allianceKind?: 'defensywny' \| 'pelny' }` | `main.ts:34518` → `enqueueDiplomacyPendingFromCmd` |
| `zaproponuj_handel` | `game/ai.ts:5045` | `{ type: 'zaproponuj_handel'; ...; goldOnce?: number }` | `main.ts:34520` → `enqueueDiplomacyPendingFromCmd` |
| `zaproponuj_umowe_handlowa` | `game/ai.ts:5046` | `{ type: 'zaproponuj_umowe_handlowa'; ...; sweetenerGold?: number }` | `main.ts:34522` → `enqueueDiplomacyPendingFromCmd` |
| `zaproponuj_handel_surowiec` | `game/ai.ts:5047`–`5053` | `type: 'zaproponuj_handel_surowiec'; ... surowiecKey; ... zaplataTyp: 'zloto' \| 'praca'` | gracz: `main.ts:34524`; AI→AI: `main.ts:34529` → `applyAiAiHandelSurowiecCmd` (`main.ts:19623`) |
| `zaproponuj_pakt` | `game/ai.ts:5054` | `{ type: 'zaproponuj_pakt'; ...; turns?: number }` | `main.ts:34526` → `enqueueDiplomacyPendingFromCmd` |
| `zaproponuj_audiencje` | `game/ai.ts:5055`–`5059` | `type: 'zaproponuj_audiencje'; ...; motive?: string` | `main.ts:34380`–`34381` `applyAiAudienceRequest(ownerId, cmd)` (`main.ts:19680`); odfiltrowany z `dipCmds` w `main.ts:34385` |

Powiązane przełączniki (etykiety i routing): `main.ts:16793` `diploPendingTitle` (7 `case`), `game/diplomacy-proposals.ts:1769`, `:1788`, `:1841` (`switch (cmd.type)`), `game/diplomacy-proposals.ts:1826` `aiCommandToPendingProposal`. Liczba członków: **10**.

### A3. Komendy barbarzyńców — `BarbCommand`

Deklaracja: `gra/src/game/barbarians.ts:243` — `export type BarbCommand = BarbCmdMove | BarbCmdAttack | BarbCmdRaid;`

| Typ | Deklaracja | Egzekucja w main.ts |
|---|---|---|
| `move` | `game/barbarians.ts:217` (`BarbCmdMove`) | `main.ts:35604` `if (bcmd.type === 'move') {` |
| `attack` | `game/barbarians.ts:225` (`BarbCmdAttack`) | `main.ts:35652` `} else if (bcmd.type === 'attack') {` |
| `raid` | `game/barbarians.ts:235` (`BarbCmdRaid`) — „rajd Ludów Morza” | `main.ts:35634` `} else if (bcmd.type === 'raid') {` |

Pętla: `main.ts:35604`+ (`for (const bcmd of barbCmds)`), wewnątrz `runWorldEndTurn`. Liczba członków: **3**.

### A4. Propozycje dyplomatyczne (UI → silnik) — `ProposalActionId`

Deklaracja: `gra/src/game/diplomacy-proposals.ts:68` — `export type ProposalActionId =`

Członkowie (linia = `diplomacy-proposals.ts:<n>`): `'nap'`:69, `'sojusz_defensywny'`:70, `'sojusz_pelny'`:71, `'handel'`:72, `'umowa_handlowa'`:77 (alias AI), `'umowa_szlakow'`:79, `'trybut_zadanie'`:80, `'trybut_oferta'`:81, `'granice'`:82, `'tech'`:83, `'namow_wojne'`:84, `'ultimatum'`:85, `'wasal'`:86, `'wchloniecie'`:88, `'pokoj'`:90. Liczba członków: **15**.

Konsumenci i pokrycie (zweryfikowane w rundzie 2 na `edb8fb56`):

| Konsument | Ścieżka:linia | Pokrycie członków |
|---|---|---|
| `evaluateProposal` — `switch (actionId)` | `game/diplomacy-proposals.ts:1038` (`case 'nap'`:1039, `case 'sojusz_defensywny'`:1087, `case 'trybut_zadanie'`:1144, `case 'pokoj'`:1189, `case 'trybut_oferta'`:1348, `case 'handel'`:1380, `case 'umowa_handlowa'`:1472, `case 'umowa_szlakow'`:1473, `case 'namow_wojne'`:1563, `case 'tech'`:1579, `case 'granice'`:1622, `case 'ultimatum'`:1673, `case 'wasal'`:1684, `case 'wchloniecie'`:1707, `default`:1746) | **15/15** — pełne pokrycie |
| `resolvePlayerAcceptsAiPending` — `switch (actionId)` | `game/diplomacy-proposals.ts:1994` (`case 'nap'`:1995, `case 'sojusz_defensywny'`:2020, `case 'pokoj'`:2032, `case 'granice'`:2034, `case 'tech'`:2063, `case 'namow_wojne'`:2078, `case 'ultimatum'`:2081, `case 'wasal'`:2084, `case 'handel'`:2101, `case 'umowa_handlowa'`:2138, `case 'umowa_szlakow'`:2139, `case 'trybut_zadanie'`:2159, `case 'trybut_oferta'`:2175, `default`:2194 → `'Nieznana akcja dyplomatyczna'`) | **14/15 — BRAK `'wchloniecie'`** (patrz niżej) |
| etykiety stołu — `switch (entry.actionId)` | `main.ts:17507` (`case 'nap'`:17508 … `default`:17538) | etykiety z `default` (nie wymaga pełnego pokrycia) |

**Luka `wchloniecie` w `resolvePlayerAcceptsAiPending` (statycznie ustalona, NIE uruchomiona):** wywołania `main.ts:17267` (gracz akceptuje wpis przychodzący z `isMe(awaitingOwnerId)`), `main.ts:17837` i `main.ts:17957` przekazują wpis do tego switcha. Wpis `'wchloniecie'` powstaje z UI (`ui/diplomacyTradeBasket.ts:1411` `if (actionId === '15') return 'wchloniecie'`, przycisk `'15'`). `NEGOTIATION_NO_ENGINE_COUNTER` jest pusty (`game/diplomacy-proposals.ts:2239`–`2241`), a `canCounterNegotiation` (`:2365`) nie wyklucza `'wchloniecie'`, więc auto-kontroferta zachowuje `actionId` (`generateCounterOffer`, `:2536`–`2537`). Ścieżka „kontroferta na wchłonięcie → akceptacja gracza” daje `accepted:false` przez `default` (`:2194`). Ścieżka nie została wykonana w runtime — P2.5 musi ją uwzględnić.

### A5. Akcje na mapie: kliknięcie wrogiego miasta — `MapEnemyCityClickAction`

Deklaracja: `gra/src/map/map-attack-city.ts:18`. Członkowie: `not_enemy`:19, `siege_panel`:20, `attack_choice`:21, `field_battle`:22, `capture_empty`:23, `hint_city_not_visible`:24, `hint_no_adjacent`:25, `hint_civilian`:26, `hint_pick_attacker`:27.
Dispatcher: `main.ts:26513` `switch (action.kind)` — **pokrywa wszystkie 9** (`case` w `main.ts:26514`, `26522`, `26530`, `26533`, `26540`, `26543`, `26551`, `26557`, `26565`). Liczba członków: **9**.

### A6. Akcje jednostki z HUD — `handleSelectedUnitHudAction`

Funkcja: `main.ts:21857` `function handleSelectedUnitHudAction(actionId: string): void {`. Łańcuch `if/else if` po `actionId` (nie typowany, id to literały):
`'rally-set'`:21862, `'rally-launch'`:21871, `'rally-clear'`:21873, `'march-continue'`:21878, `'march-stop'`:21880, `'skip'`:21882, `'unfortify-all'`:21893, `'fortify'`:21910, `'disband'`:21977, `'split'`:21979, `'merge'`:21981, `'replace'`:21983, `'sentry'`:21985, `'scout-explore'`:22002. Liczba: **14**.
Typ `UnitPanelAction` (`ui/unitPanelHud.ts:21`, `id: string`): ids są literałami w `main.ts` (miejsca `actions.push`/`id:` w `main.ts:21708`–`21840`, zestawienie w A11). Id `'split'`/`'merge'` pochodzą z typowanego `game/armyMerge.ts:687`. Id `'march-continue'` ma tylko gałąź w handlerze (`main.ts:21878`); literalnego miejsca dodania nie znaleziono (grep `'march-continue'` = 1 trafienie w `main.ts`).

### A7. Akcje na przycisku dyplomacji (siatka akcji) — id akcji `data/diplomacy.json`

Mapowanie przycisków: `ui/diplomacyAudience.ts:1651`–`1659` (`ACTION_BAR_SPECS`): `'11'`:1651 (Wypowiedz wojnę), `'10'`:1652 (Zaproponuj pokój), `'3'`:1653 (Sojusz), `'2'`:1654 (Pakt o nieagresji), `'5'`:1655 (traktat handlowy), `'14'`:1656 (Umowa wymiany), `'13'`:1657 (Przekaż dar), `'12'`:1658 (Wasalizacja), `'15'`:1659 (Wchłonięcie). Liczba: **9**.
Obsługa: `main.ts:21260` `function applyAudienceAction(ownerId, actionId, payload?)`; jawnie: `main.ts:21278` `if (actionId === '11')`, `main.ts:21289` `case '10':`, `main.ts:21293` `case '5':`, `main.ts:21297` `case '14':` (wszystkie cztery to komunikaty „użyj koszyka/przycisku na stole”).

**Ścieżka przycisków `'3'`, `'2'`, `'13'`, `'12'`, `'15'` (prześledzona w rundzie 2; NIE mają gałęzi `case` w `applyAudienceAction`, obsługują je inne ścieżki):**
1. Klik: listener `ui/diplomacyAudience.ts:2265`–`2315` (`button[data-aid]`). Dla `aid` z `getNegotiationContext` i `actionUsesTradeBasket(aid)` otwiera koszyk: `showTradeBasketModal` (`:2280`–`2285`, `onAction(ownerId, aid, payload)`). Zbiór `TRADE_BASKET_ACTION_IDS` = `'2','3','4','6','7','8','9','10','12','13','14','15'` (`ui/diplomacyTradeBasket.ts:2818`–`2820`) zawiera wszystkie pięć id.
2. Payload → `applyAudienceAction` gałąź `if (payload)` (`main.ts:21269`–`21275`) → `handleNegotiatedProposal` (`main.ts:21108`) → `buildProposalFromPayload` (`main.ts:21010`) → `proposalActionIdFromPayload` (`ui/diplomacyNegotiationModal.ts:549`–`562`): `'13'`→`'handel'`, `'3'`→`'sojusz_defensywny'`/`'sojusz_pelny'`, `'2'`→`'nap'`, `'12'`→`'wasal'`, `'15'`→`'wchloniecie'`.
3. Fallback bez kontekstu negocjacji (`getNegotiationContext` zwraca `null` lub akcja nieaktywna): `cfg.onAction(ownerId, aid)` bez payloadu (`ui/diplomacyAudience.ts:2315`) → `applyAudienceAction` → `default` (`main.ts:21301`–`21302`): `showHintMessage('Akcja dyplomatyczna (wkrótce): ' + civName, 3000)` — **atrapa**, nie wykonuje akcji.
4. `actionNeedsNegotiation` (`ui/diplomacyNegotiationModal.ts:148`–`150`, zbiór `'6','7','9','10'` z `:146`) dla tych pięciu id zwraca `false`, więc modal stołu negocjacyjnego nie jest używany.

Pozostałe id emitowane przez builder audiencji, których **nie ma** na pasku (`'4'`, `'6'`, `'7'`, `'8'`, `'9'`), są dostępne z kafelka „Możliwe umowy” (`ui/diplomacyAudience.ts:1824`, `data-aid`); ich downstream **nie został prześledzony** w rundzie 2 (sekcja D).

### A8. Komendy stołu negocjacyjnego (gracz)

| Funkcja | Ścieżka:linia | Rola |
|---|---|---|
| `resolveNegotiationEntryAt` | `main.ts:17113` | rozstrzyga wpis |
| `resolvePendingNegotiationsForOwner` | `main.ts:17191` | rozstrzyga kolejkę właściciela |
| `handleNegotiationAccept` | `main.ts:17230` | akceptacja |
| `handleNegotiationReject` | `main.ts:17280` | odrzucenie |
| `handleNegotiationRemove` | `main.ts:17314` | usunięcie wpisu |
| `handleNegotiationAcceptPackage` | `main.ts:17377` | akceptacja koszyka |
| `handleNegotiationRejectPackage` | `main.ts:17397` | odrzucenie koszyka |
| `handleNegotiationCounter` | `main.ts:17411` | kontrpropozycja |
| `handleNegotiationEditOwn` | `main.ts:17442` | edycja własnej oferty |
| `handleRequestAiNegotiationResponse` | `main.ts:17467` | żądanie odpowiedzi AI |
| `resolvePendingDiplomacy(id, accept)` | `main.ts:17807` | rozstrzygnięcie propozycji |
| `handleNegotiatedProposal` | `main.ts:21108` | wykonanie zaakceptowanej oferty |
| `applyProposalOutcome` | `main.ts:20605` | skutek propozycji |

### A9. Komendy ruchu, miast i wojny (gracz)

| Komenda | Ścieżka:linia | Cytat / uwaga |
|---|---|---|
| ruch wybranej jednostki | `main.ts:26036` `function beginMoveSelectedUnitTo(destQ, destR): boolean` | wykonanie: `main.ts:25457` `startAnimatedMove` |
| wycofanie/zakończenie planowanego marszu | `main.ts:25701` `runPlannedMarchesAtPlayerEndTurn` | wołane w `main.ts:35983` |
| założenie miasta (klik) | `main.ts:13504` `handleFoundCityMapClick` | |
| budowa z panelu | `main.ts:13691` `applyBuildRequest(req: ImprovementBuildRequest)` → `main.ts:13787` `commitBuildRequest` | |
| podział pracy miasta | `main.ts:5611` `applyCityPodzialPracyChange` | |
| okolica (worked tile) | `main.ts:5784` `applyOkolicaTileAdjust` | |
| wypowiedzenie wojny przez gracza | `main.ts:10603` `playerDeclareWarOnOwner` → `main.ts:10646` `ownerDeclareWarOn` | |
| oblężenie miasta | `main.ts:14920` `startMapSiege`, `main.ts:14851` `commitBesiege`, `main.ts:14831` `endMapSiege`, `main.ts:14637` `resolveSiegeSurrender` | |
| tajne oblężenie | `main.ts:30029` `executeSilentSiegeStorm` | |
| fokus stolicy dyplomacji | `main.ts:28716` `handleDiploFocusCapital` | |
| zamknięcie wpisu panelu zdarzeń | `main.ts:22293` `handleSidePanelEventDismiss` | |

### A10. Wejścia klawiaturowe i myszy (gracz)

Listenery: `main.ts:26121` (`window keydown`, F9/F10/Ctrl+Shift+D), `main.ts:36106` (`window keydown`, gra), `main.ts:26204` `mousedown`, `:26209` `contextmenu`, `:26230` `mousemove`, `:26337` `mouseup`, `:26714` `dblclick` (canvas).

| Klawisz | Ścieżka:linia | Akcja |
|---|---|---|
| F9 | `main.ts:26122` `if (e.key === 'F9') {` | przełącz overlay wydajności `togglePerfDebugOverlay` (dev) |
| F10 | `main.ts:26127` | przełącz panel diagnostyczny `toggleDiagPanel` |
| Ctrl+Shift+D | `main.ts:26132` | kopia raportu diagnostycznego `copyDiagReport` |
| Escape | `main.ts:36108` | zamknij panel miasta / tryb budowy / dialog zapisu |
| Space | `main.ts:36131` | `cycleToAdjacentPlayerUnit(selectedId, 1)` (tylko w trybie jednostek) |
| F | `main.ts:36157` | dev-only (`FOG_DEV_SHORTCUTS`) |
| M | `main.ts:36167` | dev-only `toggleDevRevealAllLand` |
| G | `main.ts:36141` | dev-only (`GALLERY_DEV_SHORTCUT`) |
| N | `main.ts:36223` `if (e.code === 'KeyN' \|\| ...)` → `advanceSeat()` (`main.ts:36230`) | **zakończ turę** (skrót) |

---

### A11. Literały i callbacki UI (rozstrzygnięcie luk rundy 1, runda 2)

- **`EntityCardAction`** (`ui/entityCards/types.ts:117`, `id: string`, `onClick`): jedyne literały producenta to `ui/techDiscoveryNotice.ts:599` `id: 'research'` (Rozpocznij badanie) i `:605` `id: 'tree'` (Otwórz drzewo). Adaptery `ui/entityCards/*Adapter.ts` nie budują elementów tego typu. Renderer: `ui/entityCards/renderer.ts:538`. Nowe: **2**.
- **`UnitPanelAction`** (`ui/unitPanelHud.ts:21`): ids z `main.ts` są już w A6, poza jednym: `main.ts:21725` `actions.push({ id: 'siege-hold', label: 'Oblega', disabled: true })` — brak gałęzi w `handleSelectedUnitHudAction`, przycisk `disabled` (`ui/unitPanelHud.ts:167`), więc kliknięcie nie wywołuje `onAction`. Nowe: **1** (`siege-hold`, martwy).
- **`SiegeMapPanelActions`** (`ui/siegeMapPanel.ts:13`) — wpięte w `main.ts:14893` (`const siegePanelActions = {`):
  - `onBesiege` `main.ts:14894` → `commitBesiege(cityId)` (`main.ts:14851`);
  - `onStorm` `main.ts:14896` → `launchSiegeStormFromMap(ctx)` (`main.ts:30086`);
  - `onRetreat` `main.ts:14897`–`14907` → `endMapSiege(cityId)` (`main.ts:14831`) + przywrócenie podświetlenia zasięgu i hint „Odwrót — oblężenie zakończone.”;
  - `onQueueMachine` `main.ts:14908` → `queueSiegeMachine(city, kind)` (taran/wieża, limit 4);
  - `isMe` `main.ts:14895` — hook odczytu, nie komenda.
- **`CityAttackChoiceActions`** (`ui/cityAttackChoice.ts:21`) — wpięte w `main.ts:15035`–`15039` (`showCityAttackChoice(ctx, {`): `onSiege` `main.ts:15036` → `startMapSiege(ctx)` (`main.ts:14920`); `onStorm` `main.ts:15037` → `launchSiegeStormFromMap(ctx)`; `onCancel` `main.ts:15038` → `() => {}` (bez efektu). Drugi punkt wpięcia: `main.ts:26525`–`26526` (dispatcher A5).
- **`AudienceAction`** (`ui/diplomacyAudience.ts:60`, `id: string`): ids nie są unią literałów. Źródło: `data/diplomacy.json` → `akcje_dyplomatyczne` (`gra/data/diplomacy.json:220`), id = cyfry z prefiksu etykiety (`game/diplomacy-audience-actions.ts:22`–`25`, `diplomacyActionIdFromLabel`). Builder pomija `'1'` (`game/diplomacy-audience-actions.ts:58`, „kontakt osobno”) i emituje **14** id: `2,3,4,5,6,7,8,9,10,11,12,13,14,15`. Z tego 9 jest na pasku (A7), a `4`, `6`, `7`, `8`, `9` tylko z kafelka „Możliwe umowy” (`ui/diplomacyAudience.ts:1824`); ich downstream nie był śledzony w rundzie 2 (sekcja D).

---

## B. Eventy i przejścia stanu

### B1. Zdarzenia dyplomatyczne — `DiplomaticEvent`

Deklaracja: `gra/src/game/diplomacy.ts:810`. Konsument: `game/diplomacy.ts:863` `export function applyDiplomaticEvent(`, `switch (event)` w `game/diplomacy.ts:875`. **Każdy z 23 członków ma `case`** (`diplomacy.ts:879`–`1025`).

| # | Członek | Deklaracja | `case` |
|---|---|---|---|
| 1 | `wojna_wypowiedziana` | 812 | 879 |
| 2 | `pokoj` | 813 | 886 |
| 3 | `handel` | 815 | 894 |
| 4 | `wspolny_wrog` | 816 | 899 |
| 5 | `zlamana_obietnica` | 818 | 907 |
| 6 | `zlamana_obietnica_ai` | 819 | 912 |
| 7 | `zdrada` | 820 | 917 |
| 8 | `tarcia_graniczne` | 821 | 923 |
| 9 | `dar` | 823 | 945 |
| 10 | `wspolna_religia` | 824 | 950 |
| 11 | `pomoc_sojusznikowi` | 825 | 955 |
| 12 | `wygrana_bitwa` | 827 | 962 |
| 13 | `przewaga_militarna` | 828 | 967 |
| 14 | `slabszy_militarnie` | 829 | 972 |
| 15 | `trybut_zaakceptowany` | 830 | 977 |
| 16 | `wojna_casus_belli` | 835 | 984 |
| 17 | `ultimatum_spelnione` | 836 | 991 |
| 18 | `ultimatum_bezpodstawne` | 837 | 996 |
| 19 | `trybut_odmowa` | 838 | 1003 |
| 20 | `trybut_oferta_przyjeta` | 839 | 1008 |
| 21 | `wymiana_tech_gratis` | 840 | 1013 |
| 22 | `zerwanie_handlu` | 841 | 1018 |
| 23 | `zerwanie_traktatu` | 843 | 1025 |

Konsumenci zdarzeń: `main.ts:9890` `applyDiploEventTracked`, `main.ts:9916` `applyPnTrustForPair`. Przejścia statusu wojny w tym samym switchu: `diplomacy.ts:1417`–`1419` (`StanWojny.Wojna` / `CasusBelli`).

### B2. Zdarzenia wiarygodności (kary/nagrody) — `CredibilityEvent`

Deklaracja: `gra/src/game/diplomacy-credibility.ts:92`. Członkowie (15): kary N1–N7 `:94`–`:102` (`wypowiedzenie_wojny_bez_ostrzezenia`, `zlamanie_paktu_nap`, `zlamanie_paktu_sojusz`, `atak_w_oknie_karencji`, `odmowa_obowiazku_sojuszu`, `zerwanie_dobrowolne_traktat`, `zerwanie_dobrowolne_handel`, `niedotrzymanie_handlu_cyklicznego`, `nieautoryzowany_przemarsz`); nagrody FINISZ `:104`–`:107` (`dotrwanie_sojuszu`, `dotrwanie_nap`, `dotrwanie_handlu`, `splata_handlu_cyklicznego`); nagrody CZYNY `:109`–`:110` (`wieloletni_pokoj`, `pomoc_sojusznikowi_realna`).

Duplikat literałów: `game/wiarygodnosc-types.ts:27` `export type WiarygodnoscEventTyp` — te same 15 id (linie `:29`–`:45`). Dwa niezależne typy o identycznym zbiorze — kandydat do jednego źródła w P2.

### B3. Strumień wiarygodności — `CredibilityStreamEvent`

`gra/src/game/diplomacy-credibility.ts:259`: `strumien_sojusz`:260, `strumien_nap`:261, `strumien_handel`:262, `strumien_przemarsz`:263. Liczba: **4**. Model: licznik `sumaAktywna` (`diplomacy-credibility.ts:280`+), usuwany po końcu zobowiązania.

### B4. Zdarzenia sojuszu — `AllianceEvent`

`gra/src/game/diplomacy-treaties.ts:164`: `{ type: 'attacked'; victimOwnerId; aggressorOwnerId }` (`:165`), `{ type: 'declared_war'; declarerOwnerId; targetOwnerId }` (`:166`). Liczba: **2**. Konsument w `main.ts:20035` `applyAllianceObligationsOnWar(attackerId, victimId)`.

### B5. Rodzaje wpisów panelu zdarzeń i ich linki

- `SidePanelEventKind` — `ui/sidePanelHud.ts:29`: `science`, `culture`, `city`, `unit`, `enemy`, `info`, `diplo` (**7**).
- `SidePanelEventLinkKind` — `game/side-panel-event-link.ts:28`: `diplo-wars`:30, `civ-elim`:32, `map-focus`:34, `city-panel`:36, `empire-spichlerz`:38, `tech-tree`:40 (**6**). Routing: `main.ts:15712` `sidePanelEventLinkFor`, `main.ts:15715` `switch (kind)`, aktywacja `main.ts:15751`–`15753` `switch (link.kind)`.
- `collectTurnEvents` (źródło listy): `main.ts:15615`.
- `executeFirstBlockingEvent` — `main.ts:14271`: routing po prefiksie `id`: `diplo-pend-` → `openDiplomacyPendingById` (`main.ts:17867`); `negot-` → `openDiplomacyAudienceForNegotiation`; `cityIdFromRevoltEventId` / `cityIdFromProdEmptyEventId` → `openCityPanelForPlayer`.
- `EotEventDraft.kind` — `game/eot-event-defer.ts:101`–`112`: `'info' | 'diplo'` (**2**), odłożone hinty końca tury.
- `InterHumanProposalKind` — `ui/interHumanDiplomacyHud.ts:25`: `zaproponuj_pokoj`:26, `zaproponuj_sojusz`:27, `zaproponuj_pakt`:28, `zaproponuj_audiencje`:29 (**4**).
- `DiploPlayerAction` — `ui/diplomacyPanel.ts:28`: `'pokoj' | 'wojna' | 'handel'` (**3**).

### B6. Zdarzenia AI / miast / bitew / zapisu (małe unie)

| Typ | Ścieżka:linia | Członkowie |
|---|---|---|
| `AiCsClusterAction` | `game/ai-cs-absorption.ts:8` | `trybut`:9, `wasal`:10, `war`:11, `annex`:12, `instant_annex`:13 (**5**) |
| `AiMajorAbsorbAction` | `game/ai-major-absorb.ts:15` | `instant_annex` (**1**) |
| `CapitalCaptureEventKind` | `game/capital-capture.ts:147` | `przejecie_stolicy`, `eliminacja` (**2**) |
| `VillageRewardKind` | `game/villageRewards.ts:26` | `zloto`, `tech`, `jednostka` (**3**) |
| `AutoBatchIntentKind` | `battle/autoBatchPhase.ts:10` | `hold`, `move`, `attack` (**3**) |
| `ProductionKind` | `game/production.ts:95` | `budynek`, `jednostka` (**2**) |
| `SaveLabelKind` | `game/save-label.ts:8` | `manual`, `quick`, `autosave` (**3**) |
| `ReligionSpreadEvent` | `game/culture-religion.ts:979` | interfejs zdarzenia szerzenia religii |
| `FortTakeoverEvent` | `game/fort-territory.ts:106` | interfejs przejęcia fortu |
| `MapFieldBattleAction` | `battle/mapFieldBattle.ts:35` | interfejs akcji bitwy polowej (`attacker: RuntimeUnit`, …) |

Routing przeglądarka→autozapis: `game/fsa-autosave.ts:94` `switch (reason)` — mapowanie przyczyn na komunikaty (`no-window`, `file-protocol`, `insecure-context`, `no-api`, default); typ `FsaUnavailableReason` od `game/fsa-autosave.ts:46`.

### B7. Przejścia stanu gry: tura, epoka, wygrana, zapis

Łańcuch zakończenia tury gracza (kolejność wywołań):

1. `main.ts:36102` `function triggerPlayerEndTurn(): void {` → `advanceSeat();` (`main.ts:36103`)
2. `main.ts:36047` `function advanceSeat(): void {` → `endActiveHumanTurn(activeId);` (`main.ts:36096`)
3. `main.ts:35855` `function endActiveHumanTurn(humanOwnerId)` → `runPlannedMarchesAtPlayerEndTurn(humanOwnerId);` (`main.ts:35983`) → `await runWorldEndTurn(humanOwnerId);` (`main.ts:35987`)
4. `main.ts:31169` `async function runWorldEndTurn(humanOwnerId)`:
   - czyszczenie buntów, `evictForeignUnitsFromCityHexes()`, reset `ruchLeft` / `replaceUsedThisTurn` / `retreatedThisTurn` (`main.ts:31170`–`31188`);
   - **`turn++;` — `main.ts:31189`** (jedyne przejście licznika tury w grze, poza resetami w startach);
   - pętla AI — właściciele: `ownerLoop: for (let oi = startOi; …)` w `main.ts:33469` (start pętli); w jej ciele blok dyplomacji AI: `const dipCmds: AIDiplomacyCommand[] = filterDiplomacyCommandsForEstablishedContact(…)` (`main.ts:34384`) i pętla komend `for (const cmd of dipCmds) {` (`main.ts:34388`) zamknięta na `main.ts:34535` (`main.ts:34364` to wcześniejszy fragment filtra `isForcedEpochWarDeclareCmd`, nie początek pętli); jednostki/miasta `main.ts:34831`–`35227`, barbarzyńcy `35604`–`35652`;
   - `checkVictory(vInput)` — `main.ts:35756`.
5. `game/victory.ts:204` `export function checkVictory(input: VictoryInput): VictoryResult | null`. Tryby: `game/victory.ts:52` `VictoryMode` = `'moc' | 'dominacja' | 'moc_i_dominacja'` (**3**); wynik `game/victory.ts:95` `VictoryResult.rodzaj` = `'dominacja' | 'nauka' | 'przegrana'` (**3**). Duplikat typu trybu: `ui/newGameFlow.ts:194` `export type VictoryMode`.

Reset tury przy starcie gry (`turn = 1`): `main.ts:37223` (`doStartGame`, `:37067`), `:37547` (playtest odskok), `:37801` (`doStartPlaytestMiastoEkonomia`, `:37669`), `:38035` (`doStartPlaytestMapaSwiata`, `:37893`).

Epoka: `main.ts:14354` `notifyPlayerEraChangeIfAdvanced(prevEra)`, `main.ts:14404` `flushPendingEraChangeToast` (wołane w `finally` `triggerPlayerEndTurn`), `main.ts:2160` `refreshCityRenderIfEraChanged`.

Zapis / odczyt:
- `main.ts:38140` `async function loadGameFromSlot(slotId, fromInGamePause)`;
- `main.ts:38334` `function restoreGameFromSave(saved: SaveGame)` z `turn = saved.tura;` (`main.ts:38339`);
- `main.ts:36872` `newGameParamsForLoad(saved)`;
- `game/save.ts:520` `serializeGame`, `game/save.ts:666` `deserializeGame(json)`, `game/save.ts:250` `buildSaveSlotMeta`, `game/save.ts:562` `migrateLegacyFarmsOnForestInSave`.

Start nowej gry: `main.ts:36538` `applyMenuParams(params: NewGameParams)`, `main.ts:36925` `runBuildSceneWithOverlay`, `main.ts:36952` `applySceneResult`.

Wiele fotelów (hot-seat): przejście fotela = `advanceSeat()` (`main.ts:36047`); architektura komentowana w `main.ts:35851` i `main.ts:36032`–`36038` (realne przejście świata tylko przez `endActiveHumanTurn`).

---

## C. Podsumowanie liczbowe

| Kategoria | Liczba typów / pozycji | Źródło |
|---|---:|---|
| Komendy AI jednostek/miast (`AICommand`) | 6 | A1 |
| Komendy dyplomacji AI (`AIDiplomacyCommand`) | 10 | A2 |
| Komendy barbarzyńców (`BarbCommand`) | 3 | A3 |
| Propozycje dyplomatyczne (`ProposalActionId`) | 15 | A4 |
| Akcje kliknięcia wrogiego miasta (`MapEnemyCityClickAction`) | 9 | A5 |
| Akcje HUD jednostki (`handleSelectedUnitHudAction`) | 14 | A6 |
| Id akcji audiencji dyplomacji (builder: 14; w tym 9 na pasku `ACTION_BAR_SPECS`) | 14 | A7 |
| Literały i callbacki UI bez wcześniejszego wpisu (`EntityCardAction` 2, `siege-hold` 1, callbacki `SiegeMapPanelActions`/`CityAttackChoiceActions`: `onBesiege`, `onStorm`, `onRetreat`, `onQueueMachine`, `onSiege`, `onCancel` = 6) | 9 | A11 |
| Skróty klawiaturowe gry | 9 (w tym 3 dev-only: F, M, G — bramki `FOG_DEV_SHORTCUTS` / `GALLERY_DEV_SHORTCUT`) | A10 |
| Zdarzenia dyplomatyczne (`DiplomaticEvent`) | 23 | B1 |
| Zdarzenia wiarygodności (`CredibilityEvent`) | 15 | B2 |
| Strumienie wiarygodności (`CredibilityStreamEvent`) | 4 | B3 |
| Zdarzenia sojuszu (`AllianceEvent`) | 2 | B4 |
| Rodzaje wpisów panelu/linków (`SidePanelEventKind` 7 + `SidePanelEventLinkKind` 6 + `InterHumanProposalKind` 4 + `DiploPlayerAction` 3 + `EotEventDraft.kind` 2) | 22 | B5 |
| Małe unie zdarzeń (`AiCsClusterAction` 5, `AiMajorAbsorbAction` 1, `CapitalCaptureEventKind` 2, `VillageRewardKind` 3, `AutoBatchIntentKind` 3, `ProductionKind` 2, `SaveLabelKind` 3, `VictoryMode` 3, `VictoryResult.rodzaj` 3) | 25 | B6, B7 |
| **Razem — typy komend/akcji** (A1–A7: 6+10+3+15+9+14+14 = 71; plus A11: 9; bez skrótów klawiszowych i bez duplikatów) | **80** | |
| **Razem — typy zdarzeń/przejść stanu** (B1–B6 + tryby/wyniki wygranej z B7: 23+15+4+2+22+25; bez duplikatu `WiarygodnoscEventTyp`, bez interfejsów) | **91** | |

> Liczby „Razem” są sumą pozycji z tabel tego pliku, nie wynikiem pełnego grepu każdego pliku `game/*.ts` — patrz sekcja D. Łączna liczba typów komend i eventów w katalogu: **80 + 91 = 171** (plus 9 skrótów klawiszowych). Liczba 171 dotyczy pozycji wyliczonych z tabel; nie jest wynikiem pełnego grepu wszystkich `game/*.ts` (sekcja D).

---

## D. Luki zakresu (stan po rundzie 2)

1. **Literały `ui/*`:** zamknięte w rundzie 2 w sekcji A11 dla `EntityCardAction`, `UnitPanelAction`, `SiegeMapPanelActions`, `CityAttackChoiceActions`, `AudienceAction`. **Otwarte:** obsługa `DiploPlayerAction` (typ w `ui/diplomacyPanel.ts:28`, wyliczony w B5; handler nie prześledzony).
2. **Ścieżka `'3'`, `'2'`, `'13'`, `'12'`, `'15'`:** zamknięta w rundzie 2 (sekcja A7: koszyk → `handleNegotiatedProposal`). Fallback bez kontekstu negocjacji to atrapa „wkrótce” (`main.ts:21301`–`21302`). **Otwarte:** downstream id `'4'`, `'6'`, `'7'`, `'8'`, `'9'` z kafelka „Możliwe umowy”.
3. **Konsumenci `ProposalActionId`:** zamknięte w rundzie 2 (sekcja A4). `evaluateProposal` (`game/diplomacy-proposals.ts:1038`) pokrywa 15/15. `resolvePlayerAcceptsAiPending` (`:1994`) pokrywa 14/15, brakuje `'wchloniecie'` (ścieżka statycznie ustalona, nie uruchomiona — do uwzględnienia w P2.5).
4. **`game/*.ts` poza wymienionymi** (np. `diplomacy-ai-balance.ts`, `diplomacy-audience-actions.ts`, `ai-*.ts` poza `ai.ts`, `forced-war-*.ts`, `alliance-war-obligation.ts`) — zawierają logikę decyzji AI i bloki `switch` na `item.typ`; nie zostały skatalogowane jako osobne typy zdarzeń.
5. **Komunikaty wewnętrzne `console.log`/`showHintMessage`** nie są katalogiem zdarzeń i nie zostały wyliczone.
6. **Typ `FsaUnavailableReason`** (`game/fsa-autosave.ts:46`) — członkowie nie zostali policzeni w sumie.
7. **Pozostałe `switch` w `gra/src`:** `git grep -nE '\bswitch\s*\(' edb8fb56 -- gra/src | wc -l` = **115** trafień; z tego 111 to `switch` na początku linii (`git grep -nE '^\s*switch\s*\(' …`). Katalog wymienia tylko switche dotyczące komend/akcji/zdarzeń. Pozostałe (np. `render/*.ts`, `battle/battleScene.ts`) nie zostały zaklasyfikowane.

Stan po rundzie 2: pozycje 1, 2, 3 i 7 mają rozstrzygnięcie opisane powyżej. Pozycje 4, 5, 6 oraz „Otwarte” z pozycji 1 i 2 pozostają **DO DOPISANIA** i wymagają decyzji Evaluatora, które są krytyczne dla P2.5/P2.6.

---

## E. Pokrycie `ProposalActionId` we wszystkich konsumentach (R-RUSTPORT-P1-13B-PROPOSAL-COVERAGE-Q1, runda 1/5, obrona Operatora)

**Uwaga do ledgera (zarzut Evaluatora 4):** nagłówek dokumentu „Runda: 2/5” dotyczy tematu **R-RUSTPORT-P1-13** (sekcje A–D). Niniejsza sekcja E jest dopisana w temacie **R-RUSTPORT-P1-13B-PROPOSAL-COVERAGE-Q1, runda 1/5**. Nagłówka dokumentu nie zmieniano (allowlista: tylko dopisanie).

**Pin:** `edb8fb56`. Wszystkie cytaty z `git show edb8fb56:<ścieżka>` / `git grep … edb8fb56` wykonane w tej rundzie. Stare numery `main.ts:1038` i `main.ts:1994` z sekcji A4 **nie są** switchami na `ProposalActionId` (na pinie: linie importu/komentarza). Właściwe switche: `gra/src/game/diplomacy-proposals.ts:1038` (`evaluateProposal`) i `:1994` (`resolvePlayerAcceptsAiPending`).

**Definicja:** `gra/src/game/diplomacy-proposals.ts:68` — 15 członków: `nap`:69, `sojusz_defensywny`:70, `sojusz_pelny`:71, `handel`:72, `umowa_handlowa`:77 (alias AI), `umowa_szlakow`:79, `trybut_zadanie`:80, `trybut_oferta`:81, `granice`:82, `tech`:83, `namow_wojne`:84, `ultimatum`:85, `wasal`:86, `wchloniecie`:88, `pokoj`:90.

### E1. Inwentarz konsumentów (po obronie)

| # | Konsument | Ścieżka:linia | Rodzaj | Wynik dla 15 wariantów |
|---|---|---|---|---|
| K1 | `evaluateProposal` | `game/diplomacy-proposals.ts:1038` | `switch` (`default` :1746 → `accepted:false`) | **15/15 jawnie** (`case` :1039 … :1707 `wchloniecie`, 15 etykiet — zob. E2a; `umowa_handlowa` :1472 wpada w `umowa_szlakow` :1473) |
| K2 | `resolvePlayerAcceptsAiPending` | `game/diplomacy-proposals.ts:1994` | `switch` (`default` :2194 → `accepted:false`, „Nieznana akcja dyplomatyczna” :2195) | **14/15 — BRAK `wchloniecie`** (`case` :1995–:2175; zweryfikowane: 14 etykiet `case`, brak `'wchloniecie'` w zakresie :1994–:2197) |
| K3 | `negotiationSummary` (etykiety stołu, `entry.actionId`) | `gra/src/main.ts:17507` (`default` :17538) | `switch` | **15/15 jawnie** (`case` :17508, :17512, :17513, :17514, :17517, :17519, :17520, :17522, :17531, :17532, :17533, :17534, :17535, :17536, :17537) |
| K4 | `applyProposalOutcome` | `gra/src/main.ts:20605` | warunki `if (cywAction === …)` + ogólna ścieżka `else if` :20725 | **6 wariantów z jawną gałęzią** (`trybut_zadanie`/`trybut_oferta` :20614; `wchloniecie` :20620; `handel` :20701; `umowa_handlowa`/`umowa_szlakow` :20719); **9 bez jawnej gałęzi** — obsługiwane ścieżką ogólną; downstream per wariant NIE prześledzony (patrz E3.5) |
| K5 | zbiory-filtry (`ReadonlySet`) | `diplomacy-proposals.ts:1956`, `:1973`, `:2417`, `:2477`; `diplomacy-acceptance-points.ts:623` | członkostwo | patrz matryca E2b; brak członkostwa = decyzja polityki, nie błąd sam w sobie |
| K6 | mapa etykiet CYW → id UI | `gra/src/main.ts:17490`–`17493` (`Record<string,string>`, 15 kluczy) + konsument `main.ts:17616` (`?? '5'`) | `Record` | **15/15 kluczy obecnych** (`nap`/`sojusz_*`/`granice`/`pokoj` :17491; `handel`/`umowa_*`/`tech`/`namow_wojne` :17492; `trybut_*`/`ultimatum`/`wasal`/`wchloniecie` :17493). Fallback `?? '5'` nie jest uruchamiany dla żadnego z 15 kluczy |
| K7 | mapowanie UI → id (producent, nie konsument) | `ui/diplomacyNegotiationModal.ts:549`–`562` (`proposalActionIdFromPayload`); `ui/diplomacyTradeBasket.ts:1395`–`1413` (`proposalActionIdFromUi`) | producent | modal: `map` pokrywa `nap`, `granice`, `umowa_szlakow`, `handel`, `tech`, `namow_wojne`, `ultimatum`, `wasal`, `wchloniecie`, `pokoj` + gałęzie dla `sojusz_*`, `trybut_*`; **`umowa_handlowa` nie jest produkowany przez UI** (alias AI, `diplomacy-proposals.ts:77`). Fallbacki: modal `?? payload.actionId` (zwraca surowe id UI); basket `return 'handel'` (domyślnie) |
| K8 | dane traktatów `gra/data/diplomacy-acceptance-points.json` → `traktaty` | czytane przez `loadTreatyAcceptanceDef` `game/diplomacy-acceptance-points.ts:66`; użycie: `computePlayerAcceptanceSides` :356, `treatyBaseAcceptancePn` :77, `computeIncomingPlayerAcceptNetPw` :677, `previewIncomingPlayerAccept` :695 | dane (lookup `t[actionId]`, `undefined` gdy brak) | **14/15** — brak wpisu dla **`wchloniecie`** (klucze `traktaty` na pinie: `dar`, `granice`, `handel`, `namow_wojne`, `nap`, `pokoj`, `sojusz_defensywny`, `sojusz_pelny`, `tech`, `trybut_oferta`, `trybut_zadanie`, `ultimatum`, `umowa_handlowa`, `umowa_szlakow`, `wasal`). Dla `wchloniecie`: `punkty` = 0, brak `prog_relacja` |
| K9 | helpery generyczne bez `case` per wariant | `game/diplomacy-rejection-cooldown.ts:25`–`85` (`makeRejectedOfferCooldown` :25, `isOfferRejectedOnCooldown` :48 z `c.actionId === actionId`, `recordRejectedOffer` :63, `pruneExpiredRejectedOffers` :78); `game/diplomacy-proposals.ts:2271` (`makeNegotiationId`), `:2283` (`hasPendingNegotiationForPair`), `:2297` (`findOwnOutgoingNegotiation`) | generyczne (`ProposalActionId` jako klucz/parametr) | **15/15 OBSŁUŻONE OGÓLNIE** — brak gałęzi per wariant, brak wyjątku dla któregokolwiek wariantu |
| K10 | gałąź dla jednego wariantu w UI stołu | `gra/src/main.ts:17174` (`skipGenericToast = entry.actionId === 'wchloniecie' && outcome.kind === 'accepted'`) | warunek | tylko `wchloniecie` (świadoma wyjątkowa gałąź toastu, nie pokrycie 15 wariantów). `main.ts:28876`–`28882` to **komentarze**, bez kodu |

**Poza zakresem `ProposalActionId`** (switche na id przycisków UI, typ `actionId: string`, nie `ProposalActionId`): `game/diplomacy-locks.ts:195` (`case` `'2'`, `'3'`, `'4'`, `'5'`, `'14'`, `'6'`, `'7'`), `ui/diplomacyNegotiationModal.ts:368` (`'2'`–`'7'`, `'8'`, `'9'`, `'12'`, `'13'`, `'14'`), `ui/diplomacyTradeBasket.ts:618` / `:952` / `:1144` (etykiety `'2'`–`'9'`, `'12'`, `'15'`), `main.ts:21288` (`'10'`, `'5'`, `'14'`). Wszystkie etykiety są w zbiorze `'2'`–`'15'` (formularze UI), zatem nie wchodzą do pokrycia 15 wariantów.

### E2. Status per wariant

**E2a. Konsumenci `switch`/mapa/dane (K1, K2, K3, K6, K8) i ogólny (K9):**

| Wariant | K1 evaluateProposal | K2 resolvePlayerAcceptsAiPending | K3 etykieta | K6 mapa CYW | K8 dane traktatu | K9 generyczny | Status |
|---|---|---|---|---|---|---|---|
| `nap` | :1039 | :1995 | :17508 | :17491 | tak | OK | OBSŁUŻONY (K4: ogólnie) |
| `sojusz_defensywny` | :1087 | :2020 | :17512 | :17491 | tak | OK | OBSŁUŻONY (K4: ogólnie) |
| `sojusz_pelny` | :1088 | :2021 | :17513 | :17491 | tak | OK | OBSŁUŻONY (K4: ogólnie) |
| `handel` | :1380 | :2101 | :17517 | :17492 | tak | OK | OBSŁUŻONY (K4: :20701) |
| `umowa_handlowa` | :1472 | :2138 | :17519 | :17492 | tak | OK | OBSŁUŻONY (K4: :20719) |
| `umowa_szlakow` | :1473 | :2139 | :17520 | :17492 | tak | OK | OBSŁUŻONY (K4: :20719) |
| `trybut_zadanie` | :1144 | :2159 | :17532 | :17493 | tak | OK | OBSŁUŻONY (K4: :20614) |
| `trybut_oferta` | :1348 | :2175 | :17533 | :17493 | tak | OK | OBSŁUŻONY (K4: :20614) |
| `granice` | :1622 | :2034 | :17514 | :17491 | tak | OK | OBSŁUŻONY (K4: ogólnie) |
| `tech` | :1579 | :2063 | :17522 | :17492 | tak | OK | OBSŁUŻONY (K4: ogólnie) |
| `namow_wojne` | :1563 | :2078 | :17531 | :17492 | tak | OK | OBSŁUŻONY (K4: ogólnie) |
| `ultimatum` | :1673 | :2081 | :17535 | :17493 | tak | OK | OBSŁUŻONY (K4: ogólnie) |
| `wasal` | :1684 | :2084 | :17536 | :17493 | tak | OK | OBSŁUŻONY (K4: ogólnie) |
| `wchloniecie` | :1707 | **LUKA** — brak `case`, trafia do `default` :2194 → `accepted:false` | :17537 | :17493 | **LUKA** — brak wpisu w `traktaty` | OK | **LUKA W K2 (:1994) i K8 (dane)**; K4 jawnie :20620; K10 :17174 |
| `pokoj` | :1189 | :2032 | :17534 | :17491 | tak | OK | OBSŁUŻONY (K4: ogólnie) |

**E2b. Matryca członkostwa K5** (✓ = wariant w zbiorze; `NEGOTIATION_NO_ENGINE_COUNTER` (`:2239`) jest pusty — pominięty):

| Wariant | PEACE_REQUIRED :1956 | PEACE_DURING_WAR :1973 | TRIBUTE :2417 | SWEETENER :2477 | INCOMING_NET_PW acc:623 |
|---|---|---|---|---|---|
| `nap` | ✓ | – | – | ✓ | – |
| `sojusz_defensywny` | ✓ | – | – | ✓ | – |
| `sojusz_pelny` | ✓ | – | – | ✓ | – |
| `handel` | ✓ | – | – | – | ✓ |
| `umowa_handlowa` | ✓ | – | – | – | ✓ |
| `umowa_szlakow` | ✓ | – | – | – | ✓ |
| `trybut_zadanie` | ✓ | – | ✓ | – | – |
| `trybut_oferta` | – | ✓ | ✓ | – | – |
| `granice` | ✓ | – | – | ✓ | – |
| `tech` | ✓ | – | – | – | – |
| `namow_wojne` | – | – | – | – | – |
| `ultimatum` | – | ✓ | – | – | – |
| `wasal` | ✓ | – | – | ✓ | – |
| `wchloniecie` | ✓ | – | – | – | – |
| `pokoj` | – | ✓ | – | ✓ | – |

Wniosek z E2b: `namow_wojne` nie należy do żadnego zbioru; `tech`, `ultimatum`, `wchloniecie` należą tylko do jednego. To są decyzje polityki (filtry), nie luki wykonania — ale P2.5 musi je odtworzyć jako dane, nie jako przypadki kodu.

### E3. Odpowiedzi na zarzuty Evaluatora (runda 1/5, obrona)

1. **Zarzut 1 (status tylko K1–K3): PRZYJMUJE.** Dodano K4 (per wariant, z podziałem na jawną i ogólną ścieżkę), K5 (matryca E2b), K6 (15/15 kluczy), K8 (dane) i K9 (ogólne). Status „OBSŁUŻONY” dla 13 wariantów jest teraz z zastrzeżeniem „K4: ogólnie” dla 9 wariantów (patrz E3.5).
2. **Zarzut 2 (niepełny inwentarz): PRZYJMUJE.** Dodano K6 (`main.ts:17490`–`17493`, `Record` z 15 kluczami, konsument `:17616`), K7 (producenci, z fallbackami), K8 (`diplomacy-acceptance-points.ts:356`, `:677`, `:695` przez `loadTreatyAcceptanceDef`), K9 (`diplomacy-rejection-cooldown.ts:25`–`85`, `diplomacy-proposals.ts:2271`–`2297`), K10 (`main.ts:17158`–`17174`; `:28876` to komentarze). **Nowe ustalenie:** brak wpisu `wchloniecie` w `gra/data/diplomacy-acceptance-points.json` (K8) — druga luka dla tego wariantu, poza K2.
3. **Zarzut 3 (E3.4 bez dowodu per case): PRZYJMUJE.** Dowód dodano w sekcji „Poza zakresem” E1 (etykiety `case` z `git show edb8fb56`). Potwierdzono, że scrutinee w `diplomacy-locks.ts` (`actionId: string`, :44) i w funkcjach `diplomacyNegotiationModal.ts`/`diplomacyTradeBasket.ts` (parametr `actionId: string`) to id UI, nie `ProposalActionId`. Typu `actionId` w `main.ts:21288` nie prześledzono dalej niż wywołanie `actionNeedsNegotiation(actionId)` (:21276) — zaznaczone jako blokada.
4. **Zarzut 4 (nagłówek „Runda 2/5” vs „runda 1/5”): PRZYJMUJE jako wyjaśnienie w sekcji E** (akapit „Uwaga do ledgera” wyżej). Zmiany nagłówka istniejącej treści nie wykonano — allowlista wymaga samego dopisania.

### E3.5. Ustalenia i ograniczenia (stan po obronie)

1. **Luka K2 × `wchloniecie` potwierdzona statycznie** (`diplomacy-proposals.ts:1994`–`2197`, brak `case`). Ścieżka runtime nie była uruchamiana.
2. **Luka K8 × `wchloniecie` (nowa):** brak wpisu w `traktaty` JSON; `loadTreatyAcceptanceDef` zwraca `undefined`, `treatyBaseAcceptancePn` daje 0. Czy to celowe (wchłonięcie to jednorazowa aneksja, nie traktat), czy luka — **decyzja projektowa do P2.5**, nie rozstrzygnięta w tej rundzie.
3. **K4 dla 9 wariantów bez jawnej gałęzi** (`nap`, `sojusz_defensywny`, `sojusz_pelny`, `granice`, `tech`, `namow_wojne`, `ultimatum`, `wasal`, `pokoj`): obsługa przez ogólną ścieżkę `else if (giveItems/receiveItems)` :20725 i wspólny kod `result.deal`. **Nie prześledzono downstream per wariant** — status „OBSŁUŻONY” dla K4 jest tu niepełnym dowodem.
4. **Wnioski, których NIE wyciągam:** nie twierdzę, że pozostałe 14 wariantów działa w runtime; dowód jest statyczny (switch/mapa/dane).

### E4. Wniosek dla P2.5

- Kontrakt komend frontend→Rust musi obsługiwać `wchloniecie` w ścieżce `resolvePlayerAcceptsAiPending` (K2, `:1994`) **i** rozstrzygnąć brak wpisu danych traktatu (K8) — decyzja projektowa wymagana.
- Pozostałe 14 wariantów: OBSŁUŻONE w K1, K2, K3, K6, K8 (oraz K9 generycznie); K4 wymaga osobnego prześledzenia dla 9 wariantów bez jawnej gałęzi (E3.5 pkt 3) przed zamknięciem tematu.
- Matryca K5 (E2b) jest danymi wejściowymi dla P2.5 jako reguły filtrów.

## F. Runda 2/5 — R-RUSTPORT-P1-13B-PROPOSAL-COVERAGE-Q1 (Operator, poprawki po zarzutach 1–2 Evaluatora)

**Pin i metoda:** `edb8fb56`; wszystkie linie z `git show edb8fb56:<ścieżka>` / `git grep … edb8fb56` wykonane w tej rundzie. Sekcje A–E nie zmieniono (tylko dopisanie).

**Sprostowania do E2a / E4 (runda 1):**
- K4 `main.ts:20614` dotyczy WYŁĄCZNIE odmowy (`if (!result.accepted)`, :20613) dla `trybut_zadanie`/`trybut_oferta`. Nie jest jawną obsługą przyjęcia; wpis „K4: :20614” w E2a czytać jako „odmowa”.
- `pokoj` ma jawną gałąź przyjęcia `main.ts:20772` (`finalizePeaceTreatyBetween`, w bloku `oneShotTrade`). W E2a był błędnie oznaczony „K4: ogólnie”.

### F1. K4 — prześledzenie per wariant (`applyProposalOutcome`, `main.ts:20605`)

Struktura gałęzi (pin): `if (!result.accepted)` :20613 → `if (cywAction === 'wchloniecie')` :20620 → `if (result.deal)` :20659 [`applyAcceptedProposal` :20660; gałąź `UmowaWymiany/UmowaHandlowa` :20683 z `transferBasketItems` :20689–:20690 i `if (cywAction === 'handel')` :20701; `else if (UmowaSzlakow)` :20718 z `umowa_*` :20719; `else if (giveItems/receiveItems)` :20725 z transferem :20732–:20733] → `if (result.oneShotTrade)` :20736 [`executePnDealTransfer` :20737; `handel` :20748; `trybut_oferta` :20769; `pokoj` :20772] `else if (cywAction === 'trybut_zadanie')` :20776.

Zakres statusu K4: wskazuje, która gałąź `applyProposalOutcome` wykonuje się dla wariantu i jaki efekt jest tam jawny. Ciała wywoływanych helperów NIE są częścią tego statusu (oznaczone NIEPRZEŚLEDZONE w F4).

| Wariant | Zwrot `evaluateProposal` (pin) | Gałąź K4 (dowód) | Status K4 |
|---|---|---|---|
| `nap` | `deal` :1084 | `deal` :20659–:20660; reveal :20678–:20681 (PaktNieagresji); basket :20725 | ŚCIEŻKA OGÓLNA (bez jawnego `cywAction`); NIEPRZEŚLEDZONE poza granicą helperów |
| `sojusz_defensywny` | `deal` :1141 | jw.; reveal :20678–:20681 (SojuszDefensywny) | ŚCIEŻKA OGÓLNA; jw. |
| `sojusz_pelny` | `deal` :1141 | jw.; reveal :20678–:20681 (SojuszPelny) | ŚCIEŻKA OGÓLNA; jw. |
| `granice` | `deal` :1669 | `deal` :20659–:20660; basket :20725; reveal tylko gdy rodzaj należy do listy :20671–:20677 — rodzaj deala NIEROZSTRZYGNIĘTY | ŚCIEŻKA OGÓLNA; NIEPRZEŚLEDZONE: rodzaj deala |
| `wasal` | `deal` :1704 | jw. (bez reveal) | ŚCIEŻKA OGÓLNA; jw. |
| `tech` | `oneShotTrade` :1608, :1618 | :20736–:20737 (`executePnDealTransfer`), brak jawnej gałęzi `tech` | ŚCIEŻKA OGÓLNA; NIEPRZEŚLEDZONE: czy `executePnDealTransfer` przenosi koszyk tech (`transferBasketItems` `case 'tech'` :10190 — nie prześledzono wywołań) |
| `ultimatum` | `oneShotTrade` :1679 | :20736–:20737 (`executePnDealTransfer`), brak jawnej gałęzi | ŚCIEŻKA OGÓLNA; NIEPRZEŚLEDZONE jak `tech`. Efekt wojny w tej ścieżce nie występuje (wojna z payloadu tylko przez `warThreat`: :17151–:17155, :17294–:17296) |
| `namow_wojne` | zgoda bez `deal` i bez `oneShotTrade` :1576 | brak gałęzi; po :20613–:20618 nic nie zmienia stanu | **LUKA W K4 (kandydat)**: `applyProposalOutcome` nie ma efektu zgody na wojnę. Wywołania `ownerDeclareWarOn` (:10646 definicja, :17154, :17295) idą przez `payload.warThreat`, nie przez `actionId`. Czy efekt istnieje gdzie indziej — NIEPRZEŚLEDZONE |
| `trybut_oferta` | `oneShotTrade` :1360 (jednorazowy); `deal` :1377 (cykliczny) | wariant oneShot: jawnie :20769 (`trybut_oferta_przyjeta`). Wariant deal: `else if` :20776 nie działa (tylko w gałęzi `else` do `oneShotTrade`) — brak efektu przyjęcia | JAWNIE dla oneShot; **LUKA W K4 (kandydat) dla wariantu deal :1377** — NIEPRZEŚLEDZONE, czy efekt jest poza `applyProposalOutcome` |
| `trybut_zadanie` | `deal` :1186 | :20776–:20778 (`trybut_zaakceptowany`) | JAWNIE (przyjęcie); odmowa :20614 |
| `handel` | `oneShotTrade` :1396, :1457, :1469; `deal` :1448 | `deal`: :20701 (`handel`, w gałęzi wymiany); oneShot: :20748 | JAWNIE (obie ścieżki) |
| `umowa_handlowa` | `deal` :1558 | rodzaj UmowaSzlakow: :20719 (jawnie); rodzaj UmowaWymiany/Handlowa: ogólnie :20683–:20690 — rodzaj deala NIEROZSTRZYGNIĘTY | JAWNIE dla UmowaSzlakow; ŚCIEŻKA OGÓLNA dla innego rodzaju |
| `umowa_szlakow` | `deal` :1558 | jw. | jw. |
| `pokoj` | `oneShotTrade` :1345 | :20772 (`finalizePeaceTreatyBetween`) | JAWNIE |
| `wchloniecie` | zgoda bez `deal`/`oneShotTrade` :1743 | :20620–:20638 (jawnie) | JAWNIE dla K4; **LUKA** K2 (sekcja E) i K8 (sekcja E) |

**Podsumowanie F1:** jawna gałąź K4 — `handel`, `umowa_handlowa`/`umowa_szlakow` (częściowo), `trybut_zadanie`, `trybut_oferta` (tylko oneShot), `pokoj`, `wchloniecie`. Ścieżka ogólna — `nap`, `sojusz_defensywny`, `sojusz_pelny`, `granice`, `wasal`, `tech`, `ultimatum`. Kandydaci na luki K4 — `namow_wojne` (silna przesłanka), `trybut_oferta` wariant deal (do potwierdzenia).

### F2. Konsumenci K11 (dopisani w tej rundzie)

| # | Konsument | Ścieżka:linia (pin) | Wynik per wariant |
|---|---|---|---|
| K11a | `allowsMultipleOwnOutgoingNegotiations` | definicja `game/diplomacy-proposals.ts:2322` (`=== 'handel'`); import `main.ts:1310`; użycie `main.ts:21123` (guard `findOwnOutgoingNegotiation` :21124) | **JAWNIE 15/15**: `handel` → `true` (zwolniony z guarda); 14 pozostałych → `false` (guard obowiązuje). Brak luki |
| K11b | `usesIncomingPlayerNetPwGate` + `INCOMING_NET_PW_ACTIONS` | `game/diplomacy-acceptance-points.ts:623`–`:631`; użycie `:683` (`if (!usesIncomingPlayerNetPwGate(actionId)) return null;`) | **JAWNIE 15/15**: `handel`, `umowa_handlowa`, `umowa_szlakow` → bramka netto PW; 12 pozostałych → `null` (bramki brak; decyzja polityki, nie luka). Pośrednio też kolumna K5 |
| K11c | `buildProposalFromPayload` | `main.ts:21010`; typ zwrotu `:21017`; rzutowanie `cywAction as ProposalActionId` `:21069`; wywołania `:21086`, `:21109` | **OGÓLNIE 15/15**: brak `case`, `actionId` przenoszony bez filtra. RYZYKO (nie luka wariantu): rzutowanie nie sprawdza przynależności do 15 wartości w runtime |
| K11d | `findIncomingNegotiationForAction` | `main.ts:21096`; parametr `:21098`; porównanie `n.actionId === actionId` `:21104` | **OGÓLNIE 15/15**: równość bez gałęzi per wariant |

### F3. Status per wariant po rundzie 2

Kolumny K1, K2, K3, K6, K8, K9 — bez zmian względem sekcji E2a (zweryfikowane w tej rundzie na `edb8fb56`). K5 — E2b. K4 — F1. K11 — F2.

Stan zbiorczy: każdy z 15 wariantów ma jawny status z dowodem w każdym wymienionym miejscu konsumpcji (K1–K11). Statusy ze słowem „ŚCIEŻKA OGÓLNA”, „KANDYDAT” lub „NIEPRZEŚLEDZONE” są oznaczone jako niepełne; nie są rozstrzygnięte jako „OBSŁUŻONY”.

### F4. Ustalenia NIEPRZEŚLEDZONE (jawna lista)

1. Ciała helperów wywoływanych z `applyProposalOutcome`: `applyAcceptedProposal`, `syncRelationFromDeals`, `executePnDealTransfer`, `transferBasketItems` (w tym `case 'tech'` :10190).
2. `namow_wojne`: czy zgoda na wojnę ma efekt poza `applyProposalOutcome`.
3. `trybut_oferta` wariant `deal` (:1377): czy efekt `trybut_oferta_przyjeta` występuje poza `applyProposalOutcome`.
4. Rodzaj deala dla `granice` i dla `umowa_handlowa` (warunek reveal :20671–:20677 i gałąź :20718 vs :20683).
5. `previewNegotiationEntry` (przed `main.ts:17267`) — poza zakresem z sekcji E3.5 runda 1, bez zmian.

### F5. Wniosek dla P2.5 (uzupełnienie E4)

- Kontrakt komend frontend→Rust musi obsłużyć wszystkie 15 wariantów w K1–K11, w tym jawne gałęzie K4 z F1.
- Decyzje do rozstrzygnięcia przed P2.5 (nie są błędem wykonania w tym dowodzie): (a) `wchloniecie` w K2 i K8 (sekcja E); (b) kandydat luki `namow_wojne` w K4; (c) kandydat luki `trybut_oferta` wariant deal w K4.
- Pokrycie K11: bez luk wariantowych; ryzyko rzutowania w K11c do uwzględnienia w walidacji typu po stronie Rust (enum zamknięty).

## G. Runda 2/5 obrony — R-RUSTPORT-P1-13B-PROPOSAL-COVERAGE-Q1 (odpowiedź na zarzuty 1–4 Evaluatora)

**Pin i metoda:** `edb8fb56`; każda linia poniżej z `git show edb8fb56:<ścieżka>` / `git grep … edb8fb56` wykonanego w tej rundzie. Sekcje A–F nie zmienione (tylko dopisanie).

### G1. Odpowiedzi na zarzuty

1. **Zarzut 1 (kryterium binarne): PRZYJMUJE częściowo.** Kryterium „OBSŁUŻONY WSZĘDZIE / LUKA W <miejsce> z dowodem" nadal NIE jest spełnione dla 7 wariantów (`nap`, `sojusz_defensywny`, `sojusz_pelny`, `granice`, `wasal`, `tech`, `ultimatum`) — ich K4 zostaje „ŚCIEŻKA OGÓLNA". Helpery z F4 pkt 1 prześledzono do granicy (G2); pozostała lista — G4. Nie deklaruję „OBSŁUŻONY WSZĘDZIE" dla żadnego z 15 wariantów w K4.
2. **Zarzut 2 (`namow_wojne`): PRZYJMUJE.** Potwierdzone (G3a).
3. **Zarzut 3 (`trybut_oferta` wariant deal): PRZYJMUJE.** Potwierdzone literałem (G3b).
4. **Zarzut 4 (`umowa_*` warunkowe): PRZYJMUJE z korektą.** Wejście do gałęzi jest bezwarunkowe: rodzaj deala dla obu wariantów to zawsze `RodzajTraktatu.UmowaSzlakow` (`game/diplomacy-proposals.ts:1558`, `buildDeal` w case `umowa_handlowa`/`umowa_szlakow`). Warunkowy jest wyłącznie transfer `executePnDealTransfer` (`main.ts:20719`–`20720`, warunek `goldOnce > 0`). Dodatkowo `recomputeTradeRoutesNow` (`main.ts:20722`–`20723`) działa tylko gdy gracz jest w parze (`proposerId === 0 || responderId === 0`).

### G2. Prześledzone ciała helperów (zamyka część F4 pkt 1)

- `applyAcceptedProposal` — `game/diplomacy-proposals.ts:1752`: `if (!result.accepted || !result.deal) return deals; return addTreaty(deals, result.deal);`. Jedyny efekt: dopisanie traktatu (`addTreaty`, `game/diplomacy-treaties.ts:273`).
- `syncRelationFromDeals` — `main.ts:19223`–`19235`: `wojna` → brak zmian; sojusz (`isAllianceDealKind`) → status `sojusz`; pakt NAP → status `pokoj`. Brak efektów trybut/wojna.
- `transferBasketItems` — `main.ts:10132`–`10230`: `zloto` (:10144–:10146, `applyOneShotGoldTransfer`), `praca`, `zywnosc`, `zloze`, `tech` (`:10190`–`:10191` → `grantTechToOwnerWithSideEffects`, `main.ts:10049`, ciało NIEPRZEŚLEDZONE), `surowiec_*`; **`jednostka` (`:10221`) = no-op** (`break`, TODO A1: dawca nie traci jednostki) — luka elementu koszyka, nie wariantu.
- `executePnDealTransfer` — `main.ts:10235`–`10257`: `techId` → `executeTechTradeDeal` (`main.ts:10105`) → `executeTechTradeDealCore` (`game/diplomacy-tech-trade.ts:168`, ciało NIEPRZEŚLEDZONE); **`giveItems`/`receiveItems` niepuste → `transferBasketItems` i `return` (`:10248`–`:10251`), więc `goldOnce` jest wtedy POMIJANE**; dopiero przy pustym koszyku → `applyOneShotGoldTransfer` (`goldOnce`).

### G3. Ustalenia (dowody statyczne, bez uruchomienia runtime)

**a) LUKA K4 — `namow_wojne`.** `applyProposalOutcome` (`main.ts:20605`) nie ma żadnej gałęzi dla `namow_wojne` (`git grep namow_wojne` w `gra/src/main.ts`: tylko `:17492` mapa etykiet i `:17531` etykieta). Zgoda z `evaluateProposal` (`diplomacy-proposals.ts:1576`) nie tworzy `deal` ani `oneShotTrade`. Wszystkie wywołania wojny leżą poza ścieżką akceptacji: `ownerDeclareWarOn` — `main.ts:10699` (przejęcie miasta), `:17154` (gałąź `outcome.kind === 'rejected'` z `warThreat`, `:17150`–`:17155`), `:17295` (odrzucenie, `handleNegotiationReject`). `playerDeclareWarOnOwner` — `:10713`, `:10715` (przejęcie), `:17152` (odrzucenie), `:21283` (przycisk „wypowiedz wojnę” z audiencji, `actionId === '11'`). **Zgoda nie wywołuje wojny.** Łapówka: `bribeGold` jest czytany tylko w walidacji `diplomacy-proposals.ts:1569`–`:1571` (minimum `progNamowWojneBribeBase*(epoka+1)`), etykiecie `main.ts:17531` i kopiowaniu payloadu `main.ts:21054`; akcesory `getMoneyField`/`withMoneyField` (`diplomacy-proposals.ts:2499`, `:2509`) służą edycji kontrofert, nie przelewowi. **Łapówka nie jest wypłacana.** Status: **LUKA W K4** (brak gałęzi w `main.ts:20605`–`20775`).

**b) LUKA K4 — `trybut_oferta`, wariant `deal` (`diplomacy-proposals.ts:1377`).** Literał `'trybut_oferta_przyjeta'` w `gra/src` (`git grep`): `game/diplomacy-factors.ts:76` (etykieta), `game/diplomacy.ts:839` (typ), `:1008` (`case`), `main.ts:20771` (jedyne miejsce emisji). `:20771` leży w gałęzi `if (result.oneShotTrade)` (`:20737`–`:20770`, `else if` `:20769`). Gałąź `deal` (`main.ts:20659`–`:20735`) nie emituje żadnego zdarzenia trybutu; `syncRelationFromDeals` (G2) też nie. Brak wzorca dynamicznego składania (`_przyjeta`, `'trybut_' +` — 0 trafień). Status: **LUKA W K4 (`main.ts:20659`–`:20735`)** — intencja (czy przyjęcie cyklicznego trybutu ma mieć efekt) do potwierdzenia w P2.5.

**c) Korekta `umowa_*` (zarzut 4) + nowy KANDYDAT LUKI K4.** Oprócz warunku z G1: `evaluateProposal` przy `hasItems` (`diplomacy-proposals.ts:1529`–`:1530`) akceptuje ofertę z koszykiem i rodzajem `UmowaSzlakow`. W `applyProposalOutcome` gałąź `UmowaSzlakow` (`:20718`) wywołuje `executePnDealTransfer` tylko przy `goldOnce > 0`; gałąź `else if (giveItems/receiveItems)` (`:20725`) jest nieosiągalna dla rodzaju `UmowaSzlakow`; `transferBasketItems` przy traktacie wywoływane jest tylko dla `UmowaWymiany`/`UmowaHandlowa` (`:20689`–`:20690`). Wniosek: **koszyk umowy przy `goldOnce == 0` nie jest przenoszony**, a przy `goldOnce > 0` złoto jest pomijane (G2, `:10248`–`:10251`). Status: **KANDYDAT LUKI K4** — nie wykonano w runtime; nieprzeczytany pozostaje `ui/diplomacyTradeBasket.ts` (czy UI zawsze ustawia `goldOnce` dla umów).

### G4. Status K4 per wariant po rundzie 2 (zastępuje kolumnę K4 z F1 dla wskazanych wariantów; pozostałe bez zmian)

| Wariant | Status K4 po rundzie 2 | Co pozostaje NIEPRZEŚLEDZONE |
|---|---|---|
| `nap` | ŚCIEŻKA OGÓLNA — `addTreaty` (G2), `syncRelationFromDeals` (G2 → `pokoj`), koszyk `:20725`; reveal `:20678`–`:20681` | efekty traktatu NAP poza K4 |
| `sojusz_defensywny` | ŚCIEŻKA OGÓLNA — jw.; sync → `sojusz`; reveal `:20678`–`:20681` | efekty sojuszu poza K4 |
| `sojusz_pelny` | ŚCIEŻKA OGÓLNA — jw. | jw. |
| `granice` | ŚCIEŻKA OGÓLNA — jw. | rodzaj deala (`:20671`–`:20677`) |
| `wasal` | ŚCIEŻKA OGÓLNA — jw. (bez reveal) | efekty wasalizacji poza K4 |
| `tech` | ŚCIEŻKA OGÓLNA — `oneShotTrade` → `executePnDealTransfer` (G2): `techId` → `executeTechTradeDeal`; koszyk → `grantTechToOwnerWithSideEffects` | ciała `executeTechTradeDealCore` i `grantTechToOwnerWithSideEffects` |
| `ultimatum` | ŚCIEŻKA OGÓLNA — `oneShotTrade` → `executePnDealTransfer` (koszyk lub `goldOnce`) | efekty ultimatum poza K4 (wojna tylko przez `warThreat` przy odrzuceniu, `:17150`–`:17155`, `:17294`–`:17296`) |
| `namow_wojne` | **LUKA W K4** (G3a) — zgoda bez efektu; łapówka nie wypłacana | — |
| `trybut_oferta` | JAWNIE dla `oneShot` (`:20769`–`:20771`); **LUKA W K4** dla `deal` (G3b) | — |
| `umowa_handlowa` | JAWNIE wejście do gałęzi `UmowaSzlakow` (`:20718`); transfer WARUNKOWY `goldOnce > 0` (`:20719`–`:20720`); **KANDYDAT LUKI** dla koszyka (G3c) | UI (`ui/diplomacyTradeBasket.ts`) |
| `umowa_szlakow` | jw. | jw. |
| `handel`, `pokoj`, `trybut_zadanie`, `wchloniecie` | bez zmian względem F1 | — |

**Stan kryterium po rundzie 2:** dla 7 wariantów nadal „ŚCIEŻKA OGÓLNA" (kryterium binarne niespełnione); 2 luki K4 z dowodem (`namow_wojne`, `trybut_oferta` deal); 1 kandydat luki K4 (`umowa_*` koszyk bez `goldOnce`); luka elementu koszyka `jednostka` (G2, no-op). Decyzje o intencji (czy luki są celowe) — do P2.5, zgodnie z F5.

### G5. Ograniczenia

- Brak uruchomienia runtime; wszystkie statusy statyczne.
- `ui/diplomacyTradeBasket.ts` (kto ustawia `goldOnce` dla umów) nie został prześledzony.
- Nie zmieniono sekcji A–F ani nagłówka dokumentu.

## H. Runda 3/5 — R-RUSTPORT-P1-13B-PROPOSAL-COVERAGE-Q1 (Operator, domknięcie NIEPRZEŚLEDZONYCH z G4 i finalny status 15/15)

**Pin i metoda:** `edb8fb56`; każda linia z `git show edb8fb56:<ścieżka>` / `git grep … edb8fb56` wykonane w tej rundzie. Sekcje A–G nie zmienione (tylko dopisanie).

**Zakres statusu (definicja dla kryterium binarnego):** „OBSŁUŻONY WSZĘDZIE" = wariant ma jawną gałąź albo jawnie udokumentowaną ścieżkę ogólną, której ciała helperów są prześledzone w K1–K11; poza zakresem pozostają efekty systemów tur/UI niezależne od `applyProposalOutcome` (wskazane w kolumnie „Granica”).

### H1. Domknięte pozycje z F4 / G4

| Pozycja | Dowód (pin) | Wynik |
|---|---|---|
| `addTreaty` (G2) | `game/diplomacy-treaties.ts:273`–`:278`: normalizacja `rodzaj` (`normalizeTreatyKind`), `strony` przez `pairKey`, zastąpienie po `id`, dopisanie na koniec listy | Zamknięte: jedyny efekt `applyAcceptedProposal` to zapis traktatu |
| `executeTechTradeDealCore` (F4 pkt 1) | `game/diplomacy-tech-trade.ts:168`–`:236`: (1) dawca głównej techn. musi ją posiadać (`ownerHasTech`, :184); (2) tryb `tech`: walidacja `techOfferId`, posiadania oferowanej techn. przez płatnika, podgląd obu grantów (`canGrantTech`) PRZED mutacją; (3) tryb `gold`: sprawdzenie środków płatnika (:223), `grantTech` odbiorcy (:227), dopiero potem `transferGold` (:232–:234). Każde niepowodzenie → `onCancelled`, zero mutacji | Zamknięte: atomowość potwierdzona kodem |
| `executeTechTradeDeal` → deps (F4 pkt 1) | `main.ts:10105`–`:10130`; `grantTech` = `grantTechToOwnerWithSideEffects` (:10125); `canGrantTech` = `grantTechToOwner` (:10122); `ownerHasTech` z `basketTransferCtx` (:10120) | Zamknięte |
| `grantTechToOwnerWithSideEffects` (F4 pkt 1) | `main.ts:10049`–`:10082`: `grantTechToOwner` (silnik, :10051) → gdy `toOwnerId === 0`: `player.zbadane` (:10060–:10062), `reconcilePlayerEraFromResearch` i awans epoki (:10066–:10074); AI: `aiResearchDone` (:10075–:10078), `syncOwnerEraFromResearch` (:10079) | Zamknięte w zakresie głównego ciała. NIEPRZEŚLEDZONE: ciało silnikowego `grantTechToOwner` (poza `main.ts`, zwraca tylko `granted/reason`) |
| Rodzaj deala `granice` (F4 pkt 4) | `game/diplomacy-proposals.ts:1647`–`:1651`: `barbarianCooperation` → `WspolnaWalkaBarbarzyncy`; `borderMilitary` → `PrawoWojskowePrzemarszu`; inaczej → `OtwartGranice`; `buildDeal` :1652–:1663 | Zamknięte: rodzaj zależy wyłącznie od payloadu, trzy wartości, wszystkie trafiają do `addTreaty`. Warunek reveal (:20671–:20677) NIE obejmuje żadnej z trzech — brak odkrycia terytorium jest zamierzony (komentarz :20669–:20670) |
| Rodzaj deala `umowa_*` (F4 pkt 4) | `game/diplomacy-proposals.ts:1548`–`:1558`: `umowa_handlowa` i `umowa_szlakow` → zawsze `RodzajTraktatu.UmowaSzlakow` | Zamknięte (potwierdza G1 pkt 4) |
| `previewNegotiationEntry` (F4 pkt 5) | `main.ts:17550`–`:17593`: dla przychodzącej propozycji najpierw `previewIncomingPlayerAccept` (:17567); w pozostałych przypadkach `evaluateProposal(negotiationAsProposal(entry), ctx)` (:17579) — brak `case` per wariant. Wywołania: `main.ts:17252`, `:17260`, `:17621` | Zamknięte: konsument OGÓLNY (deleguje do K1), 15/15 bez luki |
| `ui/diplomacyTradeBasket.ts` — czy UI zawsze ustawia `goldOnce` dla umów (G5) | `TRADE_BASKET_ACTION_IDS` :2818–:2820 = `2,3,4,6,7,8,9,10,12,13,14,15` — **`'5'` (umowa_szlakow) NIE jest w zbiorze**, komentarz :2813–:2816 (koszyk wyłączony, traktat „idzie od razu na stół"). `buildTreatyPayload` case `'5'` :1197–:1204 ustawia wyłącznie `treatyTurns`, **bez `goldOnce`**. Jedyne `goldOnce` w ścieżce umów: case `'4'` :1155–:1157 (granice, nie umowa), `'8'` offer (:1264, walidacja). Brak producenta `umowa_handlowa` w UI (K7) | Zamknięte: z UI umowa szlaków nie niesie ani koszyka, ani `goldOnce` |

### H2. Dodatkowe ustalenia tej rundy (wpływ na statusy)

1. **Koszyk `'6'` (tech) jest ignorowany przy `techId`** — `main.ts:10243`–`:10246`: `executePnDealTransfer` wykonuje `executeTechTradeDeal` i `return`, zanim dojdzie do `transferBasketItems` (:10248–:10251). `'6'` jest w `TRADE_BASKET_ACTION_IDS` (`ui/diplomacyTradeBasket.ts:2819`), a `buildTreatyPayload` case `'6'` (:1205–:1215) + dopięcie `giveItems/receiveItems` (:1225–:1232) pozostawia koszyk w payloadzie. Walidacja trybu `treaty` (:1272–:1290) nie zakazuje koszyka dla `'6'` (`validateTreatyForm` dla `'6'` NIEPRZECZYTANE). **LUKA: pozycje koszyka tech-trade znikają bez komunikatu.**
2. **Koszyk `'9'` (ultimatum) przy niepustym koszyku pomija `goldOnce`** — `main.ts:10248`–`:10251` (`return` przed :10253). `'9'` jest w `TRADE_BASKET_ACTION_IDS` (:2819); `buildTreatyPayload` case `'9'` (:1220–:1223) ustawia `goldOnce` i dopina koszyk. `evaluateProposal` `ultimatum` akceptuje wyłącznie na podstawie `goldOnce` (`diplomacy-proposals.ts:1678`–`:1679`). **LUKA: ultimatum zaakceptowany, koszyk przeniesiony, złoto NIE przelane.**
3. **Warunkowa luka `umowa_*` poza UI** — `main.ts:20718`–`:20721`: transfer tylko przy `goldOnce > 0`; gałąź `else if` (:20725) jest dla tego rodzaju nieosiągalna. Z UI nieosiągalna (pkt H1). Osiągalność przez payload AI/kontroferty NIEPRZEŚLEDZONA.
4. **Asymetria zdarzeń trybutu (K4)** — `trybut_zadanie` deal dostaje `trybut_zaakceptowany` przez `else if` (:20776–:20778). `trybut_oferta` deal nie dostaje `trybut_oferta_przyjeta` (jedyna emisja :20771 w gałęzi `oneShotTrade`). Złoto per tura dla obu idzie przez `pieniadzePerTura` (`diplomacy-proposals.ts:1183`, `:1374`) czytane w `game/diplomacy-economy.ts:97`, `:135` — **zapłata NIE jest luką**, luką jest brak zdarzenia relacji dla wariantu `deal`.
5. **Konsument K12 (nowy):** `previewNegotiationEntry` — OGÓLNIE 15/15 (delegacja do K1).

### H3. Finalny status 15/15 (dla kryterium binarnego)

| # | Wariant | Status | Dowód i granica |
|---|---|---|---|
| 1 | `nap` | **OBSŁUŻONY WSZĘDZIE** | K1 :1039, K2 :1995, K3 :17508, K6 :17491, K8 tak, K9 OK; K4 ścieżka ogólna: `addTreaty` (H1), `syncRelationFromDeals` → `pokoj` (G2), koszyk :20725–:20733; K5 członkostwo PEACE_REQUIRED + SWEETENER |
| 2 | `sojusz_defensywny` | **OBSŁUŻONY WSZĘDZIE** | K4: `addTreaty`, sync → `sojusz` (`isAllianceDealKind`, G2), jawny reveal :20673; koszyk :20725; K1–K9 jw. |
| 3 | `sojusz_pelny` | **OBSŁUŻONY WSZĘDZIE** | K4: jw., reveal :20674 |
| 4 | `granice` | **OBSŁUŻONY WSZĘDZIE** | K4: rodzaj z payloadu (:1647–:1651, H1), `addTreaty`, brak reveal zamierzony (:20669–:20670), koszyk :20725; K1 :1622, K2 :2034, K3 :17514, K6 :17491, K8 tak |
| 5 | `wasal` | **OBSŁUŻONY WSZĘDZIE** | K1 :1684, K2 :2084, K3 :17536, K6 :17493, K8 tak; K4 ścieżka ogólna: deal `Wasalizacja` (:1693), `addTreaty`, koszyk :20725; płatność per tura `diplomacy-economy.ts:135` |
| 6 | `tech` | **LUKA W K4** (`main.ts:10243`–`:10246`) | Ścieżka złota i tech-za-tech w `executeTechTradeDealCore` (`diplomacy-tech-trade.ts:168`–`:236`) — **OBSŁUŻONA**, ale koszyk przy `techId` jest porzucany (H2 pkt 1). Osiągalność z UI: `'6'` w `TRADE_BASKET_ACTION_IDS`; walidacja do potwierdzenia |
| 7 | `ultimatum` | **LUKA W K4** (`main.ts:10248`–`:10251`) | Akceptacja na `goldOnce` (`diplomacy-proposals.ts:1678`); przy niepustym koszyku złoto pominięte (H2 pkt 2). Osiągalność z UI: `'9'` w `TRADE_BASKET_ACTION_IDS`, `goldOnce` ustawiane w `buildTreatyPayload`. Odrzucenie → wojna przez `warThreat` (`main.ts:17150`–`:17155`) — OK |
| 8 | `handel` | **OBSŁUŻONY WSZĘDZIE** | K4 :20701 (zaufanie, pokrycie), oneShot :20748; K1 :1380, K2 :2101, K3 :17517, K6 :17492, K11a `allowsMultipleOwnOutgoingNegotiations` |
| 9 | `umowa_handlowa` | **LUKA W K4 (warunkowa, poza UI)** | Rodzaj `UmowaSzlakow` (:1555–:1558); koszyk przenoszony tylko przy `goldOnce > 0` (:20719); z UI nieosiągalne (H1), AI-producent NIEPRZEŚLEDZONY |
| 10 | `umowa_szlakow` | **LUKA W K4 (warunkowa, poza UI)** | jw. (:20718–:20721); z UI: brak koszyka i `goldOnce` → zachowanie zamierzone, bez luki |
| 11 | `trybut_zadanie` | **OBSŁUŻONY WSZĘDZIE** | K4 deal → `trybut_zaakceptowany` :20776–:20778; płatność per tura `pieniadzePerTura` :1183 + `diplomacy-economy.ts:135`; K1 :1144 |
| 12 | `trybut_oferta` | **LUKA W K4** (`main.ts:20659`–`:20735`) | Wariant `oneShot` → `trybut_oferta_przyjeta` :20769–:20771 — OBSŁUŻONY. Wariant `deal` (:1377) → brak zdarzenia `trybut_oferta_przyjeta` (asymetria z `trybut_zadanie`, H2 pkt 4). Zapłata per tura OK |
| 13 | `namow_wojne` | **LUKA W K4** (brak gałęzi `main.ts:20605`–`:20775`) | Zgoda (`diplomacy-proposals.ts:1576`) bez `deal`/`oneShotTrade`; łapówka `bribeGold` nie wypłacana (G3a); wojna tylko przez `warThreat`, którego `'7'` nie ustawia (`ui/diplomacyTradeBasket.ts:1218`–`:1219`) |
| 14 | `wchloniecie` | **LUKA W K2 i K8** | K4 jawnie :20620–:20638; K2 brak `case` (`diplomacy-proposals.ts:1994`–`:2197`, `default` :2194); K8 brak wpisu `traktaty` (E2a); K10 :17174 wyjątek toastu |
| 15 | `pokoj` | **OBSŁUŻONY WSZĘDZIE** | K4 jawnie :20772 (`finalizePeaceTreatyBetween`); K1 :1189, K2 :2032, K3 :17534, K6 :17491, K8 tak |

**Podsumowanie:** OBSŁUŻONE WSZĘDZIE: 8 (`nap`, `sojusz_defensywny`, `sojusz_pelny`, `granice`, `wasal`, `handel`, `trybut_zadanie`, `pokoj`). LUKI z dowodem: 7 (`tech`, `ultimatum`, `umowa_handlowa`, `umowa_szlakow` — warunkowo poza UI, `trybut_oferta`, `namow_wojne`, `wchloniecie`). Kryterium binarne z dispatchu jest **spełnione** (każdy z 15 ma jawny status z dowodem), ale wynik jest **negatywny dla parytetu**: 2 luki są osiągalne z UI (`tech` koszyk, `ultimatum` złoto), 1 jest luką zdarzenia (`trybut_oferta`), 1 luką mechaniki (`namow_wojne`), 1 luką danych (`wchloniecie`).

### H4. Ograniczenia (jawnie NIEPRZEŚLEDZONE)

- Brak uruchomienia runtime — wszystkie statusy są statyczne (`git show`/`git grep` na `edb8fb56`).
- Ciało silnikowego `grantTechToOwner` (poza `main.ts`) — tylko kontrakt `granted/reason`.
- `normalizeTreatyKind` (`diplomacy-treaties.ts`) — użycie w `addTreaty` potwierdzone, ciało nie.
- `validateTreatyForm` dla `'6'` i `'9'` — czy zakazuje koszyka (decyduje o osiągalności LUK 6 i 7 z UI).
- Osiągalność `umowa_*` z payloadów AI / kontroferty (`applyCounterOffer`) — nieprzesądzona.
- Skutki traktatów (`addTreaty`) w systemach tur poza K4 — poza definicją zakresu (H-zakres).

### H5. Wniosek dla P2.5

- Kontrakt frontend→Rust musi odtworzyć koszyk tech-trade i koszyk ultimatum jako jawne reguły (LUKA 6 i 7 — decyzja: naprawić w web przed portem, czy świadomie odtworzyć błąd; wymaga decyzji właściciela, nie domyślania).
- `trybut_oferta` (deal): decyzja, czy przyjęcie cyklicznego trybutu emituje zdarzenie relacji (LUKA 12).
- `namow_wojne`: decyzja, czy łapówka ma skutek (LUKA 13).
- `wchloniecie`: decyzja projektowa dla K2 i K8 (LUKA 14, jak w E4).
- `umowa_*`: rozstrzygnąć, czy payload AI może nieść koszyk bez `goldOnce` (LUKA 9–10, warunkowa).
- Pokrycie K11 i K12 bez luk wariantowych.
