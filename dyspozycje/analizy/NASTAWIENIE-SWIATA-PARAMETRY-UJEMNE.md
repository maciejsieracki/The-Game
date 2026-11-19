# Dyplomacja i wojna — parametry ujemne (kary) i dodatnie (bonusy) per poziom

**Temat:** R-WEB-DIPLO-WAR-TEMPER-SETTING-NEGATIVE-PARAMS-LIST-Q1 (runda 1/5, Operator HAIKU 5.5)
**Baza kodu:** origin/main `1bc8ec66d6b0cedaca0253b1869433c210ddc622`
**Zakres:** analiza + propozycja. ZERO zmian w `gra/src` i `gra/data`. Brak pomiaru w przeglądarce.
**Status wartości:** wszystkie liczby poniżej to WYLICZENIA z plików na bazie (mnożenie/dzielenie wartości z JSON/TS). NIE ZMIERZONO: wpływu w rozgrywce (poza tym, co podano z dispatchu jako cytat).

---

## 0. Ustalenia (skrót)

Ustawienie nowej gry **„Dyplomacja i wojna”** z poziomami:

| Poziom | Kary (współczynniki ujemne) | Bonusy (współczynniki dodatnie) |
|---|---|---|
| **ŁATWA** (domyślny, = dziś) | ×1 | ×1 |
| **NORMALNA** | ×2 | ÷2 (×0,5) |
| **TRUDNA** | ×3 | ÷3 (×1/3) |

Najważniejsze wnioski z przeglądu kodu (szczegóły w §5):

1. **Klamra `granicaMax = 6` zjada mnożnik na wspólnej granicy** (gdy flaga `twardaDyplomacjaAktywna` = ON). `karaGranicaZNapieciem` robi `max(suma, -6)`, więc przy ×2 i ×3 kara na granicy kończy się na **−6** (ta sama wartość na Normalnej i Trudnej). Mnożnik trzeba przypiąć **po** klamrze, inaczej jest bez efektu.
2. **Kary wpisane na sztywno w kodzie** (nie w JSON): `diplomacy.ts:1035–1078` (casus belli, ultimatum, trybut, zerwanie handlu/traktatu) oraz `diplomacy-penalty-preview.ts:240` (podgląd kary `-10`/`-15`). Bez ich przepięcia podgląd i rzeczywista kara się rozjadą.
3. **Istnieje już zależność od trudności głównej** dla części parametrów (`wiarygodnoscS3HandelPerTure*`: Łatwy 1,2 / Normalny 0,9 / Trudny 0,6; `wiarygodnoscCzasZapomnienia*`). Nowe ustawienie NAKŁADA SIĘ na te wartości (patrz §5.4).
4. **Wartości startowe i progi nie mnożyć** (start relacji rywali, progi sojuszu, progi wiarygodności). Rekomendacja w §4.
5. **Pule „punktów akceptacji” (`diplomacy-acceptance-points.json`) to CENY traktatów w PN, nie bonusy.** Dzielenie ich ÷3 obniżyłoby koszt sojuszu z 5000 PN do ok. 1667 PN — to zmiana innej natury niż „bonus”. Rekomendacja: NIE dzielić (ABC nr 6).

---

## 1. Miejsce wiązania ustawienia (zakres techniczny, bez zmian kodu)

- **Model ustawienia:** nowe pole w `NewGameAdvancedOptions` (`gra/src/ui/newGameFlow.ts`, interfejs ~l.224–262; domyślne `DEFAULT_ADVANCED` ~l.269) — wzorzec jak `cityStateDifficultyOverride` (l.259, `null` = śledzi główną trudność) i `barbariansLevel`. Domyślna wartość `'latwa'` = zachowanie dzisiejsze, więc stare zapisy i nowe gry bez wyboru nic nie zmieniają.
- **Odczyt parametrów:** `getEffectiveDiplomacyParams(difficulty)` (`gra/src/game/diplomacy.ts:590`) i `scaleDiplomacyParamsForDifficulty` (`diplomacy.ts:569`) — tu najmniej inwazyjnie dodać **drugi helper** `scaleDiplomacyParamsForWarLevel(base, level)` ze zbiorem kluczy KARY (mnożnik ×2/×3) i BONUSY (÷2/÷3), wołany po `scaleDiplomacyParamsForDifficulty`. Mnożnik wpisany w obiekt parametrów nie wymaga zmian w 40+ miejscach odczytu.
- **Ostrzeżenie o cyklu importów** (`diplomacy.ts:539–556`): `getBaseDiplomacyParams()` wolno wywoływać WYŁĄCZNIE wewnątrz funkcji. Helper musi respektować tę zasadę.
- **Główne miejsce podpięcia w main.ts:** `const _diplomacyParams = () => getEffectiveDiplomacyParams(_menuDifficulty);` (`gra/src/main.ts:11106`). Analogicznie dochodzi `_wojnaPoziom` z ustawień gry.
- **Sztywne kary (poza JSON):** należy przekazać mnożnik jako argument do funkcji zdarzeń w `diplomacy.ts:1020–1085` (`dZ`/`dR` ustawiane `switch`-em) oraz do `diplomacy-penalty-preview.ts:240`.
- **Zapis/wczytanie:** nowe pole w stanie zapisu gry. Stare zapisy bez pola → `'latwa'`. Miejsce zapisu `cityStateDifficultyOverride` do potwierdzenia przy implementacji (NIE ZWERYFIKOWANO w tej rundzie). Po wczytaniu licznik sąsiedztwa resetuje się przez `resetNeighborTenureSession()` (`diplomacy-harder.ts:82`), więc to samo podejście można powtórzyć dla nowego pola.
- **UI:** blok „Zaawansowane opcje” w `newGameFlow.ts` (wzorem selektora barbarzyńców / miast-państw), etykiety PL: „Dyplomacja i wojna: Łatwa / Normalna / Trudna”.

---

## 2. Lista A — PARAMETRY UJEMNE (kary)

Kolumny: **Parametr** (klucz) | **Plik:linia** | **Jednostka** | **Dziś** | **ŁATWA** (×1) | **NORMALNA** (×2) | **TRUDNA** (×3) | **Co robi** | **Uwagi**

Linie JSON wg `grep -n` na bazie; linie TS wg `grep -n` na bazie.

### 2.1 Sąsiedztwo (granice, wspólne tereny)

| Parametr | Plik:linia | Jednostka | Dziś | ŁATWA | NORMALNA | TRUDNA | Co robi | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `ekspansjaGranica_zaufanie_perTura` | `gra/data/diplomacy.json:28`; `gra/src/game/diplomacy.ts:163` | Zaufanie/tura | −3 | −3 | −6 | −9 | Kara za wspólną granicę w epoce Kamień (`sharedBorderPenaltyForEpochs`, `diplomacy.ts:603–612`; ctx w `main.ts:24667–24670`). | Wstrzymana w karencji po pokoju/rozejmie (`isPeaceLockedBetween`, `isTruceActive`). |
| `ekspansjaGranicaBraz_zaufanie_perTura` | `diplomacy.json:29`; `diplomacy.ts:165` | Zaufanie/tura | −4 | −4 | −8 | −12 | Kara za granicę, epoka Brąz (para: max epoki ≥ 2). | Jak wyżej. |
| `ekspansjaGranicaZelazo_zaufanie_perTura` | `diplomacy.json:30`; `diplomacy.ts:167` | Zaufanie/tura | −5 | −5 | −10 | −15 | Kara za granicę, epoka Żelazo (max epoki ≥ 3). | Przy `twardaDyplomacjaAktywna=ON` klamra −6 (§5.1). |
| Napięcie sąsiedztwa `granicaPrzyrost` (1/okres) i `granicaMax` (−6) | `gra/data/diplomacy-harder-params.json:4,5,6`; `gra/src/game/diplomacy-harder.ts:45–104` | Zaufanie/tura, klamra | −1 co 10 tur, max −6 | bez zmian | przyrost −2/okres; klamra −6 po mnożniku | przyrost −3/okres; klamra −6 po mnożniku | Dodatkowa kara za granicę bez NAP/sojuszu, narastająca po okresie (`napieciePenaltyZaTure`). | **Flaga OFF** (`twardaDyplomacjaAktywna: false`). Klamra −6 ma pozostać, mnożnik tylko przyrostu? → ABC nr 5. |
| `karaPrzemarszNieautoryzowany_zaufanie_perTura` | `diplomacy.json:86`; `gra/src/game/diplomacy-border-march.ts:60` (`DEFAULT_KARA = 5`); `main.ts:6322` | Zaufanie/tura (wartość dodatnia = wielkość kary) | 5 (magnitude) | 5 | 10 | 15 | Nieautoryzowany przemarsz przez cudze terytorium (koniec tury). | **Znak:** JSON trzyma wartość DODATNIĄ, loader odrzuca `≤ 0` (`border-march.ts:112`), kod traktuje jako wielkość kary. Mnożnik działa na wielkość, znak zostaje. Dyspozycja podaje „−5” — zgodne po wartości bezwzględnej. |
| `ai_city` garnizon / siedlisko: `ekspansja_heurystyka_granica_kara` (AI, osadnictwo) | `gra/data/ai-params.json:428` | punkty rankingu heksu | −3 | −3 | −6 | −9 | Kara punktowa AI za bliskość granicy wroga (<5 pól) przy zakładaniu miasta. | To NIE jest kara dyplomatyczna — AI-osadnictwo. Do decyzji (ABC nr 7). Rekomendacja: TAK (zgodnie z „sąsiedztwo”), ale to zmiana zachowania AI niezależnie od relacji. |

### 2.2 Zaufanie — zdarzenia jednorazowe i stany

| Parametr | Plik:linia | Jednostka | Dziś | ŁATWA | NORMALNA | TRUDNA | Co robi | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `zlamanaPaktGracz_zaufanie` | `diplomacy.json:7`; `diplomacy.ts:117` (użycie `:961`) | Zaufanie, jednorazowo | −40 | −40 | −80 | −120 | Złamany pakt przez gracza. | Klamra 0 (trust ≥ 0) — przy ×3 jeden ruch zeruje zaufanie. |
| `zlamanaPaktAI_zaufanie` | `diplomacy.json:8`; `diplomacy.ts:119` | Zaufanie, jednorazowo | −20 | −20 | −40 | −60 | Złamany pakt przez AI. | — |
| `zdrada_zaufanie` | `diplomacy.json:9`; `diplomacy.ts:121` | Zaufanie, jednorazowo | −50 | −50 | −100 | −150 | Zdrada / atak z zaskoczenia (flaga agresora). | Klamra 0. |
| `szpiegWykryty_zaufanie` | `diplomacy.json:10`; `diplomacy.ts:123` | Zaufanie, jednorazowo | −15 | −15 | −30 | −45 | Szpieg schwytany. | — |
| `roznicaKulturowa_zaufanie` | `diplomacy.json:13`; `diplomacy.ts:129` | Zaufanie, start pary (i wiersz ciągły w `diplomacy-factors.ts:217`) | −5 | −5 | −10 | −15 | Różny typ cywilizacji — tarcie bazowe. | **Start relacji** (`startRelationForPair`, `diplomacy-layers.ts:44–52`) — ZALECENIE: nie mnożyć startu (§4, ABC nr 4). |
| `rywalizacjaTenSamTyp_zaufanie` | `diplomacy.json:11`; `diplomacy.ts:125`; `ai-params.json:298` (`dyplomacja_relacja_startowa_rywale` −20) | Zaufanie, start | −20 | −20 | −40 | −60 | Rywalizacja tego samego typu (start). | **Start** — NIE mnożyć (ABC nr 4). |
| `slabszyMilitarnie_respekt` | `diplomacy.json:15`; `diplomacy.ts:135` | Respekt, jednorazowo | −10 | −10 | −20 | −30 | Gracz słabszy militarnie od partnera (próg `progRespektProc` 50%). | Respekt = czysta moc, nie zaufanie. |
| `urazyHistoryczne_zaufanie_perTura` | `diplomacy.json:33`; `diplomacy.ts:173`; zanik `diplomacy.ts:1801–1802` | Zaufanie/tura | −2 | −2 | −4 | −6 | Urazy historyczne (zanikają co 20 tur o krok 2). | Zanik krokiem `2` — po mnożniku krok też rośnie (−4/−6); decyzja: czy krok zaniku skalować (ABC nr 5). |
| `wiarygodnoscN1BezOstrzezenia` | `diplomacy.json:102`; `diplomacy.ts:328` | Wiarygodność, jednorazowo | −10 | −10 | −20 | −30 | Wypowiedzenie bez casus belli (atak w tej turze / karencji). | Skala Wiarygodności −100…+100 (`diplomacy.json` `wiarygodnoscSkalaMin` = −100, `diplomacy.ts:312`). |
| `wiarygodnoscN2ZlamaniePaktuNap` | `diplomacy.json:104`; `diplomacy.ts:332` | Wiarygodność | −18 | −18 | −36 | −54 | Złamanie NAP. | Jedna kara ×3 = −54 ze 100 — patrz §5.5 (ryzyko progu −40). |
| `wiarygodnoscN2ZlamaniePaktuSojusz` | `diplomacy.json:105`; `diplomacy.ts:334` | Wiarygodność | −25 | −25 | −50 | −75 | Złamanie sojuszu. | Jw. |
| `wiarygodnoscN3AtakWOknieKarencji` | `diplomacy.json:106`; `diplomacy.ts:336` | Wiarygodność | −12 | −12 | −24 | −36 | Atak w oknie karencji. | — |
| `wiarygodnoscN4OdmowaObowiazkuSojuszu` | `diplomacy.json:108`; `diplomacy.ts:340` | Wiarygodność | −15 | −15 | −30 | −45 | Odmowa obowiązku sojuszu. | — |
| `wiarygodnoscN5ZerwanieTraktatCzasowy` | `diplomacy.json:109`; `diplomacy.ts:342` | Wiarygodność | −6 | −6 | −12 | −18 | Zerwanie traktatu czasowego. | — |
| `wiarygodnoscN5ZerwanieHandelCzasowy` | `diplomacy.json:110`; `diplomacy.ts:344` | Wiarygodność | −4 | −4 | −8 | −12 | Zerwanie umowy handlowej. | — |
| `wiarygodnoscN6NiedotrzymanieHandluCyklicznego` | `diplomacy.json:111`; `diplomacy.ts:346` | Wiarygodność | −2 | −2 | −4 | −6 | Niedotrzymanie handlu cyklicznego. | Próg serii `wiarygodnoscN6ProgTurZRzedu` = 3 (`json:112`) — NIE mnożyć. |
| `wiarygodnoscN7NieautoryzowanyPrzemarsz` | `diplomacy.json:113`; `diplomacy.ts:350` | Wiarygodność | −2 | −2 | −4 | −6 | Nieautoryzowany przemarsz. | — |

### 2.3 Zdarzenia „na sztywno” w kodzie (nie w JSON)

| Zdarzenie (klucz zdarzenia) | Plik:linia | Jednostka | Dziś | ŁATWA | NORMALNA | TRUDNA | Uwagi |
|---|---|---|---|---|---|---|---|
| `wojna_casus_belli` — dZ | `gra/src/game/diplomacy.ts:1033–1035` | Relacja (w kodzie Zaufanie) | −10 | −10 | −20 | −30 | Sztywne `dZ = -10`. Przepiąć na parametr albo mnożnik argumentu. |
| `ultimatum_bezpodstawne` — dZ / dR | `diplomacy.ts:1040–1043` | Zaufanie / Respekt | −10 / −10 | −10 / −10 | −20 / −20 | −30 / −30 | Sztywne. |
| `trybut_odmowa` — dZ | `diplomacy.ts:1047–1048` | Zaufanie | −10 | −10 | −20 | −30 | Sztywne. |
| `zerwanie_handlu` — dZ | `diplomacy.ts:1065` | Zaufanie | −10 | −10 | −20 | −30 | Sztywne. Próg 10 tur (`zerwanie_handlu_bez_kary`, `diplomacy.ts:1067–1068`) NIE mnożyć. |
| `zerwanie_traktatu` — dZ | `diplomacy.ts:1078` | Zaufanie | −15 | −15 | −30 | −45 | Sztywne. |
| Podgląd kary (`pushLine`): `zaufanie` −10 handel / −15 traktat | `gra/src/game/diplomacy-penalty-preview.ts:240` | Zaufanie | −10 / −15 | −10 / −15 | −20 / −30 | −30 / −45 | **Musi** odzwierciedlać ten sam mnożnik co `diplomacy.ts:1065/1078`, inaczej podgląd kłamie. |
| Wiersz faktorów: `karaWspolnaGranica` | `gra/src/game/diplomacy-factors.ts:204–208` | Zaufanie | wg §2.1 | wg §2.1 | wg §2.1 | wg §2.1 | Wiersz breakdown pokazuje faktyczną wartość — po mnożniku pokaże poprawnie, o ile liczony z tych samych parametrów. |

### 2.4 Wojna, pokój, agresja (AI)

| Parametr | Plik:linia | Jednostka | Dziś | ŁATWA | NORMALNA | TRUDNA | Co robi | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `zerwanie_relacja` (AI↔AI, NAP/sojusz) | `gra/data/ai-ai-treaty-params.json:6` | Relacja | −30 | −30 | −60 | −90 | Zerwanie NAP/sojuszu przez AI (AI↔AI). | Flaga `torAktywny: false` (`json:4`). |
| `zerwanie_zaufanie` (AI↔AI) | `ai-ai-treaty-params.json:7` | Zaufanie | −20 | −20 | −40 | −60 | Jw. | Jw. |
| `relacjaDeltaSojusz` — wpływ na AI wobec agresora (PRÓG +15, „trudniej”) | `gra/data/diplomacy-aggressor-params.json:9` | Relacja (przesunięcie progu) | +15 | +15 | +30 | +45 | Agresor: próg sojuszu/paktu wyżej. To KARA, zapisana jako przesunięcie progu. | Znak dodatni = trudniej (nie odwracać). |
| `willingnessAllyMnoznik` — wobec agresora | `diplomacy-aggressor-params.json:10` | mnożnik gotowości (<1 = kara) | ×0,7 | ×0,7 | ×0,4 (1−0,3×2) | ×0,1 (1−0,3×3) | Agresor: mniejsza gotowość sojuszników. | Mnożnik <1 NIE jest mnożony wprost (0,7×2 = 1,4 to bonus!). Stąd przeliczenie „1 − (1 − x)·m”. ABC nr 5. |
| `karaAgresjaNiska` / `karaProfilObronny` | `gra/data/diplomacy-war-peace-params.json:50,51` | tury (min. wojny) | −2 / −1 | −2 / −1 | bez zmian | bez zmian | Modyfikatory liczby tur wojny. | **Liczba tur — NIE mnożyć** (dotyczy czasu, nie kary). |
| `wypowiedzenieZaufanie.progZaufaniaWojny` | `war-peace-params.json:91` | próg zaufania (30) | 30 | 30 | 30 | 30 | AI wypowiada wojnę, gdy zaufanie < 30. | **Próg — NIE mnożyć.** |
| `hamulecRelacji` / `bazaN` (tury kryzysu) | `war-peace-params.json:101–103` | tury | 8 | 8 | 8 | 8 | Liczba tur do wypowiedzenia wojny przez silniejszą stronę. | Czas — NIE mnożyć. |

### 2.5 Kary w ocenie sojuszy (ujemne składniki oceny)

| Parametr | Plik:linia | Jednostka | Dziś | ŁATWA | NORMALNA | TRUDNA | Co robi | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `progSojuszKaraSilniejszyMax` (klamra kary) | `diplomacy.json:62`, `diplomacy.ts:244` (użycie `diplomacy.ts:723`) | udział (klamra) | 0,40 | 0,40 | 0,80 | 1,20 | Górny limit kary silniejszego w ocenie sojuszu. | Klamra — mnożyć razem z karą (inaczej kara nigdy nie osiągnie wartości). Patrz §5.2. |
| `progSojuszKaraMilSkok` | `diplomacy.ts:246` (użycie `:722`) | udział/skok | 0,15 | 0,15 | 0,30 | 0,45 | Kara za różnicę siły wojskowej. | — |
| `progSojuszKaraAllySkok` | `diplomacy.ts:248` | udział/skok | 0,18 | 0,18 | 0,36 | 0,54 | Kara za sojusznika partnera. | Sprawdzić miejsce użycia przy implementacji (NIE ZWERYFIKOWANO w tej rundzie). |
| `zazdroscNaTure` (AI↔AI, zazdrość lidera, flaga OFF) | `gra/data/diplomacy-harder-params.json:8`; `gra/src/game/diplomacy-harder.ts:162` | Zaufanie/tura | −1 | −1 | −2 | −3 | Zazdrość wobec lidera (co turę). | Flaga `twardaDyplomacjaAktywna` OFF. |
| `zazdroscNaTureDuza` (flaga OFF) | `diplomacy-harder-params.json` (pole `zazdroscNaTureDuza`, 2) ; `diplomacy-harder.ts:162` | Zaufanie/tura | −2 | −2 | −4 | −6 | Zazdrość przy przewadze ≥ `zazdroscProgPrzewagi` 0,2. | — |

### 2.6 Pozycje NIE mnożyć (progi, starty, czas, priorytety)

| Parametr | Plik:linia | Powód |
|---|---|---|
| `progSojuszZaufanie` 90, `progSojuszRelacja` 130, `progNapRelacja` 110, `progNapZaufanie` 30, `progHandelRelacja` 0, `progWymianaTechZaufanie` 70 | `diplomacy.json:34–51` | progi bramek (dostępność akcji) — NIE kara |
| `dyplomacja_strach_prog_nap` 60 / `_trybut` 60 / `ai_diplomacja_prog_*` | `ai-params.json` (§6) | progi decyzji AI |
| `wiarygodnoscProgWiarolomny` −40, `wiarygodnoscSkalaMin/Max` ±100 | `diplomacy.json:98,` `diplomacy.ts:312–318` | progi i klamry |
| `wiarygodnoscStart*` (40/20/0) | `diplomacy.json:99–101` | start (per trudność już istnieje) |
| `startZaufanie` 20 / `startRespekt` 30 | `diplomacy.ts` (parametry startowe) | start |
| `archetype_*_priorytet` (−1, −2 itd.) | `ai-params.json:182–633` | priorytety produkcji AI, NIE dyplomacja |
| `kupno_jednostki_min_dochod_netto_poziom3` −2 | `ai-params.json:743` | ekonomia, NIE dyplomacja |
| `easy`: −10 (`DIPLOMACY_DIFFICULTY_DELTA`) | `gra/src/game/diplomacy.ts:492–496` | przesuwa PROGI relacji wg głównej trudności — NIE mnożyć karami |
| `twardaDyplomacjaAktywna` itd. (flagi) | `diplomacy-harder-params.json:3` i pozostałe flagi | przełączniki |
| `zeroZaufaniaProgTur` 5 | `diplomacy-zero-trust-params.json:5` | czas |
| `progPrzewagiProc` 20 %, `progRespektProc` 50 % | `diplomacy-military-strength-params.json:4,` | progi |
| `progRozniceSilyPokoj` 0 | `diplomacy-war-peace-params.json:107–` | próg |
| `cenaPokoju.cenaStartPn` 6000, `pokoj` 615 PN, `rozejm` 2000 PN, `sojusz_pelny` 5000, `nap` 2000 | `war-weariness-params.json:40`; `diplomacy-acceptance-points.json` | CENY w PN — patrz §4 |
| `wiarygodnoscP4OknoBezWojnyTur` 30 | `diplomacy.json:128` | czas |

---

## 3. Lista B — PARAMETRY DODATNIE (bonusy) — dzielone ÷2 (Normalna) / ÷3 (Trudna)

Kolumny jak w liście A. Ta sama zasada: bonus dzielony przez mnożnik poziomu.

### 3.1 Zaufanie za czynności (jednorazowo i co turę)

| Parametr | Plik:linia | Jednostka | Dziś | ŁATWA | NORMALNA (÷2) | TRUDNA (÷3) | Co robi | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `handelZawarcie_zaufanie` | `diplomacy.json:3` | Zaufanie, jednorazowo | +2 | +2 | +1 | +0,67 | Zawarcie umowy handlowej. | — |
| `pomocSojusznikowi_zaufanie` | `diplomacy.json:4` | Zaufanie, jednorazowo | +10 | +10 | +5 | +3,33 | Pomoc w wojnie sojusznikowi. | — |
| `wspolnyWrogNawiazanie_zaufanie` | `diplomacy.json:5` | Zaufanie, jednorazowo | +5 | +5 | +2,5 | +1,67 | Nawiązanie kooperacji wspólnego wroga. | — |
| `dar_zaufanie` | `diplomacy.json:6` | Zaufanie, jednorazowo | +6 | +6 | +3 | +2 | Darmowy dar (PN). | Próg relacji daru `prog_dar_relacja` 30 — NIE dzielić. |
| `handel_zaufanie_perTura` | `diplomacy.json:19` | Zaufanie/tura | +1 | +1 | +0,5 | +0,33 | Aktywny handel. | Zaufanie jest liczbą zmiennoprzecinkową (dryf `0,03`); wyświetlanie zaokrągla (`diplomacy-display.ts:836`). |
| `sojusz_zaufanie_perTura` | `diplomacy.json:20` | Zaufanie/tura | +3 | +3 | +1,5 | +1 | Aktywny sojusz. | Wpływ na progi sojuszu (§5.6). |
| `nap_zaufanie_perTura` | `diplomacy.json:21` | Zaufanie/tura | +2 | +2 | +1 | +0,67 | Aktywny NAP. | — |
| `pokoj_zaufanie_perTura` | `diplomacy.json:22` | Zaufanie/tura | +1 | +1 | +0,5 | +0,33 | Pokój. | — |
| `aktywnyPakt_zaufanie_perTura` | `diplomacy.json:23` | Zaufanie/tura | +1 | +1 | +0,5 | +0,33 | Aktywny pakt. | — |
| `dobraWola_zaufanie_perTura` | `diplomacy.json:24` | Zaufanie/tura | +1 | +1 | +0,5 | +0,33 | Efekt dobrej woli po darze (`turyEfektuPodarunku` 5). | — |
| `wspolnyWrog_zaufanie_perTura` | `diplomacy.json:25` | Zaufanie/tura | +1 | +1 | +0,5 | +0,33 | Wspólny wróg (kooperacja). | — |
| `rozejm_zaufanie_ustawienie` | `diplomacy.json:31` | Zaufanie (ustawienie po rozejmie) | +10 | +10 | +5 | +3,33 | Ustawienie po rozejmie. | — |
| `pokoj_zaufanie_ustawienie` | `diplomacy.json:32` | Zaufanie (ustawienie po pokoju) | +20 | +20 | +10 | +6,67 | Ustawienie po pokoju. | Wpływa na to, ile trzeba odbudować po wojnie. |
| `wiarygodnoscS1SojuszPerTure` | `diplomacy.json:115` | Wiarygodność/tura | +1 | +1 | +0,5 | +0,33 | Sojusz — pasywna wiarygodność. | — |
| `wiarygodnoscS2NapPerTure` | `diplomacy.json:116` | Wiarygodność/tura | +0,5 | +0,5 | +0,25 | +0,17 | NAP. | — |
| `wiarygodnoscS3HandelPerTure{Latwy,Normalny,Trudny}` | `diplomacy.json:117–119` | Wiarygodność/tura | 1,2 / 0,9 / 0,6 | 1,2 / 0,9 / 0,6 | 0,6 / 0,45 / 0,3 | 0,4 / 0,3 / 0,2 | Handel. | **Już zależne od głównej trudności** (§5.4). |
| `wiarygodnoscS4PrzemarszPerTure{...}` | `diplomacy.json:120–122` | Wiarygodność/tura | 0,8 / 0,6 / 0,4 | 0,8 / 0,6 / 0,4 | 0,4 / 0,3 / 0,2 | 0,27 / 0,2 / 0,13 | Przemarsz (pasywny). | Jw. |
| `wiarygodnoscP1FiniszSojusz` | `diplomacy.json:123` | Wiarygodność, jednorazowo | +10 | +10 | +5 | +3,33 | Finisz sojuszu. | — |
| `wiarygodnoscP2FiniszNap` / `...FiniszHandel` | `diplomacy.json:124–125` | Wiarygodność, jednorazowo | +5 / +5 | +5 | +2,5 | +1,67 | Finisz NAP / handlu. | — |
| `wiarygodnoscP3FiniszHandelCykliczny` | `diplomacy.json:126` | Wiarygodność | +1 | +1 | +0,5 | +0,33 | — | — |
| `wiarygodnoscP5PomocSojusznikowi` | `diplomacy.json:129` | Wiarygodność | +20 | +20 | +10 | +6,67 | Pomoc sojusznikowi. | — |
| `wiarygodnoscCzasZapomnieniaNagroda{Latwy,Normalny,Trudny}` | `diplomacy.json:133–135` | tury (czas) | 120 / 80 / 40 | bez zmian | bez zmian | bez zmian | Czas zapominania nagród. | **Czas — NIE dzielić.** |
| `pn_na_zaufanie` (100 PN = +1 zaufanie) | `diplomacy.json:217` | PN na 1 pkt | 100 | 100 | ×2 = 200 PN/pkt | ×3 = 300 PN/pkt | Przelicznik nadmiaru PN na zaufanie — DZIELNIK bonusu. | Mnożyć dzielnik = dzielić bonus. Tu „÷ bonusu” = „×dzielnik”. |
| `max_zaufanie_na_ture` (+5/tura) | `diplomacy.json:218` | Zaufanie/tura (limit) | +5 | +5 | +2,5 | +1,67 | Limit przyrostu z nadmiaru PN. | — |
| `dobra_wola_zaufanie_per_tura` | `diplomacy.json:224` | Zaufanie/tura | +1 | +1 | +0,5 | +0,33 | Dobra wola po wymianie. | — |

### 3.2 Respekt

| Parametr | Plik:linia | Jednostka | Dziś | ŁATWA | NORMALNA (÷2) | TRUDNA (÷3) | Co robi | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `przewagaMilitarna_respekt` | `diplomacy.json:14` | Respekt, jednorazowo | +15 | +15 | +7,5 | +5 | Przewaga militarna gracza (próg 50 %). | Respekt = moc — objęty ABC nr 1 (zakres bonusów). |
| `wygraBitwa_respekt` | `diplomacy.json:16` | Respekt, jednorazowo | +5 | +5 | +2,5 | +1,67 | Wygrana bitwa. | — |
| `trybut_respekt` | `diplomacy.json:17` | Respekt, jednorazowo | +10 | +10 | +5 | +3,33 | Akceptacja żądania trybutu. | — |
| `wspolnyWrogAkceptacja_respekt` | `diplomacy.json:18` | Respekt, jednorazowo | +10 | +10 | +5 | +3,33 | Akceptacja wspólnego wroga. | — |

### 3.3 Ocena sojuszu i punkty akceptacji (AI)

| Parametr | Plik:linia | Jednostka | Dziś | ŁATWA | NORMALNA (÷2) | TRUDNA (÷3) | Co robi | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `progSojuszPremiaSilniejszyMax` (klamra premii) | `diplomacy.json:56`; `diplomacy.ts:232,650` | udział (klamra) | 0,25 | 0,25 | 0,125 | 0,083 | Górny limit premii silniejszego. | Klamra — ÷ razem z premią (§5.2). |
| `progSojuszPremiaMilSkok` | `diplomacy.json:57`; `diplomacy.ts:234,643` | udział/skok | 0,08 | 0,08 | 0,04 | 0,027 | Premia za przewagę wojskową. | — |
| `progSojuszPremiaRespektSkok` | `diplomacy.json:58`; `diplomacy.ts:236,644` | udział/skok | 0,15 | 0,15 | 0,075 | 0,05 | Premia za przewagę respektu. | — |
| `progSojuszPremiaSilniejszyInny` | `diplomacy.json:60`; `diplomacy.ts:240` | udział | 0,20 | 0,20 | 0,10 | 0,067 | Premia — silniejszy „inny”. | — |
| `progSojuszPremiaGracz2xBonus` (+ `progSojuszPremiaGracz2xMilRatio` 2,0, `progSojuszPremiaGracz2xMinZaufanie` 85) | `diplomacy.json:69`; `diplomacy.ts:254–256,648` | udział | 0,06 | 0,06 | 0,03 | 0,02 | Premia przy 2× przewadze gracza (próg zaufania 85 — NIE dzielić). | Progi `…MinZaufanie` i `…MilRatio` — NIE dzielić. |
| `progSojuszPremiaGracz3xBonus` (+ `…3xMilRatio` 2,8, `…3xMinZaufanie` 83) | `diplomacy.json:72`; `diplomacy.ts:257–259` | udział | 0,10 | 0,10 | 0,05 | 0,033 | Premia przy 3× przewadze gracza. | Jw. |
| `progSojuszWillingnessMin` 0,54 | `diplomacy.json:61`; `diplomacy.ts:242`; `ai-params.json:340` | próg | 0,54 | 0,54 | 0,54 | 0,54 | Próg gotowości do sojuszu. | **Próg — NIE dzielić.** |
| Punkty akceptacji traktatów (`sojusz_pelny` 5000, `sojusz_defensywny` 4200, `nap` 2000, `rozejm` 2000, `pokoj` 615, `granice` 600, `umowa_*` 80, `wasal` 3500, `namow_wojne` 150, `ultimatum` 180) | `gra/data/diplomacy-acceptance-points.json:3–20` | PN (CENY) | j.w. | bez zmian | bez zmian (rekomendacja) | bez zmian (rekomendacja) | Koszt traktatu, płatny przez słabszą stronę (parytet). | **Nie są bonusami.** Dzielenie ÷3 = sojusz za ~1667 PN. Patrz ABC nr 6. |
| `sweetener.pn_na_punkt_ease` 25 / `max_ease_punkty` 20 | `diplomacy-acceptance-points.json:54–55` | PN/pkt; sufit | 25 / 20 | bez zmian | bez zmian | bez zmian | Słodzik obniża próg relacji traktatu. | Ulga — jak wyżej, nie bonus. |

### 3.4 Pozostałe dodatnie w danych sojuszu/wojny (wpływ na klamry)

| Parametr | Plik:linia | Dziś | Uwagi |
|---|---|---|---|
| `wiarygodnoscTempoAmplituda` 0,5 | `diplomacy.json:138`; `diplomacy-credibility.ts:601–614` | 0,5 | Tempo wzrostu/spadku zaufania od wiarygodności. Mnożnik `spadekMult` już dziś do ×1,5 przy W = −100. Przy TRUDNEJ kary ×3 × `spadekMult` ×1,5 = ×4,5 — ABC nr 3. |
| `wiarygodnoscZaufanieDryfNa100` 0,03 | `diplomacy.json:139` | — | Dryf zaufania z wiarygodności (±3/tura przy W=±100). Nie mnożyć (to wynik wiarygodności). |

---

## 4. Ile mnożyć, a czego NIE — zalecenia

**Mnożyć (kary):** wszystkie pozycje z §2.1–2.5, z wyjątkiem poniższych.
**NIE mnożyć karami (zostają):**
- wartości **startowe** relacji (`startZaufanie`, `rywalizacjaTenSamTyp_zaufanie`, `roznicaKulturowa_zaufanie` w starcie, `dyplomacja_relacja_startowa_rywale`) — inaczej gra zaczyna się w innym punkcie niż „Łatwa = dziś”. Rekomendacja: start bez zmian, a mnożnik tylko na bieżące zmiany.
- **progi** i **klamry** (`progSojuszZaufanie`, `progSojuszRelacja`, `wiarygodnoscProgWiarolomny`, `progZaufaniaWojny`) — zmiana progu to inna mechanika niż zmiana kary.
- **czas** (`trwaTur`, `karencja`, `okres`, `bazaN`) — mnożenie czasu zmienia tempo gry, nie „ile kosztuje”.
- **ceny w PN** (`diplomacy-acceptance-points.json`, `cenaPokoju`) — to nie kary, to wartość traktatu.

**Dzielić (bonusy):** wszystkie pozycje §3.1–3.3 z wyjątkiem progów, czasu i cen.

**Ryzyko klamry w danych:** `progSojuszKaraSilniejszyMax` (0,40) i `progSojuszPremiaSilniejszyMax` (0,25) są klamrami: ich mnożenie/dzielenie razem z karą/premią jest konieczne, inaczej kara/premia nie może przekroczyć nowego limitu (np. kara ×3 bez zmiany klamry 0,40 działa tylko do progu 0,40).

---

## 5. Kolizje i ryzyka (uwaga: 5.1–5.6)

### 5.1 Klamra `granicaMax` zjada mnożnik na wspólnej granicy (flaga ON)
`gra/src/game/diplomacy-harder.ts:102` (`karaGranicaZNapieciem`): `Math.max(suma, -Math.abs(p.granicaMax))`, gdzie `granicaMax` = 6 (`diplomacy-harder-params.json:6`).
Przy `twardaDyplomacjaAktywna=ON` i mnożniku wejściowym kara bazowa Żelazo: Łatwa −5, Normalna −10, Trudna −15 → po klamrze **−6 we wszystkich trzech** (Łatwa dopiero po 10+ turach napięcia). Mnożnik znika na granicy. **Rekomendacja:** przypiąć mnożnik PO klamrze (wynik ×2/×3 → −12 / −18 przy tej samej klamrze w skali poziomu) albo skalować też `granicaMax` (−12 / −18). ABC nr 5.

### 5.2 Klamry ocen sojuszu
`progSojuszKaraSilniejszyMax` (0,40) i `progSojuszPremiaSilniejszyMax` (0,25) — `diplomacy.ts:650,723`. Jeśli kara jest ×3, a klamra zostaje 0,40, to kara jest osiągalna tylko do 0,40 (więc ×3 działa tylko na część skali). Decyzja: skalować klamrę razem z karą (rekomendacja).

### 5.3 Kary sztywne w kodzie (nie w JSON) i podgląd
`diplomacy.ts:1035–1078` (5 zdarzeń) i `diplomacy-penalty-preview.ts:240` (`-10`/`-15`). Bez ich przepięcia: (a) rzeczywista kara ≠ podgląd; (b) część kar (casus belli, ultimatum, trybut) nie zmieni się, co złamie zasadę „wszystko co się da”.

### 5.4 Nakładanie się z główną trudnością
- `wiarygodnoscS3HandelPerTure*` już spada z trudnością głównej: Łatwy 1,2 → Trudny 0,6 (×0,5). Nowa TRUDNA (÷3) dałaby ×1/3 na bazie już ×0,5 → ×1/6 względem Łatwej (0,2 z 1,2). Efekt: handel AI↔gracz prawie nie daje Wiarygodności.
- `wiarygodnoscCzasZapomnienia*` (kara: 40/80/120 wg trudności) — czas, nie mnożyć.
- `DIPLOMACY_DIFFICULTY_DELTA` (`diplomacy.ts:492–496`): progi relacji przesuwane o −10 / +10. Nowe ustawienie nie może z tego korzystać jako mnożnika — to przesunięcie progów, nie kar.
- **ABC nr 2:** czy nowe ustawienie jest OSOBNE od głównej trudności (rekomendacja: TAK, wzorem `cityStateDifficultyOverride`), i czy na Trudnej głównej dochodzi ×0,6 z S3 jako „drugi raz” (rekomendacja: tak, ale przy Trudnej nowej nie dublować — do decyzji).

### 5.5 Wiarygodność — skala i progi
Skala ±100 (`diplomacy.json:` `wiarygodnoscSkalaMin/Max`). Jedna kara N2 ×3 = −54; dwie takie kary = −108 → klamra −100. Próg wiarołomności −40 (`diplomacy.json:98`): jedna kara N2 ×2 (−36) jest tuż pod progiem, ×3 (−54) przekracza go jednorazowo. Zmiana kategorii wiarołomny. ABC nr 3.

### 5.6 Sojusze AI↔AI — kumulacja na TRUDNEJ (oszacowanie, NIE ZMIERZONO)
- Wzrost zaufania dla sojuszu: `sojusz_zaufanie_perTura` +3 → +1/tura (÷3). Próg sojuszu `progSojuszZaufanie` 90 (`diplomacy.json:34`) — przy starcie 20 do 90 trzeba ~70 pkt zaufania; na Trudnej przyrost 1/tura + podarunki (+2) + pomoc (+3,3). Oszacowanie: sojusz wymaga kilkudziesięciu tur, a kara ×3 (np. `zlamanaPaktAI` −60, `ekspansjaGranicaZelazo` −15/tura) potrafi cofnąć postęp. **Wniosek ostrzegawczy:** na Trudnej sojusze AI↔AI mogą praktycznie nie powstawać.
- Dispatch podaje pomiar: „sojusze 0→23 przy flagach (seed 4242/7)” — ten pomiar dotyczy flag dyplomacji, NIE mnożników; NIE zweryfikowano go w tej rundzie. **Do pomiaru:** runner ON/OFF przy mnożnikach ×2/×3 (propozycja dla kolejnego tematu, nie w tym).
- `progSojuszPremia*` ÷3 i `progSojuszKara*` ×3 naraz → w ocenie propozycji AI kara dominuje nad premią; `progSojuszWillingnessMin` 0,54 pozostaje → mniej AI przechodzi próg.

---

## 6. Plan wiązania (najmniej inwazyjny) — bez zmian w tej rundzie

1. `gra/src/game/diplomacy.ts` (obok `scaleDiplomacyParamsForDifficulty` ~l.569): helper `scaleDiplomacyParamsForWarLevel(base, level)` — mnoży klucze KARY, dzieli klucze BONUSU; ZBIORY KLUCZY jako stałe (jak `DIPLO_RELATION_THRESHOLD_KEYS` ~l.499), bez progów/czasu/cen.
2. `gra/src/game/diplomacy.ts:1020–1085`: przekazać mnożnik do funkcji zdarzeń (argument `kara` lub `warLevel`), zamiast sztywnych `-10`/`-15`.
3. `gra/src/game/diplomacy-penalty-preview.ts:240`: ten sam mnożnik.
4. `gra/src/game/diplomacy-harder.ts:102`: mnożnik po klamrze (lub skalowana klamra — ABC nr 5).
5. `gra/src/main.ts:11106`: `_diplomacyParams = () => getEffectiveDiplomacyParams(_menuDifficulty)` → dodać drugi argument poziomu.
6. `gra/src/ui/newGameFlow.ts`: pole `diplomacyWarLevel: 'latwa' | 'normalna' | 'trudna'` w `NewGameAdvancedOptions` (~l.259), domyślnie `'latwa'` (~l.269), UI w „Zaawansowanych opcjach”, zapis prefs.
7. Zapis/wczytanie: pole w stanie gry; brak = `'latwa'`.
8. Testy: `civTest` — ŁATWA = identyczne wyniki z bazą (test regresji), NORMALNA/TRUDNA = sprawdzenie wartości z §2–3 (w tym klamra §5.1).

---

## 7. Pytania ABC do właściciela (z rekomendacją)

**ABC 1 — Zakres bonusów: które bonusy dzielone?**
- A) Wszystkie bonusy (zaufanie, respekt, wiarygodność, ocena sojuszu) — rekomendacja.
- B) Tylko zaufanie.
- C) Zaufanie bez ocen sojuszu.
Rekomendacja: **A**, bo inaczej AI↔AI zyskuje względnie.

**ABC 2 — Osobne ustawienie czy powiązane z trudnością główną?**
- A) Osobny wybór „Dyplomacja i wojna” (niezależny, domyślnie ŁATWA) — rekomendacja.
- B) Powiązane z trudnością główną (Łatwa/Normalna/Trudna = główna trudność).
Rekomendacja: **A**, wzorem `cityStateDifficultyOverride`, domyślnie ŁATWA (= zachowanie dzisiejsze).

**ABC 3 — Wiarygodność: skalować kary N1–N7?**
- A) Tak, ×2/×3 z klamrą ±100 — rekomendacja (zgodne z „wszystko co się da”).
- B) Nie, tylko zaufanie i respekt.
Dodatkowo: czy przy ×3 kara N2 (−54) ma przekroczyć próg wiarołomności −40 (zmiana kategorii)? Rekomendacja: TAK (zgodnie z zasadą), ale ustalić świadomie.

**ABC 4 — Starty i progi: nie mnożyć?**
Startowe zaufanie (rywalizacja −20, różnica kulturowa −5, start rywali −20) oraz progi i czas — **nie mnożyć** (rekomendacja). Alternatywa: mnożyć start (zmienia stan początkowy gry).

**ABC 5 — Klamry i ograniczenia (kolizje z flagami):**
- (a) Klamra `granicaMax` (−6, flaga OFF): mnożnik PO klamrze → −12 / −18 (rekomendacja) lub skalować klamrę.
- (b) `willingnessAllyMnoznik` 0,7 → 0,4 / 0,1 (przeliczenie „1 − (1−x)·m”) — rekomendacja.
- (c) Zanik urazów krok 2 → 4 / 6 (przyspiesza zanik) — rekomendacja: NIE skalować kroku zaniku, tylko wartość.

**ABC 6 — Punkty akceptacji traktatów (ceny PN) i `cenaPokoju`:**
Czy dzielić ceny sojuszu/traktatów? Rekomendacja: **NIE** (to ceny w PN, nie bonusy; dzielenie zmieniłoby koszt sojuszu z 5000 PN na ~1667 PN, co jest zmianą gospodarczą).

**ABC 7 — Osadnictwo AI (`ekspansja_heurystyka_granica_kara` −3) i zdarzenia sztywne:**
- Czy kara AI za zakładanie miasta przy granicy (−3 → −6/−9) ma wejść w „Dyplomacja i wojna”? Rekomendacja: TAK (sąsiedztwo), ale to zmiana zachowania AI niezależnie od relacji.
- Czy zdarzenia sztywne (`diplomacy.ts:1035–1078`, podgląd `penalty-preview:240`) mają iść przez mnożnik? Rekomendacja: TAK.

---

## 8. Co NIE zostało zrobione / NIE ZMIERZONO

- NIE ZMIERZONO: wpływ mnożników na przebieg gry (brak runu, brak pomiaru 150 tur).
- NIE ZMIERZONO: liczba sojuszy AI↔AI przy mnożnikach (dispatch cytuje „0→23” dla flag, nie dla mnożników).
- NIE ZWERYFIKOWANO: miejsce zapisu `cityStateDifficultyOverride` w SaveGame (do potwierdzenia przy implementacji).
- NIE ZWERYFIKOWANO: miejsce użycia `progSojuszKaraAllySkok` (`diplomacy.ts:248`).
- Wartości z §2–3 to wyliczenia arytmetyczne z plików na bazie; NIE są zatwierdzone przez właściciela (patrz §7).
