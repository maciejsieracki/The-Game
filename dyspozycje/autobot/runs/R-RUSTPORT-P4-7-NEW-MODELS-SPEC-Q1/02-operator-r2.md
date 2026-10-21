STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1
GOAL: Specyfikacja nowych modeli 3D po D-MOD-3=B, D-MOD-4=C, D-MOD-5=B, D-MOD-9=A — runda 2: odpowiedź na zarzuty E1–E12 Evaluatora r1 (FAIL).
ROLA: Operator (obrona), Opus 5.5 medium, worktree `wf_81bfcfa8-d0e-3`, stan wyjściowy = commit Operatora r1 `1a2e47de` (rodzic `da03ce40`).

ZMIANY-COMMIT (allowlista dispatchu; bez push):
- `dyspozycje/rust-port/p4/P4-7-NEW-MODELS-SPEC.md` — poprawki E1–E12, nowe §1.6, §3.5, §4.1b, §9 (mapa zmian)
- `…/skrypty/three-mock.js` (promień per wierzchołek), `…/skrypty/measure.ts` (ghost L1–L10, moduły Grecji/Rzymu), `…/skrypty/run_measure.py` (eksport modułów w kopii tymczasowej), `…/skrypty/budzet_kart.py` (NOWY)
- `…/wyniki/measure.txt` (wiersze r1 niezmienione + nowe kolumny/sekcje), `…/wyniki/budzet_kart.txt` (NOWY)
- ten raport

ODPOWIEDZI NA ZARZUTY
| # | Werdykt | Poprawka i dowód |
|---|---|---|
| E1 | PRZYJMUJĘ | §1.6: klasyczny `buildBronzeCity` (`bronzeCity.ts:399`, centra `:238…:348`, opis `:1-15`) i ghost (`bronzeCityRoblox.ts:398-433`). Ghost L1–L10 zmierzony: L10 promień 0,89–0,92 (wewn.), 852–1776 tri, więc nie nadaje się jako zestaw 1:1. Wariant B′ ≈ 11,4 J (§1.3), wiersz „Wzorzec w webie” w każdej karcie, `D-NM-16`. |
| E2 | PRZYJMUJĘ | Harmonogram z liczbami (§3.0). `budzet_kart.py` przy harmonogramie r1 potwierdził przekroczenia (B-EG/AL/EP/AZ/AN/AF od L7, B-AF od L4). Teraz `EXIT=0`, tabela w §3.5. B-AF: 6/10/5 pali, krowa z 2 boxów (L1 = 15 mesh / 194 tri ≤ 17 / 207). B-AN: lama z 3 boxów. Z-GR: heksastyl + teatr 3×2 (L10 75 / 986). Z-RZ: capanny → insule (L10 80 / 994). |
| E3 | PRZYJMUJĘ | §3.0: centrum nie powtarza liczby stopni cudu (`wonderModels.ts:216-230` = 4 stopnie). B-ME v2/v3 = 1 stopień tarasu z rampą. Z-ME v3 = pałac + brama glazurowana, bez zigguratu. |
| E4 | PRZYJMUJĘ | §4.1b: `buildBronzeCity`/`buildStoneAgeCity` poza portem przez D-MOD-1 (`LEDGER.md:128`), `robloxCity.ts:62,213` zależne od otwartego D-MOD-2. Kolizja jawnie w `D-NM-17`. |
| E5 | PRZYJMUJĘ | §4.1: funkcje `units.ts` wracają do MOD-04 zgodnie z `P4-4-MODEL-CATALOG.md:570`. Przydział wg epoki = `D-NM-18`. |
| E6 | PRZYJMUJĘ | §4.2 pkt 3a. Źródło = `RuntimeUnit.typeId` (PL): `main.ts:27154` `nazwa: u.typeId`, `main.ts:26996` `u['Jednostka'] === typeId`, fallback `:27000`. Bitwa testowa: `testBattle.ts:363,372`. Rust: pole `unit_type: UnitTypeId` (newtype), bez mapy EN. Allowlista MOD-14/RR-T10 `rust-port/renderer/src/battle/**`, test `tests/unit_model_rule.rs` (MOD-04). Milicja: `NIE_ZMIERZONO`. |
| E7 | PRZYJMUJĘ | §5.2: ścieżki testów NM-00..09; dispatch cudów `models/wonders/mod.rs` w NM-09; NM-00 tworzy NOWĄ tabelę i nie zmienia `ikonaIdToBronzeCiv` (MOD-01); rejestr z 18 wpisami i zaślepkami, więc NM-01..08 edytują tylko `sets/<id>/**`. Zapis „dopisuje orkiestrator” wycofany. |
| E8 | PRZYJMUJĘ | RR-T2 i RR-T11 w „Zależy od” NM-01..09, §5.3 (RR-T11 przed RR-T7 wg `P4-3-RUST-RENDERER-ARCH.md:411`), R8. |
| E9 | PRZYJMUJĘ | Metryka per wierzchołek (mock r2): Kamień L10 = 0,420 (AABB 0,460), Grecja 0,416, Rzym 0,418. Cuda: `maxR_wewn_wierzch` ≤ 0,50 spełnia 18/19 istniejących (wyjątek aschaffenburg 0,549). Kopiec rb 0,44 → 0,40 (0,412); karty 0,212–0,420. |
| E10 | PRZYJMUJĘ | §3.4 K1/K2/K3: siatka 12 zrzutów na cud (normalny/ruina × sztandar × 3 d) + 2 plansze. Kto ocenia: K1 Evaluator/FC, K2/K3 właściciel. |
| E11 | PRZYJMUJĘ | Karta kurhanu (202 tri / 13 mesh, r 0,420), karta Z-SL „gród” (§3.3/§3.5). `D-NM-6` skorygowane: `epokaDocelowa` = 4/5/6/4/**1** (odczyt `wonders.json`). |
| E12 | PRZYJMUJĘ | `miasto-kamien.ts:69-70` → `:73-74` (3×). Przy okazji: `bronzeCity.ts:29-30` → `:30-31`, `:33` → `:34`. |

TESTY:
- `python3 -I …/skrypty/run_measure.py` → EXIT=0; porównanie wierszy r1 z r2 (po usunięciu nowych kolumn) → 0 brakujących wierszy (deklarowane = zmierzone bez zmian).
- `python3 -I …/skrypty/budzet_kart.py` → EXIT=0 („OK — wszystkie karty w budżecie”); przy harmonogramie r1 → EXIT=1 (dowód zarzutu E2).
- Kolumny tabel Markdown → 0 rozjazdów; `git diff --cached --check` → czysto.
- Bez npm, bez buildu, bez weba; zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`.

BLOKADY: brak. `NIE_ZMIERZONO` (§7): koszt B′ 0,8 J, `Jednostka` w definicjach milicji, promień ghosta w świecie, wygląd.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) → Final Control → integracja orkiestratora. Decyzje właściciela: D-NM-1..19.
DEPLOY/PUSH: NIE WYKONANO
