TEMAT:  R-DYPLO-MAPA-ODKRYCIE-PRZY-TRAKTACIE-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel: "Przy nawiązaniu umowy handlowej mapy obu cywilizacji powinny
być wzajemnie odkryte. To samo w wypadku zobowiązania sojuszu czy paktu o
nieagresję." ECHO (AskUserQuestion, 2026-09-02): odkrycie ma być
JEDNORAZOWYM zrzutem w chwili podpisania traktatu, nie ciągłym dzieleniem
widoczności przez cały czas trwania traktatu.

To jest CZĘŚĆ 1 z 2 zgłoszonej funkcji (część 2 — możliwość kupna/wymiany
mapy jako osobna oferta handlowa — to OSOBNY, następny temat,
`R-DYPLO-MAPA-WYMIANA-KUPNO-Q1`, dispatchowany PO integracji tego, bo oba
dotykają sąsiadujących fragmentów `main.ts` wokół obsługi ofert
dyplomatycznych — sekwencyjnie, nie równolegle, zgodnie z
R-PROC-AUTOBOT.md §2b).

## RECON (wykonany, nie powtarzaj)
**Kluczowe architektoniczne ograniczenie:** WYŁĄCZNIE gracz (`ownerId===0`)
ma trwały, zapamiętywany zbiór odkrytych heksów: `const explored = new
Set<string>()` (`main.ts:9077`). Cywilizacje AI NIE przechowują żadnego
odpowiednika mgły wojny — ich cele liczone są na bieżąco z żywej
widoczności (`game/ai-fog.ts`, `visibleHexes`) i osobnej pamięci ostatniej
znanej pozycji (`AiTargetMemoryByOwner`), nie z zapamiętanego zbioru.
**Wniosek, POTWIERDZONY przez właściciela:** "wzajemne odkrycie" w praktyce
sprowadza się do JEDNOKIERUNKOWEGO efektu — odkrycia terytorium DANEJ
CYWILIZACJI na mapie GRACZA. Odwrotny kierunek (AI trwale "widzi" mapę
gracza) nie ma dziś czego przechowywać i jest ŚWIADOMIE POZA ZAKRESEM tego
tematu (wymagałby zbudowania od zera całego systemu mgły dla AI — osobny,
znacznie większy temat, NIE dispatchuj go tutaj).

Mutator zbioru: `addExplored(explored, visible)` (`game/visibility.ts:
155-159`, zwykła pętla `Set.add`). Odczyt do renderu:
`exploredSetForRender`/`fogExploredForRender` (`visibility.ts:206-215`,
`main.ts:9123-9126`) — czysto odczytowy, per-klatka, więc scalenie nowych
heksów do `explored` automatycznie odzwierciedli się na mapie bez zmian w
renderze. Zapis/odczyt sejwu: `main.ts:25475`, `31872-31873`,
`32750-32751` — istniejący mechanizm serializacji `Set<string>`, NIE
wymaga zmian (nowo dodane heksy trafiają do tego samego zbioru, ten sam
format).

Punkt zaczepienia — JEDYNE miejsce ustanawiania traktatu w silniku:
`applyProposalOutcome` (`main.ts:17902+`), konkretnie
`main.ts:17956-17958`: `if (result.deal) { activeDeals =
applyAcceptedProposal(activeDeals, result); syncRelationFromDeals(...);
... }`. Tu (albo bezpośrednio po) należy dopiąć nową logikę: gdy
`result.deal.rodzaj` to jeden z: `PaktNieagresji`, `SojuszDefensywny`,
`SojuszPelny` (NIE `SojuszWojskowy` — to legacy alias mapowany na
`SojuszPelny`, sprawdź realne mapowanie), `UmowaSzlakow`, `UmowaWymiany`
(NIE legacy `UmowaHandlowa` samo w sobie, chyba że recon w trakcie
implementacji pokaże że to wciąż żywa wartość — sprawdź realny kod, nie
zgaduj) — I gracz (`ownerId===0`) jest jedną ze stron tego konkretnego
traktatu — jednorazowo scal do `explored` żywo policzoną migawkę
widoczności/terytorium DRUGIEJ strony (miasta + jednostki tej cywilizacji
+ ich bieżący zasięg widzenia, obliczone istniejącymi funkcjami
`computeVisibleAt`/`computeVisible` z `game/visibility.ts` — NIE
wymyślaj nowej metody liczenia widoczności, użyj istniejącej).

Pełna lista `RodzajTraktatu` (`types/diplomacy.ts:16-29`): PaktNieagresji,
SojuszWojskowy, SojuszDefensywny, SojuszPelny, OtwartGranice,
PrawoWojskowePrzemarszu, WspolnaWalkaBarbarzyncy, UmowaHandlowa (legacy),
UmowaSzlakow, UmowaWymiany, Wasalizacja, Rozejm. Dotyczą tego tematu
WYŁĄCZNIE: PaktNieagresji, sojusz (dowolna forma), UmowaSzlakow/
UmowaWymiany (handel) — zgodnie z dosłownym zgłoszeniem właściciela
("umowa handlowa... sojuszu... paktu o nieagresję"). Pozostałe rodzaje
(OtwartGranice, PrawoWojskowePrzemarszu, WspolnaWalkaBarbarzyncy,
Wasalizacja, Rozejm) NIE wywołują tego efektu — świadomie poza zakresem.

Zdarzenie musi być IDEMPOTENTNE — `Set.add` na już obecnym heksie to no-op,
więc wielokrotne podpisywanie różnych traktatów z tą samą cywilizacją nie
psuje niczego, ale NIE twórz sztucznej blokady "tylko raz" — niech
mechanizm scala migawkę przy KAŻDYM nowym ustanowieniu kwalifikującego się
traktatu (naturalnie odzwierciedli to, że dana cywilizacja mogła
eksplorować więcej terenu od czasu poprzedniego traktatu).

## GOAL
Przy ustanowieniu (nie: przy samej PROPOZYCJI, dopiero po REALNYM
zaakceptowaniu/finalizacji) traktatu typu pakt nieagresji, sojusz
(dowolna forma) lub umowa handlowa (szlaków/wymiany) MIĘDZY GRACZEM A
CYWILIZACJĄ AI: jednorazowo scal do `explored` (main.ts:9077) żywo
policzoną migawkę widoczności terytorium tej cywilizacji AI (miasta +
jednostki + ich bieżący zasięg widzenia) w chwili podpisania. Traktaty
AI↔AI (bez udziału gracza) NIE wywołują żadnego efektu (gracz nie ma w
nich strony). Traktaty innych rodzajów (OtwartGranice itd.) NIE wywołują
tego efektu. Zero zmian w silniku widoczności AI (AI nie zyskuje żadnej
nowej trwałej pamięci mapy gracza — poza zakresem, patrz RECON).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy dowód w headless Chromium: skonstruuj stan gry gdzie gracz NIE ma
   odkrytego terytorium sąsiedniej cywilizacji AI (realny, niewielki zbiór
   `explored` bez tamtych heksów), zaproponuj i sfinalizuj pakt
   nieagresji z tą cywilizacją (przez realny UI dyplomacji, nie hak
   testowy podmieniający stan) — `explored` PO fakcie zawiera nowe heksy
   pokrywające miasta/terytorium tej cywilizacji, mapa faktycznie
   pokazuje odkryty obszar (nie tylko zbiór w pamięci — realny rendering).
2. Ten sam żywy dowód dla sojuszu i dla umowy handlowej (osobno lub w
   jednym scenariuszu z kolejnymi traktatami) — działa dla wszystkich
   trzech rodzajów z zakresu.
3. Żywy dowód KONTRPRZYKŁADU: traktat spoza zakresu (np. otwarte granice
   samo w sobie, bez żadnego z trzech powyższych) NIE powoduje odkrycia
   mapy — `explored` niezmienione poza tym co traktat rzeczywiście
   spowodował.
4. Żywy dowód że traktat AI↔AI (bez gracza) nie wywołuje żadnego efektu na
   `explored` gracza (bo gracz nie jest stroną) — zero regresu/efektu
   ubocznego na resztę silnika AI↔AI.
5. Zapis/wczytanie gry po odkryciu: nowo odkryte heksy przetrwają
   save/load (istniejący mechanizm serializacji `explored`, sprawdź że
   nic nie trzeba w nim zmieniać — jeśli jednak coś wymaga zmiany, opisz
   dlaczego, to nie powinno być konieczne wg reconu).
6. Diff ograniczony do miejsca ustanawiania traktatu w `main.ts`
   (`applyProposalOutcome` i bezpośrednio powiązany kod) + ewentualnie
   nowa, mała funkcja pomocnicza w `game/visibility.ts` REUŻYWAJĄCA
   istniejące `computeVisibleAt`/`computeVisible` (zero nowej logiki
   liczenia widoczności od zera) + nowy test w `gra/tools/`.
7. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + istniejące testy dyplomacji (diplomacy-proposal/bilans-unifikacja/
   fairness-gate itd.) bez regresu + nowy test pokrywający kryteria 1-4.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (WYŁĄCZNIE okolice `applyProposalOutcome`/ustanawiania
traktatu — punktowa zmiana, nie refaktoryzacja), `gra/src/game/
visibility.ts` (WYŁĄCZNIE jeśli potrzebna mała funkcja pomocnicza
reużywająca istniejące `computeVisibleAt`/`computeVisible` — zero zmian w
istniejących funkcjach), nowy plik testowy w `gra/tools/`. Zakazane
bezwzględnie: `game/ai-fog.ts` (pamięć celów AI — poza zakresem),
`diplomacy-proposals.ts`/`diplomacy-treaties.ts` (logika akceptacji/
warunków traktatu — zero zmian, ten temat WYŁĄCZNIE dokłada efekt UBOCZNY
po already-zaakceptowanym traktacie, nie zmienia warunków akceptacji),
`diplomacyTradeBasket.ts`/`diplomacy-value-catalog.ts` (część 2, osobny
temat), `gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-DYPLO-MAPA-ODKRYCIE-PRZY-TRAKTACIE-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`,
`gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1-2 za spełnione bez realnego, żywego scenariusza
zawarcia traktatu PRZEZ UI dyplomacji (nie przez bezpośrednie wstrzyknięcie
stanu) i pokazania realnego wzrostu `explored` ORAZ realnego renderu mapy.
Zakaz zmiany warunków/progów akceptacji traktatu (to złamałoby
niepowiązane mechanizmy dyplomacji) — ten temat WYŁĄCZNIE dokłada efekt
uboczny PO already ustalonym wyniku negocjacji.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
