# R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1 — dispatch (#314, zgłoszenie właściciela 2026-11-12)

GAME. Baza: aeb52465e845d29acb5f7b628370789af399d673 (origin/main).

GOAL: powiadomienie „Produkcja: <miasto> — Kolejka pusta — wybierz budynek lub jednostkę” pojawia się WYŁĄCZNIE, gdy gracz realnie może coś wybudować teraz (ma surowce, skarbiec, manpower i spełnia warunki). Obecnie pojawia się mimo braku surowców, bo bramka powiadomienia (cityHasActionableProduction, gra/src/main.ts ok. linii 15006) nie jest zgodna z tym, co panel produkcji uznaje za możliwe do zrobienia.

KRYTERIA KOŃCA (binarne):
1. Miasto bez surowców na budowę/ulepszenie/rekrutację nie generuje zdarzenia prod-empty.
2. Miasto z realnie dostępnym elementem (surowce + warunki) generuje zdarzenie.
3. Bramka powiadomienia korzysta z tych samych warunków kosztu co panel produkcji (pula państwa, skarbiec, manpower) — bez osobnej logiki.
4. Test regresyjny w gra/tools: miasto bez surowców → brak zdarzenia; z surowcami → zdarzenie; mutacja czerwieni test.
5. tsc --noEmit zielone; bramki referencyjne zielone; dowód w realnej grze (Chromium).

ALLOWLISTA: gra/src/main.ts (funkcje cityHasActionableProduction, cityHasAffordableBuildingEnqueue, cityHasAffordableUnitRecruitment, cityHasAffordableLevelUpgrade, productionOptionsFingerprint — tylko zmiana bramki), gra/src/ui/cityPanel.ts (tylko jeśli potrzebna wspólna funkcja kosztu), nowy gra/tools/notif-empty-queue-buildable-test.cjs. ZAKAZ: wszystko poza allowlistą, gra/data/*.json, git add -A.

IZOLACJA: worktree na izolowanej gałęzi, baza aeb52465e845d29acb5f7b628370789af399d673.

ZAKAZ BEZWZGLĘDNY: npm run build / npm run dev w gra/. Dozwolone: tsc --noEmit; node tools/*-test.cjs.

PLAN TESTÓW: tsc; nowy test regresyjny (mutacja wykrywana); 5 bramek referencyjnych; dowód w Chromium przy wolnym dysku.

PROCEDURA NAPRAWCZA: FAIL → ten sam ID, runda N+1, max 5.
