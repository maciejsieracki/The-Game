# REPIN-VECTORS-POSTMERGE (R-RUSTPORT-REPIN-VECTORS-POSTMERGE-Q1)

Baza: `d680c823e` (`origin/rust-port-wip/D4-merged`). Pin weba docelowy: `23dd158e9`. Poprzedni pin wektorow: `4bbef081d`.

## 1. Pomiar (przed zmiana)

Pelny `cargo test -j 2 --no-fail-fast` w 6 shardach (`runs/R-RUSTPORT-REPIN-VECTORS-POSTMERGE-Q1/logs/base-shard-*.txt`):
2097 passed / 1 failed. Jedyny padajacy: `p6_empirefood_e2e::empire_food_block_matches_running_web`
(`ef-0 city3 zdrowie: rust=11.0 web=8.0`, `p6_empirefood_e2e.rs:1274`). To JEDYNA rozbieznosc widoczna w testach.

Przyczyna: delta `4bbef081d..23dd158e9` w `turn-economy.ts` (`cityHasWaterAccess` -> `hasFreshwaterAccess`: jezioro daje
slodka wode) zmienia zdrowie miasta nad jeziorem; Rust (REPIN-DELTA-4, `domain/freshwater.rs`) ma to juz portowane,
wektory EMPIREFOOD/POST byly ze starego weba.

## 2. Regeneracja z URUCHOMIONEGO weba pinu 23dd158e9

Generatory (kopie z tematow zrodlowych, TYLKO podmieniony pin w `git rev-parse`): `runs/R-RUSTPORT-REPIN-VECTORS-POSTMERGE-Q1/tools/gen-*.mjs`
(`git archive 23dd158e9 gra/src gra/data` do katalogu tymczasowego, esbuild poza `gra/`, zero buildu w `gra/`).
Porownanie stary/nowy: `tools/cmp_vectors.py` (rekurencyjny diff JSON). Seedy/wejscia identyczne -> zmieniaja sie tylko wyjscia.
Order-lane: 2 fazy (zrzut econ ticku 1 Rust `P6_OL_ECON_OUT=... cargo test --test p6_order_lane -- --ignored`, potem faza 2 generatora).

| Wektor | Wejscia | Wyjscia vs stary pin | Decyzja |
|---|---|---|---|
| `p6_empirefood_vectors/empirefood.json` | identyczne (347 scen., mapy, matrixPatch) | ZMIENIONE w 234/347 scen.: `perCity[].zdrowie` (np. -6 -> -2, 3 -> 7) i `wzrostProcent` (1 -> 2, `~18.5` -> `~19.5`) | REGENEROWANY (zdrowie z jeziorem; wzrost zalezy od zdrowia) |
| `p6_econ_post_vectors/post_0.json` | identyczne (347 scen.) | ZMIENIONE w 234/347: `post/boundary/ticks[].zdrowie`, `ef[].rows[].wzrostProcent` | REGENEROWANY (ta sama przyczyna, wspolny stan wejsciowy) |
| `p6_order_lane_vectors/order_lane.json` | identyczne (750 scen., 80 e2e) | 0 roznic | pin podbity (regeneracja = bit-identyczne wyjscia); sciezka porzadku (`main.ts` petla porzadku) nietknieta delta (zdrowie nie wchodzi do `orderMultMap`) |
| `p6_state_src_vectors/state_src.json` | identyczne (260 scen.) | 0 roznic | pin podbity (dowod: regeneracja) |
| `p6_trade_pin_vectors/trade.json` | identyczne (62 scen.) | 0 roznic | pin podbity (trade-routes.ts nie w delcie) |
| `p6_heal_maxhp_vectors/maxhp.json` | identyczne (400 scen.) | 0 roznic (rozni sie tylko string `pin`) | pin podbity |
| `p6_adv_q6_vectors/q6.json` | - | juz z 23dd158e9 (REPIN-DELTA-4) | niezmieniony; poprawiony tylko naglowek `p6_adv_q6_wire.rs` |

Zadna asercja nie zostala oslabiona; zmieniono wylacznie pliki JSON wektorow i komentarz naglowka (linia 1) testow `*.rs`.

## 3. Wektory pinu 4bbef081d POZA allowlista (ocena, bez zmian)

Zrodlo delty (`git diff 4bbef081d 23dd158e9 --stat -- gra/src`): `turn-economy.ts` (zdrowie z jeziorem), `auto-improvements.ts`,
`ai.ts`, `ai-difficulty-bonus.ts` (`pickBonusCityHex`), `fort-territory.ts` (`fortSightSources`), `clusters.ts`, `freshwater.ts`, `visibility.ts`, `main.ts`.

| Test / wektor | Czy obejmuje sciezke delty | Ocena |
|---|---|---|
| `p6_m07b3_q3`, `p6_m07b4_q4` (rzeki) | nie (brak zmian w `map/rivers*`; wystapienia "water/pick" to teren morza i `pick_spread_river_sources`) | niedotkniete |
| `p6_repin_teren_domain` | nie (teren; delta nie dotyka danych terenu poza freshwater/polar mapgen) | niedotkniete |
| `p6_repin_wojna_3_hook` | nie (marsz generala) | niedotkniete |
| `p6_adv_city_econ_pipeline/heal`, `p6_adv_q2a_pipeline` | zasoby/leczenie/wejscia terenowe ticku; brak zdrowia/jeziora (0 wystapien health/water w testach) | niedotkniete (przechodza); NIE_ZMIERZONO regeneracja (poza allowlista) |
| `p6_repin_ekonomia_e_citizen/spichlerz`, `p6_turn_econ_res_pipeline` | stawki obywateli, spichlerz, pipeline zasobow; bez zdrowia | niedotkniete (przechodza); NIE_ZMIERZONO regeneracja (poza allowlista) |
| `p6_adv_q3..q5`, `p6_8i` | | juz zregenerowane w REPIN-DELTA-4 |

Ryzyko resztkowe: generatory dla wektorow z ostatnich pieciu wierszy nie zostaly uruchomione na pinie 23dd158e9 (poza allowlista);
ocena opiera sie na statycznej analizie sciezek i na tym, ze test pelny przechodzi.

## 4. Bramki po zmianie

Pelny `cargo test -j 2 --no-fail-fast` w 6 shardach: 2098 passed / 0 failed (`logs/gate-shard-*.txt`, kazdy `EXIT=0`),
`logs/gate-fmt.txt` EXIT=0, `logs/gate-clippy.txt` (`--all-targets -D warnings`) EXIT=0.
