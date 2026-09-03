TEMAT: P-DYPLO-UMOWY-AKTYWNE-NA-GORZE-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/ui/diplomacyAudience.ts (wyłącznie funkcja dealsColumnHtml)
MODEL+EFFORT: claude-sonnet-5, effort high (mala, dobrze zlokalizowana zmiana, ale wymaga
zywej weryfikacji w przegladarce jak kazdy temat UI)

WYZWALACZ (dosłownie od właściciela, zrzut ekranu panelu "Możliwe umowy")
"Sprawdź, czy jest możliwość, aby podczas rozmów dyplomatycznych wszystkie aktywne statusy
były na samej górze, a nieaktywne zgodnie z obecną kolejnością."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji)
- Lista "Możliwe umowy" renderowana w `dealsColumnHtml(st)` (`diplomacyAudience.ts:1704-1776`).
  `visible = st.actions.filter(a => a.id !== '1')` — dzisiejsza kolejnosc pochodzi wprost z
  `st.actions` (kolejnosc zdefiniowana gdzie indziej, prawdopodobnie w danych/konfiguracji akcji
  dyplomatycznych — NIE zmieniac tego zrodla, tylko kolejnosc RENDEROWANIA w tej funkcji).
- Kazda pozycja ma juz policzony boolean `isLocked` (linia 1734):
  `const isLocked = a.locked || !a.enabled || a.active === true || onTableBlocks;` — DOKLADNIE
  ten sam predykat decyduje dzis o wygaszeniu kafelka (klasa `locked`, atrybut `disabled`, ikona
  klodki). "Aktywne statusy" z wyzwalacza wlasciciela = `!isLocked` (kafelek klikalny, bez
  klodki, widoczny w zrzucie jako "Traktat handlowy"/"Umowa wymiany surowcow"); "nieaktywne" =
  `isLocked` (kafelek wygaszony, ikona klodki, tekst np. "Niedostepne u rywala tego samego
  typu").
- Renderowanie dzis dzieje sie w jednym `.map()` na `visible`, potem `.join('')` — kolejnosc HTML
  = kolejnosc tablicy `visible`. Zeby posortowac wynik, trzeba (a) policzyc `isLocked` dla
  kazdego elementu PRZED renderem (albo najpierw zmapowac na obiekty {a, isLocked, html}, potem
  posortowac, potem zlaczyc), (b) sortowanie musi byc STABILNE — zachowac dzisiejsza wzgledna
  kolejnosc wewnatrz grupy aktywnych i wewnatrz grupy nieaktywnych, tylko przesunac cala grupe
  aktywnych przed cala grupe nieaktywnych. `Array.prototype.sort` w Node/V8 jest dzis stabilny
  (ES2019+), wiec `visible.slice().sort((x, y) => Number(isLockedOf(x)) - Number(isLockedOf(y)))`
  jest bezpieczne — ale NIE zakladac tego bez potwierdzenia w kodzie/testu, bo zalezy od silnika
  JS uzywanego przy renderze (przegladarka, nie tylko Node).

GOAL
1. W `dealsColumnHtml`, lista kafelkow w kolumnie "Mozliwe umowy" ma renderowac sie w kolejnosci:
   NAJPIERW wszystkie pozycje z `isLocked === false` (aktywne/klikalne), w ich DZISIEJSZEJ
   wzglednej kolejnosci wzgledem siebie; POTEM wszystkie pozycje z `isLocked === true`
   (nieaktywne/wygaszone), rowniez w ich DZISIEJSZEJ wzglednej kolejnosci wzgledem siebie.
2. Zero zmian w logice `isLocked`/`cls`/`statusNote`/`hoverTip`/ikonach — WYLACZNIE kolejnosc
   renderowania kafelkow. Wyglad pojedynczego kafelka (aktywnego i nieaktywnego) pozostaje
   identyczny.
3. Licznik w naglowku (`<span class="cnt">` + visible.length) bez zmian — liczy WSZYSTKIE
   widoczne pozycje, nie tylko aktywne.
4. `multiHint` (podpowiedz o wielu umowach na stole) bez zmian pozycji/logiki — zostaje pod
   lista, jak dzis.
5. Zachowanie STABILNE: jesli dwa aktywne kafelki maja dzis kolejnosc X przed Y, po zmianie
   nadal X jest przed Y (i analogicznie dla dwoch nieaktywnych) — sprawdzone na co najmniej
   jednym scenariuszu z 3+ aktywnymi i 3+ nieaktywnymi pozycjami jednoczesnie.

KRYTERIA KOŃCA (binarne)
1. Zywy render w headless Chromium (Playwright) panelu audiencji dyplomatycznej z mieszanka
   aktywnych i nieaktywnych umow pokazuje wszystkie aktywne kafelki NAD wszystkimi nieaktywnymi.
2. Wzgledna kolejnosc wewnatrz grupy aktywnych identyczna jak PRZED zmiana (ten sam test,
   porownanie kolejnosci data-aid PRZED i PO na tej samej fixture).
3. Wzgledna kolejnosc wewnatrz grupy nieaktywnych identyczna jak PRZED zmiana.
4. Wyglad pojedynczego kafelka (klasy CSS, tekst, ikony, tooltip) bit-for-bit identyczny jak
   PRZED zmiana — zmienia sie WYLACZNIE pozycja w liscie, nie tresc/styl.
5. Licznik w naglowku "Mozliwe umowy" nadal pokazuje pelna liczbe widocznych pozycji.
6. Zero regresji na istniejacych testach panelu audiencji dyplomatycznej (znajdz je reconem,
   np. `diplomacy-audience-*-test.cjs` lub podobne w gra/tools/).
7. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/diplomacyAudience.ts — WYLACZNIE funkcja `dealsColumnHtml`. Zaden inny eksport,
  zadna inna kolumna panelu audiencji (traktaty, akcje, itd.).
- Nowy lub rozszerzony plik testu w gra/tools/*-test.cjs dla tego tematu.
Zakazane bezwzglednie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**, dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana zrodla `st.actions`
(dane/konfiguracja akcji dyplomatycznych) — to jest zrodlo prawdy dla dzisiejszej kolejnosci
"nieaktywne zgodnie z obecna kolejnoscia", nie wolno go ruszac.

IZOLACJA
worktree /home/user/wt-dyplo-umowy-aktywne-na-gorze, gałąź autobot/P-DYPLO-UMOWY-AKTYWNE-NA-GORZE-Q1,
baza jawnie: origin/main (commit d5851c6e lub nowszy jesli main ruszyl w miedzyczasie).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-dyplo-umowy --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie sa nim objete.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 2/3 (stabilnosc kolejnosci wewnatrz grup) za spelnione bez zywego
porownania listy data-aid PRZED zmiana i PO zmianie na TEJ SAMEJ fixture z co najmniej 3
aktywnymi i 3 nieaktywnymi pozycjami jednoczesnie — nie zakladac stabilnosci sortu z samej
dokumentacji jezyka, bo scenariusz renderu dziala w przegladarce (silnik JS moze byc inny niz
Node uzywany do samych testow jednostkowych), i bo bledny predykat sortujacy (np. porownanie
zwracajace 0 dla par tego samego stanu bez jawnej stabilnosci) latwo przeoczyc bez zywego dowodu.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawke; runda N+1 idzie na TYM SAMYM ID i TEJ SAMEJ
gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integruja, nie deployuja, nie pushuja. Final Control i integracja
(allowlist-only, per plik i per hunk) dzieja sie poza worktree Operatora, reka orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jesli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
