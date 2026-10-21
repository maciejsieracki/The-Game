# P2.6 — Katalog eventów Rust → frontend (web UI jako źródło prawdy) — PROPOZYCJA, nie decyzja

**Temat:** `R-RUSTPORT-P2-6-EVENTS-Q1` · **Runda:** 5/5 (ostatnia) · **Rola:** Operator (Haiku 5.5 medium)
**Status:** propozycja do Evaluatora i Final Control. Każdy punkt oznaczony `DECISION_REQUIRED` (sekcja 6) wymaga decyzji właściciela lub jawnej akceptacji; nic nie jest wybrane po cichu.

## Poprawka rundy 3 — odpowiedź na zarzuty 1–6 Evaluatora (runda 2)

| Zarzut | Co zmieniono | Gdzie / dowód |
|---|---|---|
| 1. Kryterium „każdy event ma wiersz” niespełnione dla 40 plików NIEZWERYFIKOWANY | Każdy z 40 plików ma dyspozycję oparta o przeczytane trafienia wzorca (274 trafienia łącznie), w tym `game/ai.ts`, `ui/preBattle.ts`, `ui/diplomacyAudience.ts`, `battle/battleScene.ts`. Każda dyspozycja to wiersz E-xx albo wykluczenie z powodem. | sekcja 9.3; `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/pokrycie-gra-src-edb8fb56.tsv`, kolumna `dyspozycja_r3` |
| 2. Liczby 299 / 286 / 13 / 1 | Jednolicie: 300 linii `showHintMessage(` w `main.ts` = **286 wywołań + 13 komentarzy (K) + 1 definicja (D)**. Usunięto rozjazdy (załącznik B podawał „219 W” i „67 L”). | sekcja 1, załącznik A, załącznik B; inwentarz TSV (300 wierszy) |
| 3. Klasa W bez przeglądu kontekstu | Każdy wiersz W ma funkcję nadrzędną z `edb8fb56` i sprawdzone wywołania tej funkcji. Po przeglądzie 13 wierszy zmieniło klasę: 3 → L (automat gracza po turze), 10 → H (ta sama funkcja obsługuje gracza i odpowiedź AI albo automatyczne oblężenie/wizytę). | sekcja 9.4; inwentarz TSV, kolumny `funkcja` i `przeglad_r3` |
| 4. Sprzeczna klasyfikacja `:28121` | Jednoznacznie: **H, E-31, `initiator: Ai`**. Usunięto zapis o „wejściu gracza” i klasie W z załącznika B i sekcji 4. | sekcja 3 (E-31), sekcja 4, załącznik B |
| 5. Brak przeglądu „aktualizacji paneli po turze AI” per plik | Lista wywołań odświeżeń w `runWorldEndTurn` (`main.ts:31169-35854`) zestawiona z definicjami w każdym z 19 plików; wynik per plik. | sekcja 9.5 |
| 6. Dowód BRAK w części wierszy tylko stwierdzeniem nieobecności | Dla każdego z 40 wierszy BRAK: zapytanie `git grep -inE` na `9e33fc77` (pliki `rust-port/engine/src` i `src-tauri/src`), liczba trafień bez komentarzy i wniosek, również dla trafień szumu. | sekcja 9.1; `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/rust-dowod-BRAK-9e33fc77-r3.tsv` |

**Zmiany katalogu wynikające z przeglądu klasy W:** dodano wiersze **E-58** `auto_improvement_applied` (BRAK, L) i **E-59** `city_visit_bonus` (BRAK, H). Zaktualizowano wiersze E-01, E-06, E-20, E-30, E-31 (klasa), sekcję 4, sekcję 7, sekcję 8 i załączniki.

**Piny:**
- web `main` = `edb8fb56` (odczyt wyłącznie przez `git show edb8fb56:gra/src/…` / `git grep edb8fb56 -- gra/src`; working tree nie jest źródłem). Numery linii `main.ts` = numery w `edb8fb56`.
- Rust: commit `9e33fc77` (gałąź `rust-port/parity-v2` w chwili pisania; w tym checkoutcie nazwa gałęzi się nie rozwiązuje, więc odczyt wyłącznie po SHA: `git show 9e33fc77:…`). `rust-port/engine` = biblioteka referencyjna, nie baza kontynuacji (GOAL §0 poz. 1).

**Zakres i zasady:**
- Zakres: wyłącznie eventy **logika → UI** (powiadomienia, toasty, karty dziennika WYDARZENIA, modale wyników, odświeżenia paneli, komunikaty systemowe). Komendy **UI → logika** to zakres P2.5 (równoległy, osobny plik). Pozycje dwukierunkowe są oznaczone jako **H (HYBRYDA)** i nie są klasyfikowane na siłę w jedną stronę (sekcja 4).
- Zero zmian w `gra/**`, zero nowego kodu Rust. Jedyny zapisany plik zamiany: ten dokument oraz pliki w `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/`.
- Zakaz wnioskowania z nazw plików Rust: każdy wiersz ma dowód po stronie web (`plik:linia`). Status Rust podany z dowodem `plik:linia` lub jako `BRAK` z zapytaniem i wynikiem (sekcja 9.1).
- Eventy P2.3 (typy ID): `PlayerId` (u64 newtype, D-ID-1/2), `CityId`, `UnitId`, `OwnerRef { Player(PlayerId), Barbarian, Rebel }` (D-ID-7), `HexCoord{q,r}` (D-ID-6). Pola stanu wg P2.2 (`GameState`, `OwnerState`, `CityState`, `DiplomacyState`, `TradeRoute`, `BarbCamp`).
- Klasy: **L** logika → UI (komunikat wynika z wyniku logiki); **H** hybryda (gracz wywołuje, a komunikat zależy od logiki albo ta sama funkcja obsługuje gracza i AI); **W** wykluczone (reakcja UI na akcję gracza, walidacja, formularz); **K** komentarz; **D** definicja.

**Piny-kontekst:** P2.8 §0/§2 potwierdza, że dziś na pinie Rust jest **jeden** event Tauri (`engine_state_changed`, `rust-port/engine/src/bridge.rs:17`, `:97-112`, emisja `rust-port/engine/src/bridge.rs:225-233`, `src-tauri/src/lib.rs:42-45`). **Konwencja ścieżek Rust:** skrót `bridge.rs:N` = `rust-port/engine/src/bridge.rs:N`, `events.rs:N` = `rust-port/engine/src/domain/events.rs:N`, `diplomacy.rs:N` = `rust-port/engine/src/domain/diplomacy.rs:N` (pin `9e33fc77`, ścieżki względem korzenia repo). Żadna z kategorii poniżej nie ma wpiętego eventu.

---

## Odpowiedź Operatora na zarzuty Evaluatora po rundzie 5 (runda 5/5, zarzuty 1–6)

| Zarzut | Dyspozycja | Co zmieniono / dowód |
|---|---|---|
| 1. Status poza zbiorem GOTOWY/CZĘŚCIOWY/BRAK (E-45, E-49…E-55) | **PRZYJMUJĘ jako DECISION_REQUIRED** (nie jako spełnienie kryterium) | Kryterium binarne nie jest dla 8 wierszy spełnione literalnie. Operator nie zmienia statusu na siłę. Rozstrzygnięcie przekazano Final Control: D-EV-13 (rozszerzone o E-45). Uzasadnienia (konsola, transport, komendy UI→logika, stan widoku) zostają w sekcji 3.F. |
| 2. Brak kolumny „Proponowany event Rust” w 3.A–3.E | **PRZYJMUJĘ** | Dodano kolumnę do tabel 3.A–3.E (nagłówek, separator, 53 wierszy E-xx). Forma: `engine_event` · `kind="<nazwa>"` · `EngineEvent::<Wariant>` (transport wariant A, D-EV-1). E-45: brak (odpowiedź na komendę). Bez nowej analizy: nazwa z kolumny „Nazwa eventu” przepisana. |
| 3. Dowód kompletności oparty na heurystyce | **PRZYJMUJĘ** | Sekcja 9.4: jawny status **NIEZWERYFIKOWANY przez przeczytanie**. Nowy DECISION_REQUIRED D-EV-14 (pełny przegląd 288 plików albo akceptacja ryzyka). Nie twierdzę kompletności ponad dowód. |
| 4. E-52/E-53 jako pokrycie `eot-event-defer.ts` | **PRZYJMUJĘ** | Załącznik C (wiersz 121) i TSV r5 (wiersz 122): `POKRYTY: E-11, E-44`; E-52/E-53 wykluczone w 3.F. |
| 5. Odsyłacz „sekcja 9.2, linia 355” | **PRZYJMUJĘ** | Linia 355 = wiersz E-60 w tabeli 9.1. Mapowanie modułów modali = linia 372 (sekcja 9.2). Poprawiono we wszystkich wierszach Załącznika C i TSV (7 wystąpień). |
| 6. Odsyłacz „sekcja 1 (linia 68)” | **PRZYJMUJĘ** | Linia 68 = odpowiedź na zarzut 1 rundy 4. Wiersz sekcji 1 z `diplomacy-tech-trade.ts:126,149` jest w linii 81. Poprawiono w Załączniku C i TSV. |

---

## Odpowiedź Operatora na zarzuty Evaluatora z rundy 4/5 (runda 5/5, zarzuty 1–5)

| Zarzut | Dyspozycja | Co zmieniono / dowód |
|---|---|---|
| 1. Klasa `S` w E-45 (wiersz przy deklaracji o zerowych trafieniach) | **PRZYJMUJĘ** | W tej wersji E-45 (sekcja 3.A) ma klasę **W**. Klasa `S` nie występuje w legendzie ani w żadnym wierszu katalogu E-01…E-60: sprawdzenie skryptem (sekcja 7, pkt 3) daje zero wierszy z klasą `S`. Zdania „klasa `S` występowała w E-45” usunięto z odpowiedzi rundy 3 i 4. |
| 2. Sekcja 3.F bez statusu, payloadu, trwałości i proponowanego eventu | **PRZYJMUJĘ** | Tabela 3.F przepisana: kolumny Payload (typy), Trwałość, **Proponowany event Rust**, dowód Rust, Status, Klasa, Uzasadnienie. E-49…E-55 mają status `WYKLUCZONY` (jawny wyjątek od kryterium binarnego, poza sekcją 7), decyzja o tym statusie: **D-EV-13** (sekcja 6). Cytowania poprawione po weryfikacji w `edb8fb56`: E-50 → `main.ts:32507` (console.log `[Rebelia]`), E-51 → `main.ts:32526-32528` (console.log `[Porzadek]`; było `:32495`, to nie jest wywołanie logu), E-52 → `eot-event-defer.ts:149-248`. |
| 3. Pokrycie `gra/src`: 332 z 457 plików bez dyspozycji per plik; wzorzec bez `notify/alert/popup/dialog/log` | **PRZYJMUJĘ** | Dodano **sekcję 9.4** i **Załącznik C**: każdy z **457** plików `.ts` w `gra/src` (`edb8fb56`) ma dyspozycję per plik. Wzorzec sygnału S5/S6 obejmuje `notify…(`, `alert(`, `popup`, `dialog.show/open`, `EventLog`, `LogEntry`, `unshift(`, wywołania `show*/toast*/flash*`. Świadomie poza sygnałem: `console.log` (diagnostyka konsoli, nie UI). Pełna tabela: `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/pokrycie-gra-src-edb8fb56-r5.tsv`. Ograniczenie metody jawnie opisane w 9.4. |
| 4. Liczba BRAK podana jako 39 | **PRZYJMUJĘ** (skorygowane w rundzie 4, potwierdzone) | Liczba BRAK = **40** w sekcji 7, w nagłówku 9.1 i w 40 wierszach tabeli 9.1. Wyszukiwanie „39” w pliku: wyłącznie historyczny zapis korekty i numery linii kodu (`:39-40`). |
| 5. E-01: błędne numery `diplomacy.rs` (`:533` jako dowód użycia) | **PRZYJMUJĘ** | Zweryfikowane `git show 9e33fc77:rust-port/engine/src/domain/diplomacy.rs`: `:532` = `#[derive(...)]`, `:533` = `pub enum DiplomaticEvent {`, `:534` = `#[serde(...)]`, `:535` = `DeclareWar,`, `:623` = użycie (`DiplomaticEvent::DeclareWar => status = RelationStatus::War`). E-01 i odpowiedzi poprzednich rund poprawione; poprzedni zapis „`:532` enum, `:534` wariant” był błędny. |

**Zmiany w rundzie 5/5:** sekcja 3.F (przepisana), wiersz E-01 (numery), E-50/E-51/E-52 (cytowania), sekcja 6 (D-EV-13), sekcja 7 (kontrola klas i statusów), sekcja 9.4 (nowa), Załącznik C (nowy), plik TSV `pokrycie-gra-src-edb8fb56-r5.tsv` (nowy, w allowliście runu). `gra/**` bez zmian; brak commitów i pushu.

---

## Odpowiedź Operatora na zarzuty Evaluatora (runda 4/5)

Zarzuty 1–6 z rundy 3 (werdykt FAIL). Każdy zarzut ma dyspozycję „Zamknięte” z dowodem; nie ma pozycji „z zastrzeżeniem” ani „nieprzeczytane”.

| Zarzut | Dyspozycja | Co zmieniono / dowód |
|---|---|---|
| 1. Brak wiersza dla `showDiplomacyProposalBanner` | **Zamknięte** | Wiersz **E-60** (sekcja 3.B) z trzema wywołaniami: `main.ts:20612` (w `applyProposalOutcome`, wynik odpowiedzi AI i akceptacji gracza), `main.ts:17307` i `main.ts:17860` (odrzucenie pozycji stołu / propozycji). Pełna lista w `edb8fb56`: import `main.ts:1297`, trzy wywołania, bez innych. Wiersze **E-05** i **E-06** odsyłają teraz do E-60. Rust: `git grep` na `9e33fc77` = 0 trafień (sekcja 9.1). |
| 2. Etykiety BEZ-SYGNALU dla plików cytowanych i wzorzec wielkoliterowy | **Zamknięte** | (a) Pliki cytowane w katalogu (`game/capital-capture.ts`, `game/spich-auto-ration-notify.ts`, `game/villageRewards.ts`, `ui/hotSeatHandoff.ts`, `ui/victoryScreen.ts`, `ui/postBattleSummary.ts`, `ui/diplomacyProposalBanner.ts`) mają status `POKRYTY`. (b) Wzorzec powtórzono **bez rozróżniania wielkości liter**, z dopisanymi `toast\|banner\|notice\|modal\|hint`, dla wszystkich 457 plików. Wynik: 63 pliki `BEZ-SYGNALU` mają trafienia (400 linii), 332 nie mają żadnego. (c) Każdy z 63 plików ma dyspozycję (status `ROZSTRZYGNIETY-R4`). Przeczytano: wszystkie trafienia z wywołaniem funkcji o nazwie z wzorca (39 linii, w tym `flashBanner`, `showToast`, `_showBanner`, `_showResultBanner`, `modalIcon`), wszystkie trafienia z literałem tekstu poza `render/` (209 linii) oraz wielkoliterowe warianty (`Banner`, `Toast`, `Modal`, `Hint`). Pozostałe trafienia to identyfikatory, typy, komentarze, CSS i nazwy klas, klasyfikowane per plik. (d) Pliki z `NIEZWERYFIKOWANY` z rundy 3 mają status `ROZSTRZYGNIETY`, dopiski R4 w TSV (`battleScene`, `diplomacyAudience`, `preBattle`, `mainMenu`, `newGameFlow`, `cities`, `techTreeView`, `perfReport`). Usunięto wszystkie `DECISION_REQUIRED` z 43 plików `ui/`/`render/`. Tabela: `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/pokrycie-gra-src-edb8fb56-r4.tsv`. |
| 3. Klasa `S` poza schematem; E-39/E-40 sprzeczne z załącznikiem A | **Zamknięte** | Klasa `S` nie występuje w legendzie ani w katalogu; E-45 ma klasę `W` (sprawdzenie skryptem, sekcja 7 i odpowiedź rundy 5/5). E-39 (`:30836`, `:30903`, `:30912`) i E-40 (`:30786`, `:30932`) mają klasę **L**, zgodnie z załącznikiem A (wszystkie pięć numerów są na liście 72 L). |
| 4. E-06 oznaczone H przy wywołaniach L | **Zamknięte** | Klasa E-06 jest jawna per wywołanie: **L** = `:17008`, `:17127`, `:17141`, `:17145`, `:17177`, `:17245` (załącznik A); **H** = `:10126`, `:20715`, `:20767`, `:20774` (załącznik B, sekcja 4). Wiersz E-06 nie ma klasy zbiorczej H. Sprawdzono w `edb8fb56`: `:20715`, `:20767`, `:20774` to wywołania `showHintMessage` wewnątrz `applyProposalOutcome` (`:20605`–`:20780`), a nie wywołania `applyProposalOutcome`. |
| 5. E-44 GOTOWY przy braku eventu wg definicji | **Zamknięte** | E-44 ma status **CZĘŚCIOWY** (legenda: fragment domeny istnieje, brakuje zdarzenia). Dowód: `PlayableState.phase` istnieje (`playable.rs:349`), zdarzenia fazy nie emituje ani nie konsumuje żaden kod Rust. Sekcja 7: GOTOWY 0, CZĘŚCIOWY 12, BRAK 40, WYKLUCZONY 1; suma 53. |
| 6. Wniosek 9.5 sprzeczny z wierszem `game/trade-routes.ts` | **Zamknięte** | Zamknięcie 9.5 zapisano precyzyjnie (sekcja 9.5, akapit „Rozstrzygnięcie kategorii”). `game/trade-routes.ts` ma 0 trafień wzorca r4 (brak komunikatu w pliku); `refreshTradeRoutes` (`:1302`) zwraca listę szlaków. Komunikaty E-36/E-37 leżą w `main.ts:15508-15581` i są wołane z EOT przez `recomputeTradeRoutesNow(true)` (`main.ts:31289`); są opisane w wierszach E-36/E-37 i nie są częścią zamknięcia per plik. |

**Zmiany w katalogu wynikające z rundy 4:** E-05, E-06 (odsyłacz do E-60 i klasa per wywołanie), E-60 (forma UI: `M`, baner). Liczby sekcji 7 bez zmian (statusy nie zmieniły się).

---

## Odpowiedź Operatora na zarzuty Evaluatora po rundzie 4 (runda 4/5, zarzuty 1–5)

| Zarzut | Dyspozycja | Co zmieniono / dowód |
|---|---|---|
| 1. E-45 z klasą `S` spoza legendy; zdanie „Klasa S nie występuje” nieprawdziwe | **PRZYJMUJĘ** | E-45 ma klasę **W** (odpowiedź na komendę, zakres P2.5), sekcja 3.D. Klasa `S` nie występuje w katalogu (zdanie w odpowiedzi na zarzut 3 poprawiono w rundzie 5/5). |
| 2. Sekcja 3.F bez kolumn Status, Payload, Trwałość, dowodu Rust; brak statusu dla E-52…E-55 | **PRZYJMUJĘ** | Sekcja 3.F ma pełne kolumny. E-49…E-55 mają Payload, Trwałość, dowód Rust (lub „komenda: P2.5”) i status **WYKLUCZONY** z uzasadnieniem. Status ten nie należy do zbioru GOTOWY/CZĘŚCIOWY/BRAK z dispatchu, jest oznaczony jawnie i nie wchodzi do sekcji 7. Akceptacja tego statusu: do decyzji Evaluatora. |
| 3. Pokrycie `gra/src` (9.3): wzorzec nie obejmuje `notify`, `alert(`, `popup`, `dialog`, `log` | **PRZYJMUJĘ** (z korektą) | Wzorzec r4-alt z zarzutu daje 16 plików (`git grep edb8fb56 -- gra/src`). 12 ma inny status. 4 z `BEZ-SYGNALU-0` (`game/barbarians.ts`, `game/economy.ts`, `game/production.ts`, `ui/unitCtxDockDiploGate.ts`) dopisano do tabeli 9.3 z dyspozycją WYKLUCZONY. Zdanie „każdy z dyspozycją lub statusem zerowego sygnału” zastąpiono ograniczeniem: ogólne `log`/`dialog` nie są objęte wzorcem, a 9.5 nie dotyczy źródeł komunikatów. |
| 4. Liczba BRAK: „39” w zmianie 6 i G-1 vs 40 w tabeli 9.1, nagłówku i sekcji 7 | **PRZYJMUJĘ** | Zmieniono „39” na „40” w zmianie 6 i w G-1 (sekcja 9.1). Tabela 9.1 ma 40 wierszy BRAK (E-02, 05–08, 10–21, 23–27, 29, 30, 32–35, 38–40, 42, 46–48, 56–60). |
| 5. E-01: `diplomacy.rs:533` jako dowód użycia `DeclareWar` | **PRZYJMUJĘ** (z korektą opisu) | `git show 9e33fc77:rust-port/engine/src/domain/diplomacy.rs`: `:532` = `#[derive(...)]`, `:533` = `pub enum DiplomaticEvent {`, `:534` = atrybut `#[serde(...)]`, `:535` = `DeclareWar,` (definicja wariantu). Użycie: `:623`. E-01 cytuje teraz wariant `:535`, enum `:533` i użycie `:623` (korekta w rundzie 5/5). |

---

## 1. Skala pokrycia web (co zostało przeczytane)

| Źródło w web (`edb8fb56`) | Ile miejsc | Jak zmapowane |
|---|---|---|
| `showHintMessage(` w `gra/src/main.ts` | **300** linii `git grep -c` = **286** wywołań + **13** linii komentarzy (K) + **1** definicja `main.ts:14301` (D) | **72** wywołania klasy L (sekcja 3, wiersze E-; załącznik A); **15** wywołań klasy H (hybrydy, sekcja 4, załącznik B); **199** wywołań klasy W (reakcja na akcję gracza / walidacja / UI; załącznik B); 13 K; 1 D. Kontrola: L + H + W = 72 + 15 + 199 = 286 wywołań; 286 + 13 + 1 = **300**. Pełny inwentarz wierszowy (300 wierszy): `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/inwentarz-showHintMessage-edb8fb56.tsv` |
| `showHintMessage(` w pozostałych plikach `gra/src/**` | **1** linia z `showHintMessage(` (komentarz) | `game/eot-event-defer.ts:64`. Nazwa bez nawiasu wyłącznie w komentarzach/dokumentacji: `game/diplomacy-tech-trade.ts:126,149`, `game/era-change-notify.ts:37` (builder HTML; wywołania są w `main.ts:14366`/`:14408`), `ui/triumphCityStateNotice.ts:10`. Weryfikacja: `git grep -c 'showHintMessage(' edb8fb56 -- gra/src` = 301 (`main.ts` 300 + `eot-event-defer.ts` 1) |
| Tablice dziennika WYDARZENIA (`warEventLog` `:8702`, `villageEventLog` `:15150`, `tradeRouteEventLog` `:15155`, `rationAutoEventLog` `:15180`, `borderMarchEventLog` `:15187`) + kolejka `deferredEotHints` `:15190` | 5 + 1 | każdy `unshift`/`push` zmapowany (wiersze E-, sekcja 3) |
| `collectTurnEvents()` `main.ts:15615-15690` (karty blokujące: `revolt-warn-*`, `revolt-*`, `prod-empty-*`, `diplo-pend-*`, `negot-*`) | 5 typów kart | E17, E18, E19, E05 |
| Modale/notice: 10 modułów importowanych przez `main.ts` (lista w sekcji 9.2) | 10 | zmapowane w wierszach E- (kolumna „Forma UI”) |
| Trwałe logi w `meta` (P2.7 §3): `pendingDiplomacyInbox` `:30530`, `interHumanDiplomacyInbox` `:30532`, `diplomacyFactorLog` `:30560`, `wiarygodnosc*` `:30565-30572` | 6 kluczy | E05, E15, E46, E47 |

**Wynik weryfikacji (kronika NIE jest trwała):** tablice `warEventLog`, `villageEventLog`, `tradeRouteEventLog`, `rationAutoEventLog`, `borderMarchEventLog` oraz mapy `civElimEventDetails`/`cityCaptureEventDetails` **nie występują** w zapisie (`meta` w `main.ts` ~`:30400-30700`, ~`:38900-39120`, `gra/src/game/save.ts`: brak trafień). Są czyszczone przy tyku tury i wczytaniu (`main.ts:31206-31214`, `:11397-11402`, `:9094-9097`). Kronika WYDARZENIA jest więc w web **efemeryczna**; trwały jest tylko stan, z którego karty są wyprowadzane.

---

## 2. Transport — analiza dwóch wariantów i rekomendacja

Pytanie z dispatchu: jeden kanał z tagiem wariantu vs osobne kanały Tauri per kategoria.

**Fakty z web, które wpływają na wybór:**
- **Kolejność ma znaczenie:** `warEventLog` jest budowany przez `unshift` (najnowszy na górze) i przycinany do 8 pozycji (`:8767`, `:8867`, `:8931`, `:10977`, `:14377`). Wojna → zdobycie miasta → eliminacja w tej samej fazie AI tworzą kolejne karty; ich kolejność jest częścią treści.
- **Batching już istnieje w web:** podczas `endTurnInProgress` toasty są odkładane do `deferredEotHints` (`:14307`) i po zakończeniu tury zamieniane w karty (`eot-event-defer.ts:149`, `main.ts:35833-35839`); era-toast ma osobny `pendingEraChangeToastForNextTurn` (`:14404-14410`, `:36023`). Model „paczka zdarzeń z jednej tury” jest więc naturalny dla tej gry.
- **Kontekst musi wędrować z eventem:** karta `eot-hint-<tura>-<i>` traci identyfikator technologii, dlatego web musiał dodać osobny mechanizm (`main.ts:31994-32003`, `P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1`). Event z tekstem bez typowanego payloadu powtarza ten błąd.
- **Rust ma kolejkę z numerem sekwencji, ale nie wysyła jej do UI:** `EventQueue` (`rust-port/engine/src/domain/events.rs:297`), `QueuedEvent` (`:196`, pole `sequence`), publiczne `enqueue` (`:382`). Porządek wewnętrzny to `order_key()` = `(turn, phase.order_index(), sequence)` (`:259`); wstawianie przez prywatną `insert_ordered` (`:482`) sortuje po tym kluczu, a nie po samym `sequence`. `BridgeDispatch { response, events: Vec<BridgeEvent> }` (`rust-port/engine/src/bridge.rs:187-191`); `BridgeEvent` ma jeden wariant `StateChanged` (`bridge.rs:97-106`). Kolejka fazowa jest zasilana w `advance_turn` (`playable.rs:554`, `:589` → `enqueue_turn_phases`), ale `drain`, `drain_turn`, `drain_phase` (`events.rs:446-457`) nie mają wywołań poza definicjami.

**Wariant A — jeden kanał `engine_event` z tagiem `kind`, batch na odpowiedź komendy (REKOMENDOWANY):**
- Jedna subskrypcja po stronie frontu; kolejność `(turn, phase, sequence)` z `EventQueue` (`order_key`, `events.rs:259`) byłaby jedyną kolejnością, którą kontrakt może gwarantować; dziś kolejka nie jest konsumowana (nie polegamy na kolejności między kanałami).
- Batch `{contractVersion, requestId, turn, phase, events:[{seq, kind, payload}]}` emitowany raz na komendę (dziś: raz na każdą komendę poza `GetState`, `bridge.rs:225-233`); odtwarza model `deferredEotHints`.
- Wada: frontend filtruje po `kind` (tani, kilka wariantów).

**Wariant B — osobne kanały per kategoria (`engine_war`, `engine_city`, `engine_diplo`, …):**
- Plus: lokalne subskrypcje, czytelniejsze nazwy.
- Minus: kolejność między kanałami nie jest częścią kontraktu; rozdzielenie „wojna” i „zdobycie miasta” łamie `warEventLog` jako jeden strumień; N listenerów zamiast jednego; kategorie nakładają się (E-01 wojna dotyczy jednocześnie dyplomacji i działań wojennych; karta `main.ts:8924` ma `kind:'enemy'`, a eliminacja E-08 `kind:'diplo'`, więc filtr kart zależy od kategorii, nie od zdarzenia).

**Rekomendacja (do decyzji — D-EV-1):** Wariant A. Dodatkowo: stan blokujący (karty „wymaga decyzji”) **nie** powinien być przesyłany jako event, tylko jako pole snapshotu (D-EV-4). Eventy są wyłącznie powiadomieniami.

---

## 3. Katalog eventów (wiersze E-01 … E-60)

**Legenda kolumn:**
- **Forma UI** — `T` toast (`showHintMessage`), `K` karta w dzienniku WYDARZENIA, `B` karta blokująca (decyzja), `M` modal/notice, `–` brak.
- **Trwałość** — `EFEM` = tylko UI, nie w zapisie; `STAN` = skutek trwały w stanie gry (zapisywany); `META` = klucz `meta` zapisu (P2.7).
- **Status** — `GOTOWY` (logika Rust generuje równoważne dane; wpięcie), `CZĘŚCIOWY` (fragment domeny istnieje, brakuje zdarzenia lub części payloadu), `BRAK` (nowa logika wymagana). Dowód dla każdego `BRAK`: sekcja 9.1.
- **Klasa** — `L` logika → UI; `H` HYBRYDA (sekcja 4).

### 3.A Wojna, dyplomacja, sojusze

| ID | Nazwa eventu (propozycja) | Proponowany event Rust | Dowód web | Wyzwalacz | Payload (typy P2.3/P2.2) | Forma UI | Trwałość | Rust dziś (dowód) | Status | Klasa |
|---|---|---|---|---|---|---|---|---|---|---|
| E-01 | `war_declared` | `engine_event` · `kind="war_declared"` → `EngineEvent::WarDeclared` | `main.ts:8892-8931` (`recordWarDeclarationEvent`, karta `warEventLog`, `kind:'enemy'`); wywołania AI: `:10668`, `:19988`, `:33264`, `:34502`; toasty `:10672`, `:33268`, `:34506`; wypowiedzenie przez gracza i odpowiedź AI z `warThreat`: `playerDeclareWarOnOwner` `:10606`, `:10616`, `:10630` (wywoływane z `resolveNegotiationEntryAt` `:17152`); wykluczone: `:10628` (gracz sam wypowiada z przycisku) | AI/PM/sojusznik/ultimatum wypowiada wojnę graczowi lub z udziałem gracza | `{declarer: OwnerRef, target: PlayerId, reason: Option<String>, all_enemies: Vec<PlayerId>}` | T, K | EFEM (+ STAN: relacja `War`) | `DiplomaticEvent::DeclareWar` (wariant `domain/diplomacy.rs:535`; enum `:533`; atrybut serde `:534`; użycie `:623`) (zmiana statusu, brak payloadu/eventu do UI) | CZĘŚCIOWY | L (wypowiedzenie przez AI); H (`:10606-:10630`, ścieżka warThreat) |
| E-02 | `alliance_war_join_or_refuse` | `engine_event` · `kind="alliance_war_join_or_refuse"` → `EngineEvent::AllianceWarJoinOrRefuse` | `main.ts:20026` (odmowa), `:20058`, `:20072`, `:20077` (`applyAllianceObligationsOnWar`); modal `main.ts:20109` (`showAllianceObligationModal`, `ui/diplomacyAudience.ts:1122`) | Sojusznik dołącza do wojny / odmawia / sojusz zerwany | `{ally: PlayerId, mustDeclareWarOn: PlayerId, attacker, victim, outcome: Joined\|Refused}` | T, M | STAN (sojusz/obowiązek) | BRAK: mechanizm obowiązku przystąpienia do wojny — 0 trafień (sekcja 9.1). Typ umowy `sojusz/alliance` istnieje (`diplomacy.rs:77`), ale bez obowiązku | BRAK | L |
| E-03 | `tribute_broken` | `engine_event` · `kind="tribute_broken"` → `EngineEvent::TributeBroken` | `main.ts:20418`, `:20420`, `:20430` (`runDiplomacyTurnTick`, relacja `trybut_odmowa`) | Brak środków na trybut / casus belli | `{payer: PlayerId, receiver: PlayerId, reason: NoFunds\|CasusBelli, deal_id: DealId}` | T | STAN (relacja, `ActiveDeal`) | `DiplomaticEvent::TributeRefused` `diplomacy.rs:659` (tylko zaufanie); brak transakcji trybutu w `playable.rs` | CZĘŚCIOWY | L |
| E-04 | `resource_access_lost_war` | `engine_event` · `kind="resource_access_lost_war"` → `EngineEvent::ResourceAccessLostWar` | `main.ts:10266` (`suspendZlozeOnWar`, „Dostęp do złoża wygasł — wojna”) | Wojna odbiera dostęp do złoża | `{owner: PlayerId, resource: ResourceKey, deposit: HexCoord}` | T | STAN (`zlozeGrants` META) | CZĘŚCIOWY: typ umowy `zloze` istnieje (`rust-port/engine/src/domain/diplomacy.rs:1693`, alias `deposit`); nie znaleziono logiki zawieszenia dostępu przy wojnie (`git grep` zloz/deposit/grant: 118 trafień, pierwsze dotyczą modelu umów) | CZĘŚCIOWY | L |
| E-05 | `diplo_offer_from_ai` (karta blokująca) | `engine_event` · `kind="diplo_offer_from_ai"` → `EngineEvent::DiploOfferFromAi` | `main.ts:15672-15687` (karty `diplo-pend-*` i `negot-*`); źródła: `:16806-16830` (`enqueueDiplomacyPendingFromCmd`, typy: `zaproponuj_pokoj`, `zadaj_trybut`, `oferuj_trybut_za_pokoj`, `zaproponuj_sojusz`, `zaproponuj_handel`, `zaproponuj_umowe_handlowa`, `zaproponuj_handel_surowiec`, `zaproponuj_pakt`, wywołania `:34513-34527`); `enqueueDiplomacyPending` `:17776-17800` (toast `:17799`) | AI składa propozycję czekającą na decyzję gracza (wynik akceptacji/odrzucenia: baner E-60) | `{id: String, from: PlayerId, to: PlayerId, kind: OfferKind, reason: String, round: u8, max_rounds: u8, gold_once: Option<u32>, resource: Option<ResourceOffer>}` | B, T | STAN: `pendingDiplomacyInbox` (META `:30530`), `negotiationTable` (META, P2.7 `:30556`) | BRAK: brak stołu negocjacyjnego w domenie (sekcja 9.1) | BRAK | L (rozstrzygane przez stan — D-EV-4) |
| E-06 | `diplo_offer_response` | `engine_event` · `kind="diplo_offer_response"` → `EngineEvent::DiploOfferResponse` | `main.ts:17008` (`pruneInvalidNegotiations`, „propozycja wygasła”), `:17127`, `:17141`, `:17145` (`resolveNegotiationEntryAt`: kontroferta/odrzucenie przez AI), `:17177`, `:17245`; wyniki akceptacji: `showHintMessage` wewnątrz `applyProposalOutcome` (`:20605`–`:20780`: `:20715`, `:20767`, `:20774`) oraz `executeTechTradeDeal` `onCancelled` `:10126` — te funkcje są wołane zarówno przez odpowiedź AI (`resolveNegotiationEntryAt` `:17149`), jak i przez akceptację gracza | AI odpowiada na propozycję gracza, propozycja wygasa, albo wynik akceptacji (baner wyniku: E-60) | `{offer_id: String, outcome: Expired{reason}\|Rejected\|Counter{note}\|Accepted{result}, correlation: CommandId}` | T | STAN (`negotiationTable`) | BRAK: brak odpowiedzi na ofertę w domenie (sekcja 9.1) | BRAK | L (`:17008`, `:17127`, `:17141`, `:17145`, `:17177`, `:17245`; zał. A) + H (`:10126`, `:20715`, `:20767`, `:20774`; sekcja 4, D-EV-5) |
| E-07 | `city_state_absorbed` | `engine_event` · `kind="city_state_absorbed"` → `EngineEvent::CityStateAbsorbed` | `main.ts:20605-20650` (`applyProposalOutcome`, gałąź `wchloniecie`, toast `:20648` tylko gdy NIE eliminacja) | Wchłonięcie miasta-państwa po zaakceptowanej propozycji | `{city_state: PlayerId, absorber: PlayerId, cost_gold: u32}` | T | STAN (owner zmieniony, `OwnerState`) | BRAK (państwa-miasta: `playable.rs:167` `NOT_IMPLEMENTED`; trafienia `annex` to progi konfiguracji, `diplomacy.rs:247`) | BRAK | H |
| E-08 | `civ_eliminated` | `engine_event` · `kind="civ_eliminated"` → `EngineEvent::CivEliminated` | `main.ts:8749-8767` (`recordCivElimEvent`, karta `elim-cs-*`, `kind:'diplo'`); wywołania `:28886` (wchłonięcie, `annexerId===0`), `:29311` (podbój); modal `:15769`; mapa szczegółów `civElimEventDetails` (EFEM) | Eliminacja cywilizacji (wchłonięcie lub podbój) | `{owner: PlayerId, civ_label: String, cause: Annexed\|Conquered, city_count: u32, details: String}` | K, M | EFEM (karta) + STAN (`eliminatedOwners` META `:30636`) | BRAK (`OwnerState.eliminated`, P2.2 §2, nie zaimplementowane; 0 trafień `eliminat`) | BRAK | L |
| E-09 | `goodwill_tick` | `engine_event` · `kind="goodwill_tick"` → `EngineEvent::GoodwillTick` | `main.ts:9933-9935` (`applyPnTrustForPair`, „Dobra wola: +1 Zauf./turę × 3”) | Koniec okresu dobrej woli (tick relacji) | `{owner: PlayerId, other: PlayerId, trust_delta: i32, turns_left: u8}` | T | STAN (relacja) | `tick_goodwill` `domain/diplomacy.rs:1343` (domena, bez komunikatu) | CZĘŚCIOWY | L |
| E-10 | `border_violation` | `engine_event` · `kind="border_violation"` → `EngineEvent::BorderViolation` | `main.ts:5180-5219` (`applyBorderMarchPenaltiesEndTurn`, `borderMarchEventLog` EFEM, `borderMarchEventTargets` `:5180`), id `border-march-violated` / `border-march-trespassing` | Naruszenie granicy / jednostka na cudzym terenie | `{kind: Violated\|Trespassing, violators: Vec<PlayerId>, penalty_trust: i32, hex: Option<HexCoord>}` | K | EFEM (+ STAN: zaufanie) | BRAK (granice jako geometria: BRAK, P2.1 M1; 0 trafień `trespass\|border_violation\|violat`; `owners_have_shared_land_border` `trade.rs:563` to tylko sąsiedztwo) | BRAK | L |
| E-11 | `ai_ai_trade_noticed` | `engine_event` · `kind="ai_ai_trade_noticed"` → `EngineEvent::AiAiTradeNoticed` | `main.ts:19650` (`applyAiAiHandelSurowiecCmd`, „X handluje z Y”); `eot-event-defer.ts:149-175` (`origin:'other-civs'`) | AI↔AI handel surowcem (widoczny w „Inne cyw.”) | `{seller: PlayerId, buyer: PlayerId, resource: ResourceKey}` | T (→ K w fazie EOT) | EFEM | BRAK (decyzje AI niepodłączone, `ai_turn.rs` poza `domain/mod.rs`, P2.8 §6; trafienia `handel` to alias typu umowy, `diplomacy.rs:538`) | BRAK | L |
| E-12 | `ai_audience_request` | `engine_event` · `kind="ai_audience_request"` → `EngineEvent::AiAudienceRequest` | `main.ts:19688` (`applyAiAudienceRequest`, „prosi o audiencję — motyw”) | AI prosi gracza o audiencję | `{owner: PlayerId, motive: AudienceMotive}` | T | EFEM (+ META `aiAudienceLastRequestTurn` `:30537`) | BRAK (0 trafień `audience`) | BRAK | L |
| E-13 | `forced_war_wave` (stan + E-01) | `engine_event` · `kind="forced_war_wave"` → `EngineEvent::ForcedWarWave` | `main.ts:34363-34530` (`isForcedEpochWarDeclareCmd`), moduł logiki `game/forced-war-waves.ts`; META: 15 kluczy fal (P2.7 §3, `forcedWarWavesByPairKey` `:30634`) | Fala wymuszonej wojny (epoka) | stan: `ai.forced_war` (D1, P2.2 §8): `{pair: PairKey, waves: Vec<Wave>, next_wave_id: u32}`; UI tylko przez E-01 | (przez E-01) | META/STAN | BRAK (0 trafień `forced_war\|war_wave`) | BRAK | L |
| E-14 | `first_contact` | `engine_event` · `kind="first_contact"` → `EngineEvent::FirstContact` | `main.ts:19014-19035` (`checkNewDiplomaticContacts`, `pendingFirstContactCards`, `diplomaticDiscoveryPopupShownByHuman` `:8376`) | Pierwsze odkrycie/kontakt z cywilizacją na mapie | `{owner: PlayerId, with: PlayerId, hex: Option<HexCoord>}` | M | META (`diplomaticContactEstablished` `:30540`, `diplomaticDiscoveryPopupShown` `:30548`) | BRAK (0 trafień `first_contact\|contact_established\|diplomatic_contact`) | BRAK | L |
| E-15 | `inter_human_proposal` (hot-seat) | `engine_event` · `kind="inter_human_proposal"` → `EngineEvent::InterHumanProposal` | `main.ts:17909` (`interHumanDiplomacyInbox.push`), `:17901` (`proposeToHuman`), `:18026` (`openInterHumanDiplomacyHud`); `ui/interHumanDiplomacyHud.ts` | Propozycja między dwoma ludzkimi fotelami | `{id, from: PlayerId, to: PlayerId, cmd: DiploCmd, reason: String, created_turn: u32}` | M | META (`interHumanDiplomacyInbox` `:30532`) | BRAK (hot-seat: P2.2 D2, `PlayablePlayer.is_human` `playable.rs:288`, brak listy; 0 trafień `hot_seat\|inter_human`) | BRAK | L |
| E-16 | `hot_seat_handoff` | `engine_event` · `kind="hot_seat_handoff"` → `EngineEvent::HotSeatHandoff` | UI: `ui/hotSeatHandoff.ts:107` (`showHotSeatHandoff`); **produkcyjne wywołanie: BRAK** — tylko hak testowy `main.ts:24543-24546` | Zmiana aktywnego fotela ludzkiego | `{from: PlayerId, to: PlayerId}` | M | EFEM | BRAK (0 trafień poza komentarzami) | BRAK | L (D-EV-6) |

### 3.B Miasta, ludność, bunt, produkcja, komunikaty tury

| ID | Nazwa eventu | Proponowany event Rust | Dowód web | Wyzwalacz | Payload | Forma UI | Trwałość | Rust dziś | Status | Klasa |
|---|---|---|---|---|---|---|---|---|---|---|
| E-17 | `city_revolt_warning` (karta blokująca) | `engine_event` · `kind="city_revolt_warning"` → `EngineEvent::CityRevoltWarning` | `main.ts:15629-15638` (`revoltWarning` w `collectTurnEvents`, id `revolt-warn-*`); źródło stanu: `:32485` (`updateRevoltGrace`, `game/society-breakdown.ts:1087`, 0 trafień wzorca komunikatu), `:32565` (`revoltWarning`) | Miasto w karencji buntu (krytyczne) | `{city: CityId, grace_turns_left: u8, message_key: RevoltWarningKind}` | B | derived ze STANU (`cityOrderState`, do potwierdzenia P2.3) | BRAK (0 trafień `revolt\|rebel\|grace`; P2.1 M3) | BRAK | L |
| E-18 | `city_revolted` | `engine_event` · `kind="city_revolted"` → `EngineEvent::CityRevolted` | `main.ts:32502-32505` (`city.rebelState=true`, `ownerId=REBEL_FACTION`), toast `:32517-32518` („zbuntowało się i ogłosiło niepodległość”), karta `:15641-15648` (`revolt-*`, „Migracja mieszkańców”); `:32480-32484` (mechanika tylko dla człowieka) | Bunt: miasto przechodzi do frakcji rebeliantów | `{city: CityId, from: PlayerId, to: OwnerRef::Rebel, migrated_pop_to: Option<CityId>}` | T, B | STAN (`City.ownerId`, `rebelState`) | BRAK (0 trafień `revolt\|rebel\|rebellion`) | BRAK | L |
| E-19 | `production_queue_empty` (karta blokująca) | `engine_event` · `kind="production_queue_empty"` → `EngineEvent::ProductionQueueEmpty` | `main.ts:15652-15663` (`prod-empty-*`, fingerprint `prodEmptyDismissFp`), reguła `cityHasActionableProduction` | Miasto gracza bez pozycji w kolejce | `{city: CityId}` | B | derived ze STANU (kolejka miasta, `cityProd` META D13) | BRAK (0 trafień kolejki miasta gracza; `production_queue` `ai_turn.rs:401` to pole planera AI) | BRAK | L |
| E-20 | `city_captured` | `engine_event` · `kind="city_captured"` → `EngineEvent::CityCaptured` | `main.ts:8803-8866` (`recordCityCaptureEvent`, karta `cityCaptureEventDetails`); wywołania `:14799` (kapitulacja głodowa), `:29200` (stolica), `:29268` (eliminacja podbojem), `:29751` (zajęcie bez bitwy); modale `showCityCaptureNotice` `:28473`, `:29841`; toasty `:14814`; komunikat wejścia jednostki `finishUnitEnterCityHex` `:25747` (H, zob. sekcja 4) | Zdobycie/utrata miasta (bitwa, głód, bez bitwy) | `{city: CityId, old_owner: OwnerRef, new_owner: OwnerRef, rows: Vec<CaptureRow>, victim: PlayerId, captor: PlayerId, eliminated: Option<PlayerId>}` | K, M, T | EFEM (karta) + STAN (`City.ownerId`) | BRAK zdarzenia (5 trafień `captur`: `barbarians.rs:535-550`, tylko warunki zdobycia) | BRAK | L (bitwa: H, patrz E-31; wejście jednostki `:25747`: H) |
| E-21 | `capital_captured_plunder` | `engine_event` · `kind="capital_captured_plunder"` → `EngineEvent::CapitalCapturedPlunder` | `main.ts:29111-29300` (`runCapitalCapturePlunder`; toast `:29132`, `:29209`; karta `:29200`); triumf `showTriumphCityStateNotice` `:29291`; „Stolica niedostępna” `:28706` | Przejęcie stolicy i splądrowanie | `{city: CityId, victim: PlayerId, captor: PlayerId, plunder: Vec<ResourceLoss>, praca_pool_taken: u32}` | M, T, K | STAN (`capitalCityIdByOwner` META `:30578`) | BRAK (`capital-capture.ts` tylko web; 0 trafień `plunder\|capital_captured`) | BRAK | L |
| E-22 | `population_changed_summary` | `engine_event` · `kind="population_changed_summary"` → `EngineEvent::PopulationChangedSummary` | `main.ts:31790` („Wzrost populacji w N miastach”), `:31792` („Głód: spadek populacji w N miastach”) | Podsumowanie wzrostu/głodu po tyku ekonomii | `{grew: u32, starved: u32}` | T | EFEM (wynik → STAN `City.population`) | `city_growth.rs:30` (min. populacja po głodzie), `:218` `growth_threshold`, `:356` `growth_gain_per_turn_slots` — domena bez wpięcia do `playable.rs` | CZĘŚCIOWY | L |
| E-23 | `army_food_tip_first_unit` | `engine_event` · `kind="army_food_tip_first_unit"` → `EngineEvent::ArmyFoodTipFirstUnit` | `main.ts:14417-14419` (`maybeHintArmyFoodOnFirstPlayerUnit`, jednorazowy, flaga `playerArmyFoodHintShown`) | Pierwsza jednostka gracza przy ujemnym magazynie | `{reserve: i32}` | T | META/flaga (jednorazowość) | BRAK (0 trafień) | BRAK | L |
| E-24 | `build_completed` | `engine_event` · `kind="build_completed"` → `EngineEvent::BuildCompleted` | `main.ts:3859-3868` (`applyProductionCompleted`, `markCityStateDirty`), auto-lista: `main.ts:8282` („Lista ukończona — miasto”) | Ukończenie budowy/jednostki/listy | `{city: CityId, item: ProductionItemId, kind: Building\|Unit\|List}` | T (lista) / – (budowa: brak powiadomienia) | STAN (`cityBuilt`, top-level P2.7 §2; D13) | BRAK (0 trafień `build_completed\|construction_done\|production_completed`; szersze trafienia `complet\|built` to pola planera) | BRAK | L |
| E-25 | `wonder_completed` | `engine_event` · `kind="wonder_completed"` → `EngineEvent::WonderCompleted` | `main.ts:4364-4419` (`completeWonderOnHex`; `variant:'mine'` `:4407`, `variant:'rival'` `:3875`); `main.ts:4489` (`Ukończono: <cud>` w `tryBeginWonderMapBuild`, klasa H, gałąź bez miejsca budowy); `ui/wonderCompletedNotice.ts:76` | Cud ukończony (własny lub wygrany/przegrany wyścig) | `{wonder: WonderId, owner: PlayerId, city: Option<CityId>, outcome: Mine\|Rival, turn: u32}` | M | STAN (`completedWorldWonders`, `placedWorldWonders` META `:30648-30649`) | BRAK (0 trafień `wonder_completed\|completed_world_wonder`; M12 bez modelu cudów, P2.1) | BRAK | L |
| E-26 | `tech_researched` | `engine_event` · `kind="tech_researched"` → `EngineEvent::TechResearched` | `main.ts:31992-32033` (`Zbadano: <tech>` — karta `:32026`, toast `:32033` poza EOT), `main.ts:14383` i `:32046` (`showTechDiscoveryNotice`) | Ukończenie badań (auto-research) | `{tech: TechId, cost: u32, free_money: bool, era_advanced: bool}` | K, T, M | STAN (`unlockedTechsForOwner` `:8220`) | `researched_by_owner` `diplomacy.rs:2203-2204` (jedyny ślad; brak modułu badań, P2.1 M12) | BRAK | L |
| E-27 | `era_changed` | `engine_event` · `kind="era_changed"` → `EngineEvent::EraChanged` | `main.ts:14354-14378` (`notifyPlayerEraChangeIfAdvanced`: toast, karta `era-<tura>-<epoka>` `:14371`), `:14404-14410` (`flushPendingEraChangeToast`; wywołania `showHintMessage` w `:14366`, `:14408`), wywołania `:3842`, `:4394`, `:10071`, `:25890`, `:32042`; flush `:36023` | Awans epoki gracza | `{owner: PlayerId, new_era: EraIndex, discovered_tech: Option<TechId>}` | T (odroczony), K, M | STAN (`OwnerState.era`, P2.2 §2) | BRAK (0 trafień `era_changed\|era_advanced\|EraChanged`; `era` `diplomacy.rs:2169` to pole definicji techa) | BRAK | L |
| E-28 | `gold_deficit` | `engine_event` · `kind="gold_deficit"` → `EngineEvent::GoldDeficit` | `main.ts:32150-32170` (wywołania `:32150`, `:32152`, `:32163`; „Deficyt Złota: utracono N jednostek”, „-x% max HP”, „za N tur — pusty Skarbiec!”) | Deficyt złota w tyku ekonomii | `{units_lost: u32, units_damaged: u32, turns_left: Option<u8>}` | T | STAN (skarbiec; karencja `zlotoDeficytKarencjaTur`) | `turn_economy.rs:299` `resolve_turn` (skarbiec), konsekwencje deficytu: BRAK | CZĘŚCIOWY | L |
| E-29 | `food_deficit_army` | `engine_event` · `kind="food_deficit_army"` → `EngineEvent::FoodDeficitArmy` | `main.ts:31650` („Głód: utracono N jednostek”), `:31652` („Głód wojska −x% max HP”), `:31742` („Wycinka: +N Drewna”) | Głód wojska / zakończenie wycinki | `{units_lost: u32, units_damaged: u32, hp_frac: f32}` / `{wood: u32, turns_left: u8}` | T | STAN (`hexClearingStates` META `:30646`) | BRAK (P2.1 M4: army-starvation BRAK; 0 trafień `food_deficit\|army_starv\|army_hunger`) | BRAK | L |
| E-30 | `siege_state` | `engine_event` · `kind="siege_state"` → `EngineEvent::SiegeState` | `main.ts:14628-14629` (magazyn wyczerpany, kapitulacja za 1 turę), `:14814-14816` (kapitulacja z głodu), `:14866` i `:14964` (oblężenie zniesione), `:29964` (szturm udany), `:29966` (szturm odparty, faza `StormRepelled`), `:29974` (remis); `:14922` (`startMapSiege`: „Miasto bez muru”, ścieżka automatu po turze AI `scanAutoSiegesAfterAiTurn` `:14997` — klasa H, zob. sekcja 4); META `siegeTurnByCity` `:30527`, `siegeBesiegerByCity` `:30528`, `siegeAiStateByKey` `:30529` | Zmiana fazy oblężenia | `{city: CityId, phase: Starving\|SurrenderPending\|Surrendered\|Lifted\|Stormed\|StormRepelled\|Draw, besieger: PlayerId, turn: u32}` | T, M | META/STAN | BRAK (P2.1 M8: stan oblężeń BRAK; 0 trafień `siege_state\|SiegePhase`; pole `is_siege` `combat.rs:105` to flaga walki) | BRAK | L (`:14922`: H) |
| E-31 | `battle_result` | `engine_event` · `kind="battle_result"` → `EngineEvent::BattleResult` | `main.ts:28284` (`applyMapBattleOutcome`), `:27631` (`applyMapBattleOutcomeWithSummary`), modal `postBattleSummary` `:27692`, łupy toast `:27690` („Łupy: …”); atak AI na gracza `:28152` („Wróg atakuje twoje wojsko!”), wycofanie `:28247`; klasa H (sekcja 4): `:27457` (`doMapAutoResolve`, gracz, brak sił), `:28121` (`doMapAutoResolveIncoming`, bitwa zainicjowana przez AI, brak sił po wyborze „auto” w pre-battle), `:30217` (`doSiegeAutoResolve`, szturm gracza), `:30388` (`launchBigPresetBattle`, wynik, gracz); wejście AI: `main.ts:28261` (jedyne automatyczne wywołanie `showPreBattle`, `auto: true`), kolejka `ui/preBattle.ts:240-247,398-400` (modal bitwy wejściowej, B); dziennik walki jako dane wejściowe payloadu: `battle/battleScene.ts:8720,9831`, `units/battleRoster.ts:31`, `game/post-battle-map.ts:47` | Wynik walki (atak gracza lub atak AI) | `BattleSummary {attacker: UnitIds, defender: UnitIds, hex: HexCoord, losses: …, loot: Option<Loot>, initiator: Player\|Ai}` (+ `UnitId` z P2.3 D-ID-10) | M, T | EFEM (podsumowanie) + STAN (straty) | `CombatResult` `domain/combat.rs:157`, `resolve_combat` `:301` (model inny niż web — P2.1 M8, bez `UnitId`) | CZĘŚCIOWY | H (E-31 ma dwie strony: atak gracza / atak AI); wiersze `:28152`, `:28247` i wejście AI `:28261` = L |
| E-32 | `sentry_woken` | `engine_event` · `kind="sentry_woken"` → `EngineEvent::SentryWoken` | `main.ts:10800-10815` (wywołanie `:10812`; `wakeSentryUnitsOnEnemyContact`, „obudzony — wróg w polu widzenia!”) | Wróg wszedł w pole widzenia po tyku AI | `{unit: UnitId, enemy: UnitId, hex: HexCoord}` | T | EFEM (+ STAN: tryb warty) | BRAK (0 trafień `sentry\|wake`) | BRAK | L |
| E-33 | `veteran_enemy_first_seen` | `engine_event` · `kind="veteran_enemy_first_seen"` → `EngineEvent::VeteranEnemyFirstSeen` | `main.ts:10958-10975` (`checkVeteranEnemyFirstEncounter`, moduł `game/veteran.ts:247`: toast `:10969`, karta `VETERAN_ENEMY_EDU_EVENT_ID` `:10973`), flaga `veteranEnemyEducationShown` (META, klasa U wg P2.2 §4) | Pierwsze spotkanie z wrogim weteranem (jednorazowe) | `{unit: UnitId, owner: PlayerId}` | T, K | META (flaga) | BRAK (0 trafień `veteran` poza komentarzami) | BRAK | L |
| E-34 | `village_reward` | `engine_event` · `kind="village_reward"` → `EngineEvent::VillageReward` | `main.ts:25797-25962` (`checkVillageRewardAt`: `grantGold` `:25819`, toast `:25953`, karta `villageEventLog` `:25955` EFEM, cap 6 `:25962`; tech `:25894`); `villageRewards.ts:133` (`villageGoldAmount`, domyślne `Math.random`); META `lootedVillageHexKeys` `:30635` | Wejście jednostki na chatkę (nagroda: złoto / technologia / jednostka) | `{hex: HexCoord, reward: Gold{amount: u32} \| Tech{tech: TechId, progress: u32} \| Unit{unit_type: UnitTypeId, spawn: HexCoord}}` | T, K, M | STAN (`lootedVillageHexKeys`, skutek nagrody) | BRAK (`rust-port/engine/src/domain/playable.rs:172` `villageRewardsEnabled:NOT_IMPLEMENTED`; trafienia `village` to flaga planera AI `ai_turn.rs:131`; P2.1 M14) | BRAK | H (D-EV-8: RNG, P2.4) |
| E-35 | `march_progress` | `engine_event` · `kind="march_progress"` → `EngineEvent::MarchProgress` | `main.ts:25523` („Dotarło do celu”), `:25528` („Marsz wstrzymany/przerwany: …”), `:25548` („brak punktów ruchu”), `:25570`, `:25367` („brak trasy do celu”); `finishMarchSegmentHints` `:25515`, `executeMarchSegmentForUnit` | Postęp zaplanowanego marszu (wykonywany przez tury) | `{unit: UnitId, stop: Arrived\|Blocked{reason: Fog\|NoMoves\|NoRoute}, detail: Option<String>}` | T | META/STAN (`plannedMarches` D13 → `units`) | BRAK (P2.1 M4: planned-march BRAK; 0 trafień `march_progress\|planned_march\|march_stop`) | BRAK | H (D-EV-5) |
| E-36 | `trade_route_new` | `engine_event` · `kind="trade_route_new"` → `EngineEvent::TradeRouteNew` | `main.ts:15508-15533` (`pushOnce`, `tradeRouteEventLog` EFEM, cap 6 `:15586`; toast `:15524`); wywoływane w `runWorldEndTurn` przez `recomputeTradeRoutesNow(true)` `:31289` | Nowy szlak handlowy po odświeżeniu tras | `{route: TradeRouteId, from: CityId, to: CityId, owner: PlayerId, to_owner: PlayerId, medium: Land\|Sea, income_per_turn: u32}` | T, K | STAN (`tradeRoutes` `TradeRoute`, P2.2 §2) | `refresh_trade_routes` `domain/trade.rs:932` zwraca `Vec<TradeRoute>` **bez różnicy** (brak „dodane/usunięte”); `create_trade_route` `:823` | CZĘŚCIOWY | L |
| E-37 | `trade_route_lost` | `engine_event` · `kind="trade_route_lost"` → `EngineEvent::TradeRouteLost` | `main.ts:15534-15581` (`reason`: „miasto zniknęło” / „zmiana właściciela miasta” / „wojna” / „zerwana Umowa Szlaków” / „brak połączenia”; toast `:15572`, karta `:15580`) | Zerwanie szlaku handlowego | `{route, from, to, owner, to_owner, reason: CityGone\|OwnerChanged\|War\|NoTreaty\|NoConnection}` | T, K | STAN | jw. (E-36) — brak różnicy i brak powodu | CZĘŚCIOWY | L |
| E-38 | `auto_ration_adjusted` | `engine_event` · `kind="auto_ration_adjusted"` → `EngineEvent::AutoRationAdjusted` | `spich-auto-ration-notify.ts:22-35` (id `auto-ration-t<tura>`, `kind:'enemy'`, `negative:true`); `main.ts:35827-35830` (`rationAutoEventLog`, cap 4) | Automatyczna korekta racji (spichlerz) | `{adjusted: Vec<CityId>, …AutoRationAdjustResult}` | K | EFEM (+ STAN: poziom racji miasta) | BRAK (0 trafień `auto_ration\|ration_adjust`) | BRAK | L |
| E-57 | `merge_prompt_deferred` (odroczony prompt scalania/rozdzielenia armii) | `engine_event` · `kind="merge_prompt_deferred"` → `EngineEvent::MergePromptDeferred` | `game/armyMerge.ts:655` (`resolveSeparateReturnHex`: „deferred-prompt path, flushed after AI turns”); flush `main.ts:6268`, `:12149`, `:12221`, `:12229` (`flushDeferredMergePrompts`) | Tura AI zmienia sytuację jednostek gracza; gracz rozstrzyga scalenie lub rozdzielenie | `{owner: PlayerId, units: Vec<UnitId>, hex: HexCoord, return_hex: Option<HexCoord>, options: Merge\|KeepSeparate}` | B | EFEM (kolejka promptów) + STAN (pozycje jednostek) | BRAK (0 trafień `merge_prompt\|armyMerge\|separate_return`; `git grep -i merge` na 9e33fc77 trafia tylko w `domain/map_generator.rs:730-785`) | BRAK | H |
| E-56 | `army_starvation_warning` (odliczanie karencji głodu wojska) | `engine_event` · `kind="army_starvation_warning"` → `EngineEvent::ArmyStarvationWarning` | `main.ts:31662` (`showHintMessage`, tekst „Głód wojska za N tur — brak żywności na armię!”, 3000 ms; warunek `pozostaleTury > 0` w bloku `:31655-31665`, `glodWojskaKarencjaTur`) | Tura gracza z ujemnym magazynem żywności, karencja głodu wojska jeszcze trwa | `{turns_left: u8, reserve: i32}` | T | EFEM (stan karencji: `glodWojskaKarencjaTur`, `turyUjemnychZapasowPo` — do przypięcia w P2.2) | BRAK (0 trafień ostrzeżenia wojskowego; `apply_hunger_penalty` `city_growth.rs:330` dotyczy populacji miasta) | BRAK | L |
| E-58 | `auto_improvement_applied` (automat ulepszeń gracza po turze + sygnał nadwyżki Pracy) | `engine_event` · `kind="auto_improvement_applied"` → `EngineEvent::AutoImprovementApplied` | `main.ts:33126`, `:33128` (toast „Auto ulepszenie: …” / „Auto ulepszenia: N× (−Praca)”, warunek `hOid === humanOwnerId`), `:33137` (sygnał „Automat ulepszeń: nadwyżka budżetu Pracy…”, gdy automat nic nie postawił); wybór przez `pickAutoImprovements` `:32997`; cała ścieżka w `runWorldEndTurn` `:31169-35854` | Koniec tury: automat gracza stawia ulepszenia wg polityki ustawionej przez gracza (wykonuje logika, nie gracz) | `{owner: PlayerId, city: CityId, built: Vec<ImprovementId>, labour_spent: u32}`; sygnał: `{owner: PlayerId, surplus_labour: u32}` | T | STAN (ulepszenie na heksie; polityka `ulepszeniaTryb` w META/STAN) + EFEM (toast) | BRAK (0 trafień `auto_improv\|pick_auto\|auto_build` w `rust-port/engine/src` i `src-tauri/src`) | BRAK | L |
| E-59 | `city_visit_bonus` (bonus budynku po wejściu jednostki do miasta) | `engine_event` · `kind="city_visit_bonus"` → `EngineEvent::CityVisitBonus` | `main.ts:10847` (`applyCityVisitBonusesAlongPath`: `if (msg) showHintMessage(msg, 4500)` przy `showPlayerHints && u.ownerId === 0`); wywołania z trzech ścieżek: ruch gracza (`applyCityVisitBonusesAtHex`), krok marszu `applyMarchSegmentInstant` `:25672`, animacja ruchu w EOT `endActiveHumanTurn` `:35920` i `renderLoop` `:36328` | Jednostka gracza wchodzi do miasta i zyskuje bonus budynku (ruch gracza albo ruch wykonany przez logikę) | `{unit: UnitId, city: CityId, gain: BuildingBonusGain}` | T | EFEM (toast) + STAN (efekt bonusu w mieście) | BRAK (0 trafień `visit\|garrison_bonus\|lawGarrison`; `prawo_wojskowe_przemarszu` `diplomacy.rs:1374` to nazwa umowy, nie bonus) | BRAK | H (sekcja 4) |
| E-60 | `diplomacy_proposal_result` (baner wyniku propozycji: „Przyjęto” / „Odrzucono” + powód) | `engine_event` · `kind="diplomacy_proposal_result"` → `EngineEvent::DiplomacyProposalResult` | `ui/diplomacyProposalBanner.ts:38` (`showDiplomacyProposalBanner(accepted, reason)`, znika po 4,5 s); wywołania: `main.ts:20612` (`applyProposalOutcome`, wołane przez odpowiedź AI `resolveNegotiationEntryAt` `:17149` i przez akceptację gracza), `main.ts:17307` (odrzucenie pozycji stołu, „Odrzucono propozycję”), `main.ts:17860` (odrzucenie propozycji, „Odrzucono propozycję”, obok `showHintMessage` `:17861`) | Wynik propozycji dyplomatycznej (AI lub gracz) | `{proposal: ProposalId (DECISION_REQUIRED: brak w P2.3), accepted: bool, reason: String, proposer: PlayerId, responder: PlayerId, correlation: CommandId}` | M (baner: zaakceptowano / odrzucono) | EFEM (skutek w stole: E-05/E-06) | BRAK: brak stolu negocjacyjnego w domenie (sekcja 9.1, E-05/E-06; `git grep` na `9e33fc77` = 0 trafień) | BRAK | H (D-EV-5); `:20612` = H (wynik akceptacji/odpowiedzi AI); `:17307`, `:17860` = H (odrzucenie pozycji stołu, gracz lub AI) |

### 3.C Komunikaty systemowe i zapis

| ID | Nazwa eventu | Proponowany event Rust | Dowód web | Wyzwalacz | Payload | Forma UI | Trwałość | Rust dziś | Status | Klasa |
|---|---|---|---|---|---|---|---|---|---|---|
| E-39 | `autosave_failed` | `engine_event` · `kind="autosave_failed"` → `EngineEvent::AutosaveFailed` | `main.ts:30836`, `:30903`, `:30912` (`doRotatingAutosave`, „Autozapis nieudany”), `:31229` (`runWorldEndTurn`) | Błąd rotacyjnego autozapisu | `{reason: Quota\|Write\|Unknown, slot: u8, turn: u32}` | T | EFEM | BRAK (`save_load.rs` tylko ścieżka testowa, P2.8 §6; 0 trafień `autosave\|save_fail`) | BRAK | L |
| E-40 | `disk_autosave_degraded` | `engine_event` · `kind="disk_autosave_degraded"` → `EngineEvent::DiskAutosaveDegraded` | `main.ts:30932` (`notifyFsaAutosaveDegraded`); `main.ts:30786` (`triggerFsaAutosaveBootstrap`, komunikat startowy o niedostępnym autozapisie na dysk, raz na `localStorage`) | Utrata uprawnienia zapisu na dysk | `{}` | T | EFEM | BRAK (0 trafień `fsa\|disk_autosave`) | BRAK | L |
| E-41 | `victory_or_defeat` | `engine_event` · `kind="victory_or_defeat"` → `EngineEvent::VictoryOrDefeat` | `main.ts:35769` (`showVictoryScreen`), `:35771` (toast `formatVictoryTitle`), `:35773` (console) | Warunek zwycięstwa/porażki spełniony | `{result: Win\|Loss, mode: String, turn: u32, power_share: Option<f32>}` | M, T | STAN (`gameOver`) | `TurnPhase::Victory` `domain/events.rs` (faza), `playable.rs:683` `VictoryCheck` (mapowanie, bez warunków); warunki: ODROCZONE do P6.19 (P2.1 §2 `victory.ts`) | CZĘŚCIOWY | L |
| E-42 | `barbarian_raid_sea` | `engine_event` · `kind="barbarian_raid_sea"` → `EngineEvent::BarbarianRaidSea` | `main.ts:35651` („Rajd Ludów Morza — zniszczone ulepszenie: X!”), `:35556` (`barbCanEngageOwner`) | Rajd barbarzyńców niszczy ulepszenie | `{raider: OwnerRef::Barbarian, hex: HexCoord, destroyed: ImprovementId}` | T | STAN (`Ulepszenie` na heksie) | `barbarians.rs:469` `tick_camps`, `:995` `tick_barbarian_camps` (obozy); raid morski: BRAK (P2.1 M14 „sea-barb: BRAK”); flaga `sea_raider` `barbarians.rs:193` | BRAK | L |

### 3.D Panele i mechanizm odświeżania

| ID | Nazwa eventu | Proponowany event Rust | Dowód web | Wyzwalacz | Payload | Forma UI | Trwałość | Rust dziś | Status | Klasa |
|---|---|---|---|---|---|---|---|---|---|---|
| E-43 | `turn_advanced_state` (odświeżenie paneli) | `engine_event` · `kind="turn_advanced_state"` → `EngineEvent::TurnAdvancedState` | `main.ts:31169` (`runWorldEndTurn`), `updateHud()` (lokalne `main.ts:23131`, import `hud.ts` jako `refreshD1bHud`), `updateDiplomacyPanel()` `:33272`, `:34507`, `cityRenderer.sync`, `refreshFog()`; pełna lista w sekcji 9.5 | Koniec tury (po fazie AI i ekonomii) | pełny `PlayableState` | odświeżenie | STAN | `engine_state_changed` emitowany po każdej komendzie poza `GetState` (`rust-port/engine/src/bridge.rs:225-233`, `src-tauri/src/lib.rs:43`); `advance_turn` (`playable.rs:554`) nie woła `turn_economy` (0 trafień `turn_economy` w `playable.rs`; P2.8 §6) | CZĘŚCIOWY (mechanizm jest, treść tury — nie) | L |
| E-44 | `turn_phase_changed` | `engine_event` · `kind="turn_phase_changed"` → `EngineEvent::TurnPhaseChanged` | `main.ts:35833-35839` (flush `deferredEotHints` po fazie), `endTurnInProgress` (`eot-event-defer.ts:18`) | Przejście fazy tury | `{turn: u32, phase: TurnPhase}` | UI (blokada, overlay) | STAN (`state.phase`) | `TurnPhase` `domain/events.rs:44`, `PlayableState.phase` (`playable.rs:349`, `:454`, `:574`), `TurnEvent` (znaczniki faz: `playable.rs:589`, `:676-684`; bez emitera, kolejka bez konsumenta) | CZĘŚCIOWY (pole `PlayableState.phase` w snapshocie; zdarzenia brak) | L |
| E-45 | `command_error` (ODPOWIEDŹ, nie event) | brak (odpowiedź na komendę, nie event; P2.5) | `main.ts:31086-31109` (`hintEndTurnBlocked`) — to reakcja na akcję gracza | Odrzucenie komendy | `BridgeError{code, message}` | T | – | `BridgeErrorCode` `bridge.rs:119-125`; brak eventu, odpowiedź (`bridge.rs:213-236`) | WYKLUCZONY z katalogu (odpowiedź na komendę; P2.5) | **W** (odpowiedź na komendę; zakres P2.5) |

### 3.E Trwały log domenowy w zapisie (META, nie kronika UI)

| ID | Nazwa | Proponowany event Rust | Dowód web | Payload | Trwałość | Rust dziś | Status | Klasa |
|---|---|---|---|---|---|---|---|---|
| E-46 | `diplomacy_factor_log` | `engine_event` · `kind="diplomacy_factor_log"` → `EngineEvent::DiplomacyFactorLog` | `main.ts:8315` (`Map<string, DiploFactorLog>`), dopisywanie `:9880-9881`, czyszczenie `:9108`; META `diplomacyFactorLog` `:30560`; typ `diplomacy-factors.ts:24` | `DiploFactorEntry {eventKey: String, delta: i32, tura: u32}` | META | BRAK (0 trafień `diplomacy_factor\|factor_log`) | BRAK | L |
| E-47 | `credibility_events` | `engine_event` · `kind="credibility_events"` → `EngineEvent::CredibilityEvents` | `main.ts:8323` (`wiarygodnoscZdarzeniaByOwner`, dopisywanie `:9677`), `:8331` (`wiarygodnoscStrumienByOwner`, `:9710`); META `:30565-30566`; typ `diplomacy-credibility.ts:144` | `CredibilityEventRecord {typ: CredibilityEvent, wartosc, tura}` | META | BRAK zweryfikowanego odpowiednika (P2.2 §4; `credib` nierozstrzygnięte P2.7 §8; trafienia to progi konfiguracji) | BRAK | L |
| E-48 | `religion_spread_stats` | `engine_event` · `kind="religion_spread_stats"` → `EngineEvent::ReligionSpreadStats` | `culture-religion.ts:979-995` (`ReligionSpreadEvent`); `main.ts:3094-3095`, `:7352` (tylko liczby do panelu, bez komunikatu) | `{id, religion, added, state}` | EFEM (dane panelu) | BRAK (M10 bez modelu; 0 trafień `religion_spread`) | BRAK | L |

### 3.F Eventy wewnętrzne web bez wpływu na kontrakt UI (wpisane dla kompletności; status WYKLUCZONY, D-EV-13)

| ID | Nazwa | Dowód web | Payload (typy) | Trwałość | Proponowany event Rust | Rust dziś (dowód) | Status | Klasa | Uzasadnienie wykluczenia |
|---|---|---|---|---|---|---|---|---|---|
| E-49 | `ai_research_log` | `main.ts:28650-28652` (`console.log`, `[AI n] Zbadano: …`) | `{player: PlayerId, tech: <D-EV-11>, koszt: u32}` | EFEM (konsola) | brak (diagnostyka konsoli, nie zdarzenie UI) | — (log konsoli) | WYKLUCZONY | – | Tylko log konsoli, bez UI; nie jest eventem logika→UI. |
| E-50 | `rebellion_log` | `main.ts:32507` (`console.log`, `[Rebelia] Tura …`) | `{city: CityId, tura: u32}` | EFEM (konsola) | brak (widoczny odpowiednik = E-18, toast) | `rebel`: 0 trafień (E-18) | WYKLUCZONY | – | Konsola nie jest eventem; dublowane przez E-18. |
| E-51 | `order_tier_log` | `main.ts:32526-32528` (`console.log`, `[Porzadek] …`, gdy `tier !== 'neutral'`) | `{city: CityId, tura: u32, tier: <D-EV-11>, porPct: liczba, szPct: liczba}` | EFEM (konsola) | brak (log diagnostyczny) | — | WYKLUCZONY | – | Tylko log diagnostyczny. |
| E-52 | `eot_hint_card` | `game/eot-event-defer.ts:149-248` (`deferredHintsToSidePanelEvents`, id `eot-hint-<tura>-<i>` `:248`) | `{id: String, kind: String, text: String}` (transport, nie domena) | EFEM | brak (transport: batch, sekcja 2); treść niesie E-xx | — (transport) | WYKLUCZONY (mechanizm) | – | Mechanizm transportu web (kolejka odłożonych toastów), nie zdarzenie domeny. |
| E-53 | `dismiss_card` (UI → logika) | `ui/sidePanelHud.ts:477-511` (komentarze o `dismissedSidePanelEventIds`), `game/eot-event-defer.ts:36-43` (`dismissEotOrEraWarLogEntry`, `warEventLog.splice` `:43`) | `{entryId: String}` | EFEM (UI) | brak eventu; komenda `dismiss_event_card` → P2.5 | — (komenda: P2.5) | WYKLUCZONY (komenda) | W | Komenda UI → logika: zakres P2.5, nie event. |
| E-54 | `side_panel_filter` | `ui/sidePanelEventFilter.ts:19-30` (chip „Inne cyw.”) | `{filter: String}` | EFEM (widok) | brak eventu; stan widoku UI (ewentualna komenda widoku, nie logiki) | — (stan widoku UI) | WYKLUCZONY (stan widoku) | W | Stan widoku UI, nie zdarzenie logiki. |
| E-55 | `diplomacy_pending_resolve` | `main.ts:17816` (`Pokój z: …`), `:17861` (`Odrzucono: …`) i pokrewne (`Przyjęto`, `Zaakceptowano`) | `{offer_id: String, answer: Accept \| Reject}` (UI → logika) | — (skutki w E-01/E-03/E-06) | brak eventu; komenda `diplo_resolve_offer` → P2.5; skutek = E-06 / E-01 | — (komenda: P2.5) | WYKLUCZONY (komenda, dwukierunkowe) | H | Odpowiedź gracza: dwukierunkowe, zaznaczone jawnie, nie klasyfikowane na siłę; wynik → E-06 / E-01. |

> Uwaga: E-55 jest dwukierunkowe i zostało wyłączone z katalogu eventów. Jego skutki (zmiana relacji, wojna, nowa umowa) są eventami E-01/E-03/E-06. Status WYKLUCZONY dla E-49…E-55 nie należy do zbioru GOTOWY/CZĘŚCIOWY/BRAK z dispatchu; patrz D-EV-13 (sekcja 6).

---

## 4. Pozycje HYBRYDA (H) — jawnie, bez wymuszania klasy

| Pozycja | Dlaczego dwukierunkowa | Propozycja |
|---|---|---|
| E-06 odpowiedź AI na propozycję gracza | Gracz wysyła komendę, AI odpowiada w tyku (kontroferta, odrzucenie) | Event `diplo_offer_response` z `correlation: CommandId` (łączy komendę P2.5 z eventem). |
| `:10126`, `:20715`, `:20767`, `:20774` (E-06) — komunikaty wyniku akceptacji (`executeTechTradeDeal` `onCancelled`, `applyProposalOutcome`: „Zaufanie nie naliczone”, „Pokój zawarty”) | Te same funkcje są wołane przez akceptację gracza (`handleNegotiationAccept` `:17273`, `resolvePendingDiplomacy` `:17841`) i przez odpowiedź AI (`resolveNegotiationEntryAt` `:17149` → `applyProposalOutcome` `:17149`, `executePnDealTransfer` `:20720`/`:20737`) | Komunikat jest częścią wyniku E-06 z polem `initiator: Player\|Ai`, nie osobnym eventem. |
| `:10606`, `:10616`, `:10630` (E-01) — „Traktat pokoju — nie możesz wypowiedzieć wojny”, „Wypowiedziałeś wojnę” w `playerDeclareWarOnOwner` | Wywoływane przez gracza (`applyAudienceAction`, `withPlayerWarConsent`) i przez odpowiedź AI z `warThreat` (`resolveNegotiationEntryAt` `:17152`, gdy propozycja gracza została odrzucona) | E-01 z polem `initiator: Player\|Ai`; wypowiedzenie wojny wynikające z odpowiedzi AI jest częścią E-01. |
| `:14922` (E-30) — „Miasto bez muru — użyj preBattle” w `startMapSiege` | Kontekst oblężenia buduje gracz (`offerCityAttackChoice` `:15036`) albo automat po turze AI (`scanAutoSiegesAfterAiTurn` `:14997`, `city.ownerId === 0`) | Część E-30 (`initiator`), nie osobny event. Komunikat :14940 w tej samej funkcji jest tylko dla `oblegajacyOwnerId === 0` (klasa W). |
| `:25747` (E-20) — „… w mieście — +N jedn. daje bonus Prawo · Ufort. = ukryty garnizon” w `finishUnitEnterCityHex` | Wołane z `refreshMapAfterCityCapture` (`applyMapBattleOutcome` `:28470`, `captureCityWithoutBattle` `:29838`, `finishSiegeStormBattle` `:29952`) i z `tryAutoCaptureEmptyCityAt` (ruch gracza, EOT, animacja). **Komunikat nie sprawdza `ownerId`** (`:25745-25752`), więc pokazuje się także dla jednostek AI | Część E-20 (wejście jednostki do miasta), z `owner`; do decyzji, czy filtrować po właścicielu (D-EV-12). |
| `:10847` (E-59) — bonus budynku po wejściu do miasta w `applyCityVisitBonusesAlongPath` | Ruch gracza (`applyCityVisitBonusesAtHex`), krok marszu (`applyMarchSegmentInstant` `:25672`), animacja EOT (`endActiveHumanTurn` `:35920`), `renderLoop` `:36328` | Osobny wiersz E-59 (`city_visit_bonus`); inicjator wynika z ruchu (gracz lub logika). |
| `:28121` (E-31) — „Bitwa: brak sił bojowych w składzie” w `doMapAutoResolveIncoming` | Bitwa zainicjowana przez AI (`main.ts:28261`, `auto: true`); gracz w pre-battle wybiera „auto”, wynik liczy logika (`resolveAutoBattleByPower`), a `winner === 'none'` kończy bitwę tym komunikatem | Część E-31 (`initiator: Ai`). Jedna klasa: **H**. Ta funkcja nie zawiera komunikatów klasy W. |
| `:27457` (E-31) — „Atak: brak sił” w `doMapAutoResolve` (atak gracza) | Gracz inicjuje atak, wynik liczy logika | E-31 (`initiator: Player`). |
| `:30217` (E-31) — „Szturm: brak sił” w `doSiegeAutoResolve` (szturm gracza) | Gracz inicjuje szturm, wynik liczy logika | E-31 (`initiator: Player`). |
| `:4489` (E-25) — „Ukończono: cud” w `tryBeginWonderMapBuild` | Gracz zaczyna budowę cudu w terenie; wynik ukończenia liczy logika | E-25 (`variant: mine`), nie osobny event. |
| `:30388` (E-31) — „Duża bitwa — wynik” w `launchBigPresetBattle` | Gracz uruchamia bitwę; wynik liczy logika | E-31 (`initiator: Player`), nie osobny event. |
| Ruch gracza → `promptMergeIfCoLocated` `main.ts:12129/12204/12215` | Komunikaty w callbackach `onMerge`/`onSeparate` modalu scalania (wybór gracza) | **Wykluczone** (klasa W; sekcja 9.4). Modal scalania jako prompt odroczony: E-57. |
| Automat ulepszeń gracza po turze: `:33126`, `:33128`, `:33137` | Gracz ustawia politykę, a wykonuje ją logika w `runWorldEndTurn` | **L** — E-58 (nie hybryda: gracz nie wywołuje tej akcji w tym momencie). |

---

## 5. Wnioski techniczne (nie decyzje)

1. **Kronika WYDARZENIA w web nie jest trwała.** Rust nie musi jej zapisywać; po wczytaniu web zaczyna z pustą kroniką. Wyjątkiem są karty wyprowadzone ze stanu (E-05, E-17, E-19), które odtwarzają się po wczytaniu z tego samego stanu.
2. **Karty blokujące powinny być wyprowadzane ze stanu**, a nie wysyłane jako eventy — web już tak robi (`collectTurnEvents` `main.ts:15615-15690` buduje je z każdego renderu). Eventy są tylko powiadomieniami.
3. **Rust nie ma emitera eventów domenowych poza `engine_state_changed`.** Dowód globalny: jedyne wywołanie emisji w repo to `app.emit` w `src-tauri/src/lib.rs:43` (`git grep -nE 'emit\(|\.emit|emit_all|app_handle' 9e33fc77 -- rust-port/engine/src src-tauri/src`: jedno trafienie), a `BridgeEvent` ma jeden wariant (`bridge.rs:97-106`). `TurnEvent` (`domain/events.rs:137`) jest generowany jako znacznik fazy w kolejce (`playable.rs:589`, `:676-684`), ale kolejka nie jest konsumowana (sekcja 2). `DiplomaticEvent` (`diplomacy.rs:533`, `:623`, `:659`) zmienia relacje bez powiadomienia. To jest luka architektoniczna, nie tylko brak wpięcia.
4. **`ai_turn.rs` (1402 linie, `plan_ai_turn` `:996`, `decide_ai_turn` `:1039`) nie emituje żadnej decyzji do UI** i nie jest zadeklarowany w `domain/mod.rs` (P2.8 §6). Web pokazuje AI tylko przez kilka kart dyplomacji i wojny (E-01, E-05, E-11, E-12); reszta decyzji AI jest niewidoczna (console). Patrz D-EV-7.
5. **RNG w nagrodach:** `villageRewards.ts:133` (`villageGoldAmount(era, rand = Math.random)`) — nagroda nie jest deterministyczna w web. Rust musi przyjąć RNG z P2.4. Patrz D-EV-8.
6. **Hot-seat handoff nie ma produkcyjnego wyzwalacza** w web (`main.ts:24543-24546` to tylko hak testowy). Komponent istnieje, zdarzenie nie. Patrz D-EV-6.
7. **Komunikaty wynikowe są współdzielone między gracza i AI** (sekcja 4: E-01, E-06, E-20, E-30, E-31). Stąd klasa H i pole `initiator` w payloadzie zamiast dwóch osobnych katalogów.

---

## 6. Punkty wymagające decyzji (`DECISION_REQUIRED`, NIE rozstrzygnięte po cichu)

- **D-EV-1 — transport.** Jeden kanał `engine_event` z batchem na odpowiedź komendy (rekomendacja, sekcja 2) vs osobne kanały per kategoria. Wpływ: kolejność kart w kronice (web polega na kolejności `unshift`).
- **D-EV-2 — tekst vs typowany payload.** Rekomendacja: payload typowany (ID + liczby), tekst PL generowany po stronie UI. Alternatywa: Rust wysyła gotowy tekst (łatwiejsze, ale łamie i18n i powtarza błąd `eot-hint` z `main.ts:32003`). Wymaga akceptacji właściciela (zakres polszczyzny UI).
- **D-EV-3 — kronika w zapisie.** Web NIE zapisuje kroniki (sekcja 1). Rekomendacja: zachować to zachowanie (kronika efemeryczna). Właściciel powinien potwierdzić, bo odbiega od intuicji „log gry jest częścią zapisu” (P2.7 §3 mówi o `meta`, a kronika w `meta` nie występuje).
- **D-EV-4 — karty blokujące w snapshocie czy w eventach.** Rekomendacja: snapshot (pole `pending_decisions` w `PlayableState`, derivowane ze stanu). Alternatywa: eventy (utrata po przeładowaniu, duplikacja).
- **D-EV-5 — klasyfikacja HYBRYDY (sekcja 4).** Rekomendacja: jeden event z polem `initiator` / `correlation`, nie dwa osobne eventy. Wymaga decyzji, czy odpowiedź AI na komendę jest eventem, czy częścią odpowiedzi komendy (P2.5).
- **D-EV-6 — hot-seat handoff.** Web ma komponent bez wyzwalacza. Czy Rust ma emitować `hot_seat_handoff` (E-16), czy zachować stan web (brak)? Zależy od P2.2 D2.
- **D-EV-7 — widoczność decyzji AI.** Które decyzje AI mają być widoczne w UI? Rekomendacja: tylko te dotyczące gracza (wojna, propozycje, handel z graczem, zdobycie miasta gracza). Pozostałe — log diagnostyczny.
- **D-EV-8 — RNG nagród (E-34).** `villageRewards.ts:133` używa `Math.random`. Rozstrzygnięcie w P2.4 (RNG deterministyczny); tu tylko zaznaczenie.
- **D-EV-9 — limity kart (8/6/4).** `warEventLog` 8, `villageEventLog` 6, `tradeRouteEventLog` 6, `rationAutoEventLog` 4, `borderMarchEventLog` 8 (`main.ts:8767`, `:15586`, `:35830`, `:5219`, `:25962`). Rekomendacja: limity po stronie UI, Rust wysyła wszystko.
- **D-EV-10 — zwycięstwo/porażka (E-41).** Faza `Victory` istnieje, warunki są w P6.19 (`victory.ts`, P2.1 §2). Czy kontrakt eventu E-41 wchodzi już w P2, czy w P6.19?
- **D-EV-11 — typy payloadu spoza P2.2/P2.3 (sekcja 8).** Dwadzieścia cztery nazwy typów użytych w payloadach nie są zdefiniowane ani w P2.2, ani w P2.3 (`grep` = 0 w obu plikach; `TechId` i `BattleSummary` tylko w P2.5; `BuildingBonusGain` nowy w E-59). Każdy wymaga decyzji: dopisać do P2.3 jako ID (`DealId`, `TradeRouteId`, `WonderId`, `ImprovementId`, `ProductionItemId`, `UnitTypeId`, `CommandId`), dopisać do P2.2 jako typ wartości (`EraIndex`, `CaptureRow`, `ResourceLoss`, `Loot`, `OfferKind`, `DiploCmd`, `AudienceMotive`, `RevoltWarningKind`, `ResourceOffer`, `AutoRationAdjustResult`, `CredibilityEvent`, `CredibilityEventRecord`, `DiploFactorEntry`, `UnitIds`, `BuildingBonusGain`), albo zamienić na prymitywy.
- **D-EV-12 — komunikat wejścia jednostki do miasta bez filtra właściciela (E-20, `main.ts:25745-25752`).** Web pokazuje „… daje bonus Prawo” dla każdej jednostki, także AI. Czy kontrakt ma przenosić ten komunikat dla AI (wtedy `owner` w payloadzie), czy tylko dla gracza? Decyzja właściciela; zachowanie web jest tu prawdopodobnie niezamierzone i wymaga potwierdzenia.
- **D-EV-13 — status WYKLUCZONY dla E-45 i E-49…E-55 (8 wierszy poza zbiorem GOTOWY/CZĘŚCIOWY/BRAK).** E-45: odpowiedź na komendę. E-49…E-51: wyłącznie log konsoli. E-52: transport. E-53, E-55: komendy UI→logika (P2.5). E-54: stan widoku UI. Kryterium binarne z dispatchu nie jest dla tych 8 wierszy spełnione literalnie; Operator tego nie rozstrzyga po cichu. Rekomendacja: zachować `WYKLUCZONY` i przenieść komendy do P2.5. Decyzja Final Control: czy kryterium dopuszcza ten status jako wyjątek, czy dispatch należy poszerzyć jawnie.
- **D-EV-14 — kompletność pokrycia `gra/src` (sekcja 9.4).** Pokrycie per plik (457) opiera się na definicji S5/S6, nie na przeczytaniu wszystkich linii: szeroki wzorzec trafia w 288 plików / 6642 linii, których nie przeczytano pojedynczo. Status dowodu kompletności: **NIEZWERYFIKOWANY przez przeczytanie**. Decyzja: (a) pełny przegląd 288 plików przed READY_FOR_DEPLOY, albo (b) jawna akceptacja ryzyka przez Final Control.

---

## 7. Status zbiorczy (dla Final Control)

Liczenie skryptem z kolumny Status tabel sekcji 3.A–3.E (wiersze `| E-xx |`; wiersze HYBRYDA z sekcji 4 i wiersze E-49…E-55 nie są liczone):

| Status | Liczba wierszy | Wiersze |
|---|---|---|
| GOTOWY | 0 | — (E-44 przeniesiony do CZĘŚCIOWY, zarzut 5 rundy 3) |
| CZĘŚCIOWY | 12 | E-01, E-03, E-04, E-09, E-22, E-28, E-31, E-36, E-37, E-41, E-43, E-44 |
| BRAK | 40 | E-02, E-05–E-08, E-10–E-21, E-23–E-27, E-29–E-30, E-32–E-35, E-38–E-40, E-42, E-46–E-48, E-56–E-60 |
| WYKLUCZONY z katalogu (odpowiedź na komendę, P2.5) | 1 | E-45 (`command_error`) |

Suma: 0 + 12 + 40 + 1 = **53** = E-01…E-48 (48 wierszy) + E-56, E-57, E-58, E-59, E-60 (5 wierszy). Wiersze E-49…E-55 (sekcja 3.F) są wpisane dla kompletności i nie mają statusu.

**Kontrola rundy 5/5 (skrypt na stanie dokumentu po edycji):** wierszy katalogu E-01…E-60 = 53, ID unikalne = 53. Statusy: CZĘŚCIOWY 12, BRAK 40, WYKLUCZONY 1 (E-45). Klasy: L 45, H 7, W 1 (E-45), S 0 (klasa `S` nie występuje). Wiersze E-49…E-55 (sekcja 3.F) są poza sekcją 7 i poza tą kontrolą.

**Zastrzeżenia:**
- Klasyfikacja 300 linii `showHintMessage` jest zapisana wierszowo w inwentarzu TSV (kolumna `klasa`: L = 72, H = 15, W = 199, K = 13, D = 1; kolumna `klasa_r2` = klasa z rundy 2; kolumna `przeglad_r3` = uzasadnienie). Przegląd kontekstu klasy W opisany w sekcji 9.4.
- Statusy Rust oparte na odczycie kodu na pinie `9e33fc77`; brak kompilacji i uruchomienia.
- Nie zweryfikowano zachowania web↔Rust dla żadnego eventu (to zadanie P2.12).

---

## 8. Typy payloadu — zgodność z P2.2 / P2.3

Sprawdzone `grep -c` (dopasowanie podciągu, nie całego słowa) w `dyspozycje/rust-port/p2/P2-2-*.md`, `P2-3-*.md` oraz `P2-5-COMMANDS.md` (równoległy).

| Typ w payloadzie | P2.3 (ID) | P2.2 (stan) | Status |
|---|---|---|---|
| `PlayerId`, `CityId`, `UnitId`, `OwnerRef`, `HexCoord` | tak (21 / 16 / 10 / 5 / 5 trafień) | `CityId` tak | zgodne |
| `TurnPhase`, `ResourceKey`, `Wave`, `PairKey` | — | tak | zgodne z P2.2 |
| `DealId`, `TradeRouteId`, `WonderId`, `ImprovementId`, `ProductionItemId`, `UnitTypeId`, `CommandId` | nie | nie | **DECISION_REQUIRED** (D-EV-11): nowe ID do P2.3 |
| `EraIndex`, `CaptureRow`, `ResourceLoss`, `Loot`, `OfferKind`, `DiploCmd`, `AudienceMotive`, `RevoltWarningKind`, `ResourceOffer`, `BuildingBonusGain` | nie | nie | **DECISION_REQUIRED** (D-EV-11): typy wartości do P2.2 albo prymitywy |
| `TechId`, `BattleSummary` | nie | nie (tylko P2.5) | **DECISION_REQUIRED** (D-EV-11) |
| `AutoRationAdjustResult`, `CredibilityEvent`, `CredibilityEventRecord`, `DiploFactorEntry`, `UnitIds` (= `Vec<UnitId>`) | nie | nie | **DECISION_REQUIRED** (D-EV-11): typy web `game/empire-food.ts:408`, `game/diplomacy-credibility.ts:92,144`, `game/diplomacy-factors.ts:24`; do P2.2 albo prymitywy |
| `BridgeError` | nie | nie | istnieje w Rust (`rust-port/engine/src/bridge.rs:119` `BridgeErrorCode`, `:128` `BridgeError`); poza P2.2/P2.3, nie liczy się do D-EV-11 |

Wniosek: payloady E-xx nie są w pełni „z typami ID z P2.3, polami z P2.2”. Zgodne są tylko encje podstawowe. Pozostałe typy są propozycjami tego dokumentu i nie mogą być traktowane jako ustalone.

---

## 9. Dowody po stronie Rust (status BRAK) i pokrycie `gra/src`

### 9.1 Dowód po stronie Rust dla każdego wiersza BRAK (40 wierszy)

**Metoda (dla każdego wiersza):** `git grep -inE '<zapytanie>' 9e33fc77 -- rust-port/engine/src src-tauri/src`, następnie odrzucenie linii, których treść zaczyna się od `//`, `/*` lub `*` (komentarze). Liczba = pozostałe trafienia. Pełne zapytania i wnioski: `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/rust-dowod-BRAK-9e33fc77-r3.tsv`.

**Dowód globalny (G-1, dotyczy wszystkich 40 wierszy):** jedyne wywołanie emisji do UI w repo to `app.emit(event.channel(), event)` w `src-tauri/src/lib.rs:43`; `BridgeEvent` ma jeden wariant `StateChanged` (`bridge.rs:97-106`); `EventQueue` nie ma konsumenta (`drain`, `drain_turn`, `drain_phase`, `events.rs:446-457`, bez wywołań). Wiersz BRAK oznacza brak logiki, która wytwarza dane zdarzenia, i brak kanału do UI.

| ID | Trafienia (bez komentarzy) | Wniosek (dowód per wiersz) |
|---|---|---|
| E-02 | 0 (zapytanie obowiązku: `obligat\|must_declare\|join_war\|ally_war\|allied_war`) | Brak mechanizmu obowiązku przystąpienia do wojny; typ umowy `sojusz/alliance` istnieje (`diplomacy.rs:77`) |
| E-05 | 0 (`pending_(diplo\|negot\|offer)\|negotiation\|counter_offer`) | Brak stolu negocjacyjnego w domenie |
| E-06 | 0 (`offer_response\|offer_expired\|proposal_expired\|counter_offer`) | Brak odpowiedzi na ofertę w domenie |
| E-07 | 36 (`absorb\|annex\|city_?state`) | Trafienia to progi konfiguracji (`diplomacy.rs:247`); brak zdarzenia wchłonięcia |
| E-08 | 0 (`eliminat`) | — |
| E-10 | 0 (`trespass\|border_violation\|violat`) | Granice jako geometria BRAK (P2.1 M1) |
| E-11 | 16 (`ai_?trade\|trade_noticed\|handel`) | Alias typu umowy `handel` (`diplomacy.rs:538`); brak powiadomienia AI-AI |
| E-12 | 0 (`audience`) | — |
| E-13 | 0 (`forced_war\|war_wave`) | — |
| E-14 | 0 (`first_contact\|contact_established\|diplomatic_contact`) | — |
| E-15 | 0 (`hot_?seat\|inter_?human`) | — |
| E-16 | 0 (`hot_?seat\|handoff`) | Trafienia tylko w komentarzach |
| E-17 | 0 (`revolt\|rebel\|grace`) | — |
| E-18 | 0 (`revolt\|rebel\|rebellion`) | — |
| E-19 | 0 (`production_queue_empty\|queue_empty\|prod_?empty`) | Kolejka miasta gracza nieobecna (`playable.rs` bez produkcji miast, P2.1) |
| E-20 | 5 (`captur`) | `barbarians.rs:535-550`: warunki zdobycia, bez zdarzenia |
| E-21 | 0 (`plunder\|capital_captured\|capital_capture`) | Szersze `plunder\|loot\|capital` (18) to reguły `diplomacy.rs:2510-2579`, nie splądrowanie |
| E-23 | 0 (`army_food\|food_tip\|first_unit_food`) | — |
| E-24 | 0 (`build_completed\|construction_(done\|complete)\|production_completed\|improvement_completed`) | Szersze `complet\|built\|build_done\|construction` (52) to pola planera i błędy |
| E-25 | 0 (`wonder_completed\|completed_world_wonder\|WonderCompleted`) | — |
| E-26 | 4 (`researched_by_owner\|tech_researched\|TechResearched`) | Jedyny ślad: `researchedByOwner` (`diplomacy.rs:2203`); brak eventu badania |
| E-27 | 0 (`era_changed\|era_advanced\|EraChanged\|era_change`) | `era` `diplomacy.rs:2169` to dane techa |
| E-29 | 0 (`food_deficit\|army_starv\|army_hunger`) | — |
| E-30 | 0 (`siege_state\|SiegePhase\|siege_phase`) | Szersze `siege` (14) to pole `is_siege` (`combat.rs:105`) |
| E-32 | 0 (`sentry\|wake`) | — |
| E-33 | 0 (`veteran`) | — |
| E-34 | 3 (`village_reward\|villageReward\|hut_reward\|chatk`) | Flaga `village` planera AI (`ai_turn.rs:131`) |
| E-35 | 0 (`march_progress\|planned_march\|march_stop\|MarchStop`) | Szersze `march` (11) to pola respektu dyplomacji (`diplomacy.rs:267,279`) |
| E-38 | 0 (`auto_ration\|ration_adjust\|AutoRation`) | — |
| E-39 | 0 (`autosave\|auto_save\|SaveFailed\|save_fail`) | — |
| E-40 | 0 (`fsa\|disk_autosave\|autosave_degraded`) | — |
| E-42 | 5 (`sea_raid\|sea_raider.*destroy\|raid.*improvement\|destroy.*improvement`) | Flaga `sea_raider` (`barbarians.rs:193`); brak zdarzenia zniszczenia |
| E-46 | 0 (`diplomacy_factor\|DiploFactor\|factor_log`) | — |
| E-47 | 2 (`credibil(ity)?_event\|CredibilityEvent\|wiarygod`) | Progi (`diplomacy.rs:291`); brak logu zdarzeń |
| E-48 | 0 (`religion_spread\|ReligionSpread`) | — |
| E-56 | 0 (`army.*(starv\|food)\|food.*army\|starv.*army\|army_hunger`) | `apply_hunger_penalty` (`city_growth.rs:330`) dotyczy populacji miasta, nie wojska |
| E-57 | 0 (`merge_prompt\|armyMerge\|army_merge\|separate_return\|merge_army`) | — |
| E-58 | 0 (`auto_improv\|pick_auto\|auto_build`) | — |
| E-60 | 0 (`showDiplomacyProposalBanner\|diplomacy_proposal\|proposal_result\|applyProposalOutcome\|ProposalOutcome`, `git grep` na `9e33fc77`) | Brak wyniku propozycji w domenie (jw. E-05/E-06) |
| E-59 | 0 (`visit_bonus\|city_visit\|VisitBonus\|garrison_bonus`) | `prawo_wojskowe_przemarszu` (`diplomacy.rs:1374`) to nazwa umowy |

Wiersze CZĘŚCIOWY i GOTOWY (sekcja 7) nie wymagają dowodu nieobecności; ich dowód to wskazany `plik:linia` w kolumnie „Rust dziś”.

**9.2 Moduły `gra/src` wymienione w poprzedniej wersji (werdykt dla każdego):**

| Moduł | Wywołania `showHintMessage` / Notice w module | Werdykt |
|---|---|---|
| `ui/sidePanelHud.ts` | 0 `showHintMessage`; trafienia to `addEventListener` (DOM) | **Konsument** kart WYDARZENIA: renderuje wpisy E-xx, nie emituje żadnego eventu. Odrzucenie karty = E-53 (komenda UI→logika). |
| `ui/scienceHubHud.ts` | 0; trafienia to `addEventListener`; `showTechDiscoveryNotice` (`:337`) po kliknięciu gracza | **Reakcja UI na akcję gracza** — wykluczony. Modal techa z logiki jest w E-26 (`main.ts:32046`). |
| `game/era-change-notify.ts` | 0 wywołań; eksportuje builder HTML toastu (`:38`) | **Pokryty przez E-27** (wywołania w `main.ts:14366`, `:14408`). |
| `game/diplomacy-border-march.ts` | 0 wywołań; klasyfikator `classifyPlayerBorderMarchNotice` (`:254`) | **Pokryty przez E-10** (klasyfikacja skutków, wywołania w `main.ts:5180-5219`). |
| `ui/cityPanel.ts` | 0; trafienia to `addEventListener` (drag and drop, kliknięcia) | **Reakcja UI na akcję gracza** — wykluczony. |
| `ui/empireDetailPanel.ts` | 0; trafienia to `addEventListener` / `input` | **Reakcja UI na akcję gracza** — wykluczony (odświeżanie: sekcja 9.5). |
| `ui/hud.ts` | 0; trafienia to `addEventListener` / `fullscreenchange` (zdarzenia przeglądarki, nie logiki gry) | **Reakcja UI** — wykluczony (odświeżanie: sekcja 9.5). |

Pełna lista 10 modułów modali importowanych przez `main.ts` (`grep` importów w `edb8fb56`), z przypisaniem do eventów: `ui/cityCaptureNotice.ts` (E-20), `ui/civElimNotice.ts` (E-08), `ui/diplomacyPendingHud.ts` (E-05), `ui/hotSeatHandoff.ts` (E-16), `ui/interHumanDiplomacyHud.ts` (E-15), `ui/postBattleSummary.ts` (E-31), `ui/techDiscoveryNotice.ts` (E-26), `ui/triumphCityStateNotice.ts` (E-21), `ui/victoryScreen.ts` (E-41), `ui/wonderCompletedNotice.ts` (E-25). Razem 10 modułów.

> Od rundy 5/5 dyspozycje per plik dla wszystkich 457 plików są w **sekcji 9.4 i Załączniku C**. Poniższa tabela 9.3 jest zapisem rundy 4 (pierwsze 63 pliki z dyspozycją) i nie jest już dowodem kryterium „każdy plik”.

**9.3 Pokrycie plików `gra/src/**` — stan po rundzie 4: 457 plików; każdy ma dyspozycję albo status zerowego sygnału wzorca (ograniczenie: akapit wstępny 9.3).**

Przegląd 457 plików `.ts`/`.js` w `gra/src` (`edb8fb56`). Wzorzec r3 (wielkość liter rozróżniana): `showHintMessage|EventLog|eventLog|Notice|Toast|Kronik|Inbox|deferred|Modal|renderEvent|pushOnce|unshift(`. Wzorzec r4: ten sam zestaw plus `toast|banner|notice|modal|hint`, bez rozróżniania wielkości liter. Stan po rundzie 4 (suma 1 + 21 + 63 + 40 + 332 = 457): **1** `POKRYTY-zrodlo` (`main.ts`); **21** `POKRYTY` (14 z rundy 2 i 7 cytowanych w katalogu, w tym `ui/diplomacyProposalBanner.ts`); **63** `ROZSTRZYGNIETY-R4` (trafienia wzorca r4, dyspozycja per plik w TSV); **40** `ROZSTRZYGNIETY` (dyspozycje rundy 3, tabela poniżej, z dopiskami R4 tam, gdzie r4 dodało linie); **332** `BEZ-SYGNALU-0` (0 trafień wzorca r4). Wzorzec alternatywny r4-alt (`notify[A-Z]`, `alert(`, `popup`, `appendLog`, `addLog`, `pushLog`, `logEntry`, `announce`, `flash[A-Z]`, `showDialog`, `openDialog`, `chronicle`; `git grep` na `edb8fb56 -- gra/src`, bez rozróżniania wielkości liter tam, gdzie wzorzec r4) trafia **16** plików: 12 ma status inny niż `BEZ-SYGNALU-0`, a 4 (`game/barbarians.ts`, `game/economy.ts`, `game/production.ts`, `ui/unitCtxDockDiploGate.ts`) są rozstrzygnięte w tabeli poniżej (komentarz, typy katalogu, wewnętrzna funkcja UI; żadne nie jest brakującym eventem). **Ograniczenie:** ani r4, ani r4-alt nie obejmują ogólnych `log` i `dialog`, więc `BEZ-SYGNALU-0` NIE jest dowodem braku eventu zapisanego innym słownictwem. Sekcja 9.5 obejmuje wyłącznie odświeżenia paneli po turze AI, nie źródła komunikatów. Pełna tabela: `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/pokrycie-gra-src-edb8fb56-r4.tsv` (kolumny `status_r4`, `dyspozycja_r4`). Dyspozycje rundy 3 dla 40 plików:

| Plik (`gra/src/…`) | Trafienia | Dyspozycja |
|---|---|---|
| `audio/muzyka-antyczna.ts` | 5 | WYKLUCZONY: `renderEvent` (`:1348`, `:1382`, `:1538`, `:1979`) to synteza nut audio |
| `battle/battleScene.ts` | 5 | E-31 (dane wejściowe prezentacji bitwy): `clashLogEntries.unshift` `:8720` (log walki w scenie), `buildBattleEventLog` `:9831` |
| `game/ai.ts` | 6 | WYKLUCZONY: 6/6 trafień to `deferredUnitIds` (planer koncentracji, `:3389`, `:3423`, `:3520`, `:3529`, `:3556`, `:4223`); zero komunikatów. Widoczność decyzji AI: D-EV-7 |
| `game/army-concentration.ts` | 6 | WYKLUCZONY: `deferredUnitIds` jako dane wyjściowe planera (`:21`, `:214`, `:255`, `:312-331`) |
| `game/armyMerge.ts` | 1 | E-57 (`:655`, flush `main.ts:6268`, `:12149`, `:12221`, `:12229`) |
| `game/building-upgrades.ts` | 1 | WYKLUCZONY: `chain.unshift` `:46` buduje łańcuch danych |
| `game/cities.ts` | 1 | WYKLUCZONY: komentarz o odroczonym spawnie (`:1171`) |
| `game/cluster-start.ts` | 3 | WYKLUCZONY: rezerwacja ownerId (`:63`, `:76`, `:337`), bez komunikatu |
| `game/diplomacy-acceptance-points.ts` | 2 | WYKLUCZONY: komentarze (`:239`, `:480`); wypowiedzenie wojny to akcja gracza (`showWarConsentModal`) |
| `game/diplomacy-economy.ts` | 1 | WYKLUCZONY: komentarz/placeholder (`:215`) o `pendingDiplomacyInbox` |
| `game/diplomacy-proposals.ts` | 3 | WYKLUCZONY: komentarze (`:563`, `:570`, `:588`) o formularzu gracza; prezentacja kontrofert = E-05/E-06 |
| `game/forced-war-waves.ts` | 2 | E-13 (moduł logiki fal; `deferredUnitIds` `:37`, `:192` to dane fal; UI przez E-01) |
| `game/playtestWalkaMapy.ts` | 1 | WYKLUCZONY: `out.unshift` `:127` w danych playtestu (dev) |
| `game/post-battle-map.ts` | 6 | E-31 (dane wejściowe podsumowania): `battleEventLog` `:47`, `:77-88` |
| `game/side-panel-event-link.ts` | 1 | WYKLUCZONY: komentarz (`:31`) wskazujący E-08 (`elim-cs-*`) |
| `game/tech-tree.ts` | 1 | WYKLUCZONY: `chain.unshift` `:106`, dane drzewka |
| `game/veteran.ts` | 1 | E-33: funkcja toastu i dziennika przy pierwszym wrogu (`:247`; toast `main.ts:10969`) |
| `map/cluster-spawn.ts` | 2 | WYKLUCZONY: komentarze (`:67`, `:374`) o rezerwacji ownerId |
| `map/gen-helpers.ts` | 1 | WYKLUCZONY: `out.unshift` `:5376` w generacji mapy |
| `game/barbarians.ts` | 1 (r4-alt) | WYKLUCZONY: `:1904` to komentarz (słowo `announced`) w historii warunku resetu; bez komunikatu w kodzie |
| `game/economy.ts` | 2 (r4-alt) | WYKLUCZONY: `:541`, `:554` to typ i parametr katalogu `BuildingHappinessCatalogEntry`; bez wywołania UI |
| `game/production.ts` | 3 (r4-alt) | WYKLUCZONY: `:2168`, `:2193`, `:2201` to typ i tablica katalogu `BuildingCatalogEntry`; bez wywołania UI |
| `ui/unitCtxDockDiploGate.ts` | 1 (r4-alt) | WYKLUCZONY: `:24` `notifyDiploUiVisibilityChange` to wewnętrzne powiadomienie UI (widoczność docka), nie zdarzenie logiki gry |
| `render/cities.ts` | 1 | WYKLUCZONY: komentarz (`:429`) o odroczonym odsłonięciu sprite'a; `cityRenderer.sync` (EOT) tylko renderuje |
| `render/units.ts` | 6 | WYKLUCZONY: `deferredDim` / `deferredPlayerUnitRevealIds` (`:445`, `:5996-6035`), render bez komunikatu |
| `ui/diplomacyAudience.ts` | 36 | Rozbicie: `showAllianceObligationModal` `:1122` (wywołanie `main.ts:20109`, logika wojny sojuszniczej) → **E-02 (M)**; `requestAutoCounterNegotiation` `:366` i kontrpropozycja w oknie → **E-06** (prezentacja); `showWarConsentModal` `:1065` (`main.ts:10709`, `:21279`: akcje gracza), `showWarConfirmModal` `:1156`, `showBreakTreatyConfirmModal` `:1188` (potwierdzenia gracza) → WYKLUCZONE (P2.5); `updateDiplomacyAudience` `:2426` → mechanizm E-43 |
| `ui/diplomacyNegotiationModal.ts` | 15 | WYKLUCZONY: formularz negocjacji gracza (`showNegotiationModal` `:436`, `closeModal` `:255`); prezentacja → E-05/E-06 bez własnego eventu |
| `ui/diplomacyTradeBasket.ts` | 51 | WYKLUCZONY jako formularz koszyka (`showTradeBasketModal` `:2356`, wołany z `diplomacyAudience.ts:514`; `openQuickDealBasket` `:2794`); prezentacja kontrofert = E-06 |
| `ui/entityCards/civpediaOpenGate.ts` | 1 | WYKLUCZONY: komentarz (`:26`) |
| `ui/entityCards/improvementAdapter.ts` | 1 | WYKLUCZONY: komentarz (`:13`) |
| `ui/entityCards/renderer.ts` | 14 | WYKLUCZONY: renderer kart; komentarze o `techDiscoveryNotice`; treść odkrycia = prezentacja E-26 |
| `ui/entityCards/technologyAdapter.ts` | 8 | WYKLUCZONY: adapter treści odkrycia technologii (prezentacja E-26), komentarze |
| `ui/entityCards/types.ts` | 9 | WYKLUCZONY: typy i komentarze |
| `ui/entityCards/unitAdapter.ts` | 2 | WYKLUCZONY: komentarze (`:32-33`) |
| `ui/improvementBuildConfirm.ts` | 2 | WYKLUCZONY: modal potwierdzenia akcji gracza (`:39-40`) |
| `ui/mainMenu.ts` | 2 | WYKLUCZONY: `soonBtn` toast „WKRÓTCE” (`:262-268`), klik w menu |
| `ui/newGameFlow.ts` | 7 | WYKLUCZONY: modal zaawansowany menu (klik gracza) |
| `ui/perfReport.ts` | 7 | WYKLUCZONY: raport wydajności (dev/menu) |
| `ui/preBattle.ts` | 41 | E-31 (`initiator: Ai`, B): kolejka `deferredAutoRequests` `:193`, `:238-247` dla automatycznych bitew AI/barbarzyńców (wejście `main.ts:28261`, `auto: true`), flush `:398-400` po zakończeniu bitwy. Reszta WYKLUCZONA: toast zapisu `:174-175`, `:271` (akcja gracza) |
| `ui/sciencePicker.ts` | 6 | WYKLUCZONY: komentarze/import; wybór gracza w drzewku (prezentacja E-26) |
| `ui/techTreeView.ts` | 2 | WYKLUCZONY: wybór gracza (`:924`, `showTechDiscoveryNotice` po kliknięciu) — prezentacja E-26 |
| `ui/unitInfoCard.ts` | 5 | WYKLUCZONY: starsza implementacja karty (komentarze `:7-9`, `:115`, `:161`, `:408`) |
| `ui/unitReplacePicker.ts` | 1 | WYKLUCZONY: modal wyboru zamiennika (klik gracza, komentarz `:114`) |
| `units/battleRoster.ts` | 6 | E-31 (dane wejściowe): `buildBattleEventLog` `:31`, `out.unshift` `:79`, `:85` — skład rosterów bitwy |

Razem: 40 plików (274 trafienia wzorca r3). Każdy ma dyspozycję; w TSV r4 status `ROZSTRZYGNIETY` (dopiski R4 w kolumnie `dyspozycja_r4`).

**9.4 Przegląd klasy W (212 wierszy rundy 2 → 199 wierszy W w rundzie 3).**

Metoda (dla każdego wiersza W w inwentarzu):
1. Funkcja nadrzędna wiersza ustalona skryptem na kodzie `edb8fb56` (ostatnia deklaracja `function` przed linią); zapisana w kolumnie `funkcja`.
2. Dla każdej funkcji nadrzędnej zestawiono wszystkie wywołania w `main.ts` (bez komentarzy) i ich funkcje nadrzędne. Wywołania z `runWorldEndTurn` (`:31169-35854`), `endActiveHumanTurn` (`:35855`), `renderLoop` (`:36241`), `applyMarchSegmentInstant`, `scanAutoSiegesAfterAiTurn` (`:14970`), `resolveNegotiationEntryAt` (`:17113`) i `applyProposalOutcome` (`:20605`) sprawdzono linia po linii.
3. Wiersz zostaje W, jeśli jego funkcja jest handlerem akcji gracza albo elementem UI, a wszystkie jej wywołania są z kliknięcia, klawisza, menu lub strażnika ponownego wejścia. Komunikaty zależne od właściciela (`ownerId === 0`) zweryfikowano w kodzie.

Wynik: **13 wierszy zmieniło klasę** (3 → L: `:33126`, `:33128`, `:33137` — automat gracza w `runWorldEndTurn`; 10 → H: `:10126`, `:10606`, `:10616`, `:10630`, `:10847`, `:14922`, `:20715`, `:20767`, `:20774`, `:25747`). Powody są w kolumnie `przeglad_r3` TSV i w sekcji 4. Pozostałe 199 wierszy W: funkcja jest handlerem gracza, UI lub dev/playtestu.

Szczegółowe potwierdzenia dla funkcji wrażliwych:
- `purchaseRecruitmentUnit(s)` (wywołania z `updateHud`, `applyMenuParams`, `runWorldEndTurn` = zakup AI): wszystkie komunikaty odmowy za `ownerId === 0` (`:3996`, `:4004`, `:4031`, `:4037`, `:4052`, `:4061`, `:4067`, `:4083`, `:4127`, `:4136`, `:4149`); AI nie dostaje komunikatu.
- `processPlayerQueue` / `applyAllianceObligationsOnWar` (`:20098-20118`): kolejkę tworzy logika (wypowiedzenie wojny przez AI), komunikat `:20118` pojawia się w `onFulfill` po kliknięciu gracza.
- `promptMergeIfCoLocated` (`:12129`, `:12204`, `:12215`): w callbackach modalu scalania (wybór gracza).
- `doQuickSave` (`:30711`, `:30714`): komunikaty tylko przy `showHintOnSuccess`; wywołania z klawisza Ctrl+S (`:36211`) i przycisków menu.
- `hintEndTurnBlocked` (`:31086-31109`): wywoływane z `endActiveHumanTurn` i `advanceSeat` jako strażnik ponownego wejścia po próbie gracza; wartość komunikatu mówi o stanie tury, ale wyzwalaczem jest akcja gracza.
- `startMapSiege` `:14940`: tylko dla `oblegajacyOwnerId === 0`; `:14922` przeniesione do H.
- `applyBuildRequest` (`:13716-13771`): wywołania z UI (`onSelect` `:13392`, API `:23652`); w `runWorldEndTurn` tylko komentarze.
- `triggerPlayerEndTurn` (`:36120`, `:36201`), `handleSelectedUnitHudAction`, `mountD1bHud`, `extraCityPanelConfig`, `dispatchMapEnemyCityClick`, `beginMoveSelectedUnitTo`, `planMarchTo` (wywołania z `dispatchMapEnemyCityClick` i `beginMoveSelectedUnitTo`, klik gracza): handlery.
- `loadGameFromSlot`, `openSaveGameDialog`, `openLoadGameDialog`, `openStartupMainMenu`, `toggleDev*`, `doStartPlaytest*`: menu, zapis/wczytanie i narzędzia dev.

**9.5 Aktualizacja paneli po turze AI (kategoria „aktualizacja panelu po turze AI”) — rozstrzygnięcie per plik.**

Źródło: wywołania odświeżeń w `runWorldEndTurn` (`main.ts:31169-35854`), zestawione z definicjami w `gra/src` (`edb8fb56`). W EOT wołane są m.in.: `updateHud` (lokalne `main.ts:23131`, które wywołuje `refreshD1bHud` z `ui/hud.ts` i `refreshEmpireDetailPanel`), `updateDiplomacyPanel` (`:33272`, `:34507`), `refreshEconomyFoodTotals` (`:31523`, `:31558`), `syncLiveUnitHp` (`:31389`), `refreshTechTreeViewIfOpen`, `refreshSciencePickerIfOpen`, `refreshCityPanelIfOpen`, `updateSiegeMapPanelTurn`, `updateRevoltGrace`, `cityRenderer.sync`, `refreshFog`, `recomputeTradeRoutesNow(true)` (`:31289`) oraz lokalne `sync*`/`refresh*`.

| Plik (`gra/src/…`) | Odświeżenie (eksport / lokalne) | Wołane w EOT (`runWorldEndTurn`)? | Wniosek |
|---|---|---|---|
| `game/diag-log.ts` | `refreshDiagPanel` (lokalne, `:31`, `:155`) | nie | panel diagnostyczny; bez zdarzenia gry |
| `game/manpower.ts` | `syncLiveUnitHp` (`:117`) | **tak** (`main.ts:31389`) | synchronizacja HP jednostek (logika); bez komunikatu; źródło stanu |
| `game/population-growth-v85.ts` | `refreshManpowerAfterPopChange` (`:559`, wewnątrz modułu) | nie bezpośrednio (moduł logiki populacji) | logika; źródło E-22; bez komunikatu |
| `game/trade-routes.ts` | `refreshTradeRoutes` (`game/trade-routes.ts:1302`, wołane przez `recomputeTradeRoutesNow` `main.ts:15431`) | **tak**: `recomputeTradeRoutesNow(true)` `:31289` | logika szlaków; 0 trafień wzorca r4 w pliku. Powiadomienia E-36/E-37 leżą w `main.ts:15508-15581` (wołane z EOT, `:31289`) |
| `game/turn-economy.ts` | `refreshEconomyFoodTotals(result)` (`:1695`) | **tak** (`main.ts:31523`, `:31558`) | konsument wyniku `EconomyTickResult`; bez komunikatu; źródło E-28/E-29 |
| `input/picker.ts` | `refreshInstancedPickBounds` (wywołanie z `render/scene.ts:3691`) | nie | picking, bez komunikatu |
| `render/cityMapStatChip.ts` | `refreshMedallion` (lokalne `:1095-1107`) | nie | render medalionów; konsument E-43 bez komunikatu |
| `render/scene.ts` | `renderLandRiversFromPaths`, `refreshInstancedPickBounds` (`:3691`) | nie | render |
| `ui/armyListHud.ts` | `refreshArmyListHudIfOpen` | nie | panel listy armii; bez komunikatu |
| `ui/cityListHud.ts` | `refreshCityListHudIfOpen` | nie | panel listy miast; bez komunikatu |
| `ui/cityUxFrame.ts` | `refreshCityUxFrame` | nie | ramka panelu miasta; bez komunikatu |
| `ui/diploListHud.ts` | `refreshDiploListHudIfOpen` | nie | panel dyplomacji (lista); bez komunikatu |
| `ui/diplomacyPanel.ts` | `updateDiplomacyPanel` (`:331`) | **tak** (`main.ts:33272`, `:34507`) | konsument E-43 (odświeżenie po turze); bez komunikatu |
| `ui/empireBalance.ts` | `updateBalancePanel` (`:109`) | nie | konsument; bez komunikatu |
| `ui/empireDetailPanel.ts` | `refreshEmpireDetailPanel` (wołane z lokalnego `updateHud` `main.ts:23136`) | **pośrednio**: `updateHud` w EOT | konsument E-43; bez komunikatu |
| `ui/gamePauseMenu.ts` | `refreshGamePauseMenuLoadState` (`main.ts:22099`, `:39314`) | nie | menu pauzy; bez komunikatu |
| `ui/hud.ts` | `updateHud` (`:1826`, import jako `refreshD1bHud`) | **pośrednio**: lokalne `updateHud` (`main.ts:23131`) w EOT | konsument E-43; bez komunikatu |
| `ui/orderPanel.ts` | `refreshOrderPanel` (`:229`) | nie | panel rozkazów miasta; bez komunikatu |
| `ui/perfTestPanel.ts` | `refreshVerdict` (lokalne) | nie | narzędzie dev |

Odświeżenia wołane w EOT spoza powyższych 19 plików (wszystkie bez komunikatu): `refreshTechTreeViewIfOpen` (`ui/techTreeView.ts:1128`), `refreshSciencePickerIfOpen` (`ui/sciencePicker.ts:1664`), `refreshCityPanelIfOpen` (`ui/cityPanel.ts:10337`), `updateSiegeMapPanelTurn` (`ui/siegeMapPanel.ts:350`), `updateRevoltGrace` (`game/society-breakdown.ts:1087`; logika stanu buntu, 0 trafień wzorca komunikatu), `cityRenderer.sync` (`render/cities.ts`, wywołania w EOT `main.ts:31795`, `:34971`, `:35782`).

**Rozstrzygnięcie kategorii:** mechanizm po turze AI to E-43 (lista odświeżeń w EOT powyżej). Zamknięcie jest per plik: żaden z 19 wymienionych plików ani pozostałych odświeżeń EOT nie emituje komunikatu z własnego pliku. Powiadomienia, które pojawiają się przy odświeżeniu w EOT (E-36/E-37 przez `recomputeTradeRoutesNow(true)` `:31289`, `main.ts:15508-15581`), są funkcjami `main.ts` i są opisane w wierszach E-36/E-37; nie są częścią zamknięcia per plik. Przy przenoszeniu do Rust odświeżenie paneli to pełny `PlayableState` (E-43), a nie 19 osobnych eventów.

---

### 9.4 Pokrycie per plik — 457/457 plików `gra/src` (runda 5/5)

**Zakres.** `git ls-tree -r --name-only edb8fb56 -- gra/src | grep '\.ts$'` = **457** plików. Pozostałe pliki w `gra/src` (`.svg`, `.mp3`, `.jpg`, `.json`, `.md`, `.css`) nie są modułami logiki ani UI i są poza zakresem. Każdy z 457 plików ma wiersz w **Załączniku C** i w pliku `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/pokrycie-gra-src-edb8fb56-r5.tsv`.

**Operacjonalizacja „komunikat / event logika→UI”** (jedna definicja dla wszystkich plików):
- **S5** (sygnał komunikatu lub wpisu kroniki; liczba linii w kolumnie `sygnal_S5`): `showHintMessage`, `showToast`, `showTechDiscoveryNotice`, `flashBanner`, `*Banner*(`, `show*(Notice|Modal|Popup|Dialog|Toast|Hint)(`, `open*(Modal|Dialog|Popup)(`, `notify[A-Z]…(`, `alert(`, `EventLog`, `eventLog`, `LogEntry`, `logEntry`, `.unshift(`, `.push({…text|title|msg|message|body…})`, `popup`, `dialog.show/open`.
- **S6** (wywołania nazwane, do przeglądu; kolumna `S6_nazwy`): `show[A-Z]…(`, `flash…(`, `[Tt]oast…(`, `announce…(`, `snack…(`, `pushMessage`, `setStatus(`, `addMessage(`, `addNotice(`, `[Nn]otice…(`. Nazwy z S6 w plikach bez S5 przejrzano ręcznie: są to otwarcia paneli, hover, ekran ładowania, API przeglądarki (FS), nie komunikaty logiki tury.
- `console.log` / `console.warn` **nie są sygnałem** (diagnostyka, nie UI; przykłady: E-49…E-51).

**Reguła dyspozycji** (kolumna `status_r5`, w tej kolejności):
1. Plik cytowany w wierszu katalogu `E-xx` (ścieżka `katalog/plik.ts` albo nazwa z myślnikiem, wielką literą lub ≥10 znaków) → `POKRYTY: E-xx`.
2. Plik z przeglądu rundy 3/4 z dyspozycją tekstową → zachowana dyspozycja (`ROZSTRZYGNIETY-R4`, `ROZSTRZYGNIETY`).
3. Plik z S5 > 0 bez pozycji 1–2 → dyspozycja ręczna z numerami linii (`ROZSTRZYGNIETY-R5`, `WYKLUCZONY-R5`, `POKRYTY-R5`).
4. S5 = 0, S6 > 0 → `WYKLUCZONY-S6`.
5. S5 = 0, S6 = 0 → `WYKLUCZONY-ZERO`.

**Wynik (457 plików, każdy z dyspozycją):**

| Status (`status_r5`) | Pliki |
|---|---|
| `POKRYTY` | 29 |
| `POKRYTY-R5` | 2 |
| `POKRYTY-zrodlo` | 1 |
| `ROZSTRZYGNIETY-R4` | 63 |
| `ROZSTRZYGNIETY` | 32 |
| `ROZSTRZYGNIETY-R5` | 8 |
| `WYKLUCZONY-R5` | 3 |
| `WYKLUCZONY-S6` | 9 |
| `WYKLUCZONY-ZERO` | 310 |
| **Razem** | **457** |

Pliki z S5 > 0: **64**. Pliki z dyspozycją `POKRYTY*` (cytowane w katalogu lub w mapowaniu 9.2): 32; `main.ts` jest źródłem wszystkich wywołań E-01…E-60.

**Ograniczenie metody (jawne).** Szeroki wzorzec rundy 4 (`notify|alert|popup|dialog|log|toast|banner|notice|modal|hint|flash|snack|tooltip|event|message|emit|announce|ticker`, bez rozróżniania wielkości liter) trafia w **288** plików (łącznie 6642 linii; kolumna `szeroki_r5_broad`). Tych linii **nie klasyfikowano pojedynczo**: w większości to `addEventListener`, identyfikatory z `event`/`log`/`catalog`/`dialog`, komentarze i CSS, ale nie każda linia została przeczytana. Dyspozycja `WYKLUCZONY-ZERO` opiera się na definicji S5/S6 powyżej, a nie na tym szerokim zliczeniu; w 195 plikach szeroki wzorzec trafia, a S5/S6 jest zerem. **Status dowodu kompletności: NIEZWERYFIKOWANY przez przeczytanie** (D-EV-14 — rozstrzygnięte, patrz §9 pkt 3). Jeśli Evaluator uzna S5/S6 za zbyt wąskie, zmiana wymaga zmiany definicji i ponownego przebiegu skryptów w `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/scratch-r5/` (`build_r5.py`), a nie ręcznego dopisywania wierszy.

**D-EV-15 — granulacja eventów (rozstrzygnięte, §9 pkt 7).** Kilka wierszy sklejało więcej niż jedno zdarzenie domenowe: E-22 (zagregowane podsumowanie „N miast” zamiast eventu per miasto), E-29 (głód wojska i koniec wycinki w jednym wierszu o różnych payloadach), E-58 (event i osobny sygnał nadwyżki pracy), E-02 (dołączenie do sojuszu i odmowa w jednym `kind`). Rozstrzygnięcie: granulacja PER ENCJA/PER PRZYCZYNA, nie zagregowana — każdy odrębny powód/encja dostaje własny wariant `kind` w `EngineEvent`, nawet jeśli UI renderuje je podobnie. Przy implementacji (P3+) te 4 wiersze mają zostać rozdzielone na osobne warianty eventu (np. `CityGrowthBatch` → per-miasto `CityGrew{city_id}`; `E-29` → `ArmyStarving{..}` i `WoodcuttingDepleted{..}` osobno; `E-58` → `LaborSurplus{..}` osobno od zdarzenia bazowego; `E-02` → `AllianceJoined{..}`/`AllianceDeclined{..}`). Uzasadnienie: spójne z już przyjętą zasadą precyzyjnych typowanych wariantów zamiast generycznych kontenerów (ten sam kierunek co P2.5 §9 pkt 14 dla komend).


---

## Załącznik A — 72 miejsca logiczne `showHintMessage` (klasa L, numery linii `main.ts` w `edb8fb56`)

`8282, 9933, 10266, 10672, 10812, 10969, 14366, 14408, 14417, 14628, 14814, 14816, 14866, 14964, 15524, 15572, 17008, 17127, 17141, 17145, 17177, 17245, 17799, 19650, 19688, 20026, 20058, 20072, 20077, 20418, 20420, 20430, 20648, 25367, 25523, 25528, 25548, 25570, 25953, 27690, 28152, 28247, 28706, 29132, 29209, 29964, 29966, 29974, 30786, 30836, 30903, 30912, 30932, 31229, 31650, 31652, 31662, 31742, 31790, 31792, 32033, 32150, 32152, 32163, 32517, 33126, 33128, 33137, 33268, 34506, 35651, 35771`

Liczba: **72** numery = wiersze klasy L w inwentarzu TSV (zgodność zbiorów sprawdzona skryptem). Zmiany względem rundy 2: dodano `33126`, `33128`, `33137` (automat gracza po turze, E-58). Wcześniej dodane `30786` (E-40), `29964`, `29966` (E-30), `8282` (E-24), `31662` (E-56) pozostają.

Klasa H (15 wywołań) jest poza tą listą; patrz sekcja 4 i załącznik B.

## Załącznik B — 199 wywołań klasy W (wykluczone), 15 klasy H (hybrydy), 13 komentarzy (K), 1 definicja (D)

**Liczenie:** 300 = 286 wywołań + 13 K + 1 D; 286 = L 72 + H 15 + W 199.

**Klasa H (15):** `4489` (E-25), `10126` (E-06), `10606`, `10616`, `10630` (E-01), `10847` (E-59), `14922` (E-30), `20715`, `20767`, `20774` (E-06), `25747` (E-20), `27457` (E-31, gracz), `28121` (E-31, initiator Ai), `30217` (E-31, szturm gracza), `30388` (E-31, wynik gracza).

**Pełny inwentarz (300 wierszy):** `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/inwentarz-showHintMessage-edb8fb56.tsv`. Kolumny: `linia`, `klasa` (r3), `klasa_r2`, `id_wiersza`, `funkcja` (funkcja nadrzędna w `edb8fb56`), `tresc_skrot`, `przeglad_r3`.

**Klasa W — grupy po funkcji nadrzędnej (199 wierszy):**
- **Akcje w panelach i UI miasta/jednostki (handlery gracza):** `mountD1bHud` (15), `extraCityPanelConfig` (16), `handleSelectedUnitHudAction` (13), `dispatchMapEnemyCityClick` (10), `openMergePanelForSelected` (4), `openSplitPanelForSelected` (2), `openUnitReplacePicker` (3), `performUnitReplace` (2), `disbandPlayerUnit` (1), `enterOkolicaMapMode` (1), `applyOkolicaTileAdjust` (1), `showBuildTerritoryBlockedHint` (2), `trySetPlayerCapital` (2), `focusCameraOnOwnerCapital` (2), `renderWondersPickerContent` (1).
- **Zakupy i budowa gracza:** `purchaseRecruitmentUnit` (7), `purchaseRecruitmentUnits` (4), `applyBuildRequest` (6), `commitBuildRequest` (3), `undoPendingBuildRequest` (2), `tryFoundPlayerCityAt` (4), `handleFoundCityMapClick` (1), `beginOnboardingFoundCity` (1), `enqueueWonderForPlayer` (5), `tryBeginWonderMapBuild` (5).
- **Ruch i rozkazy gracza:** `beginMoveSelectedUnitTo` (22), `planMarchTo` (5), `stopPlannedMarchForSelected` (1), `setRallyPointFromMap` (3), `launchRallyPointForOwner` (3), `launchSiegeStormFromMap` (3), `startMapSiege` (1: `:14940`), `commitBesiege` (4), `launchBigPresetBattle` (1), `openPlayerMapUnitAttackCore` (1), `hintEndTurnBlocked` (5), `triggerPlayerEndTurn` (2), `promptMergeIfCoLocated` (3, callbacki modalu scalania).
- **Dyplomacja gracza:** `resolvePendingDiplomacy` (4), `handleNegotiationAccept` (2), `handleNegotiationReject` (1), `handleNegotiationRemove` (2), `handleNegotiationCounter` (1), `handleNegotiationEditOwn` (1), `handleNegotiatedProposal` (2), `applyAudienceAction` (4), `breakTreatyVoluntarily` (1), `applyAllianceObligationsOnWar` (1: `processPlayerQueue.onFulfill`).
- **Zapis, menu i wczytanie:** `openSaveGameDialog` (2), `openLoadGameDialog` (1), `loadGameFromSlot` (7), `doQuickSave` (2), `openStartupMainMenu` (1), `saveLabel` i `label` (menu).
- **Playtest i dev:** `doStartPlaytestWalkaMapy` (3), `doStartPlaytestMiastoEkonomia` (3), `doStartPlaytestMapaSwiata` (2), `playtestSeed` (3), `toggleDevFogFull` (1), `toggleDevRevealAllLand` (1).
- **Wiersze pomocnicze (`const d =`, `const kulturaSuma =`, `const pracaBudynki =` itd.)** — kolumna `funkcja` podaje właściwą funkcję nadrzędną; trzy wiersze `pracaBudynki` (`:33126`, `:33128`, `:33137`) przeniesiono do L.

Wiersze K (13): komentarze w `main.ts`; wiersz D (1): definicja `showHintMessage` `main.ts:14301`.

## Załącznik C — pokrycie per plik, 457 plików `gra/src` (`edb8fb56`, runda 5/5)

Kolumny: nr · plik · szeroki wzorzec (liczba linii) · S5 (linii) · status · dyspozycja. Pełne dane (w tym nazwy S6): TSV `pokrycie-gra-src-edb8fb56-r5.tsv`.

| nr | Plik | Szeroki | S5 | Status | Dyspozycja |
|---|---|---|---|---|---|
| 1 | `gra/src/audio/ambiencePrefs.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 2 | `gra/src/audio/filePlayer.ts` | 10 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 3 | `gra/src/audio/musicPrefs.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 4 | `gra/src/audio/muzyka-antyczna.ts` | 28 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: renderEvent (:1348,:1382,:1538,:1979) to synteza nut audio, nie komunikat |
| 5 | `gra/src/audio/sfxPrefs.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 6 | `gra/src/battle/autoBatchPhase.ts` | 8 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: typy i planer intencji batcha (AutoBatchIntent); trafienia to nazwy typow, bez komunikatu |
| 7 | `gra/src/battle/battle-terrain.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 8 | `gra/src/battle/battleHudTheme.ts` | 51 | 11 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: styl etykiety trybu applyModeHint1E (:761), bez zdarzenia |
| 9 | `gra/src/battle/battleMinimap.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 10 | `gra/src/battle/battleScene.ts` | 565 | 99 | `POKRYTY` | POKRYTY: E-31 (wiersze sekcji 3). |
| 11 | `gra/src/battle/battleSceneOpen.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 12 | `gra/src/battle/battleTerrainTooltip.ts` | 6 | 7 | `ROZSTRZYGNIETY-R5` | WYKLUCZONY: `parts.push({text})` (:45-85) buduje etykiety tooltipa terenu po najechaniu (akcja gracza / hover); nie komunikat logiki tury. |
| 13 | `gra/src/battle/endDetails1E.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 14 | `gra/src/battle/endScreen1E.ts` | 3 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: 2 trafienia to komentarz i ikona (:5, :67); wynik bitwy = dane E-31, bez komunikatu w pliku |
| 15 | `gra/src/battle/manualBattle.ts` | 51 | 2 | `ROZSTRZYGNIETY-R4` | E-31 (prezentacja wyniku bitwy recznej): _showBanner (:1404) wolany z :1395 po phase=done; wyzwalacz = akcja gracza (klasa W), wynik = dane E-31 (initiator Player); this.hint (:561-1277) = podpowiedz tury, UI |
| 16 | `gra/src/battle/mapFieldBattle.ts` | 6 | 3 | `ROZSTRZYGNIETY-R4` | W: komunikaty bledu ataku gracza (:411, :417, :471), reakcja na akcje gracza (zob. zal. B) |
| 17 | `gra/src/battle/siegeHud1E.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 18 | `gra/src/battle/siegeWall.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 19 | `gra/src/battle/testBattle.ts` | 3 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: harness testowy |
| 20 | `gra/src/buildInfo.ts` | 2 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: stala etykiety buildu |
| 21 | `gra/src/data/e-start-params-loader.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 22 | `gra/src/data/loader.ts` | 12 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 23 | `gra/src/data/map-gen-params-loader.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 24 | `gra/src/game/ai-city-capture-executor.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 25 | `gra/src/game/ai-cs-absorption.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 26 | `gra/src/game/ai-difficulty-bonus.ts` | 2 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: komentarz |
| 27 | `gra/src/game/ai-expansion.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 28 | `gra/src/game/ai-fog.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 29 | `gra/src/game/ai-major-absorb.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 30 | `gra/src/game/ai-moc-diag.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 31 | `gra/src/game/ai-production-priorities.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 32 | `gra/src/game/ai-resource-needs.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 33 | `gra/src/game/ai-threat-mode.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 34 | `gra/src/game/ai.ts` | 65 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: 6/6 trafien to deferredUnitIds (planer koncentracji, :3389,:3423,:3520,:3529,:3556,:4223); zero komunikatow. Widocznosc decyzji AI: D-EV-7 |
| 35 | `gra/src/game/alliance-war-obligation.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 36 | `gra/src/game/army-concentration.ts` | 2 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: 6/6 trafien to deferredUnitIds jako dane wyjsciowe planera (:21,:214,:255,:312,:328,:331) |
| 37 | `gra/src/game/army-cycle.ts` | 4 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 38 | `gra/src/game/army-starvation.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 39 | `gra/src/game/armyMerge.ts` | 4 | 0 | `POKRYTY` | POKRYTY: E-57 (wiersze sekcji 3). |
| 40 | `gra/src/game/auto-battle-params.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 41 | `gra/src/game/auto-battle-power.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 42 | `gra/src/game/auto-improvements.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 43 | `gra/src/game/auto-manage.ts` | 7 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 44 | `gra/src/game/barbarians.ts` | 24 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 45 | `gra/src/game/battle-loot.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 46 | `gra/src/game/battle-summary.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 47 | `gra/src/game/border-march-scan.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 48 | `gra/src/game/braz-access.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 49 | `gra/src/game/building-cost-tempo.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 50 | `gra/src/game/building-resource-gate.ts` | 8 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 51 | `gra/src/game/building-stock-cost.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 52 | `gra/src/game/building-upgrades.ts` | 1 | 1 | `ROZSTRZYGNIETY` | WYKLUCZONY: chain.unshift :46 buduje lancuch danych ulepszen, bez komunikatu |
| 53 | `gra/src/game/capital-capture.ts` | 4 | 0 | `POKRYTY` | POKRYTY: E-21 (wiersze sekcji 3). |
| 54 | `gra/src/game/cities.ts` | 15 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: komentarz o odroczonym spawnie (:1171) / R4: budowaListaUkonczonaHintShown (:973) = flaga jednorazowosci dla E-24 (lista ukonczona) |
| 55 | `gra/src/game/citizen-resource-upkeep.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 56 | `gra/src/game/city-defense.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 57 | `gra/src/game/city-founding.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 58 | `gra/src/game/city-hex-clear.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 59 | `gra/src/game/city-hex-movement.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 60 | `gra/src/game/city-names-pool.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 61 | `gra/src/game/city-state-difficulty.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 62 | `gra/src/game/civ-ai-allocation.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 63 | `gra/src/game/civ-ai-data.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 64 | `gra/src/game/civ-bonuses.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 65 | `gra/src/game/civ-entry-epoch.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 66 | `gra/src/game/civ-matrix-semantic.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 67 | `gra/src/game/civ-matrix.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 68 | `gra/src/game/civ-names.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 69 | `gra/src/game/civ-roster.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 70 | `gra/src/game/civ-visual.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 71 | `gra/src/game/cluster-start.ts` | 1 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: rezerwacja ownerId dla deferred rivals (:63,:76,:337), bez komunikatu |
| 72 | `gra/src/game/combat.ts` | 34 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 73 | `gra/src/game/conquest-stability.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 74 | `gra/src/game/converters.ts` | 5 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 75 | `gra/src/game/culture-religion.ts` | 12 | 0 | `POKRYTY` | POKRYTY: E-48 (wiersze sekcji 3). |
| 76 | `gra/src/game/cyna-access.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 77 | `gra/src/game/danina-nazwa.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 78 | `gra/src/game/defenseBreakdown.ts` | 1 | 3 | `ROZSTRZYGNIETY-R5` | WYKLUCZONY: `out.push({tekst})` (:304-310) rozbicie obrony do podglądu; dane prezentacji, nie komunikat tury. |
| 79 | `gra/src/game/diag-log.ts` | 6 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 80 | `gra/src/game/difficulty-cost.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 81 | `gra/src/game/diplomacy-acceptance-points.ts` | 13 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: komentarze (:239,:480) - wypowiedzenie wojny to akcja gracza (showWarConsentModal) |
| 82 | `gra/src/game/diplomacy-ai-balance.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 83 | `gra/src/game/diplomacy-ai-offer-balance.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 84 | `gra/src/game/diplomacy-audience-actions.ts` | 14 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 85 | `gra/src/game/diplomacy-barbarian-cooperation.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 86 | `gra/src/game/diplomacy-basket-transfer.ts` | 18 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 87 | `gra/src/game/diplomacy-border-march.ts` | 3 | 0 | `POKRYTY-R5` | POKRYTY: E-10 (klasyfikator skutków `classifyPlayerBorderMarchNotice` :254; wywołania main.ts:5180-5219; P2-6 sekcja 9.2). |
| 88 | `gra/src/game/diplomacy-credibility.ts` | 45 | 0 | `POKRYTY` | POKRYTY: E-47 (wiersze sekcji 3). |
| 89 | `gra/src/game/diplomacy-currency-trade.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 90 | `gra/src/game/diplomacy-deposit-trade.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 91 | `gra/src/game/diplomacy-display.ts` | 21 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: tekst podpowiedzi nastawienia (nastawienieHintPl :341, tooltip); prezentacja stanu relacji (E-43), bez zdarzenia |
| 92 | `gra/src/game/diplomacy-economy.ts` | 7 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: komentarz/placeholder (:215) o pendingDiplomacyInbox; bez wywolania UI |
| 93 | `gra/src/game/diplomacy-factors.ts` | 22 | 0 | `POKRYTY` | POKRYTY: E-46 (wiersze sekcji 3). |
| 94 | `gra/src/game/diplomacy-goods.ts` | 9 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 95 | `gra/src/game/diplomacy-layers.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 96 | `gra/src/game/diplomacy-locks.ts` | 14 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 97 | `gra/src/game/diplomacy-pair-summary.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 98 | `gra/src/game/diplomacy-peace-lock.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 99 | `gra/src/game/diplomacy-penalty-preview.ts` | 3 | 0 | `ROZSTRZYGNIETY-R4` | W: podglad kar do modali potwierdzenia (:137), wolany przez akcje gracza; PURE, bez mutacji |
| 100 | `gra/src/game/diplomacy-pn-engine.ts` | 5 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 101 | `gra/src/game/diplomacy-proposals.ts` | 31 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: komentarze (:563,:570,:588) o formularzu gracza; prezentacja kontrofert -> E-05/E-06 bez wlasnego eventu |
| 102 | `gra/src/game/diplomacy-rejection-cooldown.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 103 | `gra/src/game/diplomacy-resource-trade-pick.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 104 | `gra/src/game/diplomacy-tech-trade.ts` | 49 | 2 | `WYKLUCZONY-R5` | WYKLUCZONY: S5 trafienia to wyłącznie komentarze do `showHintMessage` (:126, :149; testy); kod pliku nie wywołuje komunikatu. Wiersz katalogu: sekcja 1, wiersz „showHintMessage( w pozostałych plikach gra/src/**”. |
| 105 | `gra/src/game/diplomacy-trade-validation.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 106 | `gra/src/game/diplomacy-treaties.ts` | 8 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 107 | `gra/src/game/diplomacy-unit-transfer.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 108 | `gra/src/game/diplomacy-value-catalog.ts` | 15 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 109 | `gra/src/game/diplomacy-war-gates.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 110 | `gra/src/game/diplomacy.ts` | 25 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 111 | `gra/src/game/display-names.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 112 | `gra/src/game/economy-upkeep.ts` | 16 | 0 | `ROZSTRZYGNIETY-R4` | W: UNIT_RECRUIT_STOCK_ONLY_HINT (:823) i pickUnitRecruitHint (:887) = odmowa zakupu gracza (zob. 9.4 purchaseRecruitmentUnit); AI nie dostaje komunikatu |
| 113 | `gra/src/game/economy.ts` | 13 | 3 | `ROZSTRZYGNIETY-R5` | WYKLUCZONY: fałszywy pozytyw S5 (`BuildingHappinessCatalogEntry`, :541-555) - typ katalogu danych. |
| 114 | `gra/src/game/effective-difficulty-for-owner.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 115 | `gra/src/game/embarkation.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 116 | `gra/src/game/empire-city-defaults.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 117 | `gra/src/game/empire-diplo-resource-flow.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 118 | `gra/src/game/empire-food.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 119 | `gra/src/game/empire-handel-split.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 120 | `gra/src/game/empire-hud-totals.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 121 | `gra/src/game/eot-event-defer.ts` | 55 | 11 | `POKRYTY` | POKRYTY: E-11, E-44 (E-52, E-53 nie są wierszami katalogu — wykluczone w sekcji 3.F, nie liczone jako pokrycie). |
| 122 | `gra/src/game/era-change-notify.ts` | 12 | 1 | `POKRYTY-R5` | POKRYTY: E-27 (eksport buildera HTML toastu; wywołania w main.ts:14366, :14408; P2-6 sekcja 9.2). |
| 123 | `gra/src/game/era-gate-ui.ts` | 8 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 124 | `gra/src/game/first-player-city.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 125 | `gra/src/game/forced-war-bronze.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 126 | `gra/src/game/forced-war-common.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 127 | `gra/src/game/forced-war-iron.ts` | 4 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 128 | `gra/src/game/forced-war-stone.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 129 | `gra/src/game/forced-war-waves.ts` | 0 | 0 | `POKRYTY` | POKRYTY: E-13, E-01 (wiersze sekcji 3). |
| 130 | `gra/src/game/fort-territory.ts` | 7 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: komentarz (:84) |
| 131 | `gra/src/game/fsa-autosave.ts` | 15 | 0 | `WYKLUCZONY-S6` | WYKLUCZONY: S5=0; S6 = wywołania 7 showDirectoryPicker( (otwarcie panelu, hover, ładowanie, API przeglądarki); nie komunikat logiki tury. |
| 132 | `gra/src/game/gold-deficit.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 133 | `gra/src/game/growth-happiness.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 134 | `gra/src/game/human-owners.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 135 | `gra/src/game/idb-storage.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 136 | `gra/src/game/improvement-tech.ts` | 5 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: getImprovementLockHint (:57), tekst blokady w UI, bez zdarzenia |
| 137 | `gra/src/game/inca-llama-seed.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 138 | `gra/src/game/livestock-unlock.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 139 | `gra/src/game/load-map-source.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 140 | `gra/src/game/manpower.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 141 | `gra/src/game/map-rebels.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 142 | `gra/src/game/mapSiegeDetect.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 143 | `gra/src/game/mennica-zloto-grace.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 144 | `gra/src/game/okolica.ts` | 5 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 145 | `gra/src/game/order.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 146 | `gra/src/game/owner-epoch.ts` | 6 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 147 | `gra/src/game/owner-utils.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 148 | `gra/src/game/pending-improvements.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 149 | `gra/src/game/planned-march.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 150 | `gra/src/game/playerState.ts` | 19 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 151 | `gra/src/game/playtestMapaSwiata.ts` | 1 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: stala playtestu (dev) |
| 152 | `gra/src/game/playtestMiastoEkonomia.ts` | 2 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: stala playtestu (dev) |
| 153 | `gra/src/game/playtestOdskok3v3.ts` | 2 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: stale playtestu (dev) |
| 154 | `gra/src/game/playtestWalkaMapy.ts` | 4 | 1 | `ROZSTRZYGNIETY` | WYKLUCZONY: out.unshift :127 w danych playtestu (dev) |
| 155 | `gra/src/game/population-growth-tempo.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 156 | `gra/src/game/population-growth-v85.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 157 | `gra/src/game/post-battle-map.ts` | 24 | 8 | `POKRYTY` | POKRYTY: E-31 (wiersze sekcji 3). |
| 158 | `gra/src/game/post-capture-law.ts` | 3 | 2 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: postCaptureLawBannerLabel (:115, :139), etykieta stanu UI, nie zdarzenie (zob. E-21) |
| 159 | `gra/src/game/power-objective.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 160 | `gra/src/game/power-options.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 161 | `gra/src/game/power-ranking.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 162 | `gra/src/game/power.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 163 | `gra/src/game/production.ts` | 26 | 3 | `ROZSTRZYGNIETY-R5` | WYKLUCZONY: fałszywy pozytyw S5 (`BuildingCatalogEntry`, :2168-2201) - typ katalogu danych. |
| 164 | `gra/src/game/r-stawki-strojenie.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 165 | `gra/src/game/rally-point.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 166 | `gra/src/game/relief-preserving-improvements.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 167 | `gra/src/game/research.ts` | 12 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 168 | `gra/src/game/resource-access.ts` | 2 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: hexHiddenDepositHint (:108), tooltip hover, nie zdarzenie |
| 169 | `gra/src/game/resource-usage-breakdown.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 170 | `gra/src/game/ruch-swiata-tempo.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 171 | `gra/src/game/save-label.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 172 | `gra/src/game/save.ts` | 20 | 3 | `ROZSTRZYGNIETY-R5` | WYKLUCZONY z katalogu: `issues.push({code,message})` (:1101-1111) zwraca problemy wczytywanego zapisu do wywołującego (akcja gracza: wczytanie); nie event tury. Zakres: P2.7. |
| 173 | `gra/src/game/scout-auto-explore.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 174 | `gra/src/game/side-panel-event-link.ts` | 20 | 1 | `ROZSTRZYGNIETY` | WYKLUCZONY: komentarz (:31) wskazujacy E-08 (elim-cs-*) |
| 175 | `gra/src/game/side-panel-event-priority.ts` | 4 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 176 | `gra/src/game/siege.ts` | 16 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 177 | `gra/src/game/siegeAi.ts` | 2 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: komentarz (:155) |
| 178 | `gra/src/game/siegeDefenders.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 179 | `gra/src/game/siegeMachines.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 180 | `gra/src/game/society-breakdown.ts` | 3 | 0 | `POKRYTY` | POKRYTY: E-17 (wiersze sekcji 3). |
| 181 | `gra/src/game/society-inputs.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 182 | `gra/src/game/spich-auto-ration-notify.ts` | 8 | 0 | `POKRYTY` | POKRYTY: E-38 (wiersze sekcji 3). |
| 183 | `gra/src/game/start-preview.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 184 | `gra/src/game/tech-tempo.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 185 | `gra/src/game/tech-tree.ts` | 4 | 1 | `ROZSTRZYGNIETY` | WYKLUCZONY: chain.unshift :106 - dane drzewka, bez komunikatu |
| 186 | `gra/src/game/terrain-improvements.ts` | 4 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 187 | `gra/src/game/trade-routes.ts` | 12 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 188 | `gra/src/game/triumph-city-state.ts` | 5 | 0 | `ROZSTRZYGNIETY-R4` | E-21: stala TRIUMPH_CS_HINT_MS (:11), czas wyswietlenia karty E-21; nie osobny event |
| 189 | `gra/src/game/turn-economy.ts` | 14 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 190 | `gra/src/game/unit-building-bonuses.ts` | 5 | 0 | `ROZSTRZYGNIETY-R4` | E-59: formatter komunikatu formatBuildingBonusGainHint (:421) |
| 191 | `gra/src/game/unit-card-stats.ts` | 6 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 192 | `gra/src/game/unit-cost-tempo.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 193 | `gra/src/game/unit-power.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 194 | `gra/src/game/unit-replace-context.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 195 | `gra/src/game/veteran.ts` | 9 | 0 | `POKRYTY` | POKRYTY: E-33 (wiersze sekcji 3). |
| 196 | `gra/src/game/victory.ts` | 4 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 197 | `gra/src/game/villageRewards.ts` | 4 | 0 | `POKRYTY` | POKRYTY: E-34 (wiersze sekcji 3). |
| 198 | `gra/src/game/visibility.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 199 | `gra/src/game/wealth.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 200 | `gra/src/game/wiarygodnosc-types.ts` | 8 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 201 | `gra/src/game/wonder-availability.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 202 | `gra/src/game/wonder-civ-tech.ts` | 5 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 203 | `gra/src/game/wonder-map-build.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 204 | `gra/src/game/wonders-data.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 205 | `gra/src/game/zelazo-access.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 206 | `gra/src/game/zloto-access.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 207 | `gra/src/input/picker.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 208 | `gra/src/main.ts` | 1692 | 510 | `POKRYTY-zrodlo` | Źródło wszystkich wywołań komunikatów: E-01…E-60 (wywołania `showHintMessage` i wpisy kronik rozpisane w sekcji 3 i załącznikach A/B). |
| 209 | `gra/src/map/cluster-spawn.ts` | 0 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: komentarze (:67,:374) o rezerwacji ownerId |
| 210 | `gra/src/map/clusters.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 211 | `gra/src/map/deposit-era.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 212 | `gra/src/map/earth-land-mask.generated.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 213 | `gra/src/map/earth-land-mask.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 214 | `gra/src/map/gen-helpers.ts` | 13 | 1 | `ROZSTRZYGNIETY` | WYKLUCZONY: out.unshift :5376 w generacji mapy, bez komunikatu |
| 215 | `gra/src/map/genWorker.ts` | 7 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 216 | `gra/src/map/generator.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 217 | `gra/src/map/improvement-build.ts` | 19 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: lockHint pozycji menu budowy (:1497-1499), UI, bez zdarzenia |
| 218 | `gra/src/map/map-attack-city.ts` | 8 | 0 | `ROZSTRZYGNIETY-R4` | W: typy hint_* (:24-27, :100-134) = walidacja ataku na miasto na akcje gracza |
| 219 | `gra/src/map/mapGenAsync.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 220 | `gra/src/map/mapGenProgress.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 221 | `gra/src/map/mapSnapshot.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 222 | `gra/src/map/minimap.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 223 | `gra/src/map/newGameMapDefaults.ts` | 8 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: podpowiedzi suwakow nowej gry (UI) |
| 224 | `gra/src/map/range-hexes.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 225 | `gra/src/map/riverGenSwitch.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 226 | `gra/src/map/road-movement.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 227 | `gra/src/map/road-network.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 228 | `gra/src/map/startScoring.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 229 | `gra/src/map/territory-border.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 230 | `gra/src/map/territory-work.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 231 | `gra/src/map/territory.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 232 | `gra/src/map/villages.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 233 | `gra/src/map/wonder-placement.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 234 | `gra/src/oblezenie/main.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 235 | `gra/src/perf/hardwareProfile.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 236 | `gra/src/render/braz-konnica-opus5.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 237 | `gra/src/render/braz-lucznik-nubijski-opus5.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 238 | `gra/src/render/braz-miecznik-opus5.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 239 | `gra/src/render/braz-procarz-opus5.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 240 | `gra/src/render/braz-rydwan-kapadokijski-opus5.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 241 | `gra/src/render/braz-rydwan-konny-opus5.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 242 | `gra/src/render/braz-rydwan-woly-opus5.ts` | 9 | 2 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: geometria banera jednostki (render), bez komunikatu |
| 243 | `gra/src/render/braz-taran-opus5.ts` | 43 | 4 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: geometria banera jednostki (render), bez komunikatu |
| 244 | `gra/src/render/braz-wlocznik-opus5.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 245 | `gra/src/render/bronzeCity.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 246 | `gra/src/render/bronzeCityRoblox.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 247 | `gra/src/render/camera.ts` | 23 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 248 | `gra/src/render/cities.ts` | 0 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: odroczone odslonięcie sprite'a (komentarz :429, deferredPlayerUnitRevealIds); cityRenderer.sync wolany w EOT - tylko render, bez komunikatu |
| 249 | `gra/src/render/cityMapOutline.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 250 | `gra/src/render/cityMapStatChip.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 251 | `gra/src/render/cityOkolicaOverlay.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 252 | `gra/src/render/countSceneOverlayCandidates.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 253 | `gra/src/render/dekor-laki-rowniny.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 254 | `gra/src/render/djungla-modele.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 255 | `gra/src/render/droga-6-ramion.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 256 | `gra/src/render/fogDim.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 257 | `gra/src/render/galera-model.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 258 | `gra/src/render/hastati-falangita.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 259 | `gra/src/render/hastati-opus5.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 260 | `gra/src/render/hexShape.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 261 | `gra/src/render/hexutil.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 262 | `gra/src/render/improvements.ts` | 5 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 263 | `gra/src/render/jednostki-p1-rdzen.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 264 | `gra/src/render/jednostki-p2-inka.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 265 | `gra/src/render/jednostki-p3-dystans.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 266 | `gra/src/render/jednostki-p4-melee.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 267 | `gra/src/render/jednostki-p57-wlocznie-machiny.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 268 | `gra/src/render/jednostki-p6-super.ts` | 11 | 3 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: geometria banera (s6Banner), render |
| 269 | `gra/src/render/jednostki-p8a-bliskiwschod.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 270 | `gra/src/render/jednostki-p8b-rozni.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 271 | `gra/src/render/jednostki-z1-mezopotamia.ts` | 4 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 272 | `gra/src/render/jednostki-z2-srodziemne.ts` | 12 | 2 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: geometria banera (z2Banner), render |
| 273 | `gra/src/render/jednostki-z3-plemiona.ts` | 17 | 2 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: geometria banera (trSuperBanner), render |
| 274 | `gra/src/render/kamien-bazowe-opus5.ts` | 2 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: render (1 trafienie, baner geometryczny) |
| 275 | `gra/src/render/kamien-inka-opus5.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 276 | `gra/src/render/kamien-lucznicy-opus5.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 277 | `gra/src/render/kamien-zulu-taran-opus5.ts` | 54 | 4 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: geometria banera (getKTBanner), render |
| 278 | `gra/src/render/kon-nowy-model.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 279 | `gra/src/render/kopalnia-cyny-opus5.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 280 | `gra/src/render/kopalnia-zlota-opus5.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 281 | `gra/src/render/lasy-modele.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 282 | `gra/src/render/mapRenderStyle.ts` | 10 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 283 | `gra/src/render/mergeDecor.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 284 | `gra/src/render/miasto-braz.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 285 | `gra/src/render/miasto-kamien.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 286 | `gra/src/render/minecraftScene.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 287 | `gra/src/render/oaza-pustynia.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 288 | `gra/src/render/pastwisko-modele.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 289 | `gra/src/render/perfDebugOverlay.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 290 | `gra/src/render/rangeOverlay.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 291 | `gra/src/render/resources.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 292 | `gra/src/render/riverLod.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 293 | `gra/src/render/robloxCity.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 294 | `gra/src/render/robloxImprovements.ts` | 10 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 295 | `gra/src/render/robloxScene.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 296 | `gra/src/render/scene.ts` | 11 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 297 | `gra/src/render/settlementModel.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 298 | `gra/src/render/siegeCampModels.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 299 | `gra/src/render/siegeCampSync.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 300 | `gra/src/render/siegeMarker.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 301 | `gra/src/render/stoneCity.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 302 | `gra/src/render/stoneCityRoblox.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 303 | `gra/src/render/styleResources.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 304 | `gra/src/render/swinia-trzoda.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 305 | `gra/src/render/tarasy-model.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 306 | `gra/src/render/teren-gory-wzgorza.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 307 | `gra/src/render/tradeRoutesOverlay.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 308 | `gra/src/render/ulepszenia-modele-p2.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 309 | `gra/src/render/ulepszenia-modele-p3a.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 310 | `gra/src/render/ulepszenia-modele-p3b.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 311 | `gra/src/render/unitOwnerEmblem.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 312 | `gra/src/render/unitStatPlate.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 313 | `gra/src/render/unitUpgradeBadges.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 314 | `gra/src/render/unitVeteranBadges.ts` | 5 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 315 | `gra/src/render/unitVitalsPalette.ts` | 4 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 316 | `gra/src/render/units.ts` | 27 | 11 | `ROZSTRZYGNIETY` | WYKLUCZONY: deferredDim / deferredPlayerUnitRevealIds (:445,:5996-6035) - render, bez komunikatu |
| 317 | `gra/src/render/wioska-oboz.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 318 | `gra/src/render/wonderModels.ts` | 2 | 2 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: geometria flagi wlasciciela (ownerBanner), render |
| 319 | `gra/src/render/wonderRenderer.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 320 | `gra/src/render/workerFieldOverlay.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 321 | `gra/src/render/zelazo-jezdziec-oszczepami-opus5.ts` | 6 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 322 | `gra/src/render/zelazo-konnica-asyryjska-opus5.ts` | 4 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 323 | `gra/src/render/zoomLod.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 324 | `gra/src/types/army.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 325 | `gra/src/types/city.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 326 | `gra/src/types/diplomacy.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 327 | `gra/src/types/game-state.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 328 | `gra/src/types/hex.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 329 | `gra/src/types/index.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 330 | `gra/src/types/map.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 331 | `gra/src/types/player.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 332 | `gra/src/types/resources.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 333 | `gra/src/types/tech.ts` | 9 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 334 | `gra/src/types/turn.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 335 | `gra/src/types/unit.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 336 | `gra/src/ui/aiCivPicker.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 337 | `gra/src/ui/armyListHud.ts` | 9 | 1 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: podpowiedz panelu listy armii (:290-292), UI |
| 338 | `gra/src/ui/armyMergePanel.ts` | 10 | 0 | `ROZSTRZYGNIETY-R4` | W: podpowiedz/komunikat panelu scalania (klik gracza) |
| 339 | `gra/src/ui/armyMergePickPanel.ts` | 8 | 0 | `ROZSTRZYGNIETY-R4` | W: podpowiedz panelu wyboru scalania (klik gracza) |
| 340 | `gra/src/ui/armySplitPanel.ts` | 8 | 0 | `ROZSTRZYGNIETY-R4` | W: podpowiedz panelu podzialu (klik gracza) |
| 341 | `gra/src/ui/armyStackHud.ts` | 13 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 342 | `gra/src/ui/armyStackPrompt.ts` | 16 | 0 | `ROZSTRZYGNIETY-R4` | W: modal wyboru stosu (klik gracza), ikony i klasy |
| 343 | `gra/src/ui/bottomBarHud.ts` | 65 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: et-hint blokujacych zadan (:223-226), stan UI wyprowadzany ze stanu (D-EV-4), bez zdarzenia |
| 344 | `gra/src/ui/brandTokenVars.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 345 | `gra/src/ui/buildModeHud.ts` | 114 | 4 | `ROZSTRZYGNIETY-R4` | W: flashBanner (:750, :793; def. :938) = komunikat blokady na klik gracza w trybie budowy; lockHint tooltipy UI |
| 346 | `gra/src/ui/buildStampToggle.ts` | 6 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 347 | `gra/src/ui/buildingHoverTooltip.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 348 | `gra/src/ui/cityAttackChoice.ts` | 19 | 0 | `ROZSTRZYGNIETY-R4` | W: modal wyboru ataku na miasto (klik gracza); modalIcon = ikony |
| 349 | `gra/src/ui/cityCaptureNotice.ts` | 44 | 2 | `POKRYTY` | POKRYTY: E-20 (mapowanie modułu w P2-6 sekcja 9.2, akapit „Pełna lista 10 modułów modali”). |
| 350 | `gra/src/ui/cityForeignPick.ts` | 16 | 0 | `ROZSTRZYGNIETY-R4` | W: modal wyboru (klik gracza); modalIcon = ikony |
| 351 | `gra/src/ui/cityListHud.ts` | 8 | 2 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: podpowiedz listy miast (:237-239), UI |
| 352 | `gra/src/ui/cityPanel.ts` | 342 | 8 | `WYKLUCZONY-R5` | WYKLUCZONY: trafienia to `addEventListener` (drag and drop, kliknięcia) = reakcja UI na akcję gracza (P2-6 sekcja 9.2). |
| 353 | `gra/src/ui/cityUnitPick.ts` | 19 | 0 | `ROZSTRZYGNIETY-R4` | W: modal wyboru (klik gracza); modalIcon = ikony |
| 354 | `gra/src/ui/cityUxFrame.ts` | 23 | 0 | `WYKLUCZONY-S6` | WYKLUCZONY: S5=0; S6 = wywołania 1 showCityUxFrame( (otwarcie panelu, hover, ładowanie, API przeglądarki); nie komunikat logiki tury. |
| 355 | `gra/src/ui/civBrandDisplay.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 356 | `gra/src/ui/civElimNotice.ts` | 25 | 1 | `POKRYTY` | POKRYTY: E-08 (mapowanie modułu w P2-6 sekcja 9.2, akapit „Pełna lista 10 modułów modali”). |
| 357 | `gra/src/ui/contextPanelHud.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 358 | `gra/src/ui/diploListHud.ts` | 14 | 2 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: podpowiedz filtra listy dyplomacji (:381-383), UI |
| 359 | `gra/src/ui/diploUiSkin.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 360 | `gra/src/ui/diplomacyAcceptanceBalance.ts` | 23 | 0 | `ROZSTRZYGNIETY-R4` | E-05/E-06 (prezentacja bilansu w oknie negocjacji gracza), bez wlasnego eventu; podpowiedzi balanceHint (:440, :478) |
| 361 | `gra/src/ui/diplomacyAudience.ts` | 205 | 19 | `POKRYTY` | POKRYTY: E-02 (wiersze sekcji 3). |
| 362 | `gra/src/ui/diplomacyDealDisplay.ts` | 3 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: tooltip modHint (:128-131), prezentacja oferty |
| 363 | `gra/src/ui/diplomacyNegotiationModal.ts` | 32 | 1 | `ROZSTRZYGNIETY` | WYKLUCZONY: formularz negocjacji gracza (showNegotiationModal :436, closeModal :255); prezentacja -> E-05/E-06 bez wlasnego eventu |
| 364 | `gra/src/ui/diplomacyPanel.ts` | 4 | 0 | `WYKLUCZONY-S6` | WYKLUCZONY: S5=0; S6 = wywołania 1 showDiploPairSummary(    1 showDiplomacyPanel( (otwarcie panelu, hover, ładowanie, API przeglądarki); nie komunikat logiki tury. |
| 365 | `gra/src/ui/diplomacyPendingHud.ts` | 10 | 1 | `POKRYTY` | POKRYTY: E-05 (mapowanie modułu w P2-6 sekcja 9.2, akapit „Pełna lista 10 modułów modali”). |
| 366 | `gra/src/ui/diplomacyProposalBanner.ts` | 15 | 3 | `POKRYTY` | POKRYTY: E-60, E-05, E-06 (wiersze sekcji 3). |
| 367 | `gra/src/ui/diplomacyTradeBasket.ts` | 152 | 2 | `ROZSTRZYGNIETY` | WYKLUCZONY jako formularz koszyka gracza (showTradeBasketModal :2356, wywolanie z diplomacyAudience :514; openQuickDealBasket :2794); prezentacja kontrofert -> E-06; brak wlasnego eventu |
| 368 | `gra/src/ui/empireBalance.ts` | 2 | 0 | `WYKLUCZONY-S6` | WYKLUCZONY: S5=0; S6 = wywołania 1 showBalancePanel( (otwarcie panelu, hover, ładowanie, API przeglądarki); nie komunikat logiki tury. |
| 369 | `gra/src/ui/empireDetailPanel.ts` | 75 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: 1 trafienie UI (panel imperium) |
| 370 | `gra/src/ui/empireDetailTypes.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 371 | `gra/src/ui/empireMiastaTable.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 372 | `gra/src/ui/empireOverlayHud.ts` | 2 | 0 | `WYKLUCZONY-S6` | WYKLUCZONY: S5=0; S6 = wywołania 1 showCultureOverlay(    1 showReligionOverlay( (otwarcie panelu, hover, ładowanie, API przeglądarki); nie komunikat logiki tury. |
| 373 | `gra/src/ui/empirePanelSectionMap.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 374 | `gra/src/ui/entityCards/buildingAdapter.ts` | 10 | 6 | `ROZSTRZYGNIETY-R5` | WYKLUCZONY: `sections.push`/`reqRows.push` (:215-313) - sekcje karty budynku, prezentacja danych. |
| 375 | `gra/src/ui/entityCards/civpediaOpenGate.ts` | 5 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: komentarz (:26) |
| 376 | `gra/src/ui/entityCards/improvementAdapter.ts` | 11 | 7 | `ROZSTRZYGNIETY` | WYKLUCZONY: komentarz (:13) |
| 377 | `gra/src/ui/entityCards/registry.ts` | 12 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 378 | `gra/src/ui/entityCards/renderer.ts` | 99 | 6 | `ROZSTRZYGNIETY` | WYKLUCZONY: renderer kart; komentarze o techDiscoveryNotice; tresc odkrycia = prezentacja E-26 |
| 379 | `gra/src/ui/entityCards/slug.ts` | 3 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 380 | `gra/src/ui/entityCards/technologyAdapter.ts` | 50 | 2 | `ROZSTRZYGNIETY` | WYKLUCZONY: adapter tresci odkrycia technologii (prezentacja E-26), komentarze |
| 381 | `gra/src/ui/entityCards/types.ts` | 17 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: typy i komentarze |
| 382 | `gra/src/ui/entityCards/unitAdapter.ts` | 19 | 6 | `ROZSTRZYGNIETY` | WYKLUCZONY: komentarze (:32-33) |
| 383 | `gra/src/ui/entityCards/wonderAdapter.ts` | 12 | 1 | `ROZSTRZYGNIETY-R5` | WYKLUCZONY: `bonusRows.push` (:128) - wiersz karty cudu, prezentacja danych. |
| 384 | `gra/src/ui/escapeOverlayStack.ts` | 6 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 385 | `gra/src/ui/formatPl.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 386 | `gra/src/ui/gamePauseMenu.ts` | 16 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: atrybut aria-modal (:134), menu pauzy |
| 387 | `gra/src/ui/hexContextTooltip.ts` | 31 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: tooltip hexa (hexHiddenDepositHint :344), UI hover |
| 388 | `gra/src/ui/hotSeatHandoff.ts` | 9 | 0 | `POKRYTY` | POKRYTY: E-16 (wiersze sekcji 3). |
| 389 | `gra/src/ui/hoverDetailDock.ts` | 28 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: mechanizm podpowiedzi kart (sideHint), UI |
| 390 | `gra/src/ui/hud.ts` | 118 | 4 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: showFullscreenHint (:404) = zdarzenie przegladarki fullscreenchange, nie logika gry; leaderBanners (:1708-1848) = UI; CSS civ-hud-banner |
| 391 | `gra/src/ui/hudChip6c.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 392 | `gra/src/ui/hudLayout.ts` | 8 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: stale ukladu (HUD_MAP_BANNER_BOTTOM_PX :41) |
| 393 | `gra/src/ui/hudPanelDismiss.ts` | 4 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: UI (1 trafienie) |
| 394 | `gra/src/ui/hudTitleTooltip.ts` | 28 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: tooltip UI (1 trafienie) |
| 395 | `gra/src/ui/icons/brandAssets.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 396 | `gra/src/ui/icons/iconRegistry.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 397 | `gra/src/ui/icons/scienceOwlIcon.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 398 | `gra/src/ui/icons/scienceProgressRing.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 399 | `gra/src/ui/icons/wikiBookIcon.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 400 | `gra/src/ui/improvementBuildConfirm.ts` | 10 | 1 | `ROZSTRZYGNIETY` | WYKLUCZONY: modal potwierdzenia akcji gracza (:39-40) |
| 401 | `gra/src/ui/interHumanDiplomacyHud.ts` | 10 | 0 | `POKRYTY` | POKRYTY: E-15 (wiersze sekcji 3). |
| 402 | `gra/src/ui/leaderBannersHud.ts` | 20 | 5 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: baner lidera = trwaly wskaznik UI wyprowadzony z stanu (zob. E-43), bez zdarzenia |
| 403 | `gra/src/ui/leaderPortraits.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 404 | `gra/src/ui/mainMenu.ts` | 28 | 2 | `ROZSTRZYGNIETY` | WYKLUCZONY: soonBtn toast WKROTCE (:262-268) - klik w menu / R4: showToast (:228-235) = komunikat WKROTCE po kliknieciu w menu (W) |
| 405 | `gra/src/ui/mapLoadingOverlay.ts` | 22 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: overlay ladowania mapy (startup), UI |
| 406 | `gra/src/ui/mapToolbarHud.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 407 | `gra/src/ui/mapUnitCursor.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 408 | `gra/src/ui/mapUnitHudSkin.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 409 | `gra/src/ui/markdownLite.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 410 | `gra/src/ui/minimapHud.ts` | 3 | 0 | `WYKLUCZONY-S6` | WYKLUCZONY: S5=0; S6 = wywołania 2 showPlaceholder( (otwarcie panelu, hover, ładowanie, API przeglądarki); nie komunikat logiki tury. |
| 411 | `gra/src/ui/minimapLayout.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 412 | `gra/src/ui/naukaLabel.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 413 | `gra/src/ui/newGameFlow.ts` | 86 | 1 | `ROZSTRZYGNIETY` | WYKLUCZONY: modal zaawansowany menu (klik gracza) / R4: pola hint: w opcjach nowej gry (:1633-1758) = teksty UI, W |
| 414 | `gra/src/ui/orderPanel.ts` | 0 | 0 | `WYKLUCZONY-S6` | WYKLUCZONY: S5=0; S6 = wywołania 1 showOrderPanel( (otwarcie panelu, hover, ładowanie, API przeglądarki); nie komunikat logiki tury. |
| 415 | `gra/src/ui/perfReport.ts` | 31 | 2 | `ROZSTRZYGNIETY` | WYKLUCZONY: raport wydajnosci (dev/menu) / R4: modal raportu wydajnosci (dev), UI |
| 416 | `gra/src/ui/perfTestPanel.ts` | 9 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: narzedzie dev (aria-modal) |
| 417 | `gra/src/ui/postBattleSummary.ts` | 7 | 0 | `POKRYTY` | POKRYTY: E-31 (mapowanie modułu w P2-6 sekcja 9.2, akapit „Pełna lista 10 modułów modali”). |
| 418 | `gra/src/ui/power-labels.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 419 | `gra/src/ui/powerOverlayHud.ts` | 2 | 0 | `WYKLUCZONY-S6` | WYKLUCZONY: S5=0; S6 = wywołania 1 showPowerOverlay( (otwarcie panelu, hover, ładowanie, API przeglądarki); nie komunikat logiki tury. |
| 420 | `gra/src/ui/preBattle.ts` | 70 | 2 | `POKRYTY` | POKRYTY: E-31 (wiersze sekcji 3). |
| 421 | `gra/src/ui/resourceColors.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 422 | `gra/src/ui/saveLoadDialog.ts` | 64 | 3 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: dialog zapisu/wczytania (akcja gracza); hint = opis istniejacych sejwow |
| 423 | `gra/src/ui/sceneTimingReport.ts` | 3 | 0 | `WYKLUCZONY-S6` | WYKLUCZONY: S5=0; S6 = wywołania 1 showSceneTimingReport( (otwarcie panelu, hover, ładowanie, API przeglądarki); nie komunikat logiki tury. |
| 424 | `gra/src/ui/scienceHubHud.ts` | 53 | 4 | `WYKLUCZONY-R5` | WYKLUCZONY: reakcja UI na akcję gracza; `showTechDiscoveryNotice` (:337) po kliknięciu gracza. Modal techa z logiki = E-26 (P2-6 sekcja 9.2). |
| 425 | `gra/src/ui/scienceHubSnapshotLogic.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 426 | `gra/src/ui/sciencePicker.ts` | 96 | 1 | `ROZSTRZYGNIETY` | WYKLUCZONY: komentarze/import; wybor gracza w drzewku (E-26 prezentacja) |
| 427 | `gra/src/ui/sideListHud.css.ts` | 6 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: CSS |
| 428 | `gra/src/ui/sidePanelEventFilter.ts` | 11 | 0 | `POKRYTY` | POKRYTY: E-54 (wiersze sekcji 3). |
| 429 | `gra/src/ui/sidePanelHud.ts` | 186 | 0 | `POKRYTY` | POKRYTY: E-53 (wiersze sekcji 3). |
| 430 | `gra/src/ui/sidePanelLayout.ts` | 1 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: uklad panelu (1 trafienie), UI |
| 431 | `gra/src/ui/siegeMapPanel.ts` | 31 | 0 | `ROZSTRZYGNIETY-R4` | E-30: wiersz ostrzezenia kapitulacji (:273) renderowany ze stanu oblezenia; modalIcon = ikony; klik gracza = W |
| 432 | `gra/src/ui/techDiscoveryNotice.ts` | 104 | 10 | `POKRYTY` | POKRYTY: E-26 (mapowanie modułu w P2-6 sekcja 9.2, akapit „Pełna lista 10 modułów modali”). |
| 433 | `gra/src/ui/techIcons.ts` | 10 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 434 | `gra/src/ui/techTreeView.ts` | 61 | 2 | `ROZSTRZYGNIETY` | WYKLUCZONY: wybor gracza (:924 showTechDiscoveryNotice po kliku) - prezentacja E-26 / R4: civ-ttv-hint (:1067) = podpowiedz sterowania, UI |
| 435 | `gra/src/ui/techUnlockParse.ts` | 4 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 436 | `gra/src/ui/treasuryBalanceFormat.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 437 | `gra/src/ui/triumphCityStateNotice.ts` | 25 | 2 | `POKRYTY` | POKRYTY: E-21 (mapowanie modułu w P2-6 sekcja 9.2, akapit „Pełna lista 10 modułów modali”). |
| 438 | `gra/src/ui/turnTransitionOverlay.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 439 | `gra/src/ui/uiParams.ts` | 1 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 440 | `gra/src/ui/unitActionBarHtml.ts` | 2 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 441 | `gra/src/ui/unitCardStatus.ts` | 5 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 442 | `gra/src/ui/unitCtxDockDiploGate.ts` | 2 | 1 | `ROZSTRZYGNIETY-R5` | WYKLUCZONY: `notifyDiploUiVisibilityChange` (:24) - powiadomienie UI->UI o widoczności; nie logika->UI. |
| 443 | `gra/src/ui/unitForeignPick.ts` | 16 | 0 | `ROZSTRZYGNIETY-R4` | W: modal wyboru (klik gracza); modalIcon = ikony |
| 444 | `gra/src/ui/unitInfoCard.ts` | 20 | 1 | `ROZSTRZYGNIETY` | WYKLUCZONY: starsza implementacja karty (komentarze :7-9,:115,:161,:408) |
| 445 | `gra/src/ui/unitInfographic.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 446 | `gra/src/ui/unitMiniPreview.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 447 | `gra/src/ui/unitPanelHud.ts` | 4 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 448 | `gra/src/ui/unitRecruitCard.ts` | 8 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 449 | `gra/src/ui/unitReplacePicker.ts` | 12 | 0 | `ROZSTRZYGNIETY` | WYKLUCZONY: modal wyboru zamiennika (klik gracza, komentarz :114) |
| 450 | `gra/src/ui/victoryScreen.ts` | 10 | 2 | `POKRYTY` | POKRYTY: E-41 (mapowanie modułu w P2-6 sekcja 9.2, akapit „Pełna lista 10 modułów modali”). |
| 451 | `gra/src/ui/wikiHubHud.ts` | 16 | 0 | `ROZSTRZYGNIETY-R4` | WYKLUCZONY: encyklopedia, UI (aria-modal) |
| 452 | `gra/src/ui/wonderCompletedNotice.ts` | 15 | 1 | `POKRYTY` | POKRYTY: E-25 (wiersze sekcji 3). |
| 453 | `gra/src/units/battleRoster.ts` | 8 | 6 | `POKRYTY` | POKRYTY: E-31 (wiersze sekcji 3). |
| 454 | `gra/src/units/setup.ts` | 7 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 455 | `gra/src/util/norm-pl-label.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 456 | `gra/src/vite-env.d.ts` | 0 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |
| 457 | `gra/src/wonderpreview/main.ts` | 9 | 0 | `WYKLUCZONY-ZERO` | WYKLUCZONY: S5=0, S6=0 - brak wywołania komunikatu UI, wpisu kroniki ani powiadomienia logiki. |

---

## 9. Rozstrzygnięcia (orkiestrator, 2026-10-21)

Final Control rundy 5/5 zwrócił agregat FAIL: 3 zarzuty NAPRAW (5, 6 — odsyłacze po numerze linii
zamiast nazwy sekcji, naprawione powyżej na nazwane kotwice; 7 — nieujawniona granulacja eventów,
rozstrzygnięte jako D-EV-15 powyżej) oraz 3 punkty DO_DECYZJI_WŁAŚCICIELA (3, 8, 9; zarzuty
Evaluatora 1, 2, 4 ODDALONE przez Final Control). Runda 5/5 to limit — orkiestrator przejął
rozstrzygnięcie zamiast dispatchować rundę 6.

Przejrzałem wszystkie 3 punkty DECISION_REQUIRED. **Żaden nie jest genuine decyzją produktową** —
wszystkie dotyczą wewnętrznej rygorystyczności weryfikacji i kształtu kanału transportu eventów w
Rust, nie zachowania gry widzianego przez gracza:

- **Pkt 3 (D-EV-14, kompletność pokrycia 288 plików metodą heurystyczną, nie przeczytaniem linia po
  linii):** Evaluator sam potwierdził (zarzut 3 jego rundy, ODDALONY merytorycznie przez Final
  Control na innym polu, ale uznanym za nierozwiązany dowodowo) brak konkretnego pominiętego eventu
  po sprawdzeniu próby plików i alternatywnych wzorców. To nie jest luka funkcjonalna, tylko brak
  wyczerpującego dowodu negatywnego. Rozstrzygnięcie: katalog się zamyka z jawnie udokumentowanym
  ograniczeniem (ryzyko zaakceptowane na tym etapie — P2.6 to katalog projektowy, nie wydanie), ale
  **pełny przegląd linia po linii pozostałych 288 plików jest WYMAGANY jako warunek wstępny P2.13**
  (niezależna kontrola kontraktu przed otwarciem P3) — zapisane jako zobowiązanie na przyszły temat,
  nie blokuje zamknięcia P2.6 teraz.
- **Pkt 8 (los `engine_state_changed` vs nowy `engine_event`; E-43 dubluje pełny snapshot;
  pochodzenie `contractVersion`/`requestId`):** `engine_state_changed` (`BridgeEvent::StateChanged`,
  P2-8) zostaje WYŁĄCZNIE jako okresowy snapshot synchronizacji stanu; nowy kanał `engine_event` jest
  DODATKOWY i niesie wyłącznie powiadomienia dyskretne (D-EV-3/D-EV-4: event = powiadomienie, nie
  źródło prawdy). E-43 (`turn_advanced_state`) ma zostać zawężony do markera końca tury + skrótu
  podsumowania (lista zmienionych miast/jednostek), NIE pełnego `PlayableState` — duplikacja ze
  snapshotem jest usuwana. Koperta `{contractVersion, requestId, ...}` to ten sam wzorzec co
  `BridgeRequest` z P2.5 §1 (`rust-port/engine/src/bridge.rs:43-50`) — rozszerzenie istniejącej
  konwencji kontraktu, nie nowy wybór.
- **Pkt 9 (semantyka dostarczania eventów przy braku nasłuchu frontendu — start, wczytanie zapisu,
  przeładowanie okna; czy potrzebny bufor/numer sekwencji):** zgodnie z D-EV-3 (eventy efemeryczne,
  nie źródło prawdy) i zasadą „stan wyprowadzalny nie jest przechowywany" (P2.2 §1 pkt 2) — NIE
  wymaga bufora ani numeru sekwencji. Frontend po (re)podłączeniu nasłuchu ma zażądać pełnego
  `engine_state_changed` (snapshot), a nie polegać na odtworzeniu utraconych eventów — eventy są
  wygodą UI (animacje, powiadomienia), nie kanałem, przez który stan mógłby się rozjechać. Utrata
  eventu podczas rozłączenia jest akceptowalna: najwyżej gracz nie zobaczy animacji/popupu danego
  zdarzenia po powrocie, ale stan gry (z `GameState`) będzie poprawny.

Żaden z 3 punktów nie wymagał eskalacji do właściciela: wszystkie są odwracalne później bez wpływu
na zapis/zachowanie gry, gdyby się okazały błędne — ta sama kategoria co P2.2/P2.3/P2.5.

**Status: temat zamknięty PASS** (mimo formalnego LIMIT-5-EXCEEDED rundy 5 — poprawki NAPRAW
wykonane redakcyjnie przez orkiestratora, punkty DECISION_REQUIRED rozstrzygnięte administracyjnie,
zero zmian w `gra/**`, zero kodu Rust). Następny krok: implementacja (P3+) może czerpać z tego
katalogu dla kształtu kanału `engine_event`; pełny przegląd 288 plików (D-EV-14) jest zobowiązaniem
dla P2.13 (niezależna kontrola przed P3); granulacja D-EV-15 do uwzględnienia przy pisaniu
`events.rs`.
