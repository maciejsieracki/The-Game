# R-TECH-ESC-FS — Escape zamyka drzewko przed pełnym ekranem

**Status:** 🟢 ZDEPLOYOWANE FALA 16 `290a962b` · verify AutoBot PASS · ROBOCZA `540d2490` (2026-08-05)  
**Plik:** `gra/src/ui/techTreeView.ts` · commit `4bec493`

## Prośba (cytat)
> Jeżeli wejdzie się do drzewka technologii w badaniach, a wcześniej był włączony pełny ekran, to nie da się wyjść bez usunięcia pełnego ekranu. Escape najpierw wychodzi z pełnego ekranu, a dopiero potem wychodzi z drzewka technologii, a powinno być na odwrót.

## Rozwiązanie
Przeglądarka konsumuje Escape w pełnym ekranie zanim zdarzenie trafi do strony. Na czas otwartego drzewka:
- `navigator.keyboard.lock(['Escape'])` w `lockEscape()` przy `showTechTreeView()`
- `unlockEscape()` przy `hideTechTreeView()`
- `keydown` capture (`onKeyDownCapture`, `true`) — `preventDefault` + `hideTechTreeView()`

Poza Chromium API nie ma → fallback: przycisk „Wróć" (`R-TECH-WROC`).

## Weryfikacja AutoBot (2026-08-05)
- [x] `lockEscape` / `unlockEscape` + `keyboardLockApi()` — linie 891–922
- [x] Podpięcie show/hide — linie 1125–1135
- [x] Escape zamyka confirm modal przed drzewkiem — linie 871–876
- [x] W bundlu `gra-robocza/Gra-ROBOCZA.html` (md5 `540d2490`)
- [x] `tsc --noEmit` 0 · `tech-tree-test.cjs` 19/19

## Uwaga playtest
W Chromium: wyjście z pełnego ekranu przy zablokowanym Escape = **przytrzymanie** Escape.
