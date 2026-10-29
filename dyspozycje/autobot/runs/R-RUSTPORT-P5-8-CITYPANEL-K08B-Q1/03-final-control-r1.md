STATUS: PASS-WITH-NOTES (partia 1/4 `rail`; temat NIE zamkniety, partie 2-4 i wiring pozostaja)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1
GOAL: Final Control partii rail (6 jednostek DOM) po obronie r1, kod 86a88b11 (baza 6daf5ed1).

ZARZUTY -> DECYZJA
1. Harness nie wykonuje pinu: ODDAL. 30 kotwic PIN-ANCHOR sprawdza literaly wektorow w cytowanych liniach pinu; bundle pinu = dlug jawny (P5-8-K08B.md §8), obowiazek partii 2.
2. Brak testow klik/hover paska Budynki: ODDAL (naprawione w 86a88b11: 87 porownan, +8 mutacji, 22 ZABITA). Galaz built != [] NIE_ZMIERZONO, jawnie.
3. scale-const EQUIV / dwie kopie scalePx: ODDAL. Zalozenie K08B-Z3: kanoniczna kopia K07A; K09 wiruje wylacznie getK07aScalePx.
4. Dowody niereprodukowalne: ODDAL (r2-logi/*.txt + 00-dispatch.md w repo). Drobiazg: pusta linia na koncu r2-logi/npm-run-typecheck.txt lamala git diff --check; obcieta w commicie Final Control.
5. Zakres 6/24: ODDAL (dispatch dopuszcza partie <=8; warunek zamkniecia w §8).
6. Zmiany w K05B/K07A/K08A (dopiski): ODDAL jako notatka integracyjna; sprawdzic konflikt z K07B w k07a-fundament.ts i gen-k07a-port.mjs.
Zero pozycji NAPRAW, zero DO DECYZJI CZLOWIEKA.

WERYFIKACJA WLASNA (detached 86a88b11, pin edb8fb56 przez git archive poza repo)
- diff 6daf5ed1..86a88b11: tylko allowlista (cityPanel, tools/dom-harness, PORTING-QUEUE.md, P5-8-K08B.md, runs/<ID>); zero gra/, .rs, package.json, WERSJE.md; src/ bez zmian wzgledem 82049d69.
- verify-k08b-copies --pin-dir: EXIT 0 (fails 0, ORPHAN 0)
- run-k08b-rail --pin-dir: EXIT 0, 87 porownan, 0 roznic
- mutate-k08b-rail --pin-dir: EXIT 0, 23 mutacje, 22 ZABITA, 1 EQUIV, 0 nieoczekiwanych
- npm ci 0; npm run check EXIT 0 (pin-copies 435, niezgodnych=0); npm run typecheck EXIT 0
- cargo fmt/clippy/test: nie uruchamiane (brak .rs w diffie; INFRA gdk-3.0 wg Operatora)

KOLEJNOSC: origin/rust-port/parity-v2 = 6daf5ed1 = merge-base; integracja to fast-forward/cherry-pick 82049d69, 4bba8f0a, 86a88b11, potem commit Final Control. Brak konfliktu z parity-v2; konflikt mozliwy tylko z rownoleglym K07B.
BLOKADY: partie 2-4 (18 jednostek, 1174 LOC); wiring (setK08aDeps, setK05bHost, setK06bDeps, getK07aScalePx); harness wykonujacy pin; przegladarka/CSS NIE_ZMIERZONO.
RUNDY: 3/5 (Final Control po r2 obrony)
NASTEPNY KROK: integracja orkiestratora partii 1, potem Operator partii 2 (appendSectionTitleWithDetails + karty buildTopBar*DetailCard).
DEPLOY/PUSH: NIE WYKONANO
