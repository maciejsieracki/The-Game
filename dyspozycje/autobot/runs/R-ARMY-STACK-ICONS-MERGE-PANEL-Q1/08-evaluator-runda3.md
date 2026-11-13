# AutoBot Evaluator — runda 3: niezależna weryfikacja marginesu 24 px

TEMAT: R-ARMY-STACK-ICONS-MERGE-PANEL-Q1
RUNDA: 3/5
WERDYKT: **PASS — wszystkie odtworzone pomiary przekraczają 24 CSS px**
DEPLOY/PUSH/COMMIT: nie wykonano

## Powtórzony render Chromium

Test uruchomiono trzy razy kolejno dokładnie poleceniem `node tools/army-merge-panel-scroll-real-render-test.cjs` z katalogu `gra`. Uruchomienie wymagało fallbacku do `/usr/bin/chromium`; w każdym przebiegu test podał 26/26, viewport CSS 600×413, DPR 1.5 i odpowiadający mu rozmiar fizyczny 900×620 px.

| Przebieg | Panel: left, top, right, bottom (CSS px) | innerWidth × innerHeight | DPR | Górny / dolny odstęp (CSS px) | Wynik |
|---|---|---:|---:|---:|---:|
| 1 | 28.145203, 28.237579, 571.854797, 385.046997 | 600 × 413 | 1.5 | 28.237579 / 27.953003 | 26/26 |
| 2 | 28.363007, 28.593613, 571.636932, 385.117172 | 600 × 413 | 1.5 | 28.593613 / 27.882828 | 26/26 |
| 3 | 28.145386, 28.237885, 571.854614, 385.047058 | 600 × 413 | 1.5 | 28.237885 / 27.952942 | 26/26 |

Wszystkie sześć pomiarów krawędzi wynosi co najmniej 27.882828 CSS px, więc każdy przekracza wymagane 24 px. Logi każdego przebiegu potwierdziły widoczność i kliknięcia CTA, osiągalność ostatniego wiersza, pojedynczy zamierzony kontener scrolla, brak poziomego overflow, negatywną kontrolę mutanta oraz brak błędów strony.

## Pozostałe bramki i przegląd zmian

- `node tools/army-split-ruch-icons-test.cjs`: **7/7 PASS**.
- `npm run typecheck`: **PASS** (`tsc --noEmit`).
- `npm run build`: **PASS**, Vite przetworzył 916 modułów.
- `git diff --check` dla czterech plików allowlisty: **PASS**.
- Zmiany produkcyjne w allowliście ograniczają się do reguły krótkiego viewportu w `armyMergePanel.ts`. Różnica testu Chromium dodaje wyłącznie log surowej geometrii; nie zmienia viewportu, DPR, scenariusza ani warunków testowych. `armyStackHud.ts` i test ikon nie mają zmian.
- Kontrola progu: kod geometrii nadal sprawdza `gap < 24 - 0.5` (subpikselowa tolerancja 0.5 CSS px); diff rundy dodaje tylko logowanie i nie modyfikuje ani nie obniża tej wartości. Niezależne surowe pomiary przekraczają pełne 24 px, więc wynik PASS nie zależy od tolerancji. Próg nie został w tej rundzie zmieniony.

## SHA-256 kontrolowanych źródeł i testów

```text
03b19ffc93be6a78ceac16931ef729784a44e51300836d0c4c82544e3038b6a2  gra/src/ui/armyMergePanel.ts
e44b897b3441e06b09682b6484e27ce4ac4eb6803c0a87b973206c8be7b256f9  gra/src/ui/armyStackHud.ts
d962b0f142a93ea81802bb1ca7e2653f278e38d70b2e2dcbed1f6cb5452a3bd5  gra/tools/army-merge-panel-scroll-real-render-test.cjs
c5f5b41b120cacae712a85744644054093a38cedc94584dd7df47dddabf752db  gra/tools/army-split-ruch-icons-test.cjs
```

Pozostałe dirty pliki worktree nie należą do allowlisty tego zadania i nie były uwzględniane w werdykcie.
