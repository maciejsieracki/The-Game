# 02 — EVALUATOR (runda 1)

STATUS: **PASS-WITH-NOTES**
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T7`
GOAL: (zgodny z `00-dispatch.md`, §16a.9 — sprawdzone słowo w słowo) audyt Evocati / Triari / Hieros Lochos / Hastati z realnym pomiarem geometrii i widoczności z kamery gry, naprawą defektów, sekcjami ZGODNOŚĆ HISTORYCZNA i testem real-render z dowodem nietautologiczności.

**MODEL WYKONAWCY (wymagane wprost):** **Opus 5, dokładne ID `claude-opus-5[1m]`** — odczytane z opisu środowiska tej sesji, nie z założenia. Dispatch wymaga Opus 5 High dla Evaluatora (§5a, wyjątek graficzny) — model się zgadza; poziomu `effort` narzędzie nie eksponuje (C-061), więc go nie potwierdzam.

**Metoda:** własny worktree `/home/user/wt-eval-ZELAZO-AUDYT-T7` (+ tymczasowy worktree bazy `origin/main`, już usunięty), `node_modules` dowiązane (C-029). Napisałem i uruchomiłem **własne** skrypty pomiarowe (esbuild + Playwright/Chromium, SAT po 15 osiach, licznik pikseli z kamery gry): `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-measure.cjs`, `eval-base.cjs`, `eval-shots.cjs`. Nie oparłem żadnego wniosku na teście Operatora.

---

## ZAKRES — CZYSTY (§16a.1, §16a.6)

`git diff origin/main...origin/autobot/ZELAZO-AUDYT-T7-Q1 --stat` (merge-base = `88b389fb`, §9 poz. 9): 6 plików, wszystkie w allowliście. **`units.ts`, `hastati-falangita.ts`, `gra/data/**` — zero zmian.**

Sprawdzenie byte-level (md5 ciał funkcji main vs T7): `buildTyrskiMiecznik`, `buildGwardiaTyrenska`, `buildThorakites`, `z2Seg`, `z2BuildArm`, `z2MountShield` — **IDENTYCZNE**. `buildFalangita` (T3) w ogóle nietknięty (inny plik, zero zmian). `z2Banner`/`s6Banner`/`s6Core`/`s6BuildArm`/`s6BuildLeg` dostały parametry z **domyślną wartością pustą / `sx = -1`**, więc żaden inny wywołujący nie zmienia wyjścia. `jednostki-p6-super.ts` eksportuje tylko dwie funkcje tematu. Zero sekretów w diffie.

## GRANICE §9 — BEZ NARUSZEŃ

Build wyłącznie binarką `node ./node_modules/vite/bin/vite.js` do katalogu poza repo (C-001); brak `git add -A`; `WERSJE.md` nietknięty; brak deploy/push; zmiana procesu nie jedzie w allowliście.

## POMIAR WŁASNY — POTWIERDZAM KAŻDĄ LICZBĘ OPERATORA

| Twierdzenie | Mój niezależny pomiar |
|---|---|
| 0 nazw mesh / brak `anchors` przed T7 | **POTWIERDZONE**: main = hieros 0/36, evocati 0/36, triari 0/37, hastati 0/92, `anchors=false` we wszystkich |
| A1 drzewce dory w RAMIENIU 0.0253 | **POTWIERDZONE na main** SAT-em po geometriach (Box 0.054×0.1×0.054 ramię × Box 0.021×0.74×0.021 drzewce = **0.0253**); na gałęzi **0.0000** |
| chwyt = wartości rodziny | **POTWIERDZONE**: Falangita 0.0000 / 0.0218 / 0.0335 (ramię/przedramię/pięść) = Hieros po T7 **dokładnie te same** |
| A5 stopa poniżej terenu | **POTWIERDZONE**: main `minY = -0.0030`, gałąź `0.0000` (wszystkie 4 modele) |
| wysokości | **POTWIERDZONE co do cyfry**: hieros 0.7597→0.8097, hastati 0.7870→0.8220, evocati 0.7471 b.z. |
| A3/A4/A6 twarze | **POTWIERDZONE** (moja skala, inna rozdzielczość): evocati oczy 86, hieros oczy 216, hastati oczy+nos 100 / szczęka 716, triari zarost 1173, przy Thorakitesie 30 — wszystkie >0, wszystkie ≥ odniesienia rodziny |
| zero kolizji broni z ciałem / chorągwią | **POTWIERDZONE**: pełne SAT wszystkich par we wszystkich 4 — najgłębsze zachodzenia to wyłącznie warstwy zamierzone (helm/głowa, nagolennik/goleń, pas/tors) i chwyt |
| tarcza DO kamery | **POTWIERDZONE**: hieros −0.603, evocati −0.601, triari −0.606, hastati −0.601 |
| `maxR` pod limitem heksu | **POTWIERDZONE**: triari 0.807, hieros 0.618, thorakites 0.482, hastati 0.422 — wszystkie < 0.866 |

**Weryfikacja w żywej przeglądarce (§5a, obowiązek Evaluatora na Opus 5):** własny zrzut sześciu modeli z kamery gry (azymut 0, elewacja 52°): `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-shots/eval-szesc-modeli-kamera-gry.png`. Hieros/Falanga i Evocati/Hastati są **realnie rozróżnialne okiem**, nie tylko metryką; maczuga Heraklesa i złoty pierścień aspidy czytają się z tej kamery; klęcząca poza Triariego i wystawione pilum Hastatiego są czytelne. Zero błędów konsoli/JS.

**Kontrola metryki odróżnialności:** moja własna, prostsza miara (XOR/OR samych obrysów, bez barwy) daje hieros/falanga 0.219 i evocati/hastati 0.161 — czyli parę rzymską ratuje **kolor** (kolczuga vs czerwona tunika), nie sylwetka. To jest zgodne z metodą Operatora (barwa ≥40/255 wlicza się do miary) i jest uzasadnioną decyzją — gracz widzi kolor. Odnotowuję jawnie, żeby nikt nie czytał 0.603 jako różnicy kształtu.

## TESTY — WŁASNE URUCHOMIENIE (§16a.3)

| Bramka | Mój wynik |
|---|---|
| `tsc --noEmit` (binarka, 5.9.3) | **0 błędów** |
| `vite build` binarką do `/tmp` (C-001) | **czysty**, 848 modułów, exit 0 |
| `zelazo-super-rzym-grecja-real-render-test` (nowy) | **92 pass / 0 fail** |
| `zelazo-srodziemnomorze` (T6) | **83/0** |
| `zelazo-mezopotamia` (T5) | **72/0** |
| `zelazo-falanga` (T3) | **40/0** |
| `zelazo-jezdziec-oszczepami` | **57/0** |
| `zelazo-konnica-asyryjska` | **31/0** |
| `zelazo-celtowie-soldurii-gaesatae` | **42/0** |
| `zelazo-gate-test` | **24/24** |
| logic / tech-tree / research / unit-replace / combat | **213/213, 19/19, 33/33, 13/13, 6/6** |
| `unit-power-test` | 4/2 — **czerwony także na `origin/main`** (uruchomiłem na bazie): nie regresja |

**Nietautologiczność (§16a.8) — sprawdzona, nie przyjęta na słowo.** Uruchomiłem macierz ablacyjną: baza w całości zielona, każda z H1–H16 czerwienieje pod swoją mutacją, każda mutacja = jedno podmienione miejsce w źródle, większość odtwarza dosłowny stan sprzed T7. Kilka mutacji czerwieni dodatkowo asercję sąsiednią (M2→H1+H2, M4→H4+H5, M12/M16→H12+H13, M14→H9+H14) — to nadmiarowość, nie luka: **każda asercja ma własną mutację, która ją zabija**. Dowód jest rzetelny.

**Przepisanie dwóch asercji T6 (R1, K0) — akceptuję.** Sprawdziłem obie: stara `R1` („Triari NIE dostał ani jednej nazwy") stała się fałszywa, bo T7 legalnie nazwał Triariego; nowa wersja jest **ostrzejsza** (wszystkie mesh nazwane `tr-`, żadna z prefiksów T6) i zachowuje pierwotny sens regresyjny. Stara `K0` liczyła wystąpienia frazy `=== 4`; nowa sprawdza obecność sekcji per jednostka T6 z nazwy — odporna na kolejne tematy. Zostawienie świadomie fałszywej asercji byłoby gorsze. Plik jest w allowliście, powód opisany przy samych asercjach.

**Zgodność historyczna — sprawdzona źródłowo, nie przyjęta na wiarę.** Livy VIII.8.10 (`sinistro crure porrecto`, `hastas subrecta cuspide in terra fixas`), VIII.8.11 (`res ad triarios rediit`), Polibiusz VI.21.7-9 (podział po wieku, 600 triariów), VI.23 (pectorale / kolczuga powyżej 10 000 drachm), VI.23.12 (trzy pióra purpurowe albo czarne), VI.23.16 (włócznie zamiast pilum), Pliniusz VII.211 (golibrody z Sycylii, 454 AUC, P. Titinius Mena, drugi Afrykańczyk), Plutarch „Pelopidas" 18/23, Ksenofont VI.4, Appian III.40, Kasjusz Dion XLV.12, Lew z Chaironei / 254 szkielety 1880, Fajum jako jedyne zachowane owalne scutum, stela Marka Celiusza 9 n.e., theta ≠ tebańska episema, tarcza beocka jako konstrukt nowożytny — **wszystko trafne, anachronizmy (falery, helm koryncki, epoka żelaza) nazwane wprost, nie ukryte**. Wszystkie liczby z `units.json` cytowane w komentarzach zweryfikowałem wprost przeciw plikowi (Evocati 9/8/9/6 „Super Brązu", Triari 8/10/8/6 chargeBonus 10, „W zamian za: Włócznik", Hieros 8/8/10/6 Health 170, Hastati Rola „Wręcz" / Atak dystansowy 3 / 2 pociski) — **wszystkie prawdziwe**, łącznie z trafnie odnotowanym rozjazdem danych Evocatiego (Epoka=Żelazo vs „Dostępna w epokach: Brąz").

**Rozstrzygnięcie pytania dispatchu o pozę Hastatiego** (kryterium 7, §10): Operator rozstrzygnął sam, z podstawami w `units.json`, Polibiuszu i konwencji rodziny, i udokumentował w kodzie. **Zgadzam się** — to była decyzja techniczno-artystyczna bez konsekwencji dla mechaniki, nie temat na ABC.

---

## UWAGI — DLACZEGO NIE CZYSTY `PASS` (§3b)

Dispatch mojej roli wprost żąda sprawdzenia, „czy KAŻDE zdanie w nowych komentarzach jest faktycznie prawdziwe — to dwukrotnie zawiodło w T5/T6". Znalazłem siedem miejsc, w których nowo dopisany tekst **nie jest prawdziwy albo nie prowadzi tam, dokąd twierdzi**. Kod jest poprawny; nieprawdziwy jest opis kodu — czyli dokładnie klasa defektu, którą ta seria istnieje po to, żeby likwidować.

| # | Plik:linia | Znalezisko |
|---|---|---|
| **U1** | `jednostki-p6-super.ts:616` | „Chwyt (piesc 0.0335, **przedramie 0.0298**) zostaje" — **zmierzyłem po naprawie 0.0218**. `0.0298` to wartość **sprzed** naprawy. Nagłówek tego samego pliku (linia 66) podaje poprawne `0.0218`. Nieaktualna liczba przeżyła własną poprawkę — ten sam mechanizm, który dał A1 (poprawka T3 nie dotarła do kopii) |
| **U2** | `jednostki-p6-super.ts:703-704` | `helmetKind: 'corinthian-closed'`, **`faceOpen: false`** dla Hieros Lochos — w tym samym commicie, który tę twarz **odsłonił** (oczy włączone, hełm zsunięty, nagłówek i K4 mówią „twarz odsłonięta", asercja H16 mierzy widoczność twarzy; ja zmierzyłem 216 pikseli oczu). Evocati/Triari/Hastati mają poprawnie `montefortino-open`/`true`. Uczciwie: da się to czytać jako cechę TYPU hełmu, nie stanu — ale wtedy jest to co najmniej dwuznaczne w jedynym modelu, w którym T7 tę właściwość celowo zmienił. `anchors` powstały po to, żeby przyszłe testy adresowały model bez wpisanych liczb; fałszywa kotwica jest pułapką na następnego Operatora. Dziś nic tego pola nie czyta, więc **nie jest nośne dla żadnej bramki** |
| **U3** | `jednostki-p6-super.ts:785, 801` | „patrz **K7**" (kolczuga) i „patrz **K8**" (falery) — sekcja Evocatiego ma **K1–K6**. Właściwe adresy to K3 i K4. Dwa odsyłacze donikąd |
| **U4** | `jednostki-p6-super.ts:155` | `S6_CRIMSON // karmazyn (grzebien liniowego hoplity — patrz K4)` — K4 jest o hełmie, o karmazynie mówi K5; a „liniowy hoplita" mieszka w innym pliku i ma własną stałą `NI_CRIMSON`. Do tego stała jest już martwa (patrz U5) |
| **U5** | `jednostki-p6-super.ts:520` | `const mCrest = mat(S6_CRIMSON, …)` — po przejściu grzebienia na purpurę **nieużywane**; `makeMats()` i tak tworzy ten materiał i wpisuje do `userData['mats']` przy **każdym** tokenie Hieros Lochos. `tsconfig.json` nie ma `noUnusedLocals`, więc `tsc` tego nie łapie |
| **U6** | `jednostki-p6-super.ts:572` vs nagłówek | inline „NAPRAWA T7 **(A7)**", ale nagłówek tego pliku numeruje ten sam defekt jako **A4** — a `A4` w nagłówku `jednostki-z2-srodziemne.ts` oznacza **inny** defekt (zarost Triariego). Numeracja jest pół-lokalna, pół-globalna; jeden odsyłacz się nie rozwiązuje, jedna etykieta oznacza dwie rzeczy |
| **U7** | `jednostki-z2-srodziemne.ts:1341+` (K1 Triari) | „Model odwzorowuje to **punkt po punkcie**" — po czym cztery punkty, z których dwa rozjeżdżają się z zacytowaną łaciną: `scuta innixa umeris` (tarcze oparte o **ramię**) vs model trzymający scutum nisko przed korpusem, oraz `hastas … in terra fixas` vs hasta w dłoni. Rozjazd hasty jest uczciwie nazwany pięć punktów dalej (K6); rozjazd tarczy **nie jest nazwany nigdzie**, a „punkt po punkcie" pozostaje nadmiarowym twierdzeniem |
| **U8** (proceduralna) | `01-operator.md`, sekcja TESTY | podane liczby T1–T6 (81/38/70/40/55/29) to przebiegi z `--skip-vite`; pełne uruchomienie daje **83/72/40/57/31/42** (+2 każdy — asercje G1/G2 artefaktu produkcyjnego). Wszystko zielone w obie strony, więc **bez wpływu na wynik**, ale liczba podana bez flagi, przy której powstała, jest w rozumieniu §13a rzędem 5, nie rzędem 1 |

**Klasyfikacja uwag wg §3b: NIE są kosmetyczne.** U1 i U2 to nieprawdziwe twierdzenia **o samym artefakcie**, zapisane w artefakcie, w temacie, którego kryterium 1 i 3 brzmią „dowód pomiaru" i „sekcja historyczna" — a którego cała seria (T5, T6) potykała się dokładnie o to. U3–U7 to spójność dokumentacji dodanej przez ten temat. Dlatego temat **wraca do Operatora na rundę 2, na tym samym ID i tej samej gałęzi** (§3a — precyzyjna poprawka, nie zlecenie od nowa), a nie idzie prosto do Final Control.

**Poprawka do wykonania jest mała i punktowa** — sześć edycji jednolinijkowych plus jedno zdanie:
1. `p6-super.ts:616` → `przedramie 0.0218` (wartość zmierzona po naprawie);
2. `p6-super.ts:703-704` → `faceOpen: true` i `helmetKind` opisujące stan noszenia (np. `'corinthian-tipped-back'`), zgodnie z nagłówkiem, K4 i H16 — **albo** jawny komentarz przy polu, że opisuje typ hełmu, nie stan twarzy;
3. `p6-super.ts:785, 801` → `K3` i `K4`;
4. `p6-super.ts:155` → `K5` (albo usunięcie stałej razem z pkt 5);
5. `p6-super.ts:520` → usunąć martwe `mCrest` (i `S6_CRIMSON`, jeśli zostaje bez użycia);
6. `p6-super.ts:572` → ujednolicić numerację A z nagłówkiem pliku (albo przenumerować nagłówki na jedną, globalną skalę A1–A7);
7. `z2-srodziemne.ts` K1 → wykreślić „punkt po punkcie" albo dopisać jednym zdaniem rozjazd `scuta innixa umeris`.

Po poprawce wystarczy ponowne `tsc`, nowy test tematu i test T6 — reszta bramek nie jest dotykana.

## CZEGO **NIE** ZNALAZŁEM (jawnie, żeby nie było czytane jako przemilczenie)

Zero naruszeń granic §9. Zero regresji w T1–T6 i w pięciu bramkach referencyjnych. Zero wycieku zakresu — funkcje T3/T6 sprawdzone byte-level. Zero kolizji broni/tarczy w czterech modelach. Zero błędów konsoli. Brak trwałego stanu (save/load), brak asymetrii gracz/AI/MP (modele są wspólne, `ownerColor` nadal steruje polem tarczy i płachtą chorągwi we wszystkich czterech), brak ścieżek brzegowych do sprawdzenia — trzy twarde FAIL-e domeny gry **nie dotyczą** tego tematu. Nie nakłada się z drugim aktywnym tematem. `GOAL` w raporcie zgadza się z `00-dispatch.md`. Praca merytoryczna jest wyraźnie ponad poprzeczką serii — Operator znalazł i naprawił defekt (A1), którego dwa wcześniejsze tematy nie zauważyły, obalił dwa fałszywe zdania w nagłówku Hastatiego i **zmierzył pogorszenie własnej naprawy (0.390 → 0.371)** zamiast je przemilczeć.

---

ZMIANY/COMMIT: `54d5cd373793e2fbb9af462a0dc78f72b71ee593`, gałąź `autobot/ZELAZO-AUDYT-T7-Q1`; 6 plików, wszystkie w allowliście; `units.ts` i `gra/data/**` bez zmian — zweryfikowane własnym `git diff` od merge-base.
TESTY: własne uruchomienia — nowy test 92/0; T6 83/0; T5 72/0; T3 40/0; jeździec 57/0; konnica 31/0; celtowie 42/0; gate 24/24; `tsc` 0 błędów; `vite build` (binarka, `/tmp`) czysty; logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6; unit-power 4/2 czerwony także na `origin/main`.
BLOKADY: brak technicznych.
RUNDY: 1/5 (ta runda zamknięta werdyktem; poprawka U1–U8 = runda 2).
NASTĘPNY KROK: **Operator, runda 2** — punktowa poprawka U1–U7 na tym samym ID i tej samej gałęzi, następnie Evaluator (weryfikacja wyłącznie poprawki + `tsc` + test tematu + test T6), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO.

---

**Nota Final Control (dopisana przy uzupełnianiu śladu, nie przez Evaluatora):** ten plik nie istniał w `dyspozycje/autobot/runs/<ID>/` w momencie przejęcia tematu przez Final Control — treść jest dosłownym zapisem raportu przekazanego w dispatchu Final Control. Zobacz `03-final-control.md` §„Luka w śladzie" po pełny opis i klasyfikację tej usterki proceduralnej.
