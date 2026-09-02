TEMAT:  P-TECHDISCOVERY-BADGE-DUPLIKAT-NACHODZENIE-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat GRAFICZNY/WIZUALNY (R-PROC-AUTOBOT.md §5a) —
Operator Opus 5 effort=medium / Evaluator Opus 5 effort=high / Final Control
Sonnet 5 effort=high.

## WYZWALACZ
Właściciel, zrzut popupu odkrycia technologii "Rolnictwo": "Trochę
wymagałoby poprawienia rolnictwo, komunikat, kiedy jest jakieś badanie
odkryte. Jest tutaj w wypadku rolnictwo, ukończone badania, ukończona. To
jest powtórzenie. Poza tym tekst nachodzi na grafikę danego badania [...]
rolnictwo, epoka kamień, poziom pierwszy po lewej stronie, po prawej
stronie – ukończone badanie. I nie trzeba drugi raz pisać ukończona, bo to
jest ukończona, ukończono badania."

Dwa zrosnięte zgłoszenia: (1) dwie odznaki obok tytułu mówią to samo
("Ukończono badania" + "Ukończona"); (2) tekst nakłada się na grafikę
diaromy w tym konkretnym, SZERSZYM wariancie karty.

## RECON (wykonany, nie powtarzaj)
Ścieżka renderowania: `techDiscoveryNotice.ts::showTechDiscoveryNoticeViaEntityCard`
(linia 518+) → `buildEntityCardData('technology', ...)` →
`renderEntityCard` (`entityCards/renderer.ts`, wspólny mechanizm, TEN SAM
co reszta kart encji, w tym świeżo zintegrowana diorama pełnej szerokości
z tematu `R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1`).

Źródło duplikatu — `techDiscoveryNotice.ts:526-531,590`:
```
const kick = isPreview ? 'Podgląd technologii'
  : isEraAdvance ? `Awans do epoki ${...}`
  : 'Ukończono badania';               // <- dla zwyklego odkrycia
const statusWord = isPreview ? 'Informacja' : 'Ukończona';  // <- TEZ dla zwyklego odkrycia
...
statusBadges: [kick, statusWord],       // linia 590 — OBIE wartosci jako osobne odznaki
```
Dla `kind==='era'` (awans epoki) i `kind==='preview'` (podgląd) `kick` i
`statusWord` niosą RÓŻNĄ informację (co się stało / jaki to stan) — NIE są
duplikatem, NIE ruszaj tych dwóch gałęzi. Duplikat istnieje WYŁĄCZNIE dla
zwykłego, pojedynczego odkrycia technologii (trzecia gałąź) — `kick`
("Ukończono badania") i `statusWord` ("Ukończona") mówią to samo dwa razy.

Miejsce renderowania odznak: `entityCards/renderer.ts:299-319` —
`titleWrap` (h2 tytułu + `.entity-card-status-badge` per pozycja z
`statusBadges` + podtytuł) jest DZIECKIEM `header` (klasy
`entity-card-header entity-card-diorama`), dołączonym PO `stage` (scena
diaromy: elipsa gruntu + medalion) — czyli tytuł/odznaki/podtytuł żyją
jako WARSTWA TEKSTOWA nad sceną diaromy (overlay), zgodnie z Wariantem A.

KLUCZOWA różnica tego konkretnego wywołania: `techDiscoveryNotice.ts`
NADPISUJE domyślną szerokość karty przez własny
`ensureEntityCardOverrideStyles()` (linia ~716-724):
`.entity-card{width:min(660px,96vw)}` — ZNACZNIE szerzej niż domyślne
`min(434px,calc(100vw-32px))` używane w reszcie gry (panel budowy,
science hub itd.). Diorama (Wariant A) była żywo testowana i zweryfikowana
zrzutami PRZY DOMYŚLNEJ szerokości karty (434px) — NIE przy tym szerszym,
660px wariancie tego konkretnego popupu. Możliwe że przy 660px + dwóch
odznakach + długim tytule/podtytule tekst overlay realnie nachodzi na
grafikę sceny (np. wychodzi poza winietę, koliduje z krawędzią medalionu)
— DO POTWIERDZENIA żywym zrzutem w Kroku 1, nie zakładaj z góry który
dokładnie mechanizm powoduje nachodzenie.

## GOAL
Krok 1 (obowiązkowy PRZED zmianą kodu): żywo zreprodukuj OBA zgłoszone
problemy w headless Chromium NA AKTUALNYM (najnowszym z `origin/main`)
kodzie — (a) zrzut popupu odkrycia zwykłej technologii (np. Rolnictwo,
`kind` inny niż `era`/`preview`) pokazujący dwie odznaki o tej samej
treści; (b) zrzut tego samego popupu pokazujący, czy i jak dokładnie tekst
nachodzi na grafikę diaromy przy szerokości 660px. Jeśli (b) nie
reprodukuje się na aktualnym kodzie — zgłoś to jawnie w raporcie (być może
zrzut właściciela pochodził z przeglądarki sprzed odświeżenia najnowszego
builda) i skup naprawę wyłącznie na (a); NIE wymyślaj sztucznej poprawki
dla niepotwierdzonego problemu.

Krok 2: napraw potwierdzone problemy.
- Duplikat odznak: dla zwykłego odkrycia (NIE era, NIE preview) pokazuj
  JEDNĄ odznakę statusu ukończenia, nie dwie mówiące to samo. Układ ma
  odpowiadać opisowi właściciela: nazwa technologii + "Epoka X · Poziom Y"
  po LEWEJ stronie (bez zmian), pojedyncza odznaka statusu ukończenia po
  PRAWEJ stronie tego samego wiersza. Gałęzie `era`/`preview` (gdzie kick
  i status niosą różną informację) zostają BEZ ZMIAN.
- Nachodzenie tekstu na grafikę (jeśli potwierdzone w Kroku 1): napraw w
  najwęższym możliwym miejscu — preferuj dostrojenie CSS diaromy/overlay
  tak, aby poprawnie mieściła tekst przy WIĘKSZYCH szerokościach karty
  (660px), NIE zmieniaj domyślnej szerokości karty (434px) używanej przez
  resztę gry, NIE zmieniaj mechanizmu diaromy dla innych rodzajów encji
  poza tym co konieczne do naprawy czytelności tekstu.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy zrzut z prawdziwego Chromium (`page.screenshot()`) PRZED poprawką:
   popup odkrycia zwykłej technologii pokazuje DWIE odznaki o tożsamej
   treści ("Ukończono badania" + "Ukończona") — dowód że problem realnie
   istnieje.
2. Żywy zrzut PO poprawce: TA SAMA technologia pokazuje JEDNĄ odznakę
   statusu, tytuł+meta po lewej, odznaka po prawej tego samego wiersza,
   zero duplikatu treści.
3. Gałęzie `era` (awans epoki) i `preview` (podgląd) NIEZMIENIONE — żywy
   zrzut popupu awansu epoki i popupu podglądu pokazujący że nadal mają
   swoje dwie, RÓŻNE odznaki jak dotychczas (zero regresu).
4. Jeśli Krok 1(b) potwierdził nachodzenie tekstu na grafikę: żywy zrzut
   PO poprawce pokazujący że tekst mieści się czytelnie w obrębie diaromy
   przy szerokości 660px, bez nachodzenia na medalion/scenę. Jeśli Krok
   1(b) NIE potwierdził problemu na aktualnym kodzie: kryterium spełnione
   automatycznie, z jawną notatką w raporcie dlaczego (nie reprodukuje się).
5. Domyślna karta encji (434px, reszta gry) i diorama dla pozostałych 4
   rodzajów encji (jednostki/budynki/ulepszenia/cuda) NIEZMIENIONE — żywy
   zrzut jednej innej karty (np. budynku) potwierdzający brak regresu.
6. Diff ograniczony do `techDiscoveryNotice.ts` (+ WYŁĄCZNIE jeśli Krok
   1(b) potwierdzi realną potrzebę, CSS diaromy w `entityCards/renderer.ts`
   ograniczone do dostrojenia czytelności przy większej szerokości, zero
   zmian w mechanizmie/wysokości/kolejności diaromy) + nowy/rozszerzony
   test w `gra/tools/`. Zero zmian w adapterach, `gra/data/**`.
7. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + istniejące testy popupu odkrycia i diaromy
   (`entity-card-diorama-real-render-test.cjs` i testy
   `tech-discovery-notice`/podobne w `gra/tools/`) bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/ui/techDiscoveryNotice.ts`, `gra/src/ui/entityCards/renderer.ts`
(WYŁĄCZNIE CSS diaromy/overlay dla czytelności przy większej szerokości —
zero zmian w markupie/mechanizmie diaromy, zero zmian w kolejności DOM),
nowy/rozszerzony plik testowy w `gra/tools/`. Zakazane bezwzględnie:
adaptery (`unitAdapter.ts`/`buildingAdapter.ts`/`technologyAdapter.ts`/
`improvementAdapter.ts`/`wonderAdapter.ts`), `unitMiniPreview.ts`,
`wikiHubHud.ts`, `gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-TECHDISCOVERY-BADGE-DUPLIKAT-NACHODZENIE-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Temat wizualny/UX — zakaz uznania KTÓREGOKOLWIEK z kryteriów wizualnych za
spełnione bez realnego zrzutu `page.screenshot()` z żywego Chromium. Zakaz
wymyślania poprawki dla problemu (4) bez uprzedniego, żywego potwierdzenia
że on w ogóle występuje na aktualnym kodzie — jeśli się nie reprodukuje,
powiedz to wprost zamiast zmieniać CSS "na wszelki wypadek".

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Opus 5) → Evaluator (Opus 5, zarzuty, lista może być pusta) →
Operator (Obrona, Opus 5, tylko gdy zarzuty niepuste) → Final Control
(Sonnet 5, osobne wywołanie Workflow) → orkiestrator integruje
allowlist-only i cutuje kolejną FALĘ ROBOCZA.
