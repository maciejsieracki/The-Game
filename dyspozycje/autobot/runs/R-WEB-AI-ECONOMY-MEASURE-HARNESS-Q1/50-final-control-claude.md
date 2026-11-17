STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzedzia pomiarowe + hak civTest; bez zmian logiki gry)
TEMAT: R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1
GOAL: harness pomiarowy ekonomii AI (metryki w haku civTest, runner wznawialny, obejscie bramki NNS gracza, dowod 100 tur x2 ziarna, test wznowienia, instrukcja pomiaru #415 ON/OFF)
ZMIANY/COMMIT: kandydat 7f4299061b22d7ac5b3530ce7c92d104be5909d0 (potomek bazy 6d25244ea: `git merge-base --is-ancestor` = tak). Diff vs 6d25244ea: 19 plikow, wszystkie w allowlisccie
  (gra/src/main.ts: 4 linie, wylacznie blok `__aiEconomyMeasure` za civTest; gra/tools/ai-economy-measure-{run,hook-test,upkeep-onoff}.cjs + README; runs/<ID>/**). Brak zmian logiki gry, gra/data, WERSJE.md, manifestu.
  `git diff --check` czyste. Ten raport = jedyny commit FC.
  integration_sha = 7f4299061b22d7ac5b3530ce7c92d104be5909d0 (do zintegrowania z origin/main; `git merge-tree --write-tree` z origin/main c774136ca daje czyste drzewo 168e8f18f, bez konfliktow; po merge powtorzyc bramki).

TESTY (ZMIERZONE przeze mnie, po `npm ci`, na kandydacie 7f4299061):
  - tsc --noEmit: exit 0, 0 bledow.
  - logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; resource-ledger-hook-gate-test 6 passed 0 failed. Wszystkie = punkty odniesienia, brak czerwonych (porownanie z baza zbedne).
  - vite build poza repo (--outDir /tmp/claude-0/fcdist): OK 33,9 s.
  - ai-economy-measure-hook-test bez mutanta: PODSUMOWANIE 10/10 zielone (3m42s). Z `--mutant-dist` (mutacja: przemianowane `utrzymanieJednostekPieniadz` w main.ts, cofnieta po budowie): PODSUMOWANIE 11/11 zielone, mutacja realna CZERWONA ("owner 0 bez utrzymanieJednostekPieniadz ..."). Obejscie NNS: warunek wstepny blokuje, dosypka 0/0 nie odblokowuje, 200/200 odblokowuje, endTurn 1->2. Kontrola negatywna bez ?civTest=1 zielona. 42 wlascicieli, wszyscy z miastem.
  - Dowody 100 tur (przeliczone z JSONL, nie z raportu): seed 4242: 99 wierszy, t100; t2 AI 41/41 miasto, 41/41 jednostka; t50 16 AI, 16 miast, 15 jednostek; t100 14/14/14. seed 777: 99 wierszy, t100; t2 41/41/41; t50 14/14/14; t100 14/14/14. gateBlockedBeforeEnd = 1 tura (t1) w obu, bypassApplied=1, stop=null. Zgodne z raportem operatora.
  - NIE ZMIERZONO przeze mnie: powtorka 100 tur i --resume-test (30-50 min na przebieg, poza limitem 590 s foreground); opieram sie na evidence/r3-* (spojne z moimi przeliczeniami JSONL i summary.json).

ROZSTRZYGNIECIE ZARZUTOW (NAPRAW / ODDAL / DO DECYZJI):
  1. Test wznowienia czerwony 0/10, mutacja wznowienia niezmierzona — ODDAL. Dispatch (DODATEK 1 i 2 N5) wprost dopuszcza "czerwone z powodu #424" bez oslabiania asercji; sprawdzilem: na origin/main brak commita SAVE-LOAD-CITY/#424 (trafienie `--grep=ROUNDTRIP` dotyczy innego tematu, TRUCE-E2E-SAVELOAD). Asercji nie oslabiono. Po #424: powtorzyc `--resume-test` + `--mutant 1`.
  2. Asercja "wartosc AI" slabsza niz litera kryterium — ODDAL. Literalne "jednostki>0 u kazdego AI" nie jest wlasnoscia narzedzia, tylko gry (owner z miastem bez jednostek zdarza sie w grze); narzedzie mierzy i ujawnia (JSONL + lista wyjatkow w komunikacie asercji), a asercja nadal czerwieni przy braku miasta lub >10% AI bez jednostek. Zaostrzenie do 100%/12 tur czerwieni test i nie miesci sie w 590 s (Obrona zmierzyla). Obserwacja (moj przebieg): owner 23 po 1. turze ma 0 jednostek, choc w JSONL seed 4242 t2 wszyscy 41 maja jednostki — rozne przebiegi tego samego ziarna (patrz UWAGI).
  3. Brak mutacji poprawki "fantomowych ownerow" — ODDAL. Po poprawnym starcie stan fantomowy nie wystepuje, wiec mutacja cofajaca poprawke jest zachowaniowo nierozroznialna; jawny sygnal `diag.aiStartOwnersBezWiersza` + asercja "bezWiersza=[]" jest zielona (zmierzone). Nie blokuje celu tematu.
  4. t50 seed 4242: jeden AI z miastem bez jednostek — ODDAL (zachowanie gry, opisane jawnie, narzedzie go nie ukrywa).
  5. Brak jednego ciaglego przebiegu 1-100, skutecznosc `stuckQueueHeals` niezmierzona — ODDAL z NOTATKA. Dispatch dopuszcza jawne zatrzymanie i wznowienie z zapisu; przyczyna zatrzymania opisana (zalegajaca kolejka bitew). Uwaga interpretacyjna: segmenty po wznowieniu (t50-100 / t80-100) niosa dryf ze SAVE-LOAD (#424), wiec dane ekonomii z tych segmentow nie sa bit-identyczne z przebiegiem ciaglym.
  6. Pomiar #415 ON/OFF 100 tur niewykonany — ODDAL. Poza zakresem tematu ("narzedzie + dowod dzialania", DODATEK 1 pkt 6 dopuszcza NIE ZMIERZONO); skrypt gotowy, ref `refs/keep/R-WEB-AI-UPKEEP-Q2-r2-fc` istnieje (23550656).
  7. "11/11" vs 10/10 — ODDAL. 10/10 bez `--mutant-dist`, 11/11 z nim (obie wartosci potwierdzone moim przebiegiem).
  8. Brak merge z affc50fa4/c774136ca — ODDAL (obowiazek integracji). merge-tree z origin/main czysty; bramki do powtorzenia po merge (wikiBundle moze wymagac `node tools/bundle-wiki-for-game.cjs`, jesli pojawi sie konflikt).
  NAPRAW: brak. DO DECYZJI CZLOWIEKA: brak decyzji produktowej.

ZGODNOSC Z GOAL/REGULAMI: (1) metryki per owner w haku za civTest - tak; (2) runner wznawialny z zapisem co N tur i JSONL - tak; (3) obejscie NNS tylko dla gracza, jawnie zapisane, AI nie ukrywane - tak; (4) 100 tur x2 - tak (po wznowieniu), test wznowienia - czerwony z powodu #424 (dopuszczone); (5) instrukcja #415 ON/OFF - tak, bez wprowadzania flagi do main.
BLOKADY: brak blokujacych. Otwarte (nie blokuja): resume-test + mutacja po #424; pomiar #415 ON/OFF 100 tur; README bez wprost ostrzezenia, ze segmenty po wznowieniu niosa dryf #424 (mozna dopisac przy kolejnej okazji).
RUNDY: FC dla rundy 3/5; werdykt PASS-WITH-NOTES.
NASTEPNY KROK: orkiestrator: merge 7f4299061 z origin/main, ponowne bramki (tsc + 6 testow + hook-test), integracja; po #424 powtorzyc --resume-test i dodac --mutant 1; osobno zmierzyc #415.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA (poza zakresem, bez zakladania zadan):
  - Niedeterminizm/anomalia: w moim hook-tescie (seed 4242, newgame) owner 23 mial miasto i 0 jednostek po 1. turze, a w JSONL operatora (ten sam seed) wszyscy 41 AI mieli jednostki w t2. Moze nalezec do tematu #421 (anomalia hashu determinizmu); NIE zbadano.
  - Zalegajaca kolejka odlozonych bitew blokujaca "Zakoncz ture" (t51/t89) - kandydat R-WEB-*, powiazane z #418 (hipoteza niezweryfikowana).
  - Zakres #424 szerszy niz podzialPracy (magazynZywnosci, budowaPriorytetTypow, budowaLista, postepBudynkowUsuniete, wealthState.pula, units[].stackGroupId) - wg operatora.
