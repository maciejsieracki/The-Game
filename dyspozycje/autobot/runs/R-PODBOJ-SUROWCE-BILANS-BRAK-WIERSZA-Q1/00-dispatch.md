STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1
GOAL: Popup "Bilans zdobycia" przy przejęciu miasta (`gra/src/ui/cityCaptureNotice.ts`,
dane z `buildCityCaptureReportRows()` w `gra/src/main.ts`) pokazuje TAKŻE surowce
zdobyte razem z miastem (drewno/glina/kamień/ruda itd. z `city.surowce`) — WYŁĄCZNIE
nowy wiersz informacyjny, ZERO zmiany mechaniki transferu (surowce już dziś fizycznie
"przechodzą" na zdobywcę, bo `applyCityCaptureAfterBattle` nigdy nie zeruje
`city.surowce` — zmienia tylko `ownerId`; potwierdzone w `PYTANIA-OTWARTE.md:5347-5349`
i recon tego tematu). To NIE dotyczy puli pracy (`Pula pracy: przepadła...`) — TA linia
zostaje BEZ ZMIAN, to osobna, świadoma decyzja (`P-PODBOJ-PRZEJECIE-SUROWCOW-PANSTWA-MIASTA`,
2026-08-09, `036173f7` — pula pracy zawsze przepada, celowo, symetrycznie cywilizacja/
miasto-państwo; NIE ruszać tej linii w tej rundzie).

WYZWALACZ: recon (Explore agent) na żywe zgłoszenie właściciela (zrzut popupu
"ELIMINACJA!"/"BILANS ZDOBYCIA": Ludność +2, Złoto +22, Punkty nauki +25, Pula pracy
przepadła — brak JAKIEGOKOLWIEK wiersza o surowcach) ustalił: mechanizm transferu
surowców JUŻ ISTNIEJE po cichu (przez brak zerowania `city.surowce` przy zmianie
`ownerId`), ale nie jest komunikowany w UI. Właściciel oczekuje widoczności tej
informacji w bilansie.

KONTEKST TECHNICZNY (zlokalizowany przez recon, oszczędza czas Operatorowi):
- `gra/src/main.ts:1403-1433`, funkcja `buildCityCaptureReportRows()` — tu dodać nowy
  wiersz/wiersze dla surowców z przejmowanego miasta. Wzorować na istniejących wierszach
  (np. "Złoto ze skarbca", "Punkty nauki") co do stylu/formatu.
- `gra/src/game/cities.ts:793`, `City.surowce?: Record<string, number>` — źródło danych,
  per-miasto (nie per-gracz), istnieje dla KAŻDEGO ownerId (gracz, AI, miasto-państwo).
- Wywołujące miejsca popupu: `runCapitalCapturePlunder()` (main.ts ~L26583, ~L13528),
  ścieżka bitwy (~L27116) — sprawdź, czy funkcja budująca wiersze ma już dostęp do
  obiektu `City` PRZED zmianą ownerId (żeby pokazać dokładnie to, co miasto miało w
  magazynie w momencie zdobycia) — jeśli nie, dociągnij go do sygnatury (allowlista
  dopuszcza zmianę wywołań w main.ts w tym samym pliku).
- Format: pokaż tylko surowce z niezerową wartością (pomiń zera), z etykietą surowca
  (sprawdź istniejący słownik nazw surowców w kodzie, np. `RESOURCE_LABELS` lub podobny,
  nie wymyślaj nowych nazw).

ZAKRES ŚWIADOMIE POZA TEMATEM:
- Zero zmiany w `Pula pracy: przepadła...` — zostaje identyczna, to inny, zamknięty temat.
- Zero zmiany w tym, JAK surowce fizycznie się transferują (już działa) — wyłącznie
  dodanie WIERSZA informacyjnego.
- Zero zmiany w `magazynZywnosci` (żywność) — chyba że Operator uzna, że powinna być
  pokazana analogicznie; jeśli tak, uzasadnij i dopisz jako osobny wiersz, nie łącz z
  surowcami budowlanymi bez wyjaśnienia w raporcie.

BINARNE KRYTERIUM SUKCESU: popup "Bilans zdobycia" dla miasta z niezerowym `city.surowce`
pokazuje co najmniej jeden nowy wiersz z nazwą surowca i ilością, potwierdzone żywym
zrzutem (Chromium/Playwright) LUB istniejącą bramką renderującą ten popup jeśli istnieje.

ALLOWLISTA:
- `gra/src/main.ts` (wyłącznie `buildCityCaptureReportRows()` i, jeśli konieczne,
  wywołania przekazujące jej dodatkowy argument — nie ruszać reszty pliku)
- `gra/src/ui/cityCaptureNotice.ts` (jeśli render wymaga drobnej korekty wyświetlania
  nowego typu wiersza)
- `gra/tools/*.cjs` — wolno dodać/rozszerzyć bramkę
- `dyspozycje/autobot/runs/R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1/*` (raporty własne)
Zakaz zmiany `gra/src/game/capital-capture.ts` (mechanika transferu — już działa, nie
dotykać). Zakaz zmiany wiersza "Pula pracy". Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania zmiany za gotową bez żywego dowodu
(zrzut albo bramka) pokazującego KONKRETNĄ liczbę surowca w nowym wierszu dla
scenariusza z niezerowym magazynem — nie ogólnikowe "wiersz dodany".

IZOLACJA: worktree `/home/user/wt-podboj-surowce-bilans`, gałąź
`autobot/R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1`, baza `origin/main` @ `c469c7b5`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
