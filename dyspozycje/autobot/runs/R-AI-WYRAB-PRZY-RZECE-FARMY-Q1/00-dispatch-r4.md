# DISPATCH — R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, runda 4

TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 4 z 5)
DOMAIN: GAME
DATA: 2026-08-27

## ECHO WLASCICIELA (2026-08-27, doslownie, zastepuje litery A/B/C pytania R4-Q1)

„AI powinno budowac mniej wiecej wszystkie ulepszenia poza zywnoscia, tylko w miare potrzeby,
czyli surowcowe, wtedy kiedy brakuje surowcow, a nie budowac na zapas, nie wiadomo po co. Brakuje
drewna — trzeba wybudowac surowiec drewna. Brakuje brazu — trzeba wybudowac braz. To powinno byc
sygnalem do wybudowania pozostalych ulepszen. W innych wypadkach powinna byc tylko i wylacznie
inwestycja w zywnosc. [...] to jest dla AI z cywilizacji oraz dla parametru dla gracza, kiedy
wybierze zrownowazony. [...] AI, zarowno w cywilizacji, jak i w ludzkich domach, powinno domyslnie
budowac ulepszenia tam, gdzie sa obywatele. [...] z wylaczeniem surowcow, ktore moga znajdowac sie
w roznych miejscach wedlug potrzeby. Gracz musi nacisnac przycisk «buduj» tylko w miejscach, gdzie
sa obywatele. [...] jezeli AI widzi, ze nie ma zapotrzebowania na surowce, bo sa w nadmiarze, i nie
ma potrzeby ulepszac terenu w miejscach, gdzie pracuja obywatele, powinna przestac budowac dla
sztuki i przesunac srodki. Jesli w przypadku cywilizacji AI srodki przeznaczone sa bardziej na
budynki, a w przypadku czlowieka lub gracza gracz sam zauwazy, ze ma za duzo zapasow na ulepszenia,
moze odpowiednio przesunac suwak na rzecz budynkow."

**R4-Q2 ECHO = C** (przelacznik „wolno wycinac las" w panelu ustawien automatu GRACZA, per
panstwo/per miasto; wartosc domyslna: **wylaczony** — zachowanie identyczne z dzisiejszym,
zgodnie z §14, dopoki wlasciciel nie powie inaczej).

## ROZBICIE NA TRZY ZASADY (z ECHO powyzej, potwierdzone weryfikacja zrodel przez orkiestratora)

**Zasada 1 — budowanie napedzane popytem.** Domyslnie: caly budzet ulepszen idzie w zywnosc.
Wylacznie gdy AI ma **niedobor** konkretnego surowca, przestawia budowe na ulepszenia surowcowe
(i inne niz zywnosciowe) — dopoki niedobor trwa. Dotyczy **AI CYWILIZACJI** oraz **AI GRACZA**
na ustawieniu „zrownowazone" (trzy pozostale ustawienia automatu gracza — „zywnosc", „surowce",
„infrastruktura" — sa jawnym wyborem gracza wbrew domyslnemu zachowaniu i **NIE** sa ruszane).

*Punkt zaczepienia w kodzie (zweryfikowany, nie zgadywany):* mechanizm reagowania na niedobor
**juz istnieje** — `AI_IMPROVEMENT_FOR_DEFICIT` (`ai.ts:1822-1829`) mapuje niedobor surowca na
ulepszenia, `improvementPriorityForDeficits` (`ai.ts:1904-1914`) **PRZESTAWIA priorytet** (niedobor
do przodu kolejki), ale **nie ogranicza** budowy do samej zywnosci w braku niedoboru — dzis zawsze
buduje sie cala lista `AI_IMPROVEMENT_PRIORITY` po kolei. To jest dokladnie roznica miedzy stanem
zastanym a zasada wlasciciela: **przestawienie kolejnosci != ograniczenie zakresu**. Zasada 1
wymaga, zeby przy braku niedoboru lista zawezala sie do `ULEPSZENIA_FOCUS_ZYWNOSC` (juz istnieje,
`auto-improvements.ts:47-49`), a przy niedoborze rozszerzala sie o normalna liste.
`resourceDeficitKeys` (`ai.ts:390`, wypelniane w `main.ts:16535` i scalane w `ai.ts:2473,3017`) juz
niesie te informacje z silnika co do tury — **nie trzeba nowego zrodla danych**, trzeba nowej
DECYZJI na tym zrodle.

**Zasada 2 — budowanie tylko przy obywatelach.** Wylacznie na heksach realnie obrabianych przez
obywateli miasta; wyjatek: zloza surowcow moga byc gdziekolwiek wedlug potrzeby. Dla gracza —
przycisk „buduj" ma dzialac tylko w takich miejscach.

*Punkt zaczepienia (zweryfikowany):* mechanizm **juz istnieje w calosci** dla gracza —
`AutoImprovementCity.ulepszeniaOnlyWorked` (`auto-improvements.ts:28`), filtr `onlyWorked`
+ `getWorkedHexKeys` (`auto-improvements.ts:106,259,359-360`), przelacznik w panelu
(`buildModeHud.ts:103-618`, „Tylko pola z obywatelami"), zapis w `City.ulepszeniaOnlyWorked`
(`cities.ts:280,288,297,310,655`). **Dzis domyslnie WYLACZONY (`false`)** — Zasada 2 zmienia
wartosc domyslna na **wlaczony**. Dla **AI CYWILIZACJI** trzeba sprawdzic, czy wywolanie
`pickAutoImprovements` w `ai.ts:1984` w ogole przekazuje `getOnlyWorked`/`getWorkedHexKeys` —
jesli nie, mechanizm istnieje tylko po stronie gracza i trzeba go **wpiac**, nie tworzyc od nowa.
Wyjatek zlozowy: ulepszenia na zlozu (`placeDeposits`, `zloze` w `terrain-improvements.json`)
sa wolne od tego wymogu — sprawdzic, czy filtr `onlyWorked` juz je pomija, czy trzeba dopisac
wyjatek.

**Zasada 3 — przekierowanie nadwyzki.** Gdy niedoboru surowcow NIE MA i nie ma tez heksow
z obywatelami czekajacych na ulepszenie (Zasada 2 zawezila liste do zera kandydatow), AI
CYWILIZACJI przesuwa nadwyzke budzetu na budynki (nie marnuje jej, nie buduje „dla sztuki").
AI GRACZA (automat) **NIE przesuwa nic automatycznie** — wylacznie SYGNALIZUJE graczowi
nadwyzke, zeby ten sam przesunal suwak `pracaAutoPercent` (`cities.ts:281`, warstwa (c),
0-100%) w strone budynkow. To jest zgodne z regula stala wlasciciela: automat gracza doradza,
nie decyduje za niego.

## GOAL

1. AI CYWILIZACJI i AI GRACZA (wylacznie ustawienie „zrownowazone") buduja domyslnie SAMA
   zywnosc; niedobor konkretnego surowca wlacza budowe ulepszen zwiazanych z tym niedoborem
   (i pozostalych niezywnosciowych) na czas trwania niedoboru.
2. Budowa (poza zlozami) ograniczona do heksow obrabianych przez obywateli — domyslnie dla
   obu AI.
3. Nadwyzka budzetu bez niedoboru i bez kandydatow „przy obywatelach": AI CYWILIZACJI kieruje
   ja na budynki; AI GRACZA sygnalizuje nadwyzke, nie przesuwa suwaka samodzielnie.
4. R4-Q2: automat GRACZA (nie AI cywilizacji — ta juz wycina od rundy 3) dostaje przelacznik
   „wolno wycinac las" w panelu ustawien, domyslnie wylaczony, per panstwo i per miasto (wzorem
   istniejacego `onlyWorked`).

## KRYTERIA KONCA (wszystkie wymagane)

1. **Pomiar PRZED zmiana** (>= 3 ziarna, playtest): dzisiejszy rozklad budowy AI CYWILIZACJI —
   ile % rozkazow idzie w zywnosc vs surowce vs infrastrukture, przy niedoborze i bez niedoboru
   osobno. Bez tego nie ma z czym porownac.
2. **Po zmianie:** przy braku niedoboru — **0 rozkazow poza zywnoscia** (nie „mniej", zero).
   Przy sztucznie wywolanym niedoborze danego surowca (np. drewna) — rozkazy na ulepszenia
   zwiazane z niedoborem oraz na pozostale niezywnosciowe pojawiaja sie w tej samej turze, w
   ktorej niedobor trwa; znikaja, gdy niedobor ustaje.
3. **Zasada 2 zmierzona osobno:** odsetek budowanych ulepszen (nie-zlozowych) na heksach BEZ
   obywateli PRZED i PO — oczekiwane PO: 0%. Zloza pozostaja wyjatkiem — podac ich udzial osobno.
4. **Zasada 3 zmierzona:** scenariusz „zero niedoboru + zero kandydatow przy obywatelach" —
   AI CYWILIZACJI kieruje budzet w budynki (podac dowod z kolejki produkcji miasta, nie tylko
   brak errorow); AI GRACZA NIE przesuwa suwaka samodzielnie (podac dowod niezmiennosci
   `pracaAutoPercent` po turze z nadwyzka).
5. **Trzy pozostale ustawienia automatu gracza** („zywnosc", „surowce", „infrastruktura")
   **bez zadnej zmiany zachowania** — dowod: identyczny wynik `pickAutoImprovements` na tych
   trzech profilach PRZED i PO, na tych samych danych wejsciowych.
6. **R4-Q2:** przelacznik dziala w obu zakresach (panstwo, miasto), domyslnie wylaczony, zapis
   przetrwa save/load; z wlaczonym przelacznikiem automat gracza wycina las pod farme przy
   rzece identycznie jak dzis AI CYWILIZACJI (ta sama sciezka `skipWyrab: false`).
7. **Dowod nie-tautologiczny:** kazda nowa asercja czerwieni sie pod jedna celowana mutacje
   zrodla. Podac mutacje i wynik.
8. Piec bramek referencyjnych bez pogorszenia: logic 213/213, tech-tree 19/0, research 33/33,
   unit-replace 13/13, combat 6/6. `tsc --noEmit` zero bledow.
9. Bramka tematu rundy 3 (34/0, `ai-wyrab-...-test.cjs` — znajdz dokladna nazwe w worktree
   `wt-op-ai3` lub na galezi `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`) bez pogorszenia —
   Zasada 1 zmienia PROGI budowy, nie usuwa mechanizmu wyrebu przy rzece z rundy 3.
10. **Kolejnosc zaleznosci:** ten temat zaklada, ze `R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1` jest juz
    w `main` (jest — zmergowane 2026-08-27). Farma na zalesionym heksie przy rzece wymaga TERAZ
    wyrebu zawsze — pomiar rundy 3 (42-46% odzysku) zmierzyl STARA regule i **nie jest
    punktem odniesienia** dla tej rundy. Zmierz od nowa.

## ALLOWLISTA (nic poza tym)

- `gra/src/game/ai.ts`
- `gra/src/game/auto-improvements.ts`
- `gra/src/game/cities.ts`
- `gra/src/main.ts`
- `gra/src/ui/buildModeHud.ts`
- `gra/tools/**` (bramki i sondy)
- `dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/**`

## GRANICE (naruszenie = FAIL)

- Zakaz `npm run build` / `npm run dev`; build wylacznie
  `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ai-r4-<rola> --emptyOutDir`.
- Zakaz `npx`, `git add -A`, pushu do `main`, zmian w `dyspozycje/WERSJE.md`.
- **Nie ruszac** `gra/src/map/improvement-build.ts` ani `gra/data/terrain-improvements.json` —
  farma-w-lesie jest juz zamknieta, nie wracamy do tamtej reguly.
- **Nie poszerzac zakresu (§14):** nie dotykac trzech innych ustawien automatu gracza poza
  „zrownowazone"; nie ruszac wojny wymuszonej ani flagi miasta-panstwa (osobne tematy, rownolegle
  w toku).
- R4-Q2 dotyczy WYLACZNIE automatu gracza; AI CYWILIZACJI juz wycina od rundy 3 — nie zmieniac
  tam nic.

## OBIEG

Operator (Opus 5, effort high) -> Evaluator (Opus 5, effort high) -> Final Control (Opus 5,
effort high) -> integracja orkiestratora. To jest **runda 4 z 5 dozwolonych** dla tego tematu —
po tej rundzie zostaje juz tylko jedna.

**Final Control obowiazkowo:** `git fetch` + `git log` + SHA + potwierdzenie, ze zmiany SA
W COMMITACH. Praca niezacommitowana = BLOKER.
