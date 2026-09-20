# 00-dispatch — R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1

STATUS: DISPATCHED
DOMAIN: GAME / HANDOFF / RUST / TAURI
TEMAT: R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1
ROLE: Operator
ROUND: 1/5
BOARD: `the-game-real24`
PROFILE: `default`
PROJECT: `p_9ae9ac64`
TENANT: `the-game`
WORKSPACE: `/home/ubuntu/projects/The-Game-web-1to1-port-handoff-20260920`
BRANCH: `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`
BASE/HEAD_AT_DISPATCH: `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`
REMOTE_BASE: `origin/autobot/real24-staging`
IDEMPOTENCY: `R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1:operator:r1:20260920`

## Cel

Przygotować kompletny, samodzielny handoff dla innego agenta, który ma
przebudować aplikację Rust/Tauri tak, aby zachowywała się i wyglądała 1:1 jak
oryginalna gra webowa. Ten Operator przygotowuje dokumentację, manifest i
pakiet przekazania; nie implementuje nowego UI ani nie zmienia kodu produktu.

Właściciel jednoznacznie wymaga:

- oryginalny frontend webowy jest źródłem prawdy;
- nie wolno tworzyć drugiego uproszczonego interfejsu „podobnego” do webu;
- mapa ma być prawdziwą mapą świata oryginalnej gry, nie testową siatką HTML;
- początkowy wybór cywilizacji ma pokazywać pełną pulę dostępnych cywilizacji
  zgodną z webem, w tym dziewięć opcji w scenariuszu początkowym;
- wszystkie kolejne prace mają być prowadzone przez Kanban;
- handoff musi być wypchnięty do GitHub, aby następny agent mógł go pobrać.

## Stan wejściowy — czego nie wolno przedstawiać jako gotowego produktu

Aktualny Rust/Tauri playable slice na `78d494c7` jest funkcjonalnym harness’em,
nie portem 1:1:

- `src-tauri/frontend/main.js` ma ręcznie wpisane 3 cywilizacje i symbole
  Unicode zamiast danych/ikon webowych;
- `renderMap()` tworzy zwykłe przyciski HTML w małej siatce testowej i pokazuje
  współrzędne, płaskie kolory oraz symbole stolicy/jednostki;
- `src-tauri/frontend/index.html` opisuje ten frontend jako „compact web-parity
  equivalent, without importing the web bundle”;
- oryginalny web używa danych cywilizacji, SVG/brand assets oraz renderera mapy
  3D/Canvas/WebGL (`gra/src/render/scene.ts` i powiązane moduły).

Produktowa akceptacja wcześniejszego slice’a dotyczyła przejścia ścieżki
menu→wizard→mapa→ruch→tura, a nie zgodności wizualnej, pełnej puli
cywilizacji ani oryginalnego renderera świata. Nie wolno przenosić tej
akceptacji jako dowodu 1:1.

## Obowiązkowy zakres handoffu

Operator ma utworzyć wyłącznie następujące pliki procesu:

- `handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/00-PLAN-DZIALANIA.md`
- `handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/01-HANDOFF-DLA-AGENTA.md`
- `handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/02-MANIFEST-PLIKOW.json`
- `handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/03-KRYTERIA-AKCEPTACJI.md`
- `handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/04-INSTRUKCJA-POBRANIA.md`
- `handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/05-STAN-BLEDNYCH-ARTEFAKTOW.md`
- `handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/06-REJESTR-DECYZJI-I-RYZYK.json`
- `handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1/07-CHECKSUMS-SHA256.txt`
- `dyspozycje/autobot/runs/R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1/01-operator.md`
- `dyspozycje/autobot/runs/R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1/01-evidence.json`
- `dyspozycje/autobot/runs/R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1/01-transition-receipt.md`

Dozwolone są katalogi nadrzędne potrzebne do tych plików. Nie modyfikować
żadnego pliku produkcyjnego, `gra/**`, `gra-robocza/**`, `.github/**`,
`WERSJE.md`, `KANAL-PRACA.md`, bridge’a, testów produktu ani konfiguracji Tauri.

## Co manifest musi przekazać

Manifest ma rozróżniać `reference_read_only`, `current_rust_tauri`,
`data_assets`, `tests_and_gates`, `build_and_packaging` oraz `handoff_docs`.
Musi zawierać pełne ścieżki względne, rolę, źródło prawdy, status i SHA-256
każdego pliku śledzonego, który jest wymagany do pracy agenta.

### A. Oryginalny frontend webowy — reference_read_only

Wymienić co najmniej:

- `gra/src/ui/**` — menu, kreator, HUD, panele, ikony i style UI;
- `gra/src/render/**` — scena, terrain meshes, dekoracje, rzeki, granice,
  miasta, jednostki i mapowe overlaye;
- `gra/src/input/**` — picking, kliknięcia i sterowanie mapą;
- `gra/src/types/**` — kontrakty mapy, heksów, jednostek, miast i stanu;
- `gra/src/map/**` — generator, maska świata, klastry startowe, granice,
  rzeki, drogi i mapowe dane domenowe;
- `gra/src/game/**` — tylko pliki faktycznie importowane przez UI/render/mapę
  oraz pliki kontraktu stanu; manifest ma wskazać dokładne pliki, nie używać
  ogólnego opisu „cały game” bez listy;
- `gra/src/main.ts` i pliki wejścia bundlera, jeśli są niezbędne do uruchomienia
  referencyjnej sceny;
- `gra/data/civs.json`, `gra/data/e-start-params.json`,
  `gra/data/ui-params.json`, `gra/data/map-gen-params.json`, `gra/data/units.json`,
  `gra/data/resources.json`, `gra/data/terrain-*.json`, `gra/data/buildings.json`,
  `gra/data/wonders.json`, `gra/data/tech.json` oraz dokładne inne zależności
  wykryte przez import/asset scan;
- `gra/src/ui/assets/**`, `gra/src/ui/icons/**`, `gra/public/**` i inne assety
  używane przez ścieżkę menu→kreator→mapa;
- `gra/package.json`, `gra/package-lock.json`, `gra/tsconfig.json` oraz
  konfigurację Vite/Three.js, jeżeli jest wymagana do reprodukcji referencji.

Web jest wyłącznie źródłem prawdy i pozostaje read-only. Nie kopiować do niego
poprawek Rust/Tauri.

### B. Aktualny Rust/Tauri — current_rust_tauri

Wymienić z pełnym SHA-256, bez modyfikacji:

- `rust-port/engine/**` — aktualny silnik i testy;
- `src-tauri/**` — manifest, konfigurację, capabilities, entrypoint i obecny
  frontend, jawnie oznaczony jako `REPLACE_OR_REWIRE`, nie jako wzorzec UI;
- `tests/**` — kontrakty bridge/frontend wraz z informacją, które testy są
  tylko legacy playable-slice harness’em;
- `.github/workflows/tauri-windows.yml` i inne workflow wymagane do buildów;
- exact HEAD/base/remote ref oraz status worktree.

### C. Artefakty i dowody

Manifest ma odnotować, ale nie traktować jako dowodu 1:1:

- `t_ea768507/run827` — wcześniejsza akceptacja playable slice’a;
- `t_8af96c46/run828`, `t_de820725/run829`, `t_a74f8635/run830` — packaging
  MSI/NSIS;
- source SHA `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`;
- `origin/main` `f4c89d0081c622c16b207d338b49c8bacafc4553`;
- informację, że obecny MSI/NSIS nie jest jeszcze artifactem zgodności web 1:1.

## Plan, który musi zostać opisany

Plan ma zawierać fazy i bramki:

1. **Freeze i kwalifikacja** — zatrzymanie obecnego ręcznego UI jako referencji
   historycznej; brak dalszych patchy ikon/kart/siatki.
2. **Reference capture** — uruchomienie weba na ustalonych viewportach,
   screenshoty/DOM/tekst/asset map dla menu, intro, epoki, cywilizacji,
   ustawień, generowania i mapy.
3. **Dependency/asset graph** — exact import graph oryginalnego UI i renderera;
   brak ręcznych placeholderów.
4. **Frontend strategy** — preferowany wariant: ten sam frontend HTML/CSS/JS
   w Tauri, z wymianą wyłącznie adaptera backendowego; rozdzielić UI od
   kontraktu Rust.
5. **Bridge/state adapter** — mapowanie Rust state do kontraktu webowego,
   bez zmiany widoku na uproszczone DTO. Wymienić mapę świata, heksy, teren,
   miasta, jednostki, wybór, kolejkę tury i komunikaty.
6. **Start wizard** — oryginalny Intro→Epoka→Cywilizacja→Ustawienia→Start,
   pełna pula cywilizacji wynikająca z danych; dla scenariusza początkowego
   zweryfikować 9 opcji, a nie hard-code 3.
7. **World renderer** — port oryginalnej sceny i assetów 3D/Canvas/WebGL,
   generowanie prawdziwej mapy świata, teren, rzeki, granice, miasta,
   jednostki, HUD i picking.
8. **Behavior parity** — ruch, selekcja, koniec tury, zapis/odczyt, błędy i
   wszystkie komunikaty w języku zgodnym z webem.
9. **Screen-by-screen QA** — niezależny real-browser/runtime comparison,
   screenshot diff, DOM/tekst/assets, viewport boundary, console/page errors.
10. **Kanban acceptance** — Operator → niezależny Evaluator → Defense tylko przy
    numerowanych zarzutach → Final Control → osobna integracja.
11. **Packaging dopiero po parytecie** — Windows build i owner-side install
    dopiero dla artifactu, który przejdzie mapę świata i pełny flow.

## Kryteria negatywne — natychmiastowy FAIL

- prostokątna testowa siatka HTML zamiast mapy świata;
- hard-coded trzy cywilizacje, gdy scenariusz ma dziewięć;
- Unicode/placeholder zamiast oryginalnych ikon/assetów;
- ręcznie przepisane uproszczone karty lub teksty niezgodne z webem;
- test fake DOM bez realnego runtime jako jedyny dowód;
- zielone testy Rust bez uruchomienia oryginalnego renderera;
- twierdzenie „web-parity” na podstawie samych nazw przycisków;
- zmiana `gra/**` zamiast pracy w lane Rust/Tauri;
- instalator zbudowany przed zamknięciem parytetu.

## Wymagania bezpieczeństwa Git

- Primary `/home/ubuntu/projects/The-Game/` jest chroniony;
- nie używać `git reset`, `git clean`, `git stash`, `git rebase`, `git add .`,
  `git add -A` ani force-push;
- staged paths muszą być jawnie porównane z allowlistą;
- handoff ma zostać wypchnięty jako osobna gałąź, nie do `main`;
- po pushu wykonać `git ls-remote` i potwierdzić exact SHA.

## Kontrakt Operatora

Operator kończy natywnym wynikiem zawierającym:

```text
STATUS: PASS-WITH-NOTES | FAIL | INFRA
DOMAIN: HANDOFF
TEMAT: R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1
BASE/HEAD: pełne SHA
FILES: liczba manifestowanych plików per kategoria
PLAN: fazy 0–11 zapisane
KNOWN_BAD: current frontend/map/civ limitations
PUSH: NIE WYKONANO przez Operatora
NEXT: independent Evaluator
```

Operator nie commit/pushuje. Commit i push handoffu następują dopiero po
niezależnym Evaluatorze i Final Control, z readbackiem remote SHA.
