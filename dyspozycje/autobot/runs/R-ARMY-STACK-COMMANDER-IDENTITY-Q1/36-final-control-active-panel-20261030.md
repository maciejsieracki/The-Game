# Final Control — active commander panel fix (2026-10-30)

**Werdykt: PASS-WITH-NOTES — etap 8/11.** Kontrola dotyczy bieżącego worktree `/workspace/main-integration-20261029`, HEAD `dc8a3adc989bc82aab2cde6bb747c883f949fc1a` (`main...origin/main`) i niezacommitowanych zmian aktywnego panelu.

- Zakres poprawki: `gra/src/ui/hexContextTooltip.ts` oraz `gra/tools/army-stack-commander-identity-test.cjs`. Renderer aktywnych kart pokazuje rolę dowódcy i zachowuje nazwę typu jednostki; test sprawdza selekcję przez produkcyjny `SidePanelHud` callback. Pozostałe niezacommitowane zmiany w worktree należą do innych zadań i nie są częścią tego zakresu.
- Niezależna Obrona: **PASS-WITH-NOTES** dla tego diffu; potwierdziła 89 kart, oba tytuły i dwa kliknięcia produkcyjnego `SidePanelHud` przekazujące dokładne ID dowódcy, bez oznaczenia zwykłych kart.
- Moja niezależna weryfikacja: `node tools/army-stack-commander-identity-test.cjs` — **8/8 PASS**; `npm run typecheck` — **PASS**; `git diff --check -- gra/src/ui/hexContextTooltip.ts gra/tools/army-stack-commander-identity-test.cjs` — **PASS**.
- Ograniczenie: test potwierdza produkcyjne renderowanie i callback komponentu oraz sprawdza w źródle routing przez `selectPlayerUnit(id, true, unitSideDetailExpanded)`. Nie uruchamia pełnej kampanii ani świata gry, aby wykonać ten wybór end-to-end.

Brak defektu w sprawdzonym zakresie. Poprawka jest gotowa do następnego etapu pipeline; pozostaje niezacommitowana i niewdrożona. Następny etap: dokładna integracja.
