# 02a — Obrona Operatora (runda 1) — R-RUSTPORT-P6-K5I2B2-DLUG-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5I2B2-DLUG-Q1
GOAL: obrona zarzutow Evaluatora (05b4c1d07) wobec kodu 5db45c9e5 (raport 01-operator-r1.md, c34745545)
ZMIANY/COMMIT: poprawka a1dae7d38 (straznik CTN w envDigest, assert procarza >= 100); baza 237e54526; Cargo.lock nie commitowany, usuniety.
TESTY (po poprawce, CARGO_TARGET_DIR poza repo): cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; p6_siege_tactics_blow_env 3 passed; p6_unit_power_maxnan 2 passed; p6_siege_tactics_blow_full 3 passed. NIE_ZMIERZONO w tej rundzie: cargo test --lib (kodu src/ nie zmieniano, tylko tests/).
BLOKADY: brak blokad technicznych. Pozycje odlozone jako dlug: patrz tabela ponizej.

## Odpowiedzi na zarzuty

1. Straznik SHA-256 nie obejmuje CTN_SRC/CTN_BODY — PRZYJMUJE. Poprawka: envDigest (p6_siege_tactics_blow_env_gen.mjs) dolicza `ctnSrc`/`ctnBody` (teksty COMBAT_NAME i combatTerrainName z pinu). Dowod: sam dodatek fragmentow zmienil sume z c2ef94c5... na 8a9afb55... bez innej zmiany, czyli wejscie jest haszowane. Stala ENV_FRAGMENT_SHA256 (gen.mjs i p6_siege_tactics_blow_env.rs) ustawiona na 8a9afb5582c2edad3e6f8e1500f679c63223d37285b579b7ac7fd226041cc7e1. Commit a1dae7d38.

2. Wymog >= 100 procarzy nie zasertowany w tescie Rust — PRZYJMUJE. Poprawka: `assert!(cov.slinger_ranged >= 100)` po istniejacych sprawdzeniach. Stan obecny: slinger_ranged = 136 (przechodzi). Commit a1dae7d38.
   Licznikow -0 nie dodano — DLUG (patrz tabela). NaN/Inf w murze (nan_case=106, inf_case=187) byly juz w liscie `checks` z `n > 0`. Pokrycie -0 w wektorach: 2406 wystapien "-0" (zmierzone przez Evaluatora), nie jest asertowane.

3. Wektory env wygenerowane od nowa, "istniejace wektory bez zmian" — PRZYJMUJE jako odchylenie od dispatchu, bez naprawy w tej rundzie.
   - Odchylenie: losowania PRNG sie zmienily (wstrzykniecie NaN/Inf i nowe pola), wiec przypadki nie sa bajt-w-bajt te same co w 237e54526. NIE_ZMIERZONO: porownanie przypadek po przypadku ze starym plikiem. Zgodnosc z pinem 1200/1200 jest zmierzona.
   - Lucznik dystansowy 14 -> 2: PRZYJMUJE jako regres pokrycia (prog > 0 spelniony). Naprawa wymaga zmiany wag losowania w generatorze, czyli kolejnej regeneracji. DLUG.
   - Pusta nazwa kafla '' — ODRZUCAM jako regres. Dowod: pin battle-terrain.ts:802-806 zwraca `COMBAT_NAME[t] ?? 'Plaskie (rownina/laka)'`, a COMBAT_NAME (150-158) zawiera tylko niepuste nazwy, wiec pin nie moze zwrocic ''. Stara '' pochodzila z testowej mapy nazw, ktora dispatch kazal zastapic tekstem pinu.

4. isMountain trafia do wektora, ale test Rust go nie czyta — ODRZUCAM jako blokade. Dowod: w pinie isMountain zmienia wynik nazwy (battle-terrain.ts:804: `if (t === BTerrain.Hills && preset.isMountain) return 'Gory';`). Rust czyta nazwy z wektora (p6_siege_tactics_blow_env.rs:192, pole `names`), a wektory zawieraja nazwy wyprodukowane tekstem pinu (1277 wystapien "Gory" w vectors.json). Efekt isMountain jest wiec obecny jako wejscie Rust; sam bool nie jest potrzebny. Rust nie ma wlasnej combat_terrain_name, zgodnie z dispatchem nazwy sa wejsciem.

5. NaN/Inf w danych terenu (napisy "Bonus Obrona") — ODRZUCAM jako zarzut do naprawy w tej rundzie. Dowod: gra/data/terrain-combat.json (pin 07d2fbd72) zawiera 0 wystapien "nan"/"infinity" (grep bez rozroznienia wielkosci liter); JSON nie ma reprezentacji NaN, a napisy sa etykietami. NaN/Inf sa wstrzykiwane w wejsciach terenu przyjmowanych przez pin jako liczby: mnozniki (terrainDefenseMultiplier / terrainRiverAttackMultiplier), wallTotal, wallCiv, diffA/diffD, ctr. NIE_ZMIERZONE pozostaje: parse NaN z tekstu danych (brak takiego wpisu w pliku).

6. Wspolna siege_tactics_blow::js_max bez wariantu znaku zera — ODRZUCAM jako poza zakresem. Dowod: dispatch (pkt 4) ogranicza zmiane do unit_power.rs i siege_tactics_blow_full.rs; siege_tactics_blow.rs (js_max l.180) NIE jest w allowliscie. W allowlistowanych plikach wywolania ida przez js_max_sign/js_min_sign (siege_tactics_inputs_pos.rs:27,42; unit_power.rs:17). Pozostale wywolania js_max ze zerem (inne moduly, np. auto_improvements.rs:229, civ_matrix.rs:45) sa poza zakresem. Proponowany osobny temat: ujednolicenie js_max/js_min ze znakiem zera w modulach domenowych.

7. Zarzuty nieblokujace (bramki, brak #[ignore], allowlista, regeneracja) — brak dzialania; potwierdzam, ze po poprawce bramki pozostaja zielone (patrz TESTY).

## Dlug (nie blokuje; do FC lub osobnego tematu)

| Pozycja | Stan | Proponowany krok |
|---|---|---|
| Licznik pokrycia -0 w tescie Rust | NIE_ZMIERZONO w tescie (2406 "-0" w wektorach) | dodac licznik i assert > 0 |
| Lucznik dystansowy 14 -> 2 | regres pokrycia, prog > 0 spelniony | zmiana wag losowania w gen.mjs, regeneracja |
| Stare wektory nie sa bajt-w-bajt te same | odchylenie od dispatchu | ewentualnie odtworzyc kolejnosc losowan |
| js_max (siege_tactics_blow.rs) bez znaku zera | poza allowlista | osobny temat |

## Wynik
NEXT: Evaluator (ponowna weryfikacja a1dae7d38) i Final Control. Deploy/push: NIE WYKONANO.
RUNDY: 1/5 (poprawka obrony w tej samej rundzie).
