# Zaufanie (dyplomacja)

## Metadane

| Pole | Wartość |
|------|---------|
| id | `zaufanie` |
| tytuł | Zaufanie |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §74 |
| json_ref | `diplomacy.json` (params), `diplomacy-credibility.ts` |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Zaufanie** mierzy, jak bardzo dana cywilizacja wierzy, że ty (albo ona) dotrzymasz słowa wobec drugiej strony. Zaczyna się od **20** i zmienia się z każdą turą: handel i traktaty je podnoszą, złamane obietnice i zdrada obcinają je gwałtownie.

---

## Wiki‑M

### Czym jest Zaufanie

Zaufanie jest **osobne dla każdej pary** cywilizacji (ty ↔ jedna nacja). Razem z **Respektem** tworzy **Relację** (suma 0–200). Relacja decyduje o progach umów; Zaufanie samo decyduje o tym, czy dojdzie do sojuszu, wymiany technologii i paktu o nieagresji.

Zaufanie jest liczone w zakresie **0–100** dla każdego składnika zdarzenia.

### Plusy i minusy

**Dla gracza**
- Plus: wysokie Zaufanie otwiera sojusz (od 90), wymianę technologii (od 70) i pakt o nieagresji (od 30).
- Plus: handel i traktaty dają go co turę bez wysiłku; dobra wola po wymianie dodaje +1 przez kilka tur.
- Minus: złamany pakt (−40) lub zdrada (−50) kasuje miesiące budowania.
- Minus: w wojnie Zaufanie spada do zera i wraca dopiero po jej zakończeniu.
- Minus: sąsiedztwo granicą cofa Zaufanie co turę, tym mocniej im nowsza epoka (w karencji po pokoju lub rozejmie kara jest wstrzymana).

**Dla AI**
- Plus: AI z wysokim Zaufaniem akceptuje więcej ofert i chętniej wchodzi w sojusz.
- Minus: złamanie paktu przez AI (−20) jest łagodniejsze niż przez gracza (−40), ale nadal boli.

### Zmiany na turę (tabela)

| Źródło | Zmiana na turę | Uwagi |
|--------|----------------|-------|
| Handel (umowa aktywna) | +1 | dodaje się osobno, także przy sojuszu lub pakcie |
| Pakt o nieagresji | +2 | jeden z dwóch wyłącznych tierów pokojowych (z sojuszem) |
| Sojusz | +3 | wyłączny z paktem (jeden tier); nie wyklucza handlu, który dodaje się osobno |
| Wspólny wróg | +1 | |
| Dobra wola po wymianie | +1 | przez 3 tury (`dobra_wola_tur`); patrz rozbieżność w Historii |
| Sąsiedztwo granicą, Kamień | −3 | wspólna granica lądowa; wstrzymane w karencji po pokoju lub rozejmie |
| Sąsiedztwo granicą, Brąz | −4 | wyższa epoka pary; wstrzymane w karencji po pokoju lub rozejmie |
| Sąsiedztwo granicą, Żelazo | −5 | wyższa epoka pary; wstrzymane w karencji po pokoju lub rozejmie |
| Uraz historyczny | −2 | |
| Nieautoryzowany przemarsz | −5 | |

Religia nie wpływa na Zaufanie: wspólna i odmienna religia nie dają już wartości na turę (klucze w JSON mają wartość 0; patrz Historia).

**Ustawiane wartości po umowie:** po zawarciu **rozejmu** Zaufanie pary wynosi **10**, po **pokoju** — **20**. Wartość jest ustawiana od razu w chwili zawarcia (rozejm → pokój daje 20).

Uwagi do tabeli: osobnego tieru „pokój” (+1) w grze nie ma — jego miejsce zajął dryf z Wiarygodności (patrz hasło **Wiarygodność**), więc para bez paktu i sojuszu nie dostaje stałego plusu za sam kontakt pokojowy. Parametr `aktywnyPakt` był wycofany w 2026-07 i nie wpływa na grę. Szpieg wykryty (−15, `szpiegWykryty_zaufanie`) nie ma wywołania w grze i został usunięty z tabeli Parametry.

### Zdarzenia jednorazowe

| Zdarzenie | Zmiana Zaufania |
|-----------|-----------------|
| Zawarcie umowy handlowej | 0 — brak stałego bonusu; Zaufanie rośnie tylko z nadmiaru PN w umowie |
| Dar (prezent) | 0 stałego — Zaufanie liczy się z wartości PN daru, z limitem na turę (+5) |
| Pomoc sojusznikowi w wojnie | +10 (zdefiniowane w kodzie; w grze nie jest jeszcze wywoływane) |
| Wspólny wróg (nawiązanie) | +5 (zdefiniowane w kodzie; w grze nie jest jeszcze wywoływane) |
| Złamany pakt (gracz) | −40 |
| Złamany pakt (AI) | −20 |
| Zdrada | −50 (zdefiniowane w kodzie; w grze nie jest jeszcze wywoływane) |
| Szpieg wykryty | nie działa: brak zdarzenia w grze (wartość tylko w definicji `diplomacy.ts`) |
| Zerwanie traktatu dobrowolnie | −15 |

### Progi umów zależne od Zaufania

| Umowa | Zaufanie | Relacja |
|-------|----------|---------|
| Pakt o nieagresji | ≥ 30 | ≥ 110 |
| Sojusz | ≥ 90 | ≥ 130 |
| Wymiana technologii | ≥ 70 | — |
| Handel | — | ≥ 0 |

### Wartość startowa

Start: **20** (każda para, niezależnie od poziomu trudności).

### Wpływ Wiarygodności

Wiarygodność (reputacja dotrzymywania słowa, patrz hasło **Wiarygodność**) działa jak mnożnik tempa: przy dodatniej wiarygodności Zaufanie rośnie szybciej, a przy ujemnej spada szybciej. Dodatkowo co turę działa dryf około ±3 (wiarygodność × 0,03).

### Zasady zatwierdzone, jeszcze niewdrożone

Zasady dotyczące Zaufania z decyzji właściciela 2026-11-13 zostały wdrożone (kara za sąsiedztwo −3/−4/−5 z wstrzymaniem w karencji, religia bez wpływu, ustawienie 10/20 po rozejmie i pokoju) i opisane wyżej w obecnych regułach. Dalsze zasady (siła militarna, wypowiadanie wojny, rozejm i pokój, etykiety nastawienia) są w haśle **Wypowiedzenie wojny** i **Rozejm i pokój**.

---

## Przykład liczbowy

Dwie cywilizacje mają Zaufanie 20 i Respekt 30 (Relacja 50, czyli „Neutralny"). Zawierają umowę handlową: bez jednorazowego bonusu, potem +1 co turę z handlu (plus dryf z Wiarygodności, jeśli jest dodatni). Po 10 turach handlu Zaufanie wynosi około 20 + 10 = 30, co już pozwala na pakt o nieagresji pod względem Zaufania (≥ 30), jeśli Relacja osiągnie 110.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §74

---

## Parametry

Każda liczba w tabeli jest sprawdzana testem `gra/tools/diplo-civpedia-values-test.cjs` względem wskazanego pliku.

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 20 | `diplomacy.json:params.startZaufanie` |
| 30 | `diplomacy.json:params.progNapZaufanie` |
| 90 | `diplomacy.json:params.progSojuszZaufanie` |
| 70 | `diplomacy.json:params.progWymianaTechZaufanie` |
| 1 | `diplomacy.json:params.handel_zaufanie_perTura` |
| 3 | `diplomacy.json:params.sojusz_zaufanie_perTura` |
| 2 | `diplomacy.json:params.nap_zaufanie_perTura` |
| 1 | `diplomacy.json:params.wspolnyWrog_zaufanie_perTura` |
| 0 | `diplomacy.json:params.wspolnaReligia_zaufanie_perTura` (religia bez wpływu) |
| 0 | `diplomacy.json:params.odmiennaReligia_zaufanie_perTura` (religia bez wpływu) |
| -3 | `diplomacy.json:params.ekspansjaGranica_zaufanie_perTura` |
| -4 | `diplomacy.json:params.ekspansjaGranicaBraz_zaufanie_perTura` |
| -5 | `diplomacy.json:params.ekspansjaGranicaZelazo_zaufanie_perTura` |
| 10 | `diplomacy.json:params.rozejm_zaufanie_ustawienie` (ustawienie po rozejmie) |
| 20 | `diplomacy.json:params.pokoj_zaufanie_ustawienie` (ustawienie po pokoju) |
| -2 | `diplomacy.json:params.urazyHistoryczne_zaufanie_perTura` |
| 5 | `diplomacy.json:params.karaPrzemarszNieautoryzowany_zaufanie_perTura` (wartość kary; w grze odejmowana: −5 na turę) |
| 10 | `diplomacy.json:params.pomocSojusznikowi_zaufanie` |
| 5 | `diplomacy.json:params.wspolnyWrogNawiazanie_zaufanie` |
| -40 | `diplomacy.json:params.zlamanaPaktGracz_zaufanie` |
| -20 | `diplomacy.json:params.zlamanaPaktAI_zaufanie` |
| -50 | `diplomacy.json:params.zdrada_zaufanie` |
| -15 | `kod:zerwanie-traktatu` |
| 0.03 | `diplomacy.json:params.wiarygodnoscZaufanieDryfNa100` |
| 1 | `diplomacy.json:params.dobraWola_zaufanie_perTura` |

| 5 | `diplomacy.json:pn_relacja.max_zaufanie_na_ture` (limit Zaufania z PN na turę: handel i dar) |

Uwaga: wartości `handelZawarcie_zaufanie` (+2) i `dar_zaufanie` (+6) oraz `aktywnyPakt_zaufanie_perTura` (+1) istnieją w `diplomacy.ts` (DIPLOMACY_PARAMS), ale nie są czytane przez grę (zdarzenia `handel` i `dar` dają dZ = 0, `computeTickZaufanieDelta` nie używa aktywnego paktu). Nie są podane w tabeli jako obowiązujące.

Uwaga: wiersz `kod:` (−15 za dobrowolne zerwanie traktatu) nie ma klucza w `params`; wartość jest wpisana w `diplomacy.ts` (zdarzenie `zerwanie_traktatu`) i test sprawdza ją względem kodu.

---

## Historia / decyzje

Runda 2 (orkiestrator, DECYZJA WŁAŚCICIELA 2026-11-13, wdrożona w kodzie w 478cefaed, FALA 679): kara za sąsiedztwo −3/−4/−5 (wcześniej −2/−3/−4) z wstrzymaniem w karencji po pokoju lub rozejmie (`main.ts`, `karaWspolnaGranicaDelta`); religia usunięta z wpływu na Zaufanie (wcześniej ±0,5 na turę, wiersze usunięte z tabel obecnych zmian); po rozejmie Zaufanie = 10, po pokoju = 20 (`main.ts`, `finalizePeaceTreatyBetween`, `rozejm_zaufanie_ustawienie` / `pokoj_zaufanie_ustawienie`). Kod: `diplomacy.ts` `sharedBorderPenaltyForEpochs` (linie 608–610), `computeTickZaufanieDelta`.

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Runda 2 (obrona Operatora, zarzuty 1–3): usunięto z opisu martwe źródła (handel +2, dar +6, aktywny pakt +1) i poprawiono zdanie o sumowaniu tierów; kod: `diplomacy.ts` case 'handel' i 'dar' (dZ = 0), `computeTickZaufanieDelta` (switch tieru: sojusz/nap). Sekcja „Zasady zatwierdzone, jeszcze niewdrożone” wynika z DECYZJI WŁAŚCICIELA 2026-11-13.

Rozbieżność do wyjaśnienia: dodatek podawał czas dobrej woli 5 tur, a `diplomacy.json` (`dobra_wola_tur`) ma 3. Hasło podaje 3 (wartość z kodu).
