# Sesja autonomiczna — dziennik decyzji i problemów

Tryb: architekt zleca subagentom, weryfikuje (tsc + build + smoke + test logiki), snapshot po każdym zielonym etapie.
Backup: kopie w `_backup/` (git w OneDrive uszkodzony — porzucony) + `Gra-podglad-BACKUP.html`.

## STAN OBECNY (co działa w Gra-podglad.html)
- Mapa 3D heksowa, przylegające heksy, paleta terenu, wzgórza zielone z krzewami, rzeka, oazy, śnieg na górach.
- Mgła wojny (klawisz F): nieodkryte pola ciemne, nakładki (drzewa/śnieg/oazy/rzeka) ukryte w mgle, wrogowie niewidoczni poza zasięgiem.
- Jednostki: modele wg broni (miecznik, włócznik, łucznik, procarz, oszczepnik, maczuga, topór, konnica, rydwan, super, osadnik). Galeria wszystkich 36 typów: klawisz G.
- Ruch: animowany przejazd po heksach, podgląd trasy (najechanie), KOSZTY TERENU (łąka/równ/pust 1, wzgórza 2, las +1, góry/WYBRZEŻE/morze nieprzejezdne), rzeka = +4 do zasięgu.
- Miasta: zakładanie z osadnika (B, ląd, ≥5 od innych), model osady, panel po kliknięciu (nazwa/ludność/okolica), miasto daje pole widzenia.
- HUD: tura, wybrana jednostka, liczba miast, podpowiedzi sterowania.

## STEROWANIE
Klik osadnika = zasięg · najedź = trasa · klik pole = ruch · B = załóż miasto · klik miasto = panel · G = galeria jednostek · F = mgła · N = koniec tury · Esc = zamknij panel.

## NARZĘDZIA TESTOWE (gra/tools)
- `smoke.cjs` — jsdom + stub WebGL, sprawdza start bez błędu boota.
- `logic-test.cjs` — esbuild→Node, 18 asercji (ruch/zasięg/trasa/widoczność/zakładanie miast).

## MAKIETY (do oceny, otwierane dwuklikiem)
- `Makieta-HUD-mapa-swiata.html` — HUD mapy świata (panele 1–12) + menu główne.
- `Makieta-flow-nowa-gra.html` — flow startu gry (Nowa gra → wybór cywilizacji → epoka → ustawienia → start). ZAAKCEPTOWANE.

## DANE (Excel)
- `Plony-terenow.xlsx` → arkusz „Ruch terenu" (koszty ruchu, 99=nieprzejezdny). Eksport: `gra/data/terrain-movement.json`, wczytywany przez loader → silnik (configureTerrainMovement).

## DZIENNIK
- [baseline] build OK; git uszkodzony → kopie `_backup`.
- [tsc-clean] utwardzone null-checki → tsc=0.
- [galeria] 36 typów + modele wg broni + tryb G (3 subagenty równolegle).
- [harness] smoke.cjs + logic-test.cjs (headless-gl render PNG NIE działa w sandboxie — brak wizualnej samokontroli 3D; weryfikuję uruchomienie/typy/logikę).
- [mgła] visibility.ts + setFog (bazowe heksy + nakładki) + chowanie wrogów + klawisz F. Problem: smoke złapał TDZ (galleryOn użyte przed deklaracją) ORAZ narzędzie Edit ucięło ogon main.ts — oba naprawione (deklaracja wyżej; odtworzenie ogona przez Python). WNIOSEK: main.ts edytować przez zapis Python utf-8, nie przez Edit.
- [miasto] cities.ts + render osady + panel + spięcie (B, klik).
- [ruch terenu] koszty wejścia per teren (Dijkstra + reguła min-move) + pathCost.
- [wybrzeże] Wybrzeże = nieprzejezdne (morze) do czasu łodzi; koszty data-driven z Excela; placeStartingUnits/canFoundCity traktują wybrzeże+góry jako niezdatne.
- [rzeka] przeniesiona do danych mapy (generator: hex.rzeka.obecna + map.riverPaths), render z danych, +4 do ruchu na rzece.

## KOLEJKA (następne)
- Galera→statek: zmiana wyglądu jednostki na wybrzeżu po wynalezieniu łodzi (task).
- M2 ekonomia miasta: produkcja, wzrost, żywność, nauka, drzewko technologii.
- HUD w grze (na razie tylko makieta) — wdrożyć panele do silnika.
- Krok w stronę Civ VI: rzeki na krawędziach heksów, lepsze biomy/cieniowanie, ramka.
