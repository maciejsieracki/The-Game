# DISPATCH — R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1

TEMAT: R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1
DOMAIN: GAME
DATA: 2026-08-27
ECHO WLASCICIELA (2026-08-27, doslownie): „w lesie nie powinno byc mozliwosci budowania farm
zarowno na wzgorzach, jak i na innych terenach, bo to sie wyklucza. W lesie mozna wybudowac
tylko tartak i ewentualnie obozowisko, i tego sie trzymajmy."

**Ta dyspozycja UCHYLA decyzje z 2026-07-21** („farma MOZE na lesie — bez wyrebu"), zapisana
w `improvement-build.ts:198` i w `gra/data/terrain-improvements.json` (`farma.warunek`).

## GOAL

Farma nie kwalifikuje sie do budowy na heksie z nakladka Las — na zadnym terenie bazowym,
u gracza i u komputera, we wszystkich punktach egzekwowania. W lesie moga stac wylacznie
tartak i oboz lowiecki.

## STAN ZASTANY (zweryfikowany przez orkiestratora, `improvement-build.ts:193-201`)

```
const FLAT_FARM = new Set([TerenBazowy.Laka, TerenBazowy.Rownina]);
export function isFarmBaseTerrain(teren, nakladka) {
  if (FLAT_FARM.has(teren)) return true;                       // <- Las IGNOROWANY
  return nakladka === Nakladka.Las && teren === TerenBazowy.Wzgorza;  // <- Las WYMAGANY
}
```

Skutki reguly docelowej — **wszystkie trzy sa konsekwencja dyspozycji, nie wyborem wykonawcy**:
1. Laka/Rownina **z lasem** -> farma zabroniona (dzis dozwolona bez wyrebu).
2. Wzgorza **z lasem** -> farma zabroniona (dzis dozwolona).
3. **Farma na Wzgorzach staje sie niemozliwa calkowicie**, bo Wzgorza bez lasu nie naleza do
   `FLAT_FARM`. **Nie wolno tego "naprawiac" dopisaniem Wzgorz do terenow farmowych** — to
   byloby poszerzenie zakresu (§14) i wymagaloby osobnego ECHO. Jesli wykonawca uzna, ze to
   zla gra, zglasza to jako **note**, nie zmienia.

## KRYTERIA KONCA (wszystkie wymagane)

1. **Inwentaryzacja punktow egzekwowania przed zmiana.** Temat `R-ULEPSZENIA-OBOZ-LOWIECKI-
   TYLKO-LAS-Q1` (zamkniety w `main`) znalazl **7 punktow** dla obozu: gracz, automat, AI,
   tooltip, `galleryTerrainEligible`, migracja, commit. Wypisac odpowiadajace punkty dla farmy
   **z wlasnego przeszukania**, nie z przepisania tamtej listy. Punkt pominiety = FAIL.
2. **Pomiar PRZED i PO na >= 5 ziarnach:** liczba heksow, na ktorych farma sie kwalifikuje,
   w rozbiciu: Laka+Las, Rownina+Las, Wzgorza+Las, Laka bez lasu, Rownina bez lasu. Oczekiwane
   PO: trzy pierwsze **0**, dwie ostatnie bez zmiany.
3. **Pulapka „p-LAS-kie" sprawdzona osobna asercja.** `normTerrain('Plaskie (rownina/laka)')`
   doslownie zawiera podciag `las` — `.includes('las')` daje falszywy alarm na rowninie
   (`gra/src/game/combat.ts:638-646`). Kazda nowa asercja terenowa musi to jawnie odroznic.
4. **Dowod nie-tautologiczny:** kazda nowa asercja czerwieni sie pod jedna celowana mutacja
   zrodla. Podac mutacje i wynik.
5. **Kanon bez pogorszenia:** `map-improvement-qualify-test.cjs` (dzis 112/0),
   `auto-improvements` (45/0), bramka obozu (91/0).
6. Piec bramek referencyjnych bez pogorszenia: logic 213/213, tech-tree 19/0, research 33/33,
   unit-replace 13/13, combat 6/6. `tsc --noEmit` zero bledow.
7. **`gra/data/terrain-improvements.json`:** pola `farma.teren` i `farma.warunek` uzgodnione
   z nowa regula; stary zapis „MOZE na lesie (Las) — bez wyrebu (Maciej 2026-07-21)" zastapiony,
   z data i autorem nowej decyzji. Nie kasowac historii decyzji z komentarzy — zastapic, nie
   wymazac.

## ZAKRES NIEROZSTRZYGNIETY — NIE DOTYKAC

**Farmy, ktore JUZ STOJA na heksach z lasem** (postawione legalnie wg reguly z 2026-07-21):
czy maja zniknac, czy zostac. To jest `P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1`, **otwarte
pytanie ABC do wlasciciela** (turniej C-018 w toku). Ten temat zmienia **wylacznie regule
kwalifikacji do budowy**. Istniejacych farm nie ruszamy w zadna strone — ani nie usuwamy,
ani nie dopisujemy im ochrony. Jesli w trakcie pracy okaze sie, ze bez rozstrzygniecia migracji
nie da sie domknac kryterium — **BLOCK z uzasadnieniem**, nie zgadywanie za wlasciciela.

## ALLOWLISTA (nic poza tym)

- `gra/src/map/improvement-build.ts`
- `gra/data/terrain-improvements.json`
- `gra/src/ui/**` — **wylacznie** teksty podpowiedzi/tooltipow mowiace o warunku terenu farmy
- `gra/tools/**` (bramka tematu + sondy)
- `dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1/**`

## GRANICE (naruszenie = FAIL)

- **NIE ruszac `gra/src/main.ts` ani `gra/src/game/display-names.ts`** — rownolegle biegnie
  `R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1` na tych plikach (§2b). Temat obozu lowieckiego
  domknal 7 punktow egzekwowania **bez tkniecia `main.ts`, `ai.ts` i `auto-improvements.ts`** —
  jesli tu wyjdzie inaczej, to jest **BLOCK i raport**, nie obejscie.
- Zakaz `npm run build` / `npm run dev`; build wylacznie
  `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-farma-<rola> --emptyOutDir`
  (**`--outDir` unikalny per ROLA**).
- Zakaz `npx`, zakaz `git add -A`, zakaz pushu do `main`, zakaz zmian w `dyspozycje/WERSJE.md`.
- Nie ruszac reguly hodowli na lesie (`isLivestockImprovementBlockedOnForest`) — osobna decyzja
  wlasciciela z 2026-08-27 („odwracamy — wszystkie trzy"), wlasny temat.

## SKUTEK UBOCZNY DO ODNOTOWANIA (nie do naprawiania tutaj)

Runda 3 tematu `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` (niezintegrowana) mierzyla AI przy zalozeniu,
ze farme mozna postawic na zalesionym heksie z rzeka **bez wyrebu**. Po tej zmianie wyrab staje
sie **jedyna** droga. Liczby rundy 3 przestaja opisywac docelowa gre. Zapisane jako
`P-ULEPSZENIA-FARMA-W-LESIE-WPLYW-NA-TEMAT-AI-Q1`. Kolejnosc prac: **najpierw ta regula, potem
ponowny pomiar AI.**

## OBIEG

Operator (Opus 5, effort high) -> Evaluator (Opus 5, effort high) -> Final Control (Opus 5,
effort high) -> integracja orkiestratora. Limit 5 rund.

**Final Control obowiazkowo:** `git fetch` + `git log` + wypisac SHA + potwierdzic, ze zmiany
SA W COMMITACH na galezi tematu. Praca niezacommitowana = BLOKER, nie nota.
