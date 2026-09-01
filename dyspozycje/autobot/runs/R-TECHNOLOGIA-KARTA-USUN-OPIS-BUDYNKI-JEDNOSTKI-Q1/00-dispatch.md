TEMAT:  R-TECHNOLOGIA-KARTA-USUN-OPIS-BUDYNKI-JEDNOSTKI-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel, zrzut ekranu karty technologii (Kolejne technologie/karta
odkrycia): wiersze w sekcji „Budynki" (np. Stolarnia, Palisada drewniana)
mają dodatkowy opisowy tekst po prawej stronie (np. „Epoka Kamienia · Drewno
w magazynie państwa (na koszt budowy i bramkę surowca)", „Epoka Kamienia")
oraz wiersze w sekcji „Jednostki" (np. Taran) mają dodatkowy tekst roli
(„Oblężnicza"). Właściciel: „Wydaje mi się, że w tym miejscu (...) nie jest
potrzebny dodatkowy opis (...) jeśli ktoś będzie chciał, wejdzie w stolarnię
lub palisadę i zobaczy, co potrzebuje (...) trochę to zaśmieca kartę." Po
pytaniu doprecyzowującym, właściciel: usunąć w OBU sekcjach (Budynki +
Jednostki).

## GOAL
Usuń dodatkowy opisowy tekst po prawej stronie wierszy w sekcjach „Budynki"
i „Jednostki" karty technologii (`gra/src/ui/entityCards/technologyAdapter.ts`).
NIE dotykaj innych sekcji tej samej karty („Ulepszenia terenu", „Kolejne
technologie", „Zmiany ekonomiczne") — ich opisowy tekst po prawej jest
merytoryczny i celowy (np. „Wymaga też: Garncarstwo, Murarstwo"), nie ma z
tym problemu.

Konkretnie (potwierdzone reconem, linie orientacyjne w `technologyAdapter.ts`
~145-175):
- Budynki: pole `value` w `buildingsRows` obecnie sklejone z
  `epokaLabel`+`b.wymagania`/`buildingEffectText(b)` przez `' · '` — zmień na
  pusty string (usuń całą tę logikę wyliczania `value` dla tej sekcji).
- Jednostki: pole `trailing: u['Rola (linia)'] ?? u.Typ ?? undefined` w
  `unitsRows` — usuń tę linię/pole całkowicie (nie ustawiaj `trailing` wcale).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Wiersze w sekcji „Budynki" nie renderują żadnego tekstu po prawej stronie
   (poza ikoną/linkiem) — potwierdzone realnym zrzutem z żywej przeglądarki
   (headless Chromium) PRZED i PO zmianie, ta sama karta technologii.
2. Wiersze w sekcji „Jednostki" nie renderują roli/typu po prawej — analogiczne
   zrzuty PRZED/PO.
3. Sekcje „Ulepszenia terenu", „Kolejne technologie", „Zmiany ekonomiczne" na
   TEJ SAMEJ karcie pozostają BEZ ZMIAN — ten sam zrzut PRZED/PO pokazuje ich
   identyczną zawartość (dowód, że zmiana jest lokalna, nie zbiorcza).
4. Linkowanie do budynku/jednostki (klik w wiersz → otwiera kartę budynku/
   jednostki) nadal działa — nie tylko `value`/`trailing` się zmienia, `linkTo`
   pozostaje nietknięte.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych + istniejące
   testy CivPedia/karty technologii (jeśli istnieją pod tym plikiem — sprawdź
   grepem `technologyAdapter` w `gra/tools/`) bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/ui/entityCards/technologyAdapter.ts` (wyłącznie `buildingsRows` i
`unitsRows`, bez dotykania `renderer.ts` czy innych sekcji tego samego pliku).
Zakazane bezwzględnie: `gra/src/game/**`, `gra/data/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-TECHNOLOGIA-KARTA-USUN-OPIS-BUDYNKI-JEDNOSTKI-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1/2 za spełnione na podstawie samego czytania kodu
(„usunąłem pole, więc się nie wyświetli") — wymagany realny zrzut z żywej,
zbudowanej gry (headless Chromium) pokazujący kartę PRZED i PO. Zakaz
przypadkowego usunięcia `linkTo` przy okazji czyszczenia `value`/`trailing` —
to osobne pole, musi zostać.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla zrzutu w przeglądarce). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
