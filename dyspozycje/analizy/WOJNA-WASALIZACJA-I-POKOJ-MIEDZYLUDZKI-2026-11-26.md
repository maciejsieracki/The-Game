# Wojna: wasalizacja i pokój między graczami (hotseat) — ścieżki końca wojny (luka L6)

DATA: 2026-11-26 | TEMAT: R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1 | BAZA: origin/main 9c5344dd1 (kod gry nietknięty; kandydat b2e9c2f2a)
ŹRÓDŁO LUKI: dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md (P17, P21, L6)
ZAKRES: analiza kodu (odczyt plik:linia) + probe źródłowy `gra/tools/war-end-vassal-human-probe-test.cjs`. Brak zmian w gra/src i gra/data. Brak testu behawioralnego (patrz §6, NIE ZMIERZONO).
RUNDA: 2/5 (obrona po zarzutach Evaluatora 606b2a26f)

## 1. Wynik w skrócie

| Ścieżka | Klasyfikacja | Skutek dla gracza |
|---|---|---|
| P17a Wasalizacja (akcja `12`) jako koniec wojny | ZGODNA z regułą | Wasalizacja w trwającej wojnie jest zablokowana (silnik + UI). Nie kończy wojny i nie zmienia jej liczników. |
| P17b Oferta trybutu w wojnie (`trybut_oferta`) z opłatą cykliczną | BŁĄD GRY (kandydat, potwierdzony w kodzie; zachowanie na żywo NIE ZMIERZONO) | Ścieżka modala „Zaproponuj trybut” (`diplomacyNegotiationModal.ts`, case `8`) w wojnie wysyła `goldPerTurn` bez `goldOnce`; silnik akceptuje to jako trwały traktat typu Wasalizacja, a wojna trwa dalej. Komentarz UI mówi „tylko jednorazowe reparacje”. |
| P21a Propozycja pokoju gracz↔AI (`pokoj`/`rozejm`) przed 10. turą | ZGODNA z regułą | Silnik i UI blokują (`peaceProposalBlocked`, notka „dostępne za N tur”). |
| P21b Propozycja pokoju między dwoma fotelami ludzkimi (hotseat) przed 10. turą | LUKA — kandydat BŁĄD GRY; zamierzoność NIEPOTWIERDZONA | Brak bramki 10 tur w proponowaniu, akceptacji i w UI. Decyzja, czy hotseat ma mieć ochronę, należy do właściciela (§5). |
| P21c (nowe) Propozycja pokoju między fotelami, które NIE są w wojnie | BŁĄD GRY (kandydat, potwierdzony w kodzie; live NIE ZMIERZONO) | Silnik nie sprawdza stanu wojny ani w proponowaniu, ani w akceptacji; `finalizePeaceTreatyBetween` ustawia status `pokoj` i blokadę dla dowolnej pary. Dla pary AI ta sama sytuacja jest odrzucana (`Pokój — brak trwającej wojny`). |

## 2. Wasalizacja (P17)

### 2.1 Wasalizacja nie może być zawarta w trwającej wojnie — ZGODNA
- Silnik: `gra/src/game/diplomacy-proposals.ts:1589-1591` — gdy `stanWojny`, dozwolone są tylko `trybut_oferta`, `ultimatum`, `pokoj`, `rozejm`; każda inna akcja (w tym `wasal`) zwraca `Trwa wojna — ta akcja jest niedostępna`.
- UI: `gra/src/game/diplomacy-locks.ts:373` — `case '12'`: `if (ctx.atWar) return { locked: true, note: 'zablokowana — trwa wojna' }`.
- Wniosek: wasalizacja NIE kończy wojny (nie ma ścieżki, która by to robiła) i nie dotyka liczników wojny.

### 2.2 Ścieżki, które ustanawiają/znoszą wasalizację (plik:linia)
- Ustanowienie przez akcję `wasal`: `gra/src/game/diplomacy-proposals.ts:2532-2552` (ewaluacja), `:3081-3096` (budowa traktatu po akceptacji).
- Ustanowienie przez `trybut_zadanie` i `trybut_oferta` (typ `RodzajTraktatu.Wasalizacja`): `diplomacy-proposals.ts:2191-2221` (ewaluacja trybut_oferta; gałąź jednorazowa `goldOnce` w `:2202`), `:3165-3196` (budowa po akceptacji).
- Ustanowienie przez AI↔miasto-państwo: `gra/src/main.ts:47048-47072` (decyzja `trybut`/`wasal` z `ai-cs-absorption.ts`).
- Zniesienie: wchłonięcie miasta-państwa `gra/src/main.ts:27203-27204` (usuwa wasalizację przy aneksji), `diplomacy-border-march.ts:88`, filtry `main.ts:25748, 25917, 26038`.
- Brak ścieżki wasalizacji zmieniającej `status` na `wojna`.

### 2.3 Wpływ przyjęcia traktatu na stan wojny — brak zmiany statusu, ale zmiana zaufania
- `applyProposalOutcomeImpl` (`gra/src/main.ts:27145`): zawarcie traktatu generycznego (`result.deal`) dodaje traktat do `activeDeals` bez zapisu `status` relacji.
- Gałęzie trybutu NIE zapisują statusu, ale wołają `setDiploRelation` ze zdarzeniem zaufania: odmowa `trybut_odmowa` (`gra/src/main.ts:27160`), przyjęta oferta `trybut_oferta_przyjeta` (`main.ts:27355`), zaakceptowane żądanie `trybut_zaakceptowany` (`main.ts:27376`). Zmieniają Zaufanie/respekt, nie status.
- Jedyne miejsca w `applyProposalOutcomeImpl` zmieniające status pary to wywołania `finalizePeaceTreatyBetween`: `main.ts:27357` (pokój) i `main.ts:27369` (rozejm). Sprawdzono grep zakresu 27140-27380: brak wywołań `countActiveWars*`, `warTypesForOwner`, `pendingPrincipal`, `warWearinessByPairKey`, `cleanup*ForcedWarOnPeace`.
- Wniosek: wasalizacja/trybut nie zmienia `status`, nie czyści `countActiveWarsForOwner*`, `pendingPrincipal`, `warTypesForOwner` ani `warWearinessByPairKey`. Dla wojny istniejącej to nie ma znaczenia, bo wasalizacja w wojnie jest zablokowana (§2.1).
- Odczyty liczników (bez zapisu): `countActiveWarsForOwner` `main.ts:26091`, `countActiveWarsForOwnerExcludingBarbarians` `main.ts:26107`, `warTypesForOwner` `main.ts:26120` (użycie `pendingPrincipalCounts` w `:26134`). `pendingPrincipal` powstaje wyłącznie w ścieżce wypowiedzenia wojny (`main.ts:26296`).
- `warWearinessByPairKey`: czyszczony w `cleanupRegularWarOnPeace` (`main.ts:12921`), które wywołuje `finalizePeaceTreatyBetween` (`main.ts:13041`); zapis przez `runWarWearinessTick` (`main.ts:40863`); wczytanie `main.ts:52411`. Ścieżka wasalizacji tego nie dotyka.
- `cleanup*ForcedWarOnPeace`: wywoływane tylko z `finalizePeaceTreatyBetween` (`main.ts:13038`, `:13040`) i z `sweepStaleForcedWarEntries` (`main.ts:12902`, `:12905`). Wasalizacja nie wywołuje `finalizePeaceTreatyBetween`, więc nie sprząta wojen wymuszonych epoki. Czyszczenie wojen epoki z wasalem pozostaje NIE ZMIERZONO (L2).

### 2.4 Wpis dla gracza („Wydarzenia na świecie”)
- Wpis świata powstaje w `recordAiAiWarPeaceNews` (`gra/src/main.ts:27094-27122`), przyjmującym `prevStatus`/`nextStatus`. Wpis jest tworzony przy zmianie statusu pary; wasalizacja i trybut nie zmieniają statusu, więc nie tworzą wpisu. Pełna lista wywołań `recordAiAiWarPeaceNews` NIE ZMIERZONO.
- Wniosek: brak wpisu „Wydarzenia na świecie” o samej wasalizacji (zgodne z kodem). Czy wpis ma być — decyzja wyglądu, do właściciela (§5, opcjonalnie).

### 2.5 Kandydat BŁĄD GRY (P17b): trybut cykliczny w wojnie — niespójność silnik↔UI
- Silnik przepuszcza `trybut_oferta` w wojnie: `diplomacy-proposals.ts:1589-1591` (gate `stanWojny` wyklucza wszystko poza `trybut_oferta`, `ultimatum`, `pokoj`, `rozejm`); `diplomacy-war-gates.ts:11` (`PEACE_CURRENCY_ACTION_IDS` zawiera `trybut_oferta`, więc waluta w wojnie jest dozwolona, `:48-56`).
- Gałąź `case 'trybut_oferta'` (`diplomacy-proposals.ts:2191-2221`) NIE odwołuje się do stanu wojny (probe: „odwołania do stanu wojny w gałęzi trybut_oferta (+40 linii): BRAK”). Gdy `goldOnce` jest pusty lub 0, buduje trwały traktat `RodzajTraktatu.Wasalizacja` z `pieniadzePerTura: perTurn` (`:2217`).
- Źródło wyjścia do cyklicznego trybutu w wojnie: modal negocjacji, `gra/src/ui/diplomacyNegotiationModal.ts:425-431` (case `8`): dla `tributeMode === 'offer'` wysyła `goldPerTurn: gpt` i NIE ustawia `goldOnce` (probe: `goldOnce` w module tylko w liniach 38, 404, 414, 435 — w innych case’ach). Mapowanie na `trybut_oferta`: `diplomacyNegotiationModal.ts:579`.
- Koszyk (`gra/src/ui/diplomacyTradeBasket.ts:1338`) w trybie „offer” ustawia `goldOnce = goldPerTurn`, więc ścieżka koszyka trafia w jednorazową gałąź (`:2202`). Ścieżka modala tej zasady nie ma.
- Reguła wg UI: `gra/src/game/diplomacy-locks.ts:333-334` (`case '8'`, gałąź `ctx.atWar`): „W wojnie: tylko oferta jednorazowych reparacji za pokój — zawsze dostępne” (notka `oferta reparacji za pokój`). Blokady wojenne nie ograniczają payloadu, więc modal jest klikalny w wojnie.
- Wniosek: niespójność potwierdzona w kodzie (silnik akceptuje cykliczny `trybut_oferta` w wojnie, UI deklaruje jednorazowy). Zachowanie na żywo w modalu NIE ZMIERZONO.
- Minimalne odtworzenie (dla następnej rundy, bez zmiany gry): `evaluateProposal` z `stanWojny=true`, `actionId='trybut_oferta'`, `payload={ goldPerTurn: X }` bez `goldOnce`, `X >= progTrybutOfertaMinGold` (domyślnie 5, `gra/src/game/diplomacy.ts:283`) i przy `nearWar` (lub wartości powyżej progu epoki). Obecnie: `accepted:true`, `deal` typu Wasalizacja. Oczekiwane wg komentarza UI: `accepted:false`.

## 3. Pokój między dwoma fotelami ludzkimi (P21)

### 3.1 Ścieżka hotseat (kod, plik:linia)
- Propozycja: `gra/src/main.ts:23003` (`proposeToHuman`, brak bramki), wywołanie z HUD: `main.ts:23165-23167` (`onPropose` → `proposeToHuman(meId, otherOwnerId, cmd, …)`). HUD otwierany tylko w hotseat: `main.ts:23134-23135` (`isHotSeat`).
- Formularz: `gra/src/ui/interHumanDiplomacyHud.ts:26, 32` — rodzaj `zaproponuj_pokoj` jest zawsze na liście; w pliku nie ma warunku wojny ani licznika tur (grep `wojna|war` w HUD: tylko komentarze, zob. §7).
- Akceptacja: `gra/src/main.ts:23035` (`respondToHumanProposal`), gałąź `zaproponuj_pokoj` w `main.ts:23056-23057` (`finalizePeaceTreatyBetween(p.fromOwnerId, p.toOwnerId)`, potem `logPeaceVazne`). Probe: w zakresie 23035-23080 brak `peaceProposalIsTooEarly` i brak sprawdzenia `status === 'wojna'`/`atWar`.

### 3.2 Gdzie stosuje się bramkę 10 tur (wszystkie wywołania `peaceProposalIsTooEarly`)
`peaceProposalIsTooEarly` (`main.ts:12552`) jest wołane wyłącznie w (probe, lista pełna):
- `main.ts:21598` (`ownerId` vs `ME()`), `:22359` i `:22393` (`ME()` vs AI), `:27716` (`ME()` vs owner), `:40680` (`registerAiAiPeaceRequest`, para AI↔AI).
- Engine: `diplomacy-proposals.ts:1579` (`evaluateProposal`, `peaceProposalBlocked`), wywoływane tylko przez ścieżkę AI i gracz↔AI.
- UI: `diplomacy-locks.ts:348-362` (`case '10'`) i `:325-331` (`case '8'` w wojnie) — licznik „dostępne za N tur” dla gracza wobec AI.
- `main.ts:27845` (`turnsAtWar: diploWarStateForRead(ME(), ownerId)`) jest ODCZYTEM stanu do renderu, nie bramką; wcześniej w §3.2 nie był wymieniony (poprawka).
- Wniosek: żadne wywołanie nie obejmuje pary dwóch fotelów ludzkich. Komentarz `diplomacy-peace-proposal-timing.ts:1` („First ten completed turns of each active war are protected from peace offers”) opisuje regułę ogólnie, bez wyjątku dla hotseat.

### 3.3 Skutek dla gracza
- Gracz A (fotel 1) w wojnie z graczem B (fotel 2) od tury 1 może wysłać propozycję pokoju i po akceptacji B pokój zostaje zawarty od razu (`finalizePeaceTreatyBetween`), bez licznika i bez notki „dostępne za N tur”.
- Gracz w hotseat ma inne doświadczenie niż gracz↔AI. Czy to zamierzone — decyzja właściciela (§5).
- Klasyfikacja P21b: LUKA (kandydat BŁĄD GRY), zamierzoność NIEPOTWIERDZONA. Uzasadnienie: reguła w komentarzu jest ogólna, a gałąź hotseat nie ma wyjątku ani komentarza.

### 3.4 Pokój między fotelami bez wojny (P21c, nowe)
- `finalizePeaceTreatyBetween` (`main.ts:12957-12969`, probe: brak odwołań do statusu wojny w pierwszych 12 liniach) nie sprawdza `status`. Ustawia `status: 'pokoj'` (`main.ts:12988` i `:12996` przez `setDiploRelation`) i `startPeaceTreatyLock` dla dowolnej pary.
- Ścieżka hotseat (§3.1) nie sprawdza wojny przy propozycji ani przy akceptacji.
- Dla pary AI ta sama sytuacja jest odrzucana w `evaluateProposal`: `diplomacy-proposals.ts:1583-1587` (`Pokój — brak trwającej wojny`, `Rozejm — brak trwającej wojny`).
- Skutek dla gracza: dwa fotele, które nie są w wojnie, mogą zawrzeć pokój przez hotseat.
- Klasyfikacja: BŁĄD GRY (kandydat, kod potwierdzony). Live NIE ZMIERZONO: czy HUD w ogóle pozwala wysłać propozycję do pary bez wojny (formularz jest bezwarunkowy w kodzie, ale nie uruchomiono gry).

## 4. Propozycja naprawy (bez implementacji)

1. (Priorytet 1, BŁĄD GRY P21c) Dodać sprawdzenie stanu wojny dla `zaproponuj_pokoj` w `proposeToHuman`/`onPropose` (`main.ts:23003, 23165`) i w `respondToHumanProposal` (`main.ts:23056`). Wzór: `Pokój — brak trwającej wojny` jak w `diplomacy-proposals.ts:1583-1587`.
2. (Priorytet 2, BŁĄD GRY P17b) Zawęzić `trybut_oferta` w wojnie do jednorazowego `goldOnce`: w `diplomacy-proposals.ts:2191-2221` odrzucać cykliczny payload w wojnie albo w `diplomacyNegotiationModal.ts:425-431` ustawiać `goldOnce` jak koszyk (`diplomacyTradeBasket.ts:1338`). Wybór wariantu zależy od pytania §5.
3. (Priorytet 3, LUKA P21b) Bramka `peaceProposalIsTooEarly(a, b, 'pokoj')` dla hotseat — tylko po decyzji właściciela (§5). Wymaga licznika w `interHumanDiplomacyHud.ts`.
4. (Priorytet 4, L2/L6) Test behawioralny ścieżek P17b i P21 w grze (live, zob. §6) — do zrobienia w następnej rundzie.

## 5. Pytania do właściciela (tylko zmiany mechaniki/wyglądu)

- PYTANIE (pełne ID: R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1 · §3.3): czy pokój między dwoma graczami na hotseat ma wymagać tych samych 10 pełnych tur wojny co pokój z AI? (A: tak, ta sama reguła i licznik — gra wyrównana; B: nie, gracze mogą kończyć wojnę od razu — szybsza gra kosztem spójności.)
  Szczegóły: `peaceProposalIsTooEarly`, `interHumanDiplomacyHud.ts`.
- PYTANIE (pełne ID: R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1 · §3.4): czy dwa fotele bez wojny mogą w ogóle zawierać pokój przez hotseat? (A: nie — pokój tylko w wojnie, jak z AI; B: tak — pokój jako umowa dwóch graczy poza wojną.)
  Szczegóły: `finalizePeaceTreatyBetween`, `interHumanDiplomacyHud.ts`.
- PYTANIE (pełne ID: R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1 · §2.5): cykliczny trybut w wojnie — czy ma być dozwolony (gracz płaci lub pobiera złoto co turę, a wojna trwa), czy tylko jednorazowy (jak opisuje ekran)?
  Szczegóły: `trybut_oferta`, `diplomacyNegotiationModal.ts`.
- Opcjonalnie: czy o samej wasalizacji ma być wpis w „Wydarzeniach na świecie” (§2.4). Nie blokuje.

Decyzje inżynierskie (progi, nazwy testów, format raportu) rozstrzyga orkiestrator; nie są tu pytaniem.

## 6. Testy i bramki

- Probe źródłowy: `gra/tools/war-end-vassal-human-probe-test.cjs` (nowy, tylko odczyt plików; nie jest testem regresji). Uruchomienie: `cd gra && node tools/war-end-vassal-human-probe-test.cjs`, exit 0.
- Surowy wynik probe (uruchomienie r2, na kandydacie b2e9c2f2a):

```
== P17: wasalizacja (akcja 12) w wojnie ==
diplomacy-proposals: blokada akcji w wojnie (stanWojny, poza trybut/ultimatum/pokoj/rozejm): 1589
diplomacy-locks: case 12 zablokowana w wojnie: 373,380
== P17b: trybut_oferta w wojnie ==
diplomacy-war-gates: PEACE_CURRENCY_ACTION_IDS zawiera trybut_oferta: 11
diplomacy-proposals: gałąź case trybut_oferta (start): 2191,3178
  odwołania do stanu wojny w gałęzi trybut_oferta (+40 linii): BRAK
  rozgałęzienie jednorazowe (goldOnce > 0): 2202
UI modal: case 8 wysyła tributeMode/goldPerTurn (linia): 429
UI modal: case 8 ustawia goldOnce (linie): 38,404,414,435
== P21b: pokój między fotelami (hotseat) ==
main.ts: start proposeToHuman / respondToHumanProposal / finalizePeaceTreatyBetween: 23003 / 23035 / 12957
main.ts: peaceProposalIsTooEarly w proposeToHuman (+12 linii): BRAK
main.ts: peaceProposalIsTooEarly w respondToHumanProposal (+45 linii): BRAK
main.ts: sprawdzenie atWar/status==wojna w respondToHumanProposal (+45 linii): BRAK
main.ts: sprawdzenie status==wojna w finalizePeaceTreatyBetween (+12 linii): BRAK
main.ts: wywołania peaceProposalIsTooEarly (wszystkie linie): 12552,21598,22359,22393,27716,40680
main.ts: akceptacja zaproponuj_pokoj -> finalizePeaceTreatyBetween: 23057
timing: brak wyjątku hotseat/fotel w diplomacy-peace-proposal-timing: BRAK
== Pozostałe odczyty (wasalizacja nie zmienia statusu) ==
main.ts: applyProposalOutcomeImpl trybut_odmowa / trybut_oferta_przyjeta (zaufanie, bez statusu): 22244,22937,26726,27160,27355
main.ts: zapis status w gałęziach wasal/trybut (applyProposalOutcomeImpl, +220 linii): BRAK
PROBE OK
EXIT=0
```

- Behawioralny test w grze (`evaluateProposal` w runtime, live Chromium/hotseat): NIE ZMIERZONO w tej rundzie.
- `git diff --stat` tej rundy: dyspozycje/ + gra/tools/war-end-vassal-human-probe-test.cjs. Zero zmian w gra/src, gra/data, gra-robocza/, gra-kanon/, WERSJE.md, rust-port/.
- `tsc`: nie uruchamiano (brak zmian w kodzie gry).

## 7. Luki i NIE ZMIERZONO

- Zachowanie na żywo: modal „Zaproponuj trybut” w wojnie (P17b), HUD hotseat dla pary bez wojny (P21c), propozycja pokoju w hotseat przed 10. turą (P21b).
- Cleanup wojen epoki z wasalem (`cleanup*ForcedWarOnPeace`) — NIE ZMIERZONO (L2). Odczytano tylko punkty wywołań (§2.3).
- Pełna lista wywołań `recordAiAiWarPeaceNews` — NIE ZMIERZONO (§2.4).
- Test `finalizePeaceTreatyBetween` dla pary bez wojny w runtime — NIE ZMIERZONO (kod potwierdzony, §3.4).
- HUD hotseat: w `interHumanDiplomacyHud.ts` nie znaleziono warunku wojny. Pełna zawartość formularza nie była analizowana linia po linii (tylko grep `wojna|war|atWar|turn`).
