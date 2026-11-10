# P6.7A - miasta: wzrost ludnosci, czesc A (`population-growth-v85.ts`, `growth-happiness.ts`, `population-growth-tempo.ts`, `r-stawki-strojenie.ts`, `empire-food.ts`)

Temat: `R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1` (DOMAIN: GAME), runda 2/5, rola Operator (obrona po FAIL Evaluatora r1; commit r1 `af5426f0`; Sonnet 5.5; rozstrzygniety wyjatek rust-port R-PROC-AUTOBOT.md §5a).
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` @ `c4fa31a2` (>= `c4fa31a2` wg dispatchu; silnik 1054 testy przed zmiana).
Artefakty runu (generatory, loader, weryfikator Python, mutacje, tabela symboli, logi bramek): `dyspozycje/autobot/runs/R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1/`.

## 0. Obrona rundy 2: odpowiedzi na zarzuty Evaluatora r1 (7 zarzutow)

Kazdy zarzut ma werdykt PRZYJMUJE (poprawka + dowod) albo ODRZUCAM (dowod). Surowe, pelne logi bramek r2: §12 oraz `gate-fmt-r2.log`, `gate-clippy-r2.log`, `gate-test-r2.log` (katalog runu). Mutacje r2: §6.3 i `mutation-evidence-r2.txt`.

| # | Zarzut | Werdykt | Poprawka / dowod |
|---|---|---|---|
| 1 | Mutant [16] (`g: macierz - glod bez max`: usuniecie `js_max(0.0, ...)` w `hunger_loss_multiplier`) przezyl; w prawdziwym `civ-matrix.json` `lud_spadek_proc` = `lud_zdrowie_proc` = 0 dla kazdej cywilizacji, wiec galaz `1 + x < 0` jest nieosiagalna; ta sama luka dla `health_growth_multiplier` | PRZYJMUJE | Wektory z macierza SYNTETYCZNA z URUCHOMIONEGO weba: generator `gen-p67a-vectors.mjs` sekcja (e) zmienia W MIEJSCU `loadCivMatrix()` (ta sama referencja co w `civ-matrix.ts`; zero stubow logiki weba: wola prawdziwe `resolvePopulationMatrixForCiv` i `resolvePopulationCapMatrixDelta`), 40 patchy (`lud_spadek_proc`/`lud_zdrowie_proc` w {-3, -2, -1.5, -1, -0.999, -0.5, 0, 0.25, 0.5, 1, 1.5, 2}, `lud_zadowolenie_bazowe`, `lud_limit_populacji` w {-2..4}; 2-5 wierszy cywilizacji + `defaults`) x (4 klucze na zmieniony wiersz: `ikonaId`, `typCywilizacji`, `Cywilizacja`, `ikonaId` wielkimi literami; + `nieznana`, `''`, `undefined`) = 724 przypadki (1449 porownan: wynik macierzy + `capDelta` = 1448, plus 1 kontrola osiagniecia galezi) w `edge.json::matrixSynth`, z czego 236 przypadkow ma `hungerLossMultiplier` albo `healthGrowthMultiplier` rowne 0 (galaz klamry osiagnieta); po kazdym patchu macierz jest przywracana. Rust: `resolve_population_matrix_for_civ_in(&CivMatrixFile, Option<&str>)` i `resolve_population_cap_matrix_delta_in` (wersje bez `_in` deleguja do nich z wbudowana macierza); test `p6_7a_growth::population_matrix_synthetic_matches_web` nakłada ten sam patch na kopie `load_civ_matrix().file` i porownuje bitowo + `assert!(reached_negative > 0)` (galaz klamry rzeczywiscie osiagnieta). Weryfikator Python: `matrixSynth` 1449 porownan, 0 rozbieznosci; zepsuty wektor -> exit 1 (§12.6). Wynik mutacji: WYKRYTY [16] g: macierz - glod bez max -> 1 testow czerwonych: population_matrix_synthetic_matches_web; WYKRYTY [156] g: macierz - zdrowie bez max -> 1 testow czerwonych: population_matrix_synthetic_matches_web; WYKRYTY [157] g: macierz - glod zamiast zdrowia -> 1 testow czerwonych: population_matrix_synthetic_matches_web; WYKRYTY [158] g: macierz - delta cap z innego klucza -> 3 testow czerwonych: population_matrix_matches_web, population_matrix_synthetic_matches_web, post_central_growth_matches_web (3 nowe mutanty: klamra zdrowia, zamiana zrodla parametru zdrowia, `population_cap_delta` zerowany). |
| 2 | Mutant [124] (`p: oblegane miasto`: usuniecie `if econ.per_city[tick_index].oblegany { continue; }` w `apply_post_central_population_growth`) przezyl; galaz `oblegany` bez pokrycia | PRZYJMUJE | `gen-p67a-vectors.mjs` sekcja (d): `edge.postCentralSiege` = 40 scenariuszy `postCentralScenario(false, true)` (miasta OBLEZONE po zlozeniu migawki centrali: web liczy `oblegany` w `recomputeCityFoodBalancesInEcon`), wektory z URUCHOMIONEGO `applyPostCentralPopulationGrowth`; test `post_central_growth_matches_web` laczy `scenarios` + `postCentral` + `postCentralSiege`; weryfikator: `postCentral` 720 porownan (+160 z `postCentralSiege`), 0 rozbieznosci; 123 tiki `oblegany` w 40 scenariuszach `postCentralSiege`. Wynik: WYKRYTY [124] p: oblegane miasto -> 1 testow czerwonych: post_central_growth_matches_web. |
| 3 | "PORTOWANY ... mutacje wykrywane" niespelnione: 57 z 157 mutantow nigdy nie uruchomiono; pelny test set nie przebiegl; probka 9 dala 2 prawdziwych przezylych (~22%) | PRZYJMUJE | Uruchomiono WSZYSTKIE 57 dotad nieuruchomionych mutantow (lista z `mutation-notes-r1.txt`: 12, 15, 16, 23, 27, 29, 30, 32, 35, 36, 37, 39, 40, 41, 42, 44, 47, 48, 52, 53, 55, 59, 60, 61, 63, 64, 77, 80, 84, 85, 92, 93, 100, 102, 105, 107, 110, 111, 112, 118, 123, 124, 128, 129, 130, 131, 137, 139, 142, 145, 148, 149, 151, 152, 153, 154, 155) + 3 nowe (156, 157, 158) = 60 mutantow, sekwencyjnie, jeden naraz, `cargo test` z timeoutem 1500 s, binaria testowe dobrane do mutanta, po KAZDYM mutancie plik przywracany i sprawdzana zgodnosc SHA-256 (`mutation-evidence-r2.txt`, §6.3). Wynik koncowy: **58 WYKRYTYCH, 2 niewykrytych** ([42] i [55] - ROWNOWAZNE, dowod w §6.3). W pierwszym przebiegu bylo 5 niewykrytych: oprocz [42] i [55] trzy REALNE LUKI wektorow - [84] `e: akcesor - glodny barbarzynca`, [85] `e: akcesor - clear`, [107] `e: raise - flow dla gracza` - zamkniete w r2 nowymi wektorami z uruchomionego weba (`edge.json`: `accessorsAfterClear`, `injected`, `raiseFlow`/`planFlow`/`balanceFlow`) i przeliczone (3/3 WYKRYTE, `mutation-evidence-r2c.txt`). Lacznie z r1 (100 uruchomionych) uruchomiono wszystkie 160 zdefiniowanych mutantow (157 z r1 + 3 nowe). Probka 9 mutantow Evaluatora ([12], [16], [27], [36], [63], [123], [124], [139], [148]) lezy w calosci w liscie 57 i zostala przeliczona na testach r2. Pelnego ponownego przebiegu 100 mutantow z r1 na testach r2 NIE wykonano (NIE_ZMIERZONO; testy r2 tylko DODAJA przypadki - zadna asercja ani wektor nie zostaly usuniete lub zmienione - wiec mutanty wykryte w r1 pozostaja wykryte). |
| 4 | Dokumenty obowiazkowe nieprzeczytane (PLAN §P6, LEDGER, P3-22 tylko 1-140, P2-3 i P2-5 tylko grep) | PRZYJMUJE | Przeczytane w CALOSCI w r2: PLAN (305 linii), LEDGER (213), P3-22 (441), P2-3 (380), P2-5 (668); dowod i skutki: §2a (tabela per dokument: wnioski i skutek dla portu; granica odczytu P6-6A/P6-5B wymieniona jawnie). Skutki: LEDGER P3.23 (35b = kryterium akceptacji P6.7 - spelnione), LEDGER P6.6B (duplikaty stalych - jedno zrodlo, ZAL-2), nowe pozycje §7 pkt 11-13 (D-CMD-3 kolejnosc faz, `City` 38/61 pol i flaga `rationMigratedV114`, `W-7A-1`). |
| 5 | `SHA256SUMS.txt` nie da sie sprawdzic `sha256sum -c` (haszuje tekst JSON bez koncowej nowej linii) | PRZYJMUJE | Generator zapisuje teraz hash BAJTOW zapisanego pliku (`write()` w `gen-p67a-vectors.mjs` hashuje to, co zapisuje, z koncowym `\n`). Dowod: `sha256sum -c SHA256SUMS.txt` w `rust-port/engine/tests/p6_7a_vectors`: 7 x OK (§12.5). Ponowne wygenerowanie wektorow od zera dalo identyczny `SHA256SUMS.txt` i identyczne 7 plikow JSON (`cmp`, §12.5). |
| 6 | Wiersz `PoziomRacji` ma status PORTOWANY bez testu (kolumna test = `-`) | PRZYJMUJE | To alias typu (`export type PoziomRacji = number`, `population-growth-v85.ts:25`), nie ma zachowania do testowania. Status zmieniony na NIE-DOTYCZY z uzasadnieniem (`gen-symbols-p67a.py` -> `symbols-p67a-r2.tsv/.md`; tabela §3): 104 wiersze = 92 PORTOWANY, 5 PORTOWANY-Z-WSTRZYKNIETYMI, 2 DANE-JUZ-W-RUST, 5 NIE-DOTYCZY, 0 RUNDA-2. Kontrola: zadne inne wiersze PORTOWANY nie maja `-` w kolumnie test (`awk` na TSV w §12.7). |
| 7 | Efekt wstrzyknietego `rebalanceWorkersAfterPopulationChange` w trybie `reczny` jest NIE_ZMIERZONO; r2 ma to sledzic, nie zamykac | PRZYJMUJE (sledzone, NIE zamkniete) | Zadanie `W-7A-1` w §7 pkt 13 z warunkiem zamkniecia (port `okolica.ts::rebalanceWorkersAfterPopulationChange`, P6.8c, wektory z weba, podmiana hooka); ZAL-6 nadal mowi, ze test pilnuje tylko kolejnosci/liczby/argumentow wywolan hooka, nie skutku. Status: NIE_ZMIERZONO (bez zmian). |

## 1. Werdykt rundy 1 (stan faktyczny; stan po rundzie 2 w kolumnie)

| Pytanie | Odpowiedz |
|---|---|
| Co jest portowane? | Wszystkie eksporty i symbole prywatne 5 plikow (tabela §3): 104 wiersze = 92 PORTOWANY, 5 PORTOWANY-Z-WSTRZYKNIETYMI, 2 DANE-JUZ-W-RUST, 5 NIE-DOTYCZY, 0 RUNDA-2 (r1: 93 / 5 / 2 / 4; `PoziomRacji` -> NIE-DOTYCZY w r2). Slownik statusow zamkniety i wymuszony generatorem `gen-symbols-p67a.py` (blad, gdy eksport TS nie ma wiersza albo wiersz wskazuje symbol/test spoza zrodla, Rust lub testow). |
| Podzial na rundy | Jedna grupa (P6.7A, 5 plikow) zamknieta w RUNDZIE 1; zadne kryterium nie zostalo oslabione. Do rundy 2 nalezy wylacznie to, co jest poza plikami grupy (§7). |
| Dowod "PORTOWANY" | Kod Rust + test + wektory z URUCHOMIONEGO weba (pin; PRAWDZIWY kod TS ladowany loaderem, zero stubow logiki) + NIEZALEZNY weryfikator Python (r2: 14955 porownan bitowych, 0 rozbieznosci; r1: 11258) + mutacje wykrywane (r1: 100 uruchomionych = 96 wykrytych + 4 rownowazne; **r2: dalsze 60 mutantow (57 nieuruchomionych w r1 + 3 nowe), 58 wykrytych, 2 niewykrytych - ocena w §6.3**); lacznie wszystkie 160 zdefiniowanych mutantow uruchomione; §6). |
| Wstrzykniete zaleznosci | Tylko spoza plikow tej grupy: `militaryFoodConsumptionWithSpichlerz` (turn-economy.ts), `rebalanceWorkersAfterPopulationChange` (okolica.ts), `onCityPopulationChanged`. Test `post_central_growth_matches_web` SPRAWDZA liczbe, kolejnosc i argumenty wywolan hakow wzgledem prawdziwego weba (§4 ZAL-6). `refreshManpowerAfterPopChange` i `civManpowerMults` sa juz w Rust (P6.5B) i sa wolane naprawde. |
| Bramki | fmt `EXIT=0`, clippy `--all-targets -D warnings` `EXIT=0`, test `EXIT=0`: **r2: 1098 przeszlo, 0 nie** (r1: 1097; 1054 baseline + 44 nowych w `tests/p6_7a_*.rs`). Surowe, pelne logi: r1 w §11 i `gate-*-r1.log`, r2 w §12 i `gate-*-r2.log`. |
| Zmiany poza allowlista | Brak (§9). `domain/mod.rs`, `bridge.rs`, `Cargo.toml`, `state.rs`, `lib.rs`, `gra/**` nietkniete. |

## 2. Zrodla przeczytane w calosci (liczby linii)

Czytane w calosci (`Read` calego pliku, kolejno, bez pomijania zakresow) po wyodrebnieniu `git archive edb8fb56 gra/src gra/data` do wlasnego katalogu poza repo (`mktemp -d`; nie wspoldzielone katalogi).

| Plik | Linie (`wc -l`) | Linie niepuste (`grep -c -v '^\s*$'`) | Eksporty (`grep -c '^export '`) |
|---|---|---|---|
| `gra/src/game/population-growth-v85.ts` | 580 | 535 | 35 + 1 prywatna funkcja (`pick`) i typy pomocnicze (`RawParamRow`, `Difficulty`) |
| `gra/src/game/growth-happiness.ts` | 30 | 30 | 1 |
| `gra/src/game/population-growth-tempo.ts` | 41 | 38 | 3 |
| `gra/src/game/r-stawki-strojenie.ts` | 64 | 55 | 9 + 1 prywatna funkcja (`stripDiacriticsLower`) |
| `gra/src/game/empire-food.ts` | 1074 | 990 | 40 linii `^export ` (39 deklaracji + 1 blok re-eksportu `export { ... } from './population-growth-v85'` z 3 symbolami) + 6 funkcji prywatnych (`pick`, `countMagazynByOwner`, `computeCentralFoodCap`, `ownerCitiesForAutoAdjust`, `applyEqualGrowthRationPlan`, `isRationBalanceTargetMet`) + 3 zmienne stanu modulu |

Liczby w dispatchu (535 / 30 / 38 / 55 / 990) to liczby linii NIEPUSTYCH i zgadzaja sie z kolumna 3; pelne liczby linii (`wc -l`) wynosza 580 / 30 / 41 / 64 / 1074. Dodatkowo przeczytane w calosci (jako zaleznosci portu) fragmenty: `economy.ts:1133-1166` (`cityPopulationCap`, `resolvePopulationCapMatrixDelta`), `building-resource-gate.ts:330-510` (Spichlerz), `economy-upkeep.ts:380-395` (`magazynEraMultiplier`), `turn-economy.ts:1639-1692,1332-1399` (`computeCityFoodBalanceV85`, `recomputeCityFoodBalancesInEcon`, `EconUnit`, `militaryFoodConsumptionWithSpichlerz`), `manpower.ts:380-440,479-538,827-843`, `okolica.ts:437-480`, `civ-matrix.ts:50-125`.

## 2a. Dokumenty obowiazkowe z dispatchu: dowod odczytu i skutki dla portu (runda 2: zarzut 4 Evaluatora r1 - przeczytane w calosci)

Runda 1 nie przeczytala w calosci `PLAN-PORT-RUST-TAURI-20261020.md`, `LEDGER.md`, `P3-22` (tylko 1-140), `P2-3` i `P2-5` (tylko grep). **Runda 2 przeczytala je KAZDY w calosci**, od pierwszej do ostatniej linii (narzedzie `Read` bez ograniczen zakresu; wersja z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, `git show <ref>:<sciezka>`; liczby linii z `wc -l`: PLAN 305, LEDGER 213, P3-22 441, P2-3 380, P2-5 668 - stan galezi w chwili odczytu r2). Bez obcinania szerokosci wierszy. Dodatkowo `P6-0-GAP-ANALYSIS.md` (435 linii; §0, wiersze §3 dla 5 plikow grupy, §5, §6b - jak w r1) i wzorce wykonania `P6-5B` (§0 obrona r2, §1, §2, §2a, §6-§9 i poczatek §11) oraz `P6-6A` (tylko lista naglowkow `grep '^## '`).

| Dokument | Linie | Przeczytane | Wniosek wazny dla P6.7A | Skutek dla portu |
|---|---|---|---|---|
| `PLAN-PORT-RUST-TAURI-20261020.md` | 305 | 1-305 (calosc) | §1: web = referencja read-only, cel = zachowanie 1:1, ZAKAZ "drugiej uproszczonej gry" (placeholder zamiast realnego systemu dyskwalifikuje temat); §P6 (P6.6-P6.8: miasta - zalozenie, **wzrost populacji**, ekonomia/produkcja, okolica); "kazdy modul: test stanu przed/po, przypadki negatywne, readback przez adapter, zero benchmarkow"; §2: PASS tylko z niezaleznych faz, Obrona w TYM SAMYM worktree co Operator | wstrzykniete/minimalne zaleznosci (ZAL-6, ZAL-7) NIE sa "uproszczona gra": kazda ma wektor z URUCHOMIONEGO weba i jawna pozycje zamiany w §7; testy "przed/po" = wektory `advance`/`post_central` (stan wejsciowy -> stan wyjsciowy bit w bit); przypadki negatywne = `edge.json` (r2: macierz syntetyczna, miasta oblezone) |
| `LEDGER.md` | 213 | 1-213 (calosc) | (a) wiersz P3.23 (WZROST 35b `CIV_MATRIX_GROWTH_DIFFICULTY_MULT`): spłaszczenie jest KRYTERIUM AKCEPTACJI tematu P6.7 - "tabela edytowalna + generator z weba + weryfikator, bez literalow"; (b) wiersz P6.6B: "duplikaty stalych z `population-growth-v85.ts` usunac przy porcie P6.7"; `City` w Rust modeluje 38 z 61 pol - decyzja (pole `extra` vs pelny model) PRZED P6.20; (c) zasady procesu: od P6.6B Evaluator = Sonnet (Haiku nie dowozil oceny przy dlugich bramkach), push dispatchu przed startem Workflow, usuwanie wlasnego worktree po temacie, wzorzec "Operator i Obrona w jednym worktree"; (d) wiersze P6.1B/P6.5A/P6.5B/P6.6A/P6.6B/M-serii: ten sam wzorzec weryfikacji (loader bez stubow, weryfikator Python, mutacje, ratyfikacje orkiestratora dla JSON poza allowlista); (e) 2026-10-23 "wstrzymanie nowych dispatchy" - dotyczy orkiestratora, nie tej rundy | (a) 35b zamkniete (tabela `trudnosc_mnoznik_macierzy`, czytnik w domenie, wektory, weryfikator); (b) dublet `DEFAULT_POZIOM_RACJI`/`WYZYWIENIE_MAX` zastapiony jednym zrodlem (ZAL-2) a `GrowthCity` niesie pola spoza `City` (ZAL-5) - to ta sama decyzja "23 pola gubione przy zapisie" i trafia do §7 jako zadanie dla P6.20; (c) brak konfliktu z allowlista |
| `p3/P3-22-FLATTEN-STAGE2.md` | 441 | 1-441 (calosc; r1: 1-140) | wzorzec: tabela `data/derived/*.json` + parser + test KSZTALTU bez pinow wartosci (§12.0 zarzut 5: porownanie tabeli z literalem w tescie = pin, zakazane); status per wiersz z plik:linia; "ROZWINIETE" = czytany przez kod domeny, NIE znaczy "uzywany w grze" (§12.0 zarzut 1); weryfikator niezalezny z testem negatywnym; wiersz `35b CIV_MATRIX_GROWTH_DIFFICULTY_MULT (b)` = `population-growth-v85.ts:92`; unifikacja `enum Difficulty` (§10.5); korekty numerow linii deklarowane jawnie (§12.6); dlug: `derived_values.rs` nadal pinuje wartosci (dyplomacja) | r1 stosowal wzorzec; r2 potwierdza: `p6_7a_tables.rs` nie pinuje wartosci (skan literalow: tylko `FOOD_EPSILON`=1e-9 i 3 stale Hangul); kod p6_7a NIE jest wolany z petli gry (jak `combat.rs` w P3-22 §11.7) - §7 pkt 6; 35b wymaga tabeli, nie literalu |
| `p2/P2-3-ENTITY-IDS.md` | 380 | 1-380 (calosc; r1: grep) | D-ID-1/D-ID-3: ID encji `u64` newtype, `legacy_id: String` tylko w tabeli importu; D-ID-7 `OwnerRef`; D-ID-8 czlowiek = 0; D-ID-10/11: pola BRAK (`poziomRacji`, `wzrostUlamkowy`, `manpower`, `magazynZywnosci`, `turyBezDoplaty`, `procentRozwoj` - wiersze #7, #22-28, #57) dostaja placeholdery w `GameState`; flagi UI `rationMigratedV114` itd. = klasa U ("przy imporcie odczytane i odrzucone, nie trafiaja do `GameState`"); flagi `ma*` wyprowadzane z listy budynkow, nie przechowywane | `GrowthCity` przechowuje `poziom_racji`, `wzrost_ulamkowy`, `tury_bez_doplaty`, `procent_rozwoj` jako DANE (zgodne z D-ID-11), ID miasta zostaje `String` jak w `City` P6.6B; **rozbieznosc do zapisania w §7:** `rationMigratedV114` jest przez `ensureCityRationDefaults` ustawiane i czytane (web 1:1), a P2-3 §9 D-ID-11 klasyfikuje te flage jako UI do odrzucenia przy imporcie - rozstrzygniecie nalezy do P2.11/P6.20 (po odrzuceniu flagi `ensure` powtorzy migracje, ktora web wykonalby takze), nie do tego tematu |
| `p2/P2-5-COMMANDS.md` | 668 | 1-668 (calosc; r1: grep) | komendy rationowania: B8 `set_city_policy` (`onCityRationChange`, `main.ts:7261`) - §9 pkt 14: rozbic na typowane komendy (`set_ration_level` itd.); A2 `set_auto_ration_all`, A3 `set_owner_policy`, A7 `set_city_auto_ration` (G14: 0 trafien w Rust); T-1 `end_turn`: D-CMD-3 kolejnosc faz wzgledem `turn_economy::resolve_turn`; §9 pkt 17: `owner: PlayerId` podaje front jawnie; kanal `cfg.setProduction` | ten temat dostarcza LOGIKE (`get_city_ration_level`, `ensure_city_ration_defaults`, `auto_*`, `apply_post_central_population_growth`), nie komendy (P6.2); `apply_post_central_population_growth` ma wchodzic w faze koncowa tury - **kolejnosc wzgledem `resolve_turn` = D-CMD-3 (zadanie dla P6.9)**, §7 pkt 6 |
| `p6/P6-0-GAP-ANALYSIS.md` | 435 | §0, §3 (5 wierszy grupy), §5, §6b | (jak w r1) wszystkie 5 plikow CZESCIOWO (heur.), PORTOWANE-1:1 = 0 do czasu wektorow z weba | status PORTOWANY tylko z wektorem z URUCHOMIONEGO weba + testem (r2: `PoziomRacji` zmieniony na NIE-DOTYCZY, zarzut 6) |
| Wzorce `P6-5B`, `P6-6A`, `P6-6B` | - | P6-5B: §0, §1, §2, §2a, §6-§9 (wzorzec obrony r2); P6-6B: struktura i skrypty (r1); P6-6A: naglowki | struktura odpowiedzi na zarzuty: tabela `# / Zarzut / Werdykt / Poprawka lub dowod`; mutacje: dowod rozlacznosci grup | przyjete w §0 |

Granica odczytu (jawnie): `P6-6A` - tylko lista naglowkow (nie czytane tresci); `P6-5B` - nie czytane §3-§5 i tresc logow §11; `P6-0` - tylko wskazane czesci. Dokumenty obowiazkowe z dispatchu wymienione w zarzucie 4 (PLAN, LEDGER, P3-22, P2-3, P2-5) - w calosci.

## 3. Tabela symboli (kazdy eksport i symbol prywatny ma status)

Statusy: PORTOWANY (kod + test + wektor z weba, 0 rozbieznosci), PORTOWANY-Z-WSTRZYKNIETYMI (j.w., ale z zaleznosciami spoza grupy wstrzyknietymi: lista w kolumnie Uwaga), DANE-JUZ-W-RUST (dowod w kolumnie Uwaga), NIE-DOTYCZY (typ pomocniczy TS bez logiki), RUNDA-2 (brak - zero pozycji). Plik zrodlowy tabeli: `symbols-p67a-r2.tsv` (r1: `symbols-p67a-r1.tsv`; generator `gen-symbols-p67a.py`; weryfikuje istnienie kazdego symbolu TS, symbolu Rust i testu).

| Plik web | Symbol | Status | Rust | Test | Uwaga |
|---|---|---|---|---|---|
| `population-growth-v85.ts` | `PoziomRacji` | NIE-DOTYCZY | `PoziomRacji` | `-` | alias typu `number` bez zachowania (runda 2, zarzut 6: bylo PORTOWANY bez testu); uzywany w sygnaturach funkcji pokrytych wektorami, np. clampPoziomRacji |
| `population-growth-v85.ts` | `WYZYWIENIE_MIN` | PORTOWANY | `wyzywienie_min` | `p6_7a_growth::constants_match_running_web` | tabela wzrost-ludnosci-params.json::wyzywienie.min |
| `population-growth-v85.ts` | `WYZYWIENIE_MAX` | DANE-JUZ-W-RUST | `wyzywienie_max` | `p6_7a_growth::single_source_of_default_level_and_max` | cities-params.json::wejscia_z_innych_modulow_weba (P6.6B); jedno zrodlo |
| `population-growth-v85.ts` | `WYZYWIENIE_STEP` | PORTOWANY | `wyzywienie_step` | `p6_7a_growth::constants_match_running_web` | tabela wyzywienie.krok |
| `population-growth-v85.ts` | `WYZYWIENIE_LEVELS` | PORTOWANY | `wyzywienie_levels` | `p6_7a_growth::constants_match_running_web` | wyliczane z min/max/krok jak w webie |
| `population-growth-v85.ts` | `WYZYWIENIE_GROWTH_PCT` | PORTOWANY | `ration_growth_percent` | `p6_7a_growth::ration_helpers_match_web` | tabela wyzywienie.wzrost_proc |
| `population-growth-v85.ts` | `DEFAULT_POZIOM_RACJI` | DANE-JUZ-W-RUST | `default_poziom_racji` | `p6_7a_growth::single_source_of_default_level_and_max` | cities-params.json (P6.6B); jedno zrodlo |
| `population-growth-v85.ts` | `RationParams` | PORTOWANY | `RationParams` | `p6_7a_growth::build_params_match_web` | struktura |
| `population-growth-v85.ts` | `CIV_MATRIX_GROWTH_DIFFICULTY_MULT` | PORTOWANY | `civ_matrix_growth_difficulty_mult` | `p6_7a_growth::constants_match_running_web` | tabela trudnosc_mnoznik_macierzy (P3-22 poz. 35b) |
| `population-growth-v85.ts` | `civMatrixGrowthDifficultyMultiplier` | PORTOWANY | `civ_matrix_growth_difficulty_multiplier` | `p6_7a_growth::difficulty_multiplier_matches_web` | - |
| `population-growth-v85.ts` | `PopulationMatrixResolved` | PORTOWANY | `PopulationMatrixResolved` | `p6_7a_growth::population_matrix_matches_web` | struktura |
| `population-growth-v85.ts` | `resolvePopulationMatrixForCiv` | PORTOWANY | `resolve_population_matrix_for_civ` | `p6_7a_growth::population_matrix_matches_web` | civMatrixParam = civ_matrix::civ_matrix_param (P6.1E) |
| `population-growth-v85.ts` | `buildRationParams` | PORTOWANY | `build_ration_params` | `p6_7a_growth::build_params_match_web` | @deprecated w webie; wartosci zapasowe w tabeli |
| `population-growth-v85.ts` | `clampPoziomRacji` | PORTOWANY | `clamp_poziom_racji` | `p6_7a_growth::ration_helpers_match_web` | - |
| `population-growth-v85.ts` | `migrateLegacyRationLevel` | PORTOWANY | `migrate_legacy_ration_level` | `p6_7a_growth::ration_helpers_match_web` | tabela migracja_racji_legacy |
| `population-growth-v85.ts` | `migrateProcentRozwojToPoziomRacji` | PORTOWANY | `migrate_procent_rozwoj_to_poziom_racji` | `p6_7a_growth::ration_helpers_match_web` | - |
| `population-growth-v85.ts` | `getCityRationLevel` | PORTOWANY | `get_city_ration_level` | `p6_7a_growth::city_ration_level_matches_web` | - |
| `population-growth-v85.ts` | `rationFoodCostPerPop` | PORTOWANY | `ration_food_cost_per_pop` | `p6_7a_growth::ration_helpers_match_web` | zywnosc/mieszkanca z racje.json (P3-19), bez mnoznika w kodzie |
| `population-growth-v85.ts` | `rationGrowthPercent` | PORTOWANY | `ration_growth_percent` | `p6_7a_growth::ration_helpers_match_web` | - |
| `population-growth-v85.ts` | `formatWyzwienieLabel` | PORTOWANY | `format_wyzwienie_label` | `p6_7a_growth::ration_helpers_match_web` | js_to_fixed / js_number_to_string |
| `population-growth-v85.ts` | `computeCityRationCost` | PORTOWANY | `compute_city_ration_cost` | `p6_7a_growth::ration_cost_matches_web` | wejscie Spichlerz: spichlerz_ration_food_cost_multiplier |
| `population-growth-v85.ts` | `GrowthPercentBreakdown` | PORTOWANY | `GrowthPercentBreakdown` | `p6_7a_growth::growth_percent_matches_web` | struktura |
| `population-growth-v85.ts` | `GrowthPercentInput` | PORTOWANY | `GrowthPercentInput` | `p6_7a_growth::growth_percent_matches_web` | struktura |
| `population-growth-v85.ts` | `computeGrowthPercentV85` | PORTOWANY | `compute_growth_percent_v85` | `p6_7a_growth::growth_percent_matches_web` | - |
| `population-growth-v85.ts` | `FractionalGrowthResult` | PORTOWANY | `FractionalGrowthResult` | `p6_7a_growth::fractional_growth_matches_web` | struktura |
| `population-growth-v85.ts` | `applyFractionalGrowthV85` | PORTOWANY | `apply_fractional_growth_v85` | `p6_7a_growth::fractional_growth_matches_web` | wejscie economy.ts: city_population_cap |
| `population-growth-v85.ts` | `growthGainPerTurnSlots` | PORTOWANY | `growth_gain_per_turn_slots` | `p6_7a_growth::gain_and_turns_match_web` | - |
| `population-growth-v85.ts` | `turnsUntilNextCitizen` | PORTOWANY | `turns_until_next_citizen` | `p6_7a_growth::gain_and_turns_match_web` | null -> None |
| `population-growth-v85.ts` | `applyHungerPenaltyV85` | PORTOWANY | `apply_hunger_penalty_v85` | `p6_7a_growth::hunger_penalty_matches_web` | - |
| `population-growth-v85.ts` | `ensureCityRationDefaults` | PORTOWANY | `ensure_city_ration_defaults` | `p6_7a_growth::ensure_city_ration_defaults_matches_web` | GrowthCity: pole hungerLossUlamkowy poza City (state.rs) |
| `population-growth-v85.ts` | `CentralFoodFedSnapshot` | PORTOWANY | `EmpireFoodTick` | `p6_7a_post_central::post_central_growth_matches_web` | podzbior EmpireFoodTick (ZAL-3) |
| `population-growth-v85.ts` | `PostCentralGrowthOpts` | PORTOWANY | `PostCentralGrowthOpts` | `p6_7a_post_central::post_central_growth_matches_web` | bez tablic mutowanych (cities, econ, wiersze) |
| `population-growth-v85.ts` | `applyPostCentralPopulationGrowth` | PORTOWANY-Z-WSTRZYKNIETYMI | `apply_post_central_population_growth` | `p6_7a_post_central::post_central_growth_matches_web` | wstrzykniete: rebalanceWorkersAfterPopulationChange (okolica.ts), onCityPopulationChanged; manpower z recruitment::manpower (P6.5B) |
| `population-growth-v85.ts` | `ApplyCentralFoodGrowthOpts` | PORTOWANY | `PostCentralGrowthOpts` | `p6_7a_post_central::post_central_growth_matches_web` | Omit<PostCentralGrowthOpts,'efResult'> = ta sama struktura |
| `population-growth-v85.ts` | `applyCentralFoodPopulationGrowth` | PORTOWANY-Z-WSTRZYKNIETYMI | `apply_central_food_population_growth` | `p6_7a_post_central::post_central_growth_matches_web` | jak applyPostCentral...; warianty central2 / efAlias w wektorach |
| `population-growth-v85.ts` | `pick` | PORTOWANY | `pick` | `p6_7a_growth::build_params_match_web` | nieeksportowana; wspolna z empire-food.ts |
| `population-growth-v85.ts` | `RawParamRow` | NIE-DOTYCZY | `-` | `-` | typ pomocniczy TS; w Rust surowy serde_json::Value |
| `population-growth-v85.ts` | `Difficulty` | NIE-DOTYCZY | `GameDifficulty` | `-` | alias typu: GameDifficulty = domain::types::Difficulty (ZAL-12) |
| `growth-happiness.ts` | `computeGrowthHappinessNetto` | PORTOWANY | `happiness::compute_growth_happiness_netto` | `p6_7a_tempo::happiness_matches_web` | argumenty 2-3 swiadomie ignorowane |
| `population-growth-tempo.ts` | `WZROST_LUDNOSCI_PACE` | PORTOWANY | `tempo::WzrostLudnosciPace::multiplier` | `p6_7a_tempo::pace_table_matches_web` | tabela tempo_wzrostu |
| `population-growth-tempo.ts` | `WzrostLudnosciPace` | PORTOWANY | `tempo::WzrostLudnosciPace` | `p6_7a_tempo::pace_table_matches_web` | enum |
| `population-growth-tempo.ts` | `applyGrowthThresholdPace` | PORTOWANY | `tempo::apply_growth_threshold_pace` | `p6_7a_tempo::tempo_threshold_matches_web` | - |
| `r-stawki-strojenie.ts` | `R_STAWKI_KOSZT_MULT` | PORTOWANY | `r_stawki::r_stawki_koszt_mult` | `p6_7a_tempo::stawki_constants_and_scalars_match_web` | tabela r_stawki; silnik nie mnozy (P3-19 splaszczyl) |
| `r-stawki-strojenie.ts` | `R_STAWKI_FALA2_MULT` | PORTOWANY | `r_stawki::r_stawki_fala2_mult` | `p6_7a_tempo::stawki_constants_and_scalars_match_web` | j.w. |
| `r-stawki-strojenie.ts` | `R_STAWKI_FALA1_FALA2_MULT` | PORTOWANY | `r_stawki::r_stawki_fala1_fala2_mult` | `p6_7a_tempo::stawki_constants_and_scalars_match_web` | iloczyn z tabeli |
| `r-stawki-strojenie.ts` | `normalizeResearchEra` | PORTOWANY | `r_stawki::normalize_research_era` | `p6_7a_tempo::research_era_matches_web` | NFD przez era-diakrytyki.json + algorytm Hangul |
| `r-stawki-strojenie.ts` | `isResearchEraFala2Extra` | PORTOWANY | `r_stawki::is_research_era_fala2_extra` | `p6_7a_tempo::research_era_matches_web` | - |
| `r-stawki-strojenie.ts` | `scaleStockCostRecord` | PORTOWANY | `r_stawki::scale_stock_cost_record` | `p6_7a_tempo::stock_cost_record_matches_web` | kolejnosc kluczy zachowana |
| `r-stawki-strojenie.ts` | `scaleImprovementWorkCost` | PORTOWANY | `r_stawki::scale_improvement_work_cost` | `p6_7a_tempo::stawki_constants_and_scalars_match_web` | - |
| `r-stawki-strojenie.ts` | `scaledWonderWorkCost` | PORTOWANY | `r_stawki::scaled_wonder_work_cost` | `p6_7a_tempo::stawki_constants_and_scalars_match_web` | - |
| `r-stawki-strojenie.ts` | `scaledWonderFoodCost` | PORTOWANY | `r_stawki::scaled_wonder_food_cost` | `p6_7a_tempo::stawki_constants_and_scalars_match_web` | - |
| `r-stawki-strojenie.ts` | `stripDiacriticsLower` | PORTOWANY | `r_stawki::strip_diacritics_lower` | `p6_7a_tempo::research_era_matches_web` | nieeksportowana |
| `empire-food.ts` | `EmpireFoodState` | PORTOWANY | `EmpireFoodState` | `p6_7a_empire::advance_empire_food_matches_web` | struktura |
| `empire-food.ts` | `EmpireFoodParams` | PORTOWANY | `EmpireFoodParams` | `p6_7a_growth::build_params_match_web` | struktura |
| `empire-food.ts` | `EmpireFoodCityRow` | PORTOWANY | `EmpireFoodCityRow` | `p6_7a_empire::advance_empire_food_matches_web` | struktura |
| `empire-food.ts` | `EmpireFoodTick` | PORTOWANY | `EmpireFoodTick` | `p6_7a_empire::advance_empire_food_matches_web` | struktura |
| `empire-food.ts` | `EmpireFoodTickResult` | PORTOWANY | `EmpireFoodTickResult` | `p6_7a_empire::advance_empire_food_matches_web` | byOwner = widok perOwner |
| `empire-food.ts` | `buildEmpireFoodParams` | PORTOWANY | `empire_food::build_empire_food_params` | `p6_7a_growth::build_params_match_web` | - |
| `empire-food.ts` | `freshEmpireFoodState` | PORTOWANY | `empire_food::fresh_empire_food_state` | `p6_7a_empire::runtime_clear_and_deprecated_helpers_match_web` | - |
| `empire-food.ts` | `advanceEmpireFood` | PORTOWANY-Z-WSTRZYKNIETYMI | `empire_food::advance_empire_food` | `p6_7a_empire::advance_empire_food_matches_web` | wstrzykniete: militaryFoodConsumptionWithSpichlerz (turn-economy.ts) |
| `empire-food.ts` | `bindEmpireFoodRuntime` | PORTOWANY | `EmpireFoodRuntime::get_empire_food_reserve` | `p6_7a_empire::advance_empire_food_matches_web` | globalna referencja -> jawny parametr `states` (ZAL-4) |
| `empire-food.ts` | `getEmpireFoodReserve` | PORTOWANY | `EmpireFoodRuntime::get_empire_food_reserve` | `p6_7a_empire::advance_empire_food_matches_web` | - |
| `empire-food.ts` | `getEmpireFoodMaxCap` | PORTOWANY | `EmpireFoodRuntime::get_empire_food_max_cap` | `p6_7a_empire::advance_empire_food_matches_web` | - |
| `empire-food.ts` | `getEmpireFoodSplit` | PORTOWANY | `empire_food::get_empire_food_split` | `p6_7a_empire::runtime_clear_and_deprecated_helpers_match_web` | @deprecated |
| `empire-food.ts` | `isArmyHungry` | PORTOWANY | `EmpireFoodRuntime::is_army_hungry` | `p6_7a_empire::advance_empire_food_matches_web` | - |
| `empire-food.ts` | `isArmyStarving` | PORTOWANY | `EmpireFoodRuntime::is_army_starving` | `p6_7a_empire::advance_empire_food_matches_web` | - |
| `empire-food.ts` | `getArmyStarvationCountdown` | PORTOWANY | `EmpireFoodRuntime::get_army_starvation_countdown` | `p6_7a_empire::advance_empire_food_matches_web` | null -> None |
| `empire-food.ts` | `getLastEmpireFoodTick` | PORTOWANY | `EmpireFoodRuntime::get_last_empire_food_tick` | `p6_7a_empire::advance_empire_food_matches_web` | migawka z chwili advance (ZAL-4) |
| `empire-food.ts` | `_setLastEmpireFoodTicks` | PORTOWANY | `EmpireFoodRuntime::set_last_empire_food_ticks` | `p6_7a_empire::advance_empire_food_matches_web` | - |
| `empire-food.ts` | `clearLastEmpireFoodTicks` | PORTOWANY | `EmpireFoodRuntime::clear_last_empire_food_ticks` | `p6_7a_empire::runtime_clear_and_deprecated_helpers_match_web` | - |
| `empire-food.ts` | `isCityAutoWyzywienieEnabled` | PORTOWANY | `empire_food::is_city_auto_wyzywienie_enabled` | `p6_7a_empire::runtime_clear_and_deprecated_helpers_match_web` | humanOwnerIds domyslnie [0] |
| `empire-food.ts` | `AutoRationCityChange` | PORTOWANY | `AutoRationCityChange` | `p6_7a_empire::auto_balance_matches_web` | struktura |
| `empire-food.ts` | `AutoRationAdjustResult` | PORTOWANY | `AutoRationAdjustResult` | `p6_7a_empire::auto_balance_matches_web` | struktura |
| `empire-food.ts` | `computeEmpireCityFoodNadwyzka` | PORTOWANY | `empire_food::compute_empire_city_food_nadwyzka` | `p6_7a_empire::simulation_helpers_match_web` | - |
| `empire-food.ts` | `simulateCityFoodCentralPool` | PORTOWANY | `empire_food::simulate_city_food_central_pool` | `p6_7a_empire::simulation_helpers_match_web` | - |
| `empire-food.ts` | `simulateCityFoodAllFed` | PORTOWANY | `empire_food::simulate_city_food_all_fed` | `p6_7a_empire::simulation_helpers_match_web` | - |
| `empire-food.ts` | `WYZYWIENIE_POZIOM_NA_LIMICIE` | PORTOWANY | `empire_food::wyzywienie_poziom_na_limicie` | `p6_7a_empire::wyzywienie_poziom_na_limicie_matches_web` | wyliczane z tabeli, nie literal |
| `empire-food.ts` | `EqualGrowthRationPlanOpts` | PORTOWANY | `EqualGrowthRationPlanOpts` | `p6_7a_empire::equal_growth_plan_matches_web` | struktura bez tablic mutowanych |
| `empire-food.ts` | `EqualGrowthRationPlan` | PORTOWANY | `EqualGrowthRationPlan` | `p6_7a_empire::equal_growth_plan_matches_web` | struktura |
| `empire-food.ts` | `resolveEqualGrowthRationPlan` | PORTOWANY | `empire_food::resolve_equal_growth_ration_plan` | `p6_7a_empire::equal_growth_plan_matches_web` | wejscie turn-economy.ts: recompute_city_food_balances_in_econ |
| `empire-food.ts` | `isEmpireCityFoodSolvent` | PORTOWANY | `empire_food::is_empire_city_food_solvent` | `p6_7a_empire::simulation_helpers_match_web` | - |
| `empire-food.ts` | `AutoBalanceRationsOpts` | PORTOWANY | `AutoBalanceRationsOpts` | `p6_7a_empire::auto_balance_matches_web` | struktura bez tablic mutowanych |
| `empire-food.ts` | `autoBalanceRationsToSolvency` | PORTOWANY | `empire_food::auto_balance_rations_to_solvency` | `p6_7a_empire::auto_balance_matches_web` | - |
| `empire-food.ts` | `AutoRaiseRationsOpts` | PORTOWANY | `AutoRaiseRationsOpts` | `p6_7a_empire::auto_raise_matches_web` | struktura bez tablic mutowanych |
| `empire-food.ts` | `autoRaiseRationsForGrowth` | PORTOWANY | `empire_food::auto_raise_rations_for_growth` | `p6_7a_empire::auto_raise_matches_web` | - |
| `empire-food.ts` | `maxSafePoziomRacjiForCity` | PORTOWANY | `empire_food::max_safe_poziom_racji_for_city` | `p6_7a_empire::max_safe_poziom_matches_web` | - |
| `empire-food.ts` | `computeEmpireFoodNetDelta` | PORTOWANY | `empire_food::compute_empire_food_net_delta` | `p6_7a_empire::runtime_clear_and_deprecated_helpers_match_web` | @deprecated |
| `empire-food.ts` | `computeEmpireFoodNetDeltaFromCityFoods` | PORTOWANY | `empire_food::compute_empire_food_net_delta_from_city_foods` | `p6_7a_empire::runtime_clear_and_deprecated_helpers_match_web` | @deprecated |
| `empire-food.ts` | `computeEmpireFoodMaxCap` | PORTOWANY | `empire_food::compute_empire_food_max_cap` | `p6_7a_empire::runtime_clear_and_deprecated_helpers_match_web` | @deprecated |
| `empire-food.ts` | `clampFoodSplitPct` | PORTOWANY | `empire_food::clamp_food_split_pct` | `p6_7a_empire::runtime_clear_and_deprecated_helpers_match_web` | @deprecated |
| `empire-food.ts` | `getCityFoodSplit` | PORTOWANY | `empire_food::get_city_food_split` | `p6_7a_empire::runtime_clear_and_deprecated_helpers_match_web` | @deprecated; drugi argument weba ignorowany |
| `empire-food.ts` | `applyPostCentralPopulationGrowth` | PORTOWANY-Z-WSTRZYKNIETYMI | `apply_post_central_population_growth` | `p6_7a_post_central::post_central_growth_matches_web` | re-eksport z population-growth-v85.ts (empire-food.ts:1070-1074) |
| `empire-food.ts` | `applyCentralFoodPopulationGrowth` | PORTOWANY-Z-WSTRZYKNIETYMI | `apply_post_central_population_growth` | `p6_7a_post_central::post_central_growth_matches_web` | w empire-food.ts to ALIAS applyPostCentral... (1 argument `opts` z efResult), NIE wariant 2-argumentowy z v85; wektory 'efAlias' |
| `empire-food.ts` | `ApplyCentralFoodGrowthOpts` | PORTOWANY | `PostCentralGrowthOpts` | `p6_7a_post_central::post_central_growth_matches_web` | re-eksport typu PostCentralGrowthOpts |
| `empire-food.ts` | `countMagazynByOwner` | PORTOWANY | `count_magazyn_by_owner` | `p6_7a_empire::advance_empire_food_matches_web` | nieeksportowana; dedup tikow (seen) |
| `empire-food.ts` | `computeCentralFoodCap` | PORTOWANY | `compute_central_food_cap` | `p6_7a_empire::advance_empire_food_matches_web` | nieeksportowana; magazynEraMultiplier jako wejscie |
| `empire-food.ts` | `ownerCitiesForAutoAdjust` | PORTOWANY | `owner_cities_for_auto_adjust` | `p6_7a_empire::equal_growth_plan_matches_web` | nieeksportowana |
| `empire-food.ts` | `applyEqualGrowthRationPlan` | PORTOWANY | `apply_equal_growth_ration_plan` | `p6_7a_empire::auto_balance_matches_web` | nieeksportowana |
| `empire-food.ts` | `isRationBalanceTargetMet` | PORTOWANY | `is_ration_balance_target_met` | `p6_7a_empire::auto_balance_matches_web` | nieeksportowana |
| `empire-food.ts` | `_lastTicks` | PORTOWANY | `EmpireFoodRuntime` | `p6_7a_empire::advance_empire_food_matches_web` | stan modulu -> pole EmpireFoodRuntime |
| `empire-food.ts` | `_statesRef` | PORTOWANY | `EmpireFoodRuntime` | `p6_7a_empire::advance_empire_food_matches_web` | stan modulu -> parametr `states` (ZAL-4) |
| `empire-food.ts` | `_maxCapByOwner` | PORTOWANY | `EmpireFoodRuntime` | `p6_7a_empire::advance_empire_food_matches_web` | stan modulu -> pole EmpireFoodRuntime |
| `empire-food.ts` | `RawParamRow` | NIE-DOTYCZY | `-` | `-` | typ pomocniczy TS; w Rust surowy serde_json::Value |
| `empire-food.ts` | `CityFoodTickLike` | NIE-DOTYCZY | `CityEconomyTick` | `-` | Pick<CityEconomyTick,...> = ta sama struktura |

## 4. Decyzje i zalozenia (zamiast pytan)

- **ZAL-1 (modul i re-eksport).** Kod w `pub mod p6_7a` wewnatrz `domain/city_growth.rs` (dispatch: moduly wewnatrz istniejacych plikow; `domain/mod.rs` nietkniety). Sciezka: `civ_engine::domain::city_growth::p6_7a::{tempo, happiness, r_stawki, growth_v85, empire_food}` (podmodul `empire_food` i `growth_v85` sa `pub`; czesc symboli dodatkowo re-eksportowana w `p6_7a::*`). Brak re-eksportu w `lib.rs` (poza allowlista) - ZALOZENIE: konsumenci importuja pelna sciezke jak w P6.6B (`domain::terrain::city_founding::p6_6b`). Stary uproszczony model (`advance_city_growth`, `apply_fractional_growth` itd. - port `economy.ts::populationGrowth`) zostaje bez zmian; jego testy (`tests/city_growth.rs`) nietkniete.
- **ZAL-2 (jedno zrodlo stalych, zadanie "zastap duplikaty").** `cities-params.json::wejscia_z_innych_modulow_weba` (P6.6B) zawieralo kopie `DEFAULT_POZIOM_RACJI` i `WYZYWIENIE_MAX` z `population-growth-v85.ts`. Rozstrzygniecie: te DWIE wartosci maja dokladnie jedno miejsce - `cities-params.json`; `growth_v85::default_poziom_racji()` i `wyzywienie_max()` czytaja je stamtad, a nowa tabela `wzrost-ludnosci-params.json` ich NIE kopiuje (testy `single_source_of_default_level_and_max`, `single_source_for_default_level_and_scale_max`). Wszystkie POZOSTALE stale `population-growth-v85.ts` / `empire-food.ts` / `population-growth-tempo.ts` / `r-stawki-strojenie.ts` maja jedno miejsce: `wzrost-ludnosci-params.json`; zywnosc na mieszkanca: `racje.json` (P3-19). Przeniesienie obu wartosci do nowej tabeli i usuniecie sekcji z `cities-params.json` wymagaloby zmiany `cities-params.json` i czytnikow w `state.rs` (poza allowlista) - RUNDA-2/integracja (§7). `R_STAWKI_KOSZT_MULT` w nowej tabeli jest czytany WYLACZNIE przez akcesory `r_stawki_koszt_mult()` / `r_stawki_fala1_fala2_mult()` (eksport TS bez konsumenta w silniku); koszt racji idzie z `racje.json` (splaszczonego w P3-19).
- **ZAL-3 (migawka efResult).** `CentralFoodFedSnapshot` (TS: struktura strukturalna) = `EmpireFoodTick` (Rust). `applyPostCentralPopulationGrowth` przyjmuje `&mut [EmpireFoodTick]` i pisze `name`, `wzrostProcent`, `breakdown`, `nakarmione` w wierszach. `empire-food.ts` eksportuje `applyCentralFoodPopulationGrowth` jako ALIAS `applyPostCentralPopulationGrowth` (1 argument), a `population-growth-v85.ts` jako wrapper 2-argumentowy - wektory obejmuja oba warianty (`via`: `post`, `central2`, `efAlias`).
- **ZAL-4 (stan modulu `empire-food.ts`).** Zmienne modulowe `_lastTicks`, `_statesRef`, `_maxCapByOwner` -> `EmpireFoodRuntime`. `bindEmpireFoodRuntime(states)` trzyma w webie ZYWA referencje; w Rust `get_empire_food_reserve(&states, owner)` bierze `states` jawnie. `getLastEmpireFoodTick` zwraca migawke z chwili `advance_empire_food`: po `applyPostCentral...` wiersze `perCityRows` nie sa synchronizowane z runtime (w webie wspoldziela obiekty). Brak konsumenta w zakresie (HUD = UI).
- **ZAL-5 (pola spoza `City`).** `City` (`state.rs`, P6.6B, poza allowlista) nie ma `hungerLossUlamkowy` ani `manpower`. `GrowthCity { city, hunger_loss_ulamkowy, manpower }` je niesie; po otwarciu `state.rs` pola przeniesc do `City` (RUNDA-2).
- **ZAL-6 (wstrzykniecia).** (a) `militaryFoodConsumptionWithSpichlerz` (turn-economy.ts:1375, zalezy od stanu globalnego Soli Spichlerza i tabel jednostek) -> domkniecie `military_food(owner)`; w wektorach wartosc liczona PRAWDZIWA funkcja weba z jednostkami `{ownerId,typeId,camping,onOwnTerritory}` i `DEFAULT_UPKEEP_PARAMS`. (b) `rebalanceWorkersAfterPopulationChange` (okolica.ts:437) -> `PopulationChangeHooks::rebalance_workers_after_population_change`; (c) `onCityPopulationChanged` -> `on_city_population_changed`. Wektory ustawiaja `okolicaTryb: 'auto'` (web zwraca natychmiast); test sprawdza KOLEJNOSC wywolan (rebalans -> manpower -> callback), argumenty `before/after` i zbior `excludeHexKeys` per miasto. Efekt prawdziwego rebalansu w trybie `reczny` NIE jest mierzony (§7).
- **ZAL-7 (wejscia z innych plikow weba, minimalne i przetestowane).** `cityPopulationCap` + `resolvePopulationCapMatrixDelta` (economy.ts:1145,1163), cztery funkcje Spichlerza (building-resource-gate.ts:362,434,441 + `SPICHLERZ_EMPIRE_CAP_I/II` :502-503), `magazynEraMultiplier` (economy-upkeep.ts:392), `computeCityFoodBalanceV85` + `recomputeCityFoodBalancesInEcon` (turn-economy.ts:1640,1662), `isBarbarian` (-> `LEGACY_BARBARIAN_OWNER_ID`, `ids.rs:42`). Kazda ma wektor z weba. Gdy odpowiednie grupy P6.8 trafia do Rust, zamienic dublet na ich implementacje (RUNDA-2: deduplikacja).
- **ZAL-8 (dane Spichlerza/limitu).** Literaly weba, ktore nie sa eksportami (`6 - population`, `/ 10`, `Math.min(14, ...)`, `Math.pow(2, e-1)`, identyfikatory budynkow), sa w `wzrost-ludnosci-params.json` z numerem linii zrodla; zgodnosc z webem pilnuja wektory i mutacje `j:*`.
- **ZAL-9 (`r-stawki-strojenie.ts`).** Silnik Rust nie wola `scale*` ani `normalizeResearchEra` (P3-19 splaszczyl wynik do tabel `building-stock-costs`, `improvement-work`, `wonder-work`, `research-costs`). Mimo to wszystkie 9 eksportow jest PORTOWANE (kod + wektory), zeby grupy P6.8/P6.17 mogly je wolac bez ponownego portu; nie dubluja tabel (mnoznik jest w jednym miejscu: `wzrost-ludnosci-params.json::r_stawki`).
- **ZAL-10 (NFD).** `normalizeResearchEra` uzywa `String.prototype.normalize('NFD')`. Rust nie ma krate Unicode (zakaz zmian `Cargo.toml`), wiec: tabela `era-diakrytyki.json` (2189 rozkladow, wygenerowana z uruchomionego Node 22/ICU) + algorytm Hangul (stale Unicode 3.12). Nie modeluje kanonicznej zmiany kolejnosci znakow laczacych POZA U+0300..U+036F (NIE_ZMIERZONO dla takich wejsc). Epoki gry (`kamien`, `braz`, `zelazo` + warianty z ogonkami) sa pokryte wektorami.
- **ZAL-11 (parsowanie liczb JSON).** `serde_json` bez `float_roundtrip` moze zaokraglic ostatni bit liczb z JSON-a; wektory koduja wiec niecalkowite i calkowite > 2^53 jako napisy `"~..."` (parsowane `str::parse::<f64>`). Wartosci tabel (0.08, 0.75, 1.5, ...) sa potwierdzone bitowo wektorami `build_params_match_web`.
- **ZAL-12 (typ trudnosci).** `GameDifficulty` w `p6_7a` to `domain::types::Difficulty` (jedyny typ w `domain/`, P3-22 §10.5); parsowanie klucza weba: `game_difficulty_from_web`.

## 5. Testy i wektory

Generator: `gen-p67a-vectors.mjs` (Node 22, `--experimental-transform-types`, loader `p67a-loader-*.mjs`) laduje PRAWDZIWE `population-growth-v85.ts`, `empire-food.ts`, `population-growth-tempo.ts`, `r-stawki-strojenie.ts`, `growth-happiness.ts` oraz ich zaleznosci (`cities.ts`, `economy.ts`, `turn-economy.ts`, `okolica.ts`, `manpower.ts`, `building-resource-gate.ts`, `economy-upkeep.ts`, `civ-matrix.ts`, `data/*.json`) z `git archive edb8fb56`. Zero stubow logiki; jedyne "wlasne" funkcje to `onCityPopulationChanged` (parametr API) i rejestrator jego wywolan. Wyjscie deterministyczne (Mulberry32, ziarno stale; dwa uruchomienia daja identyczne sumy SHA-256: `tests/p6_7a_vectors/SHA256SUMS.txt`). Plik `edge.json` (przypadki graniczne dobrane po przebiegach mutacji, osobny PRNG; r2: + `matrixSynth`, `postCentralSiege`) NIE zmienia pozostalych plikow wektorow (porownane `cmp`; 6 plikow wektorow bajt w bajt jak w r1). **Odtwarzalnosc r2:** generator uruchomiony przeze mnie od zera na wlasnym `git archive edb8fb56` (`mktemp`-podobny katalog poza repo) dal wszystkie 7 plikow JSON i `SHA256SUMS.txt` BAJT W BAJT identyczne z zatwierdzonymi (`cmp`, §12.5). `SHA256SUMS.txt` (zarzut 5) zawiera teraz hashe SHA-256 PRAWDZIWYCH plikow (`sha256sum -c SHA256SUMS.txt` w `tests/p6_7a_vectors`: 7 x OK, §12.5); w r1 hashowano tekst JSON bez koncowego znaku nowej linii. Tabele danych (`wzrost-ludnosci-params.json`, `era-diakrytyki.json`) generuje `gen-p67a-params.mjs` ze stalych uruchomionego weba.

| Plik testowy | Testy | Co porownuje (bitowo f64) |
|---|---|---|
| `tests/p6_7a_tables.rs` | 10 | KSZTALT tabel (bez pinow wartosci): siatka Wyzywienia, kompletnosc wzrost_proc i `racje.json` wzgledem siatki, jedno zrodlo (`cities-params`), skonczonosc, spojnosc aliasow epok, poprawnosc tabeli NFD |
| `tests/p6_7a_growth.rs` | 15 | stale z weba; `clamp/koszt/wzrost%/etykieta/migracje` (1351 wejsc), poziom miasta, koszt racji (400), macierz cywilizacji + `capDelta` (118), **macierz SYNTETYCZNA + `capDelta` (r2, 40 patchy: `population_matrix_synthetic_matches_web`)**, mnoznik trudnosci, `cityPopulationCap` (180), `computeGrowthPercentV85` (700), `applyFractionalGrowthV85` (900), `growthGainPerTurnSlots`/`turnsUntilNextCitizen` (600), `applyHungerPenaltyV85` (700), `ensureCityRationDefaults` (122), `build*Params` (62) |
| `tests/p6_7a_tempo.rs` | 8 | `applyGrowthThresholdPace` (427), szczescie, `r-stawki` (skalary 120, rekordy 47), `normalizeResearchEra`/`isResearchEraFala2Extra` (71 napisow), Spichlerz, `magazynEraMultiplier` |
| `tests/p6_7a_empire.rs` | 9 | `recomputeCityFoodBalancesInEcon` (60 swiatow, w tym powtorzone id miasta), `simulate*`/`solvent`/`nadwyzka` (150 + 80 z `edge.json`: ujemne zapasy), `advanceEmpireFood` (100 swiatow: stan, akcesory HUD, wlasciciel -1, powtorzone tiki; + 40 z `edge.json`: ulamkowa karencja glodu), `resolveEqualGrowthRationPlan`/`autoBalance`/`autoRaise`/`maxSafe` (po 70; + r2b z `edge.json`: `planFlow` 40, `balanceFlow` 40, `raiseFlow` 60 - kryterium FLOW gracza), akcesory runtime po `clearLastEmpireFoodTicks` (`accessorsAfterClear`, 40) i po `_setLastEmpireFoodTicks` z tikiem wlasciciela -1 (`injected`, 40), funkcje @deprecated |
| `tests/p6_7a_post_central.rs` | 2 | `applyPostCentralPopulationGrowth` (100 swiatow, 3 warianty wywolania; + 40 z `edge.json`: migawka bez wpisow `fedByCityId`; + 40 z `edge.json`: miasta OBLEZONE po zlozeniu migawki (`postCentralSiege`, r2); miasta, `econ`, wiersze, liczniki, kolejnosc hakow) + `refreshManpowerAfterPopChange` (300) |

Pokrycie wektorow (skrypt `coverage-p67a.py`, `dowody/coverage-r1.txt`) - scenariusze NIE sa trywialne: post_central: scenariuszy 100 ze zmiana populacji 68 wywolan hookow 166 z wzrostem 51 z glodem 43 z exclude 77 z manpower 96 via {'efAlias': 38, 'post': 40, 'central2': 22}; advance: 100 glodWojska 96 atrycja 16 pomocMiastom>0 158 ucieto cap 5 wlasciciel -1 pominiety 82; plan: 70 z miastami na limicie 19 allFed 67 nie allFed 3; balance: 70 adjusted 20 zmian poziomow 67.

Niezalezny weryfikator Python (`verify-p67a-vectors.py`, `python3 -I`): reimplementuje logike NA PODSTAWIE KODU TS (nie Rust) i porownuje z wektorami bit w bit: **r2: 14955 porownan, 0 rozbieznosci** (r1: 11258; r2: +1449 `matrixSynth`, +160 `postCentralSiege`, +834 `runtimeClear`, +1114 `runtimeInject`, scenariusze FLOW w `plan`/`balance`/`raise`; log w §12.6); obejmuje wszystkie sekcje (wzrost, racje, tempo, stawki, epoki z `unicodedata`, recompute, advance, plan/balance/raise/maxSafe, post-central z manpower). Test negatywny weryfikatora: jedna celowa zmiana wektora w kazdym z 3 plikow musi dac czerwony wynik (`verify-negative-verifier.py`, `dowody/verify-negative-verifier-r1.txt`, sekcja 11.6); r2: dodatkowo 4 celowo zepsute wektory (`matrixSynth`: `hungerLossMultiplier` 0 -> 1; `injected`: `hungry(-1)` false -> true; `accessorsAfterClear`: `maxCap` 0 -> 7; `raiseFlow`: poziom racji -> 99) daja `ROZBIEZNOSCI: 4`, exit 1 (§12.6).

## 6. Mutacje (testy wykrywaja zmiany)

Skrypt `mutate-p67a.py` (sekwencyjnie, jeden mutant naraz, `cargo test` z timeoutem 900 s na mutanta; po KAZDEJ mutacji plik jest przywracany i sprawdzana jest zgodnosc SHA-256 z plikiem sprzed mutacji). 100 mutantow: 87 w kodzie Rust (`src/domain/city_growth.rs`) i 13 w tabelach JSON (`wzrost-ludnosci-params.json`, `era-diakrytyki.json`, `racje.json`). Wynik: przebieg 1: 92/100 wykrytych, 8 niewykrytych lub niekompilujacych (4 rownowazne z uzasadnieniem; 4 domkniete w przebiegu 2: 4/4 wykrytych po dodaniu edge.json).

Zakres. Skrypt `mutate-p67a.py` definiuje 157 mutantow (kazdy: JEDEN fragment kodu Rust albo tabeli JSON; `MUT_CHECK=1` potwierdza, ze kazdy fragment wystepuje dokladnie raz). Uruchomiono 100 reprezentatywnych (`MUT_LIST`, po 1-2 na funkcje/galaz), po jednym na raz (`cargo test` z timeoutem 900 s; binaria testowe dobrane do mutanta), z przywroceniem pliku i kontrola SHA-256 po KAZDYM mutancie. Pozostale 57 NIE zostalo uruchomionych (powod: obciazenie CPU maszyny ~1,6-3 min na mutanta przy wspoldzielonym hoscie; lista nizej) - NIE_ZMIERZONO dla nich.

Przebieg 1 (`mutation-evidence-r1.txt`): 100 mutantow na testach sprzed dodania `edge.json`: 92 WYKRYTE, 8 niewykrytych lub niekompilujacych sie.

Ocena 8 niewykrytych w przebiegu 1:
- [5] `g: wzrost % - porownanie poziomu` (`w.poziom == key` -> `w.poziom >= key`) - ROWNOWAZNY: tabela `wzrost_proc` jest rosnaca, a `key` po `clamp_poziom_racji` zawsze lezy na siatce lub jest `NaN`; pierwszy wiersz spelniajacy `>=` to wiersz `==` (dla `NaN` zadne porownanie nie jest prawdziwe w obu wariantach).
- [31] `g: tury do obywatela - frac>=1` (`frac >= 1.0` -> `frac > 1.0`) - ROWNOWAZNY: dla `frac == 1` galaz ogolna liczy `ceil((1 - 1) / gain) = ceil(0) = +0`, czyli to samo `Some(0.0)` (przy `gain > 0`, bo `gain <= 0` jest odsiewane wczesniej).
- [99] `e: plan - brak minimum` (usuniecie `apply_candidate(wyzywienie_min(), ...)` w galezi `!all_fed`) - ROWNOWAZNY: petla skanu malejacego konczy sie na indeksie 0, czyli juz zastosowala `WYZYWIENIE_MIN`; powtorne zastosowanie nie zmienia stanu (web robi to samo zbednie, `empire-food.ts:636-646`).
- [116] `p: wzrost tylko nakarmione` (`if fed { total } else { 0.0 }` -> `total`) - ROWNOWAZNY: `apply_fractional_growth_v85` ma wlasna bramke `fed &&`, wiec wartosc procentu przy `fed == false` nie ma wplywu.
- [81] `e: magazyny - dedup tikow` - mutant NIE KOMPILOWAL SIE w przebiegu 1 (definicja `if false { ... }`; przyczyna nie badana); definicja zastapiona skladniowo poprawnym wariantem (`if { seen.insert(...); false } {`) i uruchomiona w przebiegu 2.
- [83] `e: akcesor - odliczanie`, [89] `e: pula - pokrycie`, [126] `p: domyslnie nienakarmione` - REALNE LUKI wektorow glownych (ulamkowa karencja glodu; ujemne zapasy "przed"; migawka bez wpisow `fedByCityId`). Domkniete przez NOWY plik `tests/p6_7a_vectors/edge.json` (osobny PRNG; wektory glowne `params/tempo_stawki/growth/empire/post_central/manpower` bajt w bajt BEZ zmian - `cmp`), czytany w tescie `advance_empire_food_matches_web`, `simulation_helpers_match_web` i `post_central_growth_matches_web`.

Przebieg 2 (`mutation-evidence-r1b.txt`): 4 mutanty ([81], [83], [89], [126]) na testach z `edge.json`: 4/4 WYKRYTE.

Wynik koncowy: 100 uruchomionych mutantow = 96 wykrytych + 4 rownowazne z uzasadnieniem; 0 ocalalych bez uzasadnienia. Testy po przebiegu 1 tylko DODAJA przypadki (zadna asercja ani wektor nie zostaly usuniete/zmienione), wiec 92 mutanty wykryte w przebiegu 1 pozostaja wykryte (monotonicznosc); pelnego ponownego przebiegu 100 mutantow na koncowym zestawie testow NIE wykonano.

Nieuruchomione mutanty (57; indeksy i nazwy z `mutate-p67a.py`): [12] g: wzrost - szczescie ceil; [15] g: wzrost - mnoznik zdrowia macierzy; [16] g: macierz - glod bez max; [23] g: ulamkowy - ubytek; [27] g: cap - spichlerz; [29] g: cap - macierz civ; [30] g: przyrost slotow - cap; [32] g: tury do obywatela - ceil; [35] g: glod - nakarmione zeruje tury; [36] g: glod - dlug; [37] g: ensure - flaga migracji; [39] g: ensure - domyslny poziom; [40] g: ensure - bufor glodu; [41] g: build - sekcja; [42] g: build - tylko skonczone; [44] t: tempo - klucz; [47] t: stawki - rekord >0; [48] t: stawki - cudo; [52] t: era - hangul T; [53] t: era - hangul V; [55] t: era - alias; [59] t: spichlerz - tier II koszt; [60] t: spichlerz - budynek; [61] e: recompute - ostatnie id; [63] e: recompute - poziom; [64] e: recompute - spichlerz tika; [77] e: advance - stan nowego wlasciciela; [80] e: cap - epoka; [84] e: akcesor - glodny barbarzynca; [85] e: akcesor - clear; [92] e: auto - force; [93] e: limit - najnizszy nieujemny; [100] e: plan - ensure; [102] e: zmiany - przeliczenie; [105] e: raise - AI zapasy; [107] e: raise - flow dla gracza; [110] e: maxSafe - inny wlasciciel; [111] e: maxSafe - kontrfaktyk min; [112] e: maxSafe - przywrocenie; [118] p: magazyn po turze; [123] p: licznik glodu; [124] p: oblegane miasto; [128] p: macierz wlasciciela; [129] p: zaopatrzenie obywateli; [130] p: szczescie; [131] p: spichlerz z tika; [137] j: szczescie; [139] j: trudnosc hard; [142] j: spichlerz koszt I; [145] j: tempo normalny; [148] j: stawki koszt; [149] j: empire baza; [151] j: migracja legacy; [152] j: racje domyslne; [153] j: epoka domyslna; [154] j: epoka fala2; [155] j: diakrytyki n z kreska

### 6.1 Przebieg 1 (`mutation-evidence-r1.txt`)

```text
WYKRYTY   : [0] g: clamp - floor zamiast round -> 7 testow czerwonych: auto_raise_matches_web, recompute_city_food_balances_matches_web, city_ration_level_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [1] g: clamp - zamienione granice -> 13 testow czerwonych: auto_balance_matches_web, equal_growth_plan_matches_web, auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [2] g: legacy - negacja -> 6 testow czerwonych: auto_balance_matches_web, auto_raise_matches_web, equal_growth_plan_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [3] g: procent - domyslny -> 8 testow czerwonych: auto_raise_matches_web, equal_growth_plan_matches_web, auto_balance_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [4] g: poziom miasta - bez clamp -> 1 testow czerwonych: city_ration_level_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [5] g: wzrost % - porownanie poziomu
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [6] g: etykieta - bez przecinka -> 1 testow czerwonych: ration_helpers_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [7] g: koszt racji - bez Spichlerza -> 6 testow czerwonych: equal_growth_plan_matches_web, auto_balance_matches_web, auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [8] g: koszt racji - ujemna populacja -> 1 testow czerwonych: ration_cost_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [9] g: koszt racji - wiersz tabeli -> 2 testow czerwonych: ration_cost_matches_web, ration_helpers_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [10] g: wzrost - male miasto bez max -> 2 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [11] g: wzrost - zdrowie bez floor -> 2 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [13] g: wzrost - cywilizacja floor -> 2 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [14] g: wzrost - bez zaopatrzenia w sumie -> 2 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [17] g: macierz - brak civ -> 2 testow czerwonych: population_matrix_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [18] g: trudnosc - domyslna -> 2 testow czerwonych: difficulty_multiplier_matches_web, growth_percent_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [19] g: ulamkowy - dodatni limit -> 2 testow czerwonych: fractional_growth_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [20] g: ulamkowy - petla wzrostu -> 1 testow czerwonych: fractional_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [21] g: ulamkowy - minimalna populacja -> 2 testow czerwonych: fractional_growth_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [22] g: ulamkowy - przyrost -> 2 testow czerwonych: fractional_growth_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [24] g: ulamkowy - tylko nakarmione -> 1 testow czerwonych: fractional_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [25] g: cap - delta macierzy -> 1 testow czerwonych: population_cap_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [26] g: cap - akwedukt -> 3 testow czerwonych: fractional_growth_matches_web, population_cap_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [28] g: cap - delta spoza listy -> 1 testow czerwonych: population_cap_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [31] g: tury do obywatela - frac>=1
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [33] g: glod - tury po ubytku -> 2 testow czerwonych: hunger_penalty_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [34] g: glod - minimalna populacja -> 2 testow czerwonych: hunger_penalty_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [38] g: ensure - zakres batonow -> 5 testow czerwonych: auto_raise_matches_web, equal_growth_plan_matches_web, auto_balance_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [43] t: tempo - round -> 1 testow czerwonych: tempo_threshold_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [45] t: szczescie - NaN -> 1 testow czerwonych: happiness_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [46] t: stawki - zero -> 1 testow czerwonych: stawki_constants_and_scalars_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [49] t: stawki - min 1 -> 2 testow czerwonych: stawki_constants_and_scalars_match_web, stock_cost_record_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [50] t: era - pusty napis -> 1 testow czerwonych: research_era_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [51] t: era - bez trim -> 1 testow czerwonych: research_era_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [54] t: era - fala2 -> 1 testow czerwonych: research_era_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [56] t: era - tabela -> 1 testow czerwonych: research_era_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [57] t: magazyn - wykladnik -> 2 testow czerwonych: advance_empire_food_matches_web, magazyn_era_multiplier_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [58] t: spichlerz - tier II wzrost -> 2 testow czerwonych: growth_percent_matches_web, spichlerz_inputs_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [62] e: recompute - netto -> 5 testow czerwonych: auto_balance_matches_web, equal_growth_plan_matches_web, auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [65] e: advance - bilans >= 0 -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [66] e: advance - pokrycie deficytu -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [67] e: advance - cap -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [68] e: advance - glod wojska -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [69] e: advance - karencja -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [70] e: advance - barbarzyncy -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [71] e: advance - wlasciciel tika -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [72] e: advance - oblegany -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [73] e: advance - kolejnosc deficytow -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [74] e: advance - wlasciciele bez duplikatow -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [75] e: advance - era -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [76] e: advance - tury ujemne -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [78] e: cap - tier II -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [79] e: cap - skladnik spichlerza -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
KOMPILACJA: [81] e: magazyny - dedup tikow (mutant nie kompiluje sie)
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [82] e: akcesor - atrycja -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [83] e: akcesor - odliczanie
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [86] e: allFed - epsilon -> 2 testow czerwonych: equal_growth_plan_matches_web, simulation_helpers_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [87] e: solvent - armia -> 5 testow czerwonych: auto_balance_matches_web, equal_growth_plan_matches_web, auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [88] e: cel - armia (flow) -> 4 testow czerwonych: auto_balance_matches_web, auto_raise_matches_web, equal_growth_plan_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [89] e: pula - pokrycie
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [90] e: auto - tylko zarzadzane -> 3 testow czerwonych: auto_balance_matches_web, equal_growth_plan_matches_web, auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [91] e: auto - czlowiek -> 4 testow czerwonych: auto_raise_matches_web, equal_growth_plan_matches_web, auto_balance_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [94] e: plan - poziom na limicie -> 3 testow czerwonych: auto_balance_matches_web, equal_growth_plan_matches_web, auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [95] e: plan - miasto na limicie -> 3 testow czerwonych: auto_balance_matches_web, equal_growth_plan_matches_web, auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [96] e: plan - skan malejacy -> 3 testow czerwonych: equal_growth_plan_matches_web, auto_raise_matches_web, auto_balance_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [97] e: plan - nie przywraca poziomow -> 3 testow czerwonych: auto_raise_matches_web, auto_balance_matches_web, equal_growth_plan_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [98] e: plan - bez przeliczenia na koniec -> 1 testow czerwonych: equal_growth_plan_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [99] e: plan - brak minimum
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [101] e: zmiany - epsilon -> 2 testow czerwonych: auto_raise_matches_web, auto_balance_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [103] e: balance - warunek wczesnego wyjscia -> 1 testow czerwonych: auto_balance_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [104] e: raise - nadwyzka gracza -> 1 testow czerwonych: auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [106] e: raise - wypłacalność -> 1 testow czerwonych: auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [108] e: maxSafe - gracz -> 1 testow czerwonych: max_safe_poziom_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [109] e: maxSafe - warunek -> 1 testow czerwonych: max_safe_poziom_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [113] p: akwedukt -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [114] p: spichlerz budynek -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [115] p: glod nie zmienia populacji -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [116] p: wzrost tylko nakarmione
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [117] p: ubytek -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [119] p: zmiana populacji -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [120] p: era wlasciciela -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [121] p: manpower - poprzednia populacja -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [122] p: licznik wzrostu -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [125] p: wykluczone heksy -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [126] p: domyslnie nienakarmione
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [127] p: callback zmiany -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [132] p: populacja do rebalansu -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [133] j: wzrost % poziom 6 -> 4 testow czerwonych: constants_match_running_web, growth_percent_matches_web, ration_helpers_match_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [134] j: wzrost % poziom 1.5 -> 9 testow czerwonych: auto_balance_matches_web, equal_growth_plan_matches_web, auto_raise_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [135] j: male miasto -> 2 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [136] j: zdrowie -> 2 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [138] j: cywilizacja skala -> 2 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [140] j: limit twardy -> 2 testow czerwonych: fractional_growth_matches_web, population_cap_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [141] j: spichlerz wzrost II -> 3 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web, spichlerz_inputs_match_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [143] j: spichlerz cap II -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [144] j: magazyn podstawa -> 2 testow czerwonych: advance_empire_food_matches_web, magazyn_era_multiplier_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [146] j: tempo prog min -> 1 testow czerwonych: tempo_threshold_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [147] j: stawki fala2 -> 2 testow czerwonych: stock_cost_record_matches_web, stawki_constants_and_scalars_match_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [150] j: empire hp -> 2 testow czerwonych: advance_empire_food_matches_web, build_params_match_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [156] j: racje poziom 4 -> 7 testow czerwonych: auto_raise_matches_web, auto_balance_matches_web, equal_growth_plan_matches_web
  przywrocono data/derived/racje.json: SHA-256 zgodny
mutantow=100 przezylo/niekompilujace/timeout=8
   g: wzrost % - porownanie poziomu
   g: tury do obywatela - frac>=1
   e: magazyny - dedup tikow [nie kompiluje]
   e: akcesor - odliczanie
   e: pula - pokrycie
   e: plan - brak minimum
   p: wzrost tylko nakarmione
   p: domyslnie nienakarmione
```

### 6.2 Przebieg 2 (`mutation-evidence-r1b.txt`)

```text
WYKRYTY   : [81] e: magazyny - dedup tikow -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [83] e: akcesor - odliczanie -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [89] e: pula - pokrycie -> 1 testow czerwonych: simulation_helpers_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [126] p: domyslnie nienakarmione -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
mutantow=4 przezylo/niekompilujace/timeout=0
```

### 6.3 Runda 2 (`mutation-evidence-r2.txt`): 57 mutantow nieuruchomionych w r1 + 3 nowe

Wykonanie: `mutate-p67a.py` z `MUT_LIST` = 57 indeksow z `mutation-notes-r1.txt` + 156, 157, 158 (trzy nowe mutanty klamr macierzy: `g: macierz - zdrowie bez max`, `g: macierz - glod zamiast zdrowia`, `g: macierz - delta cap z innego klucza`; numeracja starego ostatniego mutanta `j: racje poziom 4` przesunela sie z 156 na 159 - uruchomiony w r1), `MUT_CHECK=1` potwierdzil, ze kazdy z 160 fragmentow wystepuje w pliku DOKLADNIE raz, sekwencyjnie, jeden mutant naraz, `cargo test --no-fail-fast` z binariami dobranymi do mutanta (`tests_for`), timeout 1500 s, bez rownoleglych buildow na tym worktree. Po KAZDYM mutancie plik jest przywracany i porownywany SHA-256 ze stanem sprzed mutacji: **65 x zgodny, 0 x NIEZGODNY**. Przed seria stan zatwierdzony (commit `650fcd1a`), po serii `git status` bez zmian w `src/` i `data/` (§9).

**Wynik pierwszego przebiegu r2 (2a + 2b): uruchomiono 60 mutantow: 55 WYKRYTYCH, 5 niewykrytych: [42], [55], [84], [85], [107].** Dwa z nich ([42], [55]) sa ROWNOWAZNE (dowod nizej); trzy ([84] `e: akcesor - glodny barbarzynca`, [85] `e: akcesor - clear`, [107] `e: raise - flow dla gracza`) byly REALNYMI LUKAMI wektorow - zamkniete w r2c:
- [84] i [85]: `edge.json::advance[*].out.accessorsAfterClear` (akcesory po `clearLastEmpireFoodTicks` wywolanym PO realnym `advanceEmpireFood`: tiki i `_maxCapByOwner` czyszczone) oraz `edge.json::advance[*].out.injected` (`_setLastEmpireFoodTicks` - eksport weba - z tikiem wlasciciela -1: `isArmyHungry(-1)`/`isArmyStarving(-1)` musza byc `false` mimo `glodWojska`/`glodWojskaAtrycjaAktywna` = true; guardy `isBarbarian` sa nieosiagalne przez sama `advanceEmpireFood`, ktora pomija barbarzyncow, `empire-food.ts:216`); test `advance_empire_food_matches_web` sprawdza oba (helper `check_accessors`),
- [107]: `edge.json::{raiseFlow, planFlow, balanceFlow}` (60 + 40 + 40 scenariuszy `planScenario(kind, i, true)`: koszt armii 0,4-1,6 x |biezaca nadwyzka|, rezerwa 30-400, kryterium FLOW gracza, `requireProductionSurplus` = true), kryterium flow (`nadwyzka - koszt >= 0`) rozni sie wtedy od kryterium zapasowego (`nadwyzka + zapasy - koszt >= 0`); testy `auto_raise_matches_web`, `equal_growth_plan_matches_web`, `auto_balance_matches_web` lacza je z wektorami glownymi.

**Wynik koncowy r2 (po r2c): 60 mutantow: 58 WYKRYTYCH, 2 niewykrytych (obie rownowazne, ocena nizej).**

Przebieg 2a (`mutation-evidence-r2.txt`; mutanty 12-60; zadanie w tle zostalo zatrzymane przez limit czasu 30 min w trakcie mutanta [61] - sygnal SIGTERM wywolal przywrocenie pliku, ostatnia linia `przywrocono ... zgodny` bez werdyktu dotyczy [61]; [35] zgloszony jako `KOMPILACJA` przy dysku ~99% zajetym przez inne procesy - powtorzony w 2b):

```text
WYKRYTY   : [12] g: wzrost - szczescie ceil -> 2 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [15] g: wzrost - mnoznik zdrowia macierzy -> 2 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [16] g: macierz - glod bez max -> 1 testow czerwonych: population_matrix_synthetic_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [23] g: ulamkowy - ubytek -> 2 testow czerwonych: fractional_growth_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [27] g: cap - spichlerz -> 3 testow czerwonych: fractional_growth_matches_web, population_cap_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [29] g: cap - macierz civ -> 1 testow czerwonych: population_matrix_synthetic_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [30] g: przyrost slotow - cap -> 1 testow czerwonych: gain_and_turns_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [32] g: tury do obywatela - ceil -> 1 testow czerwonych: gain_and_turns_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
KOMPILACJA: [35] g: glod - nakarmione zeruje tury (mutant nie kompiluje sie)
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [36] g: glod - dlug -> 1 testow czerwonych: hunger_penalty_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [37] g: ensure - flaga migracji -> 5 testow czerwonych: equal_growth_plan_matches_web, auto_balance_matches_web, auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [39] g: ensure - domyslny poziom -> 5 testow czerwonych: equal_growth_plan_matches_web, auto_balance_matches_web, auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [40] g: ensure - bufor glodu -> 5 testow czerwonych: auto_raise_matches_web, auto_balance_matches_web, equal_growth_plan_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [41] g: build - sekcja -> 2 testow czerwonych: advance_empire_food_matches_web, build_params_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [42] g: build - tylko skonczone
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [44] t: tempo - klucz -> 2 testow czerwonych: pace_table_matches_web, tempo_threshold_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [47] t: stawki - rekord >0 -> 1 testow czerwonych: stock_cost_record_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [48] t: stawki - cudo -> 1 testow czerwonych: stawki_constants_and_scalars_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [52] t: era - hangul T -> 1 testow czerwonych: research_era_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [53] t: era - hangul V -> 1 testow czerwonych: research_era_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [55] t: era - alias
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [59] t: spichlerz - tier II koszt -> 7 testow czerwonych: auto_balance_matches_web, equal_growth_plan_matches_web, auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [60] t: spichlerz - budynek -> 1 testow czerwonych: spichlerz_inputs_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
```

Przebieg 2b (`mutation-evidence-r2b.txt`; powtorka [35] oraz [61]-[158]):

```text
WYKRYTY   : [35] g: glod - nakarmione zeruje tury -> 2 testow czerwonych: hunger_penalty_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [61] e: recompute - ostatnie id -> 1 testow czerwonych: recompute_city_food_balances_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [63] e: recompute - poziom -> 5 testow czerwonych: equal_growth_plan_matches_web, auto_raise_matches_web, auto_balance_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [64] e: recompute - spichlerz tika -> 5 testow czerwonych: auto_balance_matches_web, auto_raise_matches_web, equal_growth_plan_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [77] e: advance - stan nowego wlasciciela -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [80] e: cap - epoka -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [84] e: akcesor - glodny barbarzynca
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [85] e: akcesor - clear
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [92] e: auto - force -> 1 testow czerwonych: runtime_clear_and_deprecated_helpers_match_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [93] e: limit - najnizszy nieujemny -> 5 testow czerwonych: auto_raise_matches_web, auto_balance_matches_web, equal_growth_plan_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [100] e: plan - ensure -> 1 testow czerwonych: equal_growth_plan_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [102] e: zmiany - przeliczenie -> 2 testow czerwonych: auto_raise_matches_web, auto_balance_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [105] e: raise - AI zapasy -> 1 testow czerwonych: auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
PRZEZYL   : [107] e: raise - flow dla gracza
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [110] e: maxSafe - inny wlasciciel -> 1 testow czerwonych: max_safe_poziom_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [111] e: maxSafe - kontrfaktyk min -> 1 testow czerwonych: max_safe_poziom_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [112] e: maxSafe - przywrocenie -> 1 testow czerwonych: max_safe_poziom_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [118] p: magazyn po turze -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [123] p: licznik glodu -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [124] p: oblegane miasto -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [128] p: macierz wlasciciela -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [129] p: zaopatrzenie obywateli -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [130] p: szczescie -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [131] p: spichlerz z tika -> 1 testow czerwonych: post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [137] j: szczescie -> 2 testow czerwonych: growth_percent_matches_web, post_central_growth_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [139] j: trudnosc hard -> 4 testow czerwonych: constants_match_running_web, difficulty_multiplier_matches_web, growth_percent_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [142] j: spichlerz koszt I -> 7 testow czerwonych: equal_growth_plan_matches_web, auto_raise_matches_web, auto_balance_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [145] j: tempo normalny -> 2 testow czerwonych: pace_table_matches_web, tempo_threshold_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [148] j: stawki koszt -> 1 testow czerwonych: stawki_constants_and_scalars_match_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [149] j: empire baza -> 3 testow czerwonych: runtime_clear_and_deprecated_helpers_match_web, advance_empire_food_matches_web, build_params_match_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [151] j: migracja legacy -> 6 testow czerwonych: auto_raise_matches_web, auto_balance_matches_web, equal_growth_plan_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [152] j: racje domyslne -> 1 testow czerwonych: build_params_match_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [153] j: epoka domyslna -> 1 testow czerwonych: research_era_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [154] j: epoka fala2 -> 1 testow czerwonych: research_era_matches_web
  przywrocono data/derived/wzrost-ludnosci-params.json: SHA-256 zgodny
WYKRYTY   : [155] j: diakrytyki n z kreska -> 1 testow czerwonych: research_era_matches_web
  przywrocono data/derived/era-diakrytyki.json: SHA-256 zgodny
WYKRYTY   : [156] g: macierz - zdrowie bez max -> 1 testow czerwonych: population_matrix_synthetic_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [157] g: macierz - glod zamiast zdrowia -> 1 testow czerwonych: population_matrix_synthetic_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [158] g: macierz - delta cap z innego klucza -> 3 testow czerwonych: population_matrix_matches_web, population_matrix_synthetic_matches_web, post_central_growth_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
mutantow=38 przezylo/niekompilujace/timeout=3
   e: akcesor - glodny barbarzynca
   e: akcesor - clear
   e: raise - flow dla gracza
EXIT=1
```

Przebieg 2c (`mutation-evidence-r2c.txt`; powtorka [84], [85], [107] na testach z nowymi wektorami `edge.json`; sekwencyjnie, SHA-256 po kazdym):

```text
WYKRYTY   : [84] e: akcesor - glodny barbarzynca -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [85] e: akcesor - clear -> 1 testow czerwonych: advance_empire_food_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
WYKRYTY   : [107] e: raise - flow dla gracza -> 1 testow czerwonych: auto_raise_matches_web
  przywrocono src/domain/city_growth.rs: SHA-256 zgodny
mutantow=3 przezylo/niekompilujace/timeout=0
EXIT=0
```

Ocena niewykrytych w r2:

- [42] g: build - tylko skonczone (PRZEZYL): ROWNOWAZNY. `pick` czyta wartosc przez `serde_json::Value::as_f64`, a `serde_json::Number` nie moze byc nieskonczony ani NaN (`Number::from_f64(NaN/inf)` zwraca `None`, parser JSON odrzuca `1e999`, `json!(f64::INFINITY)` daje `Null`), wiec `v.is_finite()` jest zawsze prawda dla kazdego `Some(v)`; web (`Number.isFinite(v)`, `population-growth-v85.ts:137`) odrzuca nieskonczonosc, ktora w danych JSON nie istnieje. Zachowanie obu wariantow jest identyczne dla kazdego `serde_json::Value`.
- [55] t: era - alias (PRZEZYL): ROWNOWAZNY przy obecnej tabeli `epoki_badan.aliasy`. Przed petla aliasow `n = strip_diacritics_lower(epoka)` zdejmuje wszystkie znaki laczace U+0300..U+036F (ogonek U+0328, kropka U+0307, akut U+0301), wiec `n` nigdy nie zawiera `ą`/`ż`/`ń`; warianty z diakrytykami (`brąz`, `żelazo`, `kamień`) sa nieosiagalne, a warianty ASCII (`braz`, `zelazo`, `kamien`) sa rowne swojemu `kanon`. Galaz alias zwraca wiec `kanon == n`, a mutant (brak trafienia aliasu) zwraca `n` - ten sam napis. Web ma te same nieosiagalne porownania (`n === 'brąz'`, `r-stawki-strojenie.ts:23-25`). Roznica pojawilaby sie tylko po zmianie tabeli (wariant != kanon, np. nowy alias); test ksztaltu `p6_7a_tables` sprawdza spojnosc aliasow epok (bez pinowania wartosci), ale tego mutanta nie kasuje.

**Zbiorczo r1 + r2:** zdefiniowano 160 mutantow; uruchomiono wszystkie 160 (100 w r1 + 60 w r2). Dla 4 mutantow z r1 (nr [5], [31], [99], [116]) uzasadniono rownowaznosc w §6.1. Pelnego ponownego przebiegu 100 mutantow z r1 na testach r2 nie wykonano (NIE_ZMIERZONO; testy r2 tylko dodaja przypadki i wektory).

## 7. NIE_ZMIERZONO / RUNDA-2 (jawna lista)

1. **Efekt `rebalanceWorkersAfterPopulationChange` w trybie `reczny`** (okolica.ts) - NIE_ZMIERZONO; Rust wola hak i testuje kolejnosc/argumenty (ZAL-6). Port okolicy: osobny temat (P6.8c wg `P6-0 §6b`).
2. **`militaryFoodConsumptionWithSpichlerz`** (turn-economy.ts) jest wstrzykiwany; port razem z turn-economy (P6.8/P6.9). Zalezy od stanu globalnego Soli Spichlerza (`_spichlerzSolArmyByOwner`).
3. **Dublety wejsc** (ZAL-7): Spichlerz, `cityPopulationCap`, `magazynEraMultiplier`, `recomputeCityFoodBalancesInEcon` - zamiana na wlasciwe implementacje po portach P6.8 (RUNDA-2: deduplikacja).
4. **Pola `hungerLossUlamkowy` i `manpower` w `City`** (ZAL-5) - po otwarciu `state.rs`.
5. **Przeniesienie `DEFAULT_POZIOM_RACJI` i `WYZYWIENIE_MAX` do `wzrost-ludnosci-params.json`** i usuniecie ich z `cities-params.json` (ZAL-2) - wymaga zmian poza allowlista.
6. **Konsumenci silnika**: nic w `session.rs`/`playable.rs` jeszcze nie woła `p6_7a` (brak integracji z petla tury) - integracja po P6.8/P6.9 (turn_economy).
7. **NFD poza U+0300..U+036F i kolejnosc znakow laczacych** (ZAL-10) - NIE_ZMIERZONO.
8. **`Math.pow` vs `f64::powf` dla niecalkowitych epok** - `magazynEraMultiplier` zmierzono dla 14 epok (w tym 0, 0.5, 1.5, NaN, Infinity) i w scenariuszach `advance` (epoki 0, 1.5, 2, 3, 4); brak gwarancji bitowej dla dowolnej epoki niecalkowitej (gra uzywa calkowitych).
9. **Dokumenty obowiazkowe** - w r2 przeczytane w calosci (§2a); skutki dla P6.2/P6.9/P6.20 w punktach 11-13 ponizej.
10. **Komendy (P6.2)**: brak powiazan z `onCityRationChange` itp.; logika gotowa do wywolania (P2-5 B8/A2/A3/A7; §9 pkt 14: typowane komendy `set_ration_level` itd. - zadanie P6.2).
11. **Kolejnosc faz tury (P2-5 D-CMD-3)**: `apply_post_central_population_growth` ma byc wolane w fazie koncowej tury; jej kolejnosc wzgledem `turn_economy::resolve_turn` nie jest rozstrzygnieta w tym temacie - zadanie P6.9.
12. **`City` a zapis (LEDGER P6.6B, P2-3 D-ID-11)**: `City` (P6.6B) modeluje 38 z 61 pol; `hungerLossUlamkowy` i `manpower` (oraz flaga `rationMigratedV114`, ktora P2-3 D-ID-11 klasyfikuje jako UI do odrzucenia przy imporcie, a `ensureCityRationDefaults` ustawia i czyta 1:1 z webem) wymagaja decyzji PRZED P6.20 (zapis gry): pole `extra` vs pelny model. `GrowthCity` jest warstwa przejsciowa (ZAL-5).
13. **Efekt `rebalanceWorkersAfterPopulationChange` w trybie `reczny` (zarzut 7 Evaluatora r1) - NADAL NIE_ZMIERZONO, sledzony jako zadanie `W-7A-1`:** warunek zamkniecia = port `okolica.ts::rebalanceWorkersAfterPopulationChange` (P6.8c) z wektorami z uruchomionego weba i podmiana hooka w `p6_7a::post_central`; do tego czasu test `post_central_growth_matches_web` pilnuje wylacznie kolejnosci, liczby i argumentow wywolan hooka (nie jego skutku). Nie jest zamkniety w r2.

## 8. Tabela bylo/jest i zmiany testow

| Element | Bylo | Jest | Zmiana zachowania silnika |
|---|---|---|---|
| Wzrost ludnosci V85 (WZROST%, ulamkowy wzrost, glod, cap) | brak w Rust (tylko uproszczony model `economy.ts::populationGrowth` w `advance_city_growth`) | `p6_7a::growth_v85` (port 1:1 z wektorami) | brak (kod nie jest jeszcze wolany z petli tury) |
| Magazyn zywnosci imperium, autowyzywienie | brak | `p6_7a::empire_food` | brak (j.w.) |
| Tempo wzrostu, szczescie wzrostu, `r-stawki` | brak | `p6_7a::{tempo, happiness, r_stawki}` | brak |
| Stale V85 w danych | `cities-params.json` (kopia 2 wartosci), reszta literaly w TS | `wzrost-ludnosci-params.json` + `era-diakrytyki.json` (nowe), `cities-params.json` bez zmian | brak |
| `P3-22` poz. 35b `CIV_MATRIX_GROWTH_DIFFICULTY_MULT` | ETAP 3 (nierozwiniete) | tabela + czytnik + wektory | brak |
| Testy | 1054 | 1098 (r1: 1097 = +43: 10 + 14 + 8 + 9 + 2; r2: +1 `population_matrix_synthetic_matches_web`) | - |

Zmiany istniejacych testow: **brak** w testach spoza grupy (`tests/city_growth.rs`, `tests/derived_values.rs`, `tests/p6_6b_*` nietkniete). **Lista zmian w testach tematu w r2 (jawnie):** (a) `tests/p6_7a_growth.rs`: NOWY test `population_matrix_synthetic_matches_web` (macierz syntetyczna; asercje: kazdy przypadek bitowo + `assert!(reached_negative > 0)` - test kontrolny, ze galaz klamry `max(0, ...)` jest rzeczywiscie osiagana) + nowe importy (`Num`, `load_civ_matrix`, `resolve_population_matrix_for_civ_in`, `resolve_population_cap_matrix_delta_in`); (b) `tests/p6_7a_post_central.rs`: lancuch przypadkow rozszerzony o `edge.json::postCentralSiege` (40 scenariuszy; zadna asercja nie zostala osłabiona ani usunieta); (c) `tests/p6_7a_vectors/edge.json`: dopisane sekcje `matrixSynth`, `postCentralSiege`; (d) `SHA256SUMS.txt`: format zgodny z `sha256sum -c`; (e) r2b, `tests/p6_7a_empire.rs`: nowy helper `check_accessors` (ta sama tresc asercji co dotychczasowa petla akcesorow, wyniesiona do funkcji), `advance_empire_food_matches_web` sprawdza dodatkowo `accessorsAfterClear` i `injected` (runtime po `clear` i po `_setLastEmpireFoodTicks`), a `equal_growth_plan_matches_web`, `auto_balance_matches_web`, `auto_raise_matches_web` lacza wektory glowne z `edge.json::{planFlow, balanceFlow, raiseFlow}` (import `OwnerFoodStates`; zadna asercja nie zostala oslabiona ani usunieta, liczba testow bez zmian: 1098); (f) `edge.json`: dopisane `advance[*].out.{accessorsAfterClear, injected}`, `raiseFlow`, `planFlow`, `balanceFlow` (istniejace pola i szesc pozostalych plikow wektorow bez zmian, `cmp`).
Zmiany kodu produkcyjnego w r2 (`src/domain/city_growth.rs`, +19/-4 linii, **zero zmiany zachowania**): `resolve_population_cap_matrix_delta` i `resolve_population_matrix_for_civ` deleguja do nowych `*_in(matrix, civ_key)`, ktore dzialaja na JAWNIE podanej macierzy (wersje bez `_in` czytaja wbudowany `civ-matrix.json`, jak web `loadCivMatrix()`); potrzebne, zeby test mogl podac macierz syntetyczna (web w generatorze zmienia `loadCivMatrix()` w miejscu).

## 9. Zero zmian poza allowlista - samokontrola

`git status --short` (przed commitem) i `git diff --cached --name-only` obejmuja wylacznie: `dyspozycje/rust-port/p6/P6-7A-MIASTA-WZROST-A.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1/**`, `rust-port/engine/src/domain/city_growth.rs`, `rust-port/engine/src/data/derived.rs` (dopisek na koncu pliku, od linii z markerem `// P6.7A - wzrost ludnosci`), `rust-port/engine/data/derived/{wzrost-ludnosci-params,era-diakrytyki}.json` (nowe), `rust-port/engine/tests/p6_7a_*.rs`, `rust-port/engine/tests/p6_7a_vectors/**`. `Cargo.lock` jest untracked i NIE jest commitowany. Nietkniete: `bridge.rs`, `Cargo.toml`, `domain/mod.rs`, `lib.rs`, `state.rs`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `tests/p6_m00_skeleton.rs`. Dowod: `dyspozycje/rust-port/p6/P6-7A-MIASTA-WZROST-A.md, dyspozycje/autobot/runs/R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1/**, rust-port/engine/src/domain/city_growth.rs, rust-port/engine/src/data/derived.rs, rust-port/engine/data/derived/wzrost-ludnosci-params.json, rust-port/engine/data/derived/era-diakrytyki.json, rust-port/engine/tests/p6_7a_*.rs, rust-port/engine/tests/p6_7a_vectors/**`.

## 9a. Zero zmian poza allowlista - samokontrola rundy 2

Pliki zmienione w r2 (`git diff --name-only af5426f0..HEAD`, wszystkie w allowliscie): `dyspozycje/rust-port/p6/P6-7A-MIASTA-WZROST-A.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1/**` (skrypty, logi, dowody), `rust-port/engine/src/domain/city_growth.rs` (warianty `*_in`, §8), `rust-port/engine/tests/p6_7a_{growth,post_central,empire}.rs`, `rust-port/engine/tests/p6_7a_vectors/{edge.json,SHA256SUMS.txt}`. Mutacje nie zostawily sladow: po kazdej serii SHA-256 pliku zgodny (§6.3), `git status` bez zmian w `src/` i `data/`. `Cargo.lock` untracked, nie commitowany. Wlasny katalog budowy `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_6c1214b7-ef6-3` (usuniety po pracy), `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_DEV_DEBUG=0`. Web wypakowany do wlasnego katalogu poza repo (`git archive edb8fb56 gra/src gra/data`).

## 10. Jak odtworzyc

```bash
# wektory (z katalogu runu; WEB_ROOT = wypakowany git archive edb8fb56 gra/src gra/data)
git archive edb8fb56 gra/src gra/data | tar -x -C "$WEB_ROOT"
node --experimental-transform-types --no-warnings --import ./p67a-loader-register.mjs ./gen-p67a-vectors.mjs "$WEB_ROOT" rust-port/engine/tests/p6_7a_vectors
node --experimental-transform-types --no-warnings --import ./p67a-loader-register.mjs ./gen-p67a-params.mjs "$WEB_ROOT" rust-port/engine/data/derived
python3 -I verify-p67a-vectors.py "$WEB_ROOT/gra/data" rust-port/engine/tests/p6_7a_vectors
# bramki (z rust-port/engine)
export CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename "$PWD") CARGO_PROFILE_DEV_DEBUG=0
cargo fmt -- --check ; cargo clippy --all-targets -- -D warnings ; cargo test
# mutacje (MUT_CHECK=1 tylko sprawdza fragmenty; MUT_LIST=indeksy, MUT_SKIP/MUT_END ograniczaja zakres)
python3 -I mutate-p67a.py
# tabela symboli, literaly, dowod negatywny
python3 -I gen-symbols-p67a.py "$WEB_ROOT" rust-port/engine symbols-p67a-r1.tsv symbols-p67a-r1.md
python3 -I grep-literals-p67a.py rust-port/engine ; python3 -I verify-negative-p67a.py rust-port/engine
```

Odtworzenie r2 (z katalogu runu; `$WEB_ROOT` jak wyzej):

```text
node --experimental-transform-types --no-warnings --import ./p67a-loader-register.mjs ./gen-p67a-vectors.mjs "$WEB_ROOT" <KATALOG_WYJSCIA>   # 7 plikow JSON + SHA256SUMS.txt identyczne z zatwierdzonymi
(cd rust-port/engine/tests/p6_7a_vectors && sha256sum -c SHA256SUMS.txt)
python3 -I verify-p67a-vectors.py "$WEB_ROOT/gra/data" rust-port/engine/tests/p6_7a_vectors     # PORUWNAN 14955, ROZBIEZNOSCI 0
python3 -I gen-symbols-p67a.py "$WEB_ROOT" rust-port/engine symbols-p67a-r2.tsv symbols-p67a-r2.md
MUT_LIST="<indeksy>" python3 -u -I mutate-p67a.py     # z rust-port/engine, CARGO_TARGET_DIR wlasny; r2: 57 + 156,157,158; powtorka 84,85,107
cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test     # w rust-port/engine
```

## 11. Surowe, pelne wyjscia bramek r1 (kopie plikow `gate-*-r1.log`, bez wyciec)

### 11.1 `cargo fmt -- --check` (rust-port/engine; `gate-fmt-r1.log`)

```text
EXIT=0
```

### 11.2 `cargo clippy --all-targets -- -D warnings` (rust-port/engine; `gate-clippy-r1.log`)

```text
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_6c1214b7-ef6-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 1m 55s
EXIT=0
```

### 11.3 `cargo test` (rust-port/engine; `gate-test-r1.log`; suma `passed=1097 failed=0`)

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_6c1214b7-ef6-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 5m 03s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 13 tests
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test manifest_dest_paths_are_unique ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_wrong_size ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.31s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test effective_work_cost_is_raw_work_web_one_to_one ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_id.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/city_id-693b1037fdbc4b08)

running 6 tests
test barbarian_city_garrison_json_keeps_numeric_city_id ... ok
test barbarian_cleared_cities_round_trip_as_numbers ... ok
test city_id_conversions_round_trip ... ok
test city_id_ordering_matches_raw_value ... ok
test city_id_map_keys_stay_numeric_in_json ... ok
test city_id_serializes_as_bare_number ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/combat_ai_multipliers.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/combat_ai_multipliers-52898acb951a9ad0)

running 5 tests
test accessors_return_the_table_value_not_a_constant ... ok
test city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus ... ok
test table_has_each_row_once_with_known_class_and_status ... ok
test veteran_levels_are_complete_and_non_decreasing ... ok
test las_row_is_class_a_and_marked_read_by_domain ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/counter_multipliers.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/counter_multipliers-c944a65d0a384717)

running 5 tests
test table_lists_each_type_pair_once_with_finite_positive_multiplier ... ok
test domain_reads_table_and_unknown_types_give_no_bonus ... ok
test explicit_unit_bonus_overrides_table ... ok
test table_type_keys_are_canonical ... ok
test table_is_readable_for_every_pair_and_misses_are_none ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test buildings_json_parses ... ok
test wonders_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_ai_params ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_auto_battle_params ... ok
test collection_id_sets_match_web_pin ... ok
test rt_citizen_resource_upkeep ... ok
test rt_civ_ai ... ok
test rt_city_names_pools ... ok
test rt_civ_params ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_buildings ... ok
test rt_counters ... ok
test rt_diplomacy ... ok
test rt_civ_matrix ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_e_start_params ... ok
test rt_econ_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_map_gen_params ... ok
test rt_miasto_params ... ok
test rt_power_params ... ok
test rt_resources ... ok
test rt_society_params ... ok
test rt_terrain_combat ... ok
test rt_terrain_improvements ... ok
test rt_tech ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_terrain_movement ... ok
test rt_combat_params ... ok
test rt_civs ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test rt_wonders ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_missing_file_is_file_missing ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.89s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/derived_values.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/derived_values-7eb2b3615468dd51)

running 25 tests
test basket_and_treaty_duration_read_diplomacy_table ... ok
test building_gold_upkeep_has_one_row_per_building_level ... ok
test building_table_has_exactly_the_42_canonical_ids_once_each ... ok
test building_table_palac_has_no_stock_cost_and_others_do ... ok
test difficulty_is_one_type_across_domain_modules ... ok
test diplomacy_multipliers_cover_each_constant_once_with_web_values ... ok
test domain_building_costs_read_the_building_table_values_without_recomputing_them ... ok
test building_table_key_shape_is_known_resources_and_mirrors_the_base_keys ... ok
test gold_table_has_exactly_the_75_units_once_each_and_known_eras ... ok
test improvement_and_wonder_tables_cover_every_entry_once ... ok
test domain_recruitment_reads_the_gold_table_without_recomputation ... ok
test domain_recruitment_reads_the_unit_table_values_without_recomputing_them ... ok
test research_costs_cover_each_tech_tempo_and_axis_once ... ok
test racje_cover_every_half_step_from_zero_to_six_once ... ok
test storage_caps_cover_each_era_and_difficulty_once ... ok
test trade_multipliers_cover_each_constant_once_with_values ... ok
test unit_table_epoch_field_matches_units_json ... ok
test unit_table_has_one_row_per_units_json_record_and_no_extra_rows ... ok
test unit_gold_states_cover_each_unit_and_axis_combination_exactly_once ... ok
test building_work_states_cover_each_building_level_and_axis_combination_exactly_once ... ok
test unit_table_keeps_the_units_json_base_as_provenance ... ok
test work_table_is_read_by_the_domain_without_recomputation ... ok
test unit_food_has_twelve_states_per_unit_and_integer_hundredths ... ok
test work_table_has_exactly_the_42_buildings_once_each_and_positive_values ... ok
test unit_table_key_shape_and_positive_integer_values ... ok

test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/diplomacy-d94c0845f92f376e)

running 32 tests
test alliance_uses_configured_hegemon_threshold ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test annexation_requires_vassal_economy_orientation ... ok
test peace_price_is_independent_of_treaty_duration ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test axial_coordinates_keep_the_cube_invariant ... ok
test terrain_movement_costs_are_explicit ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test map_dimensions_and_seed_are_stable ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/owner_ref.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/owner_ref-92f476c7f4239a8a)

running 10 tests
test owner_ref_hash_agrees_with_equality ... ok
test camp_id_is_a_transparent_newtype ... ok
test owner_ref_accessors_and_player_conversion ... ok
test owner_ref_legacy_conversions_match_the_sentinels ... ok
test owner_and_camp_fields_are_plain_numbers_in_struct_json ... ok
test owner_ref_ordering_matches_the_legacy_i64_order ... ok
test owner_ref_refuses_player_ids_that_do_not_fit_the_legacy_number ... ok
test owner_ref_rejects_unknown_negative_numbers ... ok
test player_keyed_maps_keep_numeric_string_keys ... ok
test owner_ref_serializes_every_variant_as_the_legacy_number ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_civ_entry_epoch.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1_civ_entry_epoch-c29112b12d237024)

running 8 tests
test civ_availability_matches_web_vectors_for_every_game_epoch ... ok
test civ_entry_epoch_matches_web_vectors ... ok
test civ_ids_available_match_web_roster_vectors ... ok
test civ_entry_label_matches_web_vectors ... ok
test strict_epoch_ids_reject_non_canonical_spellings ... ok
test game_epoch_order_matches_web ... ok
test game_epoch_index_matches_web_for_every_probe ... ok
test game_epoch_hud_label_matches_web_vectors ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_first_player_city.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1_first_player_city-e31375affc71b1c0)

running 5 tests
test denied_message_matches_web_constant ... ok
test awaiting_first_city_matches_web_for_owner_zero ... ok
test hex_in_start_reveal_matches_web_vectors ... ok
test awaiting_first_city_matches_web_for_explicit_owner_one ... ok
test validate_placement_matches_web_vectors ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_owner_seats.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1_owner_seats-1a3aae5c483a1e2f)

running 6 tests
test hot_seat_cycles_and_skips_unknown_active ... ok
test human_seats_match_web_vectors ... ok
test human_owner_primary_matches_web ... ok
test stub_constants_are_the_web_sentinels ... ok
test major_ai_owner_matches_web_vectors ... ok
test web_owner_minus_five_is_out_of_domain_and_not_representable ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_rng_mulberry.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1_rng_mulberry-617bdab005dd8b1f)

running 2 tests
test mulberry32_is_not_the_lcg_stream ... ok
test mulberry32_matches_web_make_rng_vectors_bit_for_bit ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1b_playerstate.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1b_playerstate-7e0df28b40755091)

running 19 tests
test error_research_step_is_atomic_on_missing_cost ... ok
test hot_seat_two_human_owners_have_independent_player_states ... ok
test error_missing_cost_for_unknown_tempo_and_mode ... ok
test parity_cheapest_tie_break_uses_utf16_order ... ok
test parity_constants_and_defaults_match_web ... ok
test parity_gates_available_and_cheapest ... ok
test parity_per_row_functions ... ok
test parity_research_costs_equal_web_scaled_research_cost ... ok
test parity_vectors_use_the_engine_tech_data ... ok
test serde_missing_research_queue_defaults_to_empty ... ok
test table_constants_are_read_from_data_not_literals ... ok
test table_edit_of_research_cost_changes_the_step ... ok
test table_epoch_map_and_sentinels_come_from_data ... ok
test table_every_engine_tech_has_a_research_cost_for_every_axis ... ok
test table_player_state_params_shape ... ok
test table_research_cost_rows_agree_with_tech_json ... ok
test parity_scenarios_from_web ... ok
test parity_epoch_number ... ok
test parity_parse_prereqs_and_prereqs_met ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.48s

     Running tests/p6_1c_braz_access.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1c_braz_access-043839ba2b428854)

running 7 tests
test city_has_piec_hutniczy_matches_web ... ok
test empire_has_kopalnia_miedzi_matches_web ... ok
test has_braz_access_matches_web ... ok
test normalize_improvement_key_matches_web ... ok
test normalize_improvement_key_known_keys_equal_data_keys ... ok
test prototype_keys_are_out_of_domain_and_do_not_change_braz_outcome ... ok
test bootstrap_table_values_equal_web_constants ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/p6_1c_llama_seed.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1c_llama_seed-e56bbca479ca6477)

running 3 tests
test hex_keys_within_radius_matches_web_loop_order ... ok
test hash_pos_matches_web_hash_pos_verbatim ... ok
test seed_inca_llama_deposits_matches_web_for_all_cases ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.32s

     Running tests/p6_1c_start_cluster.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1c_start_cluster-584791c0a8e00ea4)

running 8 tests
test land_hexes_filter_matches_web_rule ... ok
test constants_and_start_relations_match_web ... ok
test display_label_for_slot_matches_web ... ok
test pick_second_human_start_hex_matches_web ... ok
test build_cluster_start_plan_matches_web_for_all_cases ... ok
test second_human_civ_equal_to_player_civ_is_rejected_like_web ... ok
test second_human_without_legal_hex_yields_no_second_seat_derived_from_code ... ok
test vectors_cover_the_branches_of_build_cluster_start_plan ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.65s

     Running tests/p6_1c_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1c_tables-2a37790854995833)

running 4 tests
test braz_table_has_sane_shape_and_consistent_references ... ok
test cluster_table_has_sane_shape ... ok
test start_tables_parse_with_deny_unknown_fields ... ok
test llama_table_has_sane_shape ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1d_city_names.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1d_city_names-4bfda12150196ed9)

running 13 tests
test city_name_with_suffix_matches_web ... ok
test nazwa_klastra_at_matches_web ... ok
test embedded_pool_data_is_byte_identical_to_data_used_for_vectors ... ok
test collect_used_city_names_matches_web ... ok
test pick_next_city_name_from_names_matches_web_for_synthetic_queues ... ok
test pool_length_constants_match_web ... ok
test resolve_state_city_name_matches_web ... ok
test cluster_rival_from_pool_matches_web ... ok
test suggest_and_ai_founding_names_match_web ... ok
test state_city_name_at_matches_web ... ok
test rival_pool_index_matches_web ... ok
test validate_city_names_pools_matches_web ... ok
test pick_capital_foreign_regular_match_web_for_real_pools ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s

     Running tests/p6_1d_civ_bonuses.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1d_civ_bonuses-30f5c7450cfc6997)

running 14 tests
test building_cost_discount_matches_web ... ok
test embedded_data_is_byte_identical_to_data_used_for_vectors ... ok
test empty_bonus_list_gives_zero_multipliers ... ok
test apply_multiplier_matches_web ... ok
test is_combat_modifier_bonus_matches_web ... ok
test matrix_bonusy_match_web_for_every_civ_key_variant ... ok
test real_civs_bonuses_convert_without_loss ... ok
test movement_range_siege_wall_multipliers_match_web ... ok
test terrain_forest_detection_matches_web ... ok
test unit_combat_category_matches_web_for_every_unit ... ok
test unit_matches_cel_matches_web_for_every_unit_and_cel ... ok
test strip_diacritics_matches_web_function_cut_verbatim ... ok
test bonus_applies_per_entry_matches_web_for_multi_entry_lists ... ok
test bonus_applies_and_stat_multipliers_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 19.00s

     Running tests/p6_1d_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1d_tables-7c67743f1f351b01)

running 4 tests
test city_name_constants_have_consistent_shape ... ok
test diacritics_table_maps_single_chars_outside_ascii ... ok
test matrix_specs_have_consistent_shape_and_known_param_ids ... ok
test rules_have_known_stats_and_param_ids ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_1e_civ_matrix.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1e_civ_matrix-d0b7dd9cf60d4be3)

running 21 tests
test ai_params_and_diplomacy_rows_match_web ... ok
test ai_fallback_branches_are_actually_exercised ... ok
test apply_civ_matrix_param_matches_web ... ok
test civ_matrix_param_def_matches_web ... ok
test civ_matrix_param_at_difficulty_matches_web ... ok
test civ_matrix_params_at_difficulty_matches_web_order_and_values ... ok
test consumer_status_polarity_band_baseline_match_web_per_parameter ... ok
test civ_matrix_param_matches_web ... ok
test data_files_are_byte_identical_to_web_pin ... ok
test every_matrix_cell_parses_exactly_like_js ... ok
test median_matches_web ... ok
test param_order_and_rows_match_web_for_every_scenario ... ok
test ai_by_typ_resolvers_match_web ... ok
test proc_sum_and_apply_proc_match_web ... ok
test every_status_for_every_parameter_matches_web_texts ... ok
test scale_parameters_are_clamped_and_shifted_only_for_skala ... ok
test status_visibility_is_true_only_for_real_gameplay ... ok
test profile_by_key_resolution_matches_web ... ok
test ai_profiles_and_norms_match_web ... ok
test synthetic_cell_grid_matches_web ... ok
test snapshot_and_profiles_match_web ... ok

test result: ok. 21 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.87s

     Running tests/p6_1e_civ_names.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1e_civ_names-80674a5ae9a4508e)

running 11 tests
test assign_invariants_hold_on_real_roster ... ok
test constants_match_web ... ok
test make_rng_streams_match_web_for_every_seed ... ok
test civ_ids_from_roster_matches_web ... ok
test find_klastra_display_validate_match_web ... ok
test reexports_behave_like_web ... ok
test rotate_preferred_matches_web ... ok
test pool_views_ai_founded_and_validation_match_web ... ok
test assign_ai_civ_types_matches_web ... ok
test pick_active_civ_pool_matches_web ... ok
test start_foreign_rival_state_names_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.53s

     Running tests/p6_1e_js_compat.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1e_js_compat-08e1cb152706a259)

running 8 tests
test math_round_matches_js_bit_for_bit ... ok
test intensity_label_matches_web ... ok
test is_integer_and_min_max_clamp_follow_js ... ok
test number_to_string_matches_js_for_every_vector ... ok
test parameter_label_matches_web ... ok
test formatted_value_matches_web ... ok
test to_fixed_matches_js_for_every_digit_count ... ok
test trim_matches_js_string_trim ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.30s

     Running tests/p6_1e_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_1e_tables-9dc9ef20c17d92b2)

running 7 tests
test parameter_label_dictionary_has_nonempty_entries_and_suffix_rule ... ok
test semantic_neutral_band_rules_cover_every_parameter_definition ... ok
test semantic_table_sets_reference_existing_parameters_and_are_disjoint ... ok
test semantic_table_has_text_for_every_status_and_placeholder ... ok
test tables_parse_and_are_cached ... ok
test params_table_is_consistent_with_matrix_and_civs ... ok
test modules_contain_no_balance_or_data_literals ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_23_fort.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_23_fort-324dd86b69e58eeb)

running 5 tests
test fort_rules_table_references_known_improvements ... ok
test fort_node_conversion_and_reservation_match_web ... ok
test territory_dependencies_match_web ... ok
test takeover_on_city_founded_matches_web ... ok
test evacuation_hex_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.60s

     Running tests/p6_23_hexmove.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_23_hexmove-a546770c25695422)

running 4 tests
test foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors ... ok
test city_at_hex_and_occupancy_match_web ... ok
test ai_entry_into_empty_enemy_city_matches_web ... ok
test foreign_city_blocks_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.22s

     Running tests/p6_23_improvements.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_23_improvements-2f6107250ed9d0bf)

running 10 tests
test constants_match_web ... ok
test era_and_cost_scaling_match_web ... ok
test applying_bonuses_matches_web ... ok
test catalog_key_order_equals_json_file_order_including_meta_rows ... ok
test migration_functions_match_web ... ok
test rules_tables_have_consistent_shape ... ok
test hex_layer_functions_match_web ... ok
test territory_and_ore_yields_match_web ... ok
test normalize_and_lookup_functions_match_web ... ok
test prototype_keys_pass_normalize_like_in_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.78s

     Running tests/p6_23_order.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_23_order-b99acb8ea5803b82)

running 11 tests
test engine_society_params_match_web_subset_used_by_vectors ... ok
test fallback_params_equal_web_constant ... ok
test evaluate_order_matches_web ... ok
test happiness_breakdown_matches_web ... ok
test load_order_params_matches_web ... ok
test order_shape_invariants_hold_for_any_table_values ... ok
test compute_order_matches_web ... ok
test order_effects_matches_web ... ok
test order_effects_to_yield_mults_matches_web ... ok
test pick_revolt_migration_target_matches_web ... ok
test order_tier_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.85s

     Running tests/p6_23_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_23_tables-6de635983c184b19)

running 3 tests
test porzadek_params_table_is_complete_and_finite ... ok
test teren_ruch_reguly_table_has_nonempty_lists ... ok
test ulepszenia_reguly_table_references_existing_improvements_only ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_4_core.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_4_core-1b564fea4bb5288e)

running 10 tests
test hex_distance_matches_web ... ok
test constants_read_from_running_web_match_tables ... ok
test road_modifier_matches_web_including_floor_and_special_costs ... ok
test path_cost_matches_web ... ok
test stack_group_id_matches_web ... ok
test terrain_and_embark_costs_match_web_on_maps ... ok
test compute_reachable_matches_web_order_and_min_move ... ok
test compute_path_matches_web_including_ties_and_edge_destinations ... ok
test visibility_helpers_match_web ... ok
test terrain_cost_combinations_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.66s

     Running tests/p6_4_embark.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_4_embark-1585566f17a207b0)

running 4 tests
test can_unit_embark_matches_web ... ok
test apply_embark_state_after_move_matches_web ... ok
test water_hex_queries_match_web ... ok
test move_cost_fn_for_matches_web_on_every_map_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.38s

     Running tests/p6_4_march.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_4_march-bae7bfc63cf555d2)

running 6 tests
test save_validation_and_round_trip_match_web ... ok
test fog_frontier_and_fog_plan_match_web ... ok
test truncate_path_to_budget_matches_web_including_min_move ... ok
test plan_path_turns_matches_web ... ok
test execute_march_step_matches_web ... ok
test should_stop_at_obstacle_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.85s

     Running tests/p6_4_rally.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_4_rally-4bbcd32c03f67cc3)

running 3 tests
test load_from_save_and_number_parsing_match_web ... ok
test launch_leaders_one_per_stack_match_web ... ok
test set_clear_and_save_sequences_match_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_4_scout.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_4_scout-573fb211c9224499)

running 5 tests
test explore_scores_match_web ... ok
test scout_flags_match_web ... ok
test run_scouts_auto_explore_matches_web ... ok
test pick_scout_explore_target_matches_web_including_rng_use ... ok
test advance_scout_auto_explore_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 39.72s

     Running tests/p6_4_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_4_tables-d82f71a9bfb2cdbc)

running 4 tests
test table_parses_and_every_row_names_its_web_source ... ok
test text_rows_are_nonempty_and_distinct ... ok
test neighbour_table_is_six_distinct_adjacent_offsets ... ok
test numeric_rows_have_sane_shape_without_pinning_values ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_5a_cost.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_5a_cost-a4777603b2625768)

running 4 tests
test js_round_matches_half_up_semantics ... ok
test table_constants_equal_the_running_web_object ... ok
test unit_cost_pace_matches_web_bitwise ... ok
test replace_context_keeps_every_field_and_the_required_stock ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_5a_display.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_5a_display-f61d69c84dc8b548)

running 7 tests
test field_power_passes_roster_in_web_order_and_returns_sum ... ok
test hp_pool_matches_web_including_nonfinite_and_overfull_hp ... ok
test badge_and_veteran_maxima_match_web ... ok
test compute_stack_display_matches_web_order_and_vitals ... ok
test stack_vitals_matches_web ... ok
test unit_at_representative_matches_web ... ok
test representative_matches_web_including_utf16_id_order_and_nan_attack ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.10s

     Running tests/p6_5a_ruch.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_5a_ruch-0e062d5664866c50)

running 8 tests
test adjacent_empty_and_split_destinations_match_web ... ok
test bounce_hex_assignment_matches_web_including_duplicates_and_blocking ... ok
test bounce_from_origin_and_separate_return_hex_match_web ... ok
test hud_actions_match_web ... ok
test ruch_pools_match_web_bitwise ... ok
test separate_return_matches_web_bitwise ... ok
test sync_and_deduct_match_web ... ok
test unit_with_pooled_ruch_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.45s

     Running tests/p6_5a_stack.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_5a_stack-32bcaffc556db8d5)

running 10 tests
test fresh_and_shared_stack_group_ids_match_web_sequence ... ok
test all_defenders_and_wake_stack_match_web ... ok
test adjacent_army_hexes_and_active_stack_match_web ... ok
test garrison_and_field_fortify_transitions_match_web ... ok
test same_stack_group_and_stack_key_match_web ... ok
test stack_group_id_and_render_key_match_web ... ok
test law_garrison_counts_match_web ... ok
test stack_group_id_agrees_with_p64_port_on_the_same_unit ... ok
test transition_chains_match_web_including_both_fortifications_at_once ... ok
test visible_colocated_and_garrison_queries_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.68s

     Running tests/p6_5a_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_5a_tables-c73c4ca1005ab433)

running 2 tests
test army_params_parse_and_have_sane_shape ... ok
test tempo_table_parses_and_has_distinct_keys_with_positive_multipliers ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_5b_bonuses.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_5b_bonuses-02e0bfe8577aeac4)

running 8 tests
test building_roles_and_real_game_data_match_web ... ok
test chain_depth_limit_matches_web ... ok
test stat_multiplier_merge_is_generic_over_any_structural_type ... ok
test gain_hint_text_matches_web_for_arbitrary_gains ... ok
test stat_multiplier_merge_matches_web ... ok
test unit_progress_badges_and_fractions_match_web ... ok
test city_visit_gain_progress_and_hint_match_web ... ok
test city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.08s

     Running tests/p6_5b_format.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_5b_format-8864aed56360906f)

running 5 tests
test citizen_label_matches_web ... ok
test number_to_string_matches_web ... ok
test locale_compare_table_is_the_measured_primary_order ... ok
test locale_compare_matches_web_for_ascii ... ok
test population_formats_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.89s

     Running tests/p6_5b_manpower.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_5b_manpower-0a099d61a31307ee)

running 13 tests
test besieged_location_sort_key_sync_and_civilian_match_web ... ok
test civ_bonus_multipliers_match_web ... ok
test city_pool_functions_match_web ... ok
test empire_deduct_refund_and_spawn_mutate_like_web ... ok
test game_default_params_equal_the_running_web_defaults ... ok
test opt_helpers_are_consistent ... ok
test empire_totals_match_web ... ok
test heal_cost_and_cap_match_web ... ok
test era_table_and_citizen_scalars_match_web ... ok
test pool_and_cost_scalars_match_web ... ok
test regen_gain_matches_web_including_default_params ... ok
test raw_param_loaders_match_web ... ok
test spawn_and_refund_functions_match_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 9.87s

     Running tests/p6_5b_replenish.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_5b_replenish-11d5c4ac4b77306b)

running 1 test
test replenishment_matches_web_state_results_and_closure_protocol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.70s

     Running tests/p6_5b_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_5b_tables-4f918dda2f6680dd)

running 6 tests
test era_table_rows_are_contiguous_and_cover_the_clamp_range ... ok
test civilian_set_is_resolved_from_the_table ... ok
test tables_are_loaded_from_the_embedded_json_files ... ok
test tables_parse_and_have_the_expected_shape ... ok
test p65a_badge_closures_are_closed_by_the_real_path_badge_port ... ok
test table_constants_equal_the_running_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.37s

     Running tests/p6_6a_conquest.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6a_conquest-230020c5d317bb55)

running 6 tests
test clear_city_culture_mix_removes_both_fields ... ok
test thresholds_match_web ... ok
test revolt_multiplier_and_deprecated_penalties_match_web ... ok
test building_flags_match_web ... ok
test on_city_captured_culture_matches_web_with_injected_circle ... ok
test tick_city_culture_religion_matches_web_with_injected_conversions ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.28s

     Running tests/p6_6a_founding.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6a_founding-99bc07a6ebb0028d)

running 10 tests
test costs_follow_injected_params ... ok
test evaluate_found_city_affordance_matches_web ... ok
test first_city_is_free_for_any_params ... ok
test cost_labels_match_web ... ok
test cost_constants_match_running_web ... ok
test production_params_come_from_data_tables ... ok
test read_param_accepts_only_finite_numbers ... ok
test can_afford_found_city_matches_web ... ok
test is_subsequent_found_city_matches_web ... ok
test pick_source_city_matches_web_including_rand_protocol ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.24s

     Running tests/p6_6a_hexclear.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6a_hexclear-98167207530960b3)

running 4 tests
test clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed ... ok
test clear_hex_for_city_center_matches_web ... ok
test keep_set_and_predicate_match_web ... ok
test apply_city_founding_to_hex_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/p6_6a_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6a_tables-49f7fae6dbfdf022)

running 6 tests
test founding_costs_are_present_in_miasto_params ... ok
test conquest_table_is_well_formed ... ok
test default_sight_comes_from_map_gen_params_when_positive ... ok
test founding_table_is_well_formed ... ok
test visibility_table_is_well_formed ... ok
test hex_clear_table_is_well_formed ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_6a_visibility.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6a_visibility-0615129695460042)

running 11 tests
test compute_visible_along_path_matches_web ... ok
test city_sight_radius_reexport_matches_web ... ok
test add_explored_and_render_sets_match_web ... ok
test compute_visible_fixed_sight_matches_web ... ok
test compute_player_visibility_matches_web ... ok
test default_sight_uses_the_data_value_only_when_positive ... ok
test compute_visible_at_matches_web ... ok
test constants_match_running_web ... ok
test units_visible_on_map_matches_web ... ok
test key_listings_and_terrain_predicates_match_web ... ok
test unit_sight_resolver_and_compute_visible_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.84s

     Running tests/p6_6b_cities_ensure.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6b_cities_ensure-50bdd28ce75e4eaa)

running 3 tests
test ensure_city_podzial_defaults_matches_web ... ok
test ensure_city_save_defaults_is_idempotent_on_web_outputs ... ok
test ensure_city_save_defaults_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.11s

     Running tests/p6_6b_cities_found.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6b_cities_found-bf324e45fa4c28c4)

running 5 tests
test city_name_and_predicates_match_web ... ok
test found_city_from_village_matches_web ... ok
test can_found_city_matches_web ... ok
test found_city_at_matches_web ... ok
test found_city_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.68s

     Running tests/p6_6b_display.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6b_display-cf51bca517933bcf)

running 13 tests
test foreign_capital_map_name_matches_web ... ok
test format_entity_display_name_matches_web ... ok
test format_city_map_label_matches_web ... ok
test clear_city_state_flag_on_capture_matches_web ... ok
test is_owner_cluster_city_state_matches_web ... ok
test is_cluster_city_state_slot_matches_web ... ok
test format_owner_diplo_label_matches_web ... ok
test labels_match_running_web ... ok
test resolve_owner_base_name_matches_web ... ok
test is_technical_owner_label_matches_web ... ok
test strip_city_state_suffix_matches_web ... ok
test should_force_culture_icon_matches_web ... ok
test sanitize_owner_display_base_matches_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.77s

     Running tests/p6_6b_empire.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6b_empire-0403df939c625d79)

running 6 tests
test podzial_pracy_functions_match_web ... ok
test okolica_focus_functions_match_web ... ok
test budowa_profil_functions_match_web ... ok
test podzial_pracy_migration_matches_web ... ok
test poziom_racji_functions_match_web ... ok
test upgrade_budowa_profil_auto_defaults_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.30s

     Running tests/p6_6b_lists.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6b_lists-76264e548cdf3b61)

running 3 tests
test default_nazwa_matches_web ... ok
test dedupe_matches_web ... ok
test id_generator_and_loader_match_web_sequence ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_6b_percent.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6b_percent-1f6b6df5d7367a50)

running 10 tests
test budowa_priority_helpers_match_web ... ok
test constants_match_running_web ... ok
test clamp_functions_match_web ... ok
test adjust_handel_split_matches_web ... ok
test normalize_podzial_handlu_matches_web ... ok
test podzial_pracy_z_procentu_puli_matches_web ... ok
test resolve_effective_ulepszenia_matches_web ... ok
test resolve_praca_percent_from_raw_matches_web ... ok
test ulepszenia_policy_and_caps_match_web ... ok
test snap_and_migrate_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.83s

     Running tests/p6_6b_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_6b_tables-30bc19375e8a4aab)

running 5 tests
test cities_defaults_are_consistent_with_each_other ... ok
test cities_foreign_inputs_agree_with_engine_data ... ok
test cities_table_is_well_formed ... ok
test min_city_distance_comes_from_miasto_params ... ok
test display_names_table_is_well_formed ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_7a_empire.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_7a_empire-94828196ae0ab72d)

running 9 tests
test auto_raise_matches_web ... ok
test equal_growth_plan_matches_web ... ok
test auto_balance_matches_web ... ok
test advance_empire_food_matches_web ... ok
test max_safe_poziom_matches_web ... ok
test recompute_city_food_balances_matches_web ... ok
test wyzywienie_poziom_na_limicie_matches_web ... ok
test runtime_clear_and_deprecated_helpers_match_web ... ok
test simulation_helpers_match_web ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.99s

     Running tests/p6_7a_growth.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_7a_growth-af8e8f483d682d87)

running 14 tests
test constants_match_running_web ... ok
test city_ration_level_matches_web ... ok
test ensure_city_ration_defaults_matches_web ... ok
test difficulty_multiplier_matches_web ... ok
test build_params_match_web ... ok
test fractional_growth_matches_web ... ok
test gain_and_turns_match_web ... ok
test growth_percent_matches_web ... ok
test hunger_penalty_matches_web ... ok
test population_matrix_matches_web ... ok
test single_source_of_default_level_and_max ... ok
test ration_cost_matches_web ... ok
test population_cap_matches_web ... ok
test ration_helpers_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.92s

     Running tests/p6_7a_post_central.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_7a_post_central-641bfaa99773b056)

running 2 tests
test manpower_refresh_used_by_growth_matches_web ... ok
test post_central_growth_matches_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.46s

     Running tests/p6_7a_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_7a_tables-5b4117dddd54e7ef)

running 10 tests
test food_cost_table_covers_every_level ... ok
test growth_table_covers_every_level_exactly_once ... ok
test params_file_parses_and_has_no_unknown_fields ... ok
test diacritics_table_is_well_formed ... ok
test ration_scale_is_a_well_formed_grid ... ok
test legacy_ration_migration_targets_lie_on_the_grid ... ok
test numeric_inputs_are_finite_and_structurally_valid ... ok
test research_era_aliases_are_consistent ... ok
test single_source_for_default_level_and_scale_max ... ok
test spichlerz_ids_are_distinct_and_non_empty ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_7a_tempo.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_7a_tempo-128bb6a4bfbb174c)

running 8 tests
test magazyn_era_multiplier_matches_web ... ok
test happiness_matches_web ... ok
test pace_table_matches_web ... ok
test research_era_matches_web ... ok
test spichlerz_inputs_match_web ... ok
test stock_cost_record_matches_web ... ok
test stawki_constants_and_scalars_match_web ... ok
test tempo_threshold_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/p6_m00_skeleton.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m00_skeleton-1864ffd75187226a)

running 5 tests
test doc_row_lists_expected_counts ... ok
test mapgen_mod_declares_exactly_doc_modules ... ok
test skeleton_headers_name_full_owner_ids_from_table ... ok
test domain_mod_declares_top_level_skeleton_modules ... ok
test files_exist_and_start_with_owner_doc_header ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m01_climate.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m01_climate-fc8a7dd62f5452ac)

running 7 tests
test forest_threshold_matches_web_bit_for_bit ... ok
test desert_assignment_predicate_matches_web ... ok
test climate_band_default_arguments_and_ignored_q_match_web ... ok
test polar_predicate_matches_web ... ok
test water_terrain_predicate_matches_web_for_every_terrain ... ok
test world_type_and_climate_band_serde_literals_match_web ... ok
test climate_band_sweep_matches_web_for_every_height_and_row ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/p6_m01_earth_mask.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m01_earth_mask-1779c36a54b4d8e3)

running 10 tests
test derived_mask_file_is_the_single_source_of_mask_data ... ok
test hex_to_norm_edges_match_web ... ok
test mask_dimensions_and_bbox_match_web_bit_for_bit ... ok
test bit_at_clamps_out_of_range_coordinates_like_web ... ok
test polar_rows_inner_dimensions_and_buffers_match_web_for_heights_0_to_600 ... ok
test sample_template_land_matches_web_on_thousands_of_points ... ok
test sample_template_land_nan_is_sea ... ok
test named_constants_match_web_exports ... ok
test all_288000_mask_bits_match_the_web_rows ... ok
test hex_to_template_norm_template_land_subsample_and_threshold_match_web_for_all_dims ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.70s

     Running tests/p6_m01_params_shape.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m01_params_shape-188a388bb5a09197)

running 9 tests
test climate_is_polar_outside_the_map ... ok
test climate_bands_are_ordered_north_to_south_and_cover_the_playable_rows ... ok
test ocean_buffers_never_shrink_with_height_and_respect_their_lower_bound ... ok
test subsample_and_threshold_tiers_never_decrease_resolution_for_bigger_maps ... ok
test params_files_parse_and_have_the_expected_shape ... ok
test params_floats_are_parsed_exactly_from_the_raw_json_text ... ok
test template_sampling_is_zero_outside_the_unit_square ... ok
test mask_file_is_well_formed ... ok
test template_land_respects_border_and_polar_buffers_and_yields_binary_values ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.39s

     Running tests/p6_m01_prims.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m01_prims-963d8aed92ec098f)

running 14 tests
test hex_directions_match_web_in_every_implementation ... ok
test hex_distance_matches_web_for_large_coordinates ... ok
test cos_lerp_matches_web_bit_for_bit ... ok
test all_three_mulberry32_implementations_match_web_for_every_seed_and_step ... ok
test hex_distance_matches_web_on_the_full_grid_in_every_implementation ... ok
test hex_key_matches_web_format ... ok
test js_to_int32_follows_ecmascript_to_int32 ... ok
test mulberry32_state_is_the_seed_until_first_draw ... ok
test fbm_matches_web_bit_for_bit_for_all_octave_counts ... ok
test js_cos_outside_the_medium_range_stays_within_one_ulp_and_keeps_special_values ... ok
test js_cos_matches_v8_math_cos_bit_for_bit_in_the_supported_range ... ok
test perm_table_matches_web_for_all_256_entries ... ok
test value_noise_matches_web_bit_for_bit_including_huge_and_negative_coordinates ... ok
test vectors_come_from_the_pinned_web_run ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s

     Running tests/p6_m02_deposit_river.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m02_deposit_river-aa1b079e2438a847)

running 7 tests
test parse_helpers_cover_all_tokens ... ok
test ensure_meta_and_hidden_count_match_web ... ok
test metal_deposit_min_era_table_matches_web ... ok
test deposit_visibility_matches_web ... ok
test river_switch_keys_match_names_the_web_queried ... ok
test river_switch_without_environment_matches_web ... ok
test river_switch_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.15s

     Running tests/p6_m02_float_parse.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m02_float_parse-bdfe4c125f45e686)

running 1 test
test table_floats_are_read_without_rounding_error ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_generator.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m02_generator-aad7149729b35309)

running 4 tests
test size_dims_and_order_match_web ... ok
test normalization_matches_web ... ok
test menu_labels_match_web ... ok
test size_from_menu_label_and_label_to_dims_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_m02_new_game.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m02_new_game-fb7bd264e697cc8f)

running 11 tests
test clamp_miasta_panstwa_count_matches_web ... ok
test density_to_label_round_trips_where_web_does ... ok
test constants_match_web ... ok
test civ_menus_with_rosters_match_web ... ok
test land_fraction_functions_match_web ... ok
test map_size_label_from_dims_matches_web ... ok
test resolve_world_gen_numbers_matches_web ... ok
test river_map_params_match_web_bitwise ... ok
test tier_functions_match_web ... ok
test per_label_functions_match_web ... ok
test world_generation_presets_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.72s

     Running tests/p6_m02_quality.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m02_quality-07b289bbbb867c75)

running 4 tests
test tier_to_label_and_preset_match_web ... ok
test per_label_functions_match_web ... ok
test web_quirk_ignores_z_with_dot ... ok
test constants_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m02_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m02_tables-abfdd889c351ab6b)

running 7 tests
test map_label_thresholds_are_ascending_and_known ... ok
test per_size_menus_cover_every_size ... ok
test land_and_toggle_tables_are_consistent ... ok
test river_rules_have_sane_ranges ... ok
test every_section_names_its_web_source ... ok
test size_tables_are_consistent ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m03_centers.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m03_centers-e9e6c6c080ae746d)

running 15 tests
test build_continent_centers_matches_web_including_rng_consumption ... ok
test assign_island_grid_indices_keeps_web_map_insertion_order ... ok
test elliptical_mask_matches_web_inside_and_outside_the_map ... ok
test default_shape_params_match_web_and_consume_six_draws ... ok
test island_centers_match_web_including_rng_consumption ... ok
test continent_center_count_matches_web_for_all_world_types ... ok
test isotropic_helpers_match_web ... ok
test named_constants_match_web_exports ... ok
test pangea_blob_centers_match_web_including_rng_consumption ... ok
test pangea_land_t_matches_web_including_clamps_and_non_finite ... ok
test pangea_layout_params_match_web_for_every_field ... ok
test perm_tables_from_seed_match_web ... ok
test island_grid_cell_index_matches_web_including_out_of_range_cells ... ok
test five_zone_centers_match_web_including_rng_consumption ... ok
test voronoi_zone_index_and_second_distance_match_web_with_ties ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

     Running tests/p6_m03_earth.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m03_earth-527455072c339731)

running 5 tests
test subsample_grid_and_land_fraction_threshold_match_web_for_all_tier_edges ... ok
test widths_inner_width_matches_web_for_every_width ... ok
test heights_polar_rows_and_land_rows_match_web_for_every_height ... ok
test constants_match_web ... ok
test bit_at_matches_web_including_clamped_out_of_range_coordinates ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m03_edges.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m03_edges-2ed31862d88dc14c)

running 3 tests
test pangea_layout_matches_web_at_exact_threshold_neighbourhoods ... ok
test exact_threshold_arguments_exist_in_the_vectors ... ok
test edge_rect_floor_matches_web_for_maps_wider_than_2000_hexes ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m03_jsmath.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m03_jsmath-2eef5b60b0adbce2)

running 9 tests
test max_min_follow_javascript_nan_and_signed_zero_rules ... ok
test pow_follows_ecmascript_special_cases ... ok
test hypot_matches_web_bit_for_bit ... ok
test atan2_matches_web_bit_for_bit ... ok
test pow_matches_web_bit_for_bit ... ok
test sin_inside_domain_does_not_hit_the_fallback ... ok
test sin_matches_web_bit_for_bit ... ok
test vectors_distinguish_v8_from_system_libm ... ok
test sin_beyond_reconstructed_domain_panics_in_debug_builds - should panic ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.32s

     Running tests/p6_m03_masks.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m03_masks-92f5032984be63fd)

running 5 tests
test masks_are_bounded_and_zero_in_the_hard_ocean_border ... ok
test pangea_blob_score_matches_web_on_fixed_centers ... ok
test border_dependencies_match_web ... ok
test full_seed_pipeline_reproduces_the_web_land_masks ... ok
test land_masks_match_web_for_every_type_size_and_seed ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 17.85s

     Running tests/p6_m03_strait.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m03_strait-37e3722b9d7677a3)

running 1 test
test strait_vectors_match_web_at_exact_threshold_and_one_ulp_around_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m03_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m03_tables-50e93f9f6b59c4b2)

running 6 tests
test border_fade_clamp_is_unreachable_while_table_invariant_holds ... ok
test every_table_float_is_parsed_exactly_from_the_raw_text ... ok
test table_has_no_unknown_or_missing_keys ... ok
test table_invariants_hold ... ok
test accessors_are_driven_by_the_table_not_by_literals ... ok
test table_parses_and_is_cached ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m04_border.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m04_border-6bff5e3eb79596bf)

running 12 tests
test border_consts_match_web ... ok
test erosion_hook_matches_web ... ok
test is_in_map_border_with_buffer_matches_web ... ok
test lat_buffer_matches_web ... ok
test margin_cap_matches_web ... ok
test margin_scatter_score_matches_web ... ok
test parse_hex_key_edge_keys_match_web ... ok
test border_grid_tools_match_web ... ok
test parse_hex_key_matches_js_number_for_hexkey_strings ... ok
test set_hex_to_morze_and_laka_match_web ... ok
test fades_and_distances_match_web ... ok
test apply_marginal_land_zone_caps_matches_web ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.42s

     Running tests/p6_m04_classify.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m04_classify-421508a5d4a5c685)

running 7 tests
test consts_match_web ... ok
test relief_elev_gates_match_web ... ok
test classify_terrain_matches_web ... ok
test hash_int3_matches_web ... ok
test terrain_cell_bias_matches_web ... ok
test classify_terrain_flat_matches_web ... ok
test rown_laka_jitter_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.99s

     Running tests/p6_m04_reapply.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m04_reapply-8accc2cf3c58125d)

running 4 tests
test reapply_land_terrain_matches_web ... ok
test reapply_forest_overlay_targeted_inland_cases_match_web ... ok
test forest_replay_hooks_reject_wrong_arguments ... ok
test reapply_forest_overlay_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.62s

     Running tests/p6_m04_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m04_tables-4d2b90ef46470e0e)

running 4 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test values_have_sane_shape ... ok
test floats_are_parsed_exactly_from_the_raw_json_text ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m09_rivals.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m09_rivals-3d2871a7b9753cde)

running 19 tests
test cluster_pack_radius_matches_web ... ok
test foreign_buffer_gate_matches_web ... ok
test group_foreign_type_clusters_matches_web ... ok
test half_plane_axis_matches_web_bitwise ... ok
test constants_match_web_and_aliases_are_not_separate_numbers ... ok
test is_in_half_plane_matches_web ... ok
test land_pool_near_core_matches_web ... ok
test hexes_at_distance_matches_web ... ok
test map_helpers_match_web ... ok
test nearest_legal_land_matches_web ... ok
test hub_chain_matches_web ... ok
test hub_chain_result_does_not_depend_on_seed_as_in_web ... ok
test rival_slots_degenerate_inputs_do_not_panic ... ok
test pack_rival_cities_matches_web ... ok
test shuffle_in_place_matches_web ... ok
test vectors_identify_the_same_maps_as_p6_1c ... ok
test pack_around_capital_matches_web ... ok
test rival_slots_match_web_on_real_maps ... ok
test rival_candidate_hexes_match_web_on_real_maps ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 15.53s

     Running tests/p6_m09_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m09_tables-0380ed37b51ae447)

running 3 tests
test every_value_has_web_source_and_sane_shape ... ok
test start_city_state_distance_is_not_the_cities_ts_constant ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m10_masses.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m10_masses-1406512a25778485)

running 16 tests
test alias_constants_are_not_separate_numbers ... ok
test constants_match_web ... ok
test local_land_fraction_and_gate_match_web ... ok
test map_size_label_matches_web_and_params_table ... ok
test mass_qualifies_and_indices_match_web ... ok
test allocate_typy_to_masses_matches_web ... ok
test player_mass_gate_over_whole_maps_matches_web ... ok
test reorder_roster_by_preference_matches_web ... ok
test roster_for_start_epoch_matches_web ... ok
test spawn_habitable_terrain_matches_web ... ok
test thresholds_and_caps_match_web ... ok
test types_have_web_shape ... ok
test vectors_identify_the_maps_used ... ok
test group_habitable_masses_and_cache_match_web ... ok
test region_mass_dominance_matches_web ... ok
test development_space_and_mass_gates_match_web ... ok

test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 12.74s

     Running tests/p6_m10_placement.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m10_placement-0ff78516c0b93780)

running 14 tests
test hooks_match_web ... ok
test pick_center_in_mass_matches_web ... ok
test balance_and_enforce_match_web ... ok
test pick_center_in_mass_spread_matches_web ... ok
test pick_best_local_land_spawn_matches_web ... ok
test pick_tied_spawn_land_candidate_matches_web ... ok
test pick_center_on_land_pool_spread_matches_web ... ok
test pick_center_in_mass_with_land_gate_matches_web ... ok
test sort_spawn_candidates_with_spread_bias_matches_web ... ok
test sort_spawn_land_candidates_matches_web ... ok
test voronoi_and_centroid_match_web ... ok
test pick_player_cluster_center_matches_web ... ok
test place_cluster_centers_across_landmasses_matches_web ... ok
test player_start_candidates_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 19.28s

     Running tests/p6_m10_start_scoring.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m10_start_scoring-a1f4519e6663b8a9)

running 4 tests
test reveal_radius_matches_web ... ok
test score_city_start_hex_over_whole_maps_matches_web ... ok
test score_city_start_hex_matches_web ... ok
test find_best_player_start_hex_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.09s

     Running tests/p6_m10_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m10_tables-07a2652eafb05f75)

running 3 tests
test values_have_sane_shape ... ok
test every_value_has_a_web_source_with_file_and_line ... ok
test tables_parse_with_deny_unknown_fields ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m10_v8sort.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m10_v8sort-d4cb86648b856051)

running 2 tests
test js_array_sort_is_stable_for_equal_keys ... ok
test js_array_sort_matches_v8_including_comparator_call_counts ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.76s

     Running tests/p6_m11_gates.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m11_gates-70911875d6c88b8e)

running 11 tests
test for_map_matches_web ... ok
test by_label_matches_web ... ok
test capital_separation_gate_and_distance_match_web ... ok
test band_penalty_matches_web ... ok
test hub_reach_and_body_buffer_match_web ... ok
test quadrant_helpers_match_web ... ok
test rescue_ladder_matches_web ... ok
test preferred_quadrants_match_web ... ok
test sea_gates_match_web ... ok
test hooks_impl_matches_web ... ok
test pick_spawn_hex_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.22s

     Running tests/p6_m11_integration.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m11_integration-9de8c89dfd74ed60)

running 4 tests
test m11_hooks_match_m10_web_hook_vectors ... ok
test m11_hooks_reproduce_m10_candidate_sorting ... ok
test m11_and_m10_vector_maps_are_identical ... ok
test m11_hooks_reproduce_m10_center_placement ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.52s

     Running tests/p6_m11_layout.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m11_layout-cc4df252415db121)

running 10 tests
test centroid_and_far_enough_match_web ... ok
test capital_pos_matches_web ... ok
test assign_types_matches_web ... ok
test build_cluster_cities_matches_web ... ok
test cities_with_land_gate_match_web ... ok
test poisson_pick_cities_matches_web ... ok
test pick_capital_hex_in_region_matches_web ... ok
test layout_with_edge_capital_matches_web ... ok
test simple_fallback_matches_web ... ok
test enforce_local_land_dominance_matches_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 12.50s

     Running tests/p6_m11_repair.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m11_repair-2ea5f9383c7a3744)

running 7 tests
test cluster_helpers_match_web ... ok
test fixtures_have_web_shape_and_variety ... ok
test quarter_spread_matches_web ... ok
test repack_one_matches_web ... ok
test body_separation_matches_web ... ok
test hard_capital_separation_matches_web ... ok
test repack_all_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 15.23s

     Running tests/p6_m11_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m11_tables-c893deff57812197)

running 4 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test table_parses_with_deny_unknown_fields ... ok
test derived_constants_are_aliases_of_table_fields ... ok
test values_have_sane_shape ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m14_range.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m14_range-11a976a1d8c0add9)

running 3 tests
test territory_keys_by_owner_match_web ... ok
test culture_range_matches_web ... ok
test religion_range_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.32s

     Running tests/p6_m14_territory.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m14_territory-ba89cbcff9a8795a)

running 8 tests
test city_sight_radius_matches_web ... ok
test city_range_for_population_matches_web ... ok
test city_territory_radius_matches_web ... ok
test owner_tie_goes_to_first_node ... ok
test axial_distance_matches_web_and_integer_variant ... ok
test is_in_territory_matches_web ... ok
test territory_owner_at_matches_web ... ok
test is_player_territory_hex_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.51s

     Running tests/p6_m14_wonder.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m14_wonder-96491650d658ea23)

running 4 tests
test shape_candidates_are_sorted_land_and_exclude_center ... ok
test list_for_city_matches_web ... ok
test pick_matches_web ... ok
test list_for_owner_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.92s

     Running tests/p6_m14_work.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m14_work-1ce45b3a771ecceb)

running 8 tests
test city_center_keys_match_web ... ok
test build_territory_nodes_matches_web ... ok
test reconcile_without_reczne_is_noop ... ok
test is_territory_hex_owned_by_matches_web ... ok
test reconcile_all_matches_web ... ok
test reconcile_for_owner_matches_web ... ok
test workable_filter_matches_web ... ok
test reczne_key_legal_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.93s

     Running tests/p6_m15_roads.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m15_roads-00c1796d2d44aacd)

running 8 tests
test constants_match_web ... ok
test is_road_key_matches_web ... ok
test has_road_matches_web ... ok
test road_table_shape_and_key_names ... ok
test roads_source_has_no_numeric_data_literals ... ok
test collect_road_keys_matches_web_order ... ok
test apply_modifier_matches_web_bitwise ... ok
test p64_ruch_modifier_agrees_with_roads_module ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.46s

     Running tests/p6_m16_divergence.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m16_divergence-36f41f9340105fdf)

running 1 test
test web_allows_farm_irrigation_terraces_on_deposit_hexes ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.87s

     Running tests/p6_m16_doc.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m16_doc-a783ecb95132fc08)

running 1 test
test document_has_a_status_row_for_every_web_symbol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m16_gallery.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m16_gallery-40cbda6184b177cf)

running 2 tests
test gallery_terrain_eligible_matches_web ... ok
test gallery_combo_eligible_and_show_model_match_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s

     Running tests/p6_m16_qualifier.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m16_qualifier-54c27efc7f24500a)

running 4 tests
test forest_build_block_reason_matches_web ... ok
test api_hex_click_and_on_select_match_web ... ok
test qualifier_bits_match_web_for_every_key_and_hex ... ok
test api_qualifying_hexes_and_work_cost_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 15.17s

     Running tests/p6_m16_rules.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m16_rules-33e7267e34428bc9)

running 15 tests
test can_add_food_layer_matches_web ... ok
test deposit_rules_match_web ... ok
test forest_blocking_and_hints_match_web ... ok
test farm_and_owce_base_terrain_match_web ... ok
test improvement_meta_and_tech_gate_match_web ... ok
test hex_keys_within_radius_matches_web ... ok
test format_impact_list_matches_web ... ok
test hex_has_road_matches_web ... ok
test legacy_farm_layer_and_strip_match_web ... ok
test mine_keys_tarasy_civ_and_food_keys_match_web ... ok
test livestock_dependency_matches_web ... ok
test plan_and_remove_legacy_farms_match_web ... ok
test strip_improvements_when_forest_removed_matches_web ... ok
test replaced_by_build_and_impact_match_web ... ok
test work_cost_scale_matches_web ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.28s

     Running tests/p6_m16_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m16_tables-fd1582fd8a835964)

running 5 tests
test livestock_and_tech_tables_are_consistent ... ok
test food_and_sector_tables_are_consistent ... ok
test rule_keys_are_known_improvements ... ok
test terrain_codes_in_tables_are_valid ... ok
test improvement_build_has_no_balance_number_literals ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_m17_rebuild.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m17_rebuild-60f4b8705aae281a)

running 5 tests
test js_keyed_map_orders_array_index_keys_first ... ok
test rebuild_error_class_matches_web_failure_class ... ok
test rebuild_errors_name_the_failing_field ... ok
test serialize_rebuild_serialize_is_stable_without_duplicate_coords ... ok
test rebuild_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.41s

     Running tests/p6_m17_serialize.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m17_serialize-bc527bf55aa676f5)

running 5 tests
test js_num_writes_integers_without_fraction_and_non_finite_as_null ... ok
test serialize_vectors_touch_every_branch ... ok
test serialize_matches_web_structurally ... ok
test snapshot_shape_invariants_hold_for_every_vector ... ok
test serialize_text_is_byte_identical_to_web_json_stringify ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.00s

     Running tests/p6_m17_validate.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/p6_m17_validate-f52da1b0e7422d55)

running 2 tests
test every_serialize_vector_snapshot_has_a_web_validity_vector ... ok
test is_valid_matches_web_for_all_vectors ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.56s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test canonical_state_dto_vector_round_trips_through_json ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test public_engine_wire_aliases_are_stable ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/road_movement_multipliers.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/road_movement_multipliers-10cca6a7ed28e576)

running 3 tests
test road_divisors_are_integers_read_from_the_table ... ok
test road_floor_row_is_readable_and_positive ... ok
test road_movement_table_covers_each_constant_once ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test explicit_v1_constructor_uses_the_same_migration_contract ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test canonical_state_round_trips_through_serde ... ok
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/structure_defense_max.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/structure_defense_max-97cd066d284c179b)

running 3 tests
test combined_structures_equal_the_strongest_single_structure ... ok
test no_structure_gives_neutral_multiplier ... ok
test structures_are_ignored_outside_siege ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test trade_routes_do_not_cross_tundra ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test land_route_bfs_crosses_desert_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test diff_and_serialization_preserve_route_contract ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 6 tests
test current_and_previous_epochs_are_available ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok
test p6_1_civ_entry_api_is_exercised ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### 11.4 `git diff --cached --check` (indeks po jawnym `git add` plikow tematu; `gate-diffcheck-r1.log`)

```text
EXIT=0
```

### 11.5 Weryfikator Python (`verify-p67a-r1.log`)

```text
SEKCJE: {"advance": 2589, "balance": 70, "build": 62, "cityLevel": 114, "diffMult": 4, "ensure": 122, "era": 142, "fractional": 900, "gain": 300, "happiness": 59, "hunger": 700, "magazynEra": 14, "manpower": 300, "matrix": 118, "maxSafe": 70, "params": 3, "percent": 700, "plan": 70, "popCap": 180, "postCentral": 560, "raise": 70, "ration": 1351, "rationCost": 400, "recompute": 60, "simulate": 1150, "spichlerz": 18, "stawki": 405, "tempo": 427, "turns": 300}
PORUWNAN: 11258
ROZBIEZNOSCI: 0
EXIT=0
```

### 11.6 Dowody negatywne (`dowody/verify-negative-r1.txt`: zadna wartosc balansu z tabel nie jest literalem w kodzie; `dowody/verify-negative-verifier-r1.txt`: weryfikator wykrywa zepsuty wektor)

```text
wartosci balansu w tabelach (bez 0, 1, -1): 26
literaly liczbowe w kodzie p6_7a (unikalne): [0.0, 1e-09, 1.0, 19.0, 21.0, 28.0]
wartosci z tabel, ktore sa tez literalem w kodzie: []

# test negatywny weryfikatora (dowody/verify-negative-verifier-r1.txt)
growth.json: exit=1 ROZBIEZNOSCI: 1
empire.json: exit=1 ROZBIEZNOSCI: 1
post_central.json: exit=1 ROZBIEZNOSCI: 1
WSZYSTKIE ZEPSUTE WEKTORY WYKRYTE
EXIT=0
```

### 11.7 Literaly w nowych modulach (`dowody/grep-literals-r1.txt`)

Klasyfikacja: STRUKTURALNY = elementy neutralne/semantyka JS (`0.0` jako dolna granica `Math.max(0, x)` i `?? 0`, `1.0` jako krok i minimalna populacja, indeksy `[0]`/`[1]`/`[2]` trojek wartosci, nazwy kluczy JSON/wariantow, komunikaty `expect`, id parametrow macierzy, tolerancja `1e-9` z `empire-food.ts:494,681`, stale algorytmu Hangul). ZADNA wartosc balansu (mnoznik, prog, tabela) nie jest literalem (11.6).

```text
# Literaly liczbowe i napisowe w module P6.7A (city_growth.rs::p6_7a, derived.rs); komentarze pominiete
## src/domain/city_growth.rs od linii 537
557: nums=['1e-9'] strs=[] | const FOOD_EPSILON: f64 = 1e-9;
599: nums=[] strs=['wysoki'] | "wysoki" => Some(Self::Wysoki),
600: nums=[] strs=['normalny'] | "normalny" => Some(Self::Normalny),
601: nums=[] strs=['wolny'] | "wolny" => Some(Self::Wolny),
608: nums=[] strs=['wysoki'] | Self::Wysoki => "wysoki",
609: nums=[] strs=['normalny'] | Self::Normalny => "normalny",
610: nums=[] strs=['wolny'] | Self::Wolny => "wolny",
659: nums=['0.0'] strs=[] | 0.0
690: nums=['19'] strs=[] | const HANGUL_L_COUNT: u32 = 19;
691: nums=['21'] strs=[] | const HANGUL_V_COUNT: u32 = 21;
692: nums=['28'] strs=[] | const HANGUL_T_COUNT: u32 = 28;
709: nums=[] strs=['hangul L'] | out.push(char::from_u32(l).expect("hangul L"));
710: nums=[] strs=['hangul V'] | out.push(char::from_u32(v).expect("hangul V"));
712: nums=[] strs=['hangul T'] | out.push(char::from_u32(t).expect("hangul T"));
770: nums=['0.0'] strs=[] | if v.is_finite() && *v > 0.0 {
780: nums=['0.0'] strs=[] | if !base.is_finite() || base <= 0.0 {
781: nums=['0.0'] strs=[] | return 0.0;
788: nums=['0.0'] strs=[] | if !koszt_budowy.is_finite() || koszt_budowy <= 0.0 {
789: nums=['0.0'] strs=[] | return 0.0;
866: nums=[] strs=['econ-params.json'] | let econ = ECON.get_or_init(|| parse_econ_params().expect("econ-params.json"));
908: nums=['0.0'] strs=[] | 0.0
919: nums=[] strs=['lud_limit_populacji'] | Some(k) => civ_matrix_param(&load_civ_matrix().file, k, "lud_limit_populacji"),
920: nums=['0.0'] strs=[] | None => 0.0,
925: nums=['0.0'] strs=[] | 0.0
960: nums=['1.0'] strs=[] | js_math_round((wyzywienie_max() - wyzywienie_min()) / wyzywienie_step()) + 1.0;
961: nums=['0.0'] strs=[] | let n = if length.is_finite() && length > 0.0 {
964: nums=['0'] strs=[] | 0
966: nums=['0'] strs=[] | (0..n)
999: nums=['0.0'] strs=[] | 0.0
1009: nums=['1.0'] strs=[] | hunger_loss_multiplier: 1.0,
1010: nums=['1.0'] strs=[] | health_growth_multiplier: 1.0,
1011: nums=['0.0'] strs=[] | happiness_base: 0.0,
1012: nums=['0.0'] strs=[] | population_cap_delta: 0.0,
1016: nums=[] strs=['lud_spadek_proc'] | let hunger_proc = civ_matrix_param(matrix, key, "lud_spadek_proc");
1017: nums=[] strs=['lud_zdrowie_proc'] | let health_proc = civ_matrix_param(matrix, key, "lud_zdrowie_proc");
1018: nums=[] strs=['lud_zadowolenie_bazowe'] | let happiness = civ_matrix_param(matrix, key, "lud_zadowolenie_bazowe");
1020: nums=['0.0', '1.0'] strs=[] | hunger_loss_multiplier: js_max(0.0, 1.0 + finite_or_zero(hunger_proc)),
1021: nums=['0.0', '1.0'] strs=[] | health_growth_multiplier: js_max(0.0, 1.0 + finite_or_zero(health_proc)),
1051: nums=[] strs=['ekonomia_miasta'] | match raw.get("ekonomia_miasta") {
1062: nums=['0'] strs=['racje_zywnosc_1'] | racje_zywnosc_1: pick(section.get("racje_zywnosc_1"), d, t.zywnosc[0]),
1063: nums=['1'] strs=['racje_zywnosc_2'] | racje_zywnosc_2: pick(section.get("racje_zywnosc_2"), d, t.zywnosc[1]),
1064: nums=['2'] strs=['racje_zywnosc_3'] | racje_zywnosc_3: pick(section.get("racje_zywnosc_3"), d, t.zywnosc[2]),
1065: nums=['0'] strs=['racje_wzrost_proc_1'] | racje_wzrost_proc_1: pick(section.get("racje_wzrost_proc_1"), d, t.wzrost_proc[0]),
1066: nums=['1'] strs=['racje_wzrost_proc_2'] | racje_wzrost_proc_2: pick(section.get("racje_wzrost_proc_2"), d, t.wzrost_proc[1]),
1067: nums=['2'] strs=['racje_wzrost_proc_3'] | racje_wzrost_proc_3: pick(section.get("racje_wzrost_proc_3"), d, t.wzrost_proc[2]),
1105: nums=[] strs=['racje.json must parse'] | ROWS.get_or_init(|| parse_racje().expect("racje.json must parse").wiersze)
1128: nums=['0.0'] strs=[] | 0.0
1137: nums=['1', '1'] strs=[','] | js_to_fixed(v, 1).replacen('.', ",", 1)
1147: nums=['0.0'] strs=[] | let base = js_max(0.0, population) * ration_food_cost_per_pop(level);
1148: nums=['1.0'] strs=[] | let mult = spichlerz_state.map_or(1.0, spichlerz_ration_food_cost_multiplier);
1185: nums=['0.0'] strs=[] | let male_miasto = js_max(0.0, s.male_miasto_prog - input.population);
1190: nums=['0.0'] strs=[] | let zdrowie_bazowe = (js_max(0.0, input.zdrowie) / s.zdrowie_na_punkt).floor();
1192: nums=['0.0'] strs=[] | let szczescie = (js_max(0.0, input.szczescie_netto) / s.szczescie_na_punkt).floor();
1194: nums=[] strs=['lud_wzrost_proc'] | Some(k) => civ_matrix_param(&load_civ_matrix().file, k, "lud_wzrost_proc"),
1195: nums=['0.0'] strs=[] | None => 0.0,
1199: nums=['0.0'] strs=[] | let zaopatrzenie = input.citizen_resource_growth_pct.unwrap_or(0.0);
1236: nums=['0.0'] strs=[] | let mut frac = wzrost_ulamkowy.unwrap_or(0.0);
1241: nums=['0.0', '0.0'] strs=[] | if fed && growth_pct != 0.0 && pop > 0.0 {
1248: nums=['0.0'] strs=[] | if growth_pct > 0.0 && pop < pop_cap {
1250: nums=['1.0'] strs=[] | while frac >= 1.0 && pop < pop_cap {
1251: nums=['1.0'] strs=[] | pop += 1.0;
1252: nums=['1.0'] strs=[] | frac -= 1.0;
1255: nums=['0.0', '1.0'] strs=[] | } else if growth_pct < 0.0 && pop > 1.0 {
1257: nums=['1.0', '1.0'] strs=[] | while frac >= 1.0 && pop > 1.0 {
1258: nums=['1.0'] strs=[] | pop -= 1.0;
1259: nums=['1.0'] strs=[] | frac -= 1.0;
1280: nums=['0.0', '0.0'] strs=[] | if !fed || growth_pct == 0.0 || population <= 0.0 {
1281: nums=['0.0'] strs=[] | return 0.0;
1283: nums=['0.0'] strs=[] | if growth_pct > 0.0 && at_pop_cap {
1284: nums=['0.0'] strs=[] | return 0.0;
1294: nums=['0.0'] strs=[] | if gain_per_turn <= 0.0 {
1297: nums=['0.0'] strs=[] | let frac = wzrost_ulamkowy.unwrap_or(0.0);
1298: nums=['1.0'] strs=[] | if frac >= 1.0 {
1299: nums=['0.0'] strs=[] | return Some(0.0);
1301: nums=['1.0'] strs=[] | Some(((1.0 - frac) / gain_per_turn).ceil())
1324: nums=['0.0'] strs=[] | tury_bez_doplaty: 0.0,
1326: nums=['0.0'] strs=[] | hunger_loss_ulamkowy: 0.0,
1329: nums=['0.0', '1.0'] strs=[] | let next_tury = tury_bez_doplaty.unwrap_or(0.0) + 1.0;
1332: nums=['0.0'] strs=[] | js_max(0.0, hunger_loss_ulamkowy)
1334: nums=['0.0'] strs=[] | 0.0
1337: nums=['0.0'] strs=[] | js_max(0.0, hunger_loss_multiplier)
1339: nums=['1.0'] strs=[] | 1.0
1342: nums=['1.0', '1.0'] strs=[] | while debt >= 1.0 && pop > 1.0 {
1343: nums=['1.0'] strs=[] | pop -= 1.0;
1344: nums=['1.0'] strs=[] | debt -= 1.0;
1349: nums=['0.0'] strs=[] | tury_bez_doplaty: if ubytek { 0.0 } else { next_tury },
1400: nums=['0.0'] strs=[] | c.wzrost_ulamkowy = Some(0.0);
1403: nums=['0.0'] strs=[] | c.tury_bez_doplaty = Some(0.0);
1406: nums=['0.0'] strs=[] | gc.hunger_loss_ulamkowy = Some(0.0);
1454: nums=['0'] strs=[] | for row_index in 0..owner_tick.per_city_rows.len() {
1500: nums=['0.0'] strs=[] | .unwrap_or(0.0);
1505: nums=['0.0'] strs=[] | .unwrap_or(0.0);
1519: nums=['1.0'] strs=[] | .map_or(1.0, |w| w.poziom);
1546: nums=['0.0'] strs=[] | cities[city_index].hunger_loss_ulamkowy.unwrap_or(0.0),
1555: nums=['0.0'] strs=[] | if fed { breakdown.total } else { 0.0 },
1588: nums=['1.0'] strs=[] | .unwrap_or(1.0);
1613: nums=['1.0'] strs=[] | econ.growth += 1.0;
1616: nums=['1.0'] strs=[] | econ.starved += 1.0;
1716: nums=['0.0', '0.0'] strs=[] | js_max(0.0, tick.zywnosc_netto + tick.koszt_racji.unwrap_or(0.0))
1824: nums=[] strs=['globalne'] | let gl = match raw.get("globalne") {
1830: nums=[] strs=['magazyn_centralny_baza_zywnosc'] | nn(gl.get("magazyn_centralny_baza_zywnosc"))
1831: nums=[] strs=['magazyn_centralny_baza_zywnosc'] | .or(em.get("magazyn_centralny_baza_zywnosc")),
1836: nums=[] strs=['magazyn_centralny_bonus_zywnosc_na_budynek'] | nn(gl.get("magazyn_centralny_bonus_zywnosc_na_budynek"))
1837: nums=[] strs=['magazyn_centralny_bonus_zywnosc_na_budynek'] | .or(em.get("magazyn_centralny_bonus_zywnosc_na_budynek")),
1841: nums=[] strs=['glod_wojska_hp_frac'] | glod_wojska_hp_frac: pick(em.get("glod_wojska_hp_frac"), d, t.glod_hp_frac),
1843: nums=[] strs=['glod_wojska_karencja_tur'] | em.get("glod_wojska_karencja_tur"),
1847: nums=[] strs=['glod_wojska_stat_mult'] | glod_wojska_stat_mult: pick(em.get("glod_wojska_stat_mult"), d, t.glod_stat_mult),
1855: nums=['0.0'] strs=[] | zapasy_panstwa: 0.0,
1857: nums=['0.0'] strs=[] | tury_ujemnych_zapasow: Some(0.0),
1926: nums=['0.0'] strs=[] | states.get(owner_id).map_or(0.0, |s| s.zapasy_panstwa)
1931: nums=['0.0'] strs=[] | self.max_cap_by_owner.get(&owner_id).copied().unwrap_or(0.0)
1964: nums=['1.0'] strs=[] | Some(js_max(1.0, karencja_tur - t.tury_ujemnych_zapasow_po))
1991: nums=['0.0'] strs=[] | js_min(percent_whole(), js_max(0.0, n))
2012: nums=['0.0'] strs=[] | let mut sum = 0.0;
2042: nums=['0.0', '1.0'] strs=[] | *out.entry(tick.owner_id).or_insert(0.0) += 1.0;
2057: nums=['0.0'] strs=[] | let mut spichlerz_cap = 0.0;
2113: nums=['0.0'] strs=[] | let zapasy_przed = states.get(owner_id).map_or(0.0, |s| s.zapasy_panstwa);
2115: nums=['0.0'] strs=[] | let mut uprawa_hodowla = 0.0;
2116: nums=['0.0'] strs=[] | let mut wyzywienie_ludnosci = 0.0;
2117: nums=['0.0'] strs=[] | let mut pomoc_miastom = 0.0;
2128: nums=['0.0', '0.0'] strs=[] | js_max(0.0, tick.zywnosc_netto + tick.koszt_racji.unwrap_or(0.0))
2130: nums=['0.0'] strs=[] | let koszt_racji = tick.koszt_racji.unwrap_or(0.0);
2141: nums=['0.0'] strs=[] | wzrost_procent: tick.wzrost_procent.unwrap_or(0.0),
2146: nums=['0.0'] strs=[] | if bilans >= 0.0 {
2155: nums=['0.0'] strs=[] | let covered = js_min(*need, js_max(0.0, central));
2170: nums=['1.0'] strs=[] | let owner_era = resolve_owner_era.map_or(1.0, |f| f(owner_id));
2177: nums=['0.0'] strs=[] | .unwrap_or(0.0),
2184: nums=['0.0'] strs=[] | let glod_wojska = central < 0.0;
2185: nums=['0.0'] strs=[] | central = js_max(0.0, central);
2190: nums=[] strs=['stan wlasciciela'] | let st = states.get_mut(owner_id).expect("stan wlasciciela");
2192: nums=['0.0'] strs=[] | let tury_przed = st.tury_ujemnych_zapasow.unwrap_or(0.0);
2193: nums=['1.0', '0.0'] strs=[] | let tury_po = if glod_wojska { tury_przed + 1.0 } else { 0.0 };
2213: nums=['0.0'] strs=[] | do_rozwoju: 0.0,
2242: nums=['1', '0'] strs=[] | pub const DEFAULT_HUMAN_OWNER_IDS: [i64; 1] = [0];
2282: nums=['0.0'] strs=[] | let mut uprawa = 0.0;
2283: nums=['0.0'] strs=[] | let mut koszt = 0.0;
2288: nums=['0.0'] strs=[] | let produkcja = tick.zywnosc_brutto.unwrap_or(0.0);
2289: nums=['0.0'] strs=[] | let koszt_racji = tick.koszt_racji.unwrap_or(0.0);
2308: nums=['0.0'] strs=[] | let produkcja = tick.zywnosc_brutto.unwrap_or(0.0);
2309: nums=['0.0'] strs=[] | let koszt = tick.koszt_racji.unwrap_or(0.0);
2311: nums=['0.0'] strs=[] | if bilans >= 0.0 {
2318: nums=['0.0'] strs=[] | let covered = js_min(need, js_max(0.0, central));
2336: nums=['0.0'] strs=[] | let produkcja = tick.zywnosc_brutto.unwrap_or(0.0);
2337: nums=['0.0'] strs=[] | let koszt = tick.koszt_racji.unwrap_or(0.0);
2339: nums=['0.0'] strs=[] | if bilans >= 0.0 {
2346: nums=['0.0'] strs=[] | let covered = js_min(need, js_max(0.0, central));
2359: nums=['0.0'] strs=[] | .find(|l| ration_growth_percent(*l) >= 0.0)
2392: nums=['0.0'] strs=[] | >= 0.0
2404: nums=['0.0'] strs=[] | return compute_empire_city_food_nadwyzka(per_city, owner_id) - koszt_armii >= 0.0;
2474: nums=['0'] strs=[] | for i in (0..levels.len()).rev() {
2501: nums=[] strs=['poziom poczatkowy'] | .expect("poziom poczatkowy");
2657: nums=['0.0'] strs=[] | if nadwyzka <= 0.0 {
2660: nums=['0.0', '0.0'] strs=[] | } else if nadwyzka <= 0.0 && opts.zapasy_przed <= 0.0 {
2755: nums=[] strs=['poziom poczatkowy'] | .expect("poziom poczatkowy"),
2780: nums=['0.0'] strs=[] | if pool >= 0.0 && all_fed && target_met {
2790: nums=[] strs=['poziom poczatkowy'] | .expect("poziom poczatkowy");
## src/data/derived.rs od linii 3825
3831: nums=[] strs=['../../data/derived/wzrost-ludnosci-params.json'] | include_str!("../../data/derived/wzrost-ludnosci-params.json");
3832: nums=[] strs=['../../data/derived/era-diakrytyki.json'] | pub const ERA_DIAKRYTYKI_JSON: &str = include_str!("../../data/derived/era-diakrytyki.json");
3915: nums=['3'] strs=[] | pub zywnosc: [f64; 3],
3916: nums=['3'] strs=[] | pub wzrost_proc: [f64; 3],
4011: nums=[] strs=['wzrost-ludnosci-params.json must parse'] | parse_wzrost_ludnosci_params().expect("wzrost-ludnosci-params.json must parse")
4032: nums=[] strs=['era-diakrytyki.json must parse'] | .expect("era-diakrytyki.json must parse")
# linii z literalami: 162
```


## 12. Surowe, pelne wyjscia bramek i dowodow r2 (kopie plikow w katalogu runu, bez wyciec)

### 12.1 `cargo fmt --check` (rust-port/engine; `gate-fmt-r2.log`)

```text
EXIT=0
```

### 12.2 `cargo clippy --all-targets -- -D warnings` (rust-port/engine; `gate-clippy-r2.log`)

```text
    Checking serde_core v1.0.229
    Checking once_cell v1.21.4
    Checking zmij v1.0.23
    Checking pin-project-lite v0.2.17
    Checking memchr v2.8.3
    Checking tracing-core v0.1.36
    Checking itoa v1.0.18
    Checking tracing v0.1.44
    Checking serde v1.0.229
    Checking serde_json v1.0.154
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_6c1214b7-ef6-3/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 51.09s
EXIT=0
```

### 12.3 `cargo test` (rust-port/engine; `gate-test-r2.log`; suma `passed=1098 failed=0`)

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_6c1214b7-ef6-3/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 1m 14s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 13 tests
test civilian_units_do_not_receive_combat_orders ... ok
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test manifest_has_header_and_428_data_rows ... ok
test counts_per_extension_match_p1_11 ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_wrong_size ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test negative_validator_rejects_duplicate_dest ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.10s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test effective_work_cost_is_raw_work_web_one_to_one ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_id.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/city_id-693b1037fdbc4b08)

running 6 tests
test barbarian_cleared_cities_round_trip_as_numbers ... ok
test barbarian_city_garrison_json_keeps_numeric_city_id ... ok
test city_id_serializes_as_bare_number ... ok
test city_id_ordering_matches_raw_value ... ok
test city_id_conversions_round_trip ... ok
test city_id_map_keys_stay_numeric_in_json ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/combat-7737db4785daf590)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat_ai_multipliers.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/combat_ai_multipliers-52898acb951a9ad0)

running 5 tests
test city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus ... ok
test accessors_return_the_table_value_not_a_constant ... ok
test veteran_levels_are_complete_and_non_decreasing ... ok
test las_row_is_class_a_and_marked_read_by_domain ... ok
test table_has_each_row_once_with_known_class_and_status ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/counter_multipliers.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/counter_multipliers-c944a65d0a384717)

running 5 tests
test domain_reads_table_and_unknown_types_give_no_bonus ... ok
test table_lists_each_type_pair_once_with_finite_positive_multiplier ... ok
test table_type_keys_are_canonical ... ok
test explicit_unit_bonus_overrides_table ... ok
test table_is_readable_for_every_pair_and_misses_are_none ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test wonders_json_parses ... ok
test buildings_json_parses ... ok
test tech_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test civs_count_and_ids_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_ai_params ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_citizen_resource_upkeep ... ok
test rt_city_names_pools ... ok
test rt_civ_ai ... ok
test rt_auto_battle_params ... ok
test rt_civ_matrix ... ok
test rt_civ_params ... ok
test rt_combat_params ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_counters ... ok
test rt_civs ... ok
test rt_diplomacy ... ok
test rt_e_start_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_econ_params ... ok
test rt_map_gen_params ... ok
test rt_miasto_params ... ok
test rt_power_params ... ok
test rt_buildings ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_resources ... ok
test rt_society_params ... ok
test rt_terrain_movement ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_tech ... ok
test rt_terrain_improvements ... ok
test rt_wonders ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_units ... ok
test rt_terrain_combat ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_ai_params_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_unreadable_file_is_io ... ok
test neg_missing_file_is_file_missing ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.48s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/derived_values.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/derived_values-7eb2b3615468dd51)

running 25 tests
test basket_and_treaty_duration_read_diplomacy_table ... ok
test building_gold_upkeep_has_one_row_per_building_level ... ok
test building_table_has_exactly_the_42_canonical_ids_once_each ... ok
test building_table_key_shape_is_known_resources_and_mirrors_the_base_keys ... ok
test difficulty_is_one_type_across_domain_modules ... ok
test diplomacy_multipliers_cover_each_constant_once_with_web_values ... ok
test domain_building_costs_read_the_building_table_values_without_recomputing_them ... ok
test building_table_palac_has_no_stock_cost_and_others_do ... ok
test gold_table_has_exactly_the_75_units_once_each_and_known_eras ... ok
test domain_recruitment_reads_the_gold_table_without_recomputation ... ok
test domain_recruitment_reads_the_unit_table_values_without_recomputing_them ... ok
test research_costs_cover_each_tech_tempo_and_axis_once ... ok
test storage_caps_cover_each_era_and_difficulty_once ... ok
test trade_multipliers_cover_each_constant_once_with_values ... ok
test improvement_and_wonder_tables_cover_every_entry_once ... ok
test racje_cover_every_half_step_from_zero_to_six_once ... ok
test unit_food_has_twelve_states_per_unit_and_integer_hundredths ... ok
test building_work_states_cover_each_building_level_and_axis_combination_exactly_once ... ok
test unit_table_has_one_row_per_units_json_record_and_no_extra_rows ... ok
test unit_table_keeps_the_units_json_base_as_provenance ... ok
test work_table_has_exactly_the_42_buildings_once_each_and_positive_values ... ok
test work_table_is_read_by_the_domain_without_recomputation ... ok
test unit_table_epoch_field_matches_units_json ... ok
test unit_table_key_shape_and_positive_integer_values ... ok
test unit_gold_states_cover_each_unit_and_axis_combination_exactly_once ... ok

test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/diplomacy-d94c0845f92f376e)

running 32 tests
test alliance_uses_configured_hegemon_threshold ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test annexation_requires_vassal_economy_orientation ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test peace_price_is_independent_of_treaty_duration ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test non_food_upgrade_dependencies_are_preserved ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test river_markers_are_land_and_reach_water ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/owner_ref.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/owner_ref-92f476c7f4239a8a)

running 10 tests
test camp_id_is_a_transparent_newtype ... ok
test owner_and_camp_fields_are_plain_numbers_in_struct_json ... ok
test owner_ref_accessors_and_player_conversion ... ok
test owner_ref_hash_agrees_with_equality ... ok
test owner_ref_refuses_player_ids_that_do_not_fit_the_legacy_number ... ok
test owner_ref_rejects_unknown_negative_numbers ... ok
test owner_ref_serializes_every_variant_as_the_legacy_number ... ok
test owner_ref_ordering_matches_the_legacy_i64_order ... ok
test owner_ref_legacy_conversions_match_the_sentinels ... ok
test player_keyed_maps_keep_numeric_string_keys ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_civ_entry_epoch.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1_civ_entry_epoch-c29112b12d237024)

running 8 tests
test civ_availability_matches_web_vectors_for_every_game_epoch ... ok
test civ_entry_label_matches_web_vectors ... ok
test civ_entry_epoch_matches_web_vectors ... ok
test civ_ids_available_match_web_roster_vectors ... ok
test game_epoch_index_matches_web_for_every_probe ... ok
test game_epoch_hud_label_matches_web_vectors ... ok
test game_epoch_order_matches_web ... ok
test strict_epoch_ids_reject_non_canonical_spellings ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_first_player_city.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1_first_player_city-e31375affc71b1c0)

running 5 tests
test awaiting_first_city_matches_web_for_owner_zero ... ok
test awaiting_first_city_matches_web_for_explicit_owner_one ... ok
test denied_message_matches_web_constant ... ok
test validate_placement_matches_web_vectors ... ok
test hex_in_start_reveal_matches_web_vectors ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_owner_seats.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1_owner_seats-1a3aae5c483a1e2f)

running 6 tests
test hot_seat_cycles_and_skips_unknown_active ... ok
test human_owner_primary_matches_web ... ok
test human_seats_match_web_vectors ... ok
test major_ai_owner_matches_web_vectors ... ok
test web_owner_minus_five_is_out_of_domain_and_not_representable ... ok
test stub_constants_are_the_web_sentinels ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_rng_mulberry.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1_rng_mulberry-617bdab005dd8b1f)

running 2 tests
test mulberry32_is_not_the_lcg_stream ... ok
test mulberry32_matches_web_make_rng_vectors_bit_for_bit ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1b_playerstate.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1b_playerstate-7e0df28b40755091)

running 19 tests
test error_research_step_is_atomic_on_missing_cost ... ok
test parity_cheapest_tie_break_uses_utf16_order ... ok
test hot_seat_two_human_owners_have_independent_player_states ... ok
test error_missing_cost_for_unknown_tempo_and_mode ... ok
test parity_constants_and_defaults_match_web ... ok
test parity_gates_available_and_cheapest ... ok
test parity_research_costs_equal_web_scaled_research_cost ... ok
test parity_per_row_functions ... ok
test parity_vectors_use_the_engine_tech_data ... ok
test serde_missing_research_queue_defaults_to_empty ... ok
test table_constants_are_read_from_data_not_literals ... ok
test table_edit_of_research_cost_changes_the_step ... ok
test table_epoch_map_and_sentinels_come_from_data ... ok
test table_every_engine_tech_has_a_research_cost_for_every_axis ... ok
test table_player_state_params_shape ... ok
test table_research_cost_rows_agree_with_tech_json ... ok
test parity_scenarios_from_web ... ok
test parity_parse_prereqs_and_prereqs_met ... ok
test parity_epoch_number ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.77s

     Running tests/p6_1c_braz_access.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1c_braz_access-043839ba2b428854)

running 7 tests
test city_has_piec_hutniczy_matches_web ... ok
test has_braz_access_matches_web ... ok
test normalize_improvement_key_matches_web ... ok
test empire_has_kopalnia_miedzi_matches_web ... ok
test normalize_improvement_key_known_keys_equal_data_keys ... ok
test prototype_keys_are_out_of_domain_and_do_not_change_braz_outcome ... ok
test bootstrap_table_values_equal_web_constants ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/p6_1c_llama_seed.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1c_llama_seed-e56bbca479ca6477)

running 3 tests
test hex_keys_within_radius_matches_web_loop_order ... ok
test hash_pos_matches_web_hash_pos_verbatim ... ok
test seed_inca_llama_deposits_matches_web_for_all_cases ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.19s

     Running tests/p6_1c_start_cluster.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1c_start_cluster-584791c0a8e00ea4)

running 8 tests
test land_hexes_filter_matches_web_rule ... ok
test display_label_for_slot_matches_web ... ok
test constants_and_start_relations_match_web ... ok
test build_cluster_start_plan_matches_web_for_all_cases ... ok
test pick_second_human_start_hex_matches_web ... ok
test second_human_civ_equal_to_player_civ_is_rejected_like_web ... ok
test vectors_cover_the_branches_of_build_cluster_start_plan ... ok
test second_human_without_legal_hex_yields_no_second_seat_derived_from_code ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.57s

     Running tests/p6_1c_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1c_tables-2a37790854995833)

running 4 tests
test braz_table_has_sane_shape_and_consistent_references ... ok
test cluster_table_has_sane_shape ... ok
test llama_table_has_sane_shape ... ok
test start_tables_parse_with_deny_unknown_fields ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1d_city_names.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1d_city_names-4bfda12150196ed9)

running 13 tests
test collect_used_city_names_matches_web ... ok
test embedded_pool_data_is_byte_identical_to_data_used_for_vectors ... ok
test nazwa_klastra_at_matches_web ... ok
test city_name_with_suffix_matches_web ... ok
test pool_length_constants_match_web ... ok
test pick_next_city_name_from_names_matches_web_for_synthetic_queues ... ok
test rival_pool_index_matches_web ... ok
test resolve_state_city_name_matches_web ... ok
test cluster_rival_from_pool_matches_web ... ok
test suggest_and_ai_founding_names_match_web ... ok
test validate_city_names_pools_matches_web ... ok
test state_city_name_at_matches_web ... ok
test pick_capital_foreign_regular_match_web_for_real_pools ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/p6_1d_civ_bonuses.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1d_civ_bonuses-30f5c7450cfc6997)

running 14 tests
test building_cost_discount_matches_web ... ok
test apply_multiplier_matches_web ... ok
test empty_bonus_list_gives_zero_multipliers ... ok
test embedded_data_is_byte_identical_to_data_used_for_vectors ... ok
test is_combat_modifier_bonus_matches_web ... ok
test matrix_bonusy_match_web_for_every_civ_key_variant ... ok
test real_civs_bonuses_convert_without_loss ... ok
test movement_range_siege_wall_multipliers_match_web ... ok
test terrain_forest_detection_matches_web ... ok
test unit_combat_category_matches_web_for_every_unit ... ok
test unit_matches_cel_matches_web_for_every_unit_and_cel ... ok
test strip_diacritics_matches_web_function_cut_verbatim ... ok
test bonus_applies_per_entry_matches_web_for_multi_entry_lists ... ok
test bonus_applies_and_stat_multipliers_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 8.86s

     Running tests/p6_1d_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1d_tables-7c67743f1f351b01)

running 4 tests
test city_name_constants_have_consistent_shape ... ok
test diacritics_table_maps_single_chars_outside_ascii ... ok
test rules_have_known_stats_and_param_ids ... ok
test matrix_specs_have_consistent_shape_and_known_param_ids ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1e_civ_matrix.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1e_civ_matrix-d0b7dd9cf60d4be3)

running 21 tests
test ai_params_and_diplomacy_rows_match_web ... ok
test ai_fallback_branches_are_actually_exercised ... ok
test apply_civ_matrix_param_matches_web ... ok
test civ_matrix_param_def_matches_web ... ok
test civ_matrix_param_at_difficulty_matches_web ... ok
test civ_matrix_params_at_difficulty_matches_web_order_and_values ... ok
test ai_by_typ_resolvers_match_web ... ok
test data_files_are_byte_identical_to_web_pin ... ok
test every_matrix_cell_parses_exactly_like_js ... ok
test consumer_status_polarity_band_baseline_match_web_per_parameter ... ok
test median_matches_web ... ok
test param_order_and_rows_match_web_for_every_scenario ... ok
test proc_sum_and_apply_proc_match_web ... ok
test civ_matrix_param_matches_web ... ok
test scale_parameters_are_clamped_and_shifted_only_for_skala ... ok
test every_status_for_every_parameter_matches_web_texts ... ok
test status_visibility_is_true_only_for_real_gameplay ... ok
test profile_by_key_resolution_matches_web ... ok
test snapshot_and_profiles_match_web ... ok
test synthetic_cell_grid_matches_web ... ok
test ai_profiles_and_norms_match_web ... ok

test result: ok. 21 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.48s

     Running tests/p6_1e_civ_names.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1e_civ_names-80674a5ae9a4508e)

running 11 tests
test assign_invariants_hold_on_real_roster ... ok
test civ_ids_from_roster_matches_web ... ok
test find_klastra_display_validate_match_web ... ok
test constants_match_web ... ok
test make_rng_streams_match_web_for_every_seed ... ok
test assign_ai_civ_types_matches_web ... ok
test pool_views_ai_founded_and_validation_match_web ... ok
test reexports_behave_like_web ... ok
test rotate_preferred_matches_web ... ok
test pick_active_civ_pool_matches_web ... ok
test start_foreign_rival_state_names_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.98s

     Running tests/p6_1e_js_compat.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1e_js_compat-08e1cb152706a259)

running 8 tests
test intensity_label_matches_web ... ok
test math_round_matches_js_bit_for_bit ... ok
test is_integer_and_min_max_clamp_follow_js ... ok
test parameter_label_matches_web ... ok
test number_to_string_matches_js_for_every_vector ... ok
test formatted_value_matches_web ... ok
test trim_matches_js_string_trim ... ok
test to_fixed_matches_js_for_every_digit_count ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.18s

     Running tests/p6_1e_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_1e_tables-9dc9ef20c17d92b2)

running 7 tests
test parameter_label_dictionary_has_nonempty_entries_and_suffix_rule ... ok
test semantic_neutral_band_rules_cover_every_parameter_definition ... ok
test params_table_is_consistent_with_matrix_and_civs ... ok
test semantic_table_has_text_for_every_status_and_placeholder ... ok
test modules_contain_no_balance_or_data_literals ... ok
test tables_parse_and_are_cached ... ok
test semantic_table_sets_reference_existing_parameters_and_are_disjoint ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_23_fort.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_23_fort-324dd86b69e58eeb)

running 5 tests
test fort_rules_table_references_known_improvements ... ok
test takeover_on_city_founded_matches_web ... ok
test fort_node_conversion_and_reservation_match_web ... ok
test territory_dependencies_match_web ... ok
test evacuation_hex_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s

     Running tests/p6_23_hexmove.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_23_hexmove-a546770c25695422)

running 4 tests
test foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors ... ok
test foreign_city_blocks_match_web ... ok
test ai_entry_into_empty_enemy_city_matches_web ... ok
test city_at_hex_and_occupancy_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_23_improvements.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_23_improvements-2f6107250ed9d0bf)

running 10 tests
test catalog_key_order_equals_json_file_order_including_meta_rows ... ok
test era_and_cost_scaling_match_web ... ok
test applying_bonuses_matches_web ... ok
test constants_match_web ... ok
test hex_layer_functions_match_web ... ok
test rules_tables_have_consistent_shape ... ok
test migration_functions_match_web ... ok
test normalize_and_lookup_functions_match_web ... ok
test territory_and_ore_yields_match_web ... ok
test prototype_keys_pass_normalize_like_in_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/p6_23_order.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_23_order-b99acb8ea5803b82)

running 11 tests
test compute_order_matches_web ... ok
test engine_society_params_match_web_subset_used_by_vectors ... ok
test happiness_breakdown_matches_web ... ok
test order_effects_matches_web ... ok
test evaluate_order_matches_web ... ok
test order_shape_invariants_hold_for_any_table_values ... ok
test fallback_params_equal_web_constant ... ok
test load_order_params_matches_web ... ok
test order_effects_to_yield_mults_matches_web ... ok
test order_tier_matches_web ... ok
test pick_revolt_migration_target_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/p6_23_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_23_tables-6de635983c184b19)

running 3 tests
test teren_ruch_reguly_table_has_nonempty_lists ... ok
test porzadek_params_table_is_complete_and_finite ... ok
test ulepszenia_reguly_table_references_existing_improvements_only ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_4_core.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_4_core-1b564fea4bb5288e)

running 10 tests
test hex_distance_matches_web ... ok
test constants_read_from_running_web_match_tables ... ok
test road_modifier_matches_web_including_floor_and_special_costs ... ok
test compute_reachable_matches_web_order_and_min_move ... ok
test path_cost_matches_web ... ok
test terrain_and_embark_costs_match_web_on_maps ... ok
test stack_group_id_matches_web ... ok
test terrain_cost_combinations_match_web ... ok
test visibility_helpers_match_web ... ok
test compute_path_matches_web_including_ties_and_edge_destinations ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.43s

     Running tests/p6_4_embark.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_4_embark-1585566f17a207b0)

running 4 tests
test can_unit_embark_matches_web ... ok
test water_hex_queries_match_web ... ok
test apply_embark_state_after_move_matches_web ... ok
test move_cost_fn_for_matches_web_on_every_map_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.57s

     Running tests/p6_4_march.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_4_march-bae7bfc63cf555d2)

running 6 tests
test fog_frontier_and_fog_plan_match_web ... ok
test save_validation_and_round_trip_match_web ... ok
test execute_march_step_matches_web ... ok
test plan_path_turns_matches_web ... ok
test truncate_path_to_budget_matches_web_including_min_move ... ok
test should_stop_at_obstacle_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.70s

     Running tests/p6_4_rally.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_4_rally-4bbcd32c03f67cc3)

running 3 tests
test launch_leaders_one_per_stack_match_web ... ok
test set_clear_and_save_sequences_match_web ... ok
test load_from_save_and_number_parsing_match_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_4_scout.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_4_scout-573fb211c9224499)

running 5 tests
test explore_scores_match_web ... ok
test scout_flags_match_web ... ok
test run_scouts_auto_explore_matches_web ... ok
test pick_scout_explore_target_matches_web_including_rng_use ... ok
test advance_scout_auto_explore_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 21.11s

     Running tests/p6_4_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_4_tables-d82f71a9bfb2cdbc)

running 4 tests
test numeric_rows_have_sane_shape_without_pinning_values ... ok
test neighbour_table_is_six_distinct_adjacent_offsets ... ok
test table_parses_and_every_row_names_its_web_source ... ok
test text_rows_are_nonempty_and_distinct ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_5a_cost.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_5a_cost-a4777603b2625768)

running 4 tests
test js_round_matches_half_up_semantics ... ok
test replace_context_keeps_every_field_and_the_required_stock ... ok
test table_constants_equal_the_running_web_object ... ok
test unit_cost_pace_matches_web_bitwise ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_5a_display.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_5a_display-f61d69c84dc8b548)

running 7 tests
test badge_and_veteran_maxima_match_web ... ok
test representative_matches_web_including_utf16_id_order_and_nan_attack ... ok
test field_power_passes_roster_in_web_order_and_returns_sum ... ok
test compute_stack_display_matches_web_order_and_vitals ... ok
test hp_pool_matches_web_including_nonfinite_and_overfull_hp ... ok
test unit_at_representative_matches_web ... ok
test stack_vitals_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.29s

     Running tests/p6_5a_ruch.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_5a_ruch-0e062d5664866c50)

running 8 tests
test adjacent_empty_and_split_destinations_match_web ... ok
test hud_actions_match_web ... ok
test bounce_from_origin_and_separate_return_hex_match_web ... ok
test bounce_hex_assignment_matches_web_including_duplicates_and_blocking ... ok
test ruch_pools_match_web_bitwise ... ok
test separate_return_matches_web_bitwise ... ok
test sync_and_deduct_match_web ... ok
test unit_with_pooled_ruch_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.58s

     Running tests/p6_5a_stack.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_5a_stack-32bcaffc556db8d5)

running 10 tests
test all_defenders_and_wake_stack_match_web ... ok
test fresh_and_shared_stack_group_ids_match_web_sequence ... ok
test adjacent_army_hexes_and_active_stack_match_web ... ok
test garrison_and_field_fortify_transitions_match_web ... ok
test same_stack_group_and_stack_key_match_web ... ok
test stack_group_id_agrees_with_p64_port_on_the_same_unit ... ok
test stack_group_id_and_render_key_match_web ... ok
test transition_chains_match_web_including_both_fortifications_at_once ... ok
test law_garrison_counts_match_web ... ok
test visible_colocated_and_garrison_queries_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.99s

     Running tests/p6_5a_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_5a_tables-c73c4ca1005ab433)

running 2 tests
test tempo_table_parses_and_has_distinct_keys_with_positive_multipliers ... ok
test army_params_parse_and_have_sane_shape ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_5b_bonuses.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_5b_bonuses-02e0bfe8577aeac4)

running 8 tests
test chain_depth_limit_matches_web ... ok
test building_roles_and_real_game_data_match_web ... ok
test gain_hint_text_matches_web_for_arbitrary_gains ... ok
test stat_multiplier_merge_is_generic_over_any_structural_type ... ok
test unit_progress_badges_and_fractions_match_web ... ok
test stat_multiplier_merge_matches_web ... ok
test city_visit_gain_progress_and_hint_match_web ... ok
test city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.86s

     Running tests/p6_5b_format.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_5b_format-8864aed56360906f)

running 5 tests
test locale_compare_matches_web_for_ascii ... ok
test locale_compare_table_is_the_measured_primary_order ... ok
test citizen_label_matches_web ... ok
test number_to_string_matches_web ... ok
test population_formats_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/p6_5b_manpower.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_5b_manpower-0a099d61a31307ee)

running 13 tests
test city_pool_functions_match_web ... ok
test besieged_location_sort_key_sync_and_civilian_match_web ... ok
test empire_deduct_refund_and_spawn_mutate_like_web ... ok
test game_default_params_equal_the_running_web_defaults ... ok
test civ_bonus_multipliers_match_web ... ok
test empire_totals_match_web ... ok
test opt_helpers_are_consistent ... ok
test heal_cost_and_cap_match_web ... ok
test era_table_and_citizen_scalars_match_web ... ok
test pool_and_cost_scalars_match_web ... ok
test raw_param_loaders_match_web ... ok
test regen_gain_matches_web_including_default_params ... ok
test spawn_and_refund_functions_match_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.20s

     Running tests/p6_5b_replenish.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_5b_replenish-11d5c4ac4b77306b)

running 1 test
test replenishment_matches_web_state_results_and_closure_protocol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.16s

     Running tests/p6_5b_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_5b_tables-4f918dda2f6680dd)

running 6 tests
test era_table_rows_are_contiguous_and_cover_the_clamp_range ... ok
test civilian_set_is_resolved_from_the_table ... ok
test tables_are_loaded_from_the_embedded_json_files ... ok
test tables_parse_and_have_the_expected_shape ... ok
test p65a_badge_closures_are_closed_by_the_real_path_badge_port ... ok
test table_constants_equal_the_running_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/p6_6a_conquest.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6a_conquest-230020c5d317bb55)

running 6 tests
test clear_city_culture_mix_removes_both_fields ... ok
test thresholds_match_web ... ok
test tick_city_culture_religion_matches_web_with_injected_conversions ... ok
test building_flags_match_web ... ok
test revolt_multiplier_and_deprecated_penalties_match_web ... ok
test on_city_captured_culture_matches_web_with_injected_circle ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/p6_6a_founding.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6a_founding-99bc07a6ebb0028d)

running 10 tests
test costs_follow_injected_params ... ok
test cost_constants_match_running_web ... ok
test first_city_is_free_for_any_params ... ok
test can_afford_found_city_matches_web ... ok
test evaluate_found_city_affordance_matches_web ... ok
test production_params_come_from_data_tables ... ok
test read_param_accepts_only_finite_numbers ... ok
test pick_source_city_matches_web_including_rand_protocol ... ok
test cost_labels_match_web ... ok
test is_subsequent_found_city_matches_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/p6_6a_hexclear.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6a_hexclear-98167207530960b3)

running 4 tests
test clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed ... ok
test clear_hex_for_city_center_matches_web ... ok
test apply_city_founding_to_hex_matches_web ... ok
test keep_set_and_predicate_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_6a_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6a_tables-49f7fae6dbfdf022)

running 6 tests
test conquest_table_is_well_formed ... ok
test default_sight_comes_from_map_gen_params_when_positive ... ok
test founding_costs_are_present_in_miasto_params ... ok
test founding_table_is_well_formed ... ok
test hex_clear_table_is_well_formed ... ok
test visibility_table_is_well_formed ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_6a_visibility.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6a_visibility-0615129695460042)

running 11 tests
test city_sight_radius_reexport_matches_web ... ok
test add_explored_and_render_sets_match_web ... ok
test compute_visible_along_path_matches_web ... ok
test compute_player_visibility_matches_web ... ok
test default_sight_uses_the_data_value_only_when_positive ... ok
test constants_match_running_web ... ok
test compute_visible_fixed_sight_matches_web ... ok
test key_listings_and_terrain_predicates_match_web ... ok
test units_visible_on_map_matches_web ... ok
test compute_visible_at_matches_web ... ok
test unit_sight_resolver_and_compute_visible_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.95s

     Running tests/p6_6b_cities_ensure.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6b_cities_ensure-50bdd28ce75e4eaa)

running 3 tests
test ensure_city_save_defaults_is_idempotent_on_web_outputs ... ok
test ensure_city_podzial_defaults_matches_web ... ok
test ensure_city_save_defaults_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.65s

     Running tests/p6_6b_cities_found.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6b_cities_found-bf324e45fa4c28c4)

running 5 tests
test can_found_city_matches_web ... ok
test found_city_from_village_matches_web ... ok
test city_name_and_predicates_match_web ... ok
test found_city_at_matches_web ... ok
test found_city_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.79s

     Running tests/p6_6b_display.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6b_display-cf51bca517933bcf)

running 13 tests
test format_entity_display_name_matches_web ... ok
test clear_city_state_flag_on_capture_matches_web ... ok
test foreign_capital_map_name_matches_web ... ok
test format_city_map_label_matches_web ... ok
test is_owner_cluster_city_state_matches_web ... ok
test is_cluster_city_state_slot_matches_web ... ok
test is_technical_owner_label_matches_web ... ok
test labels_match_running_web ... ok
test resolve_owner_base_name_matches_web ... ok
test sanitize_owner_display_base_matches_web ... ok
test should_force_culture_icon_matches_web ... ok
test strip_city_state_suffix_matches_web ... ok
test format_owner_diplo_label_matches_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.34s

     Running tests/p6_6b_empire.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6b_empire-0403df939c625d79)

running 6 tests
test podzial_pracy_functions_match_web ... ok
test podzial_pracy_migration_matches_web ... ok
test okolica_focus_functions_match_web ... ok
test budowa_profil_functions_match_web ... ok
test poziom_racji_functions_match_web ... ok
test upgrade_budowa_profil_auto_defaults_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.01s

     Running tests/p6_6b_lists.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6b_lists-76264e548cdf3b61)

running 3 tests
test default_nazwa_matches_web ... ok
test dedupe_matches_web ... ok
test id_generator_and_loader_match_web_sequence ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_6b_percent.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6b_percent-1f6b6df5d7367a50)

running 10 tests
test constants_match_running_web ... ok
test budowa_priority_helpers_match_web ... ok
test clamp_functions_match_web ... ok
test adjust_handel_split_matches_web ... ok
test resolve_praca_percent_from_raw_matches_web ... ok
test podzial_pracy_z_procentu_puli_matches_web ... ok
test resolve_effective_ulepszenia_matches_web ... ok
test ulepszenia_policy_and_caps_match_web ... ok
test snap_and_migrate_match_web ... ok
test normalize_podzial_handlu_matches_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.66s

     Running tests/p6_6b_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_6b_tables-30bc19375e8a4aab)

running 5 tests
test cities_table_is_well_formed ... ok
test min_city_distance_comes_from_miasto_params ... ok
test cities_defaults_are_consistent_with_each_other ... ok
test cities_foreign_inputs_agree_with_engine_data ... ok
test display_names_table_is_well_formed ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_7a_empire.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_7a_empire-94828196ae0ab72d)

running 9 tests
test equal_growth_plan_matches_web ... ok
test advance_empire_food_matches_web ... ok
test auto_raise_matches_web ... ok
test auto_balance_matches_web ... ok
test recompute_city_food_balances_matches_web ... ok
test wyzywienie_poziom_na_limicie_matches_web ... ok
test simulation_helpers_match_web ... ok
test max_safe_poziom_matches_web ... ok
test runtime_clear_and_deprecated_helpers_match_web ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.71s

     Running tests/p6_7a_growth.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_7a_growth-af8e8f483d682d87)

running 15 tests
test constants_match_running_web ... ok
test difficulty_multiplier_matches_web ... ok
test city_ration_level_matches_web ... ok
test build_params_match_web ... ok
test ensure_city_ration_defaults_matches_web ... ok
test hunger_penalty_matches_web ... ok
test gain_and_turns_match_web ... ok
test growth_percent_matches_web ... ok
test fractional_growth_matches_web ... ok
test population_matrix_synthetic_matches_web ... ok
test population_matrix_matches_web ... ok
test single_source_of_default_level_and_max ... ok
test ration_cost_matches_web ... ok
test population_cap_matches_web ... ok
test ration_helpers_match_web ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.92s

     Running tests/p6_7a_post_central.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_7a_post_central-641bfaa99773b056)

running 2 tests
test manpower_refresh_used_by_growth_matches_web ... ok
test post_central_growth_matches_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.42s

     Running tests/p6_7a_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_7a_tables-5b4117dddd54e7ef)

running 10 tests
test food_cost_table_covers_every_level ... ok
test legacy_ration_migration_targets_lie_on_the_grid ... ok
test numeric_inputs_are_finite_and_structurally_valid ... ok
test params_file_parses_and_has_no_unknown_fields ... ok
test research_era_aliases_are_consistent ... ok
test single_source_for_default_level_and_scale_max ... ok
test spichlerz_ids_are_distinct_and_non_empty ... ok
test ration_scale_is_a_well_formed_grid ... ok
test growth_table_covers_every_level_exactly_once ... ok
test diacritics_table_is_well_formed ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_7a_tempo.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_7a_tempo-128bb6a4bfbb174c)

running 8 tests
test magazyn_era_multiplier_matches_web ... ok
test happiness_matches_web ... ok
test pace_table_matches_web ... ok
test spichlerz_inputs_match_web ... ok
test stawki_constants_and_scalars_match_web ... ok
test stock_cost_record_matches_web ... ok
test tempo_threshold_matches_web ... ok
test research_era_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m00_skeleton.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m00_skeleton-1864ffd75187226a)

running 5 tests
test domain_mod_declares_top_level_skeleton_modules ... ok
test mapgen_mod_declares_exactly_doc_modules ... ok
test doc_row_lists_expected_counts ... ok
test skeleton_headers_name_full_owner_ids_from_table ... ok
test files_exist_and_start_with_owner_doc_header ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m01_climate.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m01_climate-fc8a7dd62f5452ac)

running 7 tests
test climate_band_default_arguments_and_ignored_q_match_web ... ok
test desert_assignment_predicate_matches_web ... ok
test forest_threshold_matches_web_bit_for_bit ... ok
test polar_predicate_matches_web ... ok
test water_terrain_predicate_matches_web_for_every_terrain ... ok
test world_type_and_climate_band_serde_literals_match_web ... ok
test climate_band_sweep_matches_web_for_every_height_and_row ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/p6_m01_earth_mask.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m01_earth_mask-1779c36a54b4d8e3)

running 10 tests
test derived_mask_file_is_the_single_source_of_mask_data ... ok
test hex_to_norm_edges_match_web ... ok
test bit_at_clamps_out_of_range_coordinates_like_web ... ok
test mask_dimensions_and_bbox_match_web_bit_for_bit ... ok
test named_constants_match_web_exports ... ok
test sample_template_land_matches_web_on_thousands_of_points ... ok
test sample_template_land_nan_is_sea ... ok
test all_288000_mask_bits_match_the_web_rows ... ok
test polar_rows_inner_dimensions_and_buffers_match_web_for_heights_0_to_600 ... ok
test hex_to_template_norm_template_land_subsample_and_threshold_match_web_for_all_dims ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.33s

     Running tests/p6_m01_params_shape.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m01_params_shape-188a388bb5a09197)

running 9 tests
test climate_is_polar_outside_the_map ... ok
test ocean_buffers_never_shrink_with_height_and_respect_their_lower_bound ... ok
test params_files_parse_and_have_the_expected_shape ... ok
test params_floats_are_parsed_exactly_from_the_raw_json_text ... ok
test subsample_and_threshold_tiers_never_decrease_resolution_for_bigger_maps ... ok
test climate_bands_are_ordered_north_to_south_and_cover_the_playable_rows ... ok
test template_sampling_is_zero_outside_the_unit_square ... ok
test mask_file_is_well_formed ... ok
test template_land_respects_border_and_polar_buffers_and_yields_binary_values ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.18s

     Running tests/p6_m01_prims.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m01_prims-963d8aed92ec098f)

running 14 tests
test all_three_mulberry32_implementations_match_web_for_every_seed_and_step ... ok
test cos_lerp_matches_web_bit_for_bit ... ok
test hex_directions_match_web_in_every_implementation ... ok
test hex_distance_matches_web_for_large_coordinates ... ok
test hex_key_matches_web_format ... ok
test hex_distance_matches_web_on_the_full_grid_in_every_implementation ... ok
test fbm_matches_web_bit_for_bit_for_all_octave_counts ... ok
test js_cos_matches_v8_math_cos_bit_for_bit_in_the_supported_range ... ok
test js_cos_outside_the_medium_range_stays_within_one_ulp_and_keeps_special_values ... ok
test js_to_int32_follows_ecmascript_to_int32 ... ok
test mulberry32_state_is_the_seed_until_first_draw ... ok
test value_noise_matches_web_bit_for_bit_including_huge_and_negative_coordinates ... ok
test vectors_come_from_the_pinned_web_run ... ok
test perm_table_matches_web_for_all_256_entries ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/p6_m02_deposit_river.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m02_deposit_river-aa1b079e2438a847)

running 7 tests
test deposit_visibility_matches_web ... ok
test parse_helpers_cover_all_tokens ... ok
test ensure_meta_and_hidden_count_match_web ... ok
test metal_deposit_min_era_table_matches_web ... ok
test river_switch_keys_match_names_the_web_queried ... ok
test river_switch_without_environment_matches_web ... ok
test river_switch_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/p6_m02_float_parse.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m02_float_parse-bdfe4c125f45e686)

running 1 test
test table_floats_are_read_without_rounding_error ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_generator.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m02_generator-aad7149729b35309)

running 4 tests
test normalization_matches_web ... ok
test menu_labels_match_web ... ok
test size_dims_and_order_match_web ... ok
test size_from_menu_label_and_label_to_dims_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_new_game.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m02_new_game-fb7bd264e697cc8f)

running 11 tests
test density_to_label_round_trips_where_web_does ... ok
test clamp_miasta_panstwa_count_matches_web ... ok
test constants_match_web ... ok
test land_fraction_functions_match_web ... ok
test civ_menus_with_rosters_match_web ... ok
test resolve_world_gen_numbers_matches_web ... ok
test per_label_functions_match_web ... ok
test river_map_params_match_web_bitwise ... ok
test map_size_label_from_dims_matches_web ... ok
test tier_functions_match_web ... ok
test world_generation_presets_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.21s

     Running tests/p6_m02_quality.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m02_quality-07b289bbbb867c75)

running 4 tests
test constants_match_web ... ok
test per_label_functions_match_web ... ok
test tier_to_label_and_preset_match_web ... ok
test web_quirk_ignores_z_with_dot ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m02_tables-abfdd889c351ab6b)

running 7 tests
test every_section_names_its_web_source ... ok
test land_and_toggle_tables_are_consistent ... ok
test map_label_thresholds_are_ascending_and_known ... ok
test per_size_menus_cover_every_size ... ok
test table_parses_with_deny_unknown_fields ... ok
test size_tables_are_consistent ... ok
test river_rules_have_sane_ranges ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m03_centers.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m03_centers-e9e6c6c080ae746d)

running 15 tests
test default_shape_params_match_web_and_consume_six_draws ... ok
test continent_center_count_matches_web_for_all_world_types ... ok
test build_continent_centers_matches_web_including_rng_consumption ... ok
test assign_island_grid_indices_keeps_web_map_insertion_order ... ok
test elliptical_mask_matches_web_inside_and_outside_the_map ... ok
test island_grid_cell_index_matches_web_including_out_of_range_cells ... ok
test named_constants_match_web_exports ... ok
test isotropic_helpers_match_web ... ok
test pangea_land_t_matches_web_including_clamps_and_non_finite ... ok
test island_centers_match_web_including_rng_consumption ... ok
test five_zone_centers_match_web_including_rng_consumption ... ok
test perm_tables_from_seed_match_web ... ok
test pangea_layout_params_match_web_for_every_field ... ok
test pangea_blob_centers_match_web_including_rng_consumption ... ok
test voronoi_zone_index_and_second_distance_match_web_with_ties ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/p6_m03_earth.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m03_earth-527455072c339731)

running 5 tests
test constants_match_web ... ok
test subsample_grid_and_land_fraction_threshold_match_web_for_all_tier_edges ... ok
test heights_polar_rows_and_land_rows_match_web_for_every_height ... ok
test widths_inner_width_matches_web_for_every_width ... ok
test bit_at_matches_web_including_clamped_out_of_range_coordinates ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m03_edges.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m03_edges-2ed31862d88dc14c)

running 3 tests
test exact_threshold_arguments_exist_in_the_vectors ... ok
test edge_rect_floor_matches_web_for_maps_wider_than_2000_hexes ... ok
test pangea_layout_matches_web_at_exact_threshold_neighbourhoods ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m03_jsmath.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m03_jsmath-2eef5b60b0adbce2)

running 9 tests
test max_min_follow_javascript_nan_and_signed_zero_rules ... ok
test pow_follows_ecmascript_special_cases ... ok
test sin_beyond_reconstructed_domain_panics_in_debug_builds - should panic ... ok
test pow_matches_web_bit_for_bit ... ok
test hypot_matches_web_bit_for_bit ... ok
test atan2_matches_web_bit_for_bit ... ok
test sin_inside_domain_does_not_hit_the_fallback ... ok
test sin_matches_web_bit_for_bit ... ok
test vectors_distinguish_v8_from_system_libm ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/p6_m03_masks.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m03_masks-92f5032984be63fd)

running 5 tests
test masks_are_bounded_and_zero_in_the_hard_ocean_border ... ok
test pangea_blob_score_matches_web_on_fixed_centers ... ok
test border_dependencies_match_web ... ok
test land_masks_match_web_for_every_type_size_and_seed ... ok
test full_seed_pipeline_reproduces_the_web_land_masks ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.46s

     Running tests/p6_m03_strait.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m03_strait-37e3722b9d7677a3)

running 1 test
test strait_vectors_match_web_at_exact_threshold_and_one_ulp_around_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m03_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m03_tables-50e93f9f6b59c4b2)

running 6 tests
test accessors_are_driven_by_the_table_not_by_literals ... ok
test border_fade_clamp_is_unreachable_while_table_invariant_holds ... ok
test every_table_float_is_parsed_exactly_from_the_raw_text ... ok
test table_invariants_hold ... ok
test table_parses_and_is_cached ... ok
test table_has_no_unknown_or_missing_keys ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m04_border.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m04_border-6bff5e3eb79596bf)

running 12 tests
test border_consts_match_web ... ok
test erosion_hook_matches_web ... ok
test is_in_map_border_with_buffer_matches_web ... ok
test lat_buffer_matches_web ... ok
test margin_cap_matches_web ... ok
test margin_scatter_score_matches_web ... ok
test parse_hex_key_edge_keys_match_web ... ok
test parse_hex_key_matches_js_number_for_hexkey_strings ... ok
test set_hex_to_morze_and_laka_match_web ... ok
test border_grid_tools_match_web ... ok
test apply_marginal_land_zone_caps_matches_web ... ok
test fades_and_distances_match_web ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.15s

     Running tests/p6_m04_classify.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m04_classify-421508a5d4a5c685)

running 7 tests
test consts_match_web ... ok
test relief_elev_gates_match_web ... ok
test classify_terrain_matches_web ... ok
test classify_terrain_flat_matches_web ... ok
test terrain_cell_bias_matches_web ... ok
test hash_int3_matches_web ... ok
test rown_laka_jitter_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.69s

     Running tests/p6_m04_reapply.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m04_reapply-8accc2cf3c58125d)

running 4 tests
test forest_replay_hooks_reject_wrong_arguments ... ok
test reapply_forest_overlay_targeted_inland_cases_match_web ... ok
test reapply_land_terrain_matches_web ... ok
test reapply_forest_overlay_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.11s

     Running tests/p6_m04_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m04_tables-4d2b90ef46470e0e)

running 4 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test floats_are_parsed_exactly_from_the_raw_json_text ... ok
test values_have_sane_shape ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m09_rivals.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m09_rivals-3d2871a7b9753cde)

running 19 tests
test foreign_buffer_gate_matches_web ... ok
test group_foreign_type_clusters_matches_web ... ok
test constants_match_web_and_aliases_are_not_separate_numbers ... ok
test cluster_pack_radius_matches_web ... ok
test half_plane_axis_matches_web_bitwise ... ok
test is_in_half_plane_matches_web ... ok
test land_pool_near_core_matches_web ... ok
test hexes_at_distance_matches_web ... ok
test map_helpers_match_web ... ok
test nearest_legal_land_matches_web ... ok
test hub_chain_matches_web ... ok
test hub_chain_result_does_not_depend_on_seed_as_in_web ... ok
test rival_slots_degenerate_inputs_do_not_panic ... ok
test pack_rival_cities_matches_web ... ok
test shuffle_in_place_matches_web ... ok
test vectors_identify_the_same_maps_as_p6_1c ... ok
test pack_around_capital_matches_web ... ok
test rival_slots_match_web_on_real_maps ... ok
test rival_candidate_hexes_match_web_on_real_maps ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 10.23s

     Running tests/p6_m09_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m09_tables-0380ed37b51ae447)

running 3 tests
test every_value_has_web_source_and_sane_shape ... ok
test start_city_state_distance_is_not_the_cities_ts_constant ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m10_masses.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m10_masses-1406512a25778485)

running 16 tests
test alias_constants_are_not_separate_numbers ... ok
test constants_match_web ... ok
test local_land_fraction_and_gate_match_web ... ok
test map_size_label_matches_web_and_params_table ... ok
test mass_qualifies_and_indices_match_web ... ok
test allocate_typy_to_masses_matches_web ... ok
test player_mass_gate_over_whole_maps_matches_web ... ok
test reorder_roster_by_preference_matches_web ... ok
test roster_for_start_epoch_matches_web ... ok
test spawn_habitable_terrain_matches_web ... ok
test thresholds_and_caps_match_web ... ok
test types_have_web_shape ... ok
test vectors_identify_the_maps_used ... ok
test group_habitable_masses_and_cache_match_web ... ok
test region_mass_dominance_matches_web ... ok
test development_space_and_mass_gates_match_web ... ok

test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 6.23s

     Running tests/p6_m10_placement.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m10_placement-0ff78516c0b93780)

running 14 tests
test hooks_match_web ... ok
test pick_center_in_mass_matches_web ... ok
test balance_and_enforce_match_web ... ok
test pick_best_local_land_spawn_matches_web ... ok
test pick_center_in_mass_spread_matches_web ... ok
test pick_tied_spawn_land_candidate_matches_web ... ok
test pick_center_on_land_pool_spread_matches_web ... ok
test pick_center_in_mass_with_land_gate_matches_web ... ok
test sort_spawn_candidates_with_spread_bias_matches_web ... ok
test sort_spawn_land_candidates_matches_web ... ok
test voronoi_and_centroid_match_web ... ok
test pick_player_cluster_center_matches_web ... ok
test player_start_candidates_match_web ... ok
test place_cluster_centers_across_landmasses_matches_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 11.26s

     Running tests/p6_m10_start_scoring.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m10_start_scoring-a1f4519e6663b8a9)

running 4 tests
test reveal_radius_matches_web ... ok
test score_city_start_hex_over_whole_maps_matches_web ... ok
test score_city_start_hex_matches_web ... ok
test find_best_player_start_hex_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.58s

     Running tests/p6_m10_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m10_tables-07a2652eafb05f75)

running 3 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test tables_parse_with_deny_unknown_fields ... ok
test values_have_sane_shape ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m10_v8sort.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m10_v8sort-d4cb86648b856051)

running 2 tests
test js_array_sort_is_stable_for_equal_keys ... ok
test js_array_sort_matches_v8_including_comparator_call_counts ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.31s

     Running tests/p6_m11_gates.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m11_gates-70911875d6c88b8e)

running 11 tests
test by_label_matches_web ... ok
test for_map_matches_web ... ok
test hub_reach_and_body_buffer_match_web ... ok
test capital_separation_gate_and_distance_match_web ... ok
test band_penalty_matches_web ... ok
test quadrant_helpers_match_web ... ok
test rescue_ladder_matches_web ... ok
test preferred_quadrants_match_web ... ok
test sea_gates_match_web ... ok
test hooks_impl_matches_web ... ok
test pick_spawn_hex_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.78s

     Running tests/p6_m11_integration.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m11_integration-9de8c89dfd74ed60)

running 4 tests
test m11_hooks_match_m10_web_hook_vectors ... ok
test m11_hooks_reproduce_m10_candidate_sorting ... ok
test m11_and_m10_vector_maps_are_identical ... ok
test m11_hooks_reproduce_m10_center_placement ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.57s

     Running tests/p6_m11_layout.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m11_layout-cc4df252415db121)

running 10 tests
test centroid_and_far_enough_match_web ... ok
test capital_pos_matches_web ... ok
test assign_types_matches_web ... ok
test build_cluster_cities_matches_web ... ok
test cities_with_land_gate_match_web ... ok
test poisson_pick_cities_matches_web ... ok
test pick_capital_hex_in_region_matches_web ... ok
test layout_with_edge_capital_matches_web ... ok
test simple_fallback_matches_web ... ok
test enforce_local_land_dominance_matches_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 6.59s

     Running tests/p6_m11_repair.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m11_repair-2ea5f9383c7a3744)

running 7 tests
test cluster_helpers_match_web ... ok
test fixtures_have_web_shape_and_variety ... ok
test quarter_spread_matches_web ... ok
test hard_capital_separation_matches_web ... ok
test body_separation_matches_web ... ok
test repack_one_matches_web ... ok
test repack_all_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 9.58s

     Running tests/p6_m11_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m11_tables-c893deff57812197)

running 4 tests
test derived_constants_are_aliases_of_table_fields ... ok
test every_value_has_a_web_source_with_file_and_line ... ok
test values_have_sane_shape ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m14_range.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m14_range-11a976a1d8c0add9)

running 3 tests
test culture_range_matches_web ... ok
test territory_keys_by_owner_match_web ... ok
test religion_range_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.15s

     Running tests/p6_m14_territory.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m14_territory-ba89cbcff9a8795a)

running 8 tests
test axial_distance_matches_web_and_integer_variant ... ok
test city_territory_radius_matches_web ... ok
test city_sight_radius_matches_web ... ok
test owner_tie_goes_to_first_node ... ok
test is_player_territory_hex_matches_web ... ok
test is_in_territory_matches_web ... ok
test territory_owner_at_matches_web ... ok
test city_range_for_population_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s

     Running tests/p6_m14_wonder.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m14_wonder-96491650d658ea23)

running 4 tests
test pick_matches_web ... ok
test list_for_city_matches_web ... ok
test list_for_owner_matches_web ... ok
test shape_candidates_are_sorted_land_and_exclude_center ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.71s

     Running tests/p6_m14_work.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m14_work-1ce45b3a771ecceb)

running 8 tests
test build_territory_nodes_matches_web ... ok
test reconcile_all_matches_web ... ok
test reconcile_without_reczne_is_noop ... ok
test city_center_keys_match_web ... ok
test is_territory_hex_owned_by_matches_web ... ok
test reczne_key_legal_matches_web ... ok
test workable_filter_matches_web ... ok
test reconcile_for_owner_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.40s

     Running tests/p6_m15_roads.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m15_roads-00c1796d2d44aacd)

running 8 tests
test constants_match_web ... ok
test has_road_matches_web ... ok
test is_road_key_matches_web ... ok
test road_table_shape_and_key_names ... ok
test roads_source_has_no_numeric_data_literals ... ok
test collect_road_keys_matches_web_order ... ok
test p64_ruch_modifier_agrees_with_roads_module ... ok
test apply_modifier_matches_web_bitwise ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.14s

     Running tests/p6_m16_divergence.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m16_divergence-36f41f9340105fdf)

running 1 test
test web_allows_farm_irrigation_terraces_on_deposit_hexes ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.80s

     Running tests/p6_m16_doc.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m16_doc-a783ecb95132fc08)

running 1 test
test document_has_a_status_row_for_every_web_symbol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m16_gallery.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m16_gallery-40cbda6184b177cf)

running 2 tests
test gallery_terrain_eligible_matches_web ... ok
test gallery_combo_eligible_and_show_model_match_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/p6_m16_qualifier.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m16_qualifier-54c27efc7f24500a)

running 4 tests
test forest_build_block_reason_matches_web ... ok
test api_hex_click_and_on_select_match_web ... ok
test qualifier_bits_match_web_for_every_key_and_hex ... ok
test api_qualifying_hexes_and_work_cost_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 6.83s

     Running tests/p6_m16_rules.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m16_rules-33e7267e34428bc9)

running 15 tests
test deposit_rules_match_web ... ok
test can_add_food_layer_matches_web ... ok
test farm_and_owce_base_terrain_match_web ... ok
test forest_blocking_and_hints_match_web ... ok
test format_impact_list_matches_web ... ok
test improvement_meta_and_tech_gate_match_web ... ok
test hex_has_road_matches_web ... ok
test hex_keys_within_radius_matches_web ... ok
test legacy_farm_layer_and_strip_match_web ... ok
test livestock_dependency_matches_web ... ok
test mine_keys_tarasy_civ_and_food_keys_match_web ... ok
test plan_and_remove_legacy_farms_match_web ... ok
test strip_improvements_when_forest_removed_matches_web ... ok
test replaced_by_build_and_impact_match_web ... ok
test work_cost_scale_matches_web ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.66s

     Running tests/p6_m16_tables.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m16_tables-fd1582fd8a835964)

running 5 tests
test food_and_sector_tables_are_consistent ... ok
test livestock_and_tech_tables_are_consistent ... ok
test rule_keys_are_known_improvements ... ok
test terrain_codes_in_tables_are_valid ... ok
test improvement_build_has_no_balance_number_literals ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m17_rebuild.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m17_rebuild-60f4b8705aae281a)

running 5 tests
test js_keyed_map_orders_array_index_keys_first ... ok
test rebuild_errors_name_the_failing_field ... ok
test rebuild_error_class_matches_web_failure_class ... ok
test serialize_rebuild_serialize_is_stable_without_duplicate_coords ... ok
test rebuild_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.22s

     Running tests/p6_m17_serialize.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m17_serialize-bc527bf55aa676f5)

running 5 tests
test js_num_writes_integers_without_fraction_and_non_finite_as_null ... ok
test serialize_vectors_touch_every_branch ... ok
test serialize_text_is_byte_identical_to_web_json_stringify ... ok
test serialize_matches_web_structurally ... ok
test snapshot_shape_invariants_hold_for_every_vector ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.24s

     Running tests/p6_m17_validate.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/p6_m17_validate-f52da1b0e7422d55)

running 2 tests
test is_valid_matches_web_for_all_vectors ... ok
test every_serialize_vector_snapshot_has_a_web_validity_vector ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.20s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test multiple_layers_stack_additively_per_resource ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/road_movement_multipliers.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/road_movement_multipliers-10cca6a7ed28e576)

running 3 tests
test road_divisors_are_integers_read_from_the_table ... ok
test road_movement_table_covers_each_constant_once ... ok
test road_floor_row_is_readable_and_positive ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test canonical_state_round_trips_through_serde ... ok
test city_rejects_empty_names_and_zero_population ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/structure_defense_max.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/structure_defense_max-97cd066d284c179b)

running 3 tests
test combined_structures_equal_the_strongest_single_structure ... ok
test structures_are_ignored_outside_siege ... ok
test no_structure_gives_neutral_multiplier ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test trade_routes_do_not_cross_tundra ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test owners_land_border_ignores_tundra_neighbour ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diff_and_serialization_preserve_route_contract ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test pure_preview_does_not_mutate_input_balances ... ok
test flow_helpers_are_deterministic_and_saturating ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test settlement_credits_income_before_paying_expenses ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_6c1214b7-ef6-3/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 6 tests
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test p6_1_civ_entry_api_is_exercised ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test current_and_previous_epochs_are_available ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### 12.4 `git diff --check` (`gate-diffcheck-r2.log`)

```text
$ git diff --cached --check   (indeks po jawnym git add plikow tematu; wynik bez wyjscia = czysto)
EXIT=0
```

### 12.5 Odtwarzalnosc wektorow i `sha256sum -c` (`dowody/gen-reproducible-r2.txt`, `dowody/sha256sum-check-r2.txt`)

```text
# web pin: git archive edb8fb56 gra/src gra/data -> /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/web-r2 (poza repo)
gen EXIT=0
params.json IDENTYCZNY z zatwierdzonym
tempo_stawki.json IDENTYCZNY z zatwierdzonym
growth.json IDENTYCZNY z zatwierdzonym
empire.json IDENTYCZNY z zatwierdzonym
post_central.json IDENTYCZNY z zatwierdzonym
manpower.json IDENTYCZNY z zatwierdzonym
edge.json IDENTYCZNY z zatwierdzonym
SHA256SUMS.txt IDENTYCZNY
```

```text
params.json: OK
tempo_stawki.json: OK
growth.json: OK
empire.json: OK
post_central.json: OK
manpower.json: OK
edge.json: OK
sha256sum -c EXIT=0
```

### 12.6 Weryfikator Python (`verify-p67a-r2.log`) i test negatywny weryfikatora (`dowody/verify-negative-verifier-r2.txt`)

```text
SEKCJE: {"advance": 2589, "balance": 110, "build": 62, "cityLevel": 114, "diffMult": 4, "ensure": 122, "era": 142, "fractional": 900, "gain": 300, "happiness": 59, "hunger": 700, "magazynEra": 14, "manpower": 300, "matrix": 118, "matrixSynth": 1449, "maxSafe": 70, "params": 3, "percent": 700, "plan": 110, "popCap": 180, "postCentral": 720, "raise": 130, "ration": 1351, "rationCost": 400, "recompute": 60, "runtimeClear": 834, "runtimeInject": 1114, "simulate": 1150, "spichlerz": 18, "stawki": 405, "tempo": 427, "turns": 300}
PORUWNAN: 14955
ROZBIEZNOSCI: 0
EXIT=0
```

```text
zepsuto: matrixSynth 1 injected 1 afterClear 1 raiseFlow 1
SEKCJE: {"advance": 2589, "balance": 110, "build": 62, "cityLevel": 114, "diffMult": 4, "ensure": 122, "era": 142, "fractional": 900, "gain": 300, "happiness": 59, "hunger": 700, "magazynEra": 14, "manpower": 300, "matrix": 118, "matrixSynth": 1449, "maxSafe": 70, "params": 3, "percent": 700, "plan": 110, "popCap": 180, "postCentral": 720, "raise": 130, "ration": 1351, "rationCost": 400, "recompute": 60, "runtimeClear": 834, "runtimeInject": 1114, "simulate": 1150, "spichlerz": 18, "stawki": 405, "tempo": 427, "turns": 300}
PORUWNAN: 14955
ROZBIEZNOSCI: 4
FAIL matrixSynth 1.16
  python: {"hungerLossMultiplier": 0.0, "healthGrowthMultiplier": 1.0, "happinessBase": 0.0, "populationCapDelta": 0.0}
  web   : {"hungerLossMultiplier": 1.0, "healthGrowthMultiplier": 1.0, "happinessBase": 0.0, "populationCapDelta": 0.0}
FAIL runtimeClear maxCap100.0
  python: 0.0
  web   : 7.0
FAIL runtimeInject hungry100.-1
  python: false
  web   : true
FAIL raise 70
  python: {"result": {"adjusted": false, "changes": []}, "citiesAfter": [{"id": "c0", "poziomRacji": 4.0, "wzrostUlamkowy": 0.895, "hungerLossUlamkowy": 1.14}, {"id": "c1", "poziomRacji": 0.5}, {"id": "c2", "poziomRacji": 0.0, "turyBezDoplaty": 2.0}, {"id": "c3", "poziomRacji": 3.5, "rationMigratedV114": true
  web   : {"result": {"adjusted": false, "changes": []}, "citiesAfter": [{"id": "c0", "poziomRacji": 99.0, "wzrostUlamkowy": 0.895, "hungerLossUlamkowy": 1.14}, {"id": "c1", "poziomRacji": 0.5}, {"id": "c2", "poziomRacji": 0.0, "turyBezDoplaty": 2.0}, {"id": "c3", "poziomRacji": 3.5, "rationMigratedV114": tru
EXIT=1 (oczekiwane 1: zepsute 4 wektory - matrixSynth, injected, afterClear, raiseFlow - wykryte jako rozbieznosci)
```

### 12.7 Wektory syntetyczne, PORTOWANY bez testu, brak wartosci balansu jako literalow (`dowody/synthetic-vectors-r2.txt`, `dowody/portowany-bez-testu-r2.txt`, `dowody/verify-negative-r2.txt`)

```text
patche 40 przypadki 724 z klamra=0 236
postCentralSiege 40
tiki oblegany 123
advance (edge): 40 z injected: 40 z accessorsAfterClear: 40
raiseFlow 60 planFlow 40 balanceFlow 40
```

```text
wierszy PORTOWANY z kolumna test '-': 0
```

```text
wartosci balansu w tabelach (bez 0, 1, -1): 26
literaly liczbowe w kodzie p6_7a (unikalne): [0.0, 1e-09, 1.0, 19.0, 21.0, 28.0]
wartosci z tabel, ktore sa tez literalem w kodzie: []
EXIT=0
```

### 12.8 Literaly liczbowe i napisowe w nowych modulach (`dowody/grep-literals-r2.txt`)

```text
# Literaly liczbowe i napisowe w module P6.7A (city_growth.rs::p6_7a, derived.rs); komentarze pominiete
## src/domain/city_growth.rs od linii 537
557: nums=['1e-9'] strs=[] | const FOOD_EPSILON: f64 = 1e-9;
599: nums=[] strs=['wysoki'] | "wysoki" => Some(Self::Wysoki),
600: nums=[] strs=['normalny'] | "normalny" => Some(Self::Normalny),
601: nums=[] strs=['wolny'] | "wolny" => Some(Self::Wolny),
608: nums=[] strs=['wysoki'] | Self::Wysoki => "wysoki",
609: nums=[] strs=['normalny'] | Self::Normalny => "normalny",
610: nums=[] strs=['wolny'] | Self::Wolny => "wolny",
659: nums=['0.0'] strs=[] | 0.0
690: nums=['19'] strs=[] | const HANGUL_L_COUNT: u32 = 19;
691: nums=['21'] strs=[] | const HANGUL_V_COUNT: u32 = 21;
692: nums=['28'] strs=[] | const HANGUL_T_COUNT: u32 = 28;
709: nums=[] strs=['hangul L'] | out.push(char::from_u32(l).expect("hangul L"));
710: nums=[] strs=['hangul V'] | out.push(char::from_u32(v).expect("hangul V"));
712: nums=[] strs=['hangul T'] | out.push(char::from_u32(t).expect("hangul T"));
770: nums=['0.0'] strs=[] | if v.is_finite() && *v > 0.0 {
780: nums=['0.0'] strs=[] | if !base.is_finite() || base <= 0.0 {
781: nums=['0.0'] strs=[] | return 0.0;
788: nums=['0.0'] strs=[] | if !koszt_budowy.is_finite() || koszt_budowy <= 0.0 {
789: nums=['0.0'] strs=[] | return 0.0;
866: nums=[] strs=['econ-params.json'] | let econ = ECON.get_or_init(|| parse_econ_params().expect("econ-params.json"));
908: nums=['0.0'] strs=[] | 0.0
928: nums=[] strs=['lud_limit_populacji'] | Some(k) => civ_matrix_param(matrix, k, "lud_limit_populacji"),
929: nums=['0.0'] strs=[] | None => 0.0,
934: nums=['0.0'] strs=[] | 0.0
969: nums=['1.0'] strs=[] | js_math_round((wyzywienie_max() - wyzywienie_min()) / wyzywienie_step()) + 1.0;
970: nums=['0.0'] strs=[] | let n = if length.is_finite() && length > 0.0 {
973: nums=['0'] strs=[] | 0
975: nums=['0'] strs=[] | (0..n)
1008: nums=['0.0'] strs=[] | 0.0
1027: nums=['1.0'] strs=[] | hunger_loss_multiplier: 1.0,
1028: nums=['1.0'] strs=[] | health_growth_multiplier: 1.0,
1029: nums=['0.0'] strs=[] | happiness_base: 0.0,
1030: nums=['0.0'] strs=[] | population_cap_delta: 0.0,
1033: nums=[] strs=['lud_spadek_proc'] | let hunger_proc = civ_matrix_param(matrix, key, "lud_spadek_proc");
1034: nums=[] strs=['lud_zdrowie_proc'] | let health_proc = civ_matrix_param(matrix, key, "lud_zdrowie_proc");
1035: nums=[] strs=['lud_zadowolenie_bazowe'] | let happiness = civ_matrix_param(matrix, key, "lud_zadowolenie_bazowe");
1037: nums=['0.0', '1.0'] strs=[] | hunger_loss_multiplier: js_max(0.0, 1.0 + finite_or_zero(hunger_proc)),
1038: nums=['0.0', '1.0'] strs=[] | health_growth_multiplier: js_max(0.0, 1.0 + finite_or_zero(health_proc)),
1068: nums=[] strs=['ekonomia_miasta'] | match raw.get("ekonomia_miasta") {
1079: nums=['0'] strs=['racje_zywnosc_1'] | racje_zywnosc_1: pick(section.get("racje_zywnosc_1"), d, t.zywnosc[0]),
1080: nums=['1'] strs=['racje_zywnosc_2'] | racje_zywnosc_2: pick(section.get("racje_zywnosc_2"), d, t.zywnosc[1]),
1081: nums=['2'] strs=['racje_zywnosc_3'] | racje_zywnosc_3: pick(section.get("racje_zywnosc_3"), d, t.zywnosc[2]),
1082: nums=['0'] strs=['racje_wzrost_proc_1'] | racje_wzrost_proc_1: pick(section.get("racje_wzrost_proc_1"), d, t.wzrost_proc[0]),
1083: nums=['1'] strs=['racje_wzrost_proc_2'] | racje_wzrost_proc_2: pick(section.get("racje_wzrost_proc_2"), d, t.wzrost_proc[1]),
1084: nums=['2'] strs=['racje_wzrost_proc_3'] | racje_wzrost_proc_3: pick(section.get("racje_wzrost_proc_3"), d, t.wzrost_proc[2]),
1122: nums=[] strs=['racje.json must parse'] | ROWS.get_or_init(|| parse_racje().expect("racje.json must parse").wiersze)
1145: nums=['0.0'] strs=[] | 0.0
1154: nums=['1', '1'] strs=[','] | js_to_fixed(v, 1).replacen('.', ",", 1)
1164: nums=['0.0'] strs=[] | let base = js_max(0.0, population) * ration_food_cost_per_pop(level);
1165: nums=['1.0'] strs=[] | let mult = spichlerz_state.map_or(1.0, spichlerz_ration_food_cost_multiplier);
1202: nums=['0.0'] strs=[] | let male_miasto = js_max(0.0, s.male_miasto_prog - input.population);
1207: nums=['0.0'] strs=[] | let zdrowie_bazowe = (js_max(0.0, input.zdrowie) / s.zdrowie_na_punkt).floor();
1209: nums=['0.0'] strs=[] | let szczescie = (js_max(0.0, input.szczescie_netto) / s.szczescie_na_punkt).floor();
1211: nums=[] strs=['lud_wzrost_proc'] | Some(k) => civ_matrix_param(&load_civ_matrix().file, k, "lud_wzrost_proc"),
1212: nums=['0.0'] strs=[] | None => 0.0,
1216: nums=['0.0'] strs=[] | let zaopatrzenie = input.citizen_resource_growth_pct.unwrap_or(0.0);
1253: nums=['0.0'] strs=[] | let mut frac = wzrost_ulamkowy.unwrap_or(0.0);
1258: nums=['0.0', '0.0'] strs=[] | if fed && growth_pct != 0.0 && pop > 0.0 {
1265: nums=['0.0'] strs=[] | if growth_pct > 0.0 && pop < pop_cap {
1267: nums=['1.0'] strs=[] | while frac >= 1.0 && pop < pop_cap {
1268: nums=['1.0'] strs=[] | pop += 1.0;
1269: nums=['1.0'] strs=[] | frac -= 1.0;
1272: nums=['0.0', '1.0'] strs=[] | } else if growth_pct < 0.0 && pop > 1.0 {
1274: nums=['1.0', '1.0'] strs=[] | while frac >= 1.0 && pop > 1.0 {
1275: nums=['1.0'] strs=[] | pop -= 1.0;
1276: nums=['1.0'] strs=[] | frac -= 1.0;
1297: nums=['0.0', '0.0'] strs=[] | if !fed || growth_pct == 0.0 || population <= 0.0 {
1298: nums=['0.0'] strs=[] | return 0.0;
1300: nums=['0.0'] strs=[] | if growth_pct > 0.0 && at_pop_cap {
1301: nums=['0.0'] strs=[] | return 0.0;
1311: nums=['0.0'] strs=[] | if gain_per_turn <= 0.0 {
1314: nums=['0.0'] strs=[] | let frac = wzrost_ulamkowy.unwrap_or(0.0);
1315: nums=['1.0'] strs=[] | if frac >= 1.0 {
1316: nums=['0.0'] strs=[] | return Some(0.0);
1318: nums=['1.0'] strs=[] | Some(((1.0 - frac) / gain_per_turn).ceil())
1341: nums=['0.0'] strs=[] | tury_bez_doplaty: 0.0,
1343: nums=['0.0'] strs=[] | hunger_loss_ulamkowy: 0.0,
1346: nums=['0.0', '1.0'] strs=[] | let next_tury = tury_bez_doplaty.unwrap_or(0.0) + 1.0;
1349: nums=['0.0'] strs=[] | js_max(0.0, hunger_loss_ulamkowy)
1351: nums=['0.0'] strs=[] | 0.0
1354: nums=['0.0'] strs=[] | js_max(0.0, hunger_loss_multiplier)
1356: nums=['1.0'] strs=[] | 1.0
1359: nums=['1.0', '1.0'] strs=[] | while debt >= 1.0 && pop > 1.0 {
1360: nums=['1.0'] strs=[] | pop -= 1.0;
1361: nums=['1.0'] strs=[] | debt -= 1.0;
1366: nums=['0.0'] strs=[] | tury_bez_doplaty: if ubytek { 0.0 } else { next_tury },
1417: nums=['0.0'] strs=[] | c.wzrost_ulamkowy = Some(0.0);
1420: nums=['0.0'] strs=[] | c.tury_bez_doplaty = Some(0.0);
1423: nums=['0.0'] strs=[] | gc.hunger_loss_ulamkowy = Some(0.0);
1471: nums=['0'] strs=[] | for row_index in 0..owner_tick.per_city_rows.len() {
1517: nums=['0.0'] strs=[] | .unwrap_or(0.0);
1522: nums=['0.0'] strs=[] | .unwrap_or(0.0);
1536: nums=['1.0'] strs=[] | .map_or(1.0, |w| w.poziom);
1563: nums=['0.0'] strs=[] | cities[city_index].hunger_loss_ulamkowy.unwrap_or(0.0),
1572: nums=['0.0'] strs=[] | if fed { breakdown.total } else { 0.0 },
1605: nums=['1.0'] strs=[] | .unwrap_or(1.0);
1630: nums=['1.0'] strs=[] | econ.growth += 1.0;
1633: nums=['1.0'] strs=[] | econ.starved += 1.0;
1733: nums=['0.0', '0.0'] strs=[] | js_max(0.0, tick.zywnosc_netto + tick.koszt_racji.unwrap_or(0.0))
1841: nums=[] strs=['globalne'] | let gl = match raw.get("globalne") {
1847: nums=[] strs=['magazyn_centralny_baza_zywnosc'] | nn(gl.get("magazyn_centralny_baza_zywnosc"))
1848: nums=[] strs=['magazyn_centralny_baza_zywnosc'] | .or(em.get("magazyn_centralny_baza_zywnosc")),
1853: nums=[] strs=['magazyn_centralny_bonus_zywnosc_na_budynek'] | nn(gl.get("magazyn_centralny_bonus_zywnosc_na_budynek"))
1854: nums=[] strs=['magazyn_centralny_bonus_zywnosc_na_budynek'] | .or(em.get("magazyn_centralny_bonus_zywnosc_na_budynek")),
1858: nums=[] strs=['glod_wojska_hp_frac'] | glod_wojska_hp_frac: pick(em.get("glod_wojska_hp_frac"), d, t.glod_hp_frac),
1860: nums=[] strs=['glod_wojska_karencja_tur'] | em.get("glod_wojska_karencja_tur"),
1864: nums=[] strs=['glod_wojska_stat_mult'] | glod_wojska_stat_mult: pick(em.get("glod_wojska_stat_mult"), d, t.glod_stat_mult),
1872: nums=['0.0'] strs=[] | zapasy_panstwa: 0.0,
1874: nums=['0.0'] strs=[] | tury_ujemnych_zapasow: Some(0.0),
1943: nums=['0.0'] strs=[] | states.get(owner_id).map_or(0.0, |s| s.zapasy_panstwa)
1948: nums=['0.0'] strs=[] | self.max_cap_by_owner.get(&owner_id).copied().unwrap_or(0.0)
1981: nums=['1.0'] strs=[] | Some(js_max(1.0, karencja_tur - t.tury_ujemnych_zapasow_po))
2008: nums=['0.0'] strs=[] | js_min(percent_whole(), js_max(0.0, n))
2029: nums=['0.0'] strs=[] | let mut sum = 0.0;
2059: nums=['0.0', '1.0'] strs=[] | *out.entry(tick.owner_id).or_insert(0.0) += 1.0;
2074: nums=['0.0'] strs=[] | let mut spichlerz_cap = 0.0;
2130: nums=['0.0'] strs=[] | let zapasy_przed = states.get(owner_id).map_or(0.0, |s| s.zapasy_panstwa);
2132: nums=['0.0'] strs=[] | let mut uprawa_hodowla = 0.0;
2133: nums=['0.0'] strs=[] | let mut wyzywienie_ludnosci = 0.0;
2134: nums=['0.0'] strs=[] | let mut pomoc_miastom = 0.0;
2145: nums=['0.0', '0.0'] strs=[] | js_max(0.0, tick.zywnosc_netto + tick.koszt_racji.unwrap_or(0.0))
2147: nums=['0.0'] strs=[] | let koszt_racji = tick.koszt_racji.unwrap_or(0.0);
2158: nums=['0.0'] strs=[] | wzrost_procent: tick.wzrost_procent.unwrap_or(0.0),
2163: nums=['0.0'] strs=[] | if bilans >= 0.0 {
2172: nums=['0.0'] strs=[] | let covered = js_min(*need, js_max(0.0, central));
2187: nums=['1.0'] strs=[] | let owner_era = resolve_owner_era.map_or(1.0, |f| f(owner_id));
2194: nums=['0.0'] strs=[] | .unwrap_or(0.0),
2201: nums=['0.0'] strs=[] | let glod_wojska = central < 0.0;
2202: nums=['0.0'] strs=[] | central = js_max(0.0, central);
2207: nums=[] strs=['stan wlasciciela'] | let st = states.get_mut(owner_id).expect("stan wlasciciela");
2209: nums=['0.0'] strs=[] | let tury_przed = st.tury_ujemnych_zapasow.unwrap_or(0.0);
2210: nums=['1.0', '0.0'] strs=[] | let tury_po = if glod_wojska { tury_przed + 1.0 } else { 0.0 };
2230: nums=['0.0'] strs=[] | do_rozwoju: 0.0,
2259: nums=['1', '0'] strs=[] | pub const DEFAULT_HUMAN_OWNER_IDS: [i64; 1] = [0];
2299: nums=['0.0'] strs=[] | let mut uprawa = 0.0;
2300: nums=['0.0'] strs=[] | let mut koszt = 0.0;
2305: nums=['0.0'] strs=[] | let produkcja = tick.zywnosc_brutto.unwrap_or(0.0);
2306: nums=['0.0'] strs=[] | let koszt_racji = tick.koszt_racji.unwrap_or(0.0);
2325: nums=['0.0'] strs=[] | let produkcja = tick.zywnosc_brutto.unwrap_or(0.0);
2326: nums=['0.0'] strs=[] | let koszt = tick.koszt_racji.unwrap_or(0.0);
2328: nums=['0.0'] strs=[] | if bilans >= 0.0 {
2335: nums=['0.0'] strs=[] | let covered = js_min(need, js_max(0.0, central));
2353: nums=['0.0'] strs=[] | let produkcja = tick.zywnosc_brutto.unwrap_or(0.0);
2354: nums=['0.0'] strs=[] | let koszt = tick.koszt_racji.unwrap_or(0.0);
2356: nums=['0.0'] strs=[] | if bilans >= 0.0 {
2363: nums=['0.0'] strs=[] | let covered = js_min(need, js_max(0.0, central));
2376: nums=['0.0'] strs=[] | .find(|l| ration_growth_percent(*l) >= 0.0)
2409: nums=['0.0'] strs=[] | >= 0.0
2421: nums=['0.0'] strs=[] | return compute_empire_city_food_nadwyzka(per_city, owner_id) - koszt_armii >= 0.0;
2491: nums=['0'] strs=[] | for i in (0..levels.len()).rev() {
2518: nums=[] strs=['poziom poczatkowy'] | .expect("poziom poczatkowy");
2674: nums=['0.0'] strs=[] | if nadwyzka <= 0.0 {
2677: nums=['0.0', '0.0'] strs=[] | } else if nadwyzka <= 0.0 && opts.zapasy_przed <= 0.0 {
2772: nums=[] strs=['poziom poczatkowy'] | .expect("poziom poczatkowy"),
2797: nums=['0.0'] strs=[] | if pool >= 0.0 && all_fed && target_met {
2807: nums=[] strs=['poziom poczatkowy'] | .expect("poziom poczatkowy");
## src/data/derived.rs od linii 3825
3831: nums=[] strs=['../../data/derived/wzrost-ludnosci-params.json'] | include_str!("../../data/derived/wzrost-ludnosci-params.json");
3832: nums=[] strs=['../../data/derived/era-diakrytyki.json'] | pub const ERA_DIAKRYTYKI_JSON: &str = include_str!("../../data/derived/era-diakrytyki.json");
3915: nums=['3'] strs=[] | pub zywnosc: [f64; 3],
3916: nums=['3'] strs=[] | pub wzrost_proc: [f64; 3],
4011: nums=[] strs=['wzrost-ludnosci-params.json must parse'] | parse_wzrost_ludnosci_params().expect("wzrost-ludnosci-params.json must parse")
4032: nums=[] strs=['era-diakrytyki.json must parse'] | .expect("era-diakrytyki.json must parse")
# linii z literalami: 162
EXIT=0
```
