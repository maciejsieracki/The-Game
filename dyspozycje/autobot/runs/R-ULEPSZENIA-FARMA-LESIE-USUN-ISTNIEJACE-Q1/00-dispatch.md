# DISPATCH — R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1

TEMAT: R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1
DOMAIN: GAME
DATA: 2026-08-27

## ECHO WLASCICIELA (interpretacja zarejestrowana w REJESTR-PROSB-I-ZADAN.md, sekcja
"Pytanie 1: farmy juz stojace w lesie — wlasciciel odrzuca pytanie jako bezzasadne")

Wlasciciel odrzucil pytanie ABC o farmy juz stojace w lesie jako bezzasadne, cytat pelny:
„Juz odpowiadalem na to pytanie. Pytanie jest niezasadne. W ogole nie powinno byc farm w lesie;
farm nie wolno stawiac w lesie. Mowilem, ze zmieniam te regule, zakaz stawiania farm w lasach.
Dlatego pytanie, co sie stanie z lasem, jesli go wykarczujemy, i co sie stanie z farma, jest
bezzasadne, bo w lesie nie powinno byc farm."

Regula jest NIEWARUNKOWA — dotyczy stanu, nie tylko czynnosci budowania. Rozstrzygniete jako
**wariant C turnieju**: farma znika, las zostaje. Dotyczy to takze farm na Wzgorzach (te sa
farmami lesnymi z definicji starej reguly — znikaja identycznie, bez wyjatku terenowego).

## GOAL

Zaden stan gry — nowa partia, trwaca partia, wczytany zapis — nie zawiera farmy stojacej na
heksie z nakladka Las. Kazda taka farma (istniejaca dzis z czasu starej reguly 2026-07-21)
znika, gdy ta zmiana wejdzie w zycie; las na tym polu zostaje nietkniety.

## KRYTERIA KONCA (wszystkie wymagane)

1. **Zakres stanow do pokrycia (trzy, wszystkie wymagane):**
   a) **Wczytanie zapisu gry** (`save.ts`) — migracja przy wczytaniu starszego zapisu
      usuwa kazda farme stojaca na heksie z Las.
   b) **Trwajaca partia w tej samej sesji** (bez przeladowania) — stan gry w pamieci rowniez
      musi zostac oczyszczony, nie tylko przy save/load. Znajdz najlepszy punkt zaczepienia
      (np. jednorazowy przebieg przy starcie/inicjalizacji silnika, albo hak w istniejacym
      cyklu tury) — wybor nalezy do Ciebie, ale musi byc UZASADNIONY w raporcie, nie ukryty.
   c) **Nowa partia** — nie powinno tam byc czego usuwac (generator mapy juz nie stawia
      startowych farm w lesie), ale sprawdz to pomiarem, nie zalozeniem.
2. **Skutek usuniecia farmy zdefiniowany jawnie:** praca wlozona w farme NIE wraca (wzorzec
   z decyzji o obozie lowieckim, ten sam dzien) — heks wraca do stanu „las, bez ulepszenia".
   Miasto traci zywnosc/plon z tej farmy od kolejnej tury.
3. **Pomiar PRZED i PO:** na >= 3 ziarnach z farmami postawionymi na lesie (przygotuj scenariusz
   testowy odtwarzajacy stara regule 2026-07-21, postaw farmy na lesie, potem uruchom migracje/
   naprawe) — policz farmy-na-lesie PRZED (> 0) i PO (dokladnie 0). Prawdziwe farmy na terenie
   bez lasu (Laka/Rownina) MUSZA przetrwac bez zmian — policz to osobno jako dowod, ze naprawa
   nie jest za szeroka.
4. **Jednorazowosc / idempotencja:** podwojne uruchomienie migracji na tym samym stanie nie
   robi nic drugi raz (nie kasuje niczego ponownie, nie rzuca bledu).
5. **Dowod nie-tautologiczny:** kazda nowa asercja czerwieni sie pod jedna celowana mutacje
   zrodla. Podaj mutacje i wynik.
6. Piec bramek referencyjnych bez pogorszenia: logic 213/213, tech-tree 19/0, research 33/33,
   unit-replace 13/13, combat 6/6. `tsc --noEmit` zero bledow.
7. Bramka tematu `R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1` (136/0) i `map-improvement-qualify` (117/0)
   bez pogorszenia — ten temat NIE zmienia reguly kwalifikacji, tylko sprzata istniejacy stan.

## ALLOWLISTA (nic poza tym)

- `gra/src/game/save.ts`
- `gra/src/main.ts` — **UWAGA WSPOLBIEZNOSC:** rownolegle biegna DWA inne tematy dotykajace
  `main.ts` (`R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1`, `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`
  runda 4). Pracujesz we WLASNYM worktree na WLASNEJ galezi — to jest OK, git obsluzy rownolegle
  galezie. Trzymaj zmiane w `main.ts` MINIMALNA i punktowa (jedno wywolanie funkcji migracji
  w dobrze uzasadnionym miejscu), zeby integracja na koniec byla prosta. Jesli podczas pracy
  zobaczysz ze `main.ts` na `origin/main` sie zmienil (bo inny temat sie juz zintegrowal) —
  zrob `git fetch` + rebase/merge swojej galezi, to oczekiwane.
- `gra/src/map/improvement-build.ts` — WYLACZNIE jesli funkcja usuwajaca farmy naturalnie
  nalezy tam (obok `stripImprovementsWhenForestRemoved`); NIE zmieniaj tam reguly kwalifikacji.
- `gra/tools/**` (bramka tematu + sondy)
- `dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1/**`

## GRANICE (naruszenie = FAIL)

- Zakaz `npm run build` / `npm run dev`; build wylacznie
  `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-farma-legacy-<rola> --emptyOutDir`.
- Zakaz `npx`, `git add -A`, pushu do `main`, zmian w `dyspozycje/WERSJE.md`.
- **Nie ruszaj** `gra/data/terrain-improvements.json` ani regule `isFarmBaseTerrain` — ta
  czesc jest juz zamknieta (`R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1`), to jest osobny temat.
- **Nie poszerzaj zakresu (§14):** wylacznie farmy na Las. Tartak i oboz lowiecki maja juz
  wlasne, odrebne zasady — nie dotykaj ich.

## OBIEG

Operator (Opus 5, effort high) -> Evaluator (Opus 5, effort high) -> Final Control (Opus 5,
effort high) -> integracja orkiestratora. Limit 5 rund.

**Final Control obowiazkowo:** `git fetch` + `git log` + SHA + potwierdzenie ze zmiany SA
W COMMITACH. Praca niezacommitowana = BLOKER.
