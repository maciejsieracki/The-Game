STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-18-HOTSEAT-MATRIX-Q1
GOAL: Macierz hot-seat web→Rust→scenariusz akceptacyjny, na obecnym pinie (nie archiwalnym).
RUNDY: 1/5 (4 zarzuty o nieścisłych cytatach linii — nie o błędne stwierdzenia — Obrona poprawiła,
Final Control ODDAL po niezależnej weryfikacji na obu pinach)

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-18-HOTSEAT-MATRIX.md` (24 wiersze, sekcje A-D).

Potwierdzone na żywo na `rust-port/parity-v2`@`9e33fc77`: hot-seat **BRAK** w `playable`/`bridge`/
`save_load` (tylko `HUMAN_PLAYER_ID=1`, jeden człowiek). `turn_economy.rs`/`diplomacy.rs` istnieją ale
niepodpięte do `playable`. Web: `hotSeatEnabled` (domyślnie false), przełączanie fotela
(`advanceSeat`), ale zasłona przekazania (`hotSeatHandoff.ts`) podpięta WYŁĄCZNIE w hooku testowym, nie
produkcyjnie — otwarte pytanie do właściciela, czy port ma to zaimplementować. Znalezisko: część logiku
web ma już per-fotel filtr (`isMe`), ale inne dane (civType, era, zbadane technologie) są nadal
singletonowe — częściowa, nie pełna separacja nawet na webie.

BLOKADY: brak blokujących. Otwarte pytanie produktowe o `hotSeatHandoff` odnotowane, nie wymaga
natychmiastowej decyzji (dotyczy P6, nie P1).
NASTĘPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
