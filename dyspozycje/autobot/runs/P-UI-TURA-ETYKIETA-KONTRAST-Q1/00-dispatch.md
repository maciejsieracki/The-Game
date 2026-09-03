TEMAT: P-UI-TURA-ETYKIETA-KONTRAST-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/ui/bottomBarHud.ts (WYŁĄCZNIE reguła CSS `.et-turn-lbl`)
MODEL+EFFORT: claude-sonnet-5, effort high (mała, dobrze zlokalizowana zmiana wizualna,
wymaga żywej weryfikacji w przeglądarce na kilku kolorach terenu)

WYZWALACZ (dosłownie od właściciela, zrzut ekranu paska dolnego z etykietą tury)
"Trzeba zrobić, żeby te tury były trochę bardziej widoczne, bo czasem, gdy jest coś na
żółtym terenie, to się całkowicie zmywa i nic nie widać. Może warto zmienić to na kolor
niebieski."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji)
- Dokładnie zlokalizowane: `gra/src/ui/bottomBarHud.ts:102`,
  `.civ-bottom-bar .et-turn-lbl{...color:#8a8070;...}` — etykieta „Tura X · Rok" (budowana
  w linii 245: `'<div class="et-turn-lbl">Tura ' + turn + (year ? ' · ' + year : '') +
  '</div>'`).
- `.civ-bottom-bar` (kontener nadrzędny, linia 55-58) ma `background:transparent;
  border:none` — CAŁY pasek dolny (poza własnymi tłami przycisków „Wykonaj"/„Zakończ
  turę") renderuje się BEZPOŚREDNIO nad mapą 3D, bez własnego nieprzezroczystego tła.
  Etykieta tury siedzi POD przyciskiem „Zakończ turę", na tym przezroczystym tle — stąd
  bezpośrednie mieszanie się koloru `#8a8070` (przygaszony szaro-oliwkowy) z kolorem
  terenu pod spodem, zwłaszcza żółtym/piaskowym.
- Inne elementy tego samego pliku radzą sobie z podobnym problemem przez `text-shadow`/
  ciemne tło pod tekstem (np. `.et-hint` ma własne nieprzezroczyste tło, linia ok.
  110-121) — ALE etykieta tury nie ma i nie powinna dostać pełnego tła (zaburzyłoby to
  minimalistyczny wygląd paska, poza zakresem zgłoszenia) — rozważ zamiast tego
  `text-shadow` (ciemny kontur/poświata) DODANY do koloru tekstu, co jest bardziej
  odporne na zmienność koloru terenu pod spodem niż sama zmiana koloru tekstu na inny
  pojedynczy kolor (niebieski też może się zlewać z terenem wodnym/niebieskim).
  Właściciel zaproponował konkretnie niebieski — potraktuj to jako JEDNĄ z rozważanych
  opcji, nie sztywny wymóg; jeśli recon/test na żywo pokaże, że sam text-shadow (bez
  zmiany koloru) daje wystarczający kontrast na WSZYSTKICH typach terenu, to też
  spełnia GOAL. Jeśli Operator wybierze inny kolor niż niebieski, uzasadnij w raporcie
  testem kontrastu.

GOAL
1. Etykieta „Tura X · Rok" (`.et-turn-lbl`) jest czytelna (wyraźny kontrast) na
   WSZYSTKICH typowych kolorach terenu widocznych pod przezroczystym paskiem dolnym —
   w szczególności żółty/piaskowy (zgłoszenie właściciela), ale też sprawdź zielony i
   niebieski (woda), żeby nie naprawić jednego przypadku kosztem innego.
2. Rozwiązanie: zmiana koloru tekstu (`color`) i/lub dodanie `text-shadow` (ciemny
   kontur/poświata) — wybierz podejście, które daje najlepszy kontrast na wszystkich
   sprawdzonych terenach, nie tylko żółtym. Zachowaj rozmiar czcionki, `letter-spacing`,
   `text-transform`, pozycję — WYŁĄCZNIE `color`/nowy `text-shadow`.
3. Zero zmian w pozostałych regułach CSS tego pliku, w strukturze HTML paska, ani w
   logice budowania etykiety (main.ts/bottomBarHud.ts poza tą jedną regułą CSS).

KRYTERIA KOŃCA (binarne)
1. Żywy zrzut w headless Chromium: etykieta tury nad żółtym/piaskowym terenem —
   PRZED (dzisiejszy kolor, potwierdzony jako słabo czytelny) i PO (wyraźnie czytelny
   tekst, kontrast potwierdzony np. obliczeniem WCAG lub jednoznacznie widoczny na
   zrzucie).
2. Ten sam test na zielonym i niebieskim (woda) terenie — PO zmianie nadal czytelny
   (nie regresja w drugą stronę).
3. Reszta paska dolnego (przyciski, ich kolory, tła) — bit-for-bit bez zmian,
   potwierdzone zrzutem/porównaniem.
4. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/bottomBarHud.ts — WYŁĄCZNIE reguła CSS `.civ-bottom-bar .et-turn-lbl`.
- Nowy lub rozszerzony test w gra/tools/*-test.cjs, jeśli temat tego wymaga (np.
  odczyt computed style w żywym renderze).
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana innych
reguł CSS tego pliku (przyciski Wykonaj/Zakończ turę, et-hint, et-tooltip), zmiana
logiki wyznaczania tekstu tury/roku.

IZOLACJA
worktree /home/user/wt-ui-tura-kontrast, gałąź autobot/P-UI-TURA-ETYKIETA-KONTRAST-Q1,
baza jawnie: origin/main (najnowszy commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ui-tura-kontrast --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryteriów 1-2 za spełnione na podstawie samej wartości koloru w kodzie —
wymagany żywy zrzut Chromium na co najmniej trzech różnych kolorach terenu (żółty,
zielony, niebieski/woda) PRZED i PO, z widocznym porównaniem, nie tylko deklaracją że
"kontrast jest teraz lepszy".

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora,
ręką orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
