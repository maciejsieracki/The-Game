TEMAT: R-PRODUKCJA-POSTEP-PAMIEC-PO-USUNIECIU-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/production.ts (dequeue/enqueue/dropFrontItem), gra/src/ui/cityPanel.ts
(cancelQueueItem), gra/src/types/city.ts (nowe pole na City), gra/src/game/save.ts
(serializacja/migracja)
MODEL+EFFORT: claude-sonnet-5, effort high (odwrócenie udokumentowanej decyzji
projektowej + migracja zapisu gry — wymaga staranności)

WYZWALACZ (dosłownie od właściciela, po pytaniu ABC)
"System nie zapamiętuje, ile już postępu zostało wykonane przy budowie budynku, a
powinien zapamiętywać stan. Na przykład, jeżeli usuniemy go z kolejki albo w połowie
zrobiony, gdy przywrócimy go znowu do kolejki do obudowy, powinien być znowu w połowie
zrobiony, a nie resetować się od zera. Także budynki powinny pamiętać swój stan, ile
zostało już przeznaczonych środków na ich wybudowanie. Nawet jeśli usuniemy je z
kolejki, a po czasie przywracamy, powinien być przywrócony ich stan."

ABC (pytanie orkiestratora, odpowiedź właściciela) — WIĄŻĄCE dla zakresu tego dispatchu
Pytanie: recon potwierdził, że dzisiejsze zachowanie (usunięcie pozycji z frontu kolejki
kasuje jej postęp) to świadoma decyzja `P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B` z
2026-08-13 — czy odwrócić ją na: pełna pamięć postępu per typ budynku w danym mieście,
przetrwa usunięcie z kolejki, wymaga migracji zapisu gry?
Odpowiedź: **TAK, pełna pamięć per budynek/miasto** (nie tylko front kolejki) — to jest
WIĄŻĄCY zakres tego tematu, nie węższy wariant "tylko front".

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji, subagent Explore)
- `ProductionItem.postep?: number` (`production.ts:83-118`) — postęp zbankowany dla
  pozycji NIEBĘDĄCEJ frontem (index 0), zapisywany/odczytywany WYŁĄCZNIE przez
  `promoteToFront()`. `CityProduction.postep: number` (linie 120-140) — aktywny licznik
  WYŁĄCZNIE dla frontu (index 0).
- `dropFrontItem()` (`production.ts:1221-1233`) — wspólny rdzeń zdejmowania frontu,
  używany przez `dequeue`, `advanceProduction`, `rushProduction`. Przy anulowaniu
  (`dequeue`, index=0) `remainder` przekazywany jako `0` — CELOWA utrata WŁASNEGO
  postępu anulowanej pozycji (`production.ts:1236-1289`, obszerny komentarz "P-PROMOCJA-
  FRONT-RESET-POSTEPU-Q1=B" — TA decyzja jest tematem tego dispatchu do odwrócenia,
  WYŁĄCZNIE dla ścieżki anulowania/usunięcia z kolejki przez gracza, NIE dla naturalnego
  ukończenia pozycji ani dla `promoteToFront`/przesuwania w obrębie kolejki, które już
  działają poprawnie i mają własne testy — NIE dotykaj tamtej logiki).
- `cancelQueueItem()` (`cityPanel.ts:5891-5901`) — handler przycisku "Usuń", woła
  `dequeue(prod, index)`, zwraca WYŁĄCZNIE koszt surowcowy (cegła/kamień itp.) do
  ewentualnego zwrotu — NIE zwraca/nie zapisuje utraconej Pracy.
- `filterQueue()` (ok. `production.ts:1291`+, sprawdź dokładnie sygnaturę) MA już pole
  `forfeitedPostep` w wyniku — istniejący, ale dziś NIEUŻYWANY przez `cancelQueueItem`
  mechanizm zwracania utraconej Pracy do puli (używany dziś tylko przy migracji legacy
  jednostek w `sanitizeBuildQueue`, linie 1147-1179) — możliwy wzorzec do naśladowania
  przy budowie nowej pamięci, NIE do bezpośredniego reużycia bez zmiany znaczenia.
- Brak dziś JAKIEJKOLWIEK struktury `Record<buildingId, postep>` per miasto — potwierdzone
  przeszukaniem repo (`postepBudynkow`/`savedProgress`/podobne — zero wyników).
- `enqueue()` (`production.ts:1122-1139`) buduje nowy `item` zawsze od zera (`postep`
  nieustawione = 0 przy odczycie) — nie sprawdza żadnej pamięci.

GOAL
1. Nowa struktura pamięci postępu PER TYP BUDYNKU W DANYM MIEŚCIE, niezależna od samej
   kolejki (np. `City.postepBudynkowUsuniete: Record<buildingId, number>` lub analogiczna
   nazwa — Praca zbankowana dla budynku USUNIĘTEGO z kolejki, indeksowana po `id`
   budynku). Zaprojektuj minimalny, spójny z resztą modelu kształt (Operator decyduje o
   dokładnej nazwie/lokalizacji pola, uzasadnij w raporcie).
2. `dequeue`/`cancelQueueItem` (usunięcie pozycji z kolejki, dowolny index — front LUB
   pozycja oczekująca) — zamiast bezpowrotnie tracić postęp usuwanej pozycji
   (`ProductionItem.postep` dla pozycji oczekujących, `CityProduction.postep` dla
   frontu), ZAPISUJE go do nowej pamięci per-budynek w tym mieście. Jeśli w pamięci już
   istnieje wcześniejszy zapis dla tego samego `id` budynku (np. usuwano go już
   wcześniej, częściowo budowano ponownie, znowu usunięto) — NOWY zapis zastępuje stary
   (nie sumuje się z nim — to jest postęp NAJNOWSZEJ próby budowy tego budynku, nie suma
   wszystkich prób).
3. `enqueue()` (dodanie budynku do kolejki) — SPRAWDZA nową pamięć dla `id` dodawanego
   budynku w tym mieście; jeśli istnieje zapisany postęp, nowa pozycja w kolejce startuje
   z TYM postępem (nie od zera) — postęp jest USUWANY z pamięci w momencie przywrócenia
   (nie duplikowany jednocześnie w pamięci i w kolejce).
4. Migracja zapisu gry (`save.ts`) — nowe pole serializowane/wczytywane poprawnie; STARE
   zapisy (bez tego pola) wczytują się z pustą pamięcią (brak zapisanego postępu dla
   żadnego budynku) — zero crashy na starych savach.
5. Zero zmian w zachowaniu `promoteToFront`/przesuwaniu pozycji W OBRĘBIE kolejki (to już
   działa poprawnie, ma własne testy — `promote-to-front-test.cjs` lub podobny, znajdź
   reconem i NIE reguruj), w naturalnym ukończeniu budynku, ani w koszcie
   surowcowym/zwrocie surowców przy anulowaniu (`cancelQueueItem` zwrot cegły/kamienia
   pozostaje bez zmian — to osobny mechanizm od Pracy).
6. UI: jeśli w kolejce dostępnych budynków (lista do dodania) da się to zrobić bez
   nieproporcjonalnego rozszerzania zakresu, budynek z zapamiętanym postępem powinien to
   sygnalizować graczowi (np. "kontynuuj budowę, X% gotowe" zamiast zwykłego "buduj") —
   to NIE jest twarde kryterium końca (patrz KRYTERIA), ale jeśli trywialne do dodania w
   tej samej rundzie, zrób to; jeśli wymaga istotnego rozszerzenia UI, pomiń i opisz jako
   możliwe rozszerzenie na przyszłość.

KRYTERIA KOŃCA (binarne)
1. Test: budynek budowany do połowy kosztu Pracy → usunięty z kolejki → ponownie dodany
   do kolejki TEGO SAMEGO miasta → startuje z ~połową postępu (nie od zera).
2. Test: budynek usunięty z kolejki, NIGDY nie dodany ponownie, miasto kończy turę
   wielokrotnie — pamięć postępu dla tego budynku NIE znika samoistnie (przetrwa upływ
   czasu, nie tylko jedną turę).
3. Test: budynek dodany do INNEGO miasta niż to, w którym miał zbankowany postęp — NIE
   dziedziczy tamtego postępu (pamięć jest per-miasto, nie globalna dla gracza).
4. Test: stary zapis gry (fixture bez nowego pola) wczytuje się bez błędu, z pustą
   pamięcią postępu.
5. Zero regresji na istniejących testach kolejki produkcji (znajdź reconem, np.
   promote-to-front-test.cjs, production-*-test.cjs, dequeue-*-test.cjs — WSZYSTKIE
   muszą pozostać zielone, zwłaszcza dotyczące `dropFrontItem`/promocji w obrębie
   kolejki, które NIE mają się zmienić).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/production.ts — `dequeue`, `enqueue`, i NOWE funkcje pomocnicze pamięci
  postępu (jeśli potrzebne). NIE dotykać `dropFrontItem`, `promoteToFront`,
  `advanceProduction`, `rushProduction`, `filterQueue`, `sanitizeBuildQueue` poza
  minimalnym podłączeniem nowego mechanizmu, jeśli konieczne — jeśli konieczne, opisz
  dokładnie co i dlaczego w raporcie.
- gra/src/ui/cityPanel.ts — WYŁĄCZNIE `cancelQueueItem` i funkcja dodawania do kolejki
  (jeśli osobna od `enqueue` na poziomie UI).
- gra/src/types/city.ts — nowe pole na `City`.
- gra/src/game/save.ts — serializacja/migracja nowego pola.
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana kosztu
budynków/formuł Pracy, zmiana zwrotu surowców (cegła/kamień) przy anulowaniu, zmiana
logiki jednostek/`rekrutacja` (osobna kolejka, poza zakresem).

IZOLACJA
worktree /home/user/wt-produkcja-postep-pamiec, gałąź
autobot/R-PRODUKCJA-POSTEP-PAMIEC-PO-USUNIECIU-Q1, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-produkcja-postep --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryteriów 1-4 za spełnione bez żywego testu z jawnymi wartościami liczbowymi
Pracy PRZED usunięciem, PO usunięciu (0 w kolejce, wartość w pamięci) i PO ponownym
dodaniu (przywrócona wartość w kolejce, pamięć wyczyszczona) — nie tylko czytanie kodu.
Zakaz uznania testu migracji (kryterium 4) za spełniony bez faktycznego pliku/fixture
reprezentującej stary zapis (sprzed tej zmiany) wczytanego przez prawdziwą ścieżkę
`save.ts` — nie ręcznie skonstruowany obiekt w pamięci testu, który przypadkiem pomija
problem.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora,
ręką orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
