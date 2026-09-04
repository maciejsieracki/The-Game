TEMAT: R-MINIMAPA-IKONA-ROBOTNIK-KOLOR-Q1
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME (UI wizualne)
ŚCIEŻKA: gra/src/ui/hud.ts (WYŁĄCZNIE ikony przycisków worker/deposit w rzędzie
`.civ-hud-util-dock`)
MODEL+EFFORT: claude-opus-5, effort medium (Operator) / claude-opus-5, effort high
(Evaluator) — temat wizualny/UX, R-PROC-AUTOBOT.md §9 punkt 6b. Final Control
zostaje Sonnet 5, effort high jak w regule bazowej.

WYZWALACZ (zgłoszenie właściciela, 2026-09-04, ze zrzutem ekranu)
Zrzut ekranu paska narzędzi nad minimapą (rząd zoom, po integracji
`R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1`): "Chłopak jest do poprawy, żeby był
tak jak wszystkie ikony, złotym kolorem i nie wyróżniał się." Na zrzucie ikona
"👤" (worker toggle) renderuje się jako ciemna/czarna sylwetka, wyraźnie
kontrastująca z resztą rzędu (kilof, kontrolki zoom), które wizualnie są w
odcieniach złota/bursztynu spójnych z motywem UI.

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
Przyczyna ustalona z pewnością (nie teoria): oba przyciski `workerBtn`
(`hud.ts:1241-1246`) i `depositBtn` (`hud.ts:1247-1252`) renderują SUROWE znaki
Unicode emoji jako treść przycisku — `icon: '👤'` (U+1F464) i `icon: '⛏'`
(U+26CF) — wstawiane dosłownie przez `utilToggleBtnHtml()` (`hud.ts:1220-1224`,
`opts.icon` wstawiane werbatim jako innerHTML przycisku). Emoji są rysowane przez
wbudowaną, WIELOKOLOROWĄ czcionkę emoji systemu/przeglądarki i CAŁKOWICIE
IGNORUJĄ CSS `color` — dlatego `color:#e8d88a` ustawione na
`.civ-hud-util-dock .b-util-toggle` (`hud.ts:652-657`) nie ma żadnego wpływu na
te dwie ikony. Kilof "⛏" ma DOKŁADNIE ten sam problem strukturalny (to też
emoji, nie SVG) — wygląda "znośnie" wyłącznie przez przypadek konkretnego
kroju czcionki emoji, nie dlatego że jest poprawnie zaimplementowany.

Gotowy, już działający wzorzec do naśladowania w TYM SAMYM rzędzie wizualnym
(rodzina `mini-tool-btn`, sąsiednie przyciski territory/trade-routes,
`minimapHud.ts:145,148`): inline SVG z `stroke="currentColor"`,
`viewBox="0 0 24 24"`, bez `fill` (albo `fill="none"`), np.
`TERRITORY_SVG`/`TRADE_ROUTES_SVG` — automatycznie dziedziczy kolor
`color:#e8d88a` z CSS rodzica przez `currentColor`, dokładnie tak jak reszta
przycisków w tym rzędzie. Brak gotowego SVG dla "worker"/"pickaxe" w
`gra/src/ui/icons/brand/` (sprawdzone: `icons-manifest.json` i lista assetów —
zero trafień `worker`/`pickaxe`/`deposit`/`kilof`) — trzeba go dopiero
narysować jako inline SVG (nie osobny plik, wzorem `TERRITORY_SVG`/
`TRADE_ROUTES_SVG` zdefiniowanych bezpośrednio jako stałe stringowe w kodzie).
Istniejący `gra/src/ui/icons/brand/res-work.svg` (młotek/narzędzie, obrócone
16°, `stroke="#e8d88a"`, `viewBox 0 0 24 24`) pokazuje docelowy styl kreski,
ale ma kolor zaszyty na sztywno zamiast `currentColor` — NIE kopiuj tego wzorca
dosłownie, tylko jako inspirację stylu linii.

GOAL
1. Zastąp emoji `'👤'` (worker, `hud.ts:1243`) nowym inline SVG — czytelna,
   prosta sylwetka postaci (głowa+tułów, linia, nie wypełnienie) w stylu
   `TERRITORY_SVG`/`TRADE_ROUTES_SVG`: `viewBox="0 0 24 24"`,
   `stroke="currentColor"`, `fill="none"`, `stroke-width` ok. 1.4–1.6,
   `stroke-linecap="round"` `stroke-linejoin="round"`, rozmiar `width="20"
   height="20"` (dopasuj do rzeczywistego rozmiaru sąsiednich ikon w tym
   rzędzie — zmierz w żywym DOM, nie zgaduj).
2. Zastąp emoji `'⛏'` (deposit, `hud.ts:1249`) analogicznym inline SVG kilofa
   (ten sam root-cause co worker — dwa emoji w tym samym rzędzie, oba łamią
   `currentColor`). Właściciel wskazał wyraźnie tylko chłopka na zrzucie, ale
   pozostawienie kilofa jako emoji zostawiłoby identyczny defekt strukturalny
   tuż obok naprawionej ikony — napraw oba w tej samej rundzie, jednym
   spójnym zestawem SVG.
3. Zero zmian w `utilToggleBtnHtml()` (już przyjmuje dowolny string jako
   `icon`, w tym markup SVG — nie wymaga zmiany sygnatury) ani w CSS
   `.civ-hud-util-dock .b-util-toggle` (już poprawnie ustawia
   `color:#e8d88a` — problem był wyłącznie w treści ikony, nie w regule CSS).

KRYTERIA KOŃCA (binarne)
1. Żywy test Chromium: `getComputedStyle`/wizualny zrzut przycisku worker
   (aktywny i nieaktywny stan) pokazuje SVG w kolorze `#e8d88a` (lub
   `rgb(232,216,138)`), spójnym z sąsiednimi przyciskami w tym samym rzędzie —
   NIE ciemną/czarną sylwetkę.
2. To samo dla przycisku deposit (kilof).
3. Oba przyciski nadal poprawnie togglują odpowiedni stan (worker
   overlay/deposit overlay) po kliknięciu — zero regresji funkcjonalnej,
   `data-act`/`aria-pressed`/klasa `.on` bez zmian zachowania.
4. Rozmiar/wyrównanie nowych ikon SVG wizualnie spójne z resztą rzędu
   (mierzone w żywym DOM, nie tylko deklarowane w kodzie) — brak
   przesunięcia/rozjazdu wysokości wiersza.
5. `tsc --noEmit` czysty, istniejące testy dotykające `hud.ts`/paska minimapy
   (grep `gra/tools/*hud*-test.cjs`, `gra/tools/*minimap*-test.cjs`,
   `gra/tools/minimapa-pasek-narzedzi-reorganizacja-live-test.cjs`) nadal
   zielone, 5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/hud.ts (WYŁĄCZNIE wartości `icon:` dla `workerBtn`/`depositBtn`
  — zamiana stringów emoji na stringi inline SVG; zero innych zmian w tym
  pliku).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: zmiana CSS `.civ-hud-util-dock .b-util-toggle` (już
poprawne), zmiana `utilToggleBtnHtml()`/`renderUtilDock()` poza samą wartością
`icon`, zmiana `minimapHud.ts`/`TERRITORY_SVG`/`TRADE_ROUTES_SVG` (WYŁĄCZNIE
wzorzec do naśladowania, nie do edycji), tworzenie nowych plików w
`gra/src/ui/icons/brand/` (SVG ma być inline stringiem w `hud.ts`, wzorem
istniejących `TERRITORY_SVG`/`TRADE_ROUTES_SVG`, nie osobnym plikiem
assetu), dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json,
playbook.json.

IZOLACJA
worktree /home/user/wt-minimapa-ikona-robotnik, gałąź
autobot/R-MINIMAPA-IKONA-ROBOTNIK-KOLOR-Q1, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona
kompilacja to node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1/2 (kolor złoty) za spełnione przez samo zastąpienie
stringa emoji stringiem SVG bez faktycznej weryfikacji `getComputedStyle`
koloru w żywym Chromium — nie zakładaj że `currentColor` zadziała, sprawdź to
naocznie (zrzut ekranu + odczyt koloru z DOM). Zakaz porównania "wygląda
dobrze" bez zrzutu ekranu pokazującego oba przyciski (worker+deposit) obok
kontrolek zoom w tym samym kadrze, dowodzącego wizualnej spójności.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM
SAMYM ID i TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach:
LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Opus 5, effort medium) → Evaluator (Opus 5, effort high) → Operator
(obrona, jeśli zarzuty niepuste) → Final Control (Sonnet 5, effort high) →
integracja orkiestratora.
