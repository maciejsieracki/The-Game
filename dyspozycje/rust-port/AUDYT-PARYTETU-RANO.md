# AUDYT-PARYTETU-RANO — stan parytetu Rust vs pin po batchach 17–19

Temat: `R-RUSTPORT-P6-AUDYT-PARYTETU-Q1` (runda 1/5, Operator, HAIKU). Temat dokumentacyjny, bez `cargo`, bez zmian w kodzie.

- Baza odczytu: `358cb6cf6` (= `origin/rust-port/parity-v2` po INTEG-B18, FC `03-final-control.md`).
- Pin (tylko odczyt): `07d2fbd72` (ROBOCZA, `gra/` = web).
- Dowody (skrypty i surowe wyniki): `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUDYT-PARYTETU-Q1/dowody/`.
- Legenda: **NIE_ZMIERZONO** = brak danych lub pomiar niemożliwy grepem; każda liczba ma źródło (plik:linia, komenda, plik dowodu).

## 0. Ważne zastrzeżenia do źródeł

1. **`REJESTR-RUST.md` nie istnieje w repo** (`git ls-files | grep -i rejestr` nie zwraca pliku rust; `git grep REJESTR-RUST` trafia tylko w pliki runów). Numery z dispatchu „z REJESTR-RUST.md” zastąpiono numerami z listy zadań sesji (#NN) oraz tabelą `dyspozycje/rust-port/REPIN-DRYFT-POMIAR-20261111.md` §1. Numeracja rejestru NIE_ZMIERZONO. Numery #NN, statusy `pending` i przypisanie #96–#140 pochodzą z listy zadań sesji (poza repo, bez pliku:linia); stan opisany jest na chwilę pomiaru.
2. **Piny w testach nie są jednolite.** Wcześniejsze liczby (117/71/59/22/10) NIE odtworzyły się przy ponownym pomiarze i są wycofane. Pomiar (`git grep -l <hash> 613ab8af9 -- rust-port/engine/tests`, identycznie w bazie `358cb6cf6`; liczba plików `*.rs` zawierających hash):
   - `edb8fb56` — 192 pliki (commit istnieje: `git cat-file -t` → commit),
   - `07d2fbd7` (pin dispatchu) — 186 plików,
   - `91dc998a` — 120 plików (commit istnieje),
   - `4bbef081` — 40 plików, `dc8a3adc` — 18 plików.
   Suma 556 przy 460 plikach `.rs` oznacza, że część plików cytuje kilka hashy. Wystąpienia frazy `pin <hash>` w komentarzach: `edb8fb56` 71, `07d2fbd7` 67, `91dc998a` 31, `4bbef081` 4, `dc8a3adc` 3.
   Podział wektorów per moduł wg pinu: **NIE_ZMIERZONO** (nie zrobiono mapowania plik testu → moduł → pin). Skala rozbieżności danych między pinami (`git diff --stat 07d2fbd72 <pin> -- gra/`, ostatnia linia): `edb8fb56` 1085 plików, `91dc998a` 933, `4bbef081` 820, `dc8a3adc` 887. Zgodność wektorów z `edb8fb56`/`91dc998a` z pinem `07d2fbd72`: **NIE_ZMIERZONO**. Wniosek: sformułowanie „wektory z pinu 07d2fbd72” obejmuje tylko część wektorów.
3. Liczba „przypadków” w JSON to liczność tablic (`list` albo klucz-tablica w słowniku); nie jest to liczba przypadków testowych w sensie `#[test]`. Zob. `dowody/01-wektory-json-liczba-przypadkow.tsv`.

## 1. Moduły Rust z wektorami z pinu

Źródło: `dowody/01-testy-wektory-mapa.tsv` (446 wierszy: plik `.rs` → liczba `#[test]` → przypisane pliki JSON z liczbą elementów), `dowody/01-wektory-json-liczba-przypadkow.tsv` (367 plików JSON poza `fixtures/`), skrypty `dowody/skrypt-01-*.py`.

Zmierzone sumy (`grep -c '#\[test\]'` po `rust-port/engine/tests`, skrypt 01):

| Miara | Wartość | Źródło |
|---|---|---|
| Plików `.rs` w `rust-port/engine/tests` (bez `fixtures/`) | 460 | `find … -name '*.rs' \| wc -l` |
| Wystąpień `#[test]` | 3077 | `grep -c` po `tests/**/*.rs` |
| Plików z `#[test]` w mapie | 436 z 446 wierszy | `01-testy-wektory-mapa.tsv` |
| Plików z odwołaniem do JSON-wektorów | 320 wierszy | `01-testy-wektory-mapa.tsv` |
| Plików JSON wektorów (poza `fixtures/`) | 367 (53 słowniki bez tablicy) | `01-wektory-json-liczba-przypadkow.tsv` |
| Suma elementów tablic w JSON (orientacyjnie) | 827 921 | suma z `01-wektory-json…tsv` |

Podział na serie (pliki `.rs` / liczba `#[test]`, z `dowody/01-testy-wektory-mapa.tsv`, grupowanie po prefiksie nazwy):

| Seria | Pliki | `#[test]` |
|---|---|---|
| `p6_repin*` (w tym `p6_repin4`) | 70 | 496 |
| `p6_siege*` | 36 | 201 |
| `p6_wire*` | 20 | 183 |
| `p6_power*` | 9 | 67 |
| `p6_zapis*` | 11 | 56 |
| `p6_m*` (mapgen i pokrewne) | 95 | 566 |
| `p6_1…p6_8j` (rdzeń stanu, ekonomia, miasta, jednostki, ruch) | 92 | 750 |
| pozostałe serie `p6_*` (np. `adv`, `dyplo`, `unit`, `brake`) | 60 | 386 |
| pliki bez prefiksu `p6_` (`inne`) | 53 | 372 |
| **razem** | **446** | **3077** |

Pełna lista per plik: `dowody/01-testy-wektory-mapa.tsv`. Każdy wiersz: ścieżka pliku, liczba `#[test]`, pliki JSON z liczbą elementów.

**Pola `units.json` (zadanie #27, dispatch „units.json vs pin 71 pól”)** — pomiar skryptem `dowody/skrypt-03-units-porownanie.py`, wynik `dowody/03-units-porownanie.txt`: `gra/data/units.json` (pin `07d2fbd72`) vs `rust-port/engine/data/units.json` (baza `358cb6cf6`). 75 jednostek w obu, te same nazwy (`Jednostka`), te same 61 kluczy. **71 komórek** (jednostka × pole) różni się wartością, w **51 jednostkach**. Najczęściej: `Tech` 27, `Zastąp specjalnie` 21, `fieldPower` 9, `Top3` 3, `Epoka` 2, `Historia` 2, po jednym: `Obrona`, `Bonus vs Spearman %`, `meleeAttack`, `Przebicie`, `Atak`, `meleeDefence`, `piercing`. Dispatch „71 pól” zgadza się z liczbą komórek. Lista zadań („50 rozbieżności”) nie zgadza się z pomiarem (51 jednostek). Nie sprawdzono, czy różnice `Historia`/`Top3` (tekst) są merytoryczne (NIE_ZMIERZONO).

## 2. Moduły bez produkcyjnego wołającego

Metoda: `dowody/skrypt-02-wolajacy.py` — dla każdego modułu `src/domain/**` szukanie słowa-stemu w `rust-port/engine/src/**` i `benches/**` poza własnym plikiem; wynik `dowody/02-moduly-domain-wolajacy.tsv` (241 wierszy). Pełny tekst (bez obcinania po `#[cfg(test)]`, `dowody/02-moduly-domain-wolajacy-pelny-tekst.tsv`).

**Zero odwołań w całym `src/` i `benches/`** (poza własnym plikiem, bez testów), 33 moduły:

ai_era_unit_promotion, ai_move_range, ai_peace_city_offer, ai_war_march_plan, army_consolidation, army_follow_auto_merge, diplomacy_locks, diplomacy_rejection_cooldown, diplomacy_war_gates, economy_city_terrain, formation_rules, general_quick_follow, map_snapshot, rivers_c, rivers_d, rivers_e1, rivers_e2, siege_city_fortification, siege_engine_build, siege_nearby_lock, siege_tactics_autobatch, siege_tactics_blow_env, siege_tactics_breach, siege_tactics_class_adapters, siege_tactics_loop, trade_flow_apply, turn_economy_inputs_civ, turn_economy_inputs_native, turn_economy_post, turn_economy_preview, war_turn_forced, wonder_placement, work_tax.

Wszystkie 33 są przywoływane wyłącznie w `rust-port/engine/tests/` (`grep -rlw`, 1–5 plików każdy; `dowody/skrypt-02-testy-tylko.sh`). Czyli: **kod istnieje, produkcyjnie niepodpięty**. Zastrzeżenia:
- `battle_mode` — rozstrzygnięcie rozbieżności 33 vs 34. Wariant pełnotekstowy (`dowody/02-moduly-domain-wolajacy-pelny-tekst.tsv`, skrypt `dowody/skrypt-02-wolajacy-pelny-tekst.py`) daje 33 moduły bez wołającego: jedyne trafienie `battle_mode` to komentarz doc w `save_load.rs:287` (`battle_mode::restored_setting_version`), więc przy metodzie słowo-dopasowania moduł ma 1 trafienie i nie jest na liście 33. Wariant obcinany po pierwszym `#[cfg(test)]` (`dowody/02-moduly-domain-wolajacy.tsv`, skrypt `dowody/skrypt-02-wolajacy.py`) daje 34 zera, bo `save_load.rs` ma `#[cfg(test)]` już w linii 41, więc komentarz w linii 287 jest ucinany. Ten wariant ma ślepotę: każdy plik z wczesnym `#[cfg(test)]` ukrywa kod produkcyjny poniżej, więc jego zera są zawyżone. Wg znaczenia (wołanie, nie komentarz) `battle_mode` NIE ma wołającego w `src/`/`benches/`, więc liczba modułów bez produkcyjnego wołającego to **34** (33 + `battle_mode`). Lista 33 poniżej pochodzi z wariantu pełnotekstowego. Liczba 33 wobec 34 wynika z metody, nie z danych.
- `map_snapshot` jest na liście 33 (0 odwołań w `src/`), ma 5 plików testów. Funkcja `is_valid_map_snapshot` nie zawiera słowa-stemu w granicy słowa, więc nie zawyża wyniku.
- Glob re-exporty (`pub use x::*`) istnieją w `okolica.rs` i `society_breakdown.rs` (submoduły), nie dotyczą modułów z listy zerowej (sprawdzone `grep`).
- Wynik pomija wołania przez ścieżki bez słowa-stemu (niemożliwe w Rust poza glob re-export). Nie sprawdzono wołań z plików `build.rs` i `src/bin` (NIE_ZMIERZONO, jeśli istnieją; `ls rust-port/engine` pokazuje tylko `src`, `tests`, `benches`, `data`).

Wiązanie z zadaniami: wpięcie tych modułów to zadania #105 (AUDYT-LUK-B18), #119 (NIEPODPIETE-MODULY-INDEKS), #113/#115/#116 (siege/zdobycie), #114 (eliminacja), #120 (CRED-HAK-WYPOWIEDZENIE), #104 (ZLOZA-WIRING). Mapowanie modułów do zadań: NIE_ZMIERZONO (dispatch nie wskazuje wprost).

## 3. Otwarte pytania gameplay bez rozstrzygnięcia

Źródło dla pytań: lista zadań sesji (numery #NN, status `pending`, stan zmierzony w tym tygodniu) oraz `dyspozycje/rust-port/REPIN-DRYFT-POMIAR-20261111.md`. Brak odpowiedzi właściciela w repo (NIE_ZMIERZONO, czy pytania rozstrzygnięto poza repo).

| Pytanie | Numer | Stan | Źródło |
|---|---|---|---|
| SZTURM ODPARTY — nieosiągalna gałąź `_checkEnd` na pinie (parytet vs naprawa) | #60 | pending (decyzja rano) | lista zadań |
| W8 r7 Q1–Q4 — kolejność faz (dyplomacja AI, kapitulacja głodowa/szturm, wojna z hamulca, rebelia) | #63 | pending (decyzja rano) | lista zadań |
| 50 rozbieżności pól units.json vs pin 07d2fbd72 (balans) — zmierzone: 71 komórek / 51 jednostek | #27 | pending | lista zadań + pkt 1 |
| DYSTANS — faza zwarcia (`resolve_combat`) | #10 | pending | lista zadań |
| REPIN-DRYFT 1: korupcja Pałac II/III + Trybunał (30%) — pin 6 budynków, Rust 3 | #14 | pending | `REPIN-DRYFT-POMIAR…md` wiersz 1 (linia 24; linia 22 = nagłówek, 23 = separator) |
| REPIN-DRYFT 2: odlewnie 50/75 (epoka 2/3) | #15 | pending | wiersz 2 (linia 25) |
| REPIN-DRYFT 3: handel kontaktowy (3a `emporion` w `TRADE_BUILDING_IDS`, 3b wspólna granica) | #16 | pending | wiersz 3a/3b (linie 26–27) |
| REPIN-DRYFT 4: łodzie rybackie 6/6/6 vs 2/3/3 w `terrain-improvements.json` i `production_for` | #17 | pending | wiersz 4 (linia 28) |
| REPIN-DRYFT 5: civBonusy w zapisie (web nie zapisuje; Rust nie zapisuje) | #18 | pending | wiersz 5 (linia 29) |
| REPIN-DRYFT 6: dane dyplomacji (6a–6f: przewagaMilitarna, pokojAiAi, progNap 151 bez konsumenta, ekspansja graniczna, sisterAlliance bez portu, aiDiplomacyStance) | #19 | pending | wiersze 6a–6f (linie 30–35) |
| UNIT-REPLACE L-1: awanse INFANTRY 21/23 brak w Rust `units.json` | #20 | pending | lista zadań |

Uwaga: w `REPIN-DRYFT-POMIAR` pozycja 6c stwierdza, że `progNapBezterminowyRelacja` nie ma konsumenta po stronie Rust (`diplomacy.rs:259-261`, zgodnie z kodem); to nie jest rozstrzygnięcie gameplay.

## 4. Długi techniczne #96–#140 (przypisane do tematów)

Stan wszystkich pozycji #96–#140 wg listy zadań: **pending** (żadna nie jest `completed`). Przypisanie do tematów:

| Temat | Zadania |
|---|---|
| K5-LOOP (pętla oblężnicza, wieże, AUTO, wyłom, wznowienie) | #91, #96, #97, #98, #99, #118 |
| K5-LOOP-FACING / KONTRATAK / OUTCOME / DOCTRINA / WIRING / RUCH / BODY | #107, #108, #109, #112, #113, #121–#125, #128–#130 |
| TOWER-TARGET | #116 |
| COMBAT-HARNESS / COMBAT-RESOLVE (dystans) | #100, #131–#137, #140 |
| HARNESS-MUTACJE / test float | #138, #139 |
| CRED (wojna, wypowiedzenie) | #103, #120 |
| ZLOZA-WIRING | #104 |
| R7K7C-WIRING | #106 |
| ELIMINACJA-GRACZA | #114 |
| ZDOBYCIE-MIASTA-WIRING | #115 |
| Audyty i indeksy | #105, #117, #119 |
| Drobne (typy, znaki zera, NaN, enum) | #101, #102, #110, #111, #126, #127 |

Ten temat nie sprawdzał, które z tych zadań są już częściowo wpięte w kod (NIE_ZMIERZONO dla każdej pozycji osobno; dispatch wymaga tylko przypisania do tematów).

## 5. Tematy czekające na integrację (SHA FC)

Źródło: `git ls-remote origin 'refs/heads/rust-port-wip/*'` → 318 refów, z czego **124** to nazwy kończące się na `-fc` (metoda: `awk '$1 ~ /-fc$/'` na `dowody/05-wip-refs-origin.txt`; `-fc` w dowolnym miejscu nazwy daje 129, w tym 5 z `-fc-rN`; 318 wierszy, 312 unikalnych SHA) (`dowody/05-wip-refs-origin.txt`). Test „czy FC jest przodkiem bazy” (`git branch -r --merged 358cb6cf6`) oraz równoważność łat (`git cherry 358cb6cf6 <FC>`, skrypt `dowody/skrypt-05-cherry.sh`).

**20 gałęzi `*-fc` niebędących przodkiem bazy** (`dowody/05-fc-niescalone-wzgledem-bazy.txt`), z liczbą commitów bez odpowiednika łaty w bazie (`plus`):

| Gałąź FC | SHA (skrót) | plus |
|---|---|---|
| AIPEACE-V2-MIGRACJA-fc | 7c80b4854 | 2 |
| BORDER-WIRING-fc | 513385b20 | 3 |
| BRAKE-INPUTS-r1-fc | 369243fc5 | 1 |
| BRAKE-VECTORS-r1-fc | 17759ed5c | 3 |
| INTEG-B11-fc | 22f7178ef | 1 |
| INTEG-B12-fc | f94f47159 | 2 |
| INTEG-B13-fc | ee435eebe | 1 |
| INTEG-B14A-fc | 70bd9743d | 1 |
| INTEG-B14C-fc | 6131e2dad | 1 |
| POWER-SOURCES-INTEG-fc | 54d4b3e4f | 1 |
| SAVESNAPSHOT-DESER-r1-fc | 991819808 | 1852 |
| SAVESNAPSHOT-DESER-r2-fc | b3ea8badf | 2 (1 równoważny) |
| SIEGE-TRANSFER-Q3-r1-fc | 973ff73a5 | 1 |
| UNIT-REPLACE-L1-fc | a5790433d | 3 |
| UNIT-REPLACE-L1-r2-fc | 987c24944 | 5 |
| W8-r1-fc | 4c46ee7ab | 1869 |
| W8-r2-fc | 6a1056b96 | 3 |
| WAR-STATE-OWNER-fc | 7ed5ffcbc | 1 |
| rdyplo-r2-fc | 5aef0ebdf | 0 (2 równoważne) |
| rdyplo-r4-fc | 1a6a157bf | 0 (5 równoważnych) |

Interpretacja (uczciwie): ancestry nie jest dowodem integracji, a `plus` sam nie mówi, czy brakujący commit to kod, czy dokument FC; rozstrzyga to treść commitów opisana niżej. **Rozstrzygnięte (dowód `git cherry`):** dla tipów `INTEG-B11-fc` 22f7178ef, `INTEG-B12-fc` f94f47159, `INTEG-B13-fc` ee435eebe, `INTEG-B14A-fc` 70bd9743d, `INTEG-B14C-fc` 6131e2dad jedynymi commitami bez odpowiednika łaty w `358cb6cf6` (`+`) są commity dokumentów: `22f7178ef` (FC PASS-WITH-NOTES), `068092b25` (obrona 02a, dla B12), `f94f47159` (FC B12), `ee435eebe`, `70bd9743d`, `6131e2dad` (03-final-control.md). Kod tych integracji jest więc w bazie (odpowiedniki łat, `-`). Nie sprawdzono B14B (brak tipu w tabeli) i nie zweryfikowano, że każdy commit kodu z `*-fc` trafił do bazy: NIE_ZMIERZONO poza tymi pięcioma tipami. Przykładowe FC w bazie (ancestry): `eee18680c`, `9d4a2c17b`, `0fe9b3222`, `86223e037`, `fb7ac73d1`, `4b6595876`, `9164ab7d7` są przodkami `358cb6cf6`. `W8-r1-fc` (1869) i `SAVESNAPSHOT-DESER-r1-fc` (1852) mają inną linię historii; ich status integracji jest NIE_ZMIERZONO.

Wiązanie z listą zadań (zadania oczekujące na wpięcie/integrację w kolejnych batchach):
- #89 R7K7-B — FC PASS `da070d099` (wip `R-RUSTPORT-P6-R7K7B-Q1`), wg listy: integracja w B17 (zob. `INTEG-B17` w wip, ref `R-RUSTPORT-P6-INTEG-B17-Q1-ob`).
- #90 R7K7-C — FC PASS-WITH-NOTES `3d0716842` (wip `R-RUSTPORT-P6-R7K7C-Q1`), wg listy: w B18; wpięcie → #106 (pending).
- #95 TERYTORIUM-VEC — FC PASS `a5d93810a` (wip `R-RUSTPORT-P6-STAN-TERYTORIUM-VEC-Q1`), wg listy czeka na B19 (`parity-v2` = `237e54526` po B17).
- #94 CRED — FC PASS `9d4a2c17b` (wip `WIRE-WAR-CRED-fc`), wg listy: włączone w #84 (INTEG-B14C).
- #58 W8-INTEG — FC `9164ab7d7` (wip `WIRE-WAR-STORES-fc`), wg listy: zintegrowane.
- #66 L3-KOSZT — FC PASS `0fe9b3222` (wip `UNIT-REPLACE-L3-KOSZT-fc`), batch 14.

Ostatni znany SHA bazy: `358cb6cf6` (INTEG-B18 FC). Commity `parity-v2` po B18, jeśli istnieją: NIE_ZMIERZONO (nie sprawdzano `origin/rust-port/parity-v2` poza SHA bazy).

## 6. Co nie zostało zrobione (NIE_ZMIERZONO)

- Nie uruchamiano `cargo` (dispatch: temat dokumentacyjny).
- Nie porównywano wektorów `edb8fb56` / `91dc998a` z pinem `07d2fbd72` (pkt 0.2).
- Nie zweryfikowano, czy w `origin/main` są zmiany po `07d2fbd72`.
- Nie czytano `REJESTR-RUST.md` (nie istnieje w repo).
- Wpływ REPIN-DRYFT na wektory: NIE_ZMIERZONO.
