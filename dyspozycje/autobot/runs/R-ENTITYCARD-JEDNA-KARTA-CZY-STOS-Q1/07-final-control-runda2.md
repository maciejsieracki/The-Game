# R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 — Final Control, runda 2/5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1
GOAL: sufit 2 kart (trzecia zamyka NAJSTARSZĄ), karta B przesunięta tak, że spod niej wystaje
brzeg A, zamknięcie B odsłania A; rozliczenie 29 asercji. Zgodny z ratyfikacją w `00-dispatch.md`
(8 kryteriów) — §16b pkt 1-2 bez zastrzeżeń, ID identyczne w 7 raportach.
MODEL+EFFORT: Sonnet 5, effort high.
ZMIANY/COMMIT: `f24af77b` + `31b1d2aa`, baza `d7819ab7`, HEAD `7d41fd29` (potwierdzone
`git log -1` przed pracą). Diff = 4 pliki kodu/bramek + katalog runu, **wszystkie w allowliście**.
Commit obrony w `renderer.ts` to **wyłącznie komentarz** (10 linii `//`, zero zmiany zachowania) —
sprawdzone `git show`. Granice §9: zero naruszeń, zero sekretów, `git add -A` nieużyte.

TESTY (moje, sekwencyjne, po każdej mutacji drzewo przywrócone — `git status` czysty):
`tsc --noEmit` 0 błędów · `entitycard-sufit-dwoch-kart` **67/67** · single-dialog 25/25 ·
civpedia-caly-wiersz 85/85 · nested-overlay 16/24 (kat. b) · civpedia-karty-nazwa 27/27 ·
improvement-card-callsites 36/36 · unit-info-card-viewport-height 35/35 ·
tech-discovery-card-real-click 12/12 · logic 213/213, tech-tree 19/19, research 33/33,
unit-replace 13/13, combat 6/6.

MOJE MUTACJE I SONDY (własny bundle, żywy Chromium, logika pomiaru niezależna od bramki):
- **Przyciemnienie brzegu A** (`renderer.ts:672` `transparent`→`rgba(0,0,0,.62)`): bramka **przed**
  obroną (`f24af77b`) **64/1** — asercja przechodziła mimo zniknięcia brzegu; **po** obronie
  **65/2**, czerwienieje asercja malowania (`pxWithB [4,6,8]` vs `pxWithoutB [12,16,22]`).
  Naprawa jest nośna, defekt był realny.
- **`dialogStack[0]` → `[length-1]`**: 65/2, czerwienieją dokładnie dwie asercje (K2) —
  trzecia karta jest chroniona.
- **Bramka na bazie `d7819ab7`**: 11 FAIL, exit 1 — czerwona (kryterium 5 spełnione).
- **Sonda `scrollIntoView`** (`nested-overlay:146,213`, dwie linie): **24/24** → kategoria (b)
  udowodniona i słusznie nienaprawiona tutaj. Kategoria (c) = 0 **strukturalnie**: obu plików
  civpedia/nested **nie ma w diffie**, treści oczekiwań nietknięte.
- **Piksel brzegu A** (1280×900, punkt 346,450): z backdropem B `[12,16,22]`, bez niego
  `[12,16,22]` — **identyczny**; tło strony `[4,5,8]` — różny.
- **Trzy gesty, każdy ze świeżego A→B**: Escape, klik w tło (8,450), klik w brzeg A (346,450) —
  **każdy zdejmuje dokładnie jedną kartę i zostawia A**; drugi Escape wychodzi na mapę.
- **A→B→C**: `[unit/falanga, tech/hutnictwo]` → `[tech/hutnictwo, building/odlewnia]` — dokładnie 2,
  wypadła najstarsza.
- **Viewporty** 1920×1080 (dx72), 1280×900 (dx72), 732×520 i 731×520 (dx0), skrajny 420×880 —
  karta wierzchnia w całości w oknie na każdym; próg 732 px potwierdzony.
- **Zrzuty (§9 poz. 6b)**: obejrzane; `04-…-dwie-karty-widoczny-brzeg-A.png` pokazuje **dwie karty
  naraz** z czytelnym, nieprzyciemnionym brzegiem A z lewej i z góry; `…-sufit-trzecia-karta.png`
  pokazuje B+C bez A. Oba **regenerowałem** — md5 bit w bit zgodne z zacommitowanymi.

BLOKADY: brak.
RUNDY: 2/5 (obrona nie jest osobną rundą — §16b pkt 5, licznik niezresetowany).
NASTĘPNY KROK: integracja orkiestratora, potem `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO

## WERDYKTY

**1 → ODDAL.** Sprzeczność była w zleceniu, nie w wytworze (ratyfikacja orkiestratora). Oba zdania
właściciela zweryfikowałem **sam**: brzeg A jest realnie widoczny i nieprzyciemniony (piksel
identyczny z backdropem B i bez niego, różny od tła), a wszystkie trzy gesty zdejmują po jednej
karcie i wracają do A. Interpretacja jest jawnie oznaczona w `renderer.ts:550-558` i w nazwie
asercji — §14 dochowany, nie było cichego wyboru.

**2 → ODDAL.** Zarzut trafny i **naprawiony w tej samej rundzie**, co potwierdziłem powtarzając
mutację: przed obroną 64/1 (asercja „POMIAR WIDOCZNOSCI" mierzyła hit-test, nie malowanie),
po obronie 65/2 dzięki dwóm nowym asercjom pikselowym. Nie ma czego zwracać Operatorowi.

**3 → ODDAL.** Przyjęty i wykonany: `04-operator-runda2.md` 776 → **450 słów** (zmierzone),
treść merytoryczna bez ubytku, wersja pierwotna w Gicie pod `f24af77b`.

Agregat: brak `NAPRAW`, brak `DO DECYZJI CZŁOWIEKA` → **PASS**.

## NOTA DO REJESTRU (nie zmienia agregatu, nie blokuje integracji)

Nowy helper `edgePixel()` (`entitycard-sufit-dwoch-kart-test.cjs:386`) nie ma zabezpieczenia na
przypadek „brak drugiej karty": przy **pełnym** cofnięciu do bazy `page.screenshot` dostaje pusty
`clip` i bramka kończy się stack trace'em po wypisaniu 11 FAIL (exit 1). Czerwoność jest
zachowana, więc kryterium 5 stoi, a realistyczny regres częściowy (`--ec-stack-dx`→0) przechodzi
czysto (59/8). Wart odnotowania, bo przeczy jawnej intencji samej bramki (sentinel `NO_RECT`,
`:67-70`: „ma byc CZYTELNYM wynikiem, nie stack trace'em") i unieważnia liczbę „baza 26/39"
z `04-operator-runda2.md` dla obecnej wersji bramki. Proszę orkiestratora o osobne zgłoszenie —
razem ze zgłoszeniem o `scrollIntoView` w `nested-overlay:146,213`.
