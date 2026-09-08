STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-MENU-TRUDNOSC-TOOLTIP-ROZNICE-Q1
GOAL: Dodaj w ekranie wyboru trudności (nowa gra) czytelny tooltip/podpowiedź wyjaśniającą
konkretne, mechaniczne różnice między Łatwy/Normalny/Trudny — żeby gracz mógł podjąć
świadomą decyzję zanim zacznie grę, wzorem istniejących podpowiedzi przy opcjach
Zaawansowane (`gra/src/ui/newGameFlow.ts`, pole `hint` przy każdej opcji, np. „Trudność
miast-państw" linia ok. 1228). Czysto informacyjny dodatek UI — ZERO zmian w liczbach
balansu, ZERO zmian w logice gry.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- `gra/src/ui/newGameFlow.ts` — znajdź GŁÓWNY selektor trudności (`_menuDifficulty`,
  Łatwy/Normalny/Trudny, mapowany w `gra/src/main.ts:34106-34116` przez `diffMap`) — to
  NIE jest ta sama kontrolka co „Trudność miast-państw" w opcjach Zaawansowane (linia
  ok. 1227), to jest GŁÓWNY wybór na wcześniejszym kroku (prawdopodobnie krok 1 lub 2
  formularza nowej gry). Sprawdź świeżo czy ma już pole `hint`/`lbl` w tym samym wzorcu
  co opcje Zaawansowane — jeśli tak, dopisz treść tam; jeśli nie, dodaj analogiczny
  mechanizm (np. ikonka „i"/tooltip przy etykiecie trudności).
- Świeżo zweryfikowana (przez orkiestratora, przed tym dispatchem) lista faktycznych
  różnic Normal vs Hard — użyj jako materiału źródłowego, ale ZWERYFIKUJ KAŻDĄ liczbę
  świeżym Read/grep we wskazanych plikach przed wpisaniem do UI (kod się zmienia,
  orkiestrator sprawdzał to przed chwilą, ale mogło się przesunąć):
  1. **Koszt gracza** (`gra/src/game/difficulty-cost.ts:64-72`, `getCostMultiplierForOwner`):
     normal — gracz ×1; hard — gracz płaci **×2** za budynki/jednostki/badania (AI nadal ×1).
  2. **Próg wzrostu populacji** (`difficulty-cost.ts:107-115`): normal symetryczny ×1;
     hard — gracz ×2 progu (wolniejszy wzrost), AI ×0.5 progu (szybszy wzrost).
  3. **Limit populacji miasta bez Spichlerza/Akweduktu** (`gra/data/econ-params.json`
     klucz `akwedukt_prog_ludnosci`, `gra/src/game/economy.ts:1122-1130`): easy 6 / normal
     5 / hard 4 (dotyczy WSZYSTKICH, nie tylko gracza).
  4. **Bonus produkcji AI** (`gra/src/game/ai.ts:544-557` `loadDifficultyParams`, pole
     `bonusProdukcja`): normal +10%, hard +25% (tylko „główne" cywilizacje AI).
  5. **Bonus nauki AI** (`bonusNauka`, to samo miejsce): normal +1/turę, hard +2/turę.
  6. **Bonus walki AI** (`bonusWalka`, `gra/src/game/ai-difficulty-bonus.ts:25-26,40-55`):
     normal +0%, hard +5% do ataku/obrony w zwarciu i ataku dystansowego.
  7. **Bonus startowy AI**: normal +1 darmowa jednostka startowa; hard +1 dodatkowe miasto
     startowe (zamiast jednostki) — `gra/src/game/ai-difficulty-bonus.ts:79-128`.
  8. **Agresywność AI** (mnożniki `agresjaMnoznik`/`dyplomacjaAktywnosc`/`celObranie`,
     `gra/src/game/ai.ts:520-537,552-555`): agresja 1.0→1.2, aktywność dyplomatyczna
     1.0→1.25, preferencja atakowania najsłabszego 0.5→1.0.
  9. **Progi dyplomacji** (`gra/src/game/diplomacy.ts:470-475`
     `DIPLOMACY_DIFFICULTY_DELTA`): +10 na hard (trudniej o sojusz/NAP/wasalizację itd.).
  10. **Barbarzyńcy/Ludy Morza** (`gra/src/game/barbarians.ts`): jednostek na obóz 1/2/3;
      przejęcie miasta przez barbarzyńców możliwe TYLKO na hard; najazdy morskie co 6/3/1 turę.
  UWAGA: „Trudność miast-państw" (`_menuCityStateDifficulty`/`_menuCityStateDifficultyVsPlayer`,
  `gra/src/game/city-state-difficulty.ts`) jest OSOBNĄ osią z osobnym tooltipem już
  istniejącym (newGameFlow.ts:1228) — NIE dubluj tej treści tutaj, tylko odeślij do niej
  jednym zdaniem jeśli to naturalne (np. „miasta-państwa mają osobne ustawienie w
  Zaawansowane").

ZADANIE:
1. Znajdź główny selektor trudności w `newGameFlow.ts`, świeżo zweryfikuj każdą liczbę
   z listy wyżej we wskazanych plikach.
2. Dodaj czytelny tooltip/hint (styl spójny z istniejącymi podpowiedziami Zaawansowane —
   zwięzły, po polsku, bez żargonu programistycznego) — priorytetyzuj 3-4 NAJWAŻNIEJSZE
   różnice (koszt gracza ×2, tempo wzrostu populacji, bonus produkcji/walki AI), resztę
   możesz skrócić do jednego zbiorczego zdania („dodatkowo: AI agresywniejsza dyplomatycznie
   i militarnie, ostrzejsze progi dyplomacji, więcej barbarzyńców") — to jest tooltip
   startowy, nie ściana tekstu.
3. Żywy dowód Chromium: zrzut ekranu pokazujący tooltip faktycznie widoczny przy najechaniu/
   kliknięciu na selektor trudności, dla każdego z 3 poziomów jeśli treść się różni per
   poziom (albo jeden wspólny tooltip z tabelą, jeśli tak zaprojektujesz).

BINARNE KRYTERIUM SUKCESU: gracz na ekranie wyboru trudności (przed startem gry) widzi
tooltip/podpowiedź z konkretnymi, poprawnymi (świeżo zweryfikowanymi) różnicami Normal/Hard,
potwierdzone żywym zrzutem Chromium. Zero zmian w gra/src poza samym UI/treścią (żadna
z cytowanych liczb balansu nie jest zmieniana, tylko opisywana).

ALLOWLISTA:
- `gra/src/ui/newGameFlow.ts` (WYŁĄCZNIE dodanie/rozszerzenie tooltipa przy selektorze
  trudności — bez zmiany logiki wyboru/mapowania trudności)
- `gra/tools/*-test.cjs` (nowa bramka jeśli zasadna, albo rozszerzenie istniejącej)
- `dyspozycje/autobot/runs/R-MENU-TRUDNOSC-TOOLTIP-ROZNICE-Q1/*`
Zakaz `git add -A`. Zakaz zmiany JAKIEJKOLWIEK liczby balansu (to jest temat czysto opisowy).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przepisania liczb z tego dispatchu bez świeżej
weryfikacji w kodzie (main.ts/ai.ts/itd. mogły się zmienić od czasu tego dispatchu).
Zakaz deklaracji „tooltip widoczny" bez żywego zrzutu Chromium.

IZOLACJA: worktree `/home/user/wt-menu-trudnosc-tooltip`, gałąź
`autobot/R-MENU-TRUDNOSC-TOOLTIP-ROZNICE-Q1`, baza `origin/main` @ `38d0d695`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>
--emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — temat wizualny, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
