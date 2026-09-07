# P-AI-ZDOBYCIE-MIASTA-CZTERY-LUKI-Q1 — dispatch

TEMAT: `P-AI-ZDOBYCIE-MIASTA-CZTERY-LUKI-Q1`
RUNDA: 1/5
DOMAIN: INFRA (dokładanie/doprecyzowanie asercji pokrycia — zero zmiany mechaniki)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Final Control (runda 2) tematu `P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1`
(ZINTEGROWANY, PASS, zero NAPRAW) zostawił cztery znaleziska do osobnej rejestracji — wszystkie
`ODDAL` w tamtej rundzie (nie defekt tego tematu), ale warte zapisania i domknięcia jako
osobny temat pokrycia bramek. Wszystkie cztery dotyczą tej samej rodziny bramek AI/zdobycie
miasta.

**FC-N2 (priorytet).** Wpięcie `targetVisible` w wywołanie egzekutora w `main.ts` nie jest
pilnowane przez ŻADNĄ bramkę — mutacja FC11 (`targetVisible` na sztywne `true`) zostaje zielona
w bramce tematu I w całej rodzinie (gracz/barbarzyńcy/AI, 11 bramek). Kod sprzed tego tematu,
nie regresja — ale luka pokrycia realna.

**FC-N1.** Asercja `K4-DYSTANS` w `ai-zdobycie-miasta-adiacencja-test.cjs` jest tautologiczna
dla mutacji FC4 (zdjęcie bramki adiacencji zostawia BRAMKĘ TEMATU zieloną), ALE ta sama
mutacja czerwieni `city-hex-movement-test` (12/13) i `ai-city-capture-integration-test`
(10/14) — pokrycie jest, tylko w innej bramce niż oczekiwano. Planista trzyma niezależną
bramkę `isWithinCityAttackRange` (`gra/src/game/ai.ts:802`, `hexDistance === 1`).

**FC-N4.** Asercje `A5f-A5h` (egzekucja wyrażenia `unitIsCivilian`) przepuszczają behawioralnie
równoważną kopię formuły zamiast prawdziwego użycia `isCivilianUnit` (kopia formuły zamiast
importu, 88/88 zielone).

**F4 (kosmetyczne).** Crash bramki po wypisaniu faili obserwowany pod kilkoma mutacjami, ale
exit code zawsze `!= 0` przy tym, więc fałszywa zieleń jest niemożliwa — czysto kosmetyczne.

## GOAL

1. **FC-N2:** dodaj nową asercję (w `ai-zdobycie-miasta-adiacencja-test.cjs` albo innej bramce
   rodziny — wybierz najwłaściwszą po przeczytaniu kodu) pilnującą, że `targetVisible: false`
   blokuje ruch/przejęcie w wywołaniu egzekutora w `main.ts`. Dowód mutacyjny: mutacja
   `targetVisible` na sztywne `true` musi po tej zmianie czerwienić bramkę.
2. **FC-N1:** doprecyzuj komentarz przy asercji `K4-DYSTANS`, że realne pokrycie tej mutacji
   leży w bramkach sąsiednich (`city-hex-movement-test`, `ai-city-capture-integration-test`),
   nie w tej — czysto dokumentacyjne, zero zmiany logiki asercji.
3. **FC-N4:** dołóż asercję, że wywołanie A5f-A5h faktycznie używa `isCivilianUnit`
   (`gra/src/units/setup.ts` lub gdzie faktycznie żyje), nie kopii formuły — np. przez podmianę
   funkcji w module (monkey-patch/mock) i sprawdzenie, że wynik się zmienia, kiedy podmieniona
   funkcja zwraca coś innego.
4. **F4:** w `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs` opakuj wypisywanie wyniku w
   try/catch, żeby crash nie maskował komunikatu diagnostycznego. Nie wpływa na poprawność
   wyniku (exit code już dziś zawsze `!= 0` przy crashu), tylko na czytelność.

## BINARNE KRYTERIUM SUKCESU

- Nowa asercja FC-N2 istnieje i dowodnie łapie mutację `targetVisible=true` (pokaż w raporcie:
  PRZED naprawą fałszywie zielone, PO naprawie czerwone przy tej samej mutacji).
- Komentarz FC-N1 dodany, zero zmiany logiki/wyniku istniejących asercji.
- Nowa asercja FC-N4 istnieje i dowodnie odróżnia prawdziwe wywołanie `isCivilianUnit` od kopii
  formuły (podmiana funkcji faktycznie zmienia wynik testu).
- F4: try/catch dodany, komunikat diagnostyczny widoczny nawet przy crashu, exit code
  zachowania bez zmian.
- **Zakaz osłabiania i usuwania istniejących asercji** we wszystkich dotkniętych bramkach —
  liczba całkowita rośnie lub zostaje, nigdy nie spada.
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs`
- `gra/tools/city-hex-movement-test.cjs` (tylko jeśli FC-N2 najlepiej pasuje tutaj)
- `gra/tools/ai-city-capture-integration-test.cjs` (tylko jeśli FC-N2 najlepiej pasuje tutaj)
- `dyspozycje/autobot/runs/P-AI-ZDOBYCIE-MIASTA-CZTERY-LUKI-Q1/**`

Zakazane bezwzględnie: `gra/src/**`, `gra/data/**`, pliki z sekretami, `docs/decyzje/**`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-ai-adiacencja-cztery-luki`, gałąź
`autobot/P-AI-ZDOBYCIE-MIASTA-CZTERY-LUKI-Q1`, baza jawnie `origin/main` (commit `568f1bbe`
w chwili założenia, może być nowszy przy starcie pracy — potwierdź `git log -1` PRZED pracą,
SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki/kodu produkcyjnego — wyłącznie dokładanie/doprecyzowanie asercji
  bramek.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Jeśli w trakcie pracy odkryjesz, że któreś z czterech znalezisk wymaga jednak zmiany
  `gra/src/**` — STOP, DECISION_REQUIRED z opisem, nie rozszerzaj zakresu samodzielnie.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
