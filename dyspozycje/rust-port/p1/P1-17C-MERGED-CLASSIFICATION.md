# P1.17C — Zbiorcza klasyfikacja REUSE/ADAPT/REPLACE/UNKNOWN: `gra/src` (game + ui)

**Temat:** `R-RUSTPORT-P1-17C-MERGED-CLASSIFICATION-Q1` · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium) · **Obrona R1** (zarzuty 3: uzasadnienia verbatim)

**Źródła (read-only, bez zmiany etykiet):**
- `dyspozycje/rust-port/p1/P1-17-RUST-CLASSIFICATION.md` (game, 183 wiersze)
- `dyspozycje/rust-port/p1/P1-17B-UI-CLASSIFICATION.md` (ui, 117 wierszy)

**Pin:** web `main` = `edb8fb56`; Rust `rust-port/parity-v2` = `9e33fc77`; front Tauri `autobot/real24-staging` = `78d494c7` (zgodnie z P1-17 / P1-17B).

**Metoda scalenia:** zliczenie etykiet w obu plikach (wiersze `gra/src/game/` i `gra/src/ui/`), potem skopiowanie verbatim wierszy nie-UNKNOWN ze skryptu odczytującego pliki źródłowe. Żadna etykieta nie została przeliczona od nowa.

## 1. Tabela zbiorcza (liczby)

| Zakres | REUSE | ADAPT | REPLACE | UNKNOWN | Razem |
|---|---:|---:|---:|---:|---:|
| game (`gra/src/game`) | 0 | 8 | 6 | 169 | 183 |
| ui (`gra/src/ui`) | 0 | 6 | 4 | 107 | 117 |
| **Razem (`gra/src`)** | **0** | **14** | **10** | **276** | **300** |

Kontrola sumy: 0 + 14 + 10 + 276 = 300. Zgodne z kryterium.

**Uwaga o liczbie pozycji nie-UNKNOWN:** dispatch podaje 24 (P1.17) + 10 (P1.17b) = 34. Liczenie w plikach źródłowych daje 14 (game) + 10 (ui) = **24**. Liczba 24 jest w tym pliku pełna i zweryfikowana. Liczby 34 nie uzupełniano na siłę wierszami UNKNOWN, bo to zmieniałoby etykiety wbrew regule anty-halucynacyjnej.

## 2. Lista wszystkich pozycji nie-UNKNOWN (24 z 300)

Kolumna „Uzasadnienie” to tekst **verbatim** z wiersza źródłowego (P1-17 dla game, P1-17B dla ui; numer wiersza w kolumnie „Wiersz źródła”). Etykiety skopiowane bez zmian.

| # | Źródło | Wiersz źródła | Plik | Etykieta | Moduł Rust / odpowiednik | Uzasadnienie (verbatim) |
|---:|---|---:|---|---|---|---|
| 1 | game | 35 | `gra/src/game/ai.ts` | ADAPT | `rust-port/engine/src/domain/ai_turn.rs` | Obie strony to czysta logika tury AI; ai_turn.rs:1-12 zwraca komendy z niemutowalnego snapshotu, a ai_turn.rs:102 ma Desert=2 zgodnie z web (`gra/data/terrain-movement.json`, Pustynia=2), ale web ai.ts (6054 l., 107 eksportów) ma moduły nieobecne w Ruście (forced-war, dyplomacja, budowa) — wymaga zmian. |
| 2 | game | 42 | `gra/src/game/auto-battle-power.ts` | ADAPT | `rust-port/engine/src/domain/combat.rs` | combat.rs:296-300 (opis progu strat 25%/75% przy wyrównanej sile) i combat.rs:433-447 (`loss_fractions`, clamp 0.10–0.25) ma rozstrzygnięcie auto-walki i ograniczone straty, co odpowiada werdyktowi i stratom na mocy M w web; wymaga przeliczenia na kanon web v2b i danych auto-battle-params. |
| 3 | game | 45 | `gra/src/game/barbarians.ts` | ADAPT | `rust-port/engine/src/domain/barbarians.rs` | barbarians.rs:13 `BARBARIAN_OWNER_ID=-1` = barbarians.ts:49; barbarians.rs:73-75 Tundra nieprzejezdna zgodnie z web 'Polarny':99 (poprawka 9e33fc77); brak w Ruście kosztu split/camp, pojemności obozu per poziom trudności i sea-barb (barbarians.ts:439-618) — ADAPT. |
| 4 | game | 52 | `gra/src/game/building-stock-cost.ts` | ADAPT | `rust-port/engine/src/domain/building_costs.rs` | Zbieżna struktura i moment pobrania: building_costs.rs:5-15 (`resource_cost` = pobór raz przy kolejkowaniu, poza regułą 50% Pracy) vs building-stock-cost.ts:2-8 (koszt pobierany raz przy starcie budowy). Dane zweryfikowane 1:1 z web: stolarnia kosztBudowy 20 / przyrost 10 / drewno 25 (buildings.json:56-57 ↔ building_costs.rs:122); kuznia 30 / 10 / drewno 30 + kamien 30 (buildings.json:150-152 ↔ building_costs.rs:124); odlewnia_brazu 28 / 10 / drewno 30 + kamien 40 (buildings.json:198-200 ↔ building_costs.rs:125). NIEZWERYFIKOWANE: źródło pobrania — web header (building-stock-cost.ts:2-8) mówi o magazynie państwa (suma City.surowce, przykład `cegla`), a drewno/kamien z buildings.json nie mają potwierdzonego źródła w City.surowce; w building_costs.rs brak pola magazynu państwa. Brak skalowania r-stawki po stronie Rust (web: `scaleStockCostRecord`, building-stock-cost.ts:1) — ADAPT. |
| 5 | game | 57 | `gra/src/game/city-defense.ts` | ADAPT | `rust-port/engine/src/domain/combat.rs` | Ten sam mechanizm (addytywny bonus obrony miasta w oblężeniu): combat.rs:227-237 `structure_defense_multiplier` (wall +200%, fort +100%, outpost +50%), ale web city-defense.ts:2-13 ma Palisada/Mury/Cytadela/Baszta z miasto-params.json — inny zestaw budowli i wartości, do zmiany. |
| 6 | game | 73 | `gra/src/game/combat.ts` | REPLACE | `rust-port/engine/src/domain/combat.rs` | Model sprzeczny: combat.rs:252-298 `effective_strength` = attack×hp×morale×counter×terrain×structure oraz straty wg reguły 25%/75% z clampem 0.10–0.25 (combat.rs:433-447; rozstrzygnięcie w combat.rs:301), a web combat.ts:440-478 to TW v3 (hitChanceTw/damageTw, pancerz/przebicie/szarża) z bonusami cywilizacji/budynków/weteranów — adaptacja nie wystarczy, przepisać. |
| 7 | game | 111 | `gra/src/game/diplomacy.ts` | ADAPT | `rust-port/engine/src/domain/diplomacy.rs` | Zgodne stałe: diplomacy.ts:7-8 Relacja = Zaufanie+Respekt (0–200) i diplomacy.rs:4-7 MAX_TRUST/MAX_RESPECT=100, MAX_RELATION_SCORE=200; wojna WAR_RELATION_SCORE_CAP=29 w obu (diplomacy.ts:1049). Web ma dalsze warstwy (credibility, PN, start 20/30 w diplomacy.ts:180), których Rust nie weryfikuje — ADAPT. |
| 8 | game | 137 | `gra/src/game/improvement-tech.ts` | ADAPT | `rust-port/engine/src/domain/improvements.rs` | improvements.rs:213-230 `qualifies` / `can_build_improvement` dają kwalifikację ulepszenia po typie terenu (odpowiednik gate terenowego); brak w Ruście bramki technologicznej i wycinki lasu z improvement-tech.ts — ADAPT. |
| 9 | game | 151 | `gra/src/game/playerState.ts` | REPLACE | `rust-port/engine/src/domain/player.rs` | player.rs:1-29 to tożsamość gracza (id + nazwa, bez stanu); playerState.ts:2-6 to globalny stan runtime (skarb, auto-badania). Rust nie ma odpowiednika stanu, przepisać. |
| 10 | game | 157 | `gra/src/game/population-growth-v85.ts` | REPLACE | `rust-port/engine/src/domain/city_growth.rs` | city_growth.rs:1-6, 12-14 to model kanoniczny (cap 5/8/12, próg 20+16·pop), a web population-growth-v85.ts:2-3 to racje żywności Wyżywienie 0–6 krok 0,5 — inny model wzrostu, przepisać. |
| 11 | game | 173 | `gra/src/game/save.ts` | REPLACE | `rust-port/engine/src/domain/save_load.rs` | save_load.rs:1-8 to wersjonowany snapshot {version, state, rng} (v1/v2), a save.ts:2-6 serializuje cały stan web z IndexedDB; format Rust nie zawiera pól web (np. meta.forcedWarWavesByPairKey, AUDYT-ARCHIWUM §3/§5) — P2.7 wymaga nowego kontraktu. |
| 12 | game | 187 | `gra/src/game/terrain-improvements.ts` | REPLACE | `rust-port/engine/src/domain/resource_production.rs` | web terrain-improvements.ts:2-4 liczy plony hexa z 15 typów z terrain-improvements.json (pola: żywność/praca/handel/pieniądz/kamień/drewno), a resource_production.rs:118-130 (`resolve_resource_production`, 9 ramion: `tartak` = (Wood, 200) w :121, `kopalnia_zlota` w :129; klucze normalizacji :77-89) ma zakodowaną tabelę 9 kluczy z jedną wartością surowca na ulepszenie (struktury wyniku :45-55 są tylko typami) — inny model danych, przepisać na źródle JSON. |
| 13 | game | 188 | `gra/src/game/trade-routes.ts` | ADAPT | `rust-port/engine/src/domain/trade.rs` | trade.rs:1-4 deklaruje ten sam kontrakt co web (trasy jako stan pochodny, walidacja + dochód z tras, funkcje czyste); trade-routes.ts:1-6 (E2 wykrywanie połączeń, E3 dochód) — pokrycie częściowe, reguły dochodu do porównania. |
| 14 | game | 190 | `gra/src/game/turn-economy.ts` | REPLACE | `rust-port/engine/src/domain/turn_economy.rs` | turn_economy.rs:1-15 to rozliczenie skarbca (credit → spend → reset Pracy), podczas gdy web turn-economy.ts:2-3 to adapter plonów per miasto (per-turn tick miast), a turn-economy.ts:22 potwierdza brak skarbca w runtime (cytat: „There is no Player/treasury/science runtime state yet”); kontrakt tury jest inny, Rust nie zawiera budynków/utrzymania. |
| 15 | ui | 44 | `gra/src/ui/bottomBarHud.ts` | ADAPT | front Tauri (`78d494c7`, P1-17B §4 wiersz 8) | Tauri ma jeden przycisk `#end-turn` („Zakończ turę”, `renderSidebar`). Brak akcji WYKONAJ i reszty dolnego paska [I]/[I2] z pliku. |
| 16 | ui | 45 | `gra/src/ui/brandTokenVars.ts` | REPLACE | front Tauri (`78d494c7`, P1-17B §4 wiersz 9) | Ta sama rola (warstwa tokenów CSS dla menu/kreatora), inne źródło i wartości. Tauri `index.html` `:root` ma własne tokeny o innych nazwach i wartościach niż kanon brand-book `gra/src/ui/icons/brand/tokens.css` (FROZEN v1.0): `--gold-dim #a8904c` vs `--tg-gold-dim #a08030`; `--muted #a7a6a1` vs `--tg-text-muted #8a8070`; `--text #edf2f7` vs `--tg-text-primary #e8e0c8`; `--bg-panel rgba(18,18,26,.94)` vs `--tg-panel-bg #121820`. Komentarz `index.html` l.38 sam mówi „compact web-parity equivalent, without importing the web bundle”, czyli nie jest to kanon. Dowód niezależny od komentarza nagłówkowego web (odwołanie do „decyzji 1B/2C/4C/5C” nie jest podstawą etykiety). |
| 17 | ui | 53 | `gra/src/ui/cityPanel.ts` | ADAPT | front Tauri (`78d494c7`, P1-17B §4 wiersz 17) | POKRYCIE CZĘŚCIOWE, ZAWĘŻONE: Tauri `#capital-card` pokazuje tylko nazwę stolicy, właściciela i pozycję (`renderSidebar`, linie 702-704). To ułamek pliku: 11986 linii web obejmuje produkcję, budynki, okolicę miasta i sekcje (`paintCityPanelSections`, `showCityPanel` itd.); żadna z tych części nie ma odpowiednika w Tauri. Etykieta ADAPT oznacza wyłącznie tę kartę stolicy. |
| 18 | ui | 87 | `gra/src/ui/gamePauseMenu.ts` | ADAPT | front Tauri (`78d494c7`, P1-17B §4 wiersz 51) | Tauri ma tylko `#return-menu` („Wróć do menu”). Brak zapisu, wczytania i nowej gry z menu w trakcie gry. |
| 19 | ui | 91 | `gra/src/ui/hud.ts` | ADAPT | front Tauri (`78d494c7`, P1-17B §4 wiersz 55) | Tauri ma tylko `#turn-number`, `#phase-label`, `#game-status` w `#game-screen`. Brak górnego paska zasobów, minimapy i panelu bocznego HUD web. |
| 20 | ui | 105 | `gra/src/ui/mainMenu.ts` | ADAPT | front Tauri (`78d494c7`, P1-17B §4 wiersz 69) | Tauri `#main-menu` ma Start/Wczytaj/Ustawienia/Więcej/O grze/Wyjście; Wczytaj i Kontynuuj są `disabled`; Ustawienia otwierają generyczny panel tekstowy (`showMenuPanel`). Brak ekranu ustawień web. |
| 21 | ui | 106 | `gra/src/ui/mapLoadingOverlay.ts` | ADAPT | front Tauri (`78d494c7`, P1-17B §4 wiersz 70) | Tauri krok „Generowanie” (`renderGenerating`) pokazuje komunikat błędu i „Spróbuj ponownie”. Brak panelu postępu generacji mapy web (postęp nie zweryfikowany w tej rundzie). |
| 22 | ui | 114 | `gra/src/ui/newGameFlow.ts` | REPLACE | front Tauri (`78d494c7`, P1-17B §4 wiersz 78) | Tauri kreator (kroki intro/epoka/cywilizacja/ustawienia/generowanie) opiera się na sztywnych tablicach `EPOCHS` (3 pozycje: kamien, braz, zelazo) i `CIVILIZATIONS` (podzbiór). Web kreator jest sterowany danymi (2373 linii). |
| 23 | ui | 145 | `gra/src/ui/unitInfoCard.ts` | REPLACE | front Tauri (`78d494c7`, P1-17B §4 wiersz 109) | Ta sama stubowa karta `#unit-card` (stała etykieta „Wojownik”). Karta informacyjna web (T4) pokazuje dane jednostki z danych gry, czego Tauri nie robi. |
| 24 | ui | 148 | `gra/src/ui/unitPanelHud.ts` | REPLACE | front Tauri (`78d494c7`, P1-17B §4 wiersz 112) | Tauri `#unit-card` to stub: etykieta na stałe „Wojownik”, tylko id/pozycja/ruch, bez akcji jednostki (`renderSidebar`, linie 705-707). |

## 3. Podsumowanie dla właściciela

Realistycznie około **8% `gra/src` (24 z 300 plików)** ma dziś jakikolwiek częściowy lub niepełny odpowiednik w istniejącym kodzie Rust/Tauri (ADAPT/REPLACE), a **0%** nadaje się do REUSE 1:1; pozostałe **92% (276 plików)** to UNKNOWN, czyli brak odpowiednika albo brak zweryfikowanego dowodu. Zastrzeżenie: część wierszy UNKNOWN ma pokrycie częściowe w Ruście (np. `economy.ts`, `siege.ts`, `unit-power.ts`), ale według reguł P1.17/P1.17B nie została tam przyznana etykieta.

## 4. Zastrzeżenia

- Scalenie nie zmienia żadnej etykiety; źródłowe pliki P1.17 i P1.17B nie zostały zmodyfikowane.
- Liczba 34 z dispatchu jest błędna względem plików źródłowych (poprawna: 24). Wymaga decyzji orkiestratora przy zamykaniu tematu.
