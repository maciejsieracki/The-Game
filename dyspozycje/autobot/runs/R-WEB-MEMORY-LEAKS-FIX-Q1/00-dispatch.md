STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-WEB-MEMORY-LEAKS-FIX-Q1
GOAL: POLECENIE WŁAŚCICIELA (główny czat, 2026-10-21): naprawić WERSJĘ WEBOWĄ (`gra/`) w miejscach, gdzie audyt P4.3 (§7, `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md`) wykazał ścieżki wycieku pamięci rosnące z turami,
żeby właściciel mógł sprawdzić, czy to była przyczyna niegrywalności po wielu turach. To jest wyjątek od zasady „zero zmian w `gra/**`” — wyłącznie w zakresie tego dispatchu, na OSOBNEJ GAŁĘZI, bez merge do `main`, bez deploy/READY_FOR_DEPLOY, bez zmiany `WERSJE.md`.
Ustalenia do naprawy (z P4.3 §7; zweryfikuj każde sam na kodzie przed zmianą, numery linii mogły się przesunąć):
- M1: model miasta (`miasto-braz`, `miasto-kamien`) przebudowywany przy zmianie populacji/`visualKey`/`level`, a stare geometrie i materiały NIE są zwalniane (`.dispose()`),
- M2: cache tekstur plakietek miast (render/cities.ts) rośnie; wpisy czyszczone tylko przy zmianie LOD / `dispose()` całego renderera miast,
- M3: nasłuchiwacze `document`/`window` w `BattleScene` nigdy nie są zdejmowane; `new BattleScene(` w 5 miejscach (main.ts ~27514, 28160, 29884, 30250, 30384),
- M6: 24 z 32 funkcji `dispose*` w `render/**` nigdzie nie jest wywoływanych — oceń każdą: wywołaj we właściwym punkcie cyklu życia TYLKO tam, gdzie obiekt jest naprawdę usuwany i nie jest współdzielony.
- Dodatkowo (diagnostyka, żeby właściciel mógł zmierzyć przed/po): opt-in odczyt `renderer.info.memory` (geometries, textures) + `renderer.info.programs` do konsoli na końcu każdej tury, włączany parametrem URL (np. `?memdebug=1`), domyślnie WYŁĄCZONY, zero wpływu na grę.
RUNDA: 1/5
MODEL+EFFORT: Operator: Opus 5.5 medium. Evaluator: Opus 5.5 medium. Final Control: Opus 5.5 medium (decyzja właściciela: kod renderujący/grafika => Opus 5.5 medium; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza kodu weba: `origin/main` (= pin `edb8fb56`, 0 commitów przed). Dokumentacja czytana z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`: `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`.
PIERWSZY KROK: `git fetch origin main && git checkout --detach origin/main` — potwierdź `edb8fb56`. NIE pracuj na `rust-port/parity-v2`.
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md` §7 (audyt pamięci: M1–M6 z plik:linia), `docs/decyzje/R-PROC-AUTOBOT.md` §6 (bramki) i §9 (granice), `playbook.md` C-029 (node_modules a tsc).
BRAMKI (TYLKO te; zawsze czytaj kod wyjścia testu): `cd gra && npm ci` (instalacja zależności jest dozwolona; bez niej `tsc` jest niewiarygodny), `npx tsc --noEmit` (0 błędów), `node tools/logic-test.cjs` (213/213), `node tools/tech-tree-test.cjs` (19/19), `node tools/research-test.cjs` (33/33),
`node tools/unit-replace-test.cjs` (13/13), `node tools/combat-test.cjs` (6/6), `node tools/mgla-sciezka-inwariant-test.cjs` (42/42), `node tools/entity-card-contract-test.cjs` (75/0), `node tools/map-field-battle-test.cjs` (22/22) — uruchom je PRZED zmianami (baseline z własnym logiem) i PO zmianach.
`node tools/unit-power-test.cjs` jest czerwony pre-istniejąco (4 pass / 2 fail) — nie naprawiaj.
ZAKAZY (R-PROC-AUTOBOT §9, nieznoszone): `npm run build`, `npm run dev`, vite, uruchamianie testów wymagających realnego buildu vite/Chromium (`ai-buduje-budynki-test`, `*-real-render-test`) — nie uruchamiaj ich; nie aktualizuj `WERSJE.md`; nie `git add -A`; nie push; nie dotykaj plików poza allowlistą.
DYSK: `gra/node_modules` zajmuje miejsce — po zakończeniu pracy w swoim worktree usuń `gra/node_modules`.

ZADANIE
1. Dla każdego z M1, M2, M3, M6 potwierdź ustalenie na kodzie (plik:linia + 1–2 zdania), albo ODRZUĆ z dowodem, jeśli nie jest wyciekiem (np. zasób współdzielony i celowo żyjący przez całą sesję).
2. Napraw minimalnymi, lokalnymi zmianami. Zasady bezpieczeństwa: (a) NIE wywołuj `dispose()` na zasobach współdzielonych (cache geometrii/materiałów używane przez inne mesh'e) — jeśli współdzielone, zastosuj liczenie referencji lub zwalniaj tylko zasoby tworzone per instancja;
   (b) M2: wprowadź politykę usuwania (np. limit LRU / usuwanie wpisów miast, których już nie ma) bez zmiany wyglądu plakietek; (c) M3: zapamiętaj handlery i zdejmij je w `dispose()` sceny bitwy oraz upewnij się, że `dispose()` jest wołane przy wyjściu z bitwy we wszystkich 5 miejscach tworzenia;
   (d) M1: zwolnij stare zasoby modelu PO podmianie na nowy (nie przed, żeby uniknąć migotania); (e) zero zmian reguł gry, zero zmian wyglądu.
3. Dodaj opt-in diagnostykę `?memdebug=1` (patrz GOAL): na końcu tury `console.log` z liczbami `renderer.info.memory.geometries/textures` i `renderer.info.programs?.length`, bez efektu, gdy parametr nie jest ustawiony.
4. Dokument `dyspozycje/autobot/runs/R-WEB-MEMORY-LEAKS-FIX-Q1/01-operator.md`: tabela M1/M2/M3/M6 (ustalenie → zmiana plik:linia → ryzyko), baseline i wyniki bramek (PEŁNE wyjścia z `echo "EXIT=$?"`), lista funkcji `dispose*` z decyzją „wywołane tu / celowo nie (powód)”, oraz INSTRUKCJA TESTU DLA WŁAŚCICIELA (po polsku, krok po kroku): jak odpalić grę z `?memdebug=1`, co obserwować (liczniki geometrii/tekstur co turę — powinny się stabilizować), jak porównać z `origin/main` (zmierzyć przed/po) oraz jak zmierzyć pamięć kartą Pamięć/Performance w DevTools po N turach AI.

ANTY-HALUCYNACYJNA REGUŁA
Nie twierdź, że wyciek „naprawiono” ani że gra przestanie zwalniać — nie masz profilera ani przeglądarki; możesz tylko wykazać statycznie, że zasoby są zwalniane, a bramki nie czerwienieją. Skutek na wydajność = `NIE_ZMIERZONO` do testu właściciela. Każde twierdzenie ma plik:linia.
W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

BINARNE KRYTERIUM SUKCESU
Dla M1/M2/M3/M6 jest udokumentowana decyzja (naprawione albo odrzucone z dowodem); `npx tsc --noEmit` 0 błędów; wszystkie wymienione bramki w liczbach referencyjnych (bez regresji względem baseline'u operatora); diagnostyka `?memdebug=1` domyślnie wyłączona; instrukcja testu dla właściciela; zero zmian poza allowlistą.

ALLOWLISTA
Dokument: `dyspozycje/autobot/runs/R-WEB-MEMORY-LEAKS-FIX-Q1/**`.
Kod: `gra/src/render/cities.ts`, `gra/src/render/miasto-braz*.ts`, `gra/src/render/miasto-kamien*.ts` (i inne pliki modeli miast wskazane w P4-3 §7 M1), `gra/src/battle/battleScene.ts`, `gra/src/battle/manualBattle.ts` (tylko zdejmowanie handlerów/dispose), miejsca wywołań `dispose*` w `gra/src/main.ts` (TYLKO dopisanie wywołań w 5 miejscach `new BattleScene(` i punktach cyklu życia),
pliki `gra/src/render/**` zawierające funkcje `dispose*` z M6 (wyłącznie dodanie wywołań/poprawka własności zasobów), oraz plik(i) diagnostyki (`?memdebug=1`) w `gra/src/render/` lub `gra/src/ui/` — nazwij je w raporcie. Zero zmian w `gra/data/**`, logice gry (`gra/src/game/**`, `map/**`, `units/**`, `ai/**`), `WERSJE.md`, `rust-port/**`, `src-tauri/**`.
(Równolegle: P3.13, P4.4, P4.6 — dokumenty/Rust; nie dotykaj ich plików.)

IZOLACJA: `isolation: worktree`, baza `origin/main`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE (push gałęzi robi orkiestrator po Final Control). Jeśli `git commit` zostanie odrzucony przez klasyfikator — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
