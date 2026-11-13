STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DATA-FALANGA-BONUS-VS-SPEARMAN-30-Q1
GOAL: Falanga (Grecja, Żelazo, Typ Falangite): Bonus vs Spearman % = 30; OBRONA = 12; PRZEBICIE = 4; ATAK = 7 (DODATEK 1 + 2). Runda 2: odpowiedź na zarzuty Evaluatora/Final Control.
BAZA: commit operatora r1 43ae3a418 (lokalnie, bez push); origin/main 12fa64c97.
ZMIANY/COMMIT: commit operatora r2 (SHA w raporcie orkiestratora; detached HEAD w worktree wf_ef14fce7-a1b-3, bez push).
Allowlista r2: gra/data/units.json, gra/tools/unit-power-test.cjs, gra/src/data/wikiBundle.json (regenerowany generatorem), docs/encyklopedia/jednostki/falanga.md, docs/PORADNIK-GRACZA/57-katalog-jednostek.md, runs/<ID>/.
Nie zmieniano: gra/data/tech-cards-top5.json (patrz ZARZUT 5), counters.json, combat.ts, WERSJE.md, gra-robocza/, build/dev, push/deploy.

## ODPOWIEDZI NA ZARZUTY

### Z1 (regresja unit-power-test.cjs, asercja 172.5) — PRZYJĘTE
Poprawka: gra/tools/unit-power-test.cjs: asercja `57.5 + 57.5 + 58.5` i komentarz (Falanga = 58.5 po DODATKU 2).
Dowód: `node tools/unit-power-test.cjs` -> `=== unit-power-test: 6 pass, 0 fail ===` (przed: 5 pass, 1 fail, got 173.5).
Uwaga: test wymaga esbuild 0.28.2 w gra/node_modules (w worktree dołączone tymczasowo z pakietu w katalogu scratch, do usunięcia przy sprzątaniu).

### Z2 (nieuruchomione/niezaktualizowane testy balansu) — PRZYJĘTE częściowo, z dowodami
Wyniki na commicie r2 (wszystkie uruchomione z gra/):
- unit-power-sort-test.cjs: 13 pass, 0 fail.
- combat-test.cjs (scenariusze Hastati vs Falanga, 1 i 5): 6/6 pass.
- falanga-bonus-vs-spearman-test.cjs: 15/15 ALL PASS.
- pole-bitwy-balance-check.cjs: exit 0, bez asercji dotyczących Falangi (wypisuje tylko tabele).
- legion-vs-falanga-compare.cjs: CRASH (TypeError counterMultiplier, toLowerCase undefined).
- true-stats-legion-falanga.cjs: NaN (dmg/traf NaN, E[dmg] NaN).
  DOWÓD, ŻE TO NIE REGRESJA: po tymczasowym przywróceniu units.json i counters.json z 12fa64c97 oba skrypty dają IDENTYCZNY wynik (crash / NaN). Przyczyna: skrypty czytają klucz `Obrażenia`, którego nie ma w units.json (0 wystąpień w 12fa64c97; obecne pole to `Uderzenie`/`weaponDamage`), a legion-vs-falanga czyta `Typ atakujacy` bez akcentu z pola `Typ atakujący`. ODRZUCAM jako regresję tego tematu. Naprawa wymagałaby decyzji, czy `Obrażenia` mapować na `Uderzenie` czy na `weaponDamage` (to zmienia semantykę testu) — NIE zmieniano; do długu testowego.
- moc-ranking-rozjazd-test.cjs: 13 PASS / 6 FAIL. Wszystkie 6 niepowodzeń dotyczy fixture Konnicy (oczekiwano 49, dane mają fieldPower 98). Konnica fieldPower = 98 także w 12fa64c97, a ten temat nie zmienia Konnicy. ODRZUCAM jako regresję tematu (przestarzała asercja, dług testowy).
- Nieuruchomione z powodu braku zależności środowiska (NIE_ZMIERZONO): building-cards-top5-test.cjs (brak playwright), recruit-list-order-by-era-test.cjs (brak playwright), unit-context-card-test.cjs (brak `three` przy bundlingu), general-eligible-unit-roster-test.cjs (wymaga bundlingu, nie zakończył się), entity-card-historia-section-test.cjs (wynik nieodczytany w tej rundzie). Wpływ na statystyki Falangi: nieznany dla tych pięciu.
- gen-tech-cards-top5.cjs --check: OK po przywróceniu pliku do stanu commita r1 (patrz Z5).

### Z3 (wpływ na ranking Moc militarna nieprzeliczony) — PRZYJĘTE, zmierzone
Metoda: bundle src/game/unit-power.ts (fieldPower runtime, z uwzględnieniem missileAttack i współczynników coeff) i porównanie rankingu 75 jednostek w 12fa64c97 i w r2.
- Stored fieldPower == runtime dla wszystkich 75 jednostek (0 niezgodności).
- Falanga: 52.5 (poz. 27) -> 58.5 (poz. 24).
- Zmieniły pozycję tylko 4 jednostki: Falanga 27->24; Hastati 24->25; Evocati 25->26; Konnica łucznicza asyryjska 26->27. Wszystkie pozostałe bez zmian.
- Hastati (57.5) pozostaje w pobliżu Falangi (58.5); nowe sąsiedztwo: Hu Ben Wei 61, uThulwana 61, Falanga 58.5, Hastati 57.5, Evocati 54.5.
- Formuła (src/game/unit-power.ts, fieldPower): attack = meleeAttack + weaponDamage + piercing + chargeBonus/coeff + missileAttack/coeff; defense = meleeDefence + armor + health/coeff; total = attack + defense.

### Z4 (meleeAttack 7 vs offset −1 z bazy) — ODRZUCAM z dowodem; korekta wzorca z r1
Zarzut: meleeAttack=7 zlikwidowało różnicę Atak−meleeAttack=1 z bazy; przy zachowaniu przesunięcia meleeAttack=6 i fieldPower=57.5.
Dowody:
1. Silnik czyta meleeAttack bezpośrednio: gra/src/game/combat.ts:209 (`meleeAttack: combatNormField(def['meleeAttack'], 0)`), a formuła trafienia combat.ts:438-445 (`hit_base + meleeAttack - meleeDefence + hitBonus`). Pole Atak nie jest czytane przez silnik walki. Ustawienie meleeAttack=6 dałoby w walce atak 6 przy deklaracji właściciela ATAK=7.
2. DODATEK 2 wprost: „ATAK = 7 (dziś 6; zaktualizuj `Atak` i `meleeAttack`)” — cel to wartość 7 dla obu pól, nie zachowanie przesunięcia.
3. W 12fa64c97 nie ma stałej relacji Atak↔meleeAttack: różnice (Atak − meleeAttack) rozkładają się od −4 do +6 (np. Hastati 6/7, Thorakites 7/5, Włócznik 6/5). Nie ma podstawy do założenia zachowania przesunięcia −1.
KOREKTA: uzasadnienie r1 „wzorzec Thorakites (Atak 8 = meleeAttack 8)” było BŁĘDNE. Dane 12fa64c97: Thorakites Atak 7, meleeAttack 5, Obrona 9, meleeDefence 8. Przyjmuję, że r1 podało nieprawdziwy przykład; wnioski z Z4 opieramy na pkt 1-3 powyżej.
Status założenia: meleeAttack=7, meleeDefence=12, piercing=4 jako ZAŁOŻENIE operatora wynikające z DODATKU 2. Do jawnego potwierdzenia przez właściciela/orkiestratora (wpływ na fieldPower: 1,0 punktu na każdą jednostkę pola).

### Z5 (dokumentacja i pochodne: encyklopedia, PORADNIK, Top3, wiki) — PRZYJĘTE częściowo
Znalezione i poprawione pochodne (dowód: git diff na commicie r2):
a) docs/encyklopedia/jednostki/falanga.md: „Siła w polu” 52.5 -> 58.5 (3 miejsca: Wiki-S, Wiki-M, Przykład liczbowy).
b) docs/PORADNIK-GRACZA/57-katalog-jednostek.md: wiersz tabeli Falanga 52.5 -> 58.5; wpis Falangi „Moc w polu: 45” -> 58.5 (wartość 45 była nieaktualna już w 12fa64c97).
c) gra/src/data/wikiBundle.json: przegenerowany `node tools/bundle-wiki-for-game.cjs`. Semantyczny diff porównany z HEAD: tylko 52.5 -> 58.5 w poradnik[20] i encyklopedia[22] (wikiS/wikiM/full). Brak innych zmian.
d) gra/data/units.json, Top3 Falangi: „Obrona 10 … (remis z Hieros Lochos)” -> „Obrona 12 … bez remisu”. Stare sformułowanie stało się fałszywe.
e) gra/data/units.json, Top3 Hieros Lochos: „Obrona na równi z Falangą” -> „Obrona zaraz za Falangą (10 wobec 12)”. Stare sformułowanie było fałszywe.
f) gra/data/units.json, Top3 Mur tarcz (Sargonid): „Najwyższa Obrona w partii — Obrona 10 … bez remisu” -> „Druga Obrona w partii — Obrona 10 … razem z Hieros Lochos, zaraz za Falangą (12)”. Stare sformułowanie stało się fałszywe.
   Weryfikacja: w partii Żelazo najwyższa Obrona = Falanga 12 (jedyna); kolejne: Mur 10, Hieros 10, Konnica lancowa asyryjska 10.
g) NIE ZMIENIONO — gra/data/tech-cards-top5.json, karta odkrycia „19 narodowych jednostek z żelaza, np. Falanga (Obrona 10)”. Plik jest GENEROWANY z CSV `dyspozycje/autobot/runs/R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1/zrodlo/odkrycia-top5.csv` (3 wystąpienia „Falanga (Obrona 10)”). Ręczna zmiana JSON powoduje NIEZGODNOŚĆ `gen-tech-cards-top5.cjs --check` (zweryfikowane: z zmianą -> NIEZGODNY; po przywróceniu -> OK). Poprawny sposób: zmienić CSV źródłowy w katalogu innego runu (poza allowlistą tego tematu) i przegenerować. DECYZJA ORKIESTRATORA: czy dopuścić zmianę źródła CSV (tekst karty stale mówi Obrona 10 do czasu tej decyzji).
h) Sprawdzone, bez zmian potrzebnych: data/counters.json, civs.json, tech.json, docs/WALKA-TW-v3.md, docs/AUTO-WALKA-MOC-ALGORYTM.md (brak liczb Falangi), docs/archiwum* (historyczne, poza zakresem).
Korekta r1: r1 napisało „wikiBundle nie zawiera tych statystyk” — BŁĘDNE; bundle zawiera 52.5 w opisach Falangi (poprawione w c).

## TESTY (commit r2)
- unit-power-test.cjs: 6 pass, 0 fail.
- unit-power-sort-test.cjs: 13 pass, 0 fail.
- falanga-bonus-vs-spearman-test.cjs: 15/15 ALL PASS.
- combat-test.cjs: 6/6 pass.
- gen-tech-cards-top5.cjs --check: OK.
- bundle-wiki-for-game.cjs: wygenerowany; diff semantyczny jak w Z5c.
- legion-vs-falanga-compare.cjs / true-stats-legion-falanga.cjs: błąd identyczny w 12fa64c97 (nie regresja; dług).
- moc-ranking-rozjazd-test.cjs: 13/6, 6 niepowodzeń dotyczy Konnicy, identycznie w 12fa64c97 (nie regresja; dług).
- NIE_ZMIERZONO: building-cards-top5, recruit-list-order-by-era, unit-context-card, general-eligible-unit-roster, entity-card-historia-section (brak zależności środowiska: playwright/three lub bundling).
- NIE_ZMIERZONO: typecheck (tsc) i build gra/ (zakaz npm run build/dev zachowany).
- git diff --check: do wykonania przed commitem (wynik w raporcie orkiestratora).

## FIELDPOWER / RANKING (wynik dla orkiestratora)
- fieldPower Falangi: 58.5 (formuła z unit-power.ts; stored == runtime dla 75 jednostek).
- Ranking Moc militarna: Falanga 27->24; Hastati 24->25; Evocati 25->26; Konnica łucznicza asyryjska 26->27. Reszta bez zmian.

## BLOKADY
- Dług testowy (nie w zakresie tematu): legion-vs-falanga-compare.cjs, true-stats-legion-falanga.cjs (klucz Obrażenia), moc-ranking-rozjazd-test.cjs (Konnica 49 vs 98).
- Decyzja do orkiestratora: (1) potwierdzenie meleeAttack=7 / meleeDefence=12 / piercing=4 jako założenia; (2) zgoda na zmianę CSV źródłowego karty tech-cards-top5 („Falanga (Obrona 10)”).
- Dług REPIN Rust (Falanga Atak/Obrona/Przebicie/Bonus/fieldPower) — do wpisu przez orkiestratora.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje r2 na commicie r2; po PASS Final Control (Sonnet), ten sam ID.
DEPLOY/PUSH: NIE WYKONANO
