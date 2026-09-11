TEMAT:  P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1
RUNDA:  1/5
DATA:   2026-09-11
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Znalezisko Operatora+Evaluatora+Final Control tematu
`R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1` (poza jego allowlistą — ten
temat ograniczał `technologyAdapter.ts` wyłącznie do linii `openDefault`).
**ECHO właściciela 2026-09-11: usuń limit `UNIT_PREVIEW`/„Pokaż pozostałe N"
całkowicie — zawsze pokazuj wszystkie jednostki.**

## GOAL

Sekcja „Jednostki" karty technologii (system entityCards, `gra/src/ui/
entityCards/technologyAdapter.ts` + `gra/src/ui/entityCards/renderer.ts`) ma
ZAWSZE pokazywać WSZYSTKIE jednostki danej technologii od razu, bez
przycisku „Pokaż pozostałe N". Dotyczy dziś 5 technologii: Brązownictwo (20
jednostek), Hutnictwo żelaza (19), Jeździectwo (8), Łucznictwo (6), Obróbka
żelaza (4) — ale napraw MECHANIZM (usuń limit), nie tylko te 5 przypadków,
żeby działało też dla przyszłych technologii z dowolną liczbą jednostek.

## DOKŁADNE MIEJSCA (potwierdzone czytaniem kodu 2026-09-11, linie mogą się
lekko przesunąć — zweryfikuj przed edycją)

- `gra/src/ui/entityCards/technologyAdapter.ts:50`: `const UNIT_PREVIEW = 3;`
- `gra/src/ui/entityCards/technologyAdapter.ts:~219`:
  `previewLimit: unitsRows.length > UNIT_PREVIEW ? UNIT_PREVIEW : undefined,`
- `gra/src/ui/entityCards/renderer.ts:~294-297`: generyczna obsługa
  `previewLimit`/`showAll`/`visibleRows`/`hiddenRows` we wspólnym rendererze
  sekcji (używana też przez INNE adaptery/karty — sprawdź `grep -rn
  previewLimit gra/src/ui/entityCards/` przed zmianą, żeby nie zepsuć
  paginacji gdzie indziej, jeśli jakiś inny adapter też z niej korzysta).

## ZAKRES — WAŻNE ROZGRANICZENIE

Istnieje DRUGIE, ODRĘBNE miejsce z tą samą stałą `UNIT_PREVIEW = 3` —
`gra/src/ui/techDiscoveryNotice.ts` (popup odkrycia technologii, komentarz w
`technologyAdapter.ts:48-49` wprost mówi „ta sama wartość co UNIT_PREVIEW w
techDiscoveryNotice.ts, dziś przypięta regexem
`technology-discovery-card-visual-test.cjs`"). **To NIE jest w zakresie tego
zgłoszenia** — zgłoszenie właściciela („wszystkie elementy rozwinięte")
dotyczyło konkretnie karty technologii w systemie entityCards (CivPedia/
panel miasta), NIE krótkiego popupu odkrycia. NIE dotykaj
`techDiscoveryNotice.ts` w tym temacie — jeśli uznasz, że też powinien się
zmienić, zatrzymaj się i zgłoś to jako osobne pytanie w raporcie, nie
zmieniaj samodzielnie.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Karta technologii Brązownictwo pokazuje w sekcji „Jednostki" wszystkie 20
   jednostek od razu, bez przycisku „Pokaż pozostałe N" (zweryfikuj żywym
   Chromium — otwórz kartę, policz wiersze jednostek w DOM, sprawdź brak
   elementu przycisku).
2. To samo dla pozostałych 4 technologii z listy w GOAL (Hutnictwo żelaza,
   Jeździectwo, Łucznictwo, Obróbka żelaza).
3. `techDiscoveryNotice.ts` NIETKNIĘTY — `git diff` pokazuje zero zmian w
   tym pliku.
4. Jeśli `previewLimit`/`renderer.ts` jest współdzielone z innymi adapterami
   (budynki/jednostki/cuda) — sprawdź, że usunięcie limitu W TECHNOLOGYADAPTER
   nie zmienia zachowania INNYCH kart (np. jeśli inny adapter też ustawia
   `previewLimit`, jego własne zachowanie ma zostać nietknięte — zmiana ma
   być lokalna do `technologyAdapter.ts`, nie do generycznego mechanizmu
   `renderer.ts`, chyba że mechanizm i tak nigdy nie jest używany przez nic
   innego — sprawdź to jawnie i napisz w raporcie).
5. `tsc --noEmit` 0 błędów.
6. 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) bez regresu.
7. Istniejące testy entity-cards/CivPedia dla technologii bez regresu
   (`civpedia-*-test.cjs`, `entity-card-*-test.cjs` — uruchom te dotyczące
   technologii/jednostek).
8. Żywy zrzut ekranu karty Brązownictwa pokazujący wszystkie 20 jednostek
   bez przycisku „Pokaż pozostałe N".

## DOWÓD WIZUALNY (obowiązkowy)

Zrzut ekranu (Playwright/Chromium) karty technologii Brązownictwo w CivPedii
lub panelu miasta, sekcja „Jednostki" w pełni rozwinięta, WSZYSTKIE 20
jednostek widoczne, zero przycisku „Pokaż pozostałe". Zapisz pod
`dowody/civpedia-brazownictwo-wszystkie-jednostki.png`.

## Allowlista

- `gra/src/ui/entityCards/technologyAdapter.ts`
- `gra/src/ui/entityCards/renderer.ts` (WYŁĄCZNIE jeśli konieczne i
  udowodnione że nie wpływa na inne adaptery — patrz kryterium 4)
- `dowody/civpedia-brazownictwo-wszystkie-jednostki.png` (nowy plik)

Zakazane: `gra/src/ui/techDiscoveryNotice.ts`, `gra/data/*.json`, pliki z
sekretami, `docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-civpedia-jednostki-pokaz-pozostale`, gałąź
`autobot/P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1`, baza
`origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona
wyłącznie `node ./node_modules/vite/bin/vite.js build --outDir <katalog
spoza repo> --emptyOutDir` oraz `node ./node_modules/typescript/bin/tsc
--noEmit`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 400 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.
