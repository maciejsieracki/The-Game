STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza + propozycja; zero zmian w grze i w gra/data)
TEMAT: R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1
GOAL: konkretna propozycja rebalansu ekonomii wg epok (przychody z ulepszeń: żywność/Praca/surowce; koszty: budynki, jednostki, żywność obywateli i wojska) z przykładem PRZED/PO na pomiarze gracza (seed 4242 i 7).
ZMIANY/COMMIT: dyspozycje/analizy/EKONOMIA-REBALANS-EPOKI-PROPOZYCJA.md (dokument propozycji, §A–E); gra/tools/econ-rebalance-model.cjs (nowy model statyczny, poza grą, bez wpływu na bundle); ten raport. Brak zmian w gra/src, gra/data, WERSJE.md, manifeście.
TESTY:
- `node --check gra/tools/econ-rebalance-model.cjs`: OK.
- `node gra/tools/econ-rebalance-model.cjs /tmp/econ-final`: 0 wartości NaN (wyjście sprawdzone: wiersze t30/60/90/120/150, seedy 4242 i 7, epoka Brąz i projekcja Żelaza, warianty PRZED/OSTROŻNY/ŚREDNI/REKOMENDOWANY/MOCNY). Model zwraca błąd przy NaN (kontrola w `fmt`).
- tsc --noEmit: NIE_ZMIERZONO (nie uruchomiono: brak zmian w src/ i tsconfig nie obejmuje gra/tools/*.cjs; bez npm ci, zgodnie z dyspozycją o dysku).
- Test modelu na mutacji kopii: NIE dodano (opcjonalne w dispatchu).
- Dane pomiaru: /tmp/econ-final/seed{4242,7}.jsonl (149 tur każdy, obecne).
BLOKADY: brak. Ograniczenia modelu opisane w dokumencie (brak sprzężenia zwrotnego; liczba ulepszeń NIE_ZMIERZONO; epoka 3 wyłącznie projekcja; udział lasów w Drewnie NIE_ZMIERZONO).
RUNDY: 1/5
WNIOSKI (dla orkiestratora):
1. Surowce rosną ×1,5/epokę (tartak 50→75→113), żywność/praca/handel +1/epokę addytywnie (farma 3→4→5). Sprzeczne z „stałością" jest mnożnik surowcowy, nie bonusy.
2. Jednostki zjadają żywność: baza z units.json (1) × skala epoki jednostki (Kamień 1 / Brąz 2 / Żelazo 4) × ×4 = 4 / 8 / 16 na jednostkę na turę (marsz, własne terytorium). Mnożnik epoki właściciela na wojsko nie istnieje.
3. Drewno (seed 7, +725/turę netto) nie przestaje rosnąć przez same zmiany przychodów (MOCNY nadal +463). Potrzebne osobne ujście — pytanie ABC 1.
4. Żywność: w PRZED dodatnia tylko w seed 4242 (+24); REKOMENDOWANY −35 / −24 w t150; MOCNY −216 — odpada.
5. P0 rozstrzygnięte: wartość econ-params (1) zgodna z kodem; mnożnik epoki ×1/×2/×4 tylko w kodzie (`terrainImprovementEraMultiplier`); zakres = wszystkie ulepszenia poza wycinką, w tym żywnościowe i drogi.
NASTĘPNY KROK: pytania ABC z dokumentu §E (rekomendacja: wariant REKOMENDOWANY za flagą danych + bieg weryfikacyjny w żywej grze z runnera econ FALI 846/855 przed jakąkolwiek zmianą wartości).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Pomiar cały w epoce 2 (Brąz); wszystko o Żelazie to projekcja statyczna.
- `state.json` z pomiaru nie zawiera mapy — liczby ulepszeń per typ są NIE_ZMIERZONO.
- Lasy (nakładka Las = 15 Drewna/hex) zawyżają wrażliwość Drewna na mnożnik ulepszeń (górna granica).
- Nie tworzono żadnych sesji/zadań/harmonogramów.
