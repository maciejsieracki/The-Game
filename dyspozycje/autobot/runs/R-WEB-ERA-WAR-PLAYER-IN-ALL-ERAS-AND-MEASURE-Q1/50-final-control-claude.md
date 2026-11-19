STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: gracz jako cel wojen epoki Kamienia/Brazu/Zelaza jak AI, bez zmiany progow 40 tur, licznikow, kosztow; narzedzie pomiarowe; bieg dymny; testy.
ZMIANY-COMMIT: kandydat 8af54d2dca422bac44878bf03ea0f35a9797e10c; `git merge-base --is-ancestor ea4863ef0 8af54d2dc` = OK. `git diff --stat` (8 plikow, +552/-77): main.ts, era-war-measure-run.cjs, era-war-engine-scenario-test.cjs, era-war-defer-not-cancel-test.cjs, forced-war-iron-main-guard-test.cjs, forced-war-stone-main-guard-test.cjs, 10-operator, 30-obrona. Wszystko w allowliscie rozszerzonej; war-rules-params.json bez zmian wartosci (progi 40 nietkniete).
TESTY (wlasne, surowe wyniki; node_modules = symlink do sasiedniego worktree, odczyt):
 tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6;
 era-war-player-included 10/0; era-war-delays 55/0; era-war-defer-not-cancel 29/0; era-war-bronze-player-target 44/0; era-war-ignore-treaties 22/0; era-war-engine-scenario 9/0;
 forced-war-bronze 48/0; iron 55/0; multi-turn-simulation 48/0; stone 31/0; bronze-main-guard 22/0; iron-main-guard 36/0; stone-main-guard 15/0.
 Bramki referencyjne zielone; zarzuty 7 i 8 rozstrzygniete (naprawione / nieaktualne).
OCENA ZARZUTOW:
 1 SLUSZNY, NAPRAW: test silnikowy nie wykonuje sekwencji Kamien->Braz pending->pokoj->start (naglowek pliku: "NIE ZMIERZONO", "nie odtwarza calej petli main.ts"); wymog dispatchu r2 pkt 3 (realny tor + mutacja main.ts/forced-war-common.ts) niespelniony.
 2 SLUSZNY, NAPRAW: brak biegu 120 tur x seed 4242 i 7 oraz tabeli per epoka (r2 pkt 2). Jedyny dowod = fragment 83/120 tur seed 4242. Powod "dysk 3 GB" nie przechodzi: bieg wymaga bundla poza repo i jednego Chromium, nie npm ci (node_modules mozna podlinkowac, jak zrobilem w tej rundzie); runner bez wznawiania to nadal defekt.
 3 NAPRAWIONE (obrona: mutacja 27/2 po cofnieciu, 29/0 po przywroceniu; regex T8 wymaga eraWarTargetDelayOk + pin). Zaakceptowane; zachowanie eraWarTargetDelayOk bez testu na zywo (odnotowane).
 4 SLUSZNY, NAPRAW: hak __eraWarMeasure (main.ts:34017) daje stan per cywilizacja, attempts() = przydzialy assignForcedWarPairings (bez wyniku/powodu odrzucenia bramki), brak stanu wojny naturalnej; r2 pkt 1 niespelniony w czesci "powod odrzucenia/bramka" i "wojna naturalna".
 5 SLUSZNY, NAPRAW: gracz jako cel Kamienia = 1 zdarzenie z 1 biegu; brak testu toru lub drugiego ziarna (r2 pkt 4).
 6 NAPRAWIONE DEFENSYWNIE: backfill wejscia gracza (main.ts ~45605) przed playerEraPoolEligible; engine-scenario S1/S2 pokazuja efekt (mutacja bez backfillu czerwona). Przyczyna zrodlowa braku wpisu NIEUSTALONA, live NIE ZMIERZONO.
 7, 8: zielone (patrz wyzej).
BLOKADY: (a) brak biegu dymnego 120 tur x 2 ziarna i tabeli; (b) hak bez powodow odrzucen i stanu wojny naturalnej; (c) brak testu sekwencji silnikowej Kamien->Braz->pokoj->start z mutacja main/common; (d) brak testu/ziarna dla gracza-celu Kamienia; (e) backfill i eraWarTargetDelayOk niezweryfikowane na zywo. Kod zmian jest bezpieczny wzgledem bramek, ale temat nie dostarczyl wymaganych dowodow, wiec brak podstaw do integracji.
RUNDY: 3/5 zuzyte (r1 FC FAIL; r2; r3 obrona BLOCK). Ten FC = FAIL; nastepna to r4/5.
NASTEPNY KROK: orkiestrator: runda 4 (ten sam ID, baza 8af54d2dc): podlinkowac node_modules lub zwolnic dysk; (1) rozszerzyc hak o powod odrzucenia bramki i wojne naturalna; (2) bieg 120 tur seed 4242 + 7 z runnerem wznawianym (JSONL poza repo) i tabela per epoka; (3) test sekwencji silnikowej przez realny tor + mutacja; (4) potwierdzic gracza jako cel Kamienia. Nie zmieniac progow.
UWAGI-DLA-ORKIESTRATORA: dysk wolny 1,4 GB na starcie (97%); sprzatanie worktree sasiednich tematow zalecane przed r4. gra/node_modules w tym worktree to symlink do wf_dcd6634e-ef9-3 (poza commitem). Nie utworzono sesji/zadan/harmonogramow.
DEPLOY/PUSH: NIE WYKONANO
