# 02a — Obrona Operatora, R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW
GOAL: producent nakladek tradeRoutes, workerFields, okolica (DTO z P4-1F1 bez zmian) + collectWorkedHexOwnerMap z epoka per wlasciciel
ZMIANY/COMMIT: kod bez zmian (kod Operatora 22d34d1b0, raport c1d829320); ten plik = jedyna zmiana obrony
TESTY: pelna bramka `cargo test --all-targets --no-fail-fast` na c1d829320 -> EXIT 0 (szczegoly w Z-3)
BLOKADY: brak blokujacych; dlugi przeniesione do P4-1G Q5 (#236/#269) i do tematu wpiecia producenta
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

Baza: `origin/rust-port/parity-v2` = 585bb48e0, pin 07d2fbd72. Wszystkie 4 zarzuty sa nieblokujace.

## Z-1 — `okolica.yields` dla kazdego heksa; web filtruje w rendererze — PRZYJMUJĘ (jako dlug P4-1G Q5, bez zmiany kodu)

Dowod z pinu: `git show 07d2fbd72:gra/src/render/cityOkolicaOverlay.ts` linie 283-296:
`if (t === TerenBazowy.Morze || t === TerenBazowy.Gory) continue;`, `if (key !== cityKey && hexHasCoveringTerrainImprovement(hex)) continue;`,
`if (parts.length === 0) continue;` — filtr siedzi w rendererze, nie w danych. Producent Rust (decyzja Z-1F4-3,
`01-operator-r1.md:58-59`) oddaje wpis dla kazdego heksa `collectRangeKeys`, czyli jest zgodny z warstwa danych webu.
Odtworzenie filtra w producencie zmieniloby kontrakt DTO z P4-1F1 (zakazane w dispatchu), a `renderer/` jest poza allowlista.
Dzialanie: do dispatchu P4-1G Q5 (#236/#269) dopisac wymaganie odtworzenia trzech filtrow (Morze/Gory, ulepszenie kryjace
poza heksem miasta, pusta etykieta) z `cityOkolicaOverlay.ts:283-296` + wektor testowy. Dopisek wykonuje orkiestrator
(dispatch innego tematu jest poza allowlista tego tematu).

## Z-2 — `workerFields`: web pomija Morze/Gory w rendererze — PRZYJMUJĘ (jako dlug P4-1G Q5, bez zmiany kodu)

Dowod z pinu: `git show 07d2fbd72:gra/src/render/workerFieldOverlay.ts` linie 138-145:
`if (t === TerenBazowy.Morze || t === TerenBazowy.Gory) continue;` w `buildWorkerFieldOverlayGroup`. Producent Rust
(`rust-port/engine/src/domain/overlays_view.rs:195` `worker_fields_view`, predykat `is_land_workable_hex` w l. 203)
filtruje tylko heksy spoza mapy; przy `isLandWorkableHex` wpisy Morze/Gory praktycznie nie powstaja, ale formalny filtr
nalezy do renderera. Dzialanie jak w Z-1: dopisac do dispatchu P4-1G Q5.

## Z-3 — brak odtworzenia pelnego `cargo test --all-targets` przez Evaluatora — PRZYJMUJĘ (uzupelnione pomiarem)

Wykonano na c1d829320 (`rust-port/engine`), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` w scratchpadzie poza repo (usuniety po bramce). `df -h /` przed bramka: 8,7 GB wolnego (>= 8 GB).

```
cargo test --all-targets --no-fail-fast  -> EXIT=0
494 zestawow: passed=3656 failed=0 ignored=1
view_overlays_trade_workers: 7 passed; 0 failed; 0 ignored
```

Jedyny `ignored` nie pochodzi z tego tematu: `git diff 585bb48e0 HEAD -- rust-port | grep -c '#\[ignore'` = 0.
Uwaga czasowa: `p6_8i_pick::pick_auto_improvements_matches_pinned_web_vectors` biegnie kilka minut (wolny, nie zawieszony;
konczy sie `ok`). Zgadzam sie z Evaluatorem, ze pelna bramke nalezy POWTORZYC przy integracji z P4-1F3
(konflikt `overlays_view.rs`/`mod.rs`) — ten pomiar dotyczy wylacznie galezi 1F4 na bazie 585bb48e0.

## Z-4 — brak wolajacego produkcyjnego — PRZYJMUJĘ jako znana luke poza zakresem (NIE_ZMIERZONO)

Dispatch (ZAKRES 1-4) obejmuje producenta i `collect_worked_hex_owner_map` z epoka per wlasciciel, nie wpiecie w petle
gry. Brak w stanie Rust: zrodla `&[City]` z polami okolicy (Z-1F4-2), listy tras (Z-1F4-1: web trzyma trasy jako
wejscie, nie w `PlayableState`), wezlow terytorium z fortami oraz `empireEpochForOwner`. Nie wpinam ich w tej rundzie
(poza allowlista: `playable.rs` tylko dla stanu tras, ktory celowo jest wejsciem wolajacego). Dzialanie dla orkiestratora:
osobny temat wpiecia producenta 1F4 (do indeksu niepodpietych modulow, #119), status NIE_ZMIERZONO do czasu wpiecia.

## Podsumowanie

4/4 zarzuty PRZYJĘTE: Z-1, Z-2, Z-4 jako dlugi do innych tematow (bez zmiany kodu, zgodnie z allowlista), Z-3 uzupelniony
pomiarem pelnej bramki (EXIT 0). Kod Operatora 22d34d1b0 bez zmian.
