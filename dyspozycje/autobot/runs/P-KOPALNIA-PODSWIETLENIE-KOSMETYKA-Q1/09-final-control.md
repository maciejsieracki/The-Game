# 09 — Final Control, runda 1

STATUS: PASS
DOMAIN: GAME
TEMAT: P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: zamknąć N3/N5/N6 i rozstrzygnąć N2 pomiarem, nie opinią.

Guard §2b: HEAD `94756363`, drzewo czyste przed i po. `git merge-base --is-ancestor
ee1f6756 HEAD` → YES (baza dispatchu jest przodkiem, nie równa się HEAD — łańcuch
`ee1f6756` → `dd0a4c85` → `c86c9d73` → `94756363`, trzy fazy tej samej rundy).
`git merge-base --is-ancestor ac09c091 HEAD` → YES, potwierdzone samodzielnie.
Wszystkie liczby niżej pochodzą z **moich** uruchomień; raporty traktowałem jako hipotezę.

## Odpowiedzi na pytania wspólne

**A. Czy jakakolwiek asercja została osłabiona?** NIE. `git diff ee1f6756..HEAD -- gra/`
to **wyłącznie `rangeOverlay.ts`**, a po odfiltrowaniu linii komentarza (`^[+-]\s*\*`)
diff ma **0 linii** — zmiana jest w 100 % komentarzowa, żaden plik bramki nie tknięty.
Licznik `ok(` w `kopalnia-podswietlenie-heksow-test.cjs`: baza **62**, HEAD **62**
(historycznie `b0f9bcb9` 57 → `ac09c091` 62). Runtime **76/0** po obu stronach.

**B. Czy zakres wyciekł poza allowlistę?** NIE. `git diff ee1f6756..HEAD --stat` = 9 plików:
8 w `dyspozycje/autobot/runs/P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1/` (allowlista poz. 4)
i `gra/src/render/rangeOverlay.ts` (poz. 1). Zero plików z poz. 2/3, zero sekretów,
`main.ts` i `test.cjs` NIETKNIĘTE. C-001 nienaruszony (jedyna kompilacja: `tsc --noEmit`).

**C. `tsc` i pięć bramek referencyjnych** — uruchomione przeze mnie, z `gra/`:
`tsc --noEmit` (5.9.3) **0 błędów** · logic **213/213** · tech-tree **19/19** ·
research **33/33** · unit-replace **13/13** · combat **6/6**.

**D. Czerwone bramki w rodzinie tematu?** BRAK. Uruchomiłem wszystkie bramki dotykające
`rangeOverlay.ts`/warstwy kopalni: kopalnia-podswietlenie-heksow **76/0**,
granice-relacja-dyplomatyczna **52/0**, granice-styk-nakladanie **57/0**,
mgla-sciezka-inwariant **42/42**. Nie ma czerwieni do usprawiedliwiania.

## Pięć+ WŁASNYCH mutacji (inne niż w raportach), każda cofnięta KOPIĄ pliku

| # | mutacja | bramka |
|---|---|---|
| W1 | `HUG_RELIEF_RADIUS_FRAC` 0,97 → 0,60 | **76/0 (ZIELONA)** |
| W2 | `polygonOffset: true` → `false` w materiale płachty (`rangeOverlay.ts:423`) | 75/1 |
| W3 | `mesh.renderOrder = HUG_RELIEF_TINT_ORDER` → `3` (`:429`) | 75/1 |
| W4 | `MINE_ELIGIBLE_STYLE.yOffset` 0,06 → 0,5 (`:482`) | **76/0 (ZIELONA)** |
| W5 | `MINE_ELIGIBLE_TINT_COLOR` 0x66ccff → 0xff0000 (`:474`) | 73/3 |
| W6 | `main.ts`: import nazwany → `import * as ROV` + `const MINE_ELIGIBLE_STYLE = ROV.…` | 75/1 |
| W7 | `main.ts:33333`: `clearMineEligibleOverlay()` → `mineEligibleGroup = null` | 75/1 |
| W8 | kontrola negatywna: podmiana liczb w komentarzu N6 | 76/0 (zgodnie z oczekiwaniem) |

Po każdej: `cp <kopia spoza repo> <plik>` + `git diff --quiet` → **czysty**, 8/8.
Drzewo na koniec: `git status --short` puste.

## Pytania specyficzne

**Zrzuty (§9 poz. 6b) — obejrzałem wszystkie trzy i przebiegłem harness sam**
(kopia poza repo, `OUT_DIR` w scratchpadzie). Trzy PNG odtworzone **bit-identycznie**
(md5 `f9f694e4…`, `208da7d1…`, `4004f5f2…`) i liczby co do piksela: PRZED 37 096 px
warstwy / **1 084 z 5 158 (21,0 %) na modelu jednostki** / **5 617 z 34 892 (16,1 %)
na górze-przesłonie**; PO 44 291 px / **0** / **0**; widoczność **119 %**.
Obraz zgadza się z opisem: w PRZED płaski krążek maluje przez sylwetki gór
niepodświetlonego heksa i przez bryłę jednostki, w PO płachta obleka relief, a przesłona
i jednostka są nietknięte. `n2-scena-bez-warstwy.png` pokazuje dziś oświetloną scenę
referencyjną (nie maski ID) — zarzut 1 faktycznie naprawiony w kodzie harnessu, nie tylko
w opisie. Rekonstrukcja PRZED **nie jest chochołem**: `depthTest=false` na wszystkich
materiałach + renderOrder 8/9 to 1:1 historyczne `applyAlwaysOnTop` z `b0f9bcb9:248`
(`ALWAYS_ON_TOP_TINT_ORDER = 8`, `..._BORDER_ORDER = 9`). Harness jedzie na SwiftShader
(software WebGL w żywym Chromium) — semantyka testu głębi identyczna, dowód ważny.

**N5 — NAPRAWIONA, nie skasowana.** Liczba asercji nie spadła (62/62 statycznie, 76/0
runtime). Odtworzyłem obie wersje asercji w pamięci i skonfrontowałem z dwiema mutacjami:

| stan `main.ts` | stara `/…,?\n/ \|\| /…/` | nowa (HEAD) | wystąpień identyfikatora |
|---|---|---|---|
| oryginał | ZIELONA | ZIELONA | 3 |
| W6 (namespace-alias) | **ZIELONA** | **CZERWONA** | 4 |
| W6b (usunięty sam specyfikator) | **ZIELONA** | **CZERWONA** | 2 |

Stara alternatywa była tautologią (drugi człon pochłania pierwszy) i przeżyłaby obie
mutacje; nowa czerwieni się na obu. Linia 277 nie zawiera już żadnej asercji.

**N6 — przeliczyłem SAM, metodą inną niż w dowodach** (całkowanie pola po siatce
1440 kierunków × 800 promieni, bez założenia symetrii radialnej; osobno krążek kołowy
i realny SZEŚCIOKĄT `CylinderGeometry(…,6)`):

- promień przesłaniania: **Wzgórze 0,777–0,916·R**, **Góra 0,712–0,818·R**
- szerokość pierścienia **0,054–0,258·R**, pierścień (przy symetrii) **10,8–46,1 % pola**
- realnie widoczne pole (całka, bez symetrii): **40,8–65,8 %** koła / **27,9–58,6 %** sześciokąta

Komentarz na HEAD mówi 0,78–0,92·R / 0,71–0,82·R / 0,06–0,26·R / 11–46 % — **zgadza się
z moim pomiarem co do zaokrągleń**, a jego teza („krążek NIE znikał w całości, dla Góry
odsłonięta część sięga niemal połowy pola") jest po mojej stronie **zaniżona**, nie
zawyżona. Kryterium 3 spełnione. Potwierdzam też korektę bracketu z dispatchu: 0,87–0,92·R
to stałe footprintu, nie promień przesłaniania.

**„Czy N5/N9 zostały świadomie NIETKNIĘTE, zgodnie z GOAL 4?"** — pytanie nie ma
odniesienia w tym temacie i odpowiadam na nie dowodem, a nie domysłem: w dispatchu i we
wszystkich raportach **nie istnieje żadne N9** (grep: zero trafień w plikach tekstowych),
a GOAL poz. 4 to *dwa zrzuty z żywego Chromium*, nie „nie ruszaj N5/N9". N5 miał być
**naprawiony** (kryterium 2) i został — patrz wyżej. Traktuję to jako pozostałość szablonu
promptu z innego tematu; nie wnosi zarzutu.

## WERDYKTY

| # | Zarzut | Werdykt | Podstawa (z wytworu, sprawdzona przeze mnie) |
|---|---|---|---|
| 1 | `n2-scena-bez-warstwy.png` pokazywał maski ID, nie scenę referencyjną | **ODDAL** | render bezwarunkowy w `n2-depthtest-chromium.cjs:235`; przegenerowany PNG obejrzany i odtworzony bit-identycznie; dwa nośne zrzuty niezmienione |
| 2 | Komentarz N6 „jedynie wąski pierścień" niezgodny z arytmetyką dla Góry | **ODDAL** | `rangeOverlay.ts:458-466` przepisany na liczby; mój niezależny pomiar potwierdza je i pokazuje, że nowa treść zaniża, nie zawyża |
| 3 | „w `gra/src/render/` nie ma już `depthTest:false`" — nieprawda | **ODDAL** | zdanie zawężone + ERRATA R1-Z3; mój `grep`: 15 trafień, **13 realnych przypisań w 8 plikach**, w `rangeOverlay.ts` **0** (3 wzmianki w prozie) — dokładnie jak w poprawionym tekście |

Znaleziska własne: **żadne nie jest NAPRAW**. Cztery noty kosmetyczne niżej.

**Agregat: brak `NAPRAW`, brak `DO DECYZJI CZŁOWIEKA` → `PASS`.**

O `DECISION_REQUIRED` z raportów 01/03 (konflikt C-054): nie podtrzymuję. Wszystkie
**siedem binarnych kryteriów końca** dispatchu jest spełnionych na HEAD i zmierzonych
przeze mnie, a decyzja właściciela o wariancie N2 = C zapadła 2026-08-18 i jest wdrożona
(REJESTR wiersz „ZDEPLOYOWANE FALA 296"). Nie zostaje żadna otwarta kwestia zakresu,
balansu, kosztu ani wyglądu — czyli nic z kolumny „właściciel" w §10. Zamknięcie tematu
jako zrealizowanego przed dispatchem to decyzja **orkiestratora**, który informuje.

## NOTY (§16b pkt 4 — do ZAREJESTROWANIA przy integracji, nie do zostawienia w raporcie)

1. **Luka w pokryciu bramki.** `HUG_RELIEF_RADIUS_FRAC` (0,97) i `MINE_ELIGIBLE_STYLE.yOffset`
   (0,06) — obie liczby cytowane wprost w komentarzu N6 — nie mają asercji: mutacje W1 i W4
   zostawiają bramkę **76/0**. Zmiana którejkolwiek cicho unieważnia świeżo poprawiony komentarz.
2. **`WZGORZE_FOOTPRINT_R` zaniżony.** `teren-gory-wzgorza.ts:93` deklaruje 0,92 jako „maks.
   promień podstawy"; mój raycast: wariant 1 sięga **0,963·HEX_R** (Góra 0,87 vs zmierzone
   0,849 — bezpiecznie zawyżona). Obie stałe są **martwe** (zero użyć w `gra/src` i `gra/tools`),
   więc to defekt dokumentacyjny, nie rozgrywkowy. Poza allowlistą — nie ruszałem.
3. **Rejestr nie odzwierciedla stanu (§16b pkt 6).** `dyspozycje/PYTANIA-OTWARTE.md:31605`
   trzyma N2/N3/N5/N6 jako `STATUS: OTWARTE`, choć `ac09c091` zamknął je 2026-08-18.
   Plik jest poza allowlistą tematu — to krok integracji orkiestratora.
4. **Redakcyjne w raporcie 01.** Wiersz N5 mówi „linia 277 to dziś asercja `renderOrder === 3`";
   linia 277 jest **pusta**, ta asercja stoi w 273. Teza operacyjna (brak tautologii w 277)
   pozostaje prawdziwa — do poprawy jednym słowem przy integracji.

## ZMIANY/COMMIT

Wyłącznie ten raport (allowlista poz. 4). Zero zmian w `gra/`. Osiem mutacji weryfikacyjnych
cofniętych KOPIĄ pliku spoza repo, `git diff --quiet` czysty po każdej. `git add` po jawnej
ścieżce, bez `git add -A`.

## TESTY

`tsc --noEmit` 0 błędów · kopalnia-podswietlenie-heksow **76/0** · logic 213/213 ·
tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6 ·
granice-relacja-dyplomatyczna 52/0 · granice-styk-nakladanie 57/0 · mgla-sciezka-inwariant 42/42 ·
`n2-depthtest-chromium.cjs` (kopia, OUT_DIR poza repo) PRZED 37 096/1 084/5 617,
PO 44 291/0/0, widoczność 119 %, trzy PNG bit-identyczne z wersjonowanymi ·
własny pomiar N6 (metoda całkowania pola) — zgodny z komentarzem na HEAD.

## BLOKADY

Brak.

## RUNDY

1/5 (Operator → Evaluator → Obrona → Final Control; Obrona NIE jest osobną rundą, licznik
nie został zresetowany — §16b pkt 5).

## NASTĘPNY KROK

Integracja orkiestratora: `gra/src/render/rangeOverlay.ts` (zmiana wyłącznie komentarzowa)
+ artefakty runu, allowlist-only per plik. Warunek integracji: zarejestrowanie czterech NOT
wyżej (poz. 1–2 jako nowe tematy, poz. 3–4 jako korekta przy integracji). Dopiero po tym
`READY_FOR_DEPLOY` — wystawia je orkiestrator, nie ta rola.

DEPLOY/PUSH: NIE WYKONANO
