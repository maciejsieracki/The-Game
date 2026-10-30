# Aktualizacja planu portu Rust/Tauri — stan i kolejka (2026-10-29, wieczór)

Dokument nadrzędny: `PLAN-PORT-RUST-TAURI-20261020.md`; tabela tematów: `GOAL-RUST-PORT-20261020.md`; zasady: `PLAN-PO-WZNOWIENIU-20261029.md` (bez ciężkiego 3D, Haiku/Sonnet, ścieżka 11 etapów §5d). Ten plik zastępuje §1 i §3 planu po wznowieniu jako aktualna kolejka.

## 1. Stan (zintegrowane na `origin/rust-port/parity-v2`, ≥ `4160cd9b`)
| Obszar | Stan |
|---|---|
| REPIN (re-pin weba `edb8fb56`→`91dc998a`) | DELTA (raport), DANE, LOGIKA-CIV — ZROBIONE; w toku: EKONOMIA-A, MAPA, WOJNA-NOWE-A |
| P6 mapgen M00–M05B, M06A–M06A4, M09–M12, M14–M17 | ZROBIONE (silnik 1265 testów / 0 błędów) |
| P5.8 `cityPanel.ts` (11 986 LOC): K01A–K09B | ZROBIONE jednostkowo (wszystkie jednostki, wiringi, mostek w `controller/`); dług: dostawcy reguł hosta, `panelInputs.k05a`, 14 delegatów K06B, 44 delegaty K07B, typy `GameData` — patrz §3 |
| P4.36 / MOD-14 bitwa 3D (części 1–5) | ZROBIONE; ocena wizualna 1:1 wymaga GPU właściciela (NIE_ZMIERZONO) |
| Reszta grafiki 3D | ODŁOŻONA (§4) |

## 2. Kolejka — tematy gotowe do otwarcia (kolejność, kolizje plikowe)
Zasada: do 5 jednoczesnych tematów, tematy na tych samych plikach sekwencyjnie, zwolniony slot natychmiast zajmuje kolejny gotowy temat.

| # | Temat | Pliki (kolizje) | Zależy od |
|---|---|---|---|
| a | **M06A5** (w toku) → M06A6… ułamek lądu: `erodePangeaBboxLowScoreRim`, `carvePangeaLongSideGulfs`, `rebalanceLandFractionPangea`, `applyLandFractionByContinent`, `rebalanceLandSeaRatio`, `pangeaAnnularMaxCorridorWidth`, `groupDryLandMassKeys`, `isPangeaBridgeWater` | `mapgen/landsea.rs`, `derived.rs` (dopisek) | — |
| b | **REPIN-MAPA** (w toku) | `mapgen/relief.rs`, `terrain_class.rs` | — |
| c | **REPIN-EKONOMIA-A** (w toku) → B (wealth, society-breakdown, culture-religion), C (trade-routes, terrain-improvements, population-growth-v85, relief-preserving-improvements, playerState, units/setup) | `domain/*` ekonomia, `derived.rs` (dopisek) | REPIN-DANE ✔ |
| d | **REPIN-WOJNA-NOWE-A** (w toku) → B (army-consolidation, ai-general-war-campaign), C (ai-move-range, diplomacy-tick-war-brake), potem WOJNA-ZMIANY (forced-war-*, armyMerge, planned-march) | nowe pliki `domain/`, `mod.rs` (dopisek) | A przed B/C |
| e | REPIN-DYPLO, REPIN-AI (osobne tematy, `ai.ts` największe ryzyko), REPIN-ZAPIS-AUDIO | `domain/ai_turn.rs`, `combat.rs`, `civ_matrix.rs`… | WOJNA-NOWE-A…C, EKONOMIA |
| f | P6 mapgen dalej: **M06B**, **M07A–M07E2** (`relief.rs`), potem M08, M13, M18 (`generate.rs`) | `relief.rs` po REPIN-MAPA | REPIN-MAPA, M06A5+ |
| g | **P6.8** miasta: ekonomia/produkcja/budynki/okolica (18 pozycji; najpierw rozpoznanie i podział A/B), P6.9–P6.10 tura gracza, P6.2 walidacja komend | `domain/city*`, `turn*` | EKONOMIA-A/B |
| h | P6.11–P6.19 (AI, walka-logika, dyplomacja, handel, kultura/religia, cuda/tech, państwa-miasta/barbarzyńcy, zwycięstwo), P6.20–P6.22 save/load/replay | `domain/*` | e, g |
| i | P7.1–P7.2, P7.6–P7.7 komendy Tauri/serializacja (bez renderowania) | `src-tauri/**` | stabilny kontrakt (g) |
| j | **K09C**: produkcyjne wywołanie `installCityPanelWiring`, dostawcy reguł hosta z silnika/DTO (`K05bRules`, `K08dRuleHost`, `K08eRuleHost`, `K07bDataProvider`), `panelInputs.k05a` w `get_view`, 14 delegatów K06B, 44 delegaty K07B, test zakładek rekrutacji/kolejki (długi D2, D4, D7–D10, D13, D14); **K09D**: ujednolicenie typów `GameData`/mostu (D5, D11) | `controller/**`, `ui/cityPanel/**` | i (komendy/DTO), g |
| k | REPIN-UI (17 plików, 12 odświeżeń + nowe: `aiOwnerProgressFrame.ts`, `recruitHudLabel.ts`), potem P5 reszta 2D (dialogi, tooltipy, stany), P5.13 kontrakt | `frontend-v2/**` | REPIN 1–4, j |
| l | **Przesunięcie pinu** manifestów na `91dc998a` jednym ruchem | `tools/pin-manifest.json`, wektory `meta.pin`, weryfikator Python p6_4 | REPIN 1–5 |

## 3. Dług techniczny śledzony
Typy `any` w K06B (~75) zamiast DTO; niezależny weryfikator Python p6_4 nieaktualny; `meta.pin` historyczne w wektorach; konflikt-zagrożenie `derived.rs` (równoległe dopiski — scala orkiestrator); logi `*.log` w repo (`git add -f`), pliki wektorów > 10 MB zakazane (limit GitHub 100 MB — incydent M06A4).

## 4. Odłożone (ciężkie 3D / Opus, tylko przy zapasie limitu)
Reszta MOD-xx obiektów/jednostek 3D, ujednolicenie typu drzewa sceny 3D, renderer mapy 3D (P4.6–P4.10 część GPU), REPIN-3D (`battleScene.ts`, `render/**`, część graficzna `main.ts`), RR-T1 spike GPU (maszyna właściciela), P8 porównania wizualne, P10 wydajność, P11 packaging (osobna zgoda właściciela). Limit odnawia się we wtorek 2026-11-03: zapas sprzed odnowienia przeznaczamy na te prace.

## 5. Zasady pętli (uzupełnienie po incydentach)
- Dispatch przed startem; FAIL → ten sam ID; po 5 rundach zamknięcie administracyjne zakresu zrobionego i nowy ID na resztę (precedensy: M06A, M06A3, M06A4, K08B).
- Zakres tematu mały i policzalny (lekcja K08B/K08C: Haiku robi 3–6 jednostek/rundę); „kod pierwszy"; brak „budżetu czasu" jako blokady.
- Integracja: sparse worktree na `origin/rust-port/parity-v2`, merge/cherry-pick (squash, jeśli historia niesie plik > 100 MB), bramki przed pushem, push ff; zawsze `cmd1 && cmd2` przy tworzeniu worktree (błąd `git worktree add` nie może przerzucić poleceń na główny checkout).
- Sprzątanie: worktree i `cargo-target-shared/*` po każdym workflow; nie wołać `git worktree prune` przy aktywnych workflow.
- Nie pytać właściciela o decyzje administracyjne; AskUserQuestion tylko dla genuine decyzji produktowych. Przy pytaniu o postęp podawać etap 1–11 per temat.

## 6. Delta weba po pinie 91dc998a (pomiar 2026-10-30, `origin/main` = `7d7c7d60`)
Od `91dc998a` weszło 96 commitów; kod `gra/src`+`gra/data`: **23 pliki, +1733/−358** (`git diff --stat 91dc998a origin/main -- gra/src gra/data`). Zmienione: `battle/battleScene.ts` (+501, 3D — odłożone), `battle/formationRules.ts` (+85; **już zaportowany w REPIN-WOJNA-NOWE-A** → wymaga odświeżenia), `game/ai.ts` (+74), `game/auto-improvements.ts` (+124; pozycja 8I P6.8), `game/battle-mode.ts`, `game/diplomacy-proposals.ts`, `game/generalQuickFollow.ts` (NOWY, 161), `game/generals.ts` (+50), `game/save.ts` (+5), `game/warAllInCapital.ts` (+220), `main.ts` (+271), UI: `armyMergePanel`, `armyStackHud`, `diplomacyTradeBasket` (+107), `newGameFlow` (kreator), `preBattle`, `unitActionBarHtml`, `empireDetailPanel`, render: `buildHighlight`, `rangeOverlay`, `units`; `units/setup.ts`.
Treść zmian (z `GOAL-LEVEL-11-ALL-OPEN-ISSUES.md` na `main`): poprawki bitewne (zabite jednostki znikają, atak piechoty, atakuj-marszem, łucznicy zbliżają się do zasięgu, kolejka rozkazów), kampania AI wodza (5 tur zbiórki, atak w 6., priorytet ataku morskiego), priorytet jedzenia w auto-budowie (las przy rzece → farmy → hodowla → irygacja), podświetlenie pól ulepszeń (+20%), kreator (udział lądu, rozpatrzenie ofert), wymiana handlowa bezterminowa 1–30 tur, tartak na wzgórzu leśnym, wodz/generał (roster, znaczniki).
Otwarte po stronie weba: `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1` (8/11, wąski follow-up attack-march WSTRZYMANY — brak miejsca na dysku agenta), `R-PERF-LARGE-EMPIRE-STRESS-Q1` (3/11 WSTRZYMANY: 38/100 tur, 39. tura 70 s, RSS ~2 GiB; świadomie ostatni). Reszta 11/11.
Wpływ na port: kolejny REPIN-DELTA-2 (osobny temat, po krokach 1–5 obecnego REPIN) — pin `91dc998a` → nowy; w pierwszej kolejności moduły już w Rust: `formationRules.ts`, `generals.ts`, `ai.ts`, `auto-improvements.ts` (8I), `diplomacy-proposals.ts`, `save.ts`.
