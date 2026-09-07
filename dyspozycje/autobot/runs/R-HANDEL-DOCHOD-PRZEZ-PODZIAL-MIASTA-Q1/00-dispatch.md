# R-HANDEL-DOCHOD-PRZEZ-PODZIAL-MIASTA-Q1 — dispatch

TEMAT: `R-HANDEL-DOCHOD-PRZEZ-PODZIAL-MIASTA-Q1`
RUNDA: 1/5
DOMAIN: GAME (zmiana mechaniki ekonomii — ECHO właściciela już zebrane, nie zgaduj kierunku)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Zgłoszenie właściciela: „Sprawdź, czy pieniądze z handlu lądują od razu bezpośrednio w
skarbcu, czy przechodzą przez całą rundę podziału jeszcze na naukę i rozwój, bo mam takie
wrażenie, że od razu wpadają w całości do skarbca." Recon orkiestratora POTWIERDZIŁ:
`turn-economy.ts:2687,2775` — `pieniadz: pieniadzPoWealth + pieniadzZTras`, komentarz
kontraktowy `turn-economy.ts:2641-2643` mówi wprost „dochod dystansowy z tras — CZYSTO do
skarbca, dodany PO mnozniku Wealth".

**ECHO właściciela (AskUserQuestion, już zebrane, WIĄŻĄCE):** „**Pełna integracja: przed
mnożnikiem Wealth**" — dochód z tras handlowych ma być traktowany identycznie jak reszta
przychodów miasta: wchodzi do puli PRZED mnożnikiem zamożności (więc budynki zamożności go
podbijają), a suwaki Handlu dzielą go na naukę/złoto jak resztę `handelNetto`. Właściciel
przyjął JAWNIE, że to **zwiększy** łączny dochód z handlu i wymaga sprawdzenia balansu — to
NIE jest niespodzianka do zgłoszenia jako DECISION_REQUIRED, to zaakceptowany skutek uboczny.

## GOAL

1. Przekieruj dochód z tras handlowych (`computeTradeRouteIncomeByCity`, `trade-routes.ts:1637`,
   wołane w `main.ts:27879-27881`, ląduje dziś jako `pieniadzZTras` w `turn-economy.ts:2644`) do
   puli DZIELONEJ suwakami Handlu (`handelNetto` w `economy.ts`, ok. linii 989-1010), PRZED
   mnożnikiem Wealth — czytaj kod, nie zgaduj dokładnego punktu wpięcia (funkcja
   `advanceCityEconomy`, `turn-economy.ts` w okolicach linii 2600-2800).
2. Usuń osobne dodawanie `pieniadzZTras` PO mnożniku Wealth (linia ok. 2687/2775) — zastąp
   integracją w głównym strumieniu przed podziałem.
3. Zachowaj identyczne traktowanie gracza i AI (`main.ts:28337-28338` gracz,
   `main.ts:28387-28388`/`28412-28415` AI) — ta sama `advanceCityEconomy`, zero rozjazdu.
4. NIE zmieniaj samego `computeTradeRouteIncomeByCity` (wzoru dochodu z tras) — tylko punkt
   wpięcia wyniku do reszty ekonomii miasta.
5. Zmierz i zaraportuj REALNY wpływ na całkowity dochód (np. jedno miasto z aktywnym handlem,
   porównanie przed/po) — właściciel jawnie oczekuje wzrostu, ale chce widzieć skalę.

## BINARNE KRYTERIUM SUKCESU

- Dochód z tras handlowych przechodzi przez suwaki Handlu (dzieli się na naukę/złoto) I przez
  mnożnik Wealth — potwierdzone REALNYM wywołaniem funkcji silnika w nowej/rozszerzonej
  bramce (nie ręcznie przeliczonym wzorem).
- Zero różnicy między traktowaniem gracza i AI.
- Wzór samego dochodu z tras (`computeTradeRouteIncomeByCity`) NIETKNIĘTY.
- Wszystkie istniejące testy `trade-routes-*`, `economy*`, `wealth-test`, `trade-routes-income-test`
  zielone lub świadomie zaktualizowane (jeśli literały zakładały starą, oddzielną ścieżkę —
  zaktualizuj z uzasadnieniem, nie osłabiaj liczby asercji).
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/src/game/turn-economy.ts`
- `gra/src/game/economy.ts` (tylko jeśli konieczne dla wpięcia do puli suwaków — nie zmieniaj
  samych progów/wag suwaków)
- `gra/tools/trade-routes-income-test.cjs`, `gra/tools/wealth-test.cjs` i inne bramki
  bezpośrednio dotknięte zmianą wpięcia (dodaj nowe asercje zamiast usuwać istniejące)
- `dyspozycje/autobot/runs/R-HANDEL-DOCHOD-PRZEZ-PODZIAL-MIASTA-Q1/**`

Zakazane bezwzględnie: `gra/src/game/trade-routes.ts` (wzór dochodu z tras — NIETKNIĘTY),
`gra/data/**`, pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-handel-podzial-miasta`, gałąź
`autobot/R-HANDEL-DOCHOD-PRZEZ-PODZIAL-MIASTA-Q1`, baza jawnie `origin/main` (commit
`7440cf8a` w chwili założenia, może być nowszy przy starcie pracy — potwierdź `git log -1`
PRZED pracą, SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian wzoru dochodu z tras samego w sobie (`trade-routes.ts`) — tylko przekierowanie
  punktu wpięcia wyniku.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Jeśli podczas pracy odkryjesz, że zmiana wymaga dotknięcia czegoś poza allowlistą (np.
  struktury `EconomyTick`/typu zwracanego) — STOP, DECISION_REQUIRED z opisem, nie rozszerzaj
  zakresu samodzielnie.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
