STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1
GOAL: Zdiagnozuj, dlaczego cywilizacje AI budują ulepszenia terenu (farmy, tartaki,
kamieniołomy itd.) na znikomym poziomie mimo ogromnego dostępnego terytorium — jedna
cywilizacja wybudowała np. tylko 1-2 farmy na całym polu. Ustal PRAWDZIWĄ przyczynę i
napraw JEŚLI to bug; jeśli to kwestia strojenia/balansu — zatrzymaj się i przedstaw
właścicielowi opcje ABC zamiast zgadywać liczby.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela: zrzut ekranu mapy z wieloma cywilizacjami AI (Qi, Jin, Wei, Chu,
  Zhao, Yan, Luoyang, Pekin) na dużym, otwartym terenie — widoczne pojedyncze ulepszenia
  (ikony farm/budynków) rozsiane bardzo rzadko na tle ogromnej liczby pustych heksów.
  Właściciel podał trzy hipotezy do sprawdzenia (nie traktuj żadnej jako pewnik):
  1. brak Pracy (puli pracy) do budowy ulepszeń,
  2. AI przeznacza większość środków/puli na budynki miejskie, mimo że budżet budynków
     powinien mieć twardy sufit (właściciel pamięta „maksymalnie 50%"),
  3. inny, nieznany jeszcze powód.
- Istniejący, pokrewny mechanizm gracza (NIE zakładaj że AI używa tej samej ścieżki bez
  weryfikacji): split Pracy miasta między Budynki a Pulę Pracy (lokalny podział miasta,
  `R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1`) z globalnym floorem — sprawdź świeżo dokładne
  wartości i czy dotyczą też AI, w `gra/src/game/auto-manage.ts`,
  `gra/src/game/empire-city-defaults.ts`, `gra/src/game/production.ts`.
- Logika decyzyjna AI: `gra/src/game/ai.ts` — sprawdź czy AI w ogóle woła tę samą funkcję
  budowy automatycznych ulepszeń co gracz, czy ma osobną, potencjalnie niedokończoną/
  niepodłączoną ścieżkę.
- **Parytet gracz↔AI** (bariera krytyczna projektu, `R-PROC-AUTOBOT.md` §9 poz. 11): każda
  reguła/formuła obowiązująca gracza MUSI obowiązywać tak samo AI, chyba że właściciel
  jawnie i pisemnie zdecydował inaczej z uzasadnieniem w rejestrze. Jeśli znajdziesz miejsce,
  gdzie AI dostaje INNY (gorszy) traktowanie niż gracz bez takiej udokumentowanej decyzji —
  to jest DOKŁADNIE ten rodzaj defektu, którego szukasz, opisz go wprost jako taki.

ZADANIE:
1. Odtwórz problem z dowodem — headless symulacja wielu tur (wzorem istniejących bramek
   `gra/tools/*-test.cjs` z długimi rozgrywkami) ALBO żywa gra z podglądem stanu AI po
   N turach: policz faktyczną liczbę zbudowanych ulepszeń terenu per cywilizacja AI vs.
   liczba dostępnych, kwalifikujących się heksów w jej terytorium.
2. Sprawdź KAŻDĄ z trzech hipotez właściciela osobno, z dowodem (nie deklaracją):
   a. Czy AI ma realnie dostępną Pulę Pracy w danym momencie (`praca`/`pracaPool` per
      owner) — czy jest zerowa/bliska zeru systematycznie, i dlaczego (może np. bank
      Skarbiec/Nauka/utrzymanie zjada wszystko, może formuła generowania Pracy dla AI jest
      inna niż dla gracza).
   b. Czy faktyczny split Budynki/Pula Pracy dla AI przekracza udokumentowany sufit (np.
      95% na budynki zamiast max 50%) — znajdź dokładne miejsce w kodzie, gdzie AI ustawia
      ten split, i porównaj z tym co ustawia dla gracza.
   c. Jeśli (a) i (b) wykluczone — zbadaj inne kandydatury: brak kwalifikujących się
      heksów (np. zbyt restrykcyjne warunki budowy ulepszenia), kolejka budowy AI
      priorytetyzująca coś innego bez końca, cooldown/limit tur, brak technologii
      odblokowującej ulepszenie, próg trudności AI ograniczający liczbę akcji na turę.
3. Napraw źródło problemu JEŚLI to jest bug (kod robi coś innego niż zamierzone/
   udokumentowane zachowanie) — z dowodem PRZED/PO (np. liczba ulepszeń AI po tej samej
   liczbie tur, PRZED i PO naprawie, w tej samej symulacji/seedzie).
4. JEŚLI przyczyna okaże się kwestią strojenia liczb balansu (np. formuła działa zgodnie
   z zamierzeniem, ale próg/tempo jest po prostu zbyt niskie) — NIE zmieniaj liczb.
   Zatrzymaj się, opisz dokładnie znalezisko i przedstaw 2-3 opcje ABC (np. „podnieść X",
   „obniżyć Y", „zostawić bez zmian bo Z") do decyzji właściciela.

BINARNE KRYTERIUM SUKCESU: jawny, udowodniony werdykt która z hipotez (a/b/c/inna) jest
prawdziwą przyczyną, z dowodem (liczby, cytat kodu, symulacja). Jeśli bug — naprawiony
i udowodniony PRZED/PO. Jeśli strojenie balansu — zatrzymane na ABC, zero zmian liczb bez
decyzji właściciela. `tsc --noEmit` czysty, 5 bramek referencyjnych zielone (jeśli była
zmiana kodu).

ALLOWLISTA:
- `gra/src/game/ai.ts`, `gra/src/game/auto-manage.ts`, `gra/src/game/empire-city-defaults.ts`,
  `gra/src/game/production.ts` (WYŁĄCZNIE jeśli diagnoza faktycznie wskaże któryś z tych
  plików — nie zgaduj z góry)
- `gra/tools/*-test.cjs` (nowa bramka dowodu albo diagnostyczny skrypt jednorazowy w
  `dyspozycje/autobot/runs/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1/` jeśli to tylko recon)
- `dyspozycje/autobot/runs/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1/*`
Zakaz `git add -A`. Zakaz zmiany liczb balansu (progi/mnożniki/limity) bez jawnej decyzji
właściciela — patrz zadanie pkt 4.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji przyczyny bez dowodu z rzeczywistej
symulacji/stanu gry (nie samo czytanie kodu i domysł). Zakaz cichej zmiany liczby balansu
pod pretekstem "to oczywisty bugfix", jeśli w rzeczywistości jest to zmiana tempa/progu.

IZOLACJA: worktree `/home/user/wt-ai-ulepszenia-budowa`, gałąź
`autobot/P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1`, baza `origin/main` @ `3eab5c32`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>
--emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) jeśli był fix kodu; jeśli czysty recon zakończony ABC dla właściciela, Final
Control nie dotyczy.
DEPLOY/PUSH: NIE WYKONANO
