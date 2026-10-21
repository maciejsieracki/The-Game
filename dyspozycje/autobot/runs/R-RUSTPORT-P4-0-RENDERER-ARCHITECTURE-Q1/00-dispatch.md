STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1
GOAL: Plan (P4.6–P4.10) wymaga „prawdziwego renderera mapy”, ale NIE rozstrzyga, gdzie on żyje. Fakt z pinu `edb8fb56`: web renderuje mapę w 3D przez Three.js
(`gra/package.json`: `three ^0.169.0`), a `gra/src/render/**` to 88 plików TypeScript, w tym proceduralne modele jednostek/miast (np. `braz-konnica-opus5.ts`,
`bronzeCity.ts`, `galera-model.ts`) — NIE pliki assetów (P3.8 potwierdził 0 plików glb/gltf/obj/fbx). Przygotuj dokument architektoniczny z dowodami i opcjami,
który pozwoli właścicielowi wybrać drogę zanim ruszy P4.6. TEMAT TYLKO ODCZYTOWO-PROJEKTOWY: zero kodu, zero buildu.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty,
  NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree. (Dokument ocenia estetykę tylko w wymiarze zgodności z webem; ocena wizualna 1:1 → przyszłe tematy P4/P5 z wyjątkiem Opus 5.)

KONTEKST
Baza do pracy: gałąź dokumentacyjna `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (TU zapisujesz dokument): `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
Źródło prawdy o webie: WYŁĄCZNIE odczyt przez `git show edb8fb56:<ścieżka>` i `git grep ... edb8fb56 -- gra/src` (zakaz `npm run build/dev` w `gra/`, zakaz zmian w `gra/**`).
Przeczytaj: `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` (P4–P7, zakazy §1), `dyspozycje/rust-port/p1/P1-9-MAP-HUD-PANELS.md`, `P1-10-VIEWPORTS.md`,
`P1-11-ASSET-CATALOG.md`, `P1-17B-UI-CLASSIFICATION.md`, `p2/P2-8-TAURI-ADAPTER.md`, `p2/P2-2-GAMESTATE-CONTRACT.md`.

PYTANIA, NA KTÓRE DOKUMENT MA ODPOWIEDZIEĆ (każda z dowodem: ścieżka+linia lub komenda+wynik)
1. Co dokładnie rysuje mapę dziś: wersja Three.js, kamera (`camera.ts`), kafelki hex (`hexShape.ts`, `hexutil.ts`), picking, mgła (`fogDim.ts`), nakładki; liczba i podział plików
   `gra/src/render/**` (jednostki/miasta/teren/dekoracje/UI-overlay), LOC per kategoria (`git show | wc -l`).
2. Skąd pochodzą modele 3D jednostek: proceduralnie w kodzie (które pliki, ile jednostek/epok pokrytych), czy są jakiekolwiek zewnętrzne zasoby (tekstury, `GLTFLoader`).
3. Granica danych: jakie pola stanu gry czyta renderer (wejście) i jakie zdarzenia/komendy emituje do logiki (picking, klik) — tabela; porównaj z kontraktem `GameState`/komend z P2.
4. Opcje architektury, każda z kosztem, ryzykiem, wpływem na „1:1” i na testy: (A) frontend Three.js (kopia `gra/src/render/**` 1:1, ewentualnie portowana do modułu w webview Tauri) + silnik w Rust przez komendy Tauri;
   (B) renderer w Rust (np. wgpu/Bevy) z przepisaniem wszystkich modeli proceduralnych; (C) hybryda (np. A teraz, B później). Uwzględnij: dostępność WebGL w webview docelowych platform
   (WebView2/WebKit), wydajność, zakaz „drugiej uproszczonej gry”, koszt odtworzenia 88 plików, możliwość testu screenshotowego (P4.14).
5. Rekomendacja + jawna lista punktów wymagających decyzji właściciela `D-REND-n` (nie rozstrzygaj ich po cichu). Dokument ma też sprostować wcześniejsze twierdzenie orkiestratora,
   że „mapa 3D to tylko płaskie assety 2D” — przyznaj błąd i podaj stan faktyczny.

ANTY-HALUCYNACYJNA REGUŁA
Każda liczba i twierdzenie o webie ma dowód (komenda + wynik wklejone). Zakaz wniosków z samych nazw plików bez otwarcia ich zawartości (przeczytaj reprezentatywne pliki z każdej kategorii).
Zakaz uruchamiania buildu/aplikacji weba. Niepewne = `NIE_ZMIERZONO`.

BINARNE KRYTERIUM SUKCESU
Dokument odpowiada na pytania 1–5 z dowodami, zawiera tabelę opcji A/B/C i listę `D-REND-n`; zero zmian poza allowlistą; `git diff --check` czysty.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-0-RENDERER-ARCHITECTURE.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1/**`. Zero zmian w `gra/**`, `rust-port/**`, innych dokumentach.

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
