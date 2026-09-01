TEMAT:  R-SPICHLERZ-AUTO-ZYWIENIE-TOAST-ZINDEX-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel: przycisk „Włącz Auto-Żywienie" w panelu imperium „zaznacza się
(podświetla po najechaniu), ale po kliknięciu podświetlenie znika i nie
wygląda, jakby coś się stało" — podejrzenie, że przycisk nie działa albo nie
trzyma zaznaczenia.

## RECON (wykonany, nie powtarzać — potwierdzony REALNYM testem w żywym
Chromium, nie tylko czytaniem kodu)
Etykieta, tooltip i hover przycisku działają poprawnie (poprzednie tematy
`P-SPICHLERZ-AUTO-ZYWIENIE-PRZYCISK-TEKST-Q1`/`-MASOWY-PRZYCISK-Q1` już
zintegrowane w `main`). Po kliknięciu handler poprawnie woła
`broadcastAutoWyzywienieToOwnerCities` I POPRAWNIE pokazuje toast
`showHintMessage('Auto-Żywienie włączone we wszystkich miastach bez
indywidualnego ustawienia', 2800)` (`main.ts:19988`) — potwierdzone
pollingiem co ~270ms, toast faktycznie pojawia się z właściwym tekstem przez
2800ms.

**Prawdziwa przyczyna:** toast jest WIZUALNIE PRZYĆMIONY przez backdrop
panelu imperium. `main.ts:12303`:
```js
hintToast.style.zIndex = isPreBattleOpen() ? '9950' : (isMainMenuOpen() ? '600' : '320');
```
nie uwzględnia przypadku „panel imperium otwarty" — a przycisk Auto-Żywienie
żyje WYŁĄCZNIE wewnątrz tego panelu, więc jego backdrop
(`empireDetailPanel.ts:395-397`, `.civ-emp-backdrop.open{opacity:1}`,
z-index 449) jest ZAWSZE aktywny w momencie, gdy ten toast może się pojawić.
Backdrop (z-index 449) renderuje się NAD toastem (z-index 320), przyciemniając
go ~35% (`rgba(0,0,0,.35)`) — potwierdzone `document.elementFromPoint()` na
współrzędnych toastu (zwraca element backdropu, nie toast) i pomiarem pikseli.
Stąd wrażenie „nic się nie stało" — to NIE jest brak feedbacku (toast
istnieje i ma poprawną treść), tylko toast niewystarczająco widoczny pod
przyciemnionym tłem.

Helper `isEmpireDetailPanelOpen()` (import z `./ui/empireDetailPanel`) już
istnieje i jest używany gdzie indziej w `main.ts` (np. linia 20001, 20275) —
gotowy do ponownego użycia, nie trzeba go tworzyć.

Analogiczny precedens już istnieje w TYM SAMYM warunku: gałąź
`isMainMenuOpen() ? '600' : ...` podnosi z-index toastu, gdy menu główne
(z-index 500) jest otwarte, właśnie z tego samego powodu (toast chowany pod
overlayem) — patrz komentarz przy linii 12300-12303 i 32388-32392.

## GOAL
W `gra/src/main.ts:12303` rozszerz warunek ustalający `hintToast.style.zIndex`
o gałąź dla otwartego panelu imperium — analogicznie do istniejącej gałęzi
`isMainMenuOpen()`. Wartość z-index musi być WYŻSZA niż z-index backdropu
panelu imperium (449) — użyj tej samej wartości co dla menu głównego (600)
albo innej ≥500, o ile nie koliduje z żadnym innym overlayem w tym samym
kontekście (sprawdź realnie, czy panel imperium i menu główne mogą być
otwarte jednocześnie — jeśli nie mogą, wspólna wartość 600 jest bezpieczna i
najprostsza; jeśli mogą, dobierz wartość która działa w obu przypadkach
jednocześnie).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Realny, żywy dowód w headless Chromium: panel imperium otwarty, kliknięcie
   przycisku „Włącz Auto-Żywienie” — toast jest w PEŁNI widoczny (nie
   przyciemniony przez backdrop), czytelny tekst „Auto-Żywienie włączone we
   wszystkich miastach…”. Dowód: `document.elementFromPoint()` na
   współrzędnych środka toastu zwraca element toastu (albo jego dziecko), NIE
   element backdropu panelu imperium — dokładnie odwrotność dzisiejszego
   stanu z RECON.
2. Zero regresu w innych kontekstach tego samego mechanizmu: toast bez
   żadnego panelu otwartego nadal na z-index 320, z otwartym menu głównym
   nadal na 600 (albo wspólnej, bezpiecznej wartości — patrz GOAL), z
   pre-battle nadal na 9950. Realny dowód dla WSZYSTKICH trzech
   pre-istniejących gałęzi, nie tylko nowej.
3. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (WYŁĄCZNIE linia z `hintToast.style.zIndex` ~12303 i
bezpośrednio sąsiadujący komentarz), nowy plik testowy w `gra/tools/` jeśli
Operator uzna za potrzebny (np. `hint-toast-zindex-empire-panel-test.cjs`).
Zakazane bezwzględnie: `gra/src/ui/empireDetailPanel.ts` (backdrop/z-index
449 zostają NIETKNIĘTE — poprawka idzie WYŁĄCZNIE po stronie toastu, nie
obniżamy backdropu), etykieta/tooltip/handler przycisku Auto-Żywienie (już
poprawne, nie dotyczy tego tematu), `gra/data/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-SPICHLERZ-AUTO-ZYWIENIE-TOAST-ZINDEX-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1 za spełnione na podstawie samej zmiany liczby w
kodzie — wymagany realny dowód `elementFromPoint`/zrzut z żywego Chromium z
panelem imperium otwartym, PRZED i PO. Zakaz podniesienia z-index toastu
globalnie (np. usunięcia całego warunku i ustawienia stałej wysokiej
wartości) — to zmieniłoby zachowanie dla wszystkich pozostałych gałęzi i
mogłoby złamać coś innego (np. toast nad pre-battle, gdzie dziś CELOWO jest
na najwyższym z-index 9950); zmiana ma być PUNKTOWA, dodająca jedną nową
gałąź warunku.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla żywego testu w przeglądarce). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
