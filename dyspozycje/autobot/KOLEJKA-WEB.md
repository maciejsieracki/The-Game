# KOLEJKA WEB — tematy do uruchomienia (czytana przez heartbeat :17 i :47)

Zasada (właściciel 2026-11-12): zawsze 4 aktywne tematy. Gdy heartbeat zastaje mniej niż 4 aktywne workflowy web,
MUSI w tej samej turze uruchomić kolejny temat z poniższej listy (dispatch najpierw na docs-branchu, potem Workflow).
Aktywny = agent-*.jsonl zmodyfikowany w ciągu ostatnich 10 minut i brak wyniku FC w journal.jsonl.
Po zakończeniu tematu: integracja, deploy ROBOCZA, push, sprzątanie dysku (worktree zakończonych workflowów).

## Kolejka (od góry)
1. #287 Teksty administratora ulepszeń w tooltipie (nie w treści). Źródła: gra/src/ui/buildModeHud.ts (~191–196, 683, 743, 751), gra/src/game/auto-build-gate.ts (AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT, AUTO_BUILD_NEEDS_ADMINISTRATOR_HINT). Dispatch: DO NAPISANIA. Operator HAIKU.
2. #277 Wznowienie W35 (R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1, wf_e6f8a7c9-0d8) przez resumeFromRunId. Operator SONNET (uzasadnione: 2 porażki Haiku). Po wyniku: pytanie ABC do właściciela o częstość ofert AI.
3. #298 Audyt respektu AI wobec gracza (29/100 mimo 10× przewagi). Dispatch: 3ee2aa2e1 (istnieje). Read-only. Operator HAIKU.
4. #299 Audyt obrażeń dystansowych vs pancerz. Dispatch: f5d8cdaae (istnieje). Read-only. Operator HAIKU.
5. #300 Weryfikacja rozejm 10 tur vs pokój stały (FALA 605). Read-only. Operator HAIKU.
6. #272 Obserwacje na żywo: LIVE-VERIFY W18/W24, pomiar strat zwycięzcy w trybie ręcznym. Read-only. Operator HAIKU.

## Wykluczone na żądanie właściciela
- #286 Wojownik barbarzyńców „z supermocą” — NIE uruchamiać (poz. 2 z listy właściciela, wykluczona z pracy).

## Tematy zajęte (nie uruchamiać ponownie)
- R-WEB-CITY-SIDE-TOP-RO-LOOP-BOOT-ERROR-Q1 (wdrożenie FALA 667 w toku).
- R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1 (#282).
- R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1 (#283, #290).
- R-WEB-BATTLE-HIT-MODE-SETTING-Q1 (#285; FC PASS, integracja po BOOT ERROR).

## Zakazane
- R-WEB-BATTLE-DETERMINISTIC-EXPECTED-OUTCOME-Q1 — zastąpiony przez HIT-MODE, nie uruchamiać.
- Tematy Rust (rust-port/, parity-v2, PORT-*) — poza zakresem tego czatu.
