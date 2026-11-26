# Wojna: wasalizacja i pokój między graczami (hotseat) — ścieżki końca wojny (luka L6)

DATA: 2026-11-26 | TEMAT: R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1 | BAZA: origin/main 9c5344dd1 (kod nietknięty)
ŹRÓDŁO LUKI: dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md (P17, P21, L6)
ZAKRES: analiza kodu (odczyt plik:linia). Brak zmian w gra/src i gra/data. Brak nowego testu (patrz §5, NIE ZMIERZONO).

## 1. Wynik w skrócie

| Ścieżka | Klasyfikacja | Skutek dla gracza |
|---|---|---|
| P17a Wasalizacja (akcja `12`) jako koniec wojny | ZGODNA z regułą | Wasalizacja w trwającej wojnie jest zablokowana (silnik + UI). Nie kończy i nie tworzy wojny. |
| P17b Oferta trybutu w wojnie (`trybut_oferta`) z opłatą cykliczną | NIE ZMIERZONO (podejrzenie niespójności, kandydat) | Silnik akceptuje w wojnie cykliczny trybut (traktat typu Wasalizacja) bez zmiany statusu wojny. Opis UI w blokadzie mówi „tylko jednorazowe reparacje”. |
| P21a Propozycja pokoju gracz↔AI (`pokoj`/`rozejm`) przed 10. turą | ZGODNA z regułą | Silnik i UI blokują (`peaceProposalBlocked`, notka „dostępne za N tur”). |
| P21b Propozycja pokoju między dwoma fotelami ludzkimi (hotseat) przed 10. turą | BŁĄD GRY (luka bramki, kandydat R-WEB-*) | Brak bramki 10 tur w proponowaniu, w akceptacji i w UI. Pokój można zaproponować i zawrzeć od pierwszej tury wojny. |

## 2. Wasalizacja (P17)

### 2.1 Wasalizacja nie może być zawarta w trwającej wojnie — ZGODNA
- Silnik: `gra/src/game/diplomacy-proposals.ts:1589-1591` — gdy `stanWojny`, dozwolone są tylko `trybut_oferta`, `ultimatum`, `pokoj`, `rozejm`; każda inna akcja (w tym `wasal`) zwraca `Trwa wojna — ta akcja jest niedostępna`.
- UI: `gra/src/game/diplomacy-locks.ts:372-373` — `case '12'`: `if (ctx.atWar) return { locked: true, note: 'zablokowana — trwa wojna' }`.
- Wniosek: wasalizacja NIE kończy wojny (nie ma ścieżki, która by to robiła). Zgodne z regułą „wojna kończy się pokojem/rozejmem”, a wasalizacja wymaga pokoju. Nie ma zmiany liczników wojny przez wasalizację.

### 2.2 Ścieżki, które ustanawiają/znoszą wasalizację (plik:linia)
- Ustanowienie przez akcję `wasal`: `gra/src/game/diplomacy-proposals.ts:2532-2552` (ewaluacja), `:3081-3096` (budowa traktatu po akceptacji).
- Ustanowienie przez `trybut_zadanie` i `trybut_oferta` (typ `RodzajTraktatu.Wasalizacja`): `diplomacy-proposals.ts:2191-2221`, `:3165-3196`. Traktat tributowy jest w silniku typu Wasalizacja.
- Ustanowienie przez AI↔miasto-państwo: `gra/src/main.ts:47048-47072` (decyzja `trybut`/`wasal` z `ai-cs-absorption.ts`).
- Zniesienie: wchłonięcie miasta-państwa `gra/src/main.ts:27203-27204` (usuwa wasalizację przy annexie), `diplomacy-border-march.ts:88`, sprawdzenia `main.ts:25748, 25917, 26038` (filtry sojuszy AI, wykluczenie wasali).
- Zniesienie przy wojnie wymuszonej: nie znaleziono ścieżki zmieniającej status na `wojna` z powodu wasalizacji (grep `Wasalizacja` w `main.ts`: brak zapisu `status` w ścieżkach wasalizacji).

### 2.3 Wpływ przyjęcia traktatu na stan wojny — brak zmiany statusu
- `applyProposalOutcome` (`gra/src/main.ts:27140` wrapper, `applyProposalOutcomeImpl` od `:27145`): zawarcie traktatu generycznego (`result.deal`) dodaje traktat do `activeDeals` bez zapisu `status` relacji. Jedyne gałęzie zmieniające relację po akceptacji to `pokoj` → `finalizePeaceTreatyBetween` (`main.ts:27356`) oraz `rozejm` → `finalizePeaceTreatyBetween` z długością (`main.ts:27362`).
- Wniosek: wasalizacja nie zmienia `status` relacji i nie czyści `countActiveWarsForOwner*`, `pendingPrincipal`, `warTypesForOwner` ani `warWearinessByPairKey`. Dla wojny, która już istnieje, nie ma zmiany stanu wojny przy wasalizacji.
- Czyszczenie wojen epoki z wasalem (`cleanup*ForcedWarOnPeace`): NIE ZMIERZONO w tym temacie (wymaga osobnej ścieżki P-epoki; przypisane do L2 z WARENDP).

### 2.4 Wpis dla gracza („Wydarzenia na świecie”)
- Akceptacja wasalizacji/trybutu: w gałęziach `applyProposalOutcomeImpl` dla wasal/trybut nie znaleziono wywołania logu „Wydarzenia” (sprawdzono grep na gałęziach `cywAction`, `main.ts:27356-27370`); czy wpis powstaje z innego miejsca — NIE ZMIERZONO. Wpisy wojenne (FALA 904/909) dotyczą końca wojny, nie wasalizacji. Klasyfikacja: ZGODNE z tym, że wasalizacja nie kończy wojny; brak wpisu o samej wasalizacji — NIE ZMIERZONO w UI (decyzja wyglądu, do właściciela, jeśli ma być).

### 2.5 Kandydat BŁĄD GRY (niespójność): trybut cykliczny w wojnie
- Silnik: `diplomacy-proposals.ts:1589` przepuszcza `trybut_oferta` w wojnie. Gałąź `case 'trybut_oferta'` (`:2191-2221`) nie sprawdza wojny i dla `goldPerTurn` (bez `goldOnce`) tworzy trwały traktat `RodzajTraktatu.Wasalizacja` (payer = proposer), bez zmiany `status`.
- UI: `gra/src/game/diplomacy-locks.ts:320-335` — w wojnie komentarz mówi „W wojnie: tylko oferta jednorazowych reparacji za pokój — zawsze dostępne” (`:333`), czyli cykliczny trybut w wojnie ma być niedostępny.
- Rozbieżność: UI opisuje regułę „tylko jednorazowe”, silnik akceptuje cykliczne. Czy UI faktycznie wysyła `goldPerTurn` w wojnie — NIE ZMIERZONO (nie czytano modala negocjacji). Jeśli wysyła, to BŁĄD GRY (wojna trwa, a gracz płaci lub pobiera trybut bez zakończenia wojny).
- Minimalne odtworzenie (do wykonania przez Operatora w następnej rundzie, bez zmiany gry): `proposalEngine` z `stanWojny=true`, `actionId='trybut_oferta'`, `payload.goldPerTurn=5` → oczekiwane `accepted:false` wg reguły „tylko jednorazowe w wojnie”, obecnie `accepted:true` z `deal` typu Wasalizacja.

## 3. Pokój między dwoma fotelami ludzkimi (P21)

### 3.1 Ścieżka hotseat (kod)
- Propozycja: `gra/src/main.ts:23056` (akceptacja; `respondToHumanProposal`, funkcja od ok. 23035), `proposeToHuman` `main.ts:23003-23012`, przycisk HUD → `onPropose` `main.ts:23165-23167` (`proposeToHuman(meId, otherOwnerId, cmd, …)`).
- Formularz: `gra/src/ui/interHumanDiplomacyHud.ts:26, 32` — rodzaj `zaproponuj_pokoj` jest zawsze na liście; brak warunku wojny i brak licznika tur.
- Akceptacja: `main.ts:23056-23060` — `finalizePeaceTreatyBetween(p.fromOwnerId, p.toOwnerId)` i `logPeaceVazne`. Brak wywołania `peaceProposalIsTooEarly` / `peaceProposalBlocked` i brak sprawdzenia `atWar`.

### 3.2 Gdzie stosuje się bramkę 10 tur (wszystkie wywołania)
`peaceProposalIsTooEarly` (`main.ts:12552`) jest wołane tylko w:
- `main.ts:21598` (`ownerId` vs `ME()`), `:22359` i `:22393` (`ME()` vs AI), `:27716` (`ME()` vs owner), `:40680` (`registerAiAiPeaceRequest`: prośba przegrywającej AI do zwycięzcy AI, tylko para AI↔AI).
- `peaceProposalBlocked` w silniku: `diplomacy-proposals.ts:1579` (`evaluateProposal`), które wywołuje tylko ścieżka AI i gracz↔AI.
- UI: `diplomacy-locks.ts:348-362` (`case '10'`) i `:325-331` (`case '8'`, trybut w wojnie) — licznik „dostępne za N tur” dla gracza wobec AI.
- Wniosek: żadne wywołanie nie obejmuje pary dwóch fotelów ludzkich. Grep `hotseat|fotel` w `diplomacy-peace-proposal-timing.ts` i `diplomacy-locks.ts` nie zwraca nic, więc w kodzie bramki nie ma wyjątku ani komentarza uzasadniającego pominięcie hotseat.

### 3.3 Skutek dla gracza
- Gracz A (fotel 1) w wojnie z graczem B (fotel 2) od tury 1 może wysłać propozycję pokoju i po akceptacji B pokój jest zawarty natychmiast (`finalizePeaceTreatyBetween`), bez licznika i bez komunikatu „dostępne za N tur”.
- Gracz ma w hotseat różne oczekiwanie niż gracz↔AI: reguła „pierwsze 10 pełnych tur wojny chronione przed pokojem” obowiązuje dla AI, nie dla człowieka. Czy to zamierzone, zależy od decyzji właściciela (pytanie nr 1 poniżej).
- Klasyfikacja: BŁĄD GRY (luka) przy założeniu, że reguła jest uniwersalna (komentarz `diplomacy-peace-proposal-timing.ts:1`: „First ten completed turns of each active war are protected from peace offers”). To założenie jest w kodzie opisane ogólnie, bez wyjątku dla hotseat.
- Dodatkowo: `respondToHumanProposal` akceptuje `zaproponuj_pokoj` bez sprawdzenia, czy para jest w stanie wojny (`main.ts:23056`). NIE ZMIERZONO, czy `finalizePeaceTreatyBetween` (`main.ts:12957`) sam chroni przed parą bez wojny (nie czytano do końca).

## 4. Propozycja naprawy (bez implementacji)

1. (Priorytet 1, BŁĄD GRY) Dodać bramkę `peaceProposalIsTooEarly(fromOwnerId, toOwnerId, 'pokoj')` w `proposeToHuman`/`onPropose` (`main.ts:23003, 23165`) oraz w `respondToHumanProposal` (`main.ts:23056`), plus stan wojny; UI z licznikiem „dostępne za N tur” jak w `diplomacy-locks.ts:348-362` (wymaga zmiany `interHumanDiplomacyHud.ts`, a więc ograniczone do tej pary).
2. (Priorytet 2, NIE ZMIERZONO) Sprawdzić modal negocjacji pod kątem wysyłania `goldPerTurn` w wojnie; jeśli tak — zawęzić `trybut_oferta` w wojnie do `goldOnce` w `diplomacy-proposals.ts:2191` i `:3178` (zgodnie z opisem UI w `diplomacy-locks.ts:333`).
3. (Priorytet 3, L2/L6 z WARENDP) Test `gra/tools/war-end-vassal-human-*-test.cjs` do zrobienia w kolejnej rundzie (patrz §5).

## 5. Pytania do właściciela (tylko zmiany wyglądu/mechaniki)

- PYTANIE (pełne ID: R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1 · pkt 3.2): czy pokój między dwoma graczami na hotseat ma wymagać tych samych 10 pełnych tur wojny co pokój z AI? (A: tak, ta sama reguła i licznik w oknie — gra wyrównana; B: nie, gracze mogą kończyć wojnę od razu — szybsza gra kosztem spójności.)
  Szczegóły: `peaceProposalIsTooEarly` i `interHumanDiplomacyHud.ts`.
- Pytanie o wpis dziennika wasalizacji (§2.4) — tylko jeśli właściciel chce wpisu; nie blokuje.

Decyzje inżynierskie (progi, nazwy testów, format raportu) rozstrzyga orkiestrator; nie są tu pytaniem.

## 6. Testy i bramki

- Dowód źródłowy: odczyty plik:linia powyżej (grep/sed na `origin/main` 9c5344dd1).
- Test źródłowy: NIE ZMIERZONO — nie dodano `gra/tools/war-end-vassal-human-*-test.cjs` w tej rundzie (zakres: analiza; kandydat zostaje do następnej rundy, z odtworzeniem z §2.5).
- `git diff --stat` tej rundy: tylko `dyspozycje/`. Brak zmian w `gra/src`, `gra/data`, `gra-robocza/`, `gra-kanon/`, `WERSJE.md`, `rust-port/`.
- `tsc`: nie uruchamiano (brak zmian kodu).

## 7. Luki i NIE ZMIERZONO

- Czy modal negocjacji wysyła `goldPerTurn` w wojnie (§2.5) — NIE ZMIERZONO.
- Czy `finalizePeaceTreatyBetween` chroni przed parą bez wojny (§3.3) — NIE ZMIERZONO.
- Cleanup wojen epoki z wasalem (`cleanup*ForcedWarOnPeace`) — NIE ZMIERZONO (L2).
- Zachowanie w grze na żywo (Chromium/hotseat) — NIE ZMIERZONO.
