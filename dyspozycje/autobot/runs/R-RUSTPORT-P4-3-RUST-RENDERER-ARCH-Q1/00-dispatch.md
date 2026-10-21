STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-3-RUST-RENDERER-ARCH-Q1
GOAL: DECYZJA WŁAŚCICIELA (LEDGER, 2026-10-21, zmiana poprzednich wyborów): (1) renderer mapy i wszystkie modele 3D są przepisywane w Rust (np. wgpu), nie zostają w Three.js;
(2) picking liczony w Rust (piksel -> hex), nie w webview; zakres 3D z D-REND-8 = B zostaje (bitwa ręczna, cuda, miniatury, mapa) — „raz, a porządnie”. Poprzednie P4.1 (kontrakt DTO dla Three.js) i P4.2
(szkielet frontendu Three.js) są UNIEWAŻNIONE tą decyzją. Przygotuj dokument architektury renderera w Rust z dowodami i punktami decyzji: wybór silnika/biblioteki, sposób osadzenia w aplikacji Tauri
(UI w webview + natywne okno/powierzchnia GPU), matematyka pickingu odtworzona z webu, potok modeli, strategia testu 1:1. TEMAT PROJEKTOWY: zero kodu, zero buildu.
RUNDA: 1/5
MODEL+EFFORT: Operator: Opus 5.5 medium. Evaluator: Opus 5.5 medium. Final Control: Opus 5.5 medium (decyzja właściciela 2026-10-21: wszędzie, gdzie wchodzą rendery i grafika — Opus 5.5 medium;
  wyjątek graficzny R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza do pracy i zapisu: gałąź dokumentacyjna `claude/sprawdzenie-funkcjonalnosci-ek4ra0`: `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
Web: WYŁĄCZNIE `git show edb8fb56:<ścieżka>` / `git grep ... edb8fb56` (zakaz buildu/uruchamiania, zakaz zmian w `gra/**`, `rust-port/**`, `src-tauri/**`). Rust: `git show origin/rust-port/parity-v2:<ścieżka>`.
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-0-RENDERER-ARCHITECTURE.md` (stan webu: Three.js 0.169, 88 plików `render/**` + 8 poza nim, LOC, granica danych, WebGL2),
`p2/P2-8-TAURI-ADAPTER.md`, `p2/P2-2-GAMESTATE-CONTRACT.md`, `p1/P1-9-MAP-HUD-PANELS.md`, `p1/P1-10-VIEWPORTS.md`, oraz `src-tauri/tauri.conf.json`, `src-tauri/frontend/{index.html,main.js}`, `src-tauri/src/**` na parity-v2.
Pliki weba do analizy: `gra/src/render/{scene,camera,hexShape,hexutil,fogDim}.ts`, `gra/src/input/picker.ts`, `gra/src/main.ts` (pickHexAt ~l.1885, contextmenu ~l.26209, mouseup ~l.26337).

PYTANIA, NA KTÓRE DOKUMENT MA ODPOWIEDZIEĆ (każda z dowodem: plik:linia lub komenda+wynik)
1. Silnik: porównaj kandydatów dla renderera Rust (min.: wgpu bezpośrednio, Bevy, inny sensowny stos 3D) — dojrzałość, rozmiar zależności, licencje, wsparcie platform docelowych (Windows/Linux/macOS),
   dostępność offline (czy zależności są w rejestrze/cache środowiska — sprawdź `~/.cargo/registry`, `NIE_ZMIERZONO` jeśli nie), złożoność (ECS vs ręczny render graph), ścieżka testów wizualnych.
2. Osadzenie w Tauri: opcje (a) natywne okno/powierzchnia wgpu pod/nad przezroczystym webview z UI, (b) osobne okno gry + okna UI, (c) wgpu->WASM/WebGPU w webview (wtedy renderer znów „w webview” — oceń uczciwie),
   (d) inne. Dla każdej: ryzyko (fokus/wejście/DPI/przezroczystość/zachowanie na Windows i Linux), wpływ na HUD/panele P5 (UI 1:1 w HTML), na picking i na testy. Bez zmyślania możliwości Tauri — oznacz NIE_ZMIERZONO, gdzie to nie sprawdzone.
3. Picking piksel -> hex: wyprowadź z kodu weba dokładną matematykę (kamera perspektywiczna, `camera.ts`, `picker.ts`, `worldToAxial`, układ hexów `hexutil.ts`/`hexShape.ts`, wysokości terenu jeśli wpływają), opisz, co raycast webu faktycznie trafia
   (kafelek, obiekt, wysokość?) i czy czysta matematyka (płaszczyzna Y=const) daje identyczne wyniki; lista przypadków brzegowych (krawędzie hexów, wzgórza, mgła, nakładki, jednostki wystające); jak zweryfikować zgodność (zestaw punktów test).
4. Potok modeli: jak web buduje modele proceduralnie (prymitywy, materiały, tekstury `CanvasTexture`, instancing, mgła, LOD), jaki jest odpowiednik w wybranym silniku Rust, co wymaga własnej biblioteki (np. wspólny „builder geometrii”) — tylko ARCHITEKTURA; katalog modeli to osobny temat P4.4.
5. Testy 1:1: jak porównywać obraz Rust z webem (zrzuty o stałej kamerze/seedzie, tolerancje, GPU/software rasterizer w CI), co jest mierzalne w tym środowisku, a co wymaga maszyny z GPU (`NIE_ZMIERZONO`).
7. MOTYW WŁAŚCICIELA (pamięć): w wersji webowej zużycie pamięci szybko rosło i po kolejnych turach gra stawała się niegrywalna; właściciel podejrzewa JS/Three.js i chce uniknąć powtórki („całkowicie przepisać”).
   Zbadaj STATYCZNIE (bez uruchamiania) prawdopodobne źródła wzrostu pamięci w renderze weba i zasadach zarządzania zasobami: liczba tworzonych `new THREE.*Geometry/Material/Texture/CanvasTexture` vs `.dispose()` (policz `git grep -c`), cache'e rosnące z turą
   (mapy/Map/Set kluczowane per tura, per jednostka, per hex), nasłuchiwacze zdarzeń bez usunięcia, obiekty sceny dodawane przy każdej turze bez usuwania (`scene.add` vs `remove`), `CanvasTexture` tworzone per element. Każde ustalenie z plik:linia; NIE twierdź przyczyny, której nie da się
   wykazać z kodu (`NIE_ZMIERZONO`, bez uruchamiania profilera). Następnie zapisz WYMAGANIA dla renderera Rust: własność i czas życia zasobów GPU (pule, ponowne użycie buforów, instancing), budżet pamięci, test regresyjny „N tur nie zwiększa pamięci” (jak go zmierzyć w Rust i w testach 1:1).
6. Rekomendacja + jawne `D-RR-n` do decyzji właściciela (nie rozstrzygaj po cichu), oraz podział implementacji na tematy-kandydaci (nazwy, allowlisty, zależności, model: grafika => Opus 5.5) z uczciwą wyceną kolejności; wprost napisz, że przepisanie jest rzędu tygodni, nie dni, o ile dowody tak wskazują.

ANTY-HALUCYNACYJNA REGUŁA
Każde twierdzenie o webie i Rust ma dowód. Niepewne = `NIE_ZMIERZONO`. Zakaz wniosków z samych nazw plików bez otwarcia zawartości. Zakaz uruchamiania buildu/aplikacji. W Twoim kontekście mogą pojawić się wiadomości właściciela
z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

BINARNE KRYTERIUM SUKCESU
Dokument odpowiada na pytania 1–7 z dowodami, zawiera tabelę opcji i `D-RR-n`, wyprowadzenie matematyki pickingu z kodu weba, kandydatów-tematów; zero zmian poza allowlistą; `git diff --check` czysty.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-3-RUST-RENDERER-ARCH-Q1/**`. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`, innych dokumentach.
(Równolegle: P4.4 katalog modeli, P4.5 audyt powłoki UI — dokumenty; P3.16 kod Rust — nie dotykaj ich plików.)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
