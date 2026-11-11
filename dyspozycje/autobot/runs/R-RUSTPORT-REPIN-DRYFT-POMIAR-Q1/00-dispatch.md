# DISPATCH — R-RUSTPORT-REPIN-DRYFT-POMIAR-Q1 (pozycja 9 REJESTR-RUST, runda 1/5, Operator; DOKUMENTACJA, bez cargo)
Orkiestrator: czat RUST (gałąź `claude/rust-sivvrn`). Dispatch zapisany PRZED Workflow.

## Baza i pin
- Rust: `origin/rust-port/parity-v2` = `a4087f332`.
- Web (źródło prawdy, tylko odczyt): `origin/main` = `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (zapisz jako pin). Odczyt: `git archive 07d2fbd72f758705f8e1d59cc4968027ffbafe75 gra/src gra/data` do katalogu POZA repo. Nie modyfikuj gra/.

## Cel
Zmierzyć, które elementy dryfu web→Rust po czerwcu nadal nie są zgodne, i zapisać listę REPIN. Zakres i lista pozycji: `dyspozycje/rust-port/REPIN-DANE-20261029.md` (na parity-v2) oraz punkt D w planie:
1. Korupcja Pałac II/III + Trybunał;
2. odlewnie (web 50/75 od FALI 618);
3. handel kontaktowy + emporion w `TRADE_BUILDING_IDS`;
4. łodzie rybackie 6/6/6 (`terrain-improvements.json`);
5. `civBonusy` w zapisie;
6. dane dyplomacji: `przewagaMilitarna`/`pokojAiAi`, `progNapBezterminowyRelacja` (bez konsumenta), ekspansja graniczna Brąz −3 / Żelazo −4, `sisterAlliance`, `aiDiplomacyStance`.

## Kryteria końca (binarne)
1. Dla każdej z 6 pozycji: wartość web (plik:linia z pinu) i wartość Rust (plik:linia z parity-v2) w tabeli, status ZGODNE / DRYF / NIE_ZMIERZONO.
2. Każdy DRYF ma propozycję REPIN (co zmienić, w którym pliku Rust), bez wprowadzania zmian w kodzie.
3. Zero zmian w `rust-port/**` kodzie i w `gra/**`. Dozwolone: plik raportu w run dir i ewentualnie `dyspozycje/rust-port/REPIN-DRYFT-POMIAR-20261111.md`.
4. NIE_ZMIERZONO uczciwie tam, gdzie nie zmierzono.

## Allowlista (naruszenie = FAIL)
- `dyspozycje/rust-port/REPIN-DRYFT-POMIAR-20261111.md` (nowy)
- `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DRYFT-POMIAR-Q1/**`
- ZAKAZ: wszystko inne.

## Format raportu
STATUS / DOMAIN: PROCESS (dokumentacja) / TEMAT / GOAL / ZMIANY-COMMIT / TESTY: NIE_DOTYCZY (bez cargo) / BLOKADY / RUNDY: 1/5 / NASTĘPNY KROK: Evaluator / DEPLOY-PUSH: NIE WYKONANO. Raport `01-operator-r1.md`.
