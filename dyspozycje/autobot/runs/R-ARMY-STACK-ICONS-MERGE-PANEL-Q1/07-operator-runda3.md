# AutoBot Operator — runda 3: stabilny margines 24px przy 150%

TEMAT: R-ARMY-STACK-ICONS-MERGE-PANEL-Q1
RUNDA: 3/5
STATUS: PASS
DEPLOY/PUSH/COMMIT: NIE WYKONANO

## Diagnoza i zmiana

Przy krótkim viewportcie panel był wyrównywany od góry, ale jego limit wysokości
pozostawał `100dvh - 48px`. Zmiana samego paddingu overlayu nie ograniczała
wysokości elementu flex w osi poprzecznej; pierwsza próba to potwierdziła,
mierząc dolny odstęp 19.89px. Reguła dla viewportu do 500px teraz ustawia
28px paddingu oraz jawny limit panelu `100dvh - 56px` (z fallbackiem `vh`).
Daje to 4px zapasu ponad wymagane 24px i zachowuje wewnętrzny scroll listy.

Test produkcyjnego renderu otrzymał wyłącznie log surowej geometrii: rect panelu,
`innerHeight` oraz DPR. Scenariusz, viewport 600×413 CSS px i próg testu nie
zostały zmienione.

## Powtarzalne pomiary Chromium

Identyczne polecenie `node tools/army-merge-panel-scroll-real-render-test.cjs`
uruchomione kolejno trzy razy; w każdym przebiegu wynik wyniósł 26/26 PASS.

| Przebieg | box rect (left, top, right, bottom) CSS px | innerHeight | DPR | gap góra / dół |
|---|---|---:|---:|---:|
| 1 | (28.661743, 29.081451, 571.338257, 385.212921) | 413 | 1.5 | 29.081451 / 27.787079 px |
| 2 | (28.362885, 28.593430, 571.637054, 385.117111) | 413 | 1.5 | 28.593430 / 27.882889 px |
| 3 | (28.146393, 28.239517, 571.853668, 385.047379) | 413 | 1.5 | 28.239517 / 27.952621 px |

Każdy pomiar przekracza 24px na obu krawędziach przy niezmienionym DPR 1.5
i viewportcie 600×413 CSS px (900×620 px fizycznych). Test potwierdził też
widoczne i klikalne CTA, osiągalność ostatniego wiersza i negatywną kontrolę.

## Pozostałe bramki i zakres

- `node tools/army-split-ruch-icons-test.cjs` — **7/7 PASS**.
- `npm run typecheck` — **PASS**.
- `npm run build` — **PASS**, Vite przetworzył 916 modułów.
- `git diff --check` dla plików allowlisty — **PASS**.
- Zmiany zakresu: `gra/src/ui/armyMergePanel.ts`, diagnostyczny log w
  `gra/tools/army-merge-panel-scroll-real-render-test.cjs` i ten raport.
- `armyStackHud.ts` oraz test ikon niezmienione. Pozostałe dirty pliki worktree
  nie były częścią tej pracy.

Nie wykonano commit, push ani deploy.
