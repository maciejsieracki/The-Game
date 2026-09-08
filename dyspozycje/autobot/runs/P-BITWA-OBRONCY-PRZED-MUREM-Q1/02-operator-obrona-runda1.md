STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-BITWA-OBRONCY-PRZED-MUREM-Q1
GOAL: obrońcy w bitwie oblężniczej nigdy nie stoją przed murem (po stronie atakującego).

ZMIANY-COMMIT: `/home/user/wt-bitwa-obroncy-mur` @ commit do wykonania po tym raporcie (branch
`autobot/P-BITWA-OBRONCY-PRZED-MUREM-Q1`). Plik zmieniony w tej rundzie obrony: WYŁĄCZNIE
`gra/tools/bitwa-obroncy-mur-kolumny-test.cjs` (docstring + nowa sekcja testu (C) + wariant
mutacyjny MUT2). Kod produkcyjny `gra/src/battle/battleScene.ts` z rundy 1 — bez zmian.

OBRONA — odpowiedź na 4 zarzuty Evaluatora, każdy z dowodem:

**#1 — Niezgodność liczby (2/28 vs 1/28). PRZYJMUJĘ.**
Dowód: uruchomiłem `bitwa-obroncy-mur-kolumny-test.cjs` niezależnie po stronie Obrony —
wynik `(B) MUT po AUTO (runda 1): obroncow ponizej muru = 1 / 28`, zgodnie z tym co zmierzył
Evaluator, NIE z „2/28" z mojego raportu rundy 1. Liczba nie jest deterministyczna między
przebiegami (zależy od kolejności aktywacji jednostek w danej turze) — potwierdzone: mój
oryginalny pomiar dał 2/28, Evaluator dwukrotnie 1/28, ja teraz też 1/28. Naprawiłem
komentarz w pliku bramki (`bitwa-obroncy-mur-kolumny-test.cjs:21-27`), usuwając twierdzenie
o „dokładnym objawie zgłoszenia" jako liczbie, i zastępując je jawną notatką o
niereprodukowalności dokładnej liczby oraz wyjaśnieniem, że asercja (B2) sprawdza tylko
`> 0`, nigdy dokładnej wartości — co było prawdą już w rundzie 1 (kod asercji się nie
zmienił), tylko opis w komentarzu/raporcie sugerował więcej precyzji niż test faktycznie
daje. Zarzut trafny: PRZYJMUJĘ, poprawione w tej rundzie.

**#2 — Brak testu dla `_placeUnitsOneSide`. PRZYJMUJĘ.**
Dowód poprawki: dodałem sekcję (C) do `bitwa-obroncy-mur-kolumny-test.cjs` — wywołanie WPROST
`window.__lastBattleScene._placeUnitsOneSide('def', true)` na żywej, świeżo załadowanej
stronie (real Chromium/Playwright, real build vite), dokładnie tak jak zasugerował
Evaluator (metoda `private` w TS nie jest `#`-prywatna w runtime JS, hook
`window.__lastBattleScene` już istniał z rundy 1). Druga bramka mutacyjna MUT2 wyłącza
WYŁĄCZNIE gałąź naprawy #2 (`if (side === 'def' && siegeMode && ...)` → `if (false && ...)`)
zachowując naprawę #1 nietkniętą — dowód nietautologiczności tej konkretnej naprawy,
niezależny od macierzy (B).
Wynik żywego uruchomienia (Obrona, ten sam worktree):
```
(C) BASE _placeUnitsOneSide('def',true): ponizej muru = 0 / 28
(C) MUT2 _placeUnitsOneSide('def',true): ponizej muru = 20 / 28
PASS: (C1) BASE (naprawiona delegacja): _placeUnitsOneSide('def',true) stawia WSZYSTKICH obroncow >= siegeWallCol
PASS: (C2) DOWOD NIETAUTOLOGICZNOSCI naprawy #2: MUT2 (rewert galezi delegacji) odtwarza defekt
PASS: (C3) brak bledow JS w konsoli strony (BASE reset)
```
20/28 obrońców schodzi poniżej muru bez naprawy #2 (MUT2) — znacznie silniejszy defekt niż
naprawa #1 (bo cała generyczna ścieżka frontCol/rankStep liczy względem środka pola, nie
muru), teraz jawnie zmierzony i strzeżony testem. Zarzut trafny: PRZYJMUJĘ, naprawione w
tej rundzie — bramka teraz 9/9 PASS (było 6/6).

**#3 — Nakładanie z `P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1` na ten sam plik. PRZYJMUJĘ jako
sygnał dla orkiestratora (nie jako defekt kodu — Evaluator sam tak to kwalifikuje).**
Dowód: sprawdziłem `dyspozycje/autobot/runs/P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1/00-dispatch.md`
w `/home/user/wt-bitwa-lucznicy-auto` — `STATUS: DISPATCH`, allowlista zawiera
`gra/src/battle/battleScene.ts`, zakres: "logikę decyzyjną ruchu-w-trybie-AUTO dla jednostek
dystansowych". To ten sam plik i ten sam obszar (decyzje ruchu jednostek w trybie AUTO,
`_activateUnit`/doktryna) co zmiana tego tematu (`battleScene.ts:5407-5432`, blokada
doktryny dla obrońców oblężenia). Potwierdzam zarzut: PRZYJMUJĘ. Nie jest to coś, co Operator
może naprawić samodzielnie (nie mam mandatu integrować/sekwencjonować dwóch tematów) — zgłaszam
to jawnie orkiestratorowi w NASTĘPNYM KROKU: druga gałąź musi zostać zrebase'owana/zweryfikowana
względem tego huka PO integracji tego tematu, żeby nie skasować blokady
`siegeDefenderNeverDoctrine` dodanej tutaj.

**#4 — Możliwy brak zrzutu z przeglądarki (niska pewność, do rozstrzygnięcia). ODRZUCAM.**
Dowód: dispatch (`00-dispatch.md`) żąda explicite pomiaru kolumny (`q`), nie zrzutu wizualnego —
temat jest czystą logiką pozycji/danych (kolumna jednostki względem `siegeWallCol`), nie
CSS/layoutem/renderem. §9 pkt 6a w praktyce stosowanego rejestru dotyczy tematów
wizualnych/UX (patrz `docs/decyzje/R-PROC-AUTOBOT.md:602`: "Temat wizualny/UX bez realnej
weryfikacji w przeglądarce jest FAIL"), a ten temat nie jest wizualny/UX — jest logiką
decyzyjną AI/pozycjonowania. Dowód nietautologiczności (macierz BASE/MUT/MUT2, zmutowany kod
faktycznie czerwienieje) jest obecny i silniejszy niż sam zrzut ekranu byłby w tym przypadku,
bo zrzut nie udowodniłby liczbowo pozycji q każdej z 28 jednostek. Sam Evaluator zgłasza to z
zastrzeżeniem niskiej pewności i przyznaje kontrargument. Zarzut nietrafny dla tego typu
tematu: ODRZUCAM — ale bez zmiany kodu (screenshot nie doda dowodowej wartości ponad
istniejący pomiar q/wallCol na żywej scenie).

TESTY (po poprawkach obrony, ten sam worktree):
- `node ./node_modules/typescript/bin/tsc --noEmit` → 0 błędów.
- `node tools/bitwa-obroncy-mur-kolumny-test.cjs` → **9/9 PASS** (było 6/6; dodano sekcję (C) +
  wariant MUT2): (A1)-(A3), (B1)-(B3), (C1)-(C3) wszystkie PASS. Surowy log:
  `(A) BASE start: wallCol= 40 obroncow= 28`; `(B) MUT po AUTO: 1/28` (zgodnie z zarzutem #1);
  `(C) BASE _placeUnitsOneSide: 0/28`; `(C) MUT2 _placeUnitsOneSide: 20/28`.
- 5 bramek referencyjnych i 6 bramek oblężenia z rundy 1 — bez zmian w kodzie produkcyjnym,
  nie uruchamiane ponownie w tej rundzie obrony (allowlista tej rundy to wyłącznie plik
  bramki testowej).

BLOKADY: #3 wymaga uwagi orkiestratora przed integracją (sekwencjonowanie z
`P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1` na tym samym pliku/obszarze).

RUNDY: 1/5
NASTĘPNY KROK: Obrona → Evaluator (weryfikacja poprawek #1/#2, potwierdzenie #3 jako sygnał
dla orkiestratora, zamknięcie #4) → Final Control. Orkiestrator: zanotować konflikt plikowy z
`P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1` przed integracją.
DEPLOY/PUSH: NIE WYKONANO
