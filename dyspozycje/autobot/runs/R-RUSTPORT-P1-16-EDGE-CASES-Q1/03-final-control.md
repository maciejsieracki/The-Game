STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16-EDGE-CASES-Q1
GOAL: Spisane edge case'y i znane błędy w kodzie webowym, pin main=edb8fb56.
RUNDY: 1/5 (Evaluator wydał FAIL — 6 realnych zarzutów, w tym złamanie reguły anty-halucynacyjnej:
9 z 16 numerów linii TODO było błędnych mimo poprawnych cytatów treści. Obrona naprawiła wszystkie 6
w tej samej rundzie, Final Control potwierdził).

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md`.

16 trafień TODO w 9 plikach (FIXME/HACK/XXX = 0), numery linii poprawione na zgodne z `git grep` na
`edb8fb56` po zarzucie. 5+ udokumentowanych starych błędów (B0.1, B0.2, B0.3, B0.9 pkt 1, BLEDY #4)
sprawdzonych wprost na pinie: NAPRAWIONE. B0.8 oznaczone jako NIEROZSTRZYGNIĘTE (mechanizm obecny,
skuteczność niezweryfikowana) — poprawne, nie binarne na siłę. Najwięcej otwartych TODO: dyplomacja
(3), walka (2+3 UI), AI (2).

Ten temat jest kolejnym dobrym przykładem procesu: Evaluator realnie złapał błędne numery linii
(naruszenie reguły anty-halucynacyjnej), nie tylko treść.

Znalezisko do dalszej pracy: Evaluator wskazał, że starsze dokumenty `dyspozycje/AUDYT-*.md`
(2026-07-21 do 2026-08-13) nie zostały jeszcze przejrzane pod kątem edge case'ów — otwieram osobny
temat uzupełniający (P1.16b).

BLOKADY: brak. Zero zapisu w `gra/**`.
NASTĘPNY KROK: integracja orkiestratora, dispatch P1.16b.
DEPLOY/PUSH: NIE WYKONANO
