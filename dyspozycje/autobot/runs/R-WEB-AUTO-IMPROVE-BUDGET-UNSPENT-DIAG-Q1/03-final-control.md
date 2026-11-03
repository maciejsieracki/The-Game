STATUS: PASS
DOMAIN: GAME (WEB), diagnoza. Zero zmian w gra/src, gra/data, WERSJE.md.
TEMAT: R-WEB-AUTO-IMPROVE-BUDGET-UNSPENT-DIAG-Q1
GOAL: ustalic na dowodach, czy ogranicznik ulepszen na miasto lub inny parametr blokuje wydawanie budzetu Pracy przez automat.
ZMIANY/COMMIT: operator 87b41b1de + d961f9d78; obrona efa2e1a184a9fe3120c09d9ad49873baf00af41d (baza d961f9d78, baza operatora 23dd158e9). Ten plik: commit Final Control na branchu final-control-q1.

WERDYKTY PER ZARZUT (dowod: kod na efa2e1a + tresc 01-operator-r1.md po obronie):
1. Limity na miasto (defenseCap, lesneMin) pominiete - ODDAL (naprawione w obronie, 01-operator-r1.md:9; kod potwierdzony: auto-improvements.ts:196, :199, :1538, :1553, :1720, :1858).
2. Brak histogramu odrzucen S6/S7 - ODDAL (uczciwie NIE_ZMIERZONO; ograniczenie gorne z JSON: pula <=30 od t3, wiec pula jest pierwsza bramka). Pomiar wymaga harnessu niedostepnego w tej kopii.
3. „Odtworzony" -> „mechanizm potwierdzony na fixture" - ODDAL (01-operator-r1.md:18). Wyjasnienie spadku populacji 12->9 czesciowe, reszta NIE_ZMIERZONO.
4. Override % miasta (getPracaBudgetPercent) - ODDAL (pkt 5b; override moze tylko zacisnac pulap).
5. Filtr AI getOnlyWorked - ODDAL (pkt 5, rekomendacja B doprecyzowana: dotyczy gracza).
6. Sciezka bezwzgledna w sum-scenarios.cjs - ODDAL (__dirname, potwierdzone). Dlugosc raportu (~1044 slow vs ~600) - ODDAL jako nota.
7. Brak pomiaru na zywo - ODDAL (nota; NIE_ZMIERZONO jawne).
Zero NAPRAW, zero DO DECYZJI CZLOWIEKA (A/B/C dla wlasciciela to decyzja produktowa tematu naprawczego; zadaje orkiestrator).

BRAMKI (zweryfikowane samodzielnie):
- Allowlista: git diff --name-only 23dd158e9..efa2e1a = tylko gra/tools/auto-improve-unspent-diag.cjs i dyspozycje/autobot/runs/R-WEB-AUTO-IMPROVE-BUDGET-UNSPENT-DIAG-Q1/**; brak gra/src, gra/data, WERSJE.md.
- Delta obrony d961f9d78..efa2e1a: 2 pliki (01-operator-r1.md, evidence/sum-scenarios.cjs).
- git diff --check d961f9d78..efa2e1a: czysty.
- Cytaty kodu (defenseCap, JEDEN_NA_ILU_OBYWATELI, WYRAB_MIN_FOREST_IN_RADIUS, lesneMin) sprawdzone w efa2e1a.
- Nie uruchamiano tsc/testow/buildu (zero zmian kodu gry; npm run build w gra/ zabroniony). Pomiar na zywo nie powtorzony (brak node_modules/harnessu).

BLOKADY: brak.
NIE_ZMIERZONO (przeniesione): drugi seed/swiat; histogram odrzucen pickera S6/S7; AI per-heks; czestosc objawu u gracza w naturalnej grze; zacisniety override % miasta u gracza.
RUNDY: 1/5 (Final Control po obronie)
INTEGRACJA: final-control-q1 -> efa2e1a -> d961f9d78 -> 87b41b1de -> 23dd158e9. origin/rust-port/parity-v2 (6b3882ca) ma merge-base f4c89d008 i mocno rozjechane drzewo. Zmiany tematu sa wylacznie ADDYTYWNE (nowy katalog runu + nowy plik gra/tools/auto-improve-unspent-diag.cjs, brak ich w parity-v2), wiec: cherry-pick 87b41b1de, d961f9d78, efa2e1a i commitu FC na origin/rust-port/parity-v2, bez konfliktu sciezek. Numery linii w raporcie dotycza bazy 23dd158e9 i w parity-v2 moga sie przesunac (auto-improvements.ts, ai.ts, main.ts, render/cities.ts rozni sie) - nota, nie blokada. Temat niezalezny od kodu: kolejnosc wzgledem innych tematow dowolna.
NASTEPNY KROK: orkiestrator - integracja cherry-pick, potem pytanie ABC A/B/C (rekomendacja operatora: B) do wlasciciela; READY_FOR_DEPLOY wystawia wylacznie orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
