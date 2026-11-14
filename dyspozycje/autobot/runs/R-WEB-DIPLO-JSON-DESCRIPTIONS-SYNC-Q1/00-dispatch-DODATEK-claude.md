# R-WEB-DIPLO-JSON-DESCRIPTIONS-SYNC-Q1 — DODATEK orkiestratora (runda 1)

## Zgłoszone rozbieżności (Operator i Evaluator R-WEB-DIPLO-CIVPEDIA-Q1; sprawdź każdą w kodzie, zanim cokolwiek zmienisz)
1. gra/data/diplomacy.json ok. l.442–455 i 742–749: tabele referencyjne z wierszami „Wspólna/Odmienna religia” ±0,5 (kod czyta wspolnaReligia_zaufanie_perTura = 0 i odmiennaReligia_zaufanie_perTura = 0, l.26–27; DIPLOMACY_PARAMS w diplomacy.ts ok. 158–160). Popraw na zgodne z kodem (0 / brak wpływu) albo oznacz jako historyczne.
2. diplomacy.json ok. l.234–259: opisy akcji (np. −30/−25/−15 Relacji, −20/−10 Zaufania) niezgodne z parametrami (zlamanaPakt −40, zerwanie −15 itd.). Ustal faktyczne wartości z kodu/params i popraw teksty. Jeśli tekst jest wyświetlany graczowi, nie zmieniaj logiki, tylko treść.
3. Kary za sąsiedztwo (−3/−4/−5, wstrzymane w karencji), zaufanie po rozejmie 10 i po pokoju 20 — jeśli opisy w diplomacy.json lub komentarze diplomacy.ts ok. 985–993 wciąż podają −2/−3/−4 albo religię, popraw.
4. Komentarze diplomacy.ts ok. 1103–1108 (opisują stary próg 30 i limit wojenny 29): popraw TYLKO komentarze na zgodne z obecnym stanem (w wojnie zaufanie spada do zera, limitu 29 nie ma; etykiety wg zaufania: <10 Wrogi, 10–29 Nieufny).
5. Przeszukaj gra/data/diplomacy.json i diplomacy-war-peace-params.json pod kątem innych opisów liczb zaufania/relacji niezgodnych z kodem; wypisz, ale poprawiaj tylko te pewne.

## Kryteria końca (binarne)
- git diff wartości liczbowych czytanych przez kod = pusty (dowód: test porównujący wszystkie pola params przed i po albo diff JSON ograniczony do pól opisowych); zachowanie gry bez zmian.
- tsc --noEmit exit 0; logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; diplomacy-test 148/0; diplo-civpedia-values-test i admin-panstwo-panel-names-test zielone.
- Nowy test gra/tools/diplo-json-descriptions-sync-test.cjs: czyta params i teksty opisowe i sprawdza zgodność kluczowych liczb (kary sąsiedztwa, religia 0, zaufanie po rozejmie/pokoju, kary wiarygodności z params); mutacja liczby w opisie czerwieni test.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Dysk bywa < 8 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A.
