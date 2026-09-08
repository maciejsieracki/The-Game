STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1
GOAL: Napraw WYLACZNIE anchoring bramki zrodlowej `bitwa-auto-doktryna-playerorder-zrodlo-test.cjs`,
tak zeby poprawnie lokalizowala blok `_activateUnit` takze na stanie scalonym z
P-BITWA-OBRONCY-PRZED-MUREM-Q1 (`6094c585`). Zero zmian w `battleScene.ts`.

WERYFIKACJA ADWERSARYJNA (niezalezna, wlasny worktree/kopia, nie odtworzenie cudzych liczb):

1. Anchoring lokalizuje WLASCIWY blok `_activateUnit`, nie inne wystapienie tego samego
   fragmentu dalej w pliku.
   - Policzone samodzielnie wystapienia `private _activateUnit(ru: RuntimeBattleUnit, done: () => void): void {`
     w `gra/src/battle/battleScene.ts` (baza tego worktree, `origin/main@5f0fa0e8`) -- DOKLADNIE
     JEDNO, linia 5364.
   - Policzone wszystkie 4 wystapienia `if (!this._manualMode` w calym pliku: linie 3471
     (przed definicja `_activateUnit`, wiec nieosiagalne przez `slice(activateUnitDefIdx)`),
     5411 (WEWNATRZ `_activateUnit`, wlasciwy), 15964 i 16024 (inne funkcje, po definicji, ale
     `regex.exec` zwraca PIERWSZE trafienie po `activateUnitDefIdx`, wiec 5411 wygrywa zawsze
     przed 15964/16024).
   - Na WLASNORECZNIE zbudowanej kopii scalonego stanu (patrz punkt 2) potwierdzone dodatkowym
     skryptem: `activateUnitDefIdx` -> linia 5384, `manualGateIdx` znaleziony przez regex ->
     linia 5424, dopasowany tekst `"if (!this._manualMode && !siegeDefenderNeverDoctrine) {"`
     -- dokladnie ten sam blok, 40 linii po definicji funkcji, nie przeskok do niepowiazanego
     wystapienia dalej w pliku. Zarzut NIE POTWIERDZONY.

2. Czy test faktycznie daje 6/6 na PRAWDZIWIE scalonym stanie, i czy Operator naprawde
   zbudowal wlasna tymczasowa kopie z polaczeniem obu fixow (nie tylko zadeklarowal).
   - Zbudowano NIEZALEZNIE (osobny katalog `/tmp/eval-verify`, bez odwolania do usunietego
     `/tmp/wt-fc-verify2` Operatora): pobrano `battleScene.ts` z `origin/main` (juz zawiera
     `6094c585`, fix obroncy-mur, `siegeDefenderNeverDoctrine`), recznie zaaplikowano DOKLADNIE
     ten sam diff co commit `58e450be` (fix lucznikow z rundy 1), zweryfikowano ze wynikowy
     blok slowo-w-slowo pokrywa sie z "TEKST COMBINED BLOKU" cytowanym w
     `08-final-control-runda1.md` (potwierdzonym przez Final Control rundy 1, dostepnym na
     `origin/main@f82aa354`, spoza historii tej galezi).
   - Skopiowano NIEZMIENIONY plik testu z tego worktree (`3571b302`) do tej kopii i uruchomiono:
     wynik **6 pass, 0 fail**, wszystkie 6 nazwanych asercji [OK]. Zgodne z deklaracja
     Operatora. Zarzut NIE POTWIERDZONY -- scalenie i wynik odtworzone od zera, nie
     przepisane z raportu.
   - Dodatkowo potwierdzone: ten sam test 6/6 takze na WLASCIWYM, niescalonym stanie tego
     worktree (`origin/main@5f0fa0e8`, bez fixu obroncy-mur) -- regex jest superzbiorem
     literalnego dopasowania, zgodnie z deklaracja Operatora w sekcji "TESTY NA WLASCIWYM
     WORKTREE".

3. Czy mutacja (cofniecie wewnetrznego resetu playerOrder, warunek muru NIETKNIETY) realnie
   psuje WLASCIWA asercje, nie przypadkowo inna.
   - Na tej samej niezaleznie zbudowanej kopii scalonej cofnieto WYLACZNIE:
     `if (this._isUnitDoctrineAuto(ru)) { if (ru.playerOrder.type !== 'none') ru.playerOrder = { type: 'none' }; ...`
     -> `if (this._isUnitDoctrineAuto(ru) && ru.playerOrder.type === 'none') { ...`,
     zostawiajac `if (!this._manualMode && !siegeDefenderNeverDoctrine) {` (warunek muru)
     calkowicie nietkniety.
   - Wynik: **3 pass, 3 fail**. Failujace asercje to DOKLADNIE #1 ("stara bramka NIE
     wystepuje"), #5 ("okno zawiera reset ksiegowosci") i #6 ("reset nie jest warunkowany
     przez stary check") -- wszystkie trzy bezposrednio o mechanizmie fixu lucznikow.
     Asercje #2 ("definicja _activateUnit istnieje"), #3 ("blok if (!this._manualMode…)
     istnieje") i #4 ("okno zawiera _isUnitDoctrineAuto(ru)") pozostaly [OK] -- nietkniete
     przez mutacje, co jest oczekiwane bo mutacja nie dotyka warunku muru/definicji funkcji.
     Zero przypadkowego trafienia w niezwiazana asercje. Zarzut NIE POTWIERDZONY.

DODATKOWA WERYFIKACJA (regresja poza trzema zadanymi punktami, na WLASCIWYM worktree z
symlinkiem `gra/node_modules` per C-029, usuniety po teście):
- `node tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` -> 6/6 (potwierdzone ponownie
  bezposrednio w `/home/user/wt-bitwa-lucznicy-auto/gra`).
- `tsc --noEmit` -> 0 bledow.
- 5 bramek referencyjnych: `logic-test` 213/213, `combat-test` 6/6, `map-field-battle-test`
  22/22, `tech-tree-test` 19/19, `research-test` 33/33 -- wszystkie zielone.
- `git status --porcelain` w worktree po testach -- czyste, brak pozostalosci (symlink
  node_modules usuniety).
- `git show --stat 3571b302` -- potwierdza deklarowany zakres commita: WYLACZNIE
  `gra/tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs`, 17 wstawien / 4 usuniecia,
  zero zmian w `battleScene.ts`. Zgodne z deklaracja.
- `bitwa-obroncy-mur-kolumny-test.cjs` NIE uruchomiony w tej rundzie weryfikacji (test zywy,
  Playwright/Chromium/vite build, poza allowlista i poza trzema konkretnymi pytaniami
  adwersaryjnymi tej rundy) -- Operator deklaruje 9/9 na wlasnej kopii; nie
  odtworzone niezaleznie tutaj, odnotowane jako granica tej weryfikacji, nie jako zarzut
  (dispatch rundy 2 nie wymagal od Evaluatora odtworzenia tego konkretnego testu, tylko
  trzech punktow anchoringu/scalenia/mutacji wymienionych w GOAL RUNDY 2 i w promptcie
  Evaluatora).

ZARZUTY: brak.

TESTY: patrz WERYFIKACJA ADWERSARYJNA i DODATKOWA WERYFIKACJA wyzej -- wszystkie wykonane
niezaleznie w tej rundzie (nie przepisane z raportu Operatora), z wlasnym tymczasowym
scaleniem w `/tmp/eval-verify` (usuniete po weryfikacji).

BLOKADY: brak nowych. Nadal aktualna (od rundy 1, potwierdzona przez Final Control jako
ODDALONA/zamknieta na poziomie kodu tego tematu, ale wciaz wymagajaca dzialania orkiestratora):
wlasna integracja fixu silnika rundy 1 (`_activateUnit`, `battleScene.ts`) do `main` nie
zostala jeszcze wykonana -- ten temat nadal czeka w kolejce integracyjnej za
P-BITWA-OBRONCY-PRZED-MUREM-Q1 (juz w `main`, `6094c585`).

RUNDY: 2/5
NASTEPNY KROK: Evaluator PASS-WITH-NOTES -> Final Control (weryfikacja niezalezna analogiczna
do rundy 1, na WLASNYM tymczasowym scaleniu z aktualnego `origin/main`). Po PASS Final Control:
orkiestrator integruje RECZNIE fix silnika rundy 1 (`_activateUnit`, tekst combined bloku juz
dwukrotnie potwierdzony -- przez Final Control rundy 1 i niezaleznie w tej rundzie) razem z
nowym testem (`3571b302`) do `main`.
DEPLOY/PUSH: NIE WYKONANO
