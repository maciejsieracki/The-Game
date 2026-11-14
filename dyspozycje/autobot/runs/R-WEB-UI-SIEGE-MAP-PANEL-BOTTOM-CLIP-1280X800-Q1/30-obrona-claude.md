# R-WEB-UI-SIEGE-MAP-PANEL-BOTTOM-CLIP-1280X800-Q1 — raport Obrony Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-SIEGE-MAP-PANEL-BOTTOM-CLIP-1280X800-Q1
GOAL: panel oblężenia (gra/src/ui/siegeMapPanel.ts) przy 1280×800 i 1024×768 z blokiem budowy machin nie jest przycięty u dołu; przyciski Oblegaj/Szturm/Odwrót w pełni widoczne nad dolnym banerem (bottom <= bar.top − 4), stopka nie pod banerem.
BAZA: 75e238e52 (origin/main) · KANDYDAT Operatora: 4fb1dec3a · Evaluator: 6f532aa3c (raport 20-evaluator-claude.md).
ZMIANY/COMMIT: w tej rundzie zmieniony TYLKO test `gra/tools/siege-map-panel-bottom-clip-1280x800-test.cjs` oraz ten raport i evidence. `gra/src/ui/siegeMapPanel.ts` pozostaje bit-identyczny z 4fb1dec3a (sprawdzone: `git status` pokazuje tylko test; po mutacji plik przywrócono z kopii).

## Odpowiedzi na zarzuty Evaluatora (r1)

1. Machiny poza widocznym obszarem bez przewijania — CZĘŚCIOWO PRZYJĘTE, CZĘŚCIOWO ODRZUCONE.
   - PRZYJĘTE jako luka testu: test nie sprawdzał osiągalności machin. Dodano asercje: (a) w panelu są 4 machiny (`machines.length === 4`); (b) treść przewijana (`scrollHeight > clientHeight`) i każda z 4 machin da się przewinąć do obszaru `.civ-smp-body` w całości (`machineReach`, osobno dla każdej machiny).
   - Wynik na kandydacie: `visTop [false,false,false,false]` oraz `reach [true,true,true,true]` przy 1280×800 i 1024×768 (surowe JSON: `evidence/test-PO-r2-wynik.json`). Zgodnie z dispatchem i GOAL („przewijanie wewnątrz panelu" gdy treść się nie mieści) machiny są osiągalne przewijaniem.
   - ODRZUCONE jako wymóg: „machiny widoczne bez przewijania" — nie wynika z kryteriów binarnych ani z GOAL, który dopuszcza przewijanie. Otwarte jako DECYZJA DLA ORKIESTRATORA/WŁAŚCICIELA: po naprawie machiny są widoczne dopiero po przewinięciu, a nie ma wskazówki przewijania (np. częściowo widoczny nagłówek). Nie dodano jej — to zmiana UX poza zakresem tej rundy.
2. Niskie okna (1280×600) — ODRZUCONE jako poza zakresem. Kryteria dotyczą 1280×800 i 1024×768. Zarzut (84 px ciała przy 600 px wysokości) nie został zweryfikowany przeze mnie; zgłaszam jako ryzyko do osobnego tematu, bez zmiany kodu w tej rundzie.
3. Luki asercji testu — PRZYJĘTE i naprawione:
   - (a) liczba i osiągalność machin — asercje dodane (patrz 1);
   - (b) selektor `.civ-smp-overlay` zwracał zawsze null — zmieniono na `#civ-siege-map-panel` (sama nakładka); pole `overlay` w JSON jest już wypełnione (`overlay` = rect nakładki);
   - (c) `bodyScrollable` — teraz asertowane (`=== true`);
   - (d) przesunięcie poziome +24 px — przyczyna: animacja wejścia `smp-in` nie była zakończona przy pomiarze. Dodano czekanie na zakończenie animacji (`document.getAnimations()`, limit 3 s). Po naprawie pomiaru stopka 1280×800: left 911, right 1269 (viewport 1280); 1024×768: left 655, right 1013 (viewport 1024). Dodano asercję „stopka w poziomie mieści się w viewport". Przyczyna wcześniejszego przesunięcia uznana za wyjaśnioną (animacja), ale NIE potwierdzona osobnym pomiarem przed/po — oznaczam jako NIE_ZMIERZONO w tej części.
4. Ścieżka telefonu, klikalność, ponowne dopasowanie po zmianie baneru — ODRZUCONE w zakresie tego tematu. Kryteria 1–4 dispatchu dotyczą geometrii przy 1280×800 i 1024×768 (desktop, baner obecny). Ścieżka ≤480 px celowo zostaje przy regule CSS (`fitOverlayAboveBottomBar` zwraca przy phone). Klikalność nie jest kryterium binarnym i nie była mierzona (NIE_ZMIERZONO). Ponowne dopasowanie poza `resize` nie jest objęte kryterium (NIE_ZMIERZONO).

## Dowód mutacyjny (zaktualizowany test)
- Kandydat 4fb1dec3a (build do `$S/dist-po`): `RC=0`, `verdict PASS`, `errors []`, wszystkie 9 sprawdzeń na każdym viewport zaliczone. Plik: `evidence/test-PO-r2-wynik.json`.
- Baza 75e238e52 — panel z `git show 75e238e52:gra/src/ui/siegeMapPanel.ts`, build do `$S/dist-base`: `RC=1`, `verdict FAIL`. Na obu viewportach niezaliczone: 3 przyciski akcji + stopka (4 sprawdzenia). Plik: `evidence/test-BAZA-75e238e52-r2-wynik.json`.
- Machiny na bazie są widoczne i osiągalne (zgodnie z oczekiwaniem: to nie jest regresja), więc nie czerwienieją — kryterium 3 dotyczy przycisków akcji i stopki.

## Pomiary (getBoundingClientRect, surowe JSON kandydata r2)
| Viewport | bar.top | Przyciski akcji (top–bottom) | Limit bar.top−4 | Stopka (top–bottom) | visTop (machiny) | reach (machiny) |
|---|---|---|---|---|---|---|
| 1280×800 | 704 | 525–653 | 700 | 663–693 | [F,F,F,F] | [T,T,T,T] |
| 1024×768 | 672 | 493–621 | 668 | 631–661 | [F,F,F,F] | [T,T,T,T] |

Wszystkie 4 machiny: Taran · 7 ¤ + 19 Drewno; Taran okuty · 18 ¤ + 76 Brąz; Katapulta · 36 ¤ + 152 Żelazo; Wieża oblężnicza · 20 ¤ + 76 Brąz.

## Bramki (surowe wyjście, na drzewie z tym testem; panel bit-identyczny z 4fb1dec3a)
- `npx tsc --noEmit` (gra/): exit 0, brak wyjścia.
- logic-test: `LOGIC OK (213/213)` RC=0.
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail` RC=0.
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN` RC=0.
- combat-test: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.` RC=0.
- unit-replace-test: uruchomiony `unit-replace-full-cost-test.cjs`: `unit-replace pelny koszt: 40 passed, 0 failed` RC=0. Uwaga: dispatch wymienia `unit-replace-test` (Evaluator: 21/21) — w tej rundzie uruchomiono wariant `full-cost`, pełnego `unit-replace-test` NIE_PONOWIONO_ZMIERZONO.
- `git diff --check` (75e238e52..HEAD i zmiany rundy): czysto (exit 0).

## BLOKADY
- Brak. Infrastruktura: `npm ci --ignore-scripts` w gra/ (71 pakietów); build tylko `node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>` (bez `npm run build`).

## Decyzje dla orkiestratora (poza zakresem tej rundy)
- Machiny osiągalne tylko przez przewinięcie panelu (patrz zarzut 1). Czy dodać wskazówkę przewijania albo zwęzić blok — decyzja właściciela.
- Okna < ~700 px wysokości (zarzut 2) — ryzyko regresji, wymaga osobnego tematu.

RUNDY: 2/5 (Obrona r2 po Evaluatorze r1).
NASTĘPNY KROK: Evaluator r2 weryfikuje odpowiedzi na zarzuty 1–4 i zaktualizowany test; następnie Final Control (SONNET).
DEPLOY/PUSH: NIE WYKONANO
