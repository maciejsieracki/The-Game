STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-LIVE-HOOKS-Q1
GOAL: log diagnostyczny pickera, hooki `window.__civTest` za `?civTest=1`, zywe scenariusze (a) fort, (b) E2, (c) E3.

ZMIANY/COMMIT: SHA do integracji = `829dd0f8c` (baza `e1b0bae86`; kod Operatora `de2bbff41`, raport `00cb5333e`). Ten plik dodany osobnym commitem docs. Brak pusha.
Allowlista: diff `e1b0bae86..829dd0f8c` = auto-improvements.ts (tylko blok `if (dbg)` + typ + sink), main.ts (import + jedno wywolanie hooka), civ-test-hooks.ts (nowy), autoimprove-live-hooks-test.cjs (nowy), katalog runu. Nic poza lista. `git diff --check` czysty.

ORZECZENIA (zarzuty Evaluatora):
1. Zywe (a)(b)(c) NIE_ZMIERZONO: ODDAL (zakaz buildu; osobny run po buildzie orkiestratora).
2. Przyczyna dla Korynta: ODDAL (ustalona na fixturze, NIE_ZMIERZONO w zywej grze; uczciwie oznaczone).
3. Log = rekonstrukcja: ODDAL (naprawione w obronie: `rekonstrukcja: true`, komentarz, test pick `wyrab` => werdykt `wybrany`; kierunek odwrotny NIE_ZMIERZONO).
4. Komentarz z bledna nazwa testu: ODDAL (poprawione w 829dd0f8c).
5. `naRzece`: ODDAL (main.ts `civTestOnRiver` uzywa riverPaths + rzeka.obecna + sasiedzi, jak picker; potwierdzenie na zywej mapie w runie zywym).
6. `foundCity` mutuje populacje/Prace: ODDAL (fixture scenariusza, tylko `?civTest=1`, opisane w 02-obrona).
7. `git diff --check`: zweryfikowane samodzielnie, czysty.
Brak NAPRAW, brak DO DECYZJI CZLOWIEKA.

TESTY (samodzielnie na 829dd0f8c, po `npm ci --ignore-scripts`):
- autoimprove-live-hooks-test 37/0; autoimprove-stages-q1-test 302/0; auto-improvements-test 46/0; auto-fort-claim-test 63/0; `tsc --noEmit` EXIT=0.
- Przeglad diffu: log tylko za `dbg`, czyste odczyty; logika pickera bez zmian. node_modules usuniete.

BLOKADY: zywe scenariusze (a)(b)(c) i Korynt NIE_ZMIERZONO; wymagaja bundla `Gra-ROBOCZA.html` z 829dd0f8c (buduje orkiestrator).

RUNDY: Final Control 1/5 (cykl: Operator r1, Obrona r1 => 2/5 zuzytych)

NASTEPNY KROK: integracja orkiestratora 829dd0f8c (+ commit docs FC). Kolejnosc wzgledem origin/rust-port/parity-v2: niezalezne (merge-base f4c89d008; parity-v2 nie dotyka `gra/` ani katalogu runu), kolejnosc dowolna, bez konfliktow. Potem build i osobny run zywych scenariuszy (a)(b)(c) z pomiarem `naRzece` i spojnosci logu.
DEPLOY/PUSH: NIE WYKONANO
