STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1
GOAL: deaktywacja grantow zlozy przy znikaniu umowy w D1 (wygasniecie) i D6 (zerwanie za danine), parytet z pinem 07d2fbd72
ZMIANY/COMMIT: oceniany d22e75ed6 (baza 6acb1d81b jest przodkiem). Diff tylko na allowliscie (turn_war_dipl_steps.rs +7, test, gen.mjs, vectors.json, 01-operator-r1.md). Brak #[ignore]. Cargo.lock untracked, niecommitowany.
TESTY (odtworzone przez Evaluatora): fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --lib EXIT 0 (114); p6_zloze_wire_expire_tribute EXIT 0 (1); p6_wire_war_dipl_steps EXIT 0 (8); p6_zloze_grants_state EXIT 0 (8); p6_r7k7b_zloze_sync EXIT 0 (3).
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Final Control

Zarzuty (nieblokujace):
1. D6: test nie ma przypadku id z res.broken bez pary w tribute_break_pairs (kod robi petle po calym res.broken, zgodnie z pinem 24292-24294, ale ta galaz nie jest osobno pokryta).
2. Wektory expectedActive w generatorze wynikaja z wykonania pinowego deactivateZlozeGrantsForDeal (strazniczy SHA-256), natomiast kolejnosc wywolan D1/D6 jest odwzorowana w generatorze recznie, nie wykonana z main.ts. Akceptowalne.
3. Kolejnosc w D6: Rust deaktywuje po retain, pin w petli po usunieciu kazdego id; wynik koncowy identyczny (funkcje niezalezne).
Kod produkcyjny zgodny z pinem (D1 po push expired_deals, przed finish_requests; D6 dla calego res.broken).
