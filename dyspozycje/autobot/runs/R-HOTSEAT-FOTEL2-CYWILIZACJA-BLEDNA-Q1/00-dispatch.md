TEMAT:  R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-Q1
RUNDA:  1/5
DATA:   2026-09-10
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Zgłoszenie właściciela na żywo (2026-09-10), testując ROBOCZĄ (FALA 373): grając
Grecją (fotel 1), przy starcie hot-seat wybrał dla fotela 2 cywilizację **Rzym** —
fotel 2 faktycznie dostał **Grecję** (tę samą co fotel 1, „dwie Grecje"). Dodatkowo
fotel 2 wylądował obok Egiptu, otoczony miastami-państwami NIEZWIĄZANYMI z Rzymem —
zero własnych miast-państw wybranej cywilizacji. KRYTYCZNE — najwyższy priorytet,
wyżej niż jakikolwiek inny otwarty temat.

Recon (Explore agent, zakończony) rozdzielił to na DWA NIEZALEŻNE defekty root-cause
plus potwierdzoną lukę w pokryciu testami — opisane niżej. Napraw OBA w tej samej
rundzie (jeden żywy dowód 2-graczowy musi pokazać oba naprawione naraz).

## GOAL — defekt B: zła cywilizacja wyświetlana dla fotela 2

`civTypeForOwner(ownerId)` (`gra/src/main.ts:3519-3522`):
```ts
function civTypeForOwner(ownerId: number): string {
  if (isMeSafe(ownerId)) return String(player.civType || _menuCivId || 'grecy');
  return aiOwnerCivMap.get(ownerId) ?? 'grecy';
}
```
`isMeSafe(ownerId)` (main.ts:2501) = `ownerId === meNow()` — sprawdza czy `ownerId`
to AKTUALNIE AKTYWNY fotel, NIE czy to w ogóle jakiś człowiek. Efekt: który fotel
akurat ma turę, ten dostaje GLOBALNĄ wartość `player.civType`/`_menuCivId` (ustawianą
raz dla fotela 1 przy starcie gry, main.ts ok.35074-35125, nigdy nieaktualizowaną dla
fotela 2). Poprawne dane per-fotel ISTNIEJĄ i SĄ poprawnie zapisywane:
- `_menuCivIdByOwner: Map<number,string>` (main.ts:1648, wpis dla drugiego fotela
  ustawiany ok. main.ts:8630)
- `playerCivTypeByHuman: Map<number,string>` (main.ts:10703, wpis dla drugiego fotela
  ustawiany ok. main.ts:8634)

ale NIC w kodzie rozgrywki ich nie czyta (wyłącznie testowe hooki, main.ts ok.23296
i ok.23354). Napraw `civTypeForOwner` tak, by dla KAŻDEGO ludzkiego `ownerId`
(nie tylko aktualnie aktywnego) zwracał jego WŁASNĄ cywilizację z tych map, z
fallbackiem do dzisiejszego zachowania dla AI. Miejsca czytające `civTypeForOwner`
(nie zmieniaj ich logiki — tylko skorzystają z poprawki u źródła): resolver
emblematu/portretu (ok. main.ts:8166-8174), `isOwnerPlayerSameCivType` (ok.
main.ts:8187-8191), `civDisplayNameForOwner` (ok. main.ts:8241-8244), `civIdForOwner`
(ok. main.ts:28545), ikony sceny bitwy (ok. main.ts:25997, 26122-26123).

**Ryzyko do sprawdzenia (nie zakładaj, zweryfikuj wprost):** `civTypeForOwner` jest
zadeklarowane wcześniej w pliku (main.ts:3519) niż pomocnicze funkcje, których być
może użyjesz — `isHuman(ownerId)` (main.ts:10662, deleguje do `isHumanOwner`),
`isMe(ownerId)` (main.ts:10670), `humanSeats: HumanSeats` (main.ts:10639, ma
`humanOwnerIds`/`activeHumanOwnerId`). W Etapie 6e podobne wywołanie w przód
(`isMe`/`ME`) wymagało jawnego fixu TDZ (forward-declare) — sprawdź, czy tu też jest
potrzebny, zamiast zakładać że runtime-only wywołanie (funkcja jest WOŁANA dopiero
długo po pełnym setupie) wystarczy. Jeśli używasz `_menuCivIdByOwner`/
`playerCivTypeByHuman` bezpośrednio (obie zadeklarowane PRZED `civTypeForOwner` —
1648 i 10703 to błąd w podanej kolejności, sprawdź realną kolejność w pliku przed
pisaniem), unikniesz problemu w ogóle — preferuj to rozwiązanie jeśli działa.

## GOAL — defekt C: brak miast-państw własnej cywilizacji dla fotela 2

`spawnPendingSameTypeRivals(_coreQ, _coreR)` (main.ts:8764-8873) to JEDNORAZOWA,
GLOBALNA kolejka (`pendingSameTypeRivalCount`, main.ts:7619) powiązana z
`_menuCivId` (cywilizacją fotela 1) — gdy fotel 1 zakłada stolicę jako pierwszy,
greckie miasta-państwa powstają i kolejka się opróżnia (main.ts:8765-8767,
bezwarunkowo, przy PIERWSZYM wywołaniu). Gdy fotel 2 później zakłada stolicę z
INNĄ cywilizacją (Rzym), kolejka jest już pusta — fotel 2 nie dostaje ŻADNYCH
miast-państw swojej cywilizacji, ląduje wśród cudzych klastrów (np. Egiptu) które
już tam były. `buildClusterStartPlan`/`buildClusterSpawnPlan`
(`gra/src/game/cluster-start.ts:127-137`) budują klaster rywali WYŁĄCZNIE wokół
cywilizacji fotela 1; `secondHumanCivId` jest używane TYLKO do wyboru pozycji startu
(`pickSecondHumanStartHex`, cluster-start.ts:300-307), nigdy do generowania
miast-państw. Napraw tak, by DRUGI fotel ludzki dostał WŁASNY, realnie niezależny
klaster miast-państw swojej cywilizacji — nie drenaż jednej globalnej, jednorazowej
kolejki przypisanej cywilizacji fotela 1.

## LUKA W TESTACH (potwierdzona reconem — napraw też ją)

`hotseat-etap6f-part2-data-test.cjs` i `hotseat-etap6f-part2-ui-test.cjs`
sprawdzają WYŁĄCZNIE stronę zapisu (snapshoty `_menuCivIdByOwner`/`civIdByOwner`),
NIGDY stronę odczytu/konsumpcji (`civTypeForOwner`, wyrenderowany HUD/emblematy) ani
generowanie miast-państw dla fotela 2 — dlatego oba defekty przeszły każdą
dotychczasową bramkę hot-seat niezauważone od Etapu 5/6. Nowa bramka tego tematu
MUSI pokryć realny odczyt i realne miasta-państwa, nie tylko zapis danych.

## DOWÓD ŻYWY (obowiązkowy, binarny)

Scenariusz hot-seat 2-graczowy w żywym Chromium: fotel 1 wybiera Grecję, fotel 2
wybiera Rzym (dwie RÓŻNE cywilizacje — kluczowe, dokładnie jak w zgłoszeniu). Oba
fotele zakładają stolicę. Dowód musi pokazać WPROST, dla KAŻDEGO fotela z osobna:
1. Emblemat/nazwa cywilizacji wyświetlana dla danego fotela odpowiada JEGO WŁASNEMU
   wyborowi (fotel 1 = Grecja, fotel 2 = Rzym — NIE odwrotnie, NIE ta sama dla obu).
2. Miasta-państwa wygenerowane wokół stolicy fotela 2 należą do cywilizacji Rzym
   (jego własnej), nie do przypadkowej sąsiedniej cywilizacji.
Zrzuty ekranu obu foteli pod `dowody/hotseat-fotel2-cywilizacja-<fotel>.png`.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Żywy dowód (wyżej) pokazuje poprawną cywilizację DLA OBU foteli jednocześnie.
2. Żywy dowód pokazuje miasta-państwa WŁASNEJ cywilizacji fotela 2 wokół jego stolicy.
3. Nowa bramka testowa pokrywa REALNY odczyt (`civTypeForOwner` lub równoważny
   wyrenderowany efekt) ORAZ generowanie miast-państw dla drugiego fotela — nie
   tylko snapshot map zapisu.
4. `tsc --noEmit` 0 błędów.
5. WSZYSTKIE 25 istniejących bramek `gra/tools/hotseat-*-test.cjs` bez regresu
   (wypisz każdą z osobna w raporcie: PASS/FAIL, nie zbiorczo).
6. 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) bez regresu.
7. Gra jednoosobowa (fotel 1 samodzielnie, bez fotela 2) niezmieniona — brak
   regresji dla trybu bez hot-seat.

## Allowlista

- `gra/src/main.ts` (WYŁĄCZNIE funkcje/miejsca opisane w GOAL — `civTypeForOwner`,
  `spawnPendingSameTypeRivals`, `pendingSameTypeRivalCount` i bezpośrednio z nimi
  związana logika czytania/generowania; NIE dotykaj niepowiązanych fragmentów)
- `gra/src/game/cluster-start.ts` (WYŁĄCZNIE `buildClusterStartPlan`/
  `buildClusterSpawnPlan`/logika drugiego klastra rywali)
- Nowa bramka testowa: `gra/tools/R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-<opis>-test.cjs`
- `dowody/hotseat-fotel2-cywilizacja-*.png` (nowe pliki, dowód)

Zakazane: wszystko inne, w tym `gra/src/ui/newGameFlow.ts` (potwierdzone reconem:
warstwa UI/zapisu jest POPRAWNA, błąd jest wyłącznie w odczycie/generowaniu),
pliki z sekretami, `docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-hotseat-fotel2-cywilizacja`, gałąź
`autobot/R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-Q1`, baza `origin/main`. C-001: zakaz
`npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5
rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 600 słów w raporcie (temat złożony, dwa defekty — więcej miejsca niż
standardowe 400-500). Ścieżki+SHA zamiast diffu; zakaz `git add -A`. Nie
integrujesz, nie deployujesz, nie pushujesz.
