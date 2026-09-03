TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/map/improvement-build.ts (glowny), gra/src/ui/hexContextTooltip.ts (tooltip, ~linia 493),
gra/src/game/auto-improvements.ts (AI_IMPROVEMENT_PRIORITY — kolejnosc priorytetow AI), dane CivPedii dla oboz_lowiecki
MODEL+EFFORT: claude-sonnet-5, effort high (rdzenna logika budowy ulepszen, ryzyko regresji na wielu sciezkach: gracz + AI + auto-improvements)

WYZWALACZ (dosłownie od właściciela)
"Co do obozu łowieckiego, najpierw powinien być na lesie postawiony tartak, a dopiero potem
można budować w tym miejscu obóz łowiecki. Nie ma tartaku, nie ma obozu łowieckiego. Wynika to
z tego, że nie chcemy marnować pola na obóz łowiecki, bo jest mało efektywny; lepiej wyciąć las
i postawić tartak. W związku z tym stawiamy obozy tylko tam, gdzie już są tartaki, bo to zawsze
jest dodatkowy bonus."

RECON (nie powtarzaj — już wykonane przez Explore agenta tej sesji, potwierdzone w
REJESTR-PROSB-I-ZADAN.md sekcja "NOWA SERIA 2026-09-03")
- `gra/src/map/improvement-build.ts`: `oboz_lowiecki` ma dziś gate na typ terenu w `qualifies()`
  (~linia 1052-1054, wymaga lasu) i osobny "hard block" (~586-588). `tartak` ma wlasny gate
  (~1041-1045) z lista dopuszczalnych terenow lasu `TARTAK_TERENY` (~157-161).
- Istnieje juz DOKLADNIE analogiczny precedens wspoludzielenia pola miedzy dwoma ulepszeniami:
  `droga_brukowana` wymaga wczesniej istniejacej `droga` na tym samym hexie (~929-936) — ten sam
  wzorzec "ulepszenie B wymaga uprzedniego ulepszenia A na tym samym polu" ma juz dzialajacy kod
  do skopiowania/rozszerzenia, NIE trzeba wymyslac nowego mechanizmu od zera. Mirror w
  `hexContextTooltip.ts:493`.
- `tartak` i `oboz_lowiecki` juz MOGA dzis koegzystowac na tym samym polu (rozne sektory
  `las`/`lowiectwo`, potwierdzone dzialajacym testem `map-improvement-qualify-test.cjs`) — a wiec
  nie ma dzis konfliktu wylacznosci sektorowej do rozwiazania, tylko trzeba DODAC gate kolejnosci.
- `gra/src/game/auto-improvements.ts`: `AI_IMPROVEMENT_PRIORITY` ma dzis `oboz_lowiecki` PRZED
  `tartak` w kolejnosci priorytetow — AI probowaloby budowac oboz zanim tartak istnieje na danym
  polu. Trzeba odwrocic kolejnosc (tartak przed obozem), inaczej samo dodanie gate'u w
  `qualifies()` moze skutkowac tym, ze AI nigdy nie doczeka sie zbudowania obozu na danym polu w
  rozsadnym czasie (bo zawsze probuje najpierw oboz, ten jest zablokowany, a logika nie wraca
  pozniej do ponownej proby na tym samym polu az do nastepnego pelnego przegladu kandydatow).
- Do przejrzenia rowniez logika "minimalnej liczby na miasto" (`lesneWymagane`/
  `JEDEN_NA_ILU_OBYWATELI` lub analogiczne nazwy w `auto-improvements.ts`) — dzis prawdopodobnie
  traktuje tartak i oboz jako NIEZALEZNE kwoty per-miasto, nie per-heks; sprawdz czy po zmianie
  nadal ma sens (np. czy AI moze "wyczerpac" limit tartakow zanim zdazy postawic obozy na tych
  samych polach, blokujac oboz na zawsze w danym miescie).
- CivPedia / tooltip: tekst warunku budowy dla `oboz_lowiecki` (`hexContextTooltip.ts` i/lub dane
  JSON typu `terrain-improvements.json`) trzeba zaktualizowac, zeby gracz widzial nowy warunek
  "wymaga tartaku na tym polu", zamiast dzisiejszego (prawdopodobnie samego "las").

GOAL
1. `oboz_lowiecki` NIE moze byc budowany na polu lasu, dopoki na tym samym polu nie istnieje juz
   zbudowany, ukonczony `tartak` (skopiuj/rozszerz dokladnie wzorzec `droga_brukowana`→`droga`,
   ~929-936 w `improvement-build.ts` — NIE nowy mechanizm).
2. Zasada dziala identycznie na obu sciezkach: budowa przez gracza (UI) ORAZ budowa/wybor przez
   AI cywilizacji i panstwa-miasta (auto-improvements/`planCityImprovements`). Jesli AI ma osobna
   liste priorytetow/kolejnosc ulepszen, popraw ja tak, zeby AI budowalo tartak PRZED obozem na
   danym polu lasu (a nie omijalo obu, bo obóz nigdy nie "kwalifikuje sie" pierwszy).
3. Pole z lasu, na ktorym NIE ma jeszcze tartaku, nadal moze byc uzyte pod sam tartak (bez zmian) —
   ta zmiana wylacznie DODAJE warunek dla obozu, nie zabiera niczego tartakowi.
4. Tekst warunku budowy `oboz_lowiecki` widoczny graczowi (tooltip hexa i/lub CivPedia) jawnie
   wspomina wymog istniejacego tartaku na tym polu — gracz nie ma zgadywac, dlaczego opcja jest
   wygaszona/niedostepna.
5. Zero regresji: pola lasu z JUZ istniejacymi obozami lowieckimi zbudowanymi PRZED ta zmiana (stan
   zapisany w zapisanych grach/testach) NIE znikaja i nie generuja bledow walidacji — nowy gate
   dotyczy wylacznie PRZYSZLYCH prob budowy, nie usuwa istniejacych struktur wstecznie.

KRYTERIA KOŃCA (binarne)
1. Proba budowy `oboz_lowiecki` przez gracza na polu lasu BEZ tartaku na tym polu jest zablokowana
   (opcja niedostepna/wygaszona w UI, identycznie jak dzis dziala `droga_brukowana` bez `droga`).
2. Ta sama proba na polu lasu Z juz zbudowanym, ukonczonym `tartak` na tym samym polu — DOZWOLONA.
3. AI (test symulacji kilku tur na mapie z lasami bez tartakow) NIE buduje `oboz_lowiecki` na polu
   bez tartaku — zero wystapien w logu decyzji budowy.
4. AI (test symulacji na mapie z lasami majacymi juz zbudowane tartaki) POTRAFI zbudowac
   `oboz_lowiecki` na takich polach, gdy uzna to za korzystne wg swojej dotychczasowej logiki
   priorytetow — zasada nie blokuje AI calkowicie, tylko wymusza kolejnosc.
5. Tekst warunku budowy `oboz_lowiecki` widoczny graczowi wprost wspomina wymog tartaku.
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone, oraz nowy/rozszerzony test tego tematu zielony.
7. Zero regresji na istniejacych, juz zbudowanych obozach lowieckich w zapisanych stanach gry.

ALLOWLISTA (nic poza tym)
- gra/src/map/improvement-build.ts — WYLACZNIE fragmenty dotyczace gate'u/qualifies dla
  `oboz_lowiecki` i ewentualnej wspolnej funkcji pomocniczej analogicznej do wzorca
  `droga_brukowana`/`droga` (~486-521, ~586-588, ~929-936, ~1041-1054). Zaden inny typ ulepszenia.
- gra/src/game/auto-improvements.ts — WYLACZNIE `AI_IMPROVEMENT_PRIORITY` (kolejnosc
  `oboz_lowiecki`/`tartak`) i ewentualna logika "minimalnej liczby na miasto" bezposrednio
  dotyczaca tych dwoch ulepszen. Zaden inny mechanizm AI.
- Plik(i) danych/tekstu CivPedii lub tooltipa hexa zawierajacy warunek budowy `oboz_lowiecki`
  (dokladna sciezka do potwierdzenia przez Operatora w recon w locie — prawdopodobnie
  `gra/src/data/terrain-improvements.json` lub podobny, ewentualnie kod tooltipa) — WYLACZNIE
  tekst/warunek dla `oboz_lowiecki`.
- Nowy lub rozszerzony plik testu w gra/tools/*-test.cjs dla tego tematu.
Zakazane bezwzglednie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**, dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, jakikolwiek inny typ ulepszenia poza
oboz_lowiecki/tartak, jakakolwiek zmiana SEKTOR_OF/EXCLUSIVE_SEKTORY poza ewentualnym odczytem.

IZOLACJA
worktree /home/user/wt-oboz-tartak, gałąź autobot/R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1,
baza jawnie: origin/main (commit d51331ed lub nowszy jesli main ruszyl w miedzyczasie).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-oboz --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie sa nim objete.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 3/4 (zachowanie AI) za spelnione bez faktycznego uruchomienia symulacji
kilku tur (co najmniej 5-10) na dwoch scenariuszach mapy (z tartakami i bez) i pokazania realnych
logow/wynikow decyzji budowy AI — nie wolno zakladac "AI powinno to respektowac, bo qualifies()
to teraz blokuje" bez live-dowodu, poniewaz `planCityImprovements` moze miec wlasna, zduplikowana
liste kandydatow obliczona PRZED wywolaniem qualifies() (np. filtrowanie po typie terenu bez
ponownego sprawdzenia pelnego gate'u), co dawaloby fałszywe poczucie bezpieczenstwa.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawke; runda N+1 idzie na TYM SAMYM ID i TEJ SAMEJ
gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integruja, nie deployuja, nie pushuja. Final Control i integracja
(allowlist-only, per plik i per hunk) dzieja sie poza worktree Operatora, reka orkiestratora.
Przy decyzji produktowej (np. czy SEKTOR_OF juz wyklucza koegzystencje) zatrzymanie ze statusem
DECISION_REQUIRED zamiast zgadywania.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jesli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
