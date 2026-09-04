TEMAT: P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME (treść/nazewnictwo)
ŚCIEŻKA: gra/data/terrain-improvements.json + gra/src/render/improvements.ts +
gra/src/main.ts + gra/src/map/improvement-build.ts (WYŁĄCZNIE wystąpienia nazwy
wyświetlanej „Wyrąb", patrz allowlista)
MODEL+EFFORT: claude-sonnet-5, effort medium (Operator) / claude-sonnet-5,
effort high (Evaluator) — temat treściowy, reguła bazowa R-PROC-AUTOBOT.md §5a.
Final Control Sonnet 5, effort high.

WYZWALACZ
"Zamień nazwę ulepszenia Wyrąb na Wycinka."

RECON (wykonane przez orkiestratora — zweryfikowane bezpośrednim odczytem kodu
2026-09-04, nie powtarzaj, buduj na tym)
Klucz wewnętrzny ulepszenia to `wyrab` (`gra/src/render/improvements.ts:39`,
`gra/data/terrain-improvements.json`) — POZOSTAJE BEZ ZMIAN, nie dotyczy nazwy
wyświetlanej, zmiana klucza złamałaby zapisane stany gry/referencje.
Kanoniczna nazwa wyświetlana: `gra/data/terrain-improvements.json:174`
`"nazwa": "Wyrąb"`.
Dodatkowe, WŁASNE hardkodowane wystąpienia nazwy (NIE czytane z JSON w
runtime, wymagają osobnej zmiany dla pełnej spójności):
- `gra/src/render/improvements.ts:39` — `{ key: 'wyrab', label: 'Wyrąb',
  epoka: 1 }` w osobnej, statycznej liście etykiet UI (sprawdź w rundzie czy ta
  lista faktycznie zasila jakiś widoczny dla gracza element, czy jest martwa/
  redundantna wobec JSON — jeśli żywa, zmień `label`, jeśli martwa, zostaw
  komentarz w raporcie, nie usuwaj poza zakresem tego tematu).
- `gra/src/main.ts:12100` — `'Wyrąb' + costPart + ': +20 Pracy/turę przez 3
  tury...'` (komunikat hint przy zaznaczeniu akcji).
- `gra/src/main.ts:28014` — `'Wyrąb: +' + drewnoCredit + ' Drewna (pozostało '
  + st.turnsLeft + ' tury)'` (komunikat hint po zbiorze).
- `gra/src/main.ts:31437` — `` `[AI ${ownerId}] Wyrąb @ (${cmd.q},${cmd.r})...` ``
  (log konsoli AI — nie user-facing, ale spójność nie zaszkodzi; opcjonalnie).
- `gra/src/map/improvement-build.ts:471` — `` `${name} na lesie zabroniona —
  najpierw wyrąb las (Wyrąb w panelu ulepszeń).` `` — UWAGA: to zdanie zawiera
  DWA różne słowa o wspólnym rdzeniu: czasownik pospolity „wyrąb" (odmiana
  trybu rozkazującego czasownika „wyrąbać", NIE nazwa ulepszenia — zostaje BEZ
  ZMIAN) oraz rzeczownik własny „Wyrąb" w nawiasie, odnoszący się KONKRETNIE
  do nazwy ulepszenia w panelu — TYLKO ten drugi fragment zmienia się na
  „Wycinka".
Komentarze kodu (nie user-facing, poprawa kosmetyczna, NIE wymagana i POZA
zakresem tego dispatchu): `auto-improvements.ts:824,944,946`,
`improvement-build.ts:364,428,1279`, `lasy-modele.ts:152`.
`gra/data/wikiBundle.json` zawiera też wystąpienie — sprawdź w rundzie, czy to
plik GENEROWANY z innego źródła (wtedy popraw źródło, nie sam bundle, i
udokumentuj proces regeneracji) czy plik statyczny do edycji wprost.

GOAL
1. `gra/data/terrain-improvements.json:174`: `"nazwa": "Wyrąb"` →
   `"nazwa": "Wycinka"`.
2. `gra/src/render/improvements.ts:39`: `label: 'Wyrąb'` → `label: 'Wycinka'`
   (o ile ta lista jest żywa — zweryfikuj żywo w Chromium, nie zgaduj z kodu).
3. `gra/src/main.ts:12100,28014`: zamień „Wyrąb" na „Wycinka" w komunikatach
   hint widocznych dla gracza. Linia 31437 (log konsoli AI) — opcjonalnie, dla
   pełnej spójności, nie krytyczne.
4. `gra/src/map/improvement-build.ts:471`: zamień WYŁĄCZNIE fragment „Wyrąb w
   panelu ulepszeń" na „Wycinka w panelu ulepszeń" — NIE dotykaj czasownika
   „wyrąb las" wcześniej w tym samym zdaniu.
5. `gra/data/wikiBundle.json`: zaktualizuj zgodnie z ustaleniem czy to plik
   generowany czy statyczny (patrz RECON).
6. Klucz wewnętrzny `wyrab` (identyfikator w danych/kodzie) POZOSTAJE BEZ ZMIAN
   wszędzie — zmienia się WYŁĄCZNIE tekst wyświetlany graczowi.

KRYTERIA KOŃCA (binarne)
1. Żywy zrzut Chromium: panel ulepszeń terenu (build mode) pokazuje „Wycinka"
   zamiast „Wyrąb" jako nazwę tej opcji budowy — zero pozostałości „Wyrąb"
   widocznych dla gracza w tym panelu.
2. Żywy test: hint pokazywany przy zaznaczeniu akcji wycinki na mapie
   (`main.ts:12100`) i hint po zbiorze Drewna (`main.ts:28014`) pokazują
   „Wycinka", nie „Wyrąb".
3. Komunikat blokady budowy na lesie (`improvement-build.ts:471`) pokazuje
   „...najpierw wyrąb las (Wycinka w panelu ulepszeń)." — czasownik „wyrąb"
   NIETKNIĘTY, tylko nazwa w nawiasie zmieniona.
4. `grep -rn "Wyrąb" gra/src gra/data` (poza komentarzami kodu, jawnie
   wyłączonymi z zakresu w GOAL) zwraca ZERO wystąpień w user-facing stringach.
5. Klucz `wyrab` (identyfikator) bez zmian — grep potwierdza brak regresji w
   zapisach stanu gry/testach referujących ten klucz.
6. `tsc --noEmit` czysty, istniejące testy dotykające ulepszeń terenu/wycinki
   lasu (grep `gra/tools/*wyrab*-test.cjs`, `gra/tools/*las*-test.cjs`,
   `gra/tools/*improvement*-test.cjs`) nadal zielone, 5 bramek referencyjnych
   zielone.

ALLOWLISTA (nic poza tym)
- gra/data/terrain-improvements.json (WYŁĄCZNIE pole `nazwa` wpisu `wyrab`).
- gra/src/render/improvements.ts (WYŁĄCZNIE `label:` w linii 39).
- gra/src/main.ts (WYŁĄCZNIE literały stringowe „Wyrąb" w liniach 12100,
  28014, opcjonalnie 31437 — zero innych zmian w tym pliku).
- gra/src/map/improvement-build.ts (WYŁĄCZNIE fragment „Wyrąb" w nawiasie,
  linia 471 — zero zmian w reszcie zdania/pliku).
- gra/data/wikiBundle.json (zgodnie z ustaleniem z RECON pkt 5).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: zmiana klucza `wyrab` gdziekolwiek, zmiana komentarzy
kodu (poza zakresem, nie wymagane), zmiana logiki mechaniki wycinki lasu,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-wyrab-wycinka-rename, gałąź
autobot/P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona
kompilacja to node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 4 za spełnione przez grep tylko w jednym pliku — sprawdź
WSZYSTKIE pliki wymienione w RECON, w tym `wikiBundle.json`. Zakaz założenia, że
`improvements.ts:39` jest martwe bez żywej weryfikacji w Chromium (otwórz panel
budowy, sprawdź czy ta etykieta się tam faktycznie pojawia). Zakaz zmiany
czasownika „wyrąb" w `improvement-build.ts:471` przez nieuwagę — to DWA różne
słowa w jednym zdaniu, zweryfikuj że po zmianie zdanie nadal brzmi poprawnie
gramatycznie po polsku.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM
SAMYM ID i TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach:
LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują i nie pushują.

OBIEG
Operator (Sonnet 5, effort medium) → Evaluator (Sonnet 5, effort high) →
Operator (obrona, jeśli zarzuty niepuste) → Final Control (Sonnet 5, effort
high) → integracja orkiestratora.
