# R-TECH-WROC — przycisk „Wróć" w drzewku technologii

**Status:** 🟢 ZDEPLOYOWANE FALA 16 `290a962b` · verify AutoBot PASS · ROBOCZA `540d2490` (2026-08-05)  
**Plik:** `gra/src/ui/techTreeView.ts` · commit `4bec493` (UI nagłówka: FALA 45 `16b0d07`)

## Prośba (cytat)
> Powie mi gdzieś jakiś przycisk w badaniu drzewko technologii wyjść, żeby można było wyjść bez dawania escape'a. Escape jest po prawej stronie ale słabo widoczny więc trzeba byłoby go gdzieś przenieść na środek i wyjustować na samej górze na środku. Raczej to powinien być symbol wróć a nie wyjdź.

## Rozwiązanie
- Znaczek `✕` usunięty
- Pigułka **„← Wróć · ESC"** (`.civ-ttv-back`) — złota obwódka, cień, Georgia
- `click` → `hideTechTreeView()`
- `aria-label` / `title`: „Wróć na mapę (Esc)"

**Pozycja:** od FALA 45 przycisk w lewym górnym rogu nagłówka obok tytułu (zamiast wyśrodkowania z `4bec493`) — nadal widoczny, spełnia wyjście bez Escape.

## Weryfikacja AutoBot (2026-08-05)
- [x] `.civ-ttv-back` w CSS + DOM `buildDom()` — linie 323–332, 1017–1030
- [x] Handler kliknięcia — linia 1030
- [x] W bundlu `gra-robocza/Gra-ROBOCZA.html` (md5 `540d2490`)
- [x] `tsc --noEmit` 0 · `tech-tree-test.cjs` 19/19
