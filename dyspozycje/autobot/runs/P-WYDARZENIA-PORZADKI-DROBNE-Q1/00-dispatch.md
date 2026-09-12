TEMAT:  P-WYDARZENIA-PORZADKI-DROBNE-Q1
RUNDA:  1/5
DATA:   2026-09-12
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Znalezisko Evaluatora (2026-08-22, NIE zgłoszenie właściciela) przy temacie
`R-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1` (zintegrowany, commit `d146c0c6`),
zarejestrowane w `dyspozycje/PYTANIA-OTWARTE.md` (linia 56): dwie drobne,
nieblokujące usterki porządkowe. Final Control potwierdził wtedy: dług
inżynierski bez wpływu na bieżącą rozgrywkę, wystarczy rejestracja jako
drobny temat porządkowy, niska pilność. Osobny recon (2026-09-12) potwierdził
oba dokładne miejsca w aktualnym kodzie (patrz niżej) — nie wymaga ABC.

## GOAL

Naprawić obie drobne usterki, bez zmiany zachowania w żadnym dziś osiągalnym
scenariuszu (obie to zabezpieczenie na przyszłość / sprzątanie pamięci, nie
aktywne bugi w dzisiejszej rozgrywce).

## DOKŁADNE MIEJSCA

**N1 — rozjazd `blocking` vs resolwer linku** (`gra/src/main.ts:22479-22481`):
```ts
getEventLink: (ev) => (ev.blocking === true ? null : sidePanelEventLinkFor(ev.id))
  ?? techDoneEventLinkFor(ev.id)
  ?? cityCaptureEventLinkFor(ev.id),
```
Ternary chroni WYŁĄCZNIE pierwszy człon łańcucha `??`. Gdy `ev.blocking===true`,
wynik `null` i tak „spada" dalej do `techDoneEventLinkFor`/`cityCaptureEventLinkFor`
(`main.ts:21896`, `main.ts:8515`) — te funkcje NIE sprawdzają `ev.blocking`,
tylko czy `id` pasuje do prefiksu `tech-done-`/`capture-`. Dziś nieszkodliwe
(prefiksy zdarzeń blokujących są rozłączne z tymi dwoma), ale to przypadkowe
założenie, nie gwarancja. Naprawa (przenieś nawias tak, by ternary obejmował
CAŁY łańcuch):
```ts
getEventLink: (ev) => ev.blocking === true ? null
  : (sidePanelEventLinkFor(ev.id) ?? techDoneEventLinkFor(ev.id) ?? cityCaptureEventLinkFor(ev.id)),
```

**N2 — brak czyszczenia `tradeRouteEventPlayerCityIds`** (deklaracja
`main.ts:14770`, wpisy `main.ts:15118`/`15168` przez `.set(...)`, hak testowy
`main.ts:23129`) — ZERO `.delete()`/`.clear()` w całym pliku, więc mapa rośnie
bez ograniczeń przez całą (bardzo długą) rozgrywkę. Analogiczne mapy tego
samego mechanizmu SĄ czyszczone co turę: `main.ts:30405-30414` zeruje
`villageEventLog`/`tradeRouteEventLog`/`borderMarchEventLog` ORAZ
`borderMarchEventTargets.clear()` — z komentarzem „Mapa celów kamery nie musi
przetrwać między turami — wpis i tak powstaje na nowo co turę". Ten sam
warunek spełnia `tradeRouteEventPlayerCityIds` (wpis odtwarza się co turę
razem z `tradeRouteEventLog`), ale brakuje analogicznej linii. Naprawa:
dodać `tradeRouteEventPlayerCityIds.clear();` obok
`borderMarchEventTargets.clear();` w `main.ts:30414` ORAZ w analogicznym
bloku resetu ok. `main.ts:10980-10991` (drugie miejsce, gdzie sąsiednie logi
są zerowane — sprawdź czy to reset nowej gry/save-load, jeśli tak to również
tam potrzebne). Sprawdź samodzielnie AKTUALNE numery linii — main.ts mógł się
przesunąć od czasu tego reconu (2026-09-12).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. `getEventLink` w `main.ts` ma ternary obejmujący cały łańcuch `??` — dla
   `ev.blocking===true` wynik jest ZAWSZE `null`, niezależnie od tego czy
   `techDoneEventLinkFor`/`cityCaptureEventLinkFor` zwróciłyby coś dla tego id.
2. `tradeRouteEventPlayerCityIds` jest czyszczona (`.clear()`) w KAŻDYM
   miejscu, gdzie analogiczne mapy tego samego mechanizmu (`borderMarchEventTargets`
   i podobne) są już czyszczone — potwierdź że nie pominąłeś żadnego z tych miejsc.
3. Zero regresu istniejącego zachowania: karty zdarzeń blokujących nadal
   pokazują przycisk „Otwórz →" tam gdzie powinny (mechanizm ten NIE korzysta
   z resolwera linku z N1 — to inny, osobny kod), karty handlowe
   (`trade-new-`/`trade-lost-`) nadal poprawnie linkują/dismissują się w
   ramach TEJ SAMEJ tury.
4. `tsc --noEmit` 0 błędów.
5. 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) bez regresu.
6. Istniejące testy zdarzeń side-panelu (`side-panel-event-link-test.cjs`,
   `sidepanel-event-przekierowania-real-render-test.cjs`) bez regresu —
   rozszerz `side-panel-event-link-test.cjs` o asercję wprost dla N1
   (zdarzenie blokujące z id pasującym literalnie do prefiksu `tech-done-`
   lub `capture-` — sztuczny/syntetyczny przypadek — NIE dostaje linku).

## DOWÓD

Log rozszerzonej bramki `side-panel-event-link-test.cjs` (nowa asercja N1
zielona) + krótki, headless test/log potwierdzający że po symulacji kilku
tur handlowych `tradeRouteEventPlayerCityIds.size` wraca do 0 (albo do
rozmiaru odpowiadającego TYLKO bieżącej turze) po każdym końcu tury, zamiast
rosnąć monotonicznie.

## Allowlista

- `gra/src/main.ts` (WYŁĄCZNIE linia `getEventLink` ok. 22479-22481 + dodanie
  `tradeRouteEventPlayerCityIds.clear()` w miejscach resetu per-tura,
  analogicznie do `borderMarchEventTargets.clear()` — ŻADNYCH innych zmian)
- `gra/tools/side-panel-event-link-test.cjs` (rozszerzenie o asercję N1)

Zakazane: `gra/data/*.json`, `gra/src/ui/entityCards/*`, pliki z sekretami,
`docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-wydarzenia-porzadki-drobne`, gałąź
`autobot/P-WYDARZENIA-PORZADKI-DROBNE-Q1`, baza `origin/main`. C-001: zakaz
`npm run build`/`dev` w `gra/`; dozwolona wyłącznie `node
./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo>
--emptyOutDir` oraz `node ./node_modules/typescript/bin/tsc --noEmit`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 350 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.
