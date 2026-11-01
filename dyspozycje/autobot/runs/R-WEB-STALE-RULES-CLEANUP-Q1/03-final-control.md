STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB), sprzatanie, zero zmiany logiki
TEMAT: R-WEB-STALE-RULES-CLEANUP-Q1
GOAL: usunac z komentarzy, opisow i testow reguly sprzeczne z decyzjami wlasciciela (rejestr #1-#27).

WERDYKT ZARZUTOW (wszystkie ODDAL, zero NAPRAW):
1. Tooltip buildModeHud.ts:211 -> ODDAL. Zmieniony tylko literal `title` w ULEPSZENIA_FOCUS_TITLES.zrownowazone (git diff 4bbef081d cc40da06b), dispatch dopuszcza "teksty opisow"; `git grep "surowce, infra"` w gra/src i gra/tools = 0 trafien. Swiadomy wyjatek od literalnego "diff kodu pusty" - do wiadomosci orkiestratora.
2. Oslabienie M13 -> ODDAL. Obrona dodala M13c-K2 (niedobor t4-7 po pracy nad zywnoscia): wynik zmierzony przeze mnie ZGODNE (farmy t0, tartak tylko t4, po oknie 0). K3 nie przyjmuje sciezki wolnoWycinac:false - luka pokrycia K3 w scenariuszu "niedobor wraca" jest znana; parytet K2=K3 (M14) ZGODNE.
3. Piny food-hodowla (bydlo.praca=4) -> ODDAL. Dane JSON zrodlem prawdy; wartosc 4 to ZALOZENIE operatora (rejestr jej nie rozstrzyga); trzoda nie jest surowcem (#4). food-hodowla-test 24 OK / 0 FAIL.
4. Pelnosc pokrycia -> ODDAL. Moj grep fraz ("1 tartak na 10", "max 3 na etap", "promien 10", "miekka rezerwacja", "poza limitem", "do potwierdzenia ABC") w 4 plikach src: wszystkie trafienia oznaczone NIEAKTUALNE/ODWOLANE (auto-improvements.ts:12,14,528; fort-territory.ts:5,7,15). Pelny przeglad 1824 linii: NIE_ZMIERZONO.

ZMIANY/COMMIT: koncowy SHA kodu do integracji = cc40da06b83decdc240a7cab229121a272641193 (baza 4bbef081d; eb1033484 + cc40da06b). Ten raport to osobny commit dokumentacyjny nad cc40da06b.
ALLOWLISTA: git diff --name-only 4bbef081d cc40da06b = 4 pliki gra/src (komentarze + 1 tooltip), 2 pliki gra/tools, 2 raporty runu. Brak gra-robocza, WERSJE.md, rust-port. git diff --check czysty.

TESTY (samodzielnie, na cc40da06b, npm ci --ignore-scripts, node_modules usuniety):
tsc --noEmit 0; auto-improvements-test 46/0; ai-improvements-test 56/0; autoimprove-stages-q1-test 302/0; fort-outpost-hard-territory-test 80/0; auto-fort-claim-test 63/0; food-hodowla-test 24 OK/0 FAIL; verify-decisions-picker 26 ZGODNE/0 NIEZGODNE.

KOLEJNOSC WZGLEDEM origin/rust-port/parity-v2: niezalezna (zmiany tylko w gra/ i dokumentacji runu; parity-v2 = 5f618f748, merge-base z cc40da06b = f4c89d008). Brak kolizji plikow; integrowac na origin/main (4bbef081d), dowolna kolejnosc wzgledem parity-v2.

BLOKADY: brak
RUNDY: 1/5 (Final Control)
NASTEPNY KROK: integracja orkiestratora (merge cc40da06b + commit raportu na main, bramki), potem READY_FOR_DEPLOY; deploy/push osobna autoryzacja.
DEPLOY/PUSH: NIE WYKONANO
