# Plan aktualizacji portu do aktualnej wersji weba (2026-10-30)

Autor: orkiestrator. Podstawa: pomiar `git diff edb8fb56 origin/main -- gra/src gra/data` (`origin/main` = `dc8a3adc`). Poprzednie dokumenty: `REPIN-DELTA-20261029.md` (delta do `91dc998a`), `PLAN-AKTUALIZACJA-20261029-B.md` (kolejka, §6 delta po `91dc998a`).

## 1. Od czego liczymy
Port Rust/Tauri zaczął się od pinu **`edb8fb56`** (pin kopii bajtowych, wektorów z weba i bloków `cityPanel.ts`). Od tego commitu na `main` weszło **186 commitów**; kod `gra/src`+`gra/data`: **101 plików (27 nowych, 74 zmienione), +10 058 / −2 585 linii**. W tym:
- **etap 1 (`edb8fb56`→`91dc998a`)**: 87 commitów, ~100 plików — opisany w REPIN-DELTA, w większości już przeportowany do Rust (REPIN-DANE, LOGIKA-CIV, MAPA, EKONOMIA-A/B/C, WOJNA-NOWE-A/B/C);
- **etap 2 (`91dc998a`→`dc8a3adc`)**: 99 commitów, **23 pliki, +1733/−358** (opis w `PLAN-AKTUALIZACJA` §6): poprawki bitewne (zabite jednostki, atak piechoty, atakuj-marszem, łucznicy, kolejka rozkazów), kampania AI wodza (5 tur zbiórki), priorytet jedzenia w auto-budowie, podświetlenie ulepszeń, kreator nowej gry, wymiana bezterminowa, roster wodza.

## 2. Wniosek: co trzeba zaktualizować
Podział 101 plików wg stanu w porcie (heurystyka cytowań `web:` + wiedza o zintegrowanych tematach):

| Klasa | Pliki | Znaczenie |
|---|---:|---|
| DONE@91dc (zgodne ze starszym pinem) | 19 | przeportowane i zgodne z `91dc998a`; do sprawdzenia tylko, czy etap 2 ich dotknął (np. `formationRules.ts` +85) |
| CZĘŚĆ | 5 | częściowo (B1/B2/B3 ekonomii) |
| TODO / TODO-CZĘŚĆ | 45 | nieprzeportowane lub do odświeżenia istniejącego modułu Rust (AI, wojna, dyplomacja, zapis, ekonomia, society, auto-improvements) |
| UI (frontend-v2) | 18 | kopie bloków pinowanych do `edb8fb56` + nowe pliki UI; m.in. `cityPanel.ts` (+259/−73) |
| ODŁOŻONE 3D | 14 | `battleScene.ts` (+610/−192), `render/*` — wspólny temat REPIN-3D na koniec |

**Skutki dla już zrobionych prac (do ponownego otwarcia):**
1. `formation_rules.rs` (WOJNA-NOWE-A) — `formationRules.ts` +85 po `91dc998a`: odświeżenie wektorów i kodu.
2. `economy`/`turn-economy`/`production` — częściowe porty (B1–B3) — reszta hunków w P6.8 i REPIN-D; etap 2 dotyka `auto-improvements.ts` (priorytet jedzenia) w 8I.
3. Bloki panelu miasta K01–K09 (kopie pinu `edb8fb56`) — `cityPanel.ts` zmienił się o +259/−73; wcześniejszy pomiar dryfu K08A–K09A względem `origin/main` dał 0 zmian w zakresie bloków, ale trzeba **zmierzyć wszystkie bloki K01–K09 względem `dc8a3adc`**.
4. Wektory M04/M05/M16/p6_23 i `meta.pin` — tylko część regenerowana z `91dc998a` (M16 tak, p6_7a `edge`/`post_central`/`params` nie); po ruchu pinu wszystko musi iść z jednego pinu.
5. Moduły renderera bitwy (P4.36 Q1–Q5) — pin `edb8fb56`, `battleScene.ts` zmienił się o +610/−192 (nowy atakuj-marszem, usuwanie zabitych, kolejka rozkazów): drift tylko do pomiaru, port w REPIN-3D.
6. Weryfikatory Python p6_23/m16/p6_4 mają starą formułę; generatory mają literał pinu.

## 3. Plan aktualizacji (fazy)
**Faza U0 — pomiar (dokumentacja, bez zmian kodu):** `R-RUSTPORT-REPIN-DELTA-2-Q1` — dla 23 plików etapu 2 i dla plików etapu 1, które nadal są TODO: lista hunków behawioralnych (plik:linia), przypisanie do modułu Rust/UI i do tematu poniżej; pomiar dryfu bloków K01–K09 i kopii bajtowych frontend-v2 względem `dc8a3adc` (narzędzia `measure-k0*-drift.mjs`); sprawdzenie, które wektory/meta.pin wymagają regeneracji.
**Faza U1 — domknięcie etapu 1 (trwa):** M06B1–B2 (mapgen), P6.8A–J (miasta/ekonomia), REPIN-EKONOMIA-D/E, WOJNA-NOWE-D (generals, generalQuickFollow, battle-mode, formationRules refresh, war-rules-multiwar, warAllInCapital), REPIN-DYPLO (diplomacy-*), REPIN-AI (ai.ts, ai-city-capture-executor, forced-war-*), REPIN-ZAPIS (save, save-presence, fsa-autosave, audio).
**Faza U2 — etap 2 w tych samych tematach:** każdy temat z U1 dostaje w dispatchu pin docelowy **`dc8a3adc`** (a nie `91dc998a`), żeby nie portować dwa razy; tematy już zintegrowane (A/B/C WOJNA, EKONOMIA-A/B/C) odświeżane osobnymi partiami „delta etapu 2" (tylko hunki z U0).
**Faza U3 — UI:** REPIN-UI-2 (18 plików frontend-v2: `empireDetailPanel`, `newGameFlow`, `unitRecruitCard`, `armyMergePanel`, `armyStackHud`, `diplomacyTradeBasket`, `preBattle`, `diploListHud`, `diplomacyAudience`, `unitReplacePicker`, `hud`, `unitActionBarHtml`, `aiOwnerProgressFrame`, `recruitHudLabel`, adaptery kart), odświeżenie kopii bloków K01–K09 po pomiarze dryfu, potem K09C/K09D (podpięcie produkcyjne).
**Faza U4 — ruch pinu (jeden ruch):** `tools/pin-manifest.json`, `verify-pin-copies`, `meta.pin` wektorów, generatory (literały), weryfikatory Python; pełna regeneracja wektorów z `dc8a3adc` (lub nowszego `main` w chwili startu U4) z 0 rozbieżności; pełne bramki.
**Faza U5 — 3D (na koniec, Opus, przy zapasie limitu):** REPIN-3D (`battleScene.ts`, `render/*`, część graficzna `main.ts`), moduły renderera P4.36, RR-T1.

## 4. Zasady
- Jeden pin docelowy dla wszystkich otwartych tematów (`dc8a3adc` albo nowszy z U4); web nadal rośnie — przed U4 powtórzyć pomiar (`git rev-list --count`).
- Każdy nowy temat portu cytuje `web:` plik:linia z pinu docelowego; wektory z uruchomionego weba w tym pinie.
- Limit 2 równoległych workflow z Rustem; tematy dokumentacyjne (bez cargo) mogą działać dodatkowo; sprzątanie worktree po etapie (nie usuwać worktree o ID wznowionego workflow).
- Zmiany tylko w `rust-port/**`, `src-tauri/**`, `dyspozycje/**`; zero zmian w `gra/**`.

## 5. Tabela wszystkich 101 plików
| Plik (web) | +/− od `edb8fb56` | po `91dc998a` | Stan w porcie | Temat aktualizacji |
|---|---|---|---|---|
| `src/main.ts` | +2999/−479 | TAK | TODO (podział: logika walki/UX vs 3D) | REPIN-MAIN (rozdzielić) + REPIN-3D |
| `src/game/warAllInCapital.ts` | +859/−0 | TAK | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) |
| `src/battle/battleScene.ts` | +610/−192 | TAK | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `data/civs.json` | +180/−489 | — | DONE@91dc (DANE) | — |
| `src/game/ai.ts` | +468/−130 | TAK | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) |
| `src/ui/cityPanel.ts` | +259/−73 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/economy.ts` | +116/−213 | — | TODO | REPIN-EKONOMIA-D + P6.8F |
| `src/game/production.ts` | +216/−55 | — | CZĘŚĆ@91dc (B2: 3,7,8–14) | P6.8A/B/C |
| `src/game/turn-economy.ts` | +95/−164 | — | CZĘŚĆ@91dc (B1,B3 helpery) | P6.8F + REPIN-D (tick) |
| `src/ui/empireDetailPanel.ts` | +94/−165 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/war-rules-multiwar.ts` | +249/−0 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) |
| `src/ui/newGameFlow.ts` | +158/−68 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/diplomacy-tick-war-brake.ts` | +216/−0 | — | DONE@91dc | — |
| `src/game/civ-bonuses.ts` | +106/−98 | — | DONE@91dc | — |
| `src/game/army-consolidation.ts` | +177/−0 | — | DONE@91dc | — |
| `src/game/diplomacy-sensible-deals.ts` | +170/−0 | — | TODO | P6.14 DYPLO |
| `src/game/ai-general-war-campaign.ts` | +164/−0 | — | DONE@91dc | — |
| `src/ui/unitRecruitCard.ts` | +124/−38 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/generalQuickFollow.ts` | +161/−0 | TAK | TODO (nowe/zmienione po pinie 91dc) | WOJNA-2 |
| `src/battle/formationRules.ts` | +160/−0 | TAK | DONE@91dc, +85 po pinie | WOJNA-2 (refresh formation_rules.rs) |
| `src/game/civ-matrix-semantic.ts` | +91/−43 | — | DONE@91dc | — |
| `src/game/auto-improvements.ts` | +123/−5 | TAK | TODO (+123 po pinie; priorytet jedzenia) | P6.8I + REPIN-AUTOIMPR |
| `src/game/manpower.ts` | +80/−48 | — | CZĘŚĆ@91dc | EKONOMIA-C6/B4 |
| `src/ui/armyMergePanel.ts` | +99/−20 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/save-presence.ts` | +118/−0 | — | TODO | REPIN-ZAPIS (P6.20–22) |
| `src/render/units.ts` | +72/−46 | TAK | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/game/forced-war-common.ts` | +99/−15 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) |
| `src/game/ai-move-range.ts` | +112/−0 | — | DONE@91dc | — |
| `src/ui/diplomacyTradeBasket.ts` | +92/−15 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/generals.ts` | +103/−0 | TAK | TODO (nowe/zmienione po pinie 91dc) | WOJNA-2 |
| `src/game/work-tax.ts` | +77/−0 | — | TODO | REPIN-EKONOMIA-D + P6.8F |
| `src/render/cities.ts` | +70/−4 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/render/transientObjectResources.ts` | +68/−0 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/game/civ-ai-data.ts` | +32/−34 | — | DONE@91dc | — |
| `src/game/culture-religion.ts` | +43/−21 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `src/game/ai-era-unit-promotion.ts` | +63/−0 | — | DONE@91dc | — |
| `src/game/army-leadership.ts` | +63/−0 | — | DONE@91dc | — |
| `src/render/memDebug.ts` | +59/−0 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/game/fsa-autosave.ts` | +55/−1 | — | TODO | REPIN-ZAPIS (P6.20–22) |
| `src/game/trade-routes.ts` | +42/−13 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `src/game/barbarians.ts` | +49/−3 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `src/ui/armyStackHud.ts` | +43/−8 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/diplomacy-proposals.ts` | +41/−8 | TAK | TODO | P6.14 DYPLO |
| `src/ui/preBattle.ts` | +38/−7 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/ui/diploListHud.ts` | +44/−0 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/population-growth-v85.ts` | +37/−6 | — | CZĘŚĆ@91dc | EKONOMIA-C6/B4 |
| `src/map/gen-helpers.ts` | +24/−16 | — | DONE@91dc (FIFO bez portu) | — |
| `src/game/cluster-start.ts` | +35/−1 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `src/render/unitVeteranBadges.ts` | +36/−0 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/game/society-breakdown.ts` | +33/−0 | — | TODO | P6.8J |
| `src/game/ai-city-capture-executor.ts` | +31/−1 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) |
| `src/game/diplomacy-layers.ts` | +32/−0 | — | TODO | P6.14 DYPLO |
| `src/game/dirtyRenderSync.ts` | +31/−0 | — | TODO | REPIN-ZAPIS (P6.20–22) |
| `src/render/buildHighlight.ts` | +28/−0 | TAK | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `data/ui-params.json` | +26/−0 | — | DONE@91dc (DANE) | — |
| `src/game/retained-side-panel-events.ts` | +26/−0 | — | TODO | REPIN-ZAPIS (P6.20–22) |
| `src/game/diplomacy-ai-offer-balance.ts` | +24/−1 | — | TODO | P6.14 DYPLO |
| `src/game/order.ts` | +23/−2 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `data/econ-params.json` | +12/−12 | — | DONE@91dc (DANE) | — |
| `data/diplomacy-tick-params.json` | +22/−0 | — | DONE@91dc (DANE) | — |
| `src/game/terrain-improvements.ts` | +15/−7 | — | DONE@91dc | — |
| `src/ui/diplomacyAudience.ts` | +4/−17 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/wealth.ts` | +20/−0 | — | DONE@91dc (8D) | P6.8D r3 (mutacje graniczne) |
| `src/ui/unitReplacePicker.ts` | +18/−2 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/planned-march.ts` | +15/−4 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `data/army-consolidation-params.json` | +17/−0 | — | DONE@91dc (DANE) | — |
| `data/war-allin-params.json` | +17/−0 | — | TODO (dane nowych modułów) | P6.11–12 AI / WOJNA-2 |
| `src/game/forced-war-iron.ts` | +15/−2 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) |
| `src/ui/aiOwnerProgressFrame.ts` | +16/−0 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/battle-mode.ts` | +14/−0 | TAK | TODO (nowe/zmienione po pinie 91dc) | WOJNA-2 |
| `src/ui/unitActionBarHtml.ts` | +11/−2 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/game/diplomacy-resource-trade-pick.ts` | +10/−2 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `src/game/save.ts` | +11/−1 | TAK | TODO | REPIN-ZAPIS (P6.20–22) |
| `src/game/relief-preserving-improvements.ts` | +5/−6 | — | TODO | P6.8I / EKONOMIA-E |
| `src/render/unitStatPlate.ts` | +5/−5 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/ui/hud.ts` | +8/−2 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `data/war-rules-params.json` | +9/−0 | — | TODO (dane nowych modułów) | P6.11–12 AI / WOJNA-2 |
| `data/units.json` | +4/−4 | — | DONE@91dc (DANE) | — |
| `src/game/playerState.ts` | +1/−7 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `src/ui/entityCards/improvementAdapter.ts` | +7/−1 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/audio/filePlayer.ts` | +4/−3 | — | TODO (audio) | REPIN-ZAPIS-AUDIO |
| `src/render/kopalnia-cyny-opus5.ts` | +4/−3 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/render/kopalnia-zlota-opus5.ts` | +4/−3 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/data/loader.ts` | +4/−2 | — | TODO (dane) | REPIN-DANE-2 |
| `src/game/combat.ts` | +4/−2 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `src/game/diplomacy-sensible-deals.config.json` | +6/−0 | — | TODO | P6.14 DYPLO |
| `src/ui/entityCards/buildingAdapter.ts` | +3/−3 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/ui/recruitHudLabel.ts` | +5/−0 | — | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |
| `src/audio/muzyka-antyczna.ts` | +2/−2 | — | TODO (audio) | REPIN-ZAPIS-AUDIO |
| `src/game/embarkation.ts` | +2/−2 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `src/render/braz-rydwan-woly-opus5.ts` | +2/−2 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/units/setup.ts` | +4/−0 | TAK | CZĘŚĆ | EKONOMIA-E (units/setup) |
| `src/game/armyMerge.ts` | +3/−0 | — | TODO/CZĘŚĆ (odświeżenie istniejącego modułu Rust) | REPIN-AI / DYPLO / EKONOMIA-E |
| `src/render/bronzeCityRoblox.ts` | +2/−1 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/render/rangeOverlay.ts` | +2/−1 | TAK | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/render/stoneCityRoblox.ts` | +2/−1 | — | ODŁOŻONE 3D | REPIN-3D (na koniec, Opus) |
| `src/data/wikiBundle.json` | +1/−1 | — | TODO (dane) | REPIN-DANE-2 |
| `src/game/diplomacy-peace-lock.ts` | +1/−1 | — | TODO | P6.14 DYPLO |
| `src/game/forced-war-bronze.ts` | +1/−1 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) |
| `src/game/forced-war-stone.ts` | +1/−1 | — | TODO (brak odpowiednika w Rust) | P6.11–12 AI (REPIN-AI-2) |
| `src/ui/diplomacyNegotiationModal.ts` | +2/−0 | TAK | UI (frontend-v2) | REPIN-UI-2 + pomiar dryfu kopii K01–K09 |

## Dopisek 2026-10-30 (pomiar `origin/main` = `7164f7ca1`)
- Od pinu `dc8a3adc`: **3 commity**, 4 pliki w `gra/` (+147/−15), wszystkie KLASY UI, zero zmian reguł silnika:
  - `4f0e92ec6` fix(ui): `gra/src/ui/hexContextTooltip.ts` — pole `commanderTitle?: 'Wódz' | 'Generał'` w `stackCards`, karta dowódcy (klasa `.commander`, `data-commander`, etykieta „★ Wódz/Generał”, „Wybrana jednostka: Wódz — …”) + CSS;
  - `gra/src/ui/newGameFlow.ts` (+36/−12): zwinięte parametry cywilizacji w kreatorze nowej gry;
  - testy web: `army-stack-commander-identity-test.cjs`, `newgame-bottom-navigation-test.cjs`;
  - `2bbb19238` deploy(robocza), `7164f7ca1` docs(release) — bez kodu.
- Skutek dla portu: dopisać do **U3 / REPIN-UI-3**: re-kopia `hexContextTooltip.ts` i `newGameFlow.ts` do `src-tauri/frontend-v2/src/ui/` (kopie rozjadą się z pinem), `verify-pin-copies` na nowy pin, dom-harness dla karty dowódcy. Powiązanie z silnikiem: `commanderTitle` pochodzi z danych generała (generals.rs, zintegrowane) — nie liczyć w UI (P5.13).
- Nowy pin docelowy po U4: `7164f7ca1` (lub nowszy; powtórzyć `git rev-list --count dc8a3adc..origin/main`).
