# RAPORT-PORANNY — stan parytetu Rust vs pin (dla właściciela)

Temat: `R-RUSTPORT-P6-RAPORT-PORANNY-Q1` (runda 1/5, Operator HAIKU). Dokument, bez `cargo`, bez zmian w kodzie.

- Baza odczytu: `5ad0f90d7` (= `origin/rust-port/parity-v2` po INTEG HARNESS-MUTACJE).
- Pin web (tylko odczyt): `07d2fbd72` (wg `REPIN-DRYFT-POMIAR-20261111.md` §0). `origin/main` jest dalej; nie objęte pomiarem.
- Legenda: **NIE_ZMIERZONO** = brak danych albo pomiar niemożliwy w tym temacie. Każda liczba ma źródło (SHA, plik:linia, dokument).
- Uwaga o źródłach: lista zadań sesji (#NN, statusy) leży poza repo. Statusy z niej są podane jako „wg listy zadań sesji”, nie jako dowód z repo.

## 1. Co weszło na parity-v2 od batcha 17

Zakres: `237e54526` (Operator r1 B17, ostatni znany punkt z `AUDYT-PARYTETU-RANO.md`) → `5ad0f90d7` (baza). Źródło: `git log --first-parent`.

| Batch | Commit integracyjny (FC) | Co weszło (SHA merge'ów) |
|---|---|---|
| B17 (przed zakresem) | `237e54526` (Operator r1) | `8217ec96e` R7K7B (`da070d099`), `527c521a0` SIEGE-TAKTYKA-K5LOOP (`ec7a0ff78`), `15097a342` STAN-ULEPSZENIA (`4d348e9ac`) |
| B18 | `358cb6cf6` (FC) | `487530d96` RANGED-DAMAGE-NAN (`e9b505939`), `369ad996a` DOC-TAKTYKA-WIERSZE (`3ec2e2827`), `36f7ceab0` POWER-AKUMULATORY-WIRING (`857fe1733`), `21aca46c9` R7K7C (`3d0716842`) |
| dokumenty B18 | `976339d9b`…`1027c2aa1` | AUDYT-PARYTETU-RANO (dokumentacja i obrona, FC) |
| B19 | `a8210a4f2` (raport Operatora) | `8a2a226db` TERYT-VEC (`a5d93810a`), `b28823b66` CRED-WOJNA (`44c409fdc`), `7ff047d5c` K5LOOP-BODY (`4d2e1dfcb`), integracja `b2054db78` (4 wip, w tym K5I2B2-DLUG; konflikt `unit_power.rs` rozwiązany) |
| B20 | `b0ba891fb` (FC PASS-WITH-NOTES) | `e998a039a` (merge B19 FC), `3216f8ff8` COMBAT-HARNESS r2 (`6a4a864dd`), `923540b65` K5LOOP-FACING (`ee0e3970d`), `72af377b1` K5LOOP-KONTRATAK (`039066ae1`) |
| dokumenty B20 | `dd8baef0d`…`f6d917610`, `eda6aeaa9`, `709d00577` | AUDYT-LUK-B18 (KNOWN_GAPS, EXPLICIT_ZERO, COMPONENT_SOURCES), NIEPODPIETE-MODULY, K5-PRZEGLAD (FC) |
| B21 | `fe6991eeb` (FC PASS-WITH-NOTES) | `cf281d785` INTEG-B21: POKRYCIE + JS0-HARDENING + ELIMINACJA-GRACZA |
| COMBAT-RECOUNT | `59ff97106` (integracja) | liczniki pokrycia przeliczane w Rust (FC `74c2f5c45` — patrz §2) |
| DYRAW-DECYZJA (dok.) | `a9d04b4a1` (FC PASS-WITH-NOTES) | decyzja a: `dirYaw` render-only (dokument) |
| HARNESS-MUTACJE | `5ad0f90d7` (baza) | skrypt mutacyjny dla rzutów dystansowych |

Wniosek: od B17 weszło 6 integracji kodowych (B18–B21, COMBAT-RECOUNT, HARNESS-MUTACJE) oraz kilka tematów dokumentacyjnych. Pełne rozbicie łat (`git cherry`) NIE_ZMIERZONO w tym temacie.

## 2. Co czeka na integrację (FC PASS bez merge do parity-v2)

Sprawdzenie: `git merge-base --is-ancestor <SHA> 5ad0f90d7`.

| Temat | SHA z dispatchu | Przodek bazy? | Stan | Uwagi |
|---|---|---|---|---|
| ELIMINACJA-DEALS-Q2 | `5db1f2845` (FC PASS-WITH-NOTES) | NIE | czeka | Integracja B22 jest na lokalnym obiekcie `329e54aa5` (merge FC do „B22 integration”), nie na parity-v2 |
| JS0-REST (JS-MAX0-REST) | `621e7338f` (FC PASS-WITH-NOTES) | NIE | czeka | |
| RANGED-CLEANUP | `182d298ef` (FC PASS-WITH-NOTES) | NIE | czeka | Zadanie #101 w liście sesji nadal `pending` |
| TOWER-TARGET | `fe3ceae3e` (FC PASS-WITH-NOTES) | NIE | czeka | Integracja B22 na obiekcie `64bf86e78`, nie na parity-v2 |
| DIR-CONST-ENUM | `01c9db8e4` to commit **obrony Operatora**, nie FC | NIE | czeka | Dispatch podaje ten SHA jako FC PASS bez merge; poprawny FC to `dff1b094a` (PASS-WITH-NOTES). Integracja B22 `32a2cb132` nie leży na żadnym ref widocznym z tego worktree: status NIE_ZMIERZONO |
| COMBAT-RECOUNT | `74c2f5c45` (obrona Operatora) | TAK (przez `59ff97106`) | **zintegrowane** | Nie jest już do integracji |

Ścieżka `B22` (ELIMINACJA-DEALS, TOWER-TARGET, DIR-CONST-ENUM i JS0/RANGED) nie jest zamknięta na parity-v2. Obiekty integracji B22 istnieją lokalnie, ale bez ref; decyzja o zakresie B22 należy do orkiestratora.

## 3. Otwarte pytania GAMEPLAY (do decyzji właściciela)

Każde pytanie: opcje, rekomendacja z dokumentu. Orkiestrator nie rozstrzyga progów ani balansu.

### 3.1 SZTURM ODPARTY — #60
Źródło: `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` §K5.9. Gałąź `_checkEnd` („SZTURM ODPARTY”, `battleScene.ts:10184-10186`) jest bramkowana przez `_stalled`. W pinie `_stalled` nie bywa ustawiane w bitwie oblężniczej, więc gałąź jest **nieosiągalna**. Dziś oblężenie bez wyłomu kończy się sufitem tur (remis po 150 turach).
- **A (parytet):** nie wpinać `siege_no_breach_repels_attack` jako zachowania gry; zachować zachowanie pinu. Rekomendacja: NIE_ZMIERZONO (dokument nie wskazuje wprost).
- **B (naprawa):** wpiąć gałąź (bramka `_stalled`); zmienia wynik gry (oblężenie bez wyłomu odpierane zamiast remisu). Dokument: „decyzja gameplay”.
- Rekomendacja z dokumentu: brak jawnej; dokument wymaga decyzji właściciela.

### 3.2 W8 r7 Q1–Q4 — kolejność faz — #63
Źródło: `dyspozycje/rust-port/p6/P6-W8-R7-AUDYT.md` (sekcja pytań). Każde pytanie ma rekomendację „zgodnie z pinem”.
- **Q1 (B3, B4)** — czy dyplomacja AI i pokój AI-AI rozstrzygane po ekonomii i oblężeniach (jak pin E13), czy na początku tury (kolejność Rust). Opcje: A zgodnie z pinem / B kolejność Rust. **Rekomendacja: A.** Dotyczy R7-K5.
- **Q2 (B1, B6)** — czy kapitulacja głodowa ma następować w tej samej turze po zerowaniu zapasów (pin E5→E7) i czy szturm po maszynach (E7 :38873) w tej samej turze. Opcje: A zgodnie z pinem / B kolejność Rust. **Rekomendacja: A.** Dotyczy R7-K1, K2, K3.
- **Q3 (B2)** — czy wojna wypowiedziana przez hamulec działa już w tej turze, przed ekonomią i ruchami AI (pin D8). Opcje: A tak jak pin / B później. **Rekomendacja: A.** Dotyczy R7-K4.
- **Q4 (B5)** — czy rebelia miasta wpływa na produkcję tej samej tury (pin :39515 przed :39731) czy od następnej tury (Rust: Production(4) bez fazy rebelii). Opcje: A tak jak pin / B od następnej tury. **Rekomendacja: A.** Dotyczy R7-K6.

### 3.3 units.json vs pin — #27
Źródło: `AUDYT-PARYTETU-RANO.md` §1 (pomiar `dowody/03-units-porownanie.txt`). **71 komórek w 51 jednostkach** (dispatch/lista podają „50/71”; liczba jednostek nie zgadza się z listą). Najczęściej: `Tech` 27, `Zastąp specjalnie` 21, `fieldPower` 9.
- **A:** REPIN wszystkich 71 komórek do pinu `07d2fbd72`.
- **B:** REPIN tylko pól bojowych (`fieldPower`, `Atak`, `Obrona`, `meleeAttack`, `meleeDefence`, `piercing`, `Przebicie`, `Bonus vs Spearman %`), pola tekstowe (`Historia`, `Top3`) po weryfikacji merytorycznej.
- **C:** zachować rozbieżności jako świadome odchylenie i odnotować w dokumentacji.
- Rekomendacja: NIE_ZMIERZONO (dokument nie rozstrzyga; nie sprawdzono, czy różnice `Historia`/`Top3` są merytoryczne).

### 3.4 DYSTANS — faza zwarcia (`resolve_combat`) — #10
Źródło: `P6-REPIN-DYSTANS-PETLA.md` §2, `P6-REPIN-DYSTANS-PETLA-HANDOFF.md` pkt 4. Rust nie ma pętli walki per runda ze strzałami; mnożnik dystansu nie jest podpięty do `resolve_combat` (model siły `effective_strength`).
- **A:** Rust zostaje przy modelu siły; udokumentować jako świadome odchylenie.
- **B:** port rund i strzałów z `combat.ts` (zmiana zachowania gry; osobny temat, patrz #100, #131–#137, #140).
- Rekomendacja: brak jawnej w dokumencie („decyzja produktowa właściciela”).

### 3.5 REPIN-DRYFT 1–6 — #14–#19
Źródło: `dyspozycje/rust-port/REPIN-DRYFT-POMIAR-20261111.md` §1 i §2. Wszystkie pozycje są DRYF, poza pozycją 5 (ZGODNE). Dla każdej pozycji: **A** = REPIN do pinu (propozycja z §2 dokumentu), **B** = zostawić Rust i odnotować odchylenie. Rekomendacja dokumentu: A dla pozycji 1–4, 6a–6f (propozycja REPIN w §2).

- **#14 (poz. 1) korupcja Pałac II/III + Trybunał:** web 6 budynków, Rust 3 (`economy_city_fns.rs:220`). A: dodać `palac_ii`, `palac_iii`, `trybunal`. B: zostawić 3. **Rekomendacja: A.**
- **#15 (poz. 2) odlewnie brązu 50/75:** web 50 (epoka 2), 75 (epoka 3+); Rust stałe 50 (`turn_economy_resources.rs:77`). A: klucze per epoka. B: 50 dla wszystkich epok. **Rekomendacja: A.**
- **#16 (poz. 3) handel kontaktowy + `emporion`:** DRYF w `TRADE_BUILDING_IDS` (brak `emporion`, `trade.rs:345`) i w warunku połączenia (`trade.rs:860-923`). A: dodać `emporion` i warunek kontaktu. B: zostawić. **Rekomendacja: A** (pozycja 3b wymaga najpierw ustalenia, które wywołania dotyczą tras zewnętrznych — NIE_ZMIERZONO).
- **#17 (poz. 4) łodzie rybackie 6/6/6:** Rust 2/3/3 (dane i `production_for`). A: 6/6/6 w obu miejscach. B: zostawić. **Rekomendacja: A.** Które miejsce zasila grę — NIE_ZMIERZONO.
- **#18 (poz. 5) civBonusy w zapisie:** ZGODNE (oba poza zapisem). Brak decyzji REPIN. **Rekomendacja: nie zmieniać.**
- **#19 (poz. 6a–6f) dane dyplomacji:** wartości ZGODNE, DRYF w logice: przewagaMilitarna (brak reguł), pokojAiAi.minBilansPW (brak konsumenta), progNapBezterminowyRelacja (brak konsumenta, 151), ekspansja graniczna (brak wyboru wg epoki), sisterAlliance (brak portu), aiDiplomacyStance (zmęczenie wojną i archetypy niepodpięte). A: port w kolejnych tematach (6e wymaga osobnej decyzji o zakresie). B: zostawić. **Rekomendacja: A dla 6a–6d i 6f, 6e po decyzji o zakresie.**

## 4. Otwarte długi techniczne (#96–#141)

Statusy wg listy zadań sesji (poza repo), **wszystkie `pending`**. Nie weryfikowano per pozycja w repo; kilka pozycji ma już integracje w historii (poniżej: rozbieżności).

| # | Nazwa (skrót) | Status (lista) | Uwaga |
|---|---|---|---|
| 96 | K5-LOOP-WIEZE (wieże oblężnicze) | pending | |
| 97 | K5-LOOP-AUTO (ścieżki AUTO, tryb ręczny) | pending | |
| 98 | K5-LOOP-WYLOM (wyłom, rout) | pending | |
| 99 | K5-LOOP-RESUME (wznowienie przewijania) | pending | |
| 100 | COMBAT-HARNESS (wektory pętli dystansu) | pending | |
| 101 | RANGED-DAMAGE-CLEANUP | pending | Gałąź `182d298ef` FC PASS-WITH-NOTES, nie zintegrowana |
| 102 | K5I2B2-DLUG (combatTerrainName, procarz, NaN) | pending | |
| 103 | CRED-WOJNA (hak note_war_entered) | pending | |
| 104 | ZLOZA-WIRING | pending | |
| 105 | AUDYT-LUK-B18 (KNOWN_GAPS i moduły bez wołającego) | pending | Dokument AUDYT-LUK-B18 już na parity-v2 (`dd8baef0d`…`f6d917610`); zadanie wg listy nadal `pending` |
| 106 | R7K7C-WIRING | pending | |
| 107 | K5LOOP-FACING (ProdBody) | pending | Część gałęzi K5LOOP-FACING weszła w B20 (`923540b65`) |
| 108 | K5LOOP-KONTRATAK (ProdBody) | pending | Część weszła w B20 (`72af377b1`) |
| 109 | K5LOOP-OUTCOME | pending | |
| 110 | JS-MAX-SIGN | pending | Pokrewne z JS0 (`621e7338f`, nie zintegrowane) |
| 111 | K5I2B2-POKRYCIE | pending | Pokrewne z B21 POKRYCIE (`cf281d785`, zintegrowane) — zgodność do sprawdzenia |
| 112 | K5LOOP-DOCTRINA-STRZELEC | pending | |
| 113 | K5LOOP-WIRING (finał pętli oblężniczej) | pending | |
| 114 | ELIMINACJA-GRACZA | pending | Rozbieżność: B21 (`cf281d785`) ma „ELIMINACJA-GRACZA” w tytule — status do sprawdzenia (NIE_ZMIERZONO) |
| 115 | ZDOBYCIE-MIASTA-WIRING | pending | |
| 116 | TOWER-TARGET | pending | Gałąź `fe3ceae3e` FC PASS-WITH-NOTES, nie zintegrowana |
| 117 | AUDYT-PARYTETU-RUST | pending | Dokument `AUDYT-PARYTETU-RANO.md` istnieje na parity-v2 |
| 118 | K5-LOOP-AUTO-WEKTORY | pending | |
| 119 | NIEPODPIETE-MODULY-INDEKS | pending | Dokument `NIEPODPIETE-MODULY.md` istnieje na parity-v2 |
| 120 | CRED-HAK-WYPOWIEDZENIE | pending | |
| 121 | K5LOOP-FACING Evaluator r1 | pending | |
| 122 | K5LOOP-FACING integracja | pending | Częściowo: wejście w B20 (`923540b65`) |
| 123 | K5LOOP-RUCH (facing po krokach) | pending | |
| 124 | K5LOOP-FACING test czułości | pending | |
| 125 | K5LOOP-FACING pokrycie łuków | pending | |
| 126 | DIR-CONST-ENUM | pending | FC `dff1b094a`, nie zintegrowany na parity-v2 |
| 127 | DIRYAW-RENDER (decyzja) | pending | Decyzja a (render-only) w `a9d04b4a1` — do sprawdzenia, czy zamyka #127 |
| 128 | K5LOOP-FACING rejestr NIE_ZMIERZONO | pending | |
| 129 | K5LOOP-KONTRATAK-WEKTORY | pending | |
| 130 | K5LOOP-SWEEP-PRZEGLAD | pending | Dokument K5-PRZEGLAD na parity-v2 (`709d00577`) |
| 131 | COMBAT-HARNESS r2 (wektory graniczne) | pending | |
| 132 | COMBAT-HARNESS r2 (liczniki pokrycia) | pending | COMBAT-RECOUNT zintegrowany (`59ff97106`) — do sprawdzenia |
| 133 | COMBAT-HARNESS r2 (znak zera) | pending | |
| 134 | COMBAT-HARNESS (wektory fazy zwarcia) | pending | |
| 135 | COMBAT-HARNESS (wejścia przed pętlą) | pending | |
| 136 | COMBAT-RESOLVE-PETLA | pending | Patrz DYSTANS #10 |
| 137 | COMBAT-HARNESS (NaN/Inf) | pending | |
| 138 | HARNESS-MUTACJE (ranged_phase w bramkach) | pending | Skrypt zintegrowany (`5ad0f90d7`) — do sprawdzenia |
| 139 | serde_json float_roundtrip | pending | |
| 140 | COMBAT-HARNESS FC r1 i integracja | pending | |
| 141 | ELIMINACJA-GRACZA-DEALS-WOJNY-Q2 | pending | FC `5db1f2845` (PASS-WITH-NOTES), nie zintegrowany na parity-v2 |

Uwaga: statusy z listy sesji mogą być nieaktualne względem repo (część tematów ma już commity na parity-v2). Weryfikacja per zadanie NIE_ZMIERZONO.

## 5. Czego nie zrobiono (NIE_ZMIERZONO)

- Nie uruchamiano `cargo` (dispatch: temat dokumentacyjny).
- Nie sprawdzono `origin/main` po `07d2fbd72`.
- Nie ustalono, który ref zawiera obiekty integracji B22 (`32a2cb132`, `329e54aa5`, `64bf86e78`).
- Nie zweryfikowano statusów zadań #96–#141 w repo; podane są wg listy zadań sesji.
- Nie sprawdzono, czy różnice `Historia`/`Top3` w `units.json` są merytoryczne.
