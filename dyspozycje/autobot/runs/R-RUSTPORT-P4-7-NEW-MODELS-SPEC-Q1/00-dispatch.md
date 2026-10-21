STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1
GOAL: Decyzje właściciela (LEDGER, 2026-10-21, pytania A/B/C po P4.4): D-MOD-4 = C: DOROBIĆ brakujące modele miast TERAZ (web ma tylko 2 zestawy miast brązu — Rzym i Grecja jako fallback dla 13 pozostałych państw — oraz 1 zestaw kamienia; epoka żelaza bez modelu miasta);
D-MOD-5 = B: dorobić proste modele dla 5 cudów „parkowanych” (epoka 4+); D-MOD-3 = B: portować WSZYSTKIE istniejące modele, także nieużywane (5 modeli jednostek bez rekordu w danych, martwe `buildHastati`/`buildBerserker`, eksporty `jednostki-p1-rdzen`);
D-MOD-9 = A: jeden model jednostki wszędzie (naprawa routingu po nazwie angielskiej w bitwie). To NOWA grafika bez wzorca 1:1 w webie — wymaga najpierw SPECYFIKACJI, żeby implementacja (Opus 5.5) i Twoja ocena wizualna miały jasne kryteria.
Przygotuj dokument specyfikacji nowych modeli. TEMAT PROJEKTOWO-ODCZYTOWY: zero kodu Rust/TS, zero buildu, zero generowania grafiki — tylko spec.
RUNDA: 1/5
MODEL+EFFORT: Operator: Opus 5.5 medium. Evaluator: Opus 5.5 medium. Final Control: Opus 5.5 medium (decyzja właściciela: grafika => Opus 5.5 medium; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza do pracy i zapisu: gałąź dokumentacyjna `claude/sprawdzenie-funkcjonalnosci-ek4ra0`: `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
Web: WYŁĄCZNIE `git show edb8fb56:<ścieżka>` / `git grep ... edb8fb56` (zakaz buildu/uruchamiania weba, zakaz zmian w `gra/**`, `rust-port/**`).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` (§ miasta/cuda/ulepszenia, D-MOD-1..9, paczki), `p4/P4-3-RUST-RENDERER-ARCH.md` (potok modeli, prymitywy), `gra/data/civs.json`, `gra/data/wonders.json`, `gra/data/buildings.json` (z pinu),
oraz pliki modeli miast i cudów w `gra/src/render/` (np. `miasto-braz*.ts`, `miasto-kamien*.ts`, `bronzeCity*.ts`, `stoneCity*.ts`, modele cudów), oraz CivPedię/opisy stylów architektury w `dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-CYWILIZACJE.md`, `P1-16F-CUDA...`.

ZADANIE (dokument `dyspozycje/rust-port/p4/P4-7-NEW-MODELS-SPEC.md`)
1. LISTA BRAKUJĄCYCH MODELI (dowód z danych/kodu): (a) miasta — dla KAŻDEJ cywilizacji i epoki z `civs.json` wypisz, jaki model miasta dostaje dziś w webie (zestaw Rzym/Grecja/kamień/fallback) i które kombinacje wymagają nowych modeli; zaproponuj sensowną liczbę zestawów (np. wspólne zestawy per krąg kulturowy — Bliski Wschód, Azja, Ameryki, Afryka, Europa północna) zamiast 15×3 unikatów,
   z uzasadnieniem kosztu; (b) epoka żelaza: model(e) miasta; (c) 5 cudów „parkowanych” (nazwy z `wonders.json`, opis z danych/CivPedii): co każdy przedstawia i jak rozpoznać go na mapie.
2. KANON STYLU: wyprowadź z istniejących modeli `roblox` (kod + dostępne opisy) słownik formy: używane prymitywy, proporcje, skala względem heksu, paleta kolorów, poziomy detalu (LOD), poziomy rozwoju miasta (`level`/populacja), jak model reaguje na `visualKey`, wymagania wydajnościowe (liczba mesh/trójkątów — policz dla istniejących miast i cudów), ograniczenia (bez tekstur zewnętrznych, wszystko proceduralne).
3. SPECYFIKACJA KAŻDEGO NOWEGO MODELU: nazwa, referencja kulturowa (zdania + 2–3 punkty rozpoznawcze), kompozycja z prymitywów (lista brył z proporcjami), paleta, warianty poziomów, budżet (mesh/trójkąty ≤ średnia istniejących + margines — policz), kryteria akceptacji wizualnej (co ma być rozpoznawalne z typowej odległości kamery) i sposób oceny (zrzuty z jednakowej kamery; ocena właściciela).
4. Port modeli istniejących „nieużywanych” (D-MOD-3=B): lista, plik źródłowy, status (martwy/nieużywany), do jakiej paczki P4.4 wchodzą; naprawa routingu bitwy (D-MOD-9=A): jednoznaczna reguła „jedna jednostka = jeden model”, tabela 3 przypadków rozjazdu z P4.4 i docelowy model.
5. Wycena i kolejność: ile modeli, ile paczek (nazwa, allowlista ścieżek Rust w `rust-port/renderer/src/models/**`, zależności od RR-T4/RR-T5 i szkieletu P4.6), co wymaga oceny wizualnej właściciela po każdej paczce; ryzyka (brak wzorca 1:1, subiektywność oceny).
6. Lista punktów do decyzji właściciela `D-NM-n` (nie rozstrzygaj po cichu) — w szczególności: ile zestawów miast (kompromis jakość/koszt), czy cuda parkowane maja być zgodne z epoką 4+ stylistycznie, kto zatwierdza wygląd.

ANTY-HALUCYNACYJNA REGUŁA
Każde twierdzenie o webie i danych ma dowód (komenda+wynik albo plik:linia). Liczby budżetów policz, nie zgaduj. Zakaz wymyślania cywilizacji/cudów spoza danych. Niepewne = `NIE_ZMIERZONO`. Nie generuj grafiki ani kodu modeli.
W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

BINARNE KRYTERIUM SUKCESU
Dokument zawiera: pełną listę brakujących modeli z dowodem, kanon stylu z liczbami, specyfikację każdego nowego modelu z kryteriami akceptacji, listę portów „nieużywanych”, regułę routingu, wycenę z paczkami, `D-NM-n`; zero zmian poza allowlistą; `git diff --check` czysty.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-7-NEW-MODELS-SPEC.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1/**`. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`, innych dokumentach.
(Równolegle: P4.6 szkielet crate'a, P3.17 dane runtime, naprawa weba — nie dotykaj ich plików.)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
