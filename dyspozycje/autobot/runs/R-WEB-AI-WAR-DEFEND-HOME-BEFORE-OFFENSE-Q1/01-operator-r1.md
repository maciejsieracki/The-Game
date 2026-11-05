STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-WAR-DEFEND-HOME-BEFORE-OFFENSE-Q1
GOAL: AI w wojnie najpierw odbija wlasne utracone miasta (P1) i zwalcza wrogie wojsko na wlasnym terenie (P2), dopiero potem zdobywa cudze (P3); koniec symetrycznej "wymiany miast".

## ZMIANY / COMMIT
SHA: patrz `git log` galezi roboczej (commit "R-WEB-AI-WAR-DEFEND-HOME-BEFORE-OFFENSE-Q1 r1"); baza origin/main 98ef746c2. PUSH NIE.
- NOWY `gra/src/game/ai-war-home-defense.ts` -- czysty planer P1/P2 (klastry najezdzcow, ocena sily, histereza, pamiec per wlasciciel, flaga + override do testow).
- `gra/src/game/ai.ts` -- `decideAITurn` po rdzeniu wola `applyHomeWarPriorities` (ostatnie slowo nad rozkazami ruchu: po war-allin i kampanii wodza; PM/defensiveCopy pominiete); `aiUnitCombatStrength` = `siegeAi.estimateUnitCombatStrength` (ta sama ocena co atak ostatniej woli).
- NOWE testy/narzedzia: `gra/tools/ai-war-defend-home-{test,sim,measure}.cjs`.
- AKTUALIZACJA `gra/tools/war-allin-capital-test.cjs` 1k: "ruch" -> "ruch lub atak" (P2 zamienia czesc marszow w ataki; PRZED moves=244 battles=26, PO moves=217 battles=36; aktywnosc 270 vs 253 >= 224).
- Zero zmian: balans, gra-robocza, WERSJE.md, rust-port, src-tauri, main.ts (nie bylo potrzeby).

## DIAGNOZA PRZED (plik:linia)
Przyczyna "wymiany": ostatni krok `decideAITurn` -> `applyWarAllInCapitalToCommands` (ai.ts ~4133 przed zmiana) kasuje KAZDY rozkaz ruchu jednostki bojowej (poza atakiem/wejsciem na wrogie miasto) i zastepuje marszem na stolice wroga -- takze obroncow z `homeDefenderAssignments` (ai.ts ~3567/3939) i jednostki kampanii wodza (`appendAiGeneralCampaignOrders`, wczesny return ~3462). Obrona domu 1:1 dziala tylko gdy war-allin nieaktywny. Nic nie odbijalo utraconych miast: cel = najblizsze/stolica wroga (bramka 8 hex C-AI-MOC-Q2 + war-allin), `capturedFromOwnerId` nieuzywane przez AI. Zbiorka zastepcza (`planWarReplacementRally`) i stos (`planFieldStackGather`) wylaczaja tylko grupy w kontakcie z wroga armia, nie wracaja na wlasny teren.
Scenariusz T1 (2 cywilizacje, obie armie 6 poza domem, puste miasta): PRZED stolice padaja w t=4 (b->a1) i t=5 (a->b1) = wymiana.

## ZASADY (progi, ZALOZENIA bez ABC)
- Kolejnosc przydzialu: P2 (wrog NA wlasnym terenie, pilne) przed P1, oba przed P3 (rdzen bez zmian dla reszty jednostek).
- Wlasny teren: `opts.territoryNodes` (fallback: promien miast). Najezdzca = jednostka bojowa cywilizacji w wojnie (barbarzyncy poza zakresem -- zostaja przy dotychczasowej obronie 1:1, zob. NIE_ZMIERZONO).
- Sila: `estimateUnitCombatStrength`. ATAK gdy sila (przydzielone + nieprzydzielalna obecna) >= 80% sily najezdzcow (10:8 jak ostatnia wola); inaczej obrona w miescie najblizszym najezdzcy (zbiorka).
- Histereza: tryb trzymany min. 3 tury; wejscie w atak od 0.8, zejscie ponizej 0.6; obrona max 12 tur na wroga, potem zwolnienie (brak zawieszenia AI).
- Prog "zagrozenie MALE": sila najezdzcow <= 25% sily calej armii polowej -> kampania/armia kontynuuje, odrywany tylko oddzial (najblizsze jednostki do 125% sily najezdzcow, licząc obecne nieprzydzielalne); wieksze -> wszystkie wolne jednostki polowe wracaja (poza atakujacymi/wchodzacymi na wrogie miasto w tej turze).
- P1: miasto z `capturedFromOwnerId == ja`, wlasciciel w wojnie, w promieniu 16 od moich jednostek/miast, wiek <= 60 tur od zauwazenia; odbicie gdy sila / obrona miasta (jednostki wroga w r<=1) >= 1.0 (zejscie < 0.8), cel trzymany (histereza). Brak trasy -> rozkaz rdzenia zostaje.

## TESTY (logi `gate-*.txt`, kazdy z linia `EXIT=`)
- `ai-war-defend-home-test.cjs`: 30 passed / 0 failed (EXIT=0). T1 wymiana: PRZED exchanges>=1, PO=0 (armie wracaja); T2 obrona bije najezdzce (PRZED a1 stracone t=7, PO miasto stoi, najezdzcy zwalczeni); T3 odbicie przed zdobyciem (PO odbija z2 przed b1; PRZED odwrotnie); T4 za slaby -> miasto (test strazniczy, PRZED zachowuje sie tak samo); T5 maly najezdzca: wraca 1..3 z 10, reszta naciska; T6 histereza (pasmo, min. 3 tury, zwolnienie po 12); T7 determinizm (ten sam hash) i czas AI bez wzrostu; T8 4 mutacje wykryte; T9/T10 zero ingerencji bez zagrozenia, P3 nietkniete (te same zdobycze).
- tsc --noEmit: EXIT=0 (`gate-tsc.txt`).
- Pelne przebiegi 120 tur x 6 ziaren (4-6 AI, wojna wszystkich, silnik zastepczy, `gate-measure.txt`): wymiany par 0/0; "wymiana szeroka" (zdobycie przez cywilizacje, ktora w 30 tur wczesniej sama stracila miasto) PRZED=6 PO=1; zdobyte miasta 33 -> 4; odbicia 4 -> 2; jednostko-tury wroga na terenie AI (r<=3 od miast) 1225 -> 189; epizody >=5 tur 28 -> 6; najdluzszy epizod 33 -> 5 tur; sredni czas tury 154.6 -> 155.9 ms (symulacja, wiekszosc to rdzen AI).
- Regresje (`gate-regress-base.txt` vs `gate-regress-po.txt`, 43 testy z listy, bez *live*): wynik IDENTYCZNY po normalizacji; ten sam zbior czerwonych PRZED i PO (pre-existing, niezwiazane): ai-home-defense-vs-barbarians (T2,T4,T5), army-panel-recruit-rally-general, forced-war-bronze-main-guard, forced-war-bronze-new-game-reset, general-capital-recruitment-order, generals-purchase-runtime. war-allin-capital-test 98/0 po aktualizacji 1k. (ai-move-full-range PRZED=TIMEOUT tylko z obciazenia rownoleglego; PO=20/0, samodzielnie zielony.)
- Klasyfikacja 3 FAIL `ai-home-defense-vs-barbarians-test`: T2 i T4 = A (przestarzaly): zalozenie "jednostka dostaje komende marszu na odlegle wrogie miasto" zlamane przez pozniejsza bramke 8 hex (C-AI-MOC-Q2) -- brak komendy to poprawne zachowanie; T5 = A (przestarzaly): przy domyslnie wlaczonej konsolidacji (R-WEB-ARMY-CONSOLIDATION) B dostaje ruch zbiorki; z konsolidacja OFF i flaga OFF [] (wymog "0 komend" spelniony). Brak bledu B w obronie; nie edytowano (poza zakresem -- do decyzji, rekomendacja: przepisac asercje T2/T4/T5 pod bramke 8 hex i zbiorke).
- NIE_ZMIERZONO: live Chromium/main.ts (main.ts niewywolywalny headless; `*live*` pominiete); realna gra z mgla, ekonomia i murami; zachowanie barbarzyncow (ownerId -1) pod war-allin (rowniez nadpisuje obrone domu -- kandydat na osobny temat); kolejnosc ruchow gracza przed AI.

## BLOKADY
Brak. Uwagi: model walki/zasobow w symulacji uproszczony, wartosci bezwzgledne metryk orientacyjne; kierunek (spadek wymian, zdobyczy i obecnosci wroga na terenie) jednoznaczny w 6/6 ziarnach.

## RUNDY
1/5

## NASTEPNY KROK
Evaluator: przejrzec progi (0.8/0.6, 3 tury, 12 tur, 25%, 125%, r=16, wiek 60) i zalozenie kolejnosci P2 przed P1; zweryfikowac diff, brak wplywu na gracza/PM/barbarzyncow; ewentualna decyzja ws. przepisania T2/T4/T5 starego testu.

DEPLOY/PUSH: NIE WYKONANO
