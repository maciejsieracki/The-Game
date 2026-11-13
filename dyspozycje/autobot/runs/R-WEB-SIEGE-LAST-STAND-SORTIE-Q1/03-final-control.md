STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-LAST-STAND-SORTIE-Q1
GOAL: Oblegana armia AI/barbarzyncow atakuje w ostatniej turze przed kapitulacja, gdy jej sila >= 80% sily oblegajacych (10:8); inaczej zostaje w oblezeniu.
ZMIANY/COMMIT: 11042c3227ecdeba3ae7e59d0869ded7fc79e16b (na ea9d25970, baza origin/main 319a84052). Allowlista: 9 plikow (siege-last-stand.ts, main.ts, test, runs/**), zero zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle, ai.ts, barbarians.ts. git diff --check czysty.
TESTY (odtworzone przez FC): siege-last-stand-sortie-test 58 OK/0 FAIL EXIT=0; tsc --noEmit EXIT=0; siege-ai, barbarians, siege-blockade-no-recruit-reinforce EXIT=0 (--no-live). Reszta regresji wg Evaluatora (EXIT=0). ai-home-defense-vs-barbarians: 3 FAIL (T2,T4,T5) potwierdzone na bazie 319a84052 (gate-base-home-defense.txt) - dlug przed zmiana, ODDAL.
ROZSTRZYGNIECIE ZARZUTOW: 1 (test strukturalny) ODDAL - obrona dodala D7-D9, kod egzekucji przeczytany, zywy przebieg NIE_ZMIERZONO (temat logiczny); 2 (mutant >= vs >) ODDAL - rownowazny, EPS celowy, dodano A1 i mutacje bez EPS; 3 (home-defense na bazie) ODDAL - zweryfikowane. Zero NAPRAW -> PASS.
BLOKADY: NIE_ZMIERZONO zywa tura/wynik bitwy w przegladarce. Gracz-czlowiek wylaczony. REPIN Rust (oblezenie/AI) do notatki orkiestratora.
RUNDY: 3/5 (Operator R1, Obrona R2, FC)
INTEGRACJA: SHA do integracji 11042c3227ecdeba3ae7e59d0869ded7fc79e16b (2 commity: ea9d25970 + 11042c322, w tej kolejnosci). origin/main = 319a84052 (przodek). Wzgledem origin/rust-port/parity-v2 (b520768b0, merge-base f4c89d008): osobne galezie, temat dotyka tylko gra/ - integrowac do main niezaleznie/przed parity-v2; parity-v2 wymaga pozniejszego REPIN.
NASTEPNY KROK: integracja orkiestratora
DEPLOY/PUSH: NIE WYKONANO
