# R-RUSTREAL-WEB-1TO1-PORT-Q1 — plan działania handoffu

STATUS: PASS-WITH-NOTES (pakiet dokumentacyjny lokalny)
DOMAIN: HANDOFF
TEMAT: R-RUSTREAL-WEB-1TO1-PORT-Q1
BASE/HEAD: `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`
REMOTE BASE: `origin/autobot/real24-staging` = `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`
BRANCH: `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`
PUSH: NIE WYKONANO

## Cel i granica

Ten pakiet przekazuje agentowi wykonawczemu plan przebudowy Rust/Tauri do
zgodności 1:1 z oryginalną grą webową. Nie implementuje UI, renderera, bridge'a
ani danych. Oryginalny frontend webowy jest `reference_read_only` i pozostaje
źródłem prawdy. Obecny frontend/mapa Tauri jest wyłącznie harness'em i ma status
`REPLACE_OR_REWIRE`.

Wymóg właściciela dotyczący startu jest binarny: kreator ma korzystać z pełnej
puli cywilizacji weba, a w scenariuszu początkowym pokazać dziewięć opcji — nie
ręcznie wpisane trzy. Mapa ma być prawdziwą mapą świata z rendererem 3D/Canvas/WebGL,
a nie prostokątną siatką przycisków HTML.

## Fazy 0–11 i bramki

| Faza | Zakres | Bramka PRAWDA/FAŁSZ |
|---|---|---|
| 0 | Kwalifikacja i freeze | PRAWDA tylko po odczycie HEAD/base, manifestu, znanych ograniczeń i zamrożeniu ręcznego harnessu; FAŁSZ przy patchowaniu placeholderów przy okazji. |
| 1 | Freeze i kwalifikacja | Obecny ręczny UI/mapa pozostają historycznym wejściem; brak dalszych poprawek ikon, kart i siatki w `src-tauri/frontend/**`. |
| 2 | Reference capture | Dla ustalonych viewportów zapisane są screenshoty, DOM/tekst, asset map i stany: menu, intro, epoka, cywilizacje, ustawienia, generowanie, mapa. |
| 3 | Dependency/asset graph | Istnieje dokładny graf importów/assetów UI i renderera; każda zależność ma ścieżkę i hash; brak ręcznych placeholderów. |
| 4 | Strategia frontendu | Wybrany i zapisany jest wariant preferowany: ten sam HTML/CSS/JS weba w Tauri, z wymianą wyłącznie adaptera backendowego; alternatywa wymaga osobnej decyzji. |
| 5 | Bridge/state adapter | Rust odwzorowuje webowy kontrakt mapy, heksów, terenu, miast, jednostek, wyboru, kolejki tury i komunikatów bez uproszczonego DTO zmieniającego widok. |
| 6 | Start wizard | Flow `Intro → Epoka → Cywilizacja → Ustawienia → Generowanie` działa z pełnymi danymi; dziewięć opcji scenariusza początkowego jest zmierzone w runtime. |
| 7 | World renderer | Działa prawdziwy renderer świata: teren, rzeki, granice, miasta, jednostki, overlaye, HUD, picking i mapa niebędąca testową siatką HTML. |
| 8 | Behavior parity | Ruch, selekcja, koniec tury, zapis/odczyt, błędy i komunikaty mają obserwowalną zgodność z webem dla wymaganych klas gracza/AI. |
| 9 | Screen-by-screen QA | Niezależny real-browser/runtime zapisuje screenshot diff, DOM/tekst/assety, viewport boundaries oraz console/page errors; test ma dowód nietautologiczności przez mutację. |
| 10 | Kanban acceptance | Pełny obieg: Operator → niezależny Evaluator → Obrona tylko przy numerowanych zarzutach → Final Control → osobna integracja. |
| 11 | Packaging po parytecie | MSI/NSIS i instalacja właściciela są uruchamiane dopiero po zamknięciu parytetu mapy i pełnego flow; wcześniejszy packaging nie jest dowodem. |

## Allowlista wejścia

- `reference_read_only`: 443 plików webowych, w tym 177
  tranzytywnie osiągalnych plików `gra/src/game/**`.
- `current_rust_tauri`: 69 plików; `src-tauri/frontend/**` jawnie
  `REPLACE_OR_REWIRE`.
- `data_assets`: 356 plików danych/ikon/assetów.
- `tests_and_gates`: 1160 plików kontraktów i bramek; fake DOM sam nie
  zamyka parytetu.
- `build_and_packaging`: 6 manifestów/workflow.
- `handoff_docs`: 11 plików wygenerowanych przez ten run.

Pełne ścieżki i SHA-256 wejścia są w `02-MANIFEST-PLIKOW.json`; płaska lista
hashy wejścia i artefaktów jest w `07-CHECKSUMS-SHA256.txt`.

## Kolejność następnej pracy

1. Operator nowego tematu kwalifikuje reference capture i nie zmienia `gra/**`.
2. Operator zapisuje adapter/state contract przed portem ekranu.
3. Każdy ekran przechodzi real-browser comparison, nie tylko test kontraktowy.
4. Po akceptacji parytetu dopiero otwiera się osobny temat packaging/install.
5. Orkiestrator prowadzi niezależnego Evaluatora i Final Control oraz integruje
   wyłącznie zatwierdzoną allowlistę.

## Zakazy

Nie kopiować ręcznych kart/tekstów ani Unicode jako ikon; nie utrzymywać drugiego
uproszczonego UI „podobnego” do weba; nie zmieniać `gra/**` w lane Rust/Tauri; nie
uznawać wcześniejszego playable-slice PASS, bridge JSON/status ekranu ani MSI/NSIS
za dowód 1:1; nie commitować, pushować, mergować, deployować ani instalować w
fazie Operatora.
