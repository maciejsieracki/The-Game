# DECYZJE — model budynków, 2026-07-25

Scalenie decyzji podjętych dziś w rozmowie z Maciejem o rozwoju budynków (awanse, panel miasta, Prawo,
obrona, ulepszenia jednostek, koszty surowcowe). Numeracja pytań (18–49) jest **ciągła z
[`PYTANIA-OTWARTE.md`](PYTANIA-OTWARTE.md)** i **[`REJESTR-PROSB-I-ZADAN.md`](REJESTR-PROSB-I-ZADAN.md)** —
nie duplikuje ich treści, tylko zbiera wynik w jednym miejscu. Pełna tabela kosztów surowcowych zostaje
w swoim pliku źródłowym: **[`SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md`](SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md)**.

Zasada zastosowana w tym pliku (nowa reguła Macieja, 2026-07-25): **każda liczba ma nazwany parametr,
jednostkę i kontekst** — patrz `dyspozycje/PAMIEC-ROBOCZA-CIV.md` §1a.

---

## 1. Model rozwoju budynków — awans „w górę" vs „w bok"

**Rozstrzyga Pytanie 25** (poprzednio OTWARTE, rekomendacja B) — odpowiedź Macieja doprecyzowuje **per łańcuch**,
nie jedną regułą dla wszystkich budynków:

- **Awans „w górę"** — następca **KASUJE** poprzednika (silnik trzyma tylko wpis następcy; UI po kliknięciu
  rozwija listę tego, co budynek zastąpił — zgodnie z **wariantem B** z Pytania 25, bez ryzyka podwójnego
  liczenia bonusów):
  - Pałac I → Pałac II → Pałac III
  - Dom Starszyzny → Dwór Zarządcy → Pretorium
  - Kuźnia brązu → Kuźnia żelaza → Wielka Kuźnia
  - Spichlerz → Spichlerz II
  - Port handlowy → Port wielki
  - Piec hutniczy → Odlewnia żelaza

- **Awans „w bok"** — oba budynki **stoją obok siebie naprawdę** (żaden nie znika z listy miasta):
  - Mury + Cytadela + Baszta (obrona miasta, patrz §5)
  - Biblioteka + Akademia
  - Koszary + Akademia wojskowa
  - Kamienne kręgi + Świątynia

**Reguła wzrostu wartości w łańcuchu „w górę" (nowe doprecyzowanie dziś, zawęża Pytanie 26 = B):**
- Budynek, który **ma następcę** w łańcuchu (np. Pałac I, mając Pałac II) — jego wartość na turę jest
  **stałą liczbą PER TIER**, NIE rośnie sama z epoką miasta. Rośnie wyłącznie przez awans na kolejny tier.
  Przykład named-parametr: Pałac — **Kultura (pkt/turę)**: tier I = 5, tier II = 8, tier III = 11.
- Budynek, który **NIE ma wyższego tieru** (ostatni w łańcuchu, np. Pałac III dziś — bo epoki 4+ jeszcze
  nie ma) — **rośnie sam z epoką miasta** (parametr `przyrost` żywy). Decyzja Macieja: „zostawiamy przyrost,
  zbalansujemy to w przyszłości droższymi budynkami w kolejnych epokach" — czyli to świadomy, tymczasowy stan,
  nie bug do naprawy teraz.
- **Przy awansie „w bok"** wartości następcy muszą być **przyrostowe** (dokładają się do tego, co już daje
  poprzednik, nie liczą jego wkładu drugi raz) — dotyczy Pytania 24 (patrz §6, dwie ścieżki ulepszeń jednostek).

**Status wdrożenia (zaktualizowano po fakcie — praca kodowa działa się równolegle z tą sesją dokumentacyjną):**
podział na „w górę"/„w bok" i rozdzielenie wartości następcy (bez podwójnego liczenia) jest **WDROŻONY w kodzie**
na gałęzi roboczej, commit `2354fb7` — usunięte `upgradeFrom` z `fort`/`akademia`/`akademia_wojskowa`/`swiatynia`
(4 pary „w bok"), wartości rozdzielone (Akademia nauka 9→6/kultura 7→5, Akademia wojskowa praca 5→3, Świątynia
kultura 3→2/zadowolenie 3→2). Reguła „stała wartość per tier, rośnie tylko przez awans" dla łańcuchów „w górę"
zweryfikowana w kodzie na razie dla Pałacu (`R-LINEARYZACJA`, `R-PRAWO-ADMINISTRACJA` w `KANAL-PRACA.md`) —
pozostałe 5 łańcuchów „w górę" do potwierdzenia. **Nic z tego nie jest jeszcze zdeployowane do ROBOCZA.**

---

## 2. Panel miasta — osiem grup dziedzinowych

Budynki grupowane w panelu miasta w **8 grup dziedzinowych**:
1. Prawo i administracja
2. Wojsko i obrona
3. Handel i pieniądz
4. Nauka i kultura
5. Wiara
6. Zdrowie
7. Produkcja surowców
8. Żywność

Kliknięcie grupy rozwija listę budynków w niej. Budynek będący wynikiem awansu **„w górę"** rozwija (po kliknięciu)
listę tego, co zastąpił — to samo zachowanie UI, co w §1 (wariant B Pytania 25).

**Status wdrożenia:** **ZDEPLOYOWANE** (audyt verify 2026-08-05; kod na `main` od `2354fb7`) — pole `grupa` w
`buildings.json` i `BuildingDef` (dane, nie hardkod UI), 41/41 budynków pokryte (w tym Palisada→Wojsko i obrona),
panel „Budynki w mieście" = 8 zwijanych grup z licznikiem (grupa pusta widoczna, wyróżniona), test `grupy-budynkow` 83/83.
Dowód: `docs/decyzje/R-PANEL-GRUPY.md`.

---

## 3. Stolica kontra regiony

- **Pałac I / Pałac II / Pałac III** — budowalne **wyłącznie w stolicy**.
- **Dom Starszyzny / Dwór Zarządcy / Pretorium** — budowalne **wyłącznie poza stolicą** (miasta regionalne).
- **Trybunał i Sąd** — budowalne **wszędzie** (stolica i regiony).

**Status wdrożenia:** **WDROŻONE w kodzie** (audyt 2026-08-05, FALA 245 `8b6e0cfe` na `main`):
`BuildingDef.lokalizacja` (`stolica` / `region`) w `buildings.json` dla Pałacu I–III, Domu Starszyzny, Dworu Zarządcy, Pretorium;
`production.ts` → `buildingLocationAllowed()`; Trybunał i Sąd bez pola `lokalizacja` (wszędzie).
Test: `administracja-stolica-test.cjs` 48/48.

---

## 4. Siatka Prawa — wartości ZATWIERDZONE dziś

**Parametr:** Prawo (pkt Prawa na turę, budynek administracyjny miasta). **Kontekst skali:** epoka Kamienia = 50 pkt
Prawa = 100% skali; epoka Brązu = 75 pkt = 100%; epoka Żelaza = 100 pkt = 100% (skala rośnie z epoką, bo miasto
ma więcej zagrożeń buntu). Trzy kolumny = poziom trudności gry (łatwy / normalny / trudny — na trudnym gracz
dostaje MNIEJ Prawa, spójnie z resztą `society-params.json`).

| Budynek | Prawo (łatwy) | Prawo (normalny) | Prawo (trudny) |
|---|---|---|---|
| Pałac I | 45 | 35 | 28 |
| Pałac II | 58 | 45 | 36 |
| Pałac III | 71 | 55 | 44 |
| Dom Starszyzny | 36 | 28 | 22 |
| Dwór Zarządcy | 43 | 33 | 26 |
| Pretorium | 50 | 38 | 31 |
| Trybunał | 22 | 17 | 13 |
| Sąd | 25 | 19 | 16 |
| Garnizon (za 1 jednostkę, max. 5 jednostek) | 25 | 20 | 15 |

**Zasada wyprowadzenia wartości** (żeby przyszła sesja nie musiała zgadywać skąd liczby):
- Pretorium = **70%** wartości Pałacu III.
- Dwór Zarządcy = **60%** wartości Pałacu III.
- Dom Starszyzny = **50%** wartości Pałacu III.
- Sąd = **50%** wartości Pretorium.

**⚠️ UWAGA — supersedes wcześniejszy zapis:** we wcześniejszej rundzie (`KANAL-PRACA.md`, sekcja
„R-PRAWO-ADMINISTRACJA", odpowiedzi 26B/27A/28) Dom Starszyzny i Dwór Zarządcy były liczone jako **70% swojego
odpowiednika** (Dom Starszyzny=70% Pałacu I, Dwór Zarządcy=70% Pałacu II), co dawało **inne liczby**
(Dom Starszyzny 31/24/20, Dwór Zarządcy 41/31/25) niż tabela wyżej. **Tabela wyżej z dzisiejszej rozmowy jest
AKTUALNA** — obie liczone teraz jako procent Pałacu III (50%/60%), nie swojego odpowiednika. Ratusz (był liczony
jako 70% Pretorium = 35/27/22) **znika z tej siatki całkowicie**, bo budynek jest usunięty z gry (§8, Pytanie 44)
i zastąpiony wpisem Trybunał (22/17/13 — wartość podana wprost, nie jako procent).
**Status wdrożenia:** **WDROŻONE** (audyt 2026-08-05, AutoBot Tor 3) — `society-params.json` zgodny z tabelą (wszystkie wiersze PASS); test `prawo-siatka-v2-test.cjs` + `prawo-palac-tier-test.cjs`. Dowód: `docs/decyzje/R-PRAWO-SIATKA-V2.md`.

---

## 5. Obrona miasta — wyłącznie procentowa

**Rozstrzyga Pytanie 41** (odpowiedź B, nazwa budynku ZATWIERDZONA: **Baszta**).

Łańcuch obronny miasta — budynki **stoją obok siebie** (awans „w bok", §1), żaden nie zastępuje poprzedniego:

| Budynek | Bonus do Obrony miasta (%) |
|---|---|
| Mury | +200% |
| Cytadela | +100% |
| Baszta (nowy, epoka Żelaza) | +100% |
| **Suma (Mury+Cytadela+Baszta)** | **+400%** |

Płaskie pola `obrona` w danych budynków (dawne martwe/podwójnie liczone wartości) **wyzerowane** — obrona miasta
liczy się **wyłącznie procentowo**.

**Uwaga terminologiczna (żeby nie pomylić trzech różnych bytów w danych):**
- Identyfikator Cytadeli w `buildings.json` to `fort` (nazwa historyczna w danych, nie zmieniana — zmiana `id`
  zepsułaby zapisane gry).
- **Fort terenowy** to zupełnie inny byt — ulepszenie terenu stawiane robotnikiem na mapie, nie budynek miasta.
- Baszta to trzeci, nowy budynek — nie mylić z żadnym z powyższych.

**Status wdrożenia:** **WDROŻONE w kodzie** (audyt 2026-08-05, FALA 245 `8b6e0cfe` na `main`):
wpis `baszta` w `buildings.json`, `bonus_obrona_baszta_proc` w `miasto-params.json`, logika +400% w
`city-defense.ts`, prereq Mury w `building-resource-gate.ts`, ikona `building-icon-map.json`,
Civpedia `docs/encyklopedia/budynki/baszta.md`.
Testy: `koszty-surowcowe-test.cjs` (sekcje E/F), `prereq-budynkow-test.cjs`, `city-defense-terrain-gate-test.cjs`.
Panel Excel budynków — poza scope (źródło prawdy: JSON).

---

## 6. Dwie ścieżki ulepszeń jednostek z budynków

**Rozstrzyga Pytanie 24** (odpowiedź: wariant A uogólniony — bonusy się SUMUJĄ po całym łańcuchu `upgradeFrom`).

**Ścieżka 1 — Pancerz jednostek (armor, %, sumowane po łańcuchu kuźni):**

| Budynek | Bonus do Pancerza (%) | Suma po łańcuchu (%) |
|---|---|---|
| Kuźnia brązu (epoka Brąz) | +15% | 15% |
| Kuźnia żelaza (epoka Żelazo, zastępuje Kuźnię brązu) | +15% | **30%** |
| Wielka Kuźnia (epoka klasyczna, poza zasięgiem dzisiejszej gry o 3 epokach) | +15% | **45%** |

**Ścieżka 2 — Parametry miękkie jednostek (wszystko poza Pancerzem — atak/obrona/morale itd.), liczone OSOBNO
od Pancerza, bo te trzy budynki stoją obok siebie, nie w jednym łańcuchu:**

| Budynek | Bonus do Parametrów (%) |
|---|---|
| Koszary | +20% |
| Akademia wojskowa (zastępuje Koszary, ale bonus SUMUJE się z tym, co dawały Koszary) | +20% (+20% za zastąpione Koszary = **40%** łącznie) |
| Warsztat oblężniczy (stoi obok, nie w łańcuchu) | +10% |
| **Suma maksymalna (Akademia wojskowa + Warsztat oblężniczy)** | **50%** |

- Jednostka **zapamiętuje najlepsze odwiedzone własne miasto** (nie kumulację z wielu miast) — bonus trwały po
  opuszczeniu miasta. Parytet AI — ta sama zasada dla jednostek przeciwnika.
- Jednostka zdobywa poziom ulepszenia **budując się w mieście LUB wchodząc do niego**.
- **Odznaki na żetonach**: osobna dla Pancerza i osobna dla Parametrów, z cyfrą poziomu 1/2/3 — szczegóły
  prezentacji to osobne Pytanie 23 (wciąż szkic, patrz `PYTANIA-OTWARTE.md`).
- W dzisiejszej grze o 3 epokach realnie osiągalne maksimum: Pancerz **30%** (Wielka Kuźnia poza zasięgiem),
  Parametry **50%** (pełny zestaw Koszary→Akademia wojskowa + Warsztat oblężniczy jest osiągalny).

---

## 7. Koszty surowcowe budynków wg epok

Pełna tabela (28+ budynków, z liczbami surowca per budynek) jest w
**[`SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md`](SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md)** — nie duplikowana tutaj. Skrót zasady:

- **Epoka Kamienia** — koszt budowy wyłącznie w **drewnie** (sztuki drewna).
  **Wyjątek zatwierdzony (Pytanie 38 = A):** Kamienne kręgi i Stela/Pomnik zostają na **kamieniu** (8 i 6 sztuk
  odpowiednio) — nazwa i sens tych budowli to dosłownie kamień, zmiana na drewno łamałaby zgodność historyczną
  (Stonehenge z bali).
- **Epoka Brązu** — koszt budowy w **drewnie + kamieniu** (sztuki obu surowców, nieco większe ilości niż w Kamieniu).
- **Epoka Żelaza** — koszt budowy w **drewnie + cegle** (sztuki obu); budowle **obronne i port** — wyjątkowo
  **drewno + kamień** (mury/nabrzeża historycznie stawiano z kamienia, a miasto bez złoża gliny nie zostaje bez
  obrony i bez portu w epoce Żelaza).
- **Brąz i żelazo jako surowiec BUDOWLANY są zakazane we wszystkich epokach** — to metale na jednostki i handel,
  nie na budowę.

**Powiązana decyzja o handlu (Pytanie 40 = B):** cegła dołącza do surowców wymienianych na szlakach handlowych
(`TRADE_ROUTE_RESOURCE_KEYS`), obok brązu/żelaza/koni. Powód: miasto bez złoża gliny (glina = wyłącznie ląd
z rzeką) przestawało być odcięte na zawsze od budynków epoki Żelaza — teraz brak gliny to problem do rozwiązania
dyplomacją/handlem, nie wyrok losowania mapy.

---

## 8. Pozostałe rozstrzygnięcia dzisiejszej sesji

Poniższe to **decyzje** z dzisiejszej rozmowy — status wdrożenia w kodzie/danych różni się pozycja od pozycji
(zaznaczony w kolumnie „Decyzja" tam, gdzie nie jest jeszcze zrobione).

| Temat | Decyzja | Pytanie źródłowe |
|---|---|---|
| Karawanseraj | **Decyzja: usunąć z gry całkowicie** (anachronizm — budynek średniowieczny, szlaki karawanowe X–XV w., stał w epoce Brązu). **Do usunięcia** (nie wykonane w kodzie jeszcze): wpis w `buildings.json`, ikona, Civpedia/poradnik/encyklopedia, odwołania w panelach Excel, sprawdzić czy `techUnlock: "Handel"` nie zostaje pusty | Pytanie 15 = B |
| Lazaret | Usunięty z gry całkowicie — **już wykonane** | zamknięte wcześniej, commit `3228fb1` |
| Cegła w handlu | Cegła wchodzi do wymiany na szlakach handlowych | Pytanie 40 = B |
| Odlewnia żelaza | Praca: 8 pkt/turę → **12 pkt/turę** (awans ma się opłacać sam z siebie) | Pytanie 42 = A |
| Spichlerz II | Żywność 4 i Zadowolenie 2 **bez zmian** — wartością awansu jest obniżenie progu przepełnienia z 50% na 30% (czyli bufor 70% żywności po wzroście populacji zostaje) | Pytanie 43 |
| Ratusz | **Decyzja: usunąć całkowicie** z dzisiejszej gry (`prawo_ratusz` w `society-params.json`, flaga `hasRatusz` w `society-breakdown.ts`, wzmianki w `cityPanel.ts` i dokumentacji) — **do wykonania**, wraca jako szczebel administracji **po Pretorium**, dopiero w epoce średniowiecza | Pytanie 44 |
| Stela / Pomnik | Utrzymanie: **0 pieniądza/turę** (pomnik nie wymaga obsługi) | Pytanie 45 = B |
| Utrzymanie budynków | Ma być **zróżnicowane per budynek** (dane z JSON), NIE płaska stawka — dziś silnik czyta tylko płaską stawkę `utrzymanie_budynek`, ignorując zróżnicowane wartości w danych (patrz `PROBLEMY-I-ROZWIAZANIA-2026-07-25.md` #10 / Pytanie 19) | Pytanie 19 = **A** (dziś rozstrzygnięte — status w `PYTANIA-OTWARTE.md` zaktualizowany) |
| Pretorium | **Kultura: 5 pkt/turę** (nowy bonus — Pretorium to „pałac zamiejscowy", ma też dawać Kulturę jak Pałac); pola `obrona` i `mnoznik` **wyzerowane** (martwe, dublowały/nie robiły nic — spójnie z Murami/Cytadelą i z decyzją 6 z `KANAL-PRACA.md`) | Pytanie 18 (doprecyzowanie) + Pytanie 16 |

**⚠️ Do potwierdzenia przy wdrożeniu (nie zgaduję — zapisane, nie pytane w czacie zgodnie z nową zasadą procesu):**
Pytanie 18 miało trzy warianty A/B/C skupione na `Zadowolenie` (1→3 w rekomendacji A); dzisiejsza decyzja mówi
o **Kulturze 5 pkt/turę**, nie wspominając wprost, czy `Praca 2 / Pieniądz 3 / Zadowolenie 1` (wartości sprzed
sprzątania) też się zmieniają. Domyślne założenie do weryfikacji przy wdrożeniu: te trzy zostają bez zmian,
dochodzi tylko Kultura. Zapisane też cicho w `PYTANIA-OTWARTE.md` jako domknięcie Pytania 18.

---

## Skrót statusu wdrożenia (dla przyszłej sesji kodowej)

Ten plik jest **dokumentacją decyzji** — sesja, która go napisała, pracowała wyłącznie w `dyspozycje/`, `CLAUDE.md`
i `STAN-PRACY-HANDOFF.md` (zakaz dotykania `gra/`). RÓWNOLEGLE, w tym samym czasie, inne sesje wdrażały część
tych decyzji w kodzie na gałęzi roboczej — stąd status poniżej jest już zaktualizowany, nie „zero zrobione":

- ✅ **WDROŻONE w kodzie** (commit `2354fb7`, NIE zdeployowane do ROBOCZA): §1 podział łańcuchów na „w górę"/„w bok"
  + rozdzielenie wartości następcy (`upgradeFrom` usunięte z `fort`/`akademia`/`akademia_wojskowa`/`swiatynia`) ·
  §2 osiem grup dziedzinowych w panelu miasta (pole `grupa` w danych, 38/38 budynków).
- ⬜ **Nie sprawdzone / prawdopodobnie do zrobienia** (kolejność logiczna dla następnej sesji kodowej): (1) ~~Baszta
  jako nowy budynek + siatka obrony 400% z §5~~ **WDROŻONE** (audyt 2026-08-05), (2) siatka Prawa z §4, (3) reguła stała-wartość-per-tier dla
  POZOSTAŁYCH pięciu łańcuchów „w górę" (poza Pałacem, już zweryfikowanym) z §1, (4) ~~lokalizacja
  Pałac-tylko-stolica / Dom Starszyzny+Dwór Zarządcy+Pretorium-tylko-region z §3~~ **WDROŻONE** (audyt 2026-08-05), (5) usunięcie Ratusza +
  Karawanseraju (jeśli jeszcze nie zrobione — sprawdź `git log -- gra/data/buildings.json`), (6) utrzymanie
  zróżnicowane (Pytanie 19).
