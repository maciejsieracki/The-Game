STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; logika gry bez zmian)
TEMAT: R-WEB-AI-AI-TREATIES-LIVE-PROOF-INERT-Q1 (Final Control, runda 4/5)
GOAL: niezalezny werdykt dla kandydata af72e15ef477b3de1fdc2b2f17d26f1857f6f92f (baza db29c24d1a1070411035fd21139312a381fd7c43).

ZMIANY-COMMIT: kandydat af72e15ef; merge-base --is-ancestor db29c24d1 -> af72e15ef: TAK. git diff --stat: 22 plikow, +1790; poza runs/<ID>/** tylko gra/src/main.ts (+38, wylacznie hak civTest __truceTestDebug.aiAiNapLiveProof: concludeNap / setRelation (SETUP) / state (odczyt)) oraz 3 nowe gra/tools/ai-ai-treaty-live-proof-*.cjs. Allowlista zachowana; ai-ai-treaty-tick/evaluate/params, diplomacy.ts, ai.ts bez zmian; torAktywny nietkniety.

TESTY (wlasne, surowe wyniki):
- tsc --noEmit: exit 0. logic 213/213; tech-tree 20 pass/0 fail; research 33/33; unit-replace 21/21; combat 6/6; ai-ai-treaty-evaluate 21 pass/0 fail, mutanty niewykryte 0; ai-ai-treaty-nap-wiring ZIELONE.
- breach (wlasny bundle vite poza repo, zywy Chromium, ziarno 4242): 12 OK / 0 FAIL. ON dRespekt -30, OFF 0 (roznica -30); LOW 20->0 (clamp); rejestr pary: zlamana_obietnica_ai delta -20 (ON i OFF), potem wojna_wypowiedziana -80. Zarzut 1 odparty/poprawiony.
- wiring-test na zacommitowanych dowodach: clean 4 OK/0 FAIL (59 tur, skarbiec min 0, NAP=1 Egipt(1)-Fenicjanie(22), dopl. 829, 0 pageerror); MUTANT-D0 3 OK/1 FAIL (A3). Zarzuty 2 i 5 (w zakresie repo) odparte.
- Zarzut 4 (rozbieznosc D): z seed4242.jsonl wynika, ze NAP zawarto w OSTATNIEJ turze (60): Egipt 7658->9078 (+1420 vs ok. +480 trendu), Fenicjanie 4385->4049 (-336 vs ok. +420 trendu), tj. ok. -830 / +940 = zgodne z przelewem 829. Wczesniejsze "113 vs 829" porownywalo zla ture (t21-22). Planer wymaga D<=skarbiec platnika (kod ai-ai-treaty-tick.ts), przelew potwierdzony posrednio przez dane. ZALOZENIE: zamkniete jako zgodne (dokladna kwota NIE ZMIERZONO bez haka stanu w chwili ticku).

ZARZUTY: 1,2,4,5 = ODDAL/poprawione. 3 (liczniki ticku/prob/odmow) = uwaga: wymaga haka w ciele funkcji ticku (poza allowlista); NAP=1 zawarte, wiec "licznik odmow" nie jest warunkiem koniecznym; NIE ZMIERZONO. 6 (duplikat koncowki akceptacji w haku) = uwaga mniejsza, hak testowy. 7 (Target page closed przy wznowieniu) = uwaga, wiring z jednego przebiegu.

BLOKADY: brak blokujacych.
UWAGI-DLA-ORKIESTRATORA: (a) wojna loguje -20 Zaufania (zlamana_obietnica_ai) rowniez przy torAktywny=false (OFF) - zachowanie istniejace, nie zmieniane tym tematem; (b) liczniki ticku/odmow i wspolna funkcja akceptacji - ewentualny osobny temat; (c) punkt (1) inertnosc zamkniety w r1 (24/24), nie powtarzany; (d) wiring z 1 ziarna/1 przebiegu - E6 powinno uzyc wiecej ziaren.
RUNDY: 4/5; werdykt Final Control PASS-WITH-NOTES.
NASTEPNY KROK: integracja orkiestratora (merge do main wg 5a: sprawdz is-ancestor i diff --stat), rejestry.
DEPLOY/PUSH: NIE WYKONANO
