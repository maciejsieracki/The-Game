STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L3-Q1
GOAL: etap 1 wiringu UNIT-REPLACE L-3: adaptery + testy; komenda gracza i AI wg dispatchu
ZMIANY/COMMIT: kod 731ef1865 + 9dd243acf; raporty 0c8424dc0; baza 95bbf99d7 (przodek HEAD; f207ea6b1 tez przodek HEAD). Diff vs baza: mod.rs +1, playable.rs +4 (tylko komentarz-marker w advance_turn), unit_replace_wiring.rs (nowy), tests/p6_unit_replace_l3.rs (nowy), runs/**. Allowlista zachowana, brak gra/, Cargo.toml, WERSJE.md; Cargo.lock untracked, niecommitowany. Brak #[ignore], istniejace asercje nietkniete (diff tylko addytywny).
TESTY (odtworzone samodzielnie, CARGO_TARGET_DIR poza repo): fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; lib 53 passed; p6_unit_replace_l3 8; p6_repin_unit_replace_pure 7; p6_repin_unit_replace_execute 1; p6_wire_war_pipeline 7. Testy wektorowe w unit_replace_wiring.rs: wektory_execute_przez_adapter (21), wektory_afford_przez_adapter (72/84, 12 z pool=null pominiete jawnie), pay_stock_pomija_wartosci_niepoprawne.
BLOKADY: patrz decyzje.

WERDYKT ZARZUTOW:
1. Kryt. 2 (komenda gracza w playable.rs): DO DECYZJI CZLOWIEKA. PlayableState nie ma skarbca/puli/typow jednostek/HP; rozszerzenie poza allowlista. Blokada rzetelna, nie defekt kodu.
2. Kryt. 3 (faza Ai): ODDAL. Jawny marker w advance_turn przy TurnPhase::Ai + opis; dispatch dopuszcza jawny punkt podpiecia.
3. Wektory execute/afford przez adapter: ODDAL (naprawione w 9dd243acf, zweryfikowane testami).
4. Money null/NaN: ODDAL (asercja expected.money z wektora; reszta drobna).
5. Baza: ODDAL jako fakt procesowy. HEAD NIE jest przodkiem origin/rust-port/parity-v2 (tip 258afaf8f; merge-base z HEAD ec4e11741). Integracja = cherry-pick 731ef1865 + 9dd243acf na parity-v2 + ponowne bramki (ryzyko konfliktu: mod.rs, playable.rs). NIE ZMIERZONO (cherry-pick niewykonany). Decyzja bazy nalezy do orkiestratora.
6. pay_stock NaN/<=0: ODDAL (test dodany).

Zaden NAPRAW -> PASS-WITH-NOTES, ale kryterium 2 NIESPELNIONE: temat zamyka tylko etap 1 (adaptery, nie wiring komendy). Kryterium 3 tylko marker.
RUNDY: FC po 2 rundach/5
NASTEPNY KROK: orkiestrator: decyzja zakresu kryt. 2 (osobny temat rozszerzenia PlayableState) + baza integracji, potem cherry-pick i bramki.
DEPLOY/PUSH: NIE WYKONANO
