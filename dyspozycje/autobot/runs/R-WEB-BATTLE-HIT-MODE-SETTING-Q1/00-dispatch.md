# R-WEB-BATTLE-HIT-MODE-SETTING-Q1 (GAME, ustawienie + zmiana mechaniki bitwy, Operator SONNET — uzasadnienie niżej)
Decyzje właściciela (ABC, 2026-11-12):
 1) Zgłoszenie: w bitwach zbyt duży rozstrzał wyników (jedna jednostka wygrywa totalnie, druga nie zadaje strat). Duży rozrzut wynika z szansy trafienia × rzutu na każde uderzenie.
 2) Właściciel: dodać do USTAWIEŃ ZAAWANSOWANYCH generowania mapy przełącznik „Trafienia: losowe / pewne”. Obie ścieżki zostają w kodzie. Wybór gracza decyduje o rozstrzygnięciu bitew.
 3) Domyślna wartość dla NOWYCH gier: PEWNE trafienia.
Źródła losowości (do weryfikacji): (a) AUTO upset 20% przy stosunku sił < 1,15 — auto-battle-params.ts:40–41, auto-battle-power.ts:176–186; (b) walka ręczna/SKIP — battleScene.ts ~9085 (roll = Math.random()*100 vs hitPct), combat.ts resolveCombat (domyślny rng = Math.random).
GOAL:
 - Nowa opcja gry „hitMode”: "losowe" | "pewne". Zapisywana w meta zapisu gry i w parametrach nowej gry.
 - Tryb "pewne": każde uderzenie trafia (bez rzutu, bez chybienia), obrona działa tylko przez pancerz w obrażeniach; w AUTO brak upsetu; wynik deterministyczny; AUTO = SKIP.
 - Tryb "losowe": zachowanie DOKŁADNIE jak dziś (łącznie z upsetem w AUTO). Zero zmian wyniku dla istniejących zapisów.
 - Istniejące zapisy bez pola hitMode → "losowe" (zachowanie bez zmian). Nowe gry → domyślnie "pewne".
 - Przełącznik w panelu ustawień zaawansowanych generowania mapy, z krótkim tooltipem (ToolTip, nie tekst w treści — zasada właściciela z dnia 2026-11-12).
 - Wartości progów (UPSET_R_THRESHOLD, UPSET_CHANCE, progi trafienia) NIE zmieniać.
KRYTERIA BINARNE:
 (1) w trybie "pewne" 100 000 uderzeń 1 vs 1 o równych statystykach daje ten sam wynik (determinizm) i żadne uderzenie nie chybia (test);
 (2) w trybie "losowe" wynik jest identyczny jak przed zmianą dla tego samego ziarna (test porównawczy, golden);
 (3) AUTO = SKIP w trybie "pewne" na zestawie scenariuszy; battle-skip-equals-auto-resolve-test w limicie 280 s;
 (4) zapis bez pola hitMode wczytuje się jako "losowe" (test migracji);
 (5) przełącznik widoczny w ustawieniach zaawansowanych, zapisany w nowej grze; zrzut w żywej grze (Chromium, 1440x900);
 (6) mutacja: w trybie "pewne" przywrócenie rzutu czerwieni test;
 (7) tsc --noEmit; 5 bramek referencyjnych (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test); istniejące testy bitew zielone.
ALLOWLISTA: gra/src/battle/battleScene.ts (ścieżka rozstrzygania uderzenia), gra/src/game/combat.ts, gra/src/game/auto-battle-power.ts, gra/src/game/auto-battle-params.ts (tylko przełączenie upsetu przez hitMode — bez zmiany wartości), ustawienia nowej gry i zapisu (gra/src/ui/ — panel zaawansowany mapy; gra/src/main.ts tylko przekazanie pola), gra/tools/*-test.cjs, dyspozycje/autobot/runs/R-WEB-BATTLE-HIT-MODE-SETTING-Q1/**. Zakaz: WERSJE.md, JSON balansu, rust-port (dług REPIN wskaż: Rust ma własną bitwę).
BAZA: origin/main 81e357dee.
UZASADNIENIE MODELU SONNET (CLAUDE.md zasada 2): temat wieloplikowy (UI ustawień, meta zapisu, mechanika bitwy, parytet AUTO/SKIP, migracja zapisów); obiektywnie trudny. Obrona Haiku; Evaluator i FC Sonnet.
