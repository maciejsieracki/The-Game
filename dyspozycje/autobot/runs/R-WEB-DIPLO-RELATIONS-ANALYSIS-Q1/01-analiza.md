STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RELATIONS-ANALYSIS-Q1
GOAL: Analiza obecnego systemu stosunków między cywilizacjami + propozycja modelu „zaufanie zmienia się co turę”, bez zmian kodu.
ZMIANY/COMMIT: tylko ten dokument (kod i dane bez zmian).
TESTY: nie dotyczy (analiza). Symulacja headless 5 seedów × 80 tur: NIE_ZMIERZONO (brak zainstalowanych zależności w worktree, zakaz `npm run dev`; zamiast tego dowód rachunkowy w §A5).
BLOKADY: brak. Temat `R-WEB-WAR-RULES-MULTIWAR-Q1` nie jest jeszcze w `main` — jego zasady przyjęto z opisu zlecenia (ZAŁOŻENIE Z1).
RUNDY: 1/5
NASTĘPNY KROK: decyzja właściciela w §B6, potem osobny dispatch implementacji (nie ten temat).
DEPLOY/PUSH: NIE WYKONANO

Baza: `origin/main` @ `00fe8dc4`. Skróty plików: `dip.ts` = `gra/src/game/diplomacy.ts`, `ai.ts` = `gra/src/game/ai.ts`, `main.ts` = `gra/src/main.ts`, `dip.json` = `gra/data/diplomacy.json` (sekcja `params`).

# A. Co już jest

## A1. Czy jest liczbowa miara stosunków?

Tak — są **trzy** miary. Ta „co turę” to Zaufanie.

| Miara | Zakres | Gdzie leży | Gdzie czytana |
|---|---|---|---|
| **Zaufanie** (miękka, per para) | 0…100, start 20 | `diplomacyRelations` (mapa „a_b”) `main.ts:8385`; pobór `getDiploRelation` `main.ts:8561`; start `dip.json startZaufanie` | `relationScore` `dip.ts:792`, `relationTier` `dip.ts:1459` |
| **Respekt** (siła, per para) | 0…100, start 30 | to samo; dla pary gracz–AI liczony co turę z potęgi `computeRespekt` `main.ts:34697` | jw. |
| **Relacja** = Zaufanie + Respekt | 0…200 | pole pochodne | progi: Wrogi <30, Neutralny <60, Przyjazny <151, Sojusz ≥151 (`dip.ts:1464-1467`) |
| **Wiarygodność** (globalna, jedna na cywilizację, nie na parę) | −100…+100, start 40/20/0 wg trudności | zdarzenia per owner `main.ts:9753-9780` | `diplomacy-credibility.ts:634` (dryf), `:617` (mnożnik tempa) |

Zaufanie jest więc gotowym „kanałem co turę”. Nie trzeba wymyślać nowej miary — trzeba dopisać brakujące wpływy i **konsekwencję zera**.

## A2. Co zmienia Zaufanie dziś

### Plusy

| Źródło | Efekt | Wartość (`dip.json`) | Częstotliwość | Działa w ticku? |
|---|---|---|---|---|
| Umowa szlaków handlowych | + | `handel_zaufanie_perTura` = **+1** | co turę | tak (`main.ts:34703-34708`) |
| Sojusz | + | `sojusz_zaufanie_perTura` = **+3** | co turę | tak |
| Pakt o nieagresji (NAP) | + | `nap_zaufanie_perTura` = **+2** | co turę | tak |
| Dobra wola po darze (3 tury) | + | `dobra_wola_zaufanie_per_tura` = **+1** | co turę, 3 tury | tak, osobną ścieżką `diplomacy-pn-engine.ts:286` (flaga w ticku zawsze false, `main.ts:34712`) |
| Wspólna religia (ten sam krąg kulturowy) | + | `wspolnaReligia_zaufanie_perTura` = **+0,5** | co turę | tak |
| Dryf od Wiarygodności | + / − | `wiarygodnoscZaufanieDryfNa100` = 0,03 → W=+100: +3, W=−100: −3 | co turę | **tylko para z graczem**, `main.ts:19357` i `:34725` |
| Wspólny wróg | + | `wspolnyWrog_zaufanie_perTura` = **+1** | co turę | **NIE** — flaga na stałe false (`main.ts:19351`, `:34713`) |
| Dar (PN) | + | `pn_na_zaufanie` 100 PN = +1, maks. +5/turę | jednorazowo | tak |
| Zawarcie handlu | + | `handelZawarcie_zaufanie` = **+2** | jednorazowo | tak |
| Pomoc sojusznikowi w wojnie | + | `pomocSojusznikowi_zaufanie` = **+10** | jednorazowo | tak |
| Wspólny wróg — nawiązanie | + | `wspolnyWrogNawiazanie_zaufanie` = **+5** | jednorazowo | brak wywołania w `main.ts` (grep) |
| Pokój z kontaktem | + | `pokoj_zaufanie_perTura` = +1 | — | **wyłączone** — zastąpione dryfem z W (`dip.ts:1702-1705`) |
| Umowa wymiany surowców (cykliczna) | 0 | brak stawki co turę | — | **nie daje nic co turę** (`main.ts:34703` liczy tylko `UmowaSzlakow`) |

### Minusy

| Źródło | Wartość (`dip.json`) | Częstotliwość | Działa w ticku? |
|---|---|---|---|
| Wspólna granica lądowa (oba kraje >2 miasta) | `ekspansjaGranica_zaufanie_perTura` = **−2** | co turę | tak (`dip.ts:1710`, `main.ts:34721`) |
| Odmienna religia | `odmiennaReligia_zaufanie_perTura` = **−0,5** | co turę | **NIE w głównym ticku** — wpisane na stałe `false` (`main.ts:34720`); UI je pokazuje (`main.ts:19348`), więc gracz widzi karę, której nie ma |
| Nieautoryzowany przemarsz | `karaPrzemarszNieautoryzowany_zaufanie_perTura` = **−5** | co turę, póki trwa | tak (`diplomacy-border-march.ts:184`) |
| Urazy historyczne | `urazyHistoryczne_zaufanie_perTura` = −2 | tylko zanik co 20 tur | **pole jest tylko licznikiem**, nie odejmuje nic co turę (`dip.ts:1728-1735`, komentarz `:1682-1684`) |
| Rywalizacja tego samego typu | `rywalizacjaTenSamTyp_zaufanie` = **−20** | jednorazowo, na starcie pary | start (`diplomacy-layers.ts:48`) |
| Różna kultura | `roznicaKulturowa_zaufanie` = **−5** | jednorazowo, na starcie | start |
| Złamany pakt (gracz / AI) | −40 / −20 | jednorazowo | zdarzenie |
| Zdrada, szpieg wykryty | −50 / −15 | jednorazowo | zdarzenie |
| Odmowa trybutu, ultimatum | −10, −5, −10 | jednorazowo | zdarzenie `dip.ts:1000-1010` |
| Wypowiedzenie wojny z casus belli | −10 | jednorazowo | `dip.ts:984-987` |

Dodatkowo mnożnik tempa (`applyWiarygodnoscTempoDoDelty`): suma zmian za turę jest ×1,5…×0,5 zależnie od W — czyli wiarołomny rośnie wolniej, a spada szybciej.

## A3. Czy jest dryf „pogarszanie bez współpracy”?

**Nie.** Jedyny dryf pasywny to dryf od Wiarygodności i jest on **dodatni** dla uczciwego (start Normalny W=20 → +0,6/turę, `dip.ts:1696`). Zatem para, która nic ze sobą nie robi, dziś **powoli się zbliża**, a nie oddala. Jedyny stały minus to wspólna granica (−2) i tylko dla krajów z >2 miastami. Dodatkowo:
- `tickDiplomacy` jest wołany **raz**, tylko dla pary gracz–AI (`main.ts:34727`). Pary **AI↔AI nie mają żadnego ticka** — ich Zaufanie zmienia się wyłącznie zdarzeniami.
- Zaufanie jest obcinane do 0 od dołu (`dip.ts:1750`) i **nic się nie dzieje na zerze**.

## A4. Co powoduje wojnę AI dziś

| Ścieżka | Warunek | Plik:linia |
|---|---|---|
| Ogólna reguła „wrogie nastawienie” | brak wojny, brak NAP i blokady pokoju, `willingnessWar>0`, siła względna `rw ≥ 0,6`, agresja ≥ 0,5, **Relacja < 30**; AI↔AI nie przed turą 25 (nie dotyczy gracza) | `ai.ts:5577-5595`; progi `ai-params.json` `ai_diplomacja_prog_wojna_sila` 0,6, `_agresja` 0,5; `AI_MAJOR_EARLY_NO_WAR_TURNS` = 25 `ai.ts:4844` |
| Wojna wymuszona Kamień | od tury 25, 1 wojna, odpoczynek 20 tur, koniec po 2 zdobytych miastach lub 25 turach | `forced-war-stone.ts` (`WOJNA_KAMIEN_WYMUSZONA_*`) |
| Wojna wymuszona Brąz / Żelazo | 25 tur od wejścia w epokę | `forced-war-bronze.ts:86`, `forced-war-iron.ts:123` |
| Dobór celu wymuszonej wojny | parowanie 1v1, najbliższy niezablokowany (NAP / blokada pokoju / sojusz blokują); gracz jest w puli; strona akcji to zawsze AI | `forced-war-common.ts:228`, `main.ts:34170-34210` |
| Wymuszone wojny „bez wyjątku” | wczesny `return` w `decideAIDiplomacy`, poza regułami ogólnymi | `ai.ts:5262-5370` |
| Obowiązek sojuszniczy | dołącza do wojny sojusznika, jeśli silny i nie w wojnie | `alliance-war-obligation.ts:41` |

Wojny wymuszone są **niezależne od stosunków** — to licznik epoki, nie nastrój. Stosunki wpływają tylko na to, kogo blokują (NAP, sojusz).

## A5. Dlaczego gracz prawie nie dostaje wypowiedzeń

1. **Ogólna reguła jest matematycznie niemożliwa przeciw graczowi.** Warunek `rw ≥ 0,6` oznacza, że AI ma ≥60% łącznej potęgi. Ta sama liczba to Respekt AI wobec gracza (`computeRespekt(potAI, potPlr)` = 100·pot/(pot+pot), `main.ts:34697`, `dip.ts:1594`). Relacja = Zaufanie + Respekt ≥ 0 + 60 = **60, a wymagana jest <30** (`ai.ts:5589`). Reguła nigdy się nie spełni. (Dowód rachunkowy; rozkład w czasie z gry: NIE_ZMIERZONO.)
2. **Dla AI↔AI reguła jest praktycznie martwa.** Respekt pary AI↔AI nie jest nigdzie przeliczany (`computeRespekt` wołany tylko w `main.ts:2536, 2552, 6850, 16122, 20622-20623, 34697` — żadne nie zapisuje do pary AI↔AI), zostaje na starcie 30. Relacja ≥ 0 + 30 = 30, wymagane <30 (jedyny wyjątek to jednorazowe −10 „słabszy militarnie”, `dip.json slabszyMilitarnie_respekt`).
3. **Zaufanie nie ma konsekwencji.** Gdy spada do 0, nic się nie dzieje (A3). Dlatego −2/turę za granicę niczego nie „kończy”.
4. **Wojny wymuszone to jedyna realna droga** — a one są ograniczone: parowanie 1v1 (większość AI zużywa się wzajemnie), pas ochronny NAP/sojusz/blokada pokoju (`main.ts:34195-34198`), brak na poziomie łatwym dla Kamienia (`forcedWarDifficultyLevel !== 1`, `main.ts:34077`), koniec po 2 miastach lub 25 turach, odpoczynek 20 tur. NIE_ZMIERZONO, jak często w praktyce trafia to w gracza (brak symulacji).
5. **Zaufanie z graczem jest dodatkowo podbijane**: dryf +0,6/turę dla uczciwego gracza, NAP +2, handel +1 — a gracz może zawsze kupić spokój. Nic nie ciągnie go w dół poza granicą.

# B. Propozycja — model „co turę”

## B1. Zasada

Zaufanie zostaje jedyną miarą „co turę”. Co turę liczymy **sumę plusów i minusów** dla każdej pary. Bez współpracy suma jest ujemna. Zero Zaufania dłużej niż K tur = **przymus wojny** (z ostrzeżeniem). Wartości poniżej to propozycja startowa na skali 0…100 (parametry do `dip.json`).

## B2. Plusy co turę

| Plus | Hak w kodzie dziś | Wartość /turę | Uwagi |
|---|---|---|---|
| Umowa szlaków | `hasSzlakowTreaty` `diplomacy-treaties.ts:229` | **+1** (jest) | bez zmian |
| Umowa wymiany surowców wykonana w tej turze | `hasWymianaTreaty` `:235`, płatności `diplomacy-economy.ts:78` | **+1** (nowy) | tylko gdy wymiana faktycznie przeszła; brak środków = brak plusa + zerwanie |
| NAP | `resolvePokojTrustTier` `:431` | **+2** (jest) | |
| Sojusz | j.w. | **+3** (jest) | |
| Otwarte granice (przemarsz cywilny) | `RodzajTraktatu.OtwartGranice` `types/diplomacy.ts:21` | **+0,5** (nowy) | tańsza alternatywa dla NAP |
| Prawo przemarszu wojskowego | `PrawoWojskowePrzemarszu` `:22` | **+0,5** (nowy) | |
| Wspólny wróg (obaj w wojnie z tą samą cywilizacją lub aktywna umowa „wspólna walka z barbarzyńcami”) | flaga `wspolnyWrog` istnieje, brak liczenia (`main.ts:34713`); umowa `WspolnaWalkaBarbarzyncy` `types/diplomacy.ts:23`, `diplomacy-barbarian-cooperation.ts` | **+1** (jest w JSON) | trzeba tylko policzyć flagę z relacji wojny |
| Dobra wola po darze | `diplomacy-pn-engine.ts:286` | **+1 × 3 tury** (jest) | |
| Wspólna religia | `main.ts:34706` | **+0,5** (jest) | |
| Dobra reputacja | `diplomacy-credibility.ts:634` | **+0,03 × W** (jest) | rozszerzyć na AI↔AI (średnia W obu stron — ZAŁOŻENIE Z2) |
| Brak incydentów | Wiarygodność P4 (30 tur bez wojny) `main.ts:9811` | wspiera W, bez osobnego plusa | |

Nie dodajemy: ambasad (w grze to tylko etykieta w `wonders.json:50`, brak mechaniki) ani wspólnych cudów (brak relacji tego typu w kodzie). Mogą wejść później jako osobne tematy.

## B3. Minusy co turę

| Minus | Hak w kodzie dziś | Wartość /turę | Uwagi |
|---|---|---|---|
| **Wychładzanie** — brak jakiejkolwiek aktywnej umowy współpracy (szlaki, wymiana, NAP, sojusz, otwarte granice) | nowy; warunek z `activeDeals` | **−0,5** | rdzeń zlecenia: bez współpracy stosunki spadają |
| Wspólna granica lądowa (>2 miasta obie strony) | `ekspansjaGranica_zaufanie_perTura` | **−2** (jest) | NAP (+2) dokładnie ją równoważy — zachowujemy |
| Odmienna religia | `main.ts:34720` | **−0,5** (jest, ale naprawić tick) | naprawa, nie nowość |
| Handel z moim wrogiem (strona A ma umowę szlaków/wymiany z cywilizacją, z którą B jest w wojnie) | nowy; `activeDeals` + relacje wojny | **−1** | |
| Wróg mojego sojusznika (B w wojnie z sojusznikiem A) | `allianceFormalKindBetween` | **−1** | |
| Przewaga armii sąsiada (zagrożenie słabszej strony: `rw` ≥ 0,70) | `objectivePowerByOwner` `main.ts:34697` | **−0,5** (słabsza strona) | tylko dla sąsiadów |
| Zazdrość o ekspansję (sąsiad ma ≥1,5× więcej miast) | `cities.filter` | **−0,5** (słabsza strona) | opcja wariantu pełnego |
| Nieautoryzowany przemarsz | `diplomacy-border-march.ts:184` | **−5** (jest) | bez zmian |
| Urazy historyczne (po złamanej umowie / zdradzie) | pole `urazyHistoryczne` `dip.ts:1728` | **−0,5** do zaniku (pole już jest) | dziś tylko licznik — podpiąć |
| Dryf od Wiarygodności | j.w. | −0,03 × |W| przy W<0 (jest) | |

Zdarzenia jednorazowe (zdrada −50, złamany pakt −40/−20, odmowa trybutu −10) zostają bez zmian.

## B4. Progi poziomów i konsekwencje

Progi na samym Zaufaniu (nie na Relacji, żeby Respekt nie zafałszowywał nastroju; ZAŁOŻENIE Z3).

| Poziom | Zaufanie | Co się dzieje |
|---|---|---|
| Przyjaźń | ≥ 70 | pełne umowy, sojusz możliwy (`progSojuszZaufanie` 91 pozostaje osobną bramką) |
| Życzliwość | 50…69 | bez zmian względem dziś |
| Neutralność | 30…49 | bez zmian |
| **Napięcie** | 15…29 | komunikat dla gracza „stosunki z X się psują”; AI przestaje proponować handel |
| **Wrogość** | 1…14 | komunikat „X może wypowiedzieć wojnę, jeśli nic nie zrobisz”; AI odmawia nowych umów |
| **Kryzys** | 0 | start licznika; po **K = 5 tur** na zerze: przymus wojny |

Przy dojściu do progu:
- Wypowiada **silniejsza** strona (wyższe `rw`; remis: niższe ownerId). Słabsza zamiast tego proponuje trybut / pokój (istniejące `oferuj_trybut_za_pokoj`, `ai.ts:5427`).
- Gracz dostaje ostrzeżenie na **pierwszym** poziomie Napięcie i ponownie 2 tury przed końcem licznika. Wojna wynika z progu, **nie z losowania**.
- Wypowiedzenie z progu liczy się jako casus belli (bez kary Wiarygodności N1 — ostrzeżenie było dane, por. `dip.ts:984-987`).
- Każda umowa współpracy w ciągu licznika (np. NAP +2) podnosi Zaufanie ponad 0 i **kasuje licznik**.

## B5. Współgranie z zasadami wojen (`R-WEB-WAR-RULES-MULTIWAR-Q1`)

Zasady (ZAŁOŻENIE Z1, z opisu zlecenia): brak wojen przed turą 40; Kamień: maks. 1 wojna naraz i 1 wojna epoki na epokę; więcej wojen = obrona.

| Zasada | Jak współgra z modelem |
|---|---|
| Opóźnienie do tury 40 | Zaufanie spada i może leżeć na zerze, ale licznik K startuje najwcześniej w turze 40 − K. Efekt: w t. 40 kilka par może być „gotowych”, a limity niżej rozładowują je po kolei |
| Maks. 1 wojna naraz (Kamień) | Para spełniająca próg czeka w kolejce; kolejność: najdłużej na zerze, potem niższe ownerId |
| 1 wojna epoki na epokę | Wojna z progu **zużywa** ten limit — nie dokładamy drugiej obok wymuszonej |
| Więcej wojen = obrona | Strona atakowana ponad limit nie jest „zmuszona” — zmuszeni są tylko ci, którzy mają wolny slot |
| Wojny wymuszone epoką (Kamień/Brąz/Żelazo) | **Połączyć:** cel wojny wymuszonej = para z najniższym Zaufaniem (zamiast „najbliższy”, `main.ts:34195`, `forced-war-common.ts:228`). Wtedy epoka daje *termin*, a stosunki wybierają *przeciwnika* — jedna spójna opowieść zamiast dwóch niezależnych mechanizmów |

## B6. Warianty (praca / ryzyko)

| Wariant | Zakres | Pliki (szac.) | Ryzyko |
|---|---|---|---|
| **Minimalny** | gracz↔AI: dodać wychładzanie −0,5, naprawić tick (odmienna religia, wspólny wróg), licznik zera K=5, próg → wojna (nowe pole docelowe w `decideAIDiplomacy`), ostrzeżenia w UI | ok. 5–6: `dip.ts`, `dip.json`, `ai.ts`, `main.ts`, `diplomacy-factors.ts`, testy | niskie–średnie; dotyka tylko pary z graczem |
| **Średni** *(rekomendacja)* | minimalny + tick dla **wszystkich** par głównych cywilizacji (AI↔AI), plusy: wymiana, otwarte granice; minusy: handel z wrogiem, wróg sojusznika, urazy; poziomy w UI; zapis/odczyt licznika; łączenie z celem wojny wymuszonej | ok. 10–12 | średnie: AI↔AI zacznie realnie wojować, trzeba przetestować balans i zgodność zapisów |
| **Pełny** | średni + przewaga armii, zazdrość o ekspansję, modulacja osobowością cywilizacji (`perNacja`: `pamietliwosc`, `progWojny`, `lojalnosc` w `dip.json` — czy dziś czytane: NIE_ZMIERZONO), kolumna „co się zmieniło” w dzienniku | ok. 15–20 | wysokie: wiele pokręteł, wymaga kilku iteracji strojenia |

Rekomendacja: **Średni, wdrażany etapami** — najpierw Minimalny jako pilot (jedna para, łatwy test), potem rozszerzenie na AI↔AI.

### Szybki rachunek (Zaufanie start 20, W=20 → plus ×1,1, minus ×0,9; wartości z B2/B3)

| Scenariusz | Suma/turę (surowa → po mnożniku) | Czas do zera |
|---|---|---|
| Sąsiedzi, bez umów | 0,6 − 0,5 − 2 = −1,9 → **−1,7** | ok. 12 tur (+5 = wojna po ok. 17) |
| Sąsiedzi + szlaki | 0,6 + 1 − 2 = −0,4 → −0,36 | ok. 55 tur |
| Sąsiedzi + szlaki + wymiana | +0,6 → +0,66 | rośnie |
| Sąsiedzi + NAP | 0,6 + 2 − 2 = +0,6 → +0,66 | rośnie |
| Nie-sąsiedzi, bez umów | 0,6 − 0,5 = +0,1 → +0,11 | stabilnie |
| Sąsiedzi, bez umów, inna religia, W=−40 | −1,2 − 0,5 − 2 − 0,5 = −4,2 → **−5,0** | ok. 4 tury |
| Sąsiedzi, bez umów, handel z wrogiem | −2,9 → −2,6 | ok. 8 tur |

Wniosek: kraje oddalone żyją w spokoju, sąsiedzi **muszą** coś ze sobą robić (handel, NAP, wymiana), a oszust wchodzi w kryzys kilka razy szybciej.

## B7. Decyzje do właściciela (maks. 3)

1. **Zasięg**: A) tylko gracz↔AI (Minimalny), B) wszystkie pary (Średni, rekomendowane), C) pełny z osobowościami. *Przyjęte jako domyślne: B etapami (najpierw A).*
2. **Co przy zerze**: A) automatyczna wojna po K=5 tur z ostrzeżeniem, B) najpierw ultimatum (gracz wybiera: dar / umowa / trybut), dopiero potem wojna, C) wojna tylko jeśli silniejsza strona ma profil agresywny. *Przyjęte: A dla AI↔AI, B dla pary z graczem.*
3. **Tempo wychładzania sąsiadów bez umów**: A) wolne (ok. 40 tur), B) średnie (ok. 17 tur, jak w rachunku), C) szybkie (ok. 8 tur). *Przyjęte: B.*

## B8. Parametry do JSON (nowe klucze w `dip.json params`)

| Klucz | Wartość startowa |
|---|---|
| `wychladzanieBezWspolpracy_zaufanie_perTura` | −0,5 |
| `wymianaWykonana_zaufanie_perTura` | +1 |
| `otwarteGranice_zaufanie_perTura` | +0,5 |
| `przemarszWojskowy_zaufanie_perTura` | +0,5 |
| `handelZWrogiem_zaufanie_perTura` | −1 |
| `wrogSojusznika_zaufanie_perTura` | −1 |
| `przewagaSasiada_zaufanie_perTura` (próg `rw` 0,70) | −0,5 |
| `zazdroscEkspansji_zaufanie_perTura` (próg ×1,5 miast) | −0,5 |
| `urazy_zaufanie_perTura` (podpięcie pola) | −0,5 |
| `progNapiecie` / `progWrogosc` / `progKryzys` | 29 / 14 / 0 |
| `kryzysTurDoWojny` (K) | 5 |
| `kryzysOstrzezenieTurPrzed` | 2 |
| istniejące bez zmian | `ekspansjaGranica_zaufanie_perTura` −2, `odmiennaReligia` −0,5, `handel` +1, `nap` +2, `sojusz` +3, `wspolnyWrog` +1 |

## B9. Zastrzeżenia i luki (ZAŁOŻENIA)

- Z1: zasady `R-WEB-WAR-RULES-MULTIWAR-Q1` przyjęte z opisu zlecenia; w `origin/main` ich jeszcze nie ma (grep po `MULTIWAR` pusty).
- Z2: dla pary AI↔AI Wiarygodność = średnia obu stron.
- Z3: progi poziomów liczone na Zaufaniu, nie na Relacji.
- Nie zmierzono: faktycznej częstości wypowiedzeń wobec gracza w grze, rozkładu wojen AI↔AI w 80 turach, czy pola `perNacja` są czytane przez silnik. Wnioski A5 pkt 1–2 to dowód rachunkowy z kodu, nie pomiar.
