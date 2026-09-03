TEMAT: R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/ai-difficulty-bonus.ts (qualifiesForMajorAiDifficultyBonus i/lub nowa
funkcja analogiczna), gra/src/main.ts (miejsce foundowania miasta-państwa, ok. linii 8205-8306)
MODEL+EFFORT: claude-sonnet-5, effort high (dotyka main.ts w newralgicznym miejscu foundowania
miast — wymaga starannej weryfikacji braku regresji dla foundowania miast gracza/AI)

WYZWALACZ (dosłownie od właściciela)
"Poza tym, na najtrudniejszym poziomie państw-miast, każde państwo-miasto powinno zaczynać od
razu z dwiema jednostkami wojskowymi. A na najłatwiejszym zero, na normalnym jedna jednostka."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji, subagent Explore)
- Dziś miasta-państwa dostają 0 jednostek startowych NIEZALEŻNIE od wybranej trudności
  miast-państw. `qualifiesForMajorAiDifficultyBonus` (`ai-difficulty-bonus.ts:17-22`) jawnie
  WYKLUCZA `isCityState` z bonusu startowych jednostek (ten bonus jest dla cywilizacji AI, nie
  miast-państw) — potwierdź reconem w locie DOKŁADNY mechanizm tego wykluczenia i czy to
  jedyne miejsce decydujące o liczbie jednostek startowych miasta-państwa.
- Analogiczny wzorzec do skopiowania: `spawnDifficultyBonusUnit` (lub funkcja o zbliżonej
  nazwie/roli — potwierdź dokładną nazwę reconem) tworzy jednostki startowe dla cywilizacji wg
  poziomu trudności AI — użyj jako wzorzec stylu, NIE kopiuj bezpośrednio (miasta-państwa mają
  osobny, wcześniej ustalony w tej sesji poziom trudności `cityStateDifficulty`
  `'easy'|'normal'|'hard'`, niezależny od trudności cywilizacji AI).
- Miejsce foundowania miasta-państwa w `main.ts` ok. linii 8205-8306 — potwierdź reconem
  dokładny zakres funkcji/bloku odpowiedzialnego za tworzenie nowego miasta-państwa podczas
  generacji świata (nie mylić z foundowaniem miast gracza/cywilizacji AI — muszą pozostać
  nietknięte).
- Temat `R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1` (garnizon wczesnej fazy, cap wojska,
  priorytety AI) jest OSOBNYM, równolegle prowadzonym tematem dotyczącym TEGO SAMEGO obszaru
  gry (miasta-państwa, obrona) ale INNYCH plików (`city-state-difficulty.ts`, `ai.ts`) — zero
  nakładania się plików z tym dispatchem, bezpieczne do prowadzenia równolegle. NIE duplikuj
  jego zakresu (cap wojska w czasie, priorytety produkcji) — ten dispatch dotyczy WYŁĄCZNIE
  jednorazowych jednostek NADAWANYCH PRZY ZAŁOŻENIU miasta-państwa, nie bieżącej produkcji.

GOAL
1. Przy foundowaniu (generacji) miasta-państwa: nadaj mu startowe jednostki wojskowe wg
   `cityStateDifficulty`: easy=0, normal=1, hard=2. Wybierz sensowny, tani, wczesnodostępny
   typ jednostki wojskowej (analogicznie do tego, co dostają gracz/AI na starcie — potwierdź
   reconem, jaki typ jednostki jest używany jako "startowa" w istniejącym kodzie, użyj tego
   samego wzorca doboru, nie wymyślaj nowego typu).
2. Jednostki mają się faktycznie pojawić NA MAPIE, przypisane do danego miasta-państwa, zaraz
   po jego utworzeniu (nie w kolejce produkcji, nie jako obietnica na przyszłość).
3. Zero zmian w liczbie/logice jednostek startowych GRACZA i cywilizacji AI — WYŁĄCZNIE
   miasta-państwa, warunkowane `isCityState`/analogiczną flagą, tak jak istniejący wzorzec w
   `qualifiesForMajorAiDifficultyBonus`.
4. Zero interferencji z opcją "Wyłączone" (`P-USTAWIENIA-MIASTA-PANSTWA-WYLACZONE-Q1`, osobny
   zintegrowany/równolegle prowadzony temat) — gdy miast-państw nie ma wcale (0), ten kod się
   po prostu nie uruchamia (nie ma czego foundować), zero specjalnej obsługi potrzebnej, ale
   potwierdź to reconem/testem, nie zakładaj.

KRYTERIA KOŃCA (binarne)
1. Test: nowa gra, `cityStateDifficulty='hard'` — każde wygenerowane miasto-państwo ma
   DOKŁADNIE 2 jednostki wojskowe na mapie zaraz po generacji świata (nie 0, nie w kolejce).
2. Test: `cityStateDifficulty='normal'` — dokładnie 1 jednostka. `cityStateDifficulty='easy'`
   — dokładnie 0 jednostek (zachowanie dzisiejsze, bez regresji).
3. Test: gracz i cywilizacje AI mają NIEZMIENIONĄ liczbę/logikę jednostek startowych na tym
   samym seedzie — zero regresji (porównanie PRZED/PO).
4. Test: `cityStateDifficulty='off'` (jeśli już zintegrowane w międzyczasie) lub liczba
   miast-państw=0 — brak wyjątku/crasha, zero jednostek do nadania (nie ma miast-państw).
5. Zero regresji na istniejących testach foundowania miast/miast-państw/jednostek startowych
   (znajdź reconem, np. city-state-*-test.cjs, city-founding-*-test.cjs w gra/tools/).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/ai-difficulty-bonus.ts — WYŁĄCZNIE fragmenty dot. bonusu startowych jednostek
  (nowa funkcja lub rozszerzenie istniejącej, jasno rozdzielone od logiki cywilizacji AI).
- gra/src/main.ts — WYŁĄCZNIE punkt foundowania miasta-państwa (ok. linii 8205-8306,
  potwierdź dokładny zakres reconem) — jedno, minimalne wywołanie nowej funkcji nadającej
  jednostki startowe. Zakaz zmian w foundowaniu miast gracza/cywilizacji AI.
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana
`city-state-difficulty.ts`/`ai.ts` (zakres tematu `R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1`,
osobny), zmiana logiki jednostek startowych gracza/cywilizacji AI, zmiana sojuszy między
miastami-państwami (potwierdzony jako działający mechanizm — poza zakresem).

IZOLACJA
worktree /home/user/wt-miasta-panstwa-startowe-jednostki, gałąź
autobot/R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-miasta-panstwa-startowe --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1/2 za spełnione bez żywej generacji świata i faktycznego przeliczenia
jednostek na mapie per miasto-państwo (nie czytania samej wartości stałej w kodzie). Zakaz
założenia, że `qualifiesForMajorAiDifficultyBonus` jest JEDYNYM miejscem decydującym o
jednostkach startowych miast-państw bez potwierdzenia reconem całej ścieżki od foundowania do
spawnu jednostki.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora, ręką
orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
