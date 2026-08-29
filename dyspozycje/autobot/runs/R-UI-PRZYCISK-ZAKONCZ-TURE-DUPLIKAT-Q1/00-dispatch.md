# 00-dispatch — R-UI-PRZYCISK-ZAKONCZ-TURE-DUPLIKAT-Q1

**Data:** 2026-08-21
**Zgłoszone przez:** właściciela głosowo, w czacie orkiestratora — "stary i nowy przycisk
Zakończ turę/Wykonaj razem". Nigdzie wcześniej niezarejestrowane (zweryfikowane grepem
przed rejestracją). Nie wymaga ABC — bug wizualny/UI, nie decyzja projektowa.
**Izolacja:** branch `autobot/R-UI-PRZYCISK-ZAKONCZ-TURE-DUPLIKAT-Q1` (NIE `main`).

## GOAL

Ustalić DOKŁADNY mechanizm, przez który na ekranie pojawiają się jednocześnie stary i nowy
przycisk „Zakończ turę"/„Wykonaj" (dwie wizualnie różne wersje naraz), i albo naprawić,
albo — jeśli to fałszywy alarm (np. stary build w przeglądarce, patrz precedens z tej
sesji: karta odkrycia technologii) — jednoznacznie to wykazać i zamknąć temat bez zmiany
kodu.

## Recon wykonany PRZED dispatchem (ten etap, bez zmian w kodzie)

Ten etap to WYŁĄCZNIE research, żaden plik `gra/` nie został zmieniony.

1. `bottomBarHud.ts` (nowy design, `R-TRZY-KARTY-WDROZENIE-Q1` Karta 3) renderuje JEDEN
   stos „Wykonaj" + „Zakończ turę" w prawym dolnym rogu — to jedyne miejsce z aktywnym
   przyciskiem end-turn w bieżącym, żywym kodzie.
2. `gra/src/ui/hud.ts` ma DRUGĄ, jawnie nazwaną `renderBarLegacy()` (linia ~1180) z
   WŁASNYM przyciskiem `<button class="end" data-act="end">Zakończ turę ▶</button>`
   (linia ~1195) — to jest kandydat na „stary przycisk".
3. `renderBar()` (hud.ts ~1278) wybiera między `renderBarD1B()` (nowy, top-bar bez
   przycisku end-turn) a `renderBarLegacy()` (stary, z przyciskiem) na podstawie
   `useD1BLayout()` = `cfg?.onExecutePending !== undefined || cfg?.mapToolbar !== undefined`.
4. **Sprawdzone:** `showHud()` jest wołane w `main.ts` (~linia 18856) DOKŁADNIE RAZ, zawsze
   z pełnym configiem zawierającym `onExecutePending` i `mapToolbar` — więc
   `useD1BLayout()` powinno być ZAWSZE `true` w normalnej rozgrywce, a `renderBarLegacy()`
   powinien być dziś martwym kodem, nigdy nie wywoływanym.
5. **NIE ustalone (do dokończenia przez Operatora/recon):** skoro (4) sugeruje, że legacy
   nie powinien się renderować, skąd bierze się drugi przycisk zgłoszony przez właściciela?
   Kandydaci do sprawdzenia:
   a. Czy `bottomBarHud.ts` może się zamontować DWA RAZY (np. brak sprzątania poprzedniej
      instancji przy przejściu widoków mapa/miasto/bitwa), zostawiając dwa DOM-y z tym
      samym stosem przycisków?
   b. Czy `preBattle.ts` / ekran przygotowania bitwy ma WŁASNY, niezależny przycisk
      „Zakończ turę"/podobny, który może współwystępować z głównym stosem `bottomBarHud.ts`
      w konkretnym trybie (np. oblężenie, tryb playtest bitwy)?
   c. Czy to w ogóle bug w KODZIE, czy powtórka wzorca z tej sesji: stary/zbuforowany build
      w przeglądarce właściciela (build stamp mismatch, patrz precedens „Rolnictwo"/
      „Łowiectwo" w tym samym czacie) — do potwierdzenia/wykluczenia PRZED zmianą kodu.

## Zakres dalszej pracy (dla Operatora, po recon)

Nie zakładać z góry, że to jest bug do naprawienia kodem — może to być powtórka
scenariusza (c). Operator MUSI najpierw jednoznacznie zreprodukować lub wykluczyć
duplikat w kodzie źródłowym (nie w buildzie), zanim tknie cokolwiek. Jeśli to genuinie
martwy kod (`renderBarLegacy` nieosiągalny) — rozważyć jego usunięcie jako sprzątanie
ryzyka (dead code, które kiedyś mogło się odpalić i może się odpalić znów przy błędzie w
configu), ale to NIE jest samo w sobie GOAL tego tematu, jeśli nie da się wykazać, że to
faktyczna przyczyna zgłoszenia.

## Allowlista (wstępna, do potwierdzenia po recon)

- `gra/src/ui/hud.ts` (jeśli faktyczna przyczyna: legacy fallback)
- `gra/src/ui/bottomBarHud.ts` (jeśli faktyczna przyczyna: podwójne montowanie)
- `gra/src/ui/preBattle.ts` (jeśli faktyczna przyczyna: osobny przycisk trybu bitwy)
- `dyspozycje/autobot/runs/R-UI-PRZYCISK-ZAKONCZ-TURE-DUPLIKAT-Q1/`

Żadnych zmian poza plikiem/plikami, w których recon jednoznacznie wykaże przyczynę.

## Model / effort

Operator (recon + ewentualna naprawa) → Sonnet 5, Medium. Jeśli recon wykaże realny bug w
kodzie i naprawa wykracza poza trywialną — dalej pełna pętla Evaluator (High) → Final
Control (osobny subagent, High), limit 5 rund, bez push, bez main.
