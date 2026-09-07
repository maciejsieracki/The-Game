STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1
GOAL: Recon-only mapa faz `triggerPlayerEndTurn()` + plan implementacji Etapu 4 — uzupełniona rundą 2 o odpowiedzi na wszystkie 5 zarzutów Evaluatora, zero zmian kodu.
ZMIANY-COMMIT: brak zmian w `gra/src/**`; jeden plik zaktualizowany — `dyspozycje/autobot/runs/R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1/01-operator-runda1-analiza.md` (dopisana sekcja 9 + drobne korekty w sekcji 1/3). `git status --short` pokazuje wyłącznie ten katalog jako untracked.
TESTY: nie dotyczy (recon).
BLOKADY: brak formalnych.
RUNDY: 2/5
NASTEPNY KROK: Final Control.
OBRONA:
1 -> PRZYJMUJE. Świeży odczyt main.ts:28524-28528 potwierdza `for (const st of cityOrderState.values()) { if (st.bunt) st.bunt = undefined; }` — operuje na `cityOrderState` (deklaracja main.ts:4303, `Map<string,OrderState>` keyowana po `city.id`, zero filtra ownera), nie na `anim`. Sklasyfikowane jako Ryzyko #1b, dopisane do §6.1 Krok 1 (do przeniesienia do `runWorldEndTurn()` razem z resztą Ryzyka #1).
2 -> PRZYJMUJE. main.ts:28907-28909: `if (autoRationResult.adjusted) { ...; if (ownerId===0) { pendingAutoRationForNextTurn = autoRationResult; } }` — ustawiane tylko dla ownera 0 mimo `adjusted` liczonego per-owner; flush main.ts:32915-32920 tuż przed `finally`. Ta sama klasa co Ryzyko #4. Dopisane jako Ryzyko #4b.
3 -> PRZYJMUJE. main.ts:10908-10909: `if (!rep || rep.ownerId !== 0) return;` — guard przed warunkiem endTurnInProgress/isPreBattleOpen (main.ts:10928), który cytowałem w rundzie 1 bez tego wcześniejszego guardu. W hot-seat scalenie jednostek człowieka #2 nigdy nie trafi do `deferredMergePrompts`. Dopisane jako Ryzyko #4c.
4 -> PRZYJMUJE. Grep potwierdza `nextTurnNum` (28521) użyte 5/6 razy PO `turn++` (28647): 28692, 28703, 30426, 30715, 32480, 32806 vs jedyne użycie przed granicą @28645. §6.1 Krok 0 zaktualizowany: `runWorldEndTurn()` musi albo dostać `nextTurnNum` jako parametr, albo przeliczyć je lokalnie na starcie — bez tego "dosłowny" copy-paste zostawia martwe odwołanie do zmiennej z zewnętrznego domknięcia.
5 -> PRZYJMUJE. Grep `flushDeferredAutoPreBattle()` daje 12 trafień, z czego main.ts:28325 i 28341 to linie komentarza opisowego, nie wywołania. Faktycznych wywołań: 10, nie 11. Korekta wpisana w sekcji 3/9; nie wpływa na żaden wniosek dokumentu.
DEPLOY/PUSH: NIE WYKONANO
