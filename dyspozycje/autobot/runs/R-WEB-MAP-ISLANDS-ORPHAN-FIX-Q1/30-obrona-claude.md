STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MAP-ISLANDS-ORPHAN-FIX-Q1 (MAPFIX2), runda obrony 1 (Operator HAIKU 5.5)
GOAL: obrona kandydata 117d004469fc7fbf3d3a9bf112696ac7a694fa21 wobec zarzutów Evaluatora (088f8bc7950ae427129bb19256ffa690b684b2ea). Kod NIE zmieniony w tej rundzie (brak poprawek wymaganych przez zarzuty; zarzut 3 przyjęty i zmierzony, ale wymaga decyzji orkiestratora, patrz niżej).
ZMIANY/COMMIT: brak zmian w gra/ (czubek kodu = 117d00446, nie zmieniony). Commit tej rundy: tylko dyspozycje/autobot/runs/R-WEB-MAP-ISLANDS-ORPHAN-FIX-Q1/30-obrona-claude.md. Środowisko: w worktree zainstalowano zależności gra/node_modules (npm ci --ignore-scripts, nie w commicie); pomiary w scratchpadzie poza repo.

ODPOWIEDZI NA ZARZUTY:

Zarzut 1 (map-gen-regression niezmierzony) — PRZYJMUJĘ, ZMIERZONE CZĘŚCIOWO.
 Odtworzyłem sekcje twardych naruszeń map-gen-regression-test.cjs na kandydacie (ten sam generator, te same kryteria i zestawy ziaren 42/123/777/7/2026, typy kontynenty/pangea/wyspy/ziemia, rivers medium i high):
 - standardowy, 40 map (5 ziaren x 4 typy x 2 poziomy rzek): orphanCount = 0 (40/40), solitaryLand = 0 (40/40), checkTributaryJunctions = 0 naruszeń (40/40), trasy bez ujścia = 0, główne bez REALNEGO morza = 0. Maks. czas jednej generacji 409 s na tym hoście (4 CPU, współdzielony).
 - mały, 40 map: badOutlet = 1 (seed 777, wyspy, high) — IDENTYCZNIE na bazie 6319eaf66 (badOutlet = 1, mainN 121, paths 229): stare, nie z tej zmiany. orphan = 0, badReal = 0.
 - pangea standardowy, rivers medium, seedy 42/123/777/7/2026: masa=1, dominantRatio=1; bboxFill 0.8833 / 0.8814 / 0.8757 / 0.8657 / 0.8742; próg bboxFill<0.87 nie spełniony przez 4 z 5 ziaren (42, 123, 777, 2026). IDENTYCZNE wartości na bazie 6319eaf66 — stare, nie z tej zmiany.
 - determinizm (seed 42, standardowy, kontynenty, medium, dwa przebiegi w jednym procesie): hash 7db77e46 == 7db77e46 -> IDENTYCZNY.
 Suma twardych naruszeń wg logiki testu (pangea bboxFill x4 + mały badOutlet x1 + zera resztą) = 5, czyli tyle co baza 690947a2a (5). Wniosek ostrożny: nie pogorszenia; baza nie została przeliczona we wszystkich 40 standardowych mapach (zrobiono ją na pozycjach, które dają naruszenia).
 NIE ZMIERZONO w tej rundzie: pełne wykonanie map-gen-regression-test.cjs (zawiera limity czasu AC, które są tylko WARN, nie twarde naruszenia); world-density, river-loop, river-path-adjacency (ciężkie, timeouty w ocenie); pozostałe lekkie testy (river-*, cluster-plan-name, earth-template) — poza zakresem tej odpowiedzi.

Zarzut 2 (rivers=high zamiast medium) — ODRZUCAM z dowodem.
 Test celowo używa rivers=high: to poziom MAKSYMALNY, a reguła właściciela (ZASADA TESTOWANIA, 2026-11-26) każe mierzyć na maksimum. Dispatch mówił o medium sprzed tej reguły.
 Dodatkowo medium jest pokryte pomiarem: w 40 standardowych mapach (w tym 20 z rivers=medium, wszystkie 5 ziaren x 4 typy) orphanCount = 0 i solitaryLand = 0. Brak pokrycia medium w TEŚCIE pozostaje (test ma tylko high) — nie dokładam drugiego przypadku, bo test i tak trwa ~7 min (zarzut 4).

Zarzut 3 (clearStrayWaterRiverMarks: wpływ wizualny i na ujścia niezmierzony) — PRZYJMUJĘ jako ustalenie, ZMIERZONE; NIE naprawione w tej rundzie.
 Zmierzone (mapa mała, porównanie baza 6319eaf66 vs kandydat, te same ziarna i typy, rivers=high):
 - znaczniki rzeki na heksach WODNYCH: 42/kontynenty 425 -> 237; 42/wyspy 821 -> 420; 777/kontynenty 658 -> 351; 777/wyspy 1016 -> 546; 42/pangea 43 -> 17; 777/pangea 23 -> 8; 42/ziemia 0 -> 0; 777/ziemia 1 -> 0. Zmiana zakresu: wyłącznie usunięcia, 0 dodanych znaczników (addedInCand = 0 we wszystkich parach).
 - ujścia i trasy: kandydat ma badOutlet = 0 i badReal = 0 na 40 standardowych mapach; na małych mapach jedyne badOutlet=1 (777/wyspy/high) jest identyczne na bazie. riverPaths nie są modyfikowane przez clearStray (funkcja działa tylko poza trasami); wpływ na ujścia pośrednio: przerwany łańcuch tras po purge naprawia już pętla purge+ensureRiverOutlets.
 - WPŁYW NA GRĘ (nowy, ważny): znaczniki na wodzie są czytane przez logikę dostępu do wody: hasFreshwaterAccess / improvement-build („przy rzece”), auto-improvements (irygacja, tartak/obóz), okolica.ts, turn-economy.ts (maRzeke), startScoring.ts, ai.ts. Usunięcie znacznika z heksu wodnego odbiera „dostęp do rzeki” sąsiednim heksom lądu, które nie mają innego źródła. Zmierzone (heksy lądu z dostępem = własny znacznik lub znacznik sąsiada, bez riverPaths):
   - standardowy 42/kontynenty/high: lądu 6047; z dostępem baza 5762 -> kandydat 5752; UTRACONE 10; ZYSKANE 0.
   - mały 777/wyspy/high: lądu 3996; baza 3750 -> kandydat 3727; UTRACONE 23; ZYSKANE 0.
   - mały 42/kontynenty/high: lądu 2398; baza 2203 -> kandydat 2202; UTRACONE 1; ZYSKANE 0.
   Skala: 0,02–0,6% heksów lądu. Przybliżenie: bez riverPaths i bez innych warunków hasFreshwaterAccess, więc to górna/dolna ocena rzędu wielkości, nie dokładna liczba.
 - Wizualnie: NIE ZMIERZONO (brak renderu w tej rundzie). Znaczniki na wodzie są sterowane przez syncRiverEdgeBonusHexes; usunięcie zmienia rysowanie krawędzi rzek przy brzegu.
 Dlaczego nie naprawione tutaj: znaczniki na wodzie poza trasami są właśnie źródłem osieroconych heksów (orphanCount). Przywrócenie ich bez zmiany warunku oznacza powrót regresji orphan. Kompromis (np. zachować znacznik tylko na wodzie przylegającej do lądu, albo wpisać go jako część trasy) to zmiana mechaniki dostępu do wody — decyzja orkiestratora/FC; proponuję zgłosić ją jako ABC z konsekwencją w grze (ile heksów lądu traci dostęp do wody i irygacji, ~10–23 na mapę).

Zarzut 4 (test ~7 min poza lekkimi bramkami) — PRZYJMUJĘ jako notę. Bez zmiany kodu: test pozostaje ręczny (nagłówek pliku to mówi). W bramkach lekkich nie figuruje. Pomiar tej rundy (40 standardowych map, kilka przebiegów równoległych) trwał kilkadziesiąt minut na 4 CPU, więc nie nadaje się do bramki lekkiej.

TESTY (surowe wyniki tej rundy):
 - git checkout --detach 117d004469fc7fbf3d3a9bf112696ac7a694fa21: HEAD = 117d00446 (potwierdzone).
 - Pomiar: 40 standardowych map (run1.cjs; wyniki w scratchpadzie mf2/results.jsonl): sumy orphan=0, solitary=0, trib=0, badOutlet=0, badReal=0.
 - Pomiar: 40 małych map (maly.jsonl): badOutlet=1 (777/wyspy/high; identycznie na bazie), badReal=0, orphan=0.
 - Pangea shape (5 ziaren, kandydat i baza): identyczne wartości; 4 z 5 niezaliczone przez bboxFill (baza=kandydat).
 - Determinizm 42/kontynenty/medium: 7db77e46 == 7db77e46.
 - Porównanie znaczników rzeki base vs kandydat (riv.jsonl) i dostępu lądu (acc-*.json): jak wyżej.
 - Czasy: standardowa mapa 29–409 s (4 CPU, współdzielony host); AC limit 7 s to WARN, nie hard.
 - Kod nie zmieniony, więc tsc/logic/tech-tree/research/unit/combat/ai-test z Operatora pozostają jako w 10-operator-claude.md (nie powtarzano).
 NIE ZMIERZONO: wizualna ocena wysp z rzekami (zarzut 3); pełne map-gen-regression (timing); world-density/river-loop/river-path-adjacency; mutacja czerwona na bazie tym testem (wynik Operatora: baza orphan=10 na 777/high — z MAPREGDIAG).

BLOKADY: decyzja orkiestratora w sprawie dostępu do wody (zarzut 3). Bez niej nie ma poprawki w kodzie; kandydat jest poprawny pod orphan/solitary, ale zmienia dostęp do wody na ~10–23 heksach lądu na mapę.

RUNDY: 1/5 (obrona). Ocena Evaluatora: 1.
NASTĘPNY KROK: orkiestrator/FC: (a) zdecydować zarzut 3 (zaakceptować kandydata z utratą dostępu do wody na 0,02–0,6% lądu, albo zlecić wariant zachowujący znacznik przy lądzie — to pytanie ABC o skutek w grze); (b) zmierzyć wizualnie wyspy z rzekami po deployu; (c) opcjonalnie pełne map-gen-regression w osobnym oknie czasu.
DEPLOY/PUSH: NIE WYKONANO
