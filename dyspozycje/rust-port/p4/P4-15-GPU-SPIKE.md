# P4.15 — Spike RR-T1: powierzchnia wgpu pod przezroczystym webview w Tauri (przygotowanie do uruchomienia u właściciela)

**Temat:** `R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium) · **Runda:** 1/5
**Baza kodu:** `origin/rust-port/parity-v2` = `69f432ba1987fd58d6f06eeb25a96827a4017c28`.
**Źródła:** `P4-3-RUST-RENDERER-ARCH.md` (§2 osadzenie, §8 RR-T1, D-RR-2 = A), `P4-5B-MAP-UI-SEAM.md` (§2 M1/M2/M3, §3.1, §4.1, §10, §12 T14, §15), `P4-6-RENDERER-CRATE-SCAFFOLD.md` (wzór crate'a, lock, MSRV), `src-tauri/Cargo.toml` + `Cargo.lock` (wersje).
**Zasada tego dokumentu:** środowisko agenta **nie ma GPU, okna ani WebView**. Nic tu nie twierdzi, że coś „działa na GPU / w oknie / w WebView”. Wszystko, czego nie wykonano, jest `NIE_ZMIERZONO`. Spike jest narzędziem pomiarowym do uruchomienia przez właściciela; dopiero jego raport (JSON) rozstrzyga punkty (1)–(7).

---

## 0. Streszczenie

1. Nowy, samodzielny crate **`rust-port/spike-gpu-embed/`** (poza workspace'ami, pusty `[workspace]`): okno Tauri 2.11.5 (przezroczyste), pod nim powierzchnia wgpu 30.0.1 (granatowe tło + pomarańczowy trójkąt po lewej), nad nim przezroczysty webview z panelem-kreatorem po prawej i paskiem HTML u góry po lewej.
2. Uruchomienie u właściciela **jedną komendą** z katalogu crate'a: `cargo run --release --locked`. Kreator w oknie prowadzi przez kroki (kilka kliknięć i dwa naciśnięcia klawisza `K`, ok. 2–3 minuty), a na końcu zapisuje `wyniki/raport-<os>-<czas>.json` i `wyniki/log-<os>-<czas>.txt`. Te dwa pliki właściciel odsyła.
3. Spike mierzy punkty (1)–(7) z dispatchu (§1). Każdy punkt kończy się `PASS` / `FAIL` / `NIE_ZMIERZONO` z dowodem w raporcie.
4. Implementacja platform (§4): **Windows** — M1 (`SetWindowRgn` na hoście WebView2), M2 (własne okno-dziecko HWND nad webview, wgpu w nim), hak natywny (`SetWindowSubclass`); **Linux** — M1 (`input_shape_combine_region` na `GdkWindow` web view, z bezpiecznikiem), hak natywny (sygnały GTK), M2 = stub; **macOS** — M1/M2/hak = stub (komunikat w raporcie). Renderowanie, IPC, pamięć i pełny ekran — na wszystkich trzech.
5. Zweryfikowane **tutaj**: część CPU (raport, statystyki, regiony, zegar, pamięć, protokół) — **33 testy zielone**; warstwa wgpu (`--features gpu`) — kompiluje się, 36 testów zielonych, samotest offscreen kończy się jawnym `SKIPPED: no GPU adapter`; **cały program z Tauri dla Windows** — `cargo check` i `cargo clippy -D warnings` dla `x86_64-pc-windows-msvc` → EXIT=0. **Niezweryfikowane kompilacją:** kod Linux (brak bibliotek GTK/WebKit w kontenerze, EXIT=101 na `gdk-sys`) i macOS (brak kompilatora Objective-C, EXIT=101 na `objc2-exception-helper`). Uruchomienie gdziekolwiek: `NIE_ZMIERZONO`.
6. Ustalenie z tej rundy (ważne dla integracji RR-T1 w `src-tauri`): **wspólny lockfile Tauri + wgpu może się „zszyć” niekompilowalnie na Windows** — `gpu-allocator 0.28.0` przypięty do `windows 0.61.3` (z drzewa Tauri) zamiast `0.62.2` (wymagane przez `wgpu-hal 30.0.1`) → 3 błędy typów w `wgpu-hal/src/dx12/suballocation.rs` (log `logi-r1/04`). Naprawa: `cargo update -p gpu-allocator` → `windows v0.62.2` (log `logi-r1/13`), potem EXIT=0 (log `logi-r1/05`). §2.4.

---

## 1. Co spike mierzy i dlaczego (mapowanie na `NIE_ZMIERZONO`)

| # | Punkt dispatchu | Jak mierzy spike | Reguła statusu | Odpowiada na |
|---|---|---|---|---|
| (1) | Klatka wgpu (kolor + trójkąt) pod przezroczystym webview z HTML nad nią | Wątek renderu rysuje co klatkę (Fifo) granatowe tło + pomarańczowy trójkąt w powierzchni okna Tauri; liczy klatki przekazane do prezentacji. Właściciel odpowiada w kreatorze: **TAK / NIE / MIGA**. Dodatkowo samotest offscreen (render do tekstury 64×64 + odczyt pikseli) potwierdza sam potok GPU | `PASS` = odpowiedź TAK i > 0 klatek; `FAIL` = NIE/MIGA albo TAK przy 0 klatek; brak odpowiedzi = `NIE_ZMIERZONO` | P4-3 §2.3 „Przezroczystość”, „Windows”, „Linux”; §9 pkt 4; RR-T1 |
| (2) | M1: klik w „dziurę” → okno natywne; klik w prostokąt UI → webview | Webview wysyła prostokąty UI (`getBoundingClientRect`, jak `HitRegions` P4-5B §4.1); Rust ustawia region wejścia hosta webview = suma prostokątów (Windows: `SetWindowRgn` na `WRY_WEBVIEW`; Linux: kształt wejścia `GdkWindow`). Kreator prosi o klik w trójkąt i w „PRZYCISK UI”; hak natywny i słuchacze DOM raportują, kto dostał zdarzenie. Pytanie wizualne po włączeniu M1 (region na Windows przycina też rysowanie — P4-5B §2) | `PASS` = dziura: tylko natywne; UI: tylko webview; i odpowiedź wizualna TAK. Inaczej `FAIL`. Platforma bez implementacji = `NIE_ZMIERZONO` z powodem | P4-5B §15 pkt 1 (M1), §12 T14 |
| (3) | M2: odwrócone warstwy, jeśli M1 się nie uda | Tylko gdy (2) nie jest PASS (albo `SPIKE_FORCE_M2=1`): Windows — okno-dziecko `SPIKE_M2_MAP` nad webview (`HWND_TOP`), region = okno minus prostokąty UI; render wgpu przełączony do tego okna; te same dwa kliknięcia + pytanie wizualne | jak (2); pominięte przy M1 = PASS → `NIE_ZMIERZONO` z adnotacją | P4-5B §15 pkt 1 (M2); P4-3 §2.3 „Ryzyko krytyczne” |
| (4a) | Opóźnienie IPC webview→Rust, 1000 × `PointerMove` | Synchronizacja zegarów (50 rund, próbka o min. RTT; niepewność = RTT/2). Seria „paced”: 1 zdarzenie na `requestAnimationFrame` (jak koalescowany `PointerMove`, P4-5B §3.1), ładunek = `MapInput` z P4-5B §3.1. Seria „burst”: 1000 bez czekania (dane dodatkowe). Rust znakuje czas odbioru | `PASS` = 1000/1000 dostarczonych i p95 ≤ 16,7 ms (ZAŁOŻENIE Z-S1); inaczej `FAIL`. Raport: min/p50/p95/max/średnia + niepewność zegara | P4-5B §15 pkt 3; P4-3 §3.9 pkt 3; D-RR-10 |
| (4b) | Opóźnienie IPC Rust→webview | Rust emituje 1000 zdarzeń `r2w_ping` co 8 ms; webview znakuje odbiór i odsyła tablicę; Rust liczy statystyki z tym samym przesunięciem zegara | jak (4a) | P4-5B §15 pkt 3 (`HoverChanged`, `CameraState`) |
| (5) | Pamięć procesu po 1 min renderowania | Próbki RSS w t = 0, 10, 30, 60, 65 s od pierwszej klatki (Windows: `WorkingSet64` + `PrivateMemorySize64`; Linux: `VmRSS`; macOS: `ps rss`) | `PASS` = przyrost RSS między próbką ≥ 10 s a ≥ 60 s ≤ 32 MiB (Z-S2); inaczej `FAIL`; brak próbki 60 s = `NIE_ZMIERZONO`. **VRAM poza procesem: NIE_ZMIERZONO** (zawsze dopisane) | P4-3 §7 (pamięć); motyw właściciela „pamięć w webview” |
| (6) | Fokus klawiatury po kliknięciu w okno natywne | Zaraz po kliknięciu w dziurę, które dotarło do okna natywnego: „naciśnij K” (czy webview dostaje klawisz bez niczego); potem Rust woła `Webview::set_focus`, „naciśnij K jeszcze raz” | `PASS` = klawisz dotarł do webview bezpośrednio albo po `set_focus` (P4-5B Z3); `FAIL` = w obu próbach nie; brak natywnego kliknięcia = `NIE_ZMIERZONO` | P4-5B §15 pkt 2; Z3 |
| (7) | `Window::is_fullscreen` po `set_fullscreen` | `set_fullscreen(true)` → 1,5 s → `is_fullscreen()`; `set_fullscreen(false)` → 1,5 s → `is_fullscreen()`; liczba `WindowEvent::Resized` w tym czasie | `PASS` = `true` potem `false`; inaczej `FAIL` | P4-5B §15 pkt 8; §10; T13 |

Poza listą dispatchu raport zawiera też: współczynnik skali i rozmiar okna, adapter GPU (nazwa, backend, sterownik), konfigurację powierzchni (format, tryb prezentacji, alfa), wynik samotestu offscreen, wszystkie zdarzenia natywne i obserwacje DOM ze znacznikami czasu, odpowiedzi właściciela, zmienne środowiskowe istotne dla Linuksa (`WAYLAND_DISPLAY`, `DISPLAY`, `XDG_SESSION_TYPE`, `GDK_BACKEND`, `WEBKIT_DISABLE_COMPOSITING_MODE`) i `WGPU_BACKEND`.

**Czego spike nie mierzy (świadomie, poza zakresem dispatchu):** DPI/zmiana skali w trakcie (loguje tylko `ScaleFactorChanged`), kursory własne (Z9), kolejność PPM `mouseup`/`contextmenu` (Z15), natywne „leave” (Z13), M3 (to tylko publiczne API — mierzy go pośrednio (4a)).

---

## 2. Budowa crate'a

### 2.1 Pliki

```text
rust-port/spike-gpu-embed/
  Cargo.toml            spike-gpu-embed 0.1.0, edition 2021, rust-version 1.87, publish=false, [workspace] pusty
  Cargo.lock            COMMITOWANY (trzeci wyjątek, §2.3)
  .cargo/config.toml    [resolver] incompatible-rust-versions = "fallback" (jak renderer)
  .gitignore            /target, /wyniki/, /gen/
  build.rs              tauri_build::build() tylko z cechą `app`
  tauri.conf.json       okno `main` 1280x800, transparent: true; macOSPrivateApi: true; ikony z ../../src-tauri/icons (bez kopii binariów)
  capabilities/default.json   core:default dla okna main
  ui/index.html, ui/spike.js  przezroczysta strona: panel-kreator (prawa), pasek HTML (lewa góra), logika kroków
  src/lib.rs            moduły
  src/report.rs         raport JSON, CheckId (1)-(7), reguły PASS/FAIL (czyste funkcje, testy)
  src/stats.rs          min/p50/p95/max (percentyl nearest-rank, bez interpolacji), testy
  src/clock.rs          synchronizacja zegarów JS<->Rust (min RTT), opóźnienia jednokierunkowe, testy
  src/regions.rs        prostokąty CSS -> fizyczne (zaokrąglenie na zewnątrz, przycięcie), over_ui, testy
  src/memory.rs         RSS procesu bez zależności (proc / ps / PowerShell), parsery z testami
  src/protocol.rs       komunikaty webview<->Rust (MapInput z P4-5B §3.1, UiRects, NativeEvent...), testy JSON
  src/log.rs            log do pliku + stderr, zegar ms od startu
  src/gpu.rs            (cecha gpu) urządzenie, potok trójkąta (WGSL), WindowTarget, samotest offscreen
  src/app/mod.rs        (cecha app) aplikacja Tauri, komendy, wątek renderu, ocena, zapis raportu
  src/app/platform_windows.rs   M1, M2, hak natywny (Win32)
  src/app/platform_linux.rs     M1, hak natywny (GTK); M2 = stub
  src/app/platform_macos.rs     stuby
  src/main.rs           cargo run -> app::run()
```

### 2.2 Cechy i zależności

| Cecha | Zawiera | Po co |
|---|---|---|
| `app` (**domyślna**) | `gpu` + `tauri =2.11.5` (cecha `macos-private-api`), `tauri-build =2.6.3` (build), `raw-window-handle 0.6.2`, platformowo `windows =0.61.3` / `gtk =0.18.2` | właściwy spike; jedna komenda `cargo run --release --locked` |
| `gpu` | `wgpu =30.0.1`, `pollster 0.4` | warstwa GPU kompilowalna i testowalna bez GTK/WebKit |
| (brak) `--no-default-features` | tylko `serde`, `serde_json` | logika CPU z testami, działa wszędzie |

Wszystkie zależności z listy dispatchu; `windows` i `gtk` w **tych samych wersjach**, co w `src-tauri/Cargo.lock` (typy `HWND`, `gtk::ApplicationWindow` są te, które zwraca Tauri). Funkcje `windows` włączone: `Win32_Foundation`, `Win32_Graphics_Gdi`, `Win32_System_LibraryLoader`, `Win32_UI_Shell`, `Win32_UI_WindowsAndMessaging` (cechy, nie nowe pakiety). Brak `objc2` (macOS = stub). **ZAŁOŻENIE Z-S8:** `tauri-build` (zależność budowania) nie jest wymieniony w dispatchu, ale jest częścią narzędzi Tauri (`generate_context!` potrzebuje środowiska, które ustawia) — ta sama wersja `=2.6.3` co `src-tauri`. **ZAŁOŻENIE Z-S9:** cecha `macos-private-api` (przezroczystość na macOS, P4-3 §2.2) włączona; cecha `unstable` (`add_child`) **nie** — M2 na Windows jest zrobione surowym Win32, bez webview-dzieci.

`unsafe`: w odróżnieniu od `rust-port/renderer` (`#![forbid(unsafe_code)]`) spike zawiera `unsafe` w `platform_windows.rs` (Win32, `WindowHandle::borrow_raw`) — zgodnie z P4-5B Z2 (hak platformowy poza rendererem). Renderer i silnik bez zmian.

### 2.3 `Cargo.lock` commitowany — trzeci wyjątek (uzasadnienie)

1. Spike ma być uruchomiony **u właściciela** komendą z `--locked`: bez locka cargo rozwiąże ~487 pakietów na nowo w dniu uruchomienia i wynik pomiaru dotyczyłby innego drzewa niż sprawdzone tutaj (`cargo check`/`clippy` dla Windows na tym locku → EXIT=0).
2. Lock zasiano kopią `src-tauri/Cargo.lock`, więc **drzewo Tauri jest identyczne jak w aplikacji**: wszystkie 433 pary nazwa/wersja z `src-tauri/Cargo.lock` są w locku spike'a poza dwoma crate'ami ścieżkowymi (`civ-desktop`, `civ-engine`) — log `logi-r1/01-lock-porownanie.txt`. To jest sens spike'a: zmierzyć dokładnie ten Tauri, który ma przyjąć renderer.
3. Drzewo wgpu = to samo `wgpu*-30.0.1`, co w rendererze; 17 współdzielonych crate'ów (np. `libc`, `smallvec`, `objc2`) ma wersję z drzewa Tauri, nie z locka renderera (lista w `01`).
4. Wzorzec jak w P4-6 §2.1: `.cargo/config.toml` z rozwiązywaniem świadomym MSRV 1.87.

### 2.4 Ustalenie: niezgodność `windows` w złączonym locku (dotyczy też przyszłego `src-tauri` + renderer)

- Pierwsze `cargo check --locked --target x86_64-pc-windows-msvc` → **EXIT=101**: `wgpu-hal-30.0.1/src/dx12/suballocation.rs:83/299/306` — `expected ID3D12Device, found Direct3D12::ID3D12Device`, „there are multiple different versions of crate `windows`” (log `logi-r1/04-check-windows-app.txt`).
- Przyczyna: przy rozwiązywaniu z zasianym lockiem `gpu-allocator 0.28.0` dostał `windows 0.61.3` (obecny już w drzewie Tauri), a `wgpu-hal 30.0.1` używa `windows 0.62.2`. W locku renderera (bez Tauri) `gpu-allocator` ma `windows 0.62.2` — dlatego renderer tego nie widzi.
- Naprawa w tej rundzie: `cargo update -p gpu-allocator` (wyjście w sesji: „Locking 0 packages to latest Rust 1.87 compatible versions”; zmieniła się tylko krawędź zależności) → `gpu-allocator v0.28.0 → windows v0.62.2` (log `logi-r1/13`), po czym `cargo check` → EXIT=0 (`logi-r1/05`), `cargo clippy -D warnings` → EXIT=0 (`logi-r1/10`).
- **Wniosek dla RR-T1/integracji w `src-tauri`:** dodanie `wgpu` do `src-tauri` odtworzy ten sam problem; trzeba to sprawdzić `cargo check --target x86_64-pc-windows-msvc` (lub na Windows) i ewentualnie przeprowadzić ten sam `cargo update -p gpu-allocator`.

---

## 3. Instrukcja uruchomienia (dla właściciela, krok po kroku)

**Czas:** pierwsza kompilacja 5–15 min (zależnie od maszyny; liczba nie zmierzona tutaj), sam kreator ok. 2–3 min (w tym obowiązkowe ≥ 66 s renderowania dla pomiaru pamięci).

### 3.1 Przygotowanie (jednorazowo)

Wymagania oznaczone `[zewn., niezweryfikowane]` pochodzą z dokumentacji Tauri/Rust spoza repo; w tym kontenerze ich nie sprawdzano.

- **Wszystkie systemy:** Rust ≥ 1.87 przez `rustup` (`rustup update stable`; sprawdź `cargo --version`). Git z dostępem do repozytorium.
- **Windows 10/11:** „Microsoft C++ Build Tools” (Visual Studio Build Tools, składnik „Desktop development with C++”) `[zewn., niezweryfikowane]`; WebView2 Runtime (w Windows 11 i aktualnym Windows 10 jest wbudowany) `[zewn., niezweryfikowane]`.
- **Linux (Debian/Ubuntu):** pakiety deweloperskie WebKitGTK 4.1 i GTK3 oraz sterownik Vulkan, np. `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev build-essential libssl-dev librsvg2-dev mesa-vulkan-drivers` `[zewn., niezweryfikowane]`. Spike wymaga `webkit2gtk-4.1`, `gtk+-3.0`, `gdk-3.0` (to ich brak zatrzymał kompilację tutaj, log `logi-r1/03`).
- **macOS:** Xcode Command Line Tools (`xcode-select --install`) `[zewn., niezweryfikowane]`. Uwaga: macOS nie jest dziś platformą docelową; M1/M2/fokus kończą się tam `NIE_ZMIERZONO` (stub).

### 3.2 Pobranie kodu

```bash
git fetch origin
git checkout <GAŁĄŹ_LUB_COMMIT_ZE_SPIKE_EM>   # poda orkiestrator po integracji
cd rust-port/spike-gpu-embed
```

### 3.3 Uruchomienie — JEDNA KOMENDA

```bash
cargo run --release --locked
```

To samo na Windows (PowerShell lub cmd) i Linux/macOS (terminal). Pliki wyników trafiają do `rust-port/spike-gpu-embed/wyniki/` (katalog ignorowany przez git; inny katalog: zmienna `SPIKE_OUT_DIR`).

### 3.4 Co zrobić w oknie (kreator w panelu po prawej)

1. **Krok 1 — obraz.** Pytanie: czy widać granatowe tło z pomarańczowym trójkątem po lewej **i nad nimi** biały panel oraz pasek u góry. Kliknij **TAK**, **NIE** albo **MIGA** (miganie / znikanie / czarne tło też = MIGA lub NIE).
2. **M1 włączone — obraz.** Ponowne pytanie wizualne (TAK / NIE / MIGA).
3. **Klik w trójkąt.** Kliknij lewym przyciskiem w pomarańczowy trójkąt (czeka do 20 s).
4. **Klawisz K (dwa razy).** Pojawia się tylko, jeśli klik z kroku 3 dotarł do okna natywnego. Niczego nie klikaj, naciśnij `K`; potem drugi raz `K` po komunikacie o `set_focus` (każde czeka do 15 s).
5. **Klik w „PRZYCISK UI”** (zielony, w panelu).
6. **M2** (tylko gdy M1 nie przeszło albo ustawiono `SPIKE_FORCE_M2=1`; na Linuksie i macOS M2 kończy się od razu komunikatem „NIE_ZAIMPLEMENTOWANO”): powtórzenie kroków 2–5.
7. **Pomiary automatyczne — nic nie klikaj:** IPC ok. 30 s; pełny ekran (okno na ok. 1,5 s przejdzie na pełny ekran i wróci); oczekiwanie, aż render trwa ≥ 66 s.
8. Panel pokaże **„Gotowe”** i ścieżkę raportu. Okno można zamknąć. **Zamknięcie okna wcześniej też zapisuje raport** (nieukończone punkty = `NIE_ZMIERZONO`).

### 3.5 Warianty (osobne uruchomienia, każde daje osobny raport)

| Wariant | Windows (PowerShell) | Linux / macOS |
|---|---|---|
| podstawowy | `cargo run --release --locked` | `cargo run --release --locked` |
| wymuś też M2 | `$env:SPIKE_FORCE_M2="1"; cargo run --release --locked` | `SPIKE_FORCE_M2=1 cargo run --release --locked` |
| Linux pod X11 (sesja Wayland) | — | `GDK_BACKEND=x11 cargo run --release --locked` |
| Linux pod Wayland | — | `GDK_BACKEND=wayland cargo run --release --locked` |
| inny backend GPU | `$env:WGPU_BACKEND="vulkan"` (lub `dx12`, `gl`) przed komendą | `WGPU_BACKEND=gl cargo run --release --locked` (lub `vulkan`) |

Minimalny zestaw zgodny z P4-3 §8 RR-T1 („Windows + Linux X11/Wayland”): Windows podstawowy; jeśli jest maszyna z Linuksem — X11 i Wayland. Na Windows warto drugi przebieg z `SPIKE_FORCE_M2=1`, bo daje dane o obu mechanizmach naraz.

### 3.6 Gdy coś pójdzie nie tak

- Błąd kompilacji → skopiuj pełne wyjście `cargo` (od pierwszego `error`) do odpowiedzi; to też jest wynik (np. brak pakietu systemowego).
- Okno się nie otwiera / zamyka od razu → w `wyniki/` i tak powstaje `log-*.txt` (i zwykle `raport-*.json` z `tauri_build_error` / `render_start_error`). Odeślij oba.
- Czarne / puste okno → odpowiedz w kroku 1 „NIE”, dokończ kreator (pomiary IPC, pamięci i pełnego ekranu i tak się wykonają).

---

## 4. Platformy: co zaimplementowano, co jest stubem, co niezweryfikowane

| Element | Windows (WebView2) | Linux (WebKitGTK) | macOS (WKWebView) |
|---|---|---|---|
| Okno przezroczyste + webview przezroczysty | konfiguracja `transparent: true` | konfiguracja | konfiguracja + `macOSPrivateApi` |
| Render wgpu w oknie Tauri (1) | zaimplementowane | zaimplementowane | zaimplementowane |
| Hak natywny (kliknięcia/klawisze/fokus okna) | `SetWindowSubclass` na HWND okna | sygnały GTK `button-press`/`key-press`/`focus-*` na `ApplicationWindow` | **stub** |
| M1 — region wejścia webview (2) | `SetWindowRgn` na hoście `WRY_WEBVIEW` (`ICoreWebView2Controller::ParentWindow`) | `gdk::Window::input_shape_combine_region` na `GdkWindow` web view; **bezpiecznik:** jeśli web view nie ma własnego `GdkWindow`, odmowa z powodem (inaczej klik w dziurę trafiłby do pulpitu) | **stub** (`hitTest:` wymaga podklasy przez `objc2`) |
| M2 — okno-dziecko nad webview (3) | własna klasa `SPIKE_M2_MAP`, `WS_CHILD`, `HWND_TOP`, region = okno − UI, wgpu przełączony do niego | **stub** | **stub** |
| Fokus (6) | zaimplementowane (`Webview::set_focus`) | zaimplementowane | wykonalne tylko bez natywnego kliknięcia → `NIE_ZMIERZONO` |
| IPC (4), pamięć (5), pełny ekran (7) | zaimplementowane | zaimplementowane | zaimplementowane |
| **Kompilacja w tym temacie** | `cargo check` + `clippy -D warnings` dla `x86_64-pc-windows-msvc` → **EXIT=0** (`logi-r1/05`, `logi-r1/10`) | **NIE_ZMIERZONO** — `cargo check` → EXIT=101, `gdk-sys`: „The system library `gdk-3.0` … was not found” (`logi-r1/03`); kod `platform_linux.rs` i ścieżka `app` na Linuksie nieskompilowane | **NIE_ZMIERZONO** — EXIT=101 na `objc2-exception-helper` (brak kompilatora Apple, `logi-r1/06`) |
| **Uruchomienie** | NIE_ZMIERZONO | NIE_ZMIERZONO | NIE_ZMIERZONO |

Uwaga do kompilacji Windows: sprawdzono z hosta Linux (`rustup target add x86_64-pc-windows-msvc`, sam `std`, bez linkowania). Ostrzeżenie `GNU compiler is not supported for this target` pochodzi ze skryptu budowania (zasoby `.rc` Tauri) — na prawdziwym Windows z MSVC ten krok wykonuje się normalnie `[zewn., niezweryfikowane]`. Linkowanie i działanie na Windows: NIE_ZMIERZONO.

---

## 5. SZABLON RAPORTU WYNIKU (do odesłania przez właściciela)

Odsyłane pliki: `wyniki/raport-<os>-<czas>.json` + `wyniki/log-<os>-<czas>.txt` z każdego przebiegu. Do tego krótka notka wg wzoru:

```text
RAPORT SPIKE RR-T1 (R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1)
Data:                      RRRR-MM-DD
Commit spike'a:            <git rev-parse HEAD>
Maszyna:                   <CPU>, <GPU + sterownik>, <RAM>
System:                    Windows 11 23H2 / Ubuntu 24.04 (X11|Wayland) / macOS 15 ...
Monitor / skala:           <np. 2560x1440, 125 %>
Komenda:                   cargo run --release --locked  [+ zmienne: SPIKE_FORCE_M2=1, GDK_BACKEND=..., WGPU_BACKEND=...]
Kompilacja:                OK / BŁĄD (wklej wyjście)
Pliki:                     raport-....json, log-....txt

Wyniki (przepisz z panelu "Gotowe" albo z pola "log" w JSON):
 (1) P1RenderPodWebview:     PASS | FAIL | NIE_ZMIERZONO
 (2) P2M1RegionWejscia:      ...
 (3) P3M2OdwroconeWarstwy:   ...
 (4a) P4aIpcWebviewDoRust:   ...   p50/p95 = ... / ... ms
 (4b) P4bIpcRustDoWebview:   ...   p50/p95 = ... / ... ms
 (5) P5Pamiec60s:            ...   RSS 10 s / 60 s = ... / ... MiB
 (6) P6FokusKlawiatury:      ...
 (7) P7Fullscreen:           ...

Obserwacje wzrokowe (wolny tekst): miganie przy zmianie rozmiaru? czarne tło? panel przycięty po M1?
                                   zachowanie przy przeciąganiu okna między monitorami (jeśli sprawdzono)?
```

Struktura JSON (schemat `spike-gpu-embed/1`, typy w `src/report.rs`):

```json
{
  "schema": "spike-gpu-embed/1",
  "temat": "R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1",
  "platform": { "os": "windows", "arch": "x86_64", "family": "windows" },
  "environment": { "gpu_adapter": {"name": "...", "backend": "Dx12"}, "surface_main": "...",
                   "window_scale_factor": 1.25, "frames_presented": 4100, "native_events": [ ... ], "...": "..." },
  "checks": [
    { "id": "P1RenderPodWebview", "title": "(1) ...", "maps_to": "P4-3 §2.3 ...",
      "status": "PASS", "evidence": ["wlasciciel: TAK ...; klatek: 4100"], "data": { "frames": 4100 } }
  ],
  "log": ["P1RenderPodWebview: PASS", "..."]
}
```

Orkiestrator przenosi wyniki do P4-3 §9 / P4-5B §15 (zamyka lub potwierdza pozycje `NIE_ZMIERZONO`) i na tej podstawie przygotowuje decyzje D-RR-2 (potwierdzenie A albo fallback) i D-SEAM-5.

---

## 6. Założenia (luki rozstrzygnięte domyślnie, do rewizji)

| ID | Założenie |
|---|---|
| Z-S1 | Próg IPC: p95 jednokierunkowo ≤ 16,7 ms (jedna klatka 60 Hz). D-RR-10 nie ustala progu; surowe liczby są w raporcie, próg można zmienić bez ponownego pomiaru |
| Z-S2 | Pamięć: `FAIL`, gdy RSS rośnie o > 32 MiB między ~10 s a ≥ 60 s (wskaźnik wycieku). Wartość bezwzględna tylko raportowana. VRAM poza procesem nie mierzony |
| Z-S3 | Komendy Tauri spike'a są `async` (pula wątków, nie wątek główny) — opóźnienie (4a) dotyczy tej ścieżki; wątek główny nie jest blokowany przez testy czekające (pełny ekran, `with_webview`) |
| Z-S4 | Linux: współrzędne GDK = piksele CSS (zoom WebKit 1), więc kształt wejścia M1 dostaje prostokąty CSS, nie fizyczne |
| Z-S5 | M2 wykonywane tylko, gdy M1 ≠ PASS (litera dispatchu), plus przełącznik `SPIKE_FORCE_M2=1` |
| Z-S6 | (6) `PASS`, gdy klawisz dociera do webview bezpośrednio **albo** po `Webview::set_focus` (zgodnie z P4-5B Z3); raport rozróżnia oba przypadki |
| Z-S7 | (1) wymaga wzrokowego TAK właściciela; liczba klatek i samotest offscreen to dowody pomocnicze (nie odróżniają „narysowane” od „widoczne pod webview”) |
| Z-S8 | `tauri-build =2.6.3` jako zależność budowania (§2.2) |
| Z-S9 | `macos-private-api` włączone, `unstable` nie (§2.2) |
| Z-S10 | Lock zasiany z `src-tauri/Cargo.lock`; jedyna ręczna korekta: `cargo update -p gpu-allocator` (§2.4) |
| Z-S11 | Status (4a) z serii „paced” (1/klatkę); seria „burst” tylko jako dane |
| Z-S12 | Domyślna cecha = `app` (jedna komenda u właściciela); testy tutaj przez `--no-default-features` / `--features gpu` |
| Z-S13 | Wyniki w `<crate>/wyniki/` (`CARGO_MANIFEST_DIR` z czasu kompilacji — spike uruchamiany ze źródeł) lub `SPIKE_OUT_DIR` |

---

## 7. Znane ryzyka i ograniczenia samego spike'a

1. **M1 na Windows przycina też rysowanie** webview do regionu (P4-5B §2) — dlatego region = prostokąty panelu i paska; pytanie wizualne po M1 to wychwytuje.
2. **Kompozycja DXGI pod oknem-dzieckiem WebView2:** czy przezroczyste piksele WebView2 pokażą zawartość łańcucha wymiany wgpu okna-rodzica — właśnie to mierzy (1); wynik „czarne tło” jest prawdopodobnym `FAIL`, a nie błędem spike'a.
3. **Linux:** WebKitWebView w GTK3 może nie mieć własnego `GdkWindow` — bezpiecznik zamienia to w `NIE_ZMIERZONO` z powodem; prawdziwe M1 wymagałoby wtedy innego podejścia (kandydat na rundę 2/RR-T1).
4. **Zegar:** opóźnienia jednokierunkowe mają błąd do ±(RTT_min/2) — wartość w raporcie obok statystyk.
5. **Pełny ekran:** stałe 1,5 s oczekiwania; wolny menedżer okien może dać fałszywy `FAIL` — notatki zawierają liczbę `Resized`.
6. **Klik w dziurę bez M1** (gdy M1 = stub) trafia do webview — to poprawny `NIE_ZMIERZONO`/`FAIL`, nie błąd.
7. Kod Linux/macOS nie przeszedł kompilacji tutaj — możliwe błędy kompilacji u właściciela (wtedy: §3.6).

---

## 8. Weryfikacja w tym temacie (komendy, wyniki)

Wszystkie z `rust-port/spike-gpu-embed`, `CARGO_INCREMENTAL=0`, `CARGO_TARGET_DIR=<scratchpad>/target-spike` (usunięty po pracy), rustc/cargo 1.97.0. Surowe logi z `EXIT=` w `dyspozycje/autobot/runs/R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1/logi-r1/`.

| Log | Komenda | Wynik |
|---|---|---|
| `01-lock-porownanie.txt` | porównanie par nazwa/wersja w lockach | drzewo Tauri identyczne z `src-tauri` (poza 2 crate'ami ścieżkowymi), `wgpu*` 30.0.1 |
| `03-check-linux-app.txt` | `cargo check --locked` (cecha `app`, host Linux) | **EXIT=101** — `gdk-sys`: brak `gdk-3.0` (pkg-config); środowisko, nie kod; nic nie instalowano |
| `04-check-windows-app.txt` | `cargo check --locked --target x86_64-pc-windows-msvc` (przed korektą locka) | **EXIT=101** — niezgodność `windows` 0.61/0.62 w `wgpu-hal` (§2.4) |
| `05-check-windows-app-r2.txt` | to samo po `cargo update -p gpu-allocator` | **EXIT=0** |
| `06-check-macos-app.txt` | `cargo check --locked --target aarch64-apple-darwin` | **EXIT=101** — `objc2-exception-helper` (brak kompilatora Apple) |
| `07-test-cpu.txt` | `cargo test --locked --no-default-features` | **EXIT=0**, 33 passed |
| `08-test-gpu.txt` | `cargo test --locked --no-default-features --features gpu` | **EXIT=0**, 36 passed; `SKIPPED: no GPU adapter (…)` |
| `09-clippy-gpu-linux.txt` | `cargo clippy --locked --all-targets --no-default-features --features gpu -- -D warnings` | **EXIT=0** |
| `10-clippy-windows-app.txt` | `cargo clippy --locked --all-targets --target x86_64-pc-windows-msvc -- -D warnings` | **EXIT=0** |
| `11-fmt-check.txt` | `cargo fmt --all -- --check` | **EXIT=0** |
| `12/13-tree-gpu-allocator*.txt` | `cargo tree … gpu-allocator` | `gpu-allocator v0.28.0 → windows v0.62.2` |

Dodatkowo: `node --check ui/spike.js` → EXIT=0 (składnia JS). Cele `x86_64-pc-windows-msvc` i `aarch64-apple-darwin` dodane do rustup **tylko na czas tej weryfikacji** i usunięte po pracy (biblioteki standardowe Rusta, nie biblioteki systemowe GTK/WebKit).

---

## 9. `NIE_ZMIERZONO` (stan po rundzie 1)

1. Punkty (1)–(7) na każdej platformie — czekają na przebieg u właściciela.
2. Kompilacja ścieżki `app` na Linuksie (`platform_linux.rs`) i macOS.
3. Linkowanie i uruchomienie binarki na Windows.
4. Czas pierwszej kompilacji u właściciela.
5. Wymagania systemowe z §3.1 oznaczone `[zewn., niezweryfikowane]`.
