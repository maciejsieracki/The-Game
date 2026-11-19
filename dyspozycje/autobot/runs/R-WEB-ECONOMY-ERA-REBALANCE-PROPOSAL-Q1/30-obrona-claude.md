STATUS: PASS-WITH-NOTES (obrona rundy 2; wszystkie 10 zarzutów rozstrzygnięte, 0 zmian w gra/src i gra/data)
DOMAIN: GAME (analiza + propozycja; zmiany wyłącznie w dokumencie, modelu statycznym i raporcie)
TEMAT: R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1
GOAL: poprawić propozycję rebalansu ekonomii wg epok tak, by każdy zarzut recenzji był przyjęty (z poprawką) albo odrzucony z dowodem; zachować dokument i model jako propozycję do decyzji właściciela.
BAZA: ca3f0ce95cadc0499f365f1189e353216217d090 (detached); recenzja 1c3ed1bb8f273e74dec003c335a05b80c6c105a7.

ZMIANY-COMMIT: pliki w allowliście, commit tylko tych ścieżek:
- dyspozycje/analizy/EKONOMIA-REBALANS-EPOKI-PROPOZYCJA.md (przepisany: tabele epok 1–5, korekta spichlerza, racje, wojsko 4/8 na jednostkę, dwa estymatory liczby ulepszeń, ABC 1–10)
- gra/tools/econ-rebalance-model.cjs (warianty z bonusem całkowitym, miks jednostek 4/8, dwa estymatory N_imp, utrzymanie Pracy pU(e), racje REKOMENDOWANY m = 1+0,6·(e−1))
- dyspozycje/autobot/runs/R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1/model-out.txt (wynik modelu, 400 wierszy + nagłówek)
- dyspozycje/autobot/runs/R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1/30-obrona-claude.md (ten raport)
Zero zmian: gra/src/**, gra/data/**, WERSJE.md, manifest, rust-port/.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. floor(3+0,5)=3 jest poprawne matematycznie i jest cięciem farmy 4→3. Reguła zmieniona: bonus całkowity `base + min(e−1,1)` (Brąz bez zmian, farma 4; Żelazo zamrożone, farma 4). Model: `bm(e)=min(e−1,1)` dla REKOMENDOWANY, bez `floor` i bez 0,5. Wariant MOCNY (bm=0) jawnie obcina farmę w Brązie.
2. PRZYJMUJĘ. Claim „Żelazo: wszystko zamrożone” był fałszywy dla racji (step 0,6 rośnie). Dla REKOMENDOWANY racje: m = 1+0,6·(e−1) → Brąz 1,6, Żelazo 2,2 (wcześniej 160/220 → teraz 160 Brąz, 220 Żelazo w t150 seed 4242). Fazowanie opisane w §C(iii) i §E pkt 4.
3. PRZYJMUJĘ z zastrzeżeniem. Dodano: (ii) cztery warianty (ostrożny ×1,10 / średni ×1,25 / mocny ×1,50 / rekomendowany ×1,25 Brąz, zamrożone Żelazo) modelowane przez kU; (iv) warianty uF z fazowaniem; (v) warianty mnożnika utrzymania Pracy (pU 2/4 → 3/6 → 4/8) z efektem w modelu. Plik economy-upkeep.ts wskazany teraz jako utrzymanie (l.1121), nie koszt rekrutacji. Koszt rekrutacji i utrzymanie innymi surowcami (Brąz, Cegła, Żelazo) oznaczone NIE_MODELOWANE — plik kosztu rekrutacji nie zlokalizowany w tej rundzie (do ustalenia w kolejnym temacie).
4. PRZYJMUJĘ. Dodano tabelę epok 1–5 (§A tabela 1). Epoki 4–5 wynikają z kodu, nie z pomiaru, i ujawniły rozbieżność: `normalizeProductionEra` (l.331–333) i `improvementYieldForEra` (l.197) wracają do bazy poza epokami 2–3, a utrzymanie Pracy rośnie (8/16). Zgłoszone jako ABC 10.
5. PRZYJMUJĘ. Zdanie „Praca nie rośnie w nieskończoność z powodu tych zmian” zastąpione: Praca zapasu 20 454 rośnie ~250/turę w każdym wariancie bez ujścia; to osobna decyzja (ABC 8). §C(vi) poprawione.
6. PRZYJMUJĘ. N_imp nie jest dolną granicą. Dodano dwa estymatory: UPK = pracaUpkeep/2 (seed 4242: 5; seed 7: 18; t30–t60: 0) i BRU = brutto/75 (10,9; 15,7; zawyża przez lasy i Ceramikę). Model liczy oba; wyniki w model-out.txt.
7. PRZYJMUJĘ. Dane: seed 4242 spichlerzMax 1000 (t30–t90), 3000 (t120), 5000 (t150); stan 1000 = cap w t90, 2851 w t150; spichRate +6 w t90 (nie ~0). Seed 7: max 1000 przez cały bieg, stan 992 w t150. Tabela w §B; model nadal nie modeluje capu (NIE_MODELOWANE, wpisane w ograniczenia).
8. PRZYJMUJĘ. Dodano miks jednostek: `units.json` żywność/turę = 1 dla wszystkich 48 jednostek (Kamień 11, Brąz 37, Żelazo 27; jedna z zerem), skala epoki jednostki ×1/×2/×4 × R_STAWKI ×4 → 4 / 8 / 16 na jednostkę. Model liczy Kamień (4) i Brąz (8). Poprzednie „440 vs spichRate +6” uznano za nieporównywalne (cap 1000, brak pomiaru produkcji żywności): zużycie wojska NIE_ZMIERZONO, §B.
9. PRZYJMUJĘ. Brak testu modelu (opcjonalny) i brak tsc: tsconfig.json ma `include: ["src"]`, a diff nie dotyka gra/src, więc tsc nie jest objęty zmianą. Model uruchomiony: 401 linii, 0 NaN (`grep -c NaN` = 0), rc=0. Test mutacyjny NIE_WYKONANO.
10. PRZYJMUJĘ. Poprawiono numery linii: `terrainImprovementEraMultiplier` l.134–142 (tabela l.128–132), `resourceProductionAmountForEra` l.335–342, `normalizeProductionEra` l.331–333, `computePracaUpkeepByOwner` l.991–1019, `improvementYieldForEra` l.191–200. Dodatkowo poprawiono wartości bazowe rudy (20) i złota (1) w tabeli §A, które były błędne.

Dodatkowo (poza zarzutami, wykryte w trakcie obrony):
- Model: bm (bonus) jest odejmowany/dodawany zarówno do żywności, jak i do Pracy — możliwe podwójne liczenie, opisane w ograniczeniach.
- Wariant REKOMENDOWANY po poprawce daje żywność ujemną w obu seedach (seed 4242 t150: −9 do −32; seed 7: −14 do −20). Dokument mówi to wprost i dodaje ABC 9 (produkcja żywności jako warunek wdrożenia).

TESTY:
- `node gra/tools/econ-rebalance-model.cjs /tmp/econ-final` → rc=0, 401 linii (nagłówek + 400 wierszy), NaN=0.
- Spójność: seed 4242 t150 Brąz PRZED food +24 (zgodne z pomiarem wynikającym z bilansu), racje 150 (zgodne z 50×3); seed 7 t150 racje 6 (zgodne z 2×3).
- tsc: NIE_WYKONANO (tsconfig include: src; brak zmian w src; brak node_modules — zgodnie z zakazem npm ci przy tej rundzie).
- Mutacja kopii testu: NIE_WYKONANO (test nie został dodany; opcjonalny w dispatchu).
- Bieg w grze: NIE_WYKONANO (poza zakresem; §KOLEJNY KROK w dokumencie).

BLOKADY: brak. Ograniczenia opisane w dokumencie (§D): brak sprzężenia zwrotnego, estymatory liczby ulepszeń, miks jednostek NIE_ZMIERZONO, koszt rekrutacji NIE_MODELOWANE, cap spichlerza NIE_MODELOWANE, epoki 4–5 wyłącznie z kodu.

RUNDY: 2/5 (runda 1: Operator; runda 2: obrona po recenzji 1c3ed1bb8).

UWAGI-DLA-ORKIESTRATORA:
- Rozbieżność kodu w epokach 4–5 (surowce i bonusy wracają do bazy; utrzymanie Pracy rośnie) może być błędem, nie zamierzoną regułą. Zgłoszone jako ABC 10 w dokumencie; nie dotykałem kodu gry.
- Koszt rekrutacji jednostek (plik i pola) nie został zlokalizowany — do osobnego tematu, jeśli właściciel wybierze wariant (ii) z rekrutacją.
- Nie tworzyłem żadnych sesji/zadań/harmonogramów (zakaz respektowany).

NASTĘPNY KROK: recenzja Evaluatora (runda 3 wg obiegu) na czubku commita tej rundy; po PASS — Final Control; następnie decyzja właściciela na ABC 1–10 i ewentualny bieg weryfikacyjny w żywej grze (flaga OFF).
DEPLOY/PUSH: NIE WYKONANO
