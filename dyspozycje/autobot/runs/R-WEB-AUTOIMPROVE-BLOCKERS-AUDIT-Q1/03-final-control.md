STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`), audyt tylko do odczytu
TEMAT: R-WEB-AUTOIMPROVE-BLOCKERS-AUDIT-Q1
GOAL: Lista bramek blokujacych auto-budowe ulepszen zywnosciowych, pomiar scenariuszy (a) (b) (c), konflikty z N1-N6.

WERDYKT PER ZARZUT (dowod: stan `67af013bc`)
1. Magazyny M-start/M-srodek zalozone, nie odczytane: ODDAL. Raport (sekcja 1 pkt 1, sekcja 9) mowi wprost, ze magazyny byly zalozone, liczby 12/7 sa ilustracja, teza "etapy zawsze wylaczone" to hipoteza. Logika progu 10 szt. dowodliwa (`diplomacy-resource-trade-pick.ts:34-49`).
2. E4/P3/E11 BLAD -> POD/ZAM: ODDAL. Reklasyfikacja wykonana (P3 w tabeli 3.1 ma klase POD, ABC-1 przeformulowane). Klasy BLAD zostaly tylko tam, gdzie jest pomiar (P10, P15, P25).
3. Luka zakresu (KANON, pending-improvements, resolveWorkedTiles, bramki stanu heksa): ODDAL. Przejrzane w obronie (sekcje 2, 5, 9 raportu), dodany wiersz E13. Zapis/odczyt gry jawnie NIE_ZMIERZONO (dopuszczone przez kryterium 2).
4. (a)/(b) NIE_ZMIERZONO w zywej grze: ODDAL. Dispatch zakazuje `npm run dev/build` w `gra/`; raport podaje jawnie "zadna zmierzona bramka nie blokuje (a)(b) w zwyklej konfiguracji" plus liste brakujacych danych (sekcja 6). Zgodne z kryterium 2.
5. 87 vs 955 linii logu: ODDAL. `AUDIT_VERBOSE=1` opisane w naglowku skryptu i raporcie.
6. Lista bramek nie 1:1: ODDAL. Dodane P11a, P11b, P28, E13; lista (60 wierszy) jawnie opisana jako nie 1:1 z continue/break.
NAPRAW: 0. DO DECYZJI CZLOWIEKA: 0 (pytania ABC-1..6 z raportu, sekcja 7, to decyzje produktowe, nie zarzuty; zadaje je orkiestrator).

WERYFIKACJA WLASNA
- Diff `4d1916f2c..67af013bc` oraz `origin/main..67af013bc`: 5 plikow, wszystkie w allowliscie (4 pliki w katalogu runu + nowy `gra/tools/audit-autoimprove-blockers.cjs`). Zero zmian w `gra/src`, `gra/data`, `gra-robocza`, `WERSJE.md`, `rust-port`.
- `git diff --check` czysty. `node --check` skryptu: SYNTAX_OK.
- Spot-check kodu zgodny z raportem: `main.ts` ok. 35727-35773 nie przekazuje `playerEra`; `auto-improvements.ts` ok. 989-996 `lesneMinSpelnione` liczone raz przed petla i bramkuje wyrab (ok. 1011); `foodImprovementStages` zalezy od `hasNonFoodResourceDeficit`; `livestock-unlock.ts` ok. 100 Nowy Swiat era<3 odrzuca bydlo/owce.
- Pomiarow skryptem nie powtarzalem (brak esbuild/three w `gra/`, zakaz npm install). Evaluator odtworzyl je niezaleznie: EXIT=0, identyczne podsumowania scenariuszy.
- Istniejacych testow repo nie uruchamiano; zmian testow brak.

NOTATKI (nie blokuja)
- Teza o niedoborze surowca jako globalnej bramce to hipoteza do potwierdzenia danymi z zywej gry.
- Zmierzona realna blokada w zwyklej konfiguracji dotyczy (c): F1/D2 (sciezka bez etapow: tartak/oboz zamiast wyrebu, P10/P15) oraz Nowy Swiat (P25). To wejscie dla `R-WEB-AUTOIMPROVE-PRIORITY-Q1`.

KOLEJNOSC INTEGRACJI
- SHA do integracji: commit z tym plikiem (rodzic `67af013bc`), podany w raporcie FC.
- Wzgledem `origin/rust-port/parity-v2`: brak nakladania plikow (audyt dodaje tylko katalog runu i nowy `gra/tools/audit-*.cjs`; branche rozbiezne). Kolejnosc dowolna; zalecane po `origin/main`, niezalezne od parity-v2.

RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora; wynik do `R-WEB-AUTOIMPROVE-PRIORITY-Q1`; ABC-1..6 zadaje orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
