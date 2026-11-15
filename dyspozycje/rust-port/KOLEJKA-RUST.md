# KOLEJKA RUST — gotowe tematy do uzupełniania slotów (maks. 4 operatorów naraz)

Zasada (właściciel, 2026-11-11): zawsze działają cztery tematy operatorskie. Slot zwolniony = w tej samej turze start następnego z tej listy (dispatch gotowy lub pisany od razu). Nie czekać na integrację: temat zależny od niezintegrowanego batcha startuje na czubku batcha (gałąź `rust-port-wip/BATCH*-tip`); FF na parity-v2 daje dokładnie ten commit.

## W toku (operatorzy, 23:18 UTC)
1. DLUG-TESTHELPERS (`R-RUSTPORT-DLUG-TESTHELPERS-Q1`)
2. POWER-PRODUCERS (`R-RUSTPORT-P6-POWER-PRODUCERS-Q1`)
3. SIEGE-TRANSFER-Q3 r2 (`R-RUSTPORT-P6-SIEGE-TRANSFER-Q3-Q1`)
4. BRAKE-VECTORS r2 (`R-RUSTPORT-P6-BRAKE-VECTORS-Q1`)

## Następne (gotowe do startu, w kolejności)
6. W8 r3 (`R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1`): po integracji BRAKE-INPUTS i SIEGE-TRANSFER; DODATEK r3 z bazą = nowy czubek parity-v2; WarTurnContext, wariant B, wiring `common_border_delta`.
7. UNIT-REPLACE L-3 (zadanie 9): po W8 r3.
8. Siege #217 (zadanie 11): po W8 r3.
9. Test infantry: `available_replacements_for` — dokładny zbiór (z raportu L-1), po L-1.

## Czekają na decyzję właściciela (gameplay) — NIE startować
- Faza zwarcia DYSTANS / resolve_combat (zadanie 10).
- REPIN-DRYFT 1–6 (zadania 14–19).
- 50 rozbieżności pól units.json Rust vs pin (zadanie 27).

## Następne (08:0x UTC; zadania 83–93 na liście; kolejność zalecana)
1. K5I2b — składanie BlowInput + rangedDamageMultFor (po K5I2a3/a4).
2. INTEG-B14C — K5I2a1–a4 + CRED (+ R7K7, jeśli nie w B14B) na parity-v2.
3. DLUG-POWER-ULEPSZENIA-WIRING; POWER-BITWY-ZDOBYCZE; DLUG-UNIT-REPLACE-PROGRESS (stan: pola serde default + zgodność zapisu).
4. R7K7-B (P7, zlozeGrants, wektory D3/sync) i R7K7-C (efekty na PlayableState, skarbiec AI, pula Pracy).
5. K5-LOOP (test składania pętli taktycznej), KLASY-WIRE, DLUG-NFD-CCC.
6. Raport poranny (pytania gameplay: SZTURM ODPARTY, Q1–Q4 W8 r7, units.json vs pin, DYSTANS, REPIN-DRYFT 1–6).
Zasada: każdy start od dispatchu z jedyną obowiązującą BAZĄ; temat zależny startuje na czubku fc, integracja rundą Operatora z pełnym cargo test.

## REGUŁA MODELI (właściciel, 2026-11-12 ~07:55 UTC; wiążąca, limit schodzi zbyt szybko)
Operator = HAIKU 5.5 ZAWSZE. SONNET na Operatorze WYŁĄCZNIE po dwóch nieudanych rundach Haiku TEGO SAMEGO tematu (FAIL/BLOCK bez kodu), z pisemnym uzasadnieniem w dispatchu — nie z góry „bo trudny temat”. Skrypt workflow: r-rustport-p6-w6s-wf_89e542b7-6b5.js (Haiku); skrypt Sonnet (r-rustport-p6-w6s-sonnet-op.js) tylko po spełnieniu warunku. Obrona = Haiku; Evaluator i Final Control = Sonnet. Zadania dokumentacyjne/integracyjne = Haiku. Nie startować zbędnych tematów „dla zapełnienia”, jeśli nie ma realnej pracy bez zależności od decyzji gameplay.

## AKTUALIZACJA 15.11 04:48 UTC (heartbeat) — zastępuje migawkę z 23:18 i „Następne (08:0x)”
Parity: `f2bb11970`. rust-sivvrn: `95b4bf276` (rejestr). Dysk: 12 GB wolne. Aktywnych Workflow: 0 (22 stare journale to porzucone uruchomienia `started`/`failed`, nieruszane od wielu godzin; jedyny świeży to #115 zakończony FC FAIL 04:05).

### W toku
- brak.

### Zablokowane decyzją właściciela (pytania ABC w czacie) — NIE startować
- #115 ZDOBYCIE-MIASTA-WIRING: B wstrzymać do W8 (rekomendowane) / A wrapper teraz / C pełne wpięcie teraz. Brak odpowiedzi.
- #106 R7K7C-WIRING: decyzja pkt 4 „brak wpisu = 0” (A error / B 0 jak w pinie (rekomendowane) / C 0 z ostrzeżeniem).
- #120 CRED-HAK-WYPOWIEDZENIE: A nowy wariant EngineCommand + CONTRACT_VERSION (rekomendowane) / B wywołanie wewnętrzne.
- Gameplay (zostają w czacie): SZTURM ODPARTY, W8 r7 Q1–Q4, units.json vs pin, DYSTANS, REPIN-DRYFT 2–6.

### Zablokowane zależnością od niezintegrowanego kodu / rozpoznania — NIE startować bez rozpoznania
- #109, #147 K5LOOP-OUTCOME (`_resolveBlowOutcome`, `_targetInRange`) — wymaga ProdBody, rozpoznanie #179.
- #107, #121–#125 K5LOOP-FACING — rozpoznanie #178.
- #112, #113, #148 doktryna/strzelec i produkcyjna pętla oblężnicza — po OUTCOME i ProdBody.
- #96, #146 wieże (K5-LOOP-WIEZE / pick_tower_target) — po ustaleniu, czy #116 idzie razem z #96.
- #97, #98, #118, #149, #150 AUTO/WYLOM — po K5LOOP-OUTCOME.
- #100, #135, #137, #167–#169 COMBAT-HARNESS — wymaga decyzji DYSTANS (#10 zamknięte, ale wejścia fazy zwarcia wymagają rozpoznania #167).
- #104, #172 ZLOZA-WIRING — rozpoznanie (wywołania w main.ts 22774, 23694, 24234, 24294).
- #139, #151, #170 serde float_roundtrip — decyzja techniczna i Cargo.toml.
- #165 INTEG-MELEE-PORT, #174 INTEG-JS-MAX-VERIFY — weryfikacja przed FF (wymaga osobnej rundy integracyjnej).
- #9 UNIT-REPLACE L-3 i #11 Siege #217 — wskazane jako „po W8”; W8 zintegrowany (#58), ale zakres pozostały niezweryfikowany.
- #177 PIN-MOVE-PLAN — decyzja o przesunięciu pinu (poza P6).

### Do zrobienia (bez decyzji właściciela, wymaga rozpoznania przed dispatchem)
- #176 R7K7C-STATUS: potwierdzić, czy R7K7C-WIRING-Q1/Q2 są w parity (dla #106).
- #173 PROCES: stałe sprawdzanie dysku ≥ 8 GB przed startem i sprzątanie worktree po temacie.
- #185 NOCNA-PETLA: heartbeat — ten wpis nim jest.

### Zasada
Start tylko z dispatchem wypchniętym na claude/rust-sivvrn, bazą = czubek FC albo origin/rust-port/parity-v2, zależnościami już zintegrowanymi i bez decyzji gameplay. Dzisiaj żaden kandydat tego nie spełnia bez dodatkowego rozpoznania, więc sloty pozostają 0/4 do czasu odpowiedzi właściciela albo rozpoznania.
