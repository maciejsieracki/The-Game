# Plan portu Rust/Tauri po wznowieniu (2026-10-29) — bez ciężkich prac graficznych

**Decyzja właściciela (czat, 2026-10-29):** wracamy do portu Rust/Tauri. Realizujemy WSZYSTKO, co nie jest ciężką pracą graficzną/3D, na **Haiku 5.5 (Operator/Obrona) + Sonnet 5.5 (Evaluator/Final Control)** wg `R-PROC-AUTOBOT.md` §5b, ścieżką 11 etapów z §5d. **Zero Opusa.** Ciężkie prace 3D (jednostki, mapa 3D, bitwa 3D, renderer, obiekty 3D) odkładamy na sam koniec i uruchamiamy tylko, gdy przed końcem limitu zostanie wolny zapas.

## 0. Stan wyjściowy
- Web: `origin/main` poszedł do przodu od pinu portu (`edb8fb56`) — najnowsza ROBOCZA `00f76663` (27 commitów po `a63565ee`: wódz/generał, łączenie armii, kampania AI, tartak, pamięć/GPU). Port musi znać deltę (temat T0).
- Rust: `origin/rust-port/parity-v2` = `2c2f58f8`. P5.2–P5.7 (UI poza `cityPanel.ts`) i P6 (silnik: dane, mapgen M00–M04/M05A/M09–M12/M14–M17, jednostki P6.4–5B, miasta P6.6A/B, P6.7A/B) zamknięte.
- Ograniczenia środowiska: twardy limit **2 równoległe worktree kodu Rust** (target/ ~1,2 GB), `df -h /` przed startem, sprzątanie wg §5c. Tematy dotykające tych samych plików — tylko sekwencyjnie.

## 1. Zakres BEZ grafiki — do realizacji teraz (Haiku/Sonnet)
| ID | Temat | Zależności / uwagi |
|---|---|---|
| T0 | `R-RUSTPORT-REPIN-DELTA-Q1` — delta weba `edb8fb56`→`origin/main`: które zaportowane moduły/kopie bajtowe/fixtury są nieaktualne | tylko odczyt + raport; bez worktree Rust; start od razu |
| T1 | P6 mapgen: łańcuch **M05B → M06A → M06B → M07A…M07E2** (sekwencyjnie, wspólny plik `relief.rs`), potem **M08**, **M13**, **M18** (`generate.rs`) | slot kodu Rust #1; M13 po M06B+M10, M08 po M06B |
| T2 | P6.8 miasta: ekonomia/produkcja/budynki/okolica (18 pozycji) | slot kodu Rust #2; po rozpoznaniu podział na A/B |
| T3 | P5.8 `cityPanel.ts` (11 986 LOC, UI 2D) — NAJPIERW podział na sekcje (temat dokumentacyjny), potem porty sekcji | frontend-v2 (TS), 3 próby P5.7 padły na zakresie → małe kawałki |
| T4 | P6.9–P6.10 tura gracza/aktualizacja świata; P6.2 walidacja komend | po T2 (wspólne struktury) |
| T5 | P6.11–P6.12 AI (w tym forced-war-waves), P6.13 walka (logika), P6.14 dyplomacja, P6.15 handel, P6.16 kultura/religia, P6.17 cuda+tech, P6.18 państwa-miasta/barbarzyńcy, P6.19 zwycięstwo | kolejno po rozpoznaniu zależności; każdy kawałek ≤ 1 temat; uwzględnić deltę z T0 (reguły wojen W1/W2/R1–R3, dyplomacja, łączenie armii) |
| T6 | P6.20–P6.22 save/load/replay | po M17 i stanie świata |
| T7 | P7.1–P7.2, P7.6–P7.7 (komendy Tauri, serializacja) — bez części renderującej | po stabilizacji kontraktu |
| T8 | P5 reszta: 2D UI (dialogi, tooltipy, stany), P5.13 kontrakt | po T3 |

## 2. ODŁOŻONE na sam koniec (ciężka grafika/3D — Opus 5.5, tylko przy zapasie limitu)
P4.36 części 3–5 (bitwa 3D), MOD-06/07/09/13 i inne obiekty/jednostki 3D, ujednolicenie typu drzewa sceny 3D, renderer mapy 3D (P4.6–P4.10 w części GPU), RR-T1 spike GPU (wymaga maszyny właściciela), P8 porównania wizualne/screenshotowe, P10 wydajność, P11 packaging (osobna zgoda).

## 3. Kolejność startu (pierwsza fala)
Fala 1 (równolegle, max 3): **T0** (analiza), **T1/M05B** (kod #1), **T3a** (podział `cityPanel.ts`, dokumentacja). T2 startuje, gdy zwolni się slot kodu #2 po rozpoznaniu P6.8; zwolniony slot natychmiast zajmuje kolejny gotowy kawałek (zasada ciągłości puli, bez wypełniania na siłę).

## 4. Zasady wykonania
Ścieżka 11 etapów (§5d), dispatch zapisany przed startem, `model` jawnie w każdym `agent()`, Operator-impl + Operator-pomiary (foreground), sprzątanie po każdym workflow (§5c), commit tylko `dyspozycje/rust-port/**`, `dyspozycje/autobot/runs/**` i (kod) gałąź `rust-port/parity-v2`. Bez deploy/READY_FOR_DEPLOY, bez zmian w `gra/`.
