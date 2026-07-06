# Auto-walka na mocy armii — propozycja algorytmu

**Decydent:** Maciej · **Status:** PROPOZYCJA (ABC) · **2026-06-30**  
**Powiązane:** `docs/WALKA-TW-v3.md` · `gra/tools/intrinsic-unit-power.py` · `gra/tools/auto-battle-power.py`

---

## 1. Zasady ogólne (ustalone)

| # | Zasada |
|---|--------|
| 1 | **Moc jednostki** M = A + O (intrinsic, bez wroga) |
| 2 | **Moc armii** = suma M jednostek w składzie bojowym |
| 3 | **Zwycięzca** = strona z **większą** sumą M |
| 4 | **Oblężenie ≠ pole** — Wieża, Taran, Katapulta (`Rola = Oblężnicza`) **nie wchodzą** w moc przy walce dwóch armii na polu |
| 5 | Przy **oblężeniu miasta** — **osobny wzór A i O** (§2b); na polu oblężnicze **nie wchodzą** do sumy |

---

## 2. Moc jednostki — walka **polna**

```
A = AP + Obraż + Przeb + Szarża/2 + AD/2
O = OBR + Panc + HP/2
M = A + O
```

Skróty: AP, OBR, Obraż, Panc, Przeb, Szarża, HP, AD — patrz `WALKA-TW-v3.md`.

---

## 2b. Moc jednostki — tryb **oblężenie umocnień** (decyzja Maciej **2A**)

**Tylko atak na mur/bramę.** Na polu (armia vs armia) oblężnicze **w ogóle nie wchodzą** do sumy M.

```
A_siege = wallAttack + AD        // AD tylko gdy > 0 (Katapulta vs obrońcy)
O_siege = OBR + Panc + HP/10
M_siege = A_siege + O_siege
```

| Jednostka | wallAttack | AD | A_siege | O_siege | M_siege |
|-----------|----------:|---:|--------:|--------:|--------:|
| Katapulta | 16 | 8 | 24 | 12.5 | **36.5** |
| Taran | 12 | 0 | 12 | 36 | **48** |
| Wieża | 8 | 0 | 8 | 46 | **54** |

`wallAttack` w `units.json` — kalibracja w Excelu (`TW-dystans-edycja.xlsx`). Taran/Wieża: wartości robocze 2026-06-30.

Implementacja: `gra/tools/unit_power.py` · `--siege-ranking`.

---

## 3. Kto wchodzi do sumy M (walka polna)

| Wchodzi | Nie wchodzi (pole) |
|---------|---------------------|
| Piechota, konnica, rydwany, strzelcy, super-y | **Katapulta, Taran, Wieża oblężnicza** |
| Jednostki w `collectBattleRoster` (kotwica + sąsiedztwo 1 hex) | **Galera** — wchodzi na lądzie normalnie (decyzja **A** 2026-06-30) |

**Filtr techniczny:** `Rola (linia) !== "Oblężnicza"`.

---

## 4. Rozstrzygnięcie wyniku

```
M_atk = suma M (atakujący, bez oblężenia)
M_def = suma M (obrońca, bez oblężenia)

jeśli M_atk > M_def  → zwycięzca: ATK
jeśli M_def > M_atk  → zwycięzca: DEF
jeśli M_atk == M_def → remis (patrz §6C)
```

---

## 5. Straty — propozycja A (rekomendowana)

**Idea:** im większa przewaga zwycięzcy, tym **mniejszy** % mocy traci zwycięzca. Przegrany traci **całą armię** (wipe składu na mapie).

### Stosunek sił

```
R = M_winner / max(M_loser, 1)     // R ≥ 1
```

### Straty zwycięzcy (% utraconej mocy M)

```
loss_win = clamp( L_MAX / R^p , L_MIN , L_MAX )
```

| Parametr | Propozycja | Sens |
|----------|------------|------|
| **L_MAX** | **0.45** | przy równych armiach (R=1) zwycięzca traci ~45% mocy |
| **L_MIN** | **0.05** | przy crush (R duże) zwycięzca traci min. ~5% mocy |
| **p** | **0.75** | krzywa: umiarkowana (nie za łagodna) |

### Straty przegranego

```
loss_lose = 1.0    // 100% — armia znika z heksa
```

### Przykłady (propozycja A)

| M_ATK | M_DEF | R | Zwycięzca | Strata zwycięzcy | Strata przegranego |
|------:|------:|--:|-----------|-----------------:|-------------------:|
| 100 | 100 | 1.0 | remis* | ~45% | ~45% |
| 120 | 100 | 1.2 | ATK | ~39% | 100% |
| 150 | 100 | 1.5 | ATK | ~33% | 100% |
| 200 | 100 | 2.0 | ATK | ~27% | 100% |
| 300 | 100 | 3.0 | ATK | ~19% | 100% |
| 500 | 100 | 5.0 | ATK | ~13% | 100% |
| 1000 | 100 | 10.0 | ATK | ~8% | 100% |

\* Remis — patrz decyzja ABC §6C.

Symulator: `python gra/tools/auto-battle-power.py --curve|--demo|--scenarios|--fight "ATK" "DEF"`

---

## 6. Decyzje ABC dla Macieja

### 6A — Krzywa strat zwycięzcy

| Opcja | Opis |
|-------|------|
| **A** | `loss_win = clamp(0.45 / R^0.75, 0.05, 0.45)` — **rekomendacja** |
| **B** | Łagodniejsza: `L_MAX=0.35`, `p=0.6` (mniej strat przy małej przewadze) |
| **C** | Ostra: `L_MAX=0.55`, `p=1.0` (linearne 1/R — więcej strat) |

### 6B — Przegrany zawsze wipe?

| Opcja | Opis |
|-------|------|
| **A** | **100%** — cała armia znika (proste, Civ-like auto) — **rekomendacja** |
| **B** | Przy R < 1.2 przegrany może mieć **1 ocalałą** jednostkę (najsilniejszą) |
| **C** | Straty przegranego też z krzywej: `loss_lose = min(1, 0.5 + 0.5/R)` |

### 6C — Remis M_atk == M_def

| Opcja | Opis |
|-------|------|
| **A** | Obie strony **~40%** strat, nikt nie wyparty — **rekomendacja** |
| **B** | Losowy zwycięzca + straty jak R=1.1 |
| **C** | Remis formalny — obie armie zostają, 0 strat (nudne) |

### 6D — Jak rozłożyć straty na jednostki?

| Opcja | Opis |
|-------|------|
| **A** | **Proporcjonalnie** — każda jednostka traci ten sam % HP (zaokr. w dół); HP=0 → śmierć — **rekomendacja** |
| **B** | Usuwaj **najsłabsze** jednostki (najniższe M) aż „spalona” moc = loss × M_armii |
| **C** | Tylko liczba sztuk: usuń ceil(n × loss) losowych jednostek |

---

## 7. Wpięcie w grę (po ABC)

1. `gra/src/game/auto-battle-power.ts` — `armyPower()`, `resolveAutoBattleByPower()`
2. `main.ts` — ścieżka auto-walki mapy: zamiast / obok `resolveCombat` 1v1
3. HUD pre-bitwa: pokazać **M_ATK vs M_DEF** i szacowane straty %
4. **NIE** ruszać `resolveCombat` / bitwy taktycznej 3D w tym batchu

---

## 8. Oblężenie vs pole

| Tryb | Oblężnicze w sumie M? | Wzór |
|------|------------------------|------|
| **Pole** (armia vs armia) | **NIE** | §2 |
| **Oblężenie** (mur, brama) | **TAK** | §2b (`M_siege`) |

Piechota przy szturmie: nadal **M_pole** (§2). Katapulta/Taran/Wieża: **M_siege**.

---

## 9. Pliki

| Plik | Rola |
|------|------|
| `docs/AUTO-WALKA-MOC-ALGORYTM.md` | ten dokument |
| `gra/tools/auto-battle-power.py` | symulator + ranking pola (bez oblężenia) |
| `gra/tools/intrinsic-unit-power.py` | M jednostki + `--field` bez oblężenia |

**Źródło operacyjne:** `docs/WALKA-TW-v3.md` · `gra/src/game/unit-power.ts`

---

## 10. Decyzje Maciej — sesja ABC auto-walka (2026-06-30)

| Krok | Decyzja |
|------|---------|
| **1 Zakres** | **B** — wszystko oprócz bitwy 3D ręcznej (mapa + AI + barbarzyńcy) |
| **2 Skład** | **A** — kotwica + ring 1 hex (`collectBattleRoster`) |
| **3 Filtr** | **D** — OUT: Oblężnicza + Zwiadowca + Osadnik |
| **4 Modyfikatory** | **C** — M_obrońcy × **teren**; na hexie **miasta** dodatkowo × **mur** (oba liczone) |
| **5 Werdykt** | **B** — przy R < 1.15 (~20% upset słabszego) |
| **6 Remis** | **A (straty) + B (ruch)** — ~40% strat obu stron; ruch: **obie strony fan-out −1 heks** (wyjątek: heks centrum miasta) |
| **7 Straty zw.** | **B** — łagodniejsza krzywa (L_MAX≈0.35); **strojenie współczynników na końcu sesji** |
| **8 Straty przegr.** | **Maciej §8b (2026-06-30)** — **pole:** straty z krzywej × wagi linii (**nie** auto-wipe) + reguły ruchu poniżej · **hex centrum miasta:** obrońca przegrany = **wipe 100%** |
| **9 Rozkład strat** | **B** — ważone wg linii: front max, konnica średnio, dystans min (szczegóły §9b) |
| **10 UI pre-bitwa** | **B+A** — **must:** M_ATK vs M_DEF · **nice:** szacunek % strat + lista jednostek z M/szt. · **out:** hit% TW (tylko bitwa 3D) |
| **11 Zakres wdrożenia** | **A** — wszystkie auto-ataki na hex wroga (otwarte pole + hex miasta z garnizonem); skład z ringu 1 hex |
| **12 Playtest** | **C** — rozszerzona lista (patrz §12) |

### 12. Scenariusze akceptacji playtest (Maciej 2026-06-30)

| # | Scenariusz | Co sprawdzamy |
|---|------------|---------------|
| 1 | 10× Hastati vs 10× Falanga | ATK wygrywa; straty ~krzywa R≈1.1; front > konnica > dystans |
| 2 | Remis (R≈1.0) | ~40% strat obu stron; **fan-out −1 heks** obie strony (wyjątek: heks centrum miasta) |
| 3 | Katapulta w stacku | Nie w M_pole; UI „pominięta” |
| 4 | Upset (R<1.15) | ~20% szans słabszego; potem reguły ruchu jak wygrana/przegrana |
| 5 | Obrońca — 1. porażka w turze | Odskok 1 hex; atakujący na hex celu |
| 6 | Obrońca — 2. porażka w turze | Wipe 100%; brak drugiego odskoku |
| 7 | Atakujący przegrał | Cofnięcie na pole startowe ze stratami |
| 8 | Hex miasta z garnizonem | M_def × **teren** × **mur** (krok 4C); ten sam algorytm co pole |

### 9b. Rozkład strat na jednostki (Maciej 2026-06-30)

Bazowy `loss_pct` z krzywej (krok 7) mnożymy **wagą linii** na HP każdej jednostki:

| Linia (`Rola`) | Mapowanie | Waga straty |
|----------------|-----------|-------------|
| **Front** | Wręcz | **1.0×** (najwięcej) |
| **Konnica** | Flanka (+ Rydwany) | **0.5×** (średnio) |
| **Dystans** | Dystans | **0.25×** (najmniej) |
| **Morska** | Morska | **0.5×** (jak konnica) |

```
loss_unit = min(1, loss_pct × waga_lini)
HP_po = max(0, HP_przed × (1 - loss_unit))
```

Przykład przy `loss_pct = 30%`: Hastati (Wręcz) −30% HP · Konnica (Flanka) −15% HP · Łucznik (Dystans) −7.5% HP.

Średnia strat armii ≈ `loss_pct` (normalizacja po składzie — implementacja UNITS).

**Względem 6D-A:** nadal % HP per jednostka, ale **niesymetrycznie** wg roli — nie losowo, nie „najsłabsze giną pierwsze”.


**Atakujący przegrał:** wraca na **pole startowe** ze stratami (nie wipe).

**Obrońca wygrał:** zostaje na miejscu; atakujący cofa się na pole startowe ze stratami.

**Atakujący wygrał:**
- **Zamiana pól:** atakujący wchodzi na hex obrońcy.
- Obrońca (jeśli coś zostało) **odskakuje o 1 hex** w kierunku **przeciwnym do ataku** (najdalej od centroidu składu atakującego).
- Jeśli atakujący ma **punkty ruchu** — może **kontynuować atak** aż do całkowitego zniszczenia wroga.

**Limit obrońcy w turze:** pierwsza porażka w turze = odskok; **druga porażka w tej samej turze** = **całkowite zniszczenie** (nie drugi odskok).

**Oblężenie / walka w mieście:** obrońca przegrany = **100% wipe** (bez odskoku).

### Otwarte luki (do domknięcia w kolejnych krokach)

- Brak wolnego heksa na odskok (otoczenie, woda, wróg).
- Stack wielu jednostek — zamiana hexów vs cały skład.
- Remis (krok 6) + reguły ruchu — spójność z „powrotem na start”.
- Upset (krok 5B) — te same reguły ruchu co przy normalnej wygranej?
- Koszt ruchu: ile MP zużywa kolejny atak w tej samej turze.
- Barbarzyńcy / AI — ta sama logika odskoku i limit 2× w turze.

---

## 13. Macierz sytuacji na mapie (analiza — 2026-06-30)

**Cel:** dla każdej sytuacji × wyniku ustalić: straty, ruch po hexach, przejęcie miasta, MP, wyjątki.

**Stałe we wszystkich komórkach (ustalone wcześniej):**
- Hex bitwy = **hex, na który atakuje kotwica** (obrońca broni tego hexa).
- Skład = kotwica + **ring 1 hex** (bez Oblężnicza, Zwiadowca, Osadnik).
- Werdykt = suma **M** (+ mnożnik terenu obrońcy; na hexie miasta: mur/teren).
- Straty = krzywa krok 7 × wagi linii krok 9b.
- Upset ~20% przy R < 1.15 — **po werdykcie** stosujemy reguły jak dla normalnej wygranej/przegranej (do potwierdzenia).

---

### Macierz 1 — Rodzaje sytuacji (4 konteksty)

| ID | Sytuacja | Kto jest kim | Hex bitwy | Różnica vs reszta |
|----|----------|--------------|-----------|-------------------|
| **P-ATK** | **Atak na otwartym polu** | Ty atakujesz wroga na łące/lasie/wzgórzu | Hex, na którym stoi obrońca (ląd) | Brak muru miasta; obrońca może **odskoczyć** po porażce |
| **P-DEF** | **Obrona na otwartym polu** | Wróg atakuje twój hex | Ten sam hex co P-ATK | **Ta sama mechanika** co P-ATK — tylko perspektywa stron zamieniona |
| **M-ATK** | **Atak na hex miasta** | Ty atakujesz hex z miastem wroga (garnizon / wojska) | Hex **centrum miasta** | M_obrońcy × teren + mur; po wygranej ATK — **przejęcie miasta od razu** (M×W+ A) |
| **M-DEF** | **Obrona miasta** | Wróg atakuje twój hex miasta | Hex centrum twojego miasta | **Ta sama mechanika** co M-ATK; obrońca przegrany = **wipe 100%** (krok 8) |

> **Uwaga:** P-ATK i P-DEF to **jedna bitwa** — dwa opisy tego samego zdarzenia. Tak samo M-ATK i M-DEF. W Macierzy 2 wystarczy wiersze **P** (pole) i **M** (miasto); kolumny mówią, co dzieje się z **atakującym** i **obrońcą**.

**Poza tą macierzą (batch późniejszy):** oblężenie „z zewnątrz” (stoisz obok muru, jeszcze nie atakujesz hexu — Katapulta, panel oblężenia). Tu: tylko **auto-atak na hex wroga** (krok 11A).

---

### Macierz 2 — Wynik bitwy (3 kolumny)

| ID | Wynik | Z perspektywy atakującego |
|----|-------|---------------------------|
| **W+** | **Atakujący wygrywa** | Twoja armia „wygrywa werdykt” (M lub upset) |
| **W−** | **Atakujący przegrywa** | Przeciwnik broni hexu |
| **R** | **Remis** | M_atk ≈ M_def (krok 6) |

---

### Macierz 3 — Siatka 2×3 (pole + miasto × wynik)

Legenda komórki: **Straty ATK** · **Straty DEF** · **Ruch ATK** · **Ruch DEF** · **Miasto** · **Status**

#### POLE (otwarty teren)

| | **W+ ATK wygrywa** | **W− ATK przegrywa** | **R remis** |
|---|-------------------|---------------------|-------------|
| **Straty ATK** | % z krzywej zwycięzcy (krok 7B) × wagi linii | % jak przegrany (krok 8 — **nie** 100% wipe) × wagi | ~40% obu (krok 6) |
| **Straty DEF** | % jak przegrany; **nie** auto-wipe — reszta może przeżyć | % jak zwycięzca × wagi | ~40% obu |
| **Ruch ATK** | ✅ Wchodzi na hex obrońcy | ✅ Cofka na **pole startowe** | ✅ Fan-out −1 heks |
| **Ruch DEF** | Fan-out −1 heks (ocalali) | **Zostaje** | Fan-out −1 heks |
| **Straty** | krzywa zw./przegr. × wagi linii | j.w. (ATK nie wipe) | ~40% obu × wagi |
| **MP** | atak = 1 punkt; reszta zostaje | atak = 1 punkt; reszta zostaje | — |
| **Status** | ✅ ustalone | ✅ ustalone | ✅ ustalone |

#### MIASTO (hex centrum miasta)

| | **W+ ATK wygrywa** | **W− ATK przegrywa** | **R remis** |
|---|-------------------|---------------------|-------------|
| **Straty ATK** | % zwycięzcy × wagi | % przegranego × wagi (nie wipe) | ~40% obu |
| **Straty DEF** | **100% wipe** obrońcy **na heksie miasta**; w pierścieniu — straty z krzywej × wagi (krok 8) | % zwycięzcy × wagi | ~40% × wagi |
| **Ruch ATK** | Prowadząca wchodzi na hex miasta; wspierające zostają | Cofka grupowo na pole startowe | Fan-out −1 heks (ATK) |
| **Ruch DEF** | Obrońca na heksie miasta: likwidacja; **w pierścieniu: fan-out −1 heks** (B, 2026-06-26) | Zostaje w mieście | Fan-out −1 heks; wyjątek: na heksie miasta **zostaje** |
| **Miasto** | **Przejęcie** od razu (M×W+ A) | Bez zmiany właściciela | Bez zmiany |
| **MP / dalszy atak** | atak = 1 punkt; reszta zostaje | atak = 1 punkt; reszta zostaje | — |
| **Status** | ✅ ustalone | ✅ ustalone | ✅ ustalone |

---

### Macierz 4 — Warstwa dodatkowa (nakładka na W− / W+)

Te reguły **modyfikują** komórki powyżej — ustalimy w osobnych krokach:

| ID | Warunek | Pytanie do Macieja |
|----|---------|-------------------|
| **L1** | Obrońca — **1. porażka w tej turze** | Odskok 1 hex (pole) — potwierdzić kierunek, stack |
| **L2** | Obrońca — **2. porażka w tej turze** | Wipe 100% nawet na polu? (dziś: tak na polu też) |
| **L3** | **Brak wolnego heksa** na odskok | Wipe? Wbita w wraca? Losowy hex dalej? |
| **L4** | **Stack** wielu jednostek ATK na starcie | Cały skład cofa się / wchodzi razem? |
| **L5** | **Upset** (słabszy wygrywa) | Te same reguły ruchu co W+ / W−? |
| **L6** | Tylko **milicja** (garnizon, brak wojsk) | Osobna ścieżka czy jak M-ATK? |

---

### Proponowana kolejność ABC (krok po kroku)

1. **P × W+** — atakujący wygrywa na polu (straty + wejście + odskok DEF + MP)
2. **P × W−** — atakujący przegrywa na polu (cofka + kto zostaje)
3. **P × R** — remis na polu (spójność z krokiem 6)
4. **M × W+** — przejęcie miasta + wipe DEF + wejście ATK
5. **M × W−** — obrona miasta utrzymana
6. **M × R** — remis przy murze
7. **Warstwa L1–L6** — wyjątki

**Następny krok:** pytanie **1 — P × W+** (atak na polu, atakujący wygrywa).

### 13a. Decyzje macierzy (sesja 2026-06-30)

| Komórka | Temat | Decyzja |
|---------|-------|---------|
| **P × W+** | Ruch po wygranej atakującego | **Maciej §13b** — prowadząca wchodzi na heks obrońcy; wspierające **zostają**; obrońcy uciekają fan-out o 1 heks (ten sam kierunek) |
| **P × W+** | Odskok obrońcy | Fan-out (§13b); brak heksa → walczy dalej; 2. porażka w turze = zniknięcie |
| **P × W+** | Punkty ruchu po ataku | **B** — atak zużywa **1 punkt ruchu**; reszta limitu = dalszy ruch lub kolejny atak w tej turze |
| **P × W+** | Brak heksa na odskok | **Maciej** — obrońca **zostaje i walczy dalej**; przy **drugiej porażce w tej samej turze** znika (reguła dwóch bitew) |
| **P × W−** | Ruch po przegranej atakującego | **§8b** — **cały skład** cofa się **grupowo na pole startowe**; obrońca zostaje (playtest #7) |
| **P × W−** | Punkty ruchu po przegranej | **A** — atak zużył 1 punkt ruchu; reszta limitu zostaje (może inny cel lub ruch) |
| **P × R** | Ruch po remisie | **B** — **obie strony** fan-out **−1 heks** (grupowo); wyjątek heks centrum miasta |
| **M × W+** | Przejęcie miasta | **A** — po wygranej auto-walki miasto **od razu** przechodzi na atakującego |
| **M × W+** | Ruch po wygranej | **Maciej** — **tylko jednostka prowadząca** wchodzi na heks miasta; wspierające ATK zostają (jak na polu) |
| **M × W+** | Obrońca w pierścieniu po przejęciu | **B** (2026-06-26) — ginie **tylko** obrońca na heksie centrum; wojska w pierścieniu **fan-out −1 heks** (jak pole) |
| **M × W−** | Ruch po przegranej | **Maciej** — jak pole: **cały skład** atakującego cofa się grupowo na pole startowe; obrońca zostaje w mieście (bez bonusu) |
| **M × R** | Straty | **A** — jak pole: ~40% wytrzymałości obu stron (z wagami linii) |
| **M × R** | Ruch po remisie | **Maciej** — jak pole (obie strony −1 heks), **wyjątek:** jednostka stojąca **na heksie miasta** zostaje w miejscu |
| **L6** | Tylko milicja (garnizon) | **A** — normalna bitwa; milicja w sumie mocy jak zwykła jednostka |
| **L5** | Niespodzianka (upset) | **A** — po losowaniu pełne reguły macierzy (wygrana/przegrana jak normalnie) |

### 13b. Kanoniczna reguła ruchu — skład atakujący vs obrońca (Maciej, doprecyzowanie)

**Skład bitewny (obie strony):**
- **Atakujący:** jednostka prowadząca (wychodzi z heksa startowego ataku) + jednostki wspierające w pierścieniu 1 heks wokół prowadzącej.
- **Obrońca:** jednostka na **heksie bitwy** (hex broniony) + jednostki wspierające obrońcy w pierścieniu 1 heks wokół tego heksa.

**Ograniczenie mapy:** na jednym heksie **nie łączymy** wielu jednostek tej samej strony (brak stacka).

#### Wygrana atakującego (pole i miasto — ta sama logika ruchu)

| Strona | Co robi |
|--------|---------|
| **Prowadząca atakująca** | Wchodzi na **heks bitwy** — miejsce, na którym wcześniej stał broniący się obrońca. |
| **Wspierające atakujące** | **Zostają** na swoich heksach — **nie ruszają się**. |
| **Obrońca (wszyscy ocalały)** | **Ucieczka grupowa o 1 heks** **od atakujących** (nie losowo): heks sąsiedni bitwy najdalej od centroidu ATK; prowadzący + wspierający fan-out w **tym samym** kierunku. Brak heksa → walczy dalej; 2. porażka w turze = zniknięcie. |

**Miasto (dodatkowo):** po wygranej → przejęcie miasta; obrońca **na heksie miasta** = likwidacja 100% (bez odskoku); wojska obrońcy **w pierścieniu fan-out −1 heks** (B, 2026-06-26) — patrz §13a M×W+.

#### Ustalone (symetria przegranej / remisu — §14)

Przegrana ATK: **cały skład** cofa się grupowo na pole startowe. Remis: **obie strony** fan-out −1 heks; wyjątek heks centrum miasta (zostaje).

---

## 14. Kanon ruchu jednostek po walce (Maciej — audyt 2026-06-30)

**Zastosowanie:** identycznie dla auto-walki (M), bitwy ręcznej 3D i AI — różni się tylko **werdykt**, nie **skutki na mapie**.

**Skład:** prowadząca + wspierające w pierścieniu 1 heks (obie strony). **Brak stacka** — na jednym heksie max 1 jednostka.

**Mechanizm ucieczki (fan-out):** kierunek = **od atakujących** (sąsiedni heks bitwy najdalej od centroidu składu ATK); remis: DEF od ATK, ATK w stronę własnej linii. Prowadząca strony na pierwszy wolny heks; wspierający na kolejne wolne heksy **w tym samym kierunku**.

### Macierz 2×3 — ruch jednostek (USTALONE)

| | **Wygrywa atakujący** | **Przegrywa atakujący** | **Remis** |
|---|----------------------|-------------------------|-----------|
| **Prowadząca ATK** | Wchodzi na heks bitwy | Cofnięcie **grupowo na pole startowe** | Fan-out −1 heks |
| **Wspierające ATK** | **Zostają** | Cofnięcie **grupowo na pole startowe** | Fan-out −1 heks |
| **Obrońca (heks bitwy)** | Fan-out −1 heks (ocalali) | **Zostaje** | Fan-out −1 heks |
| **Wspierające DEF** | Fan-out −1 heks (ocalali) | **Zostają** | Fan-out −1 heks |
| **Straty** | krzywa zw./przegr. × wagi linii | j.w. (ATK nie wipe) | ~40% obu × wagi |
| **MP** | atak = 1 punkt; reszta zostaje | atak = 1 punkt; reszta zostaje | atak = 1 punkt; reszta zostaje |

**Pole i miasto — ta sama tabela**, z wyjątkami miasta poniżej.

### Wyjątki miasta (M)

| Sytuacja | Dodatkowa reguła |
|----------|------------------|
| **Wygrywa ATK** | Miasto **od razu** przechodzi na atakującego; obrońca **na heksie miasta** = 100% likwidacja; wojska w **pierścieniu** = **fan-out −1 heks** (B, 2026-06-26) |
| **Przegrywa ATK** | Właściciel miasta bez zmian |
| **Remis** | Jak pole (fan-out −1 heks), **wyjątek:** jednostka **na heksie centrum miasta** **zostaje** |
| **Tylko milicja** | Normalna bitwa (milicja w sumie mocy) |

### Wyjątki uniwersalne (L1–L5 — USTALONE)

| ID | Reguła |
|----|--------|
| **L3** | Brak heksa na ucieczkę obrońcy → **zostaje, walczy dalej**; 2. porażka w tej samej turze = zniknięcie |
| **L2** | 2. porażka obrońcy w turze = 100% likwidacja (nawet na polu) |
| **L5** | Niespodzianka (~20%): potem pełne reguły wygranej / przegranej |
| **L4** | Stack rozwiązany: tylko prowadząca wchodzi; wspierający zostają |

### ✅ Audyt żółtych A–E (2026-06-30)

| ID | Temat | Decyzja |
|----|--------|---------|
| **A** | Teren w werdykcie | **C** — teren × M_obrońcy; mur **osobno** na hexie miasta |
| **B** | Straty przegranego na polu | **§8b** — straty z krzywey × wagi (**nie wipe**); wipe 100% **tylko** obrońca na hexie centrum miasta |
| **C** | Galera na lądzie | **A** — wchodzi do M_pole normalnie |
| **D** | Mur + teren w mieście | **Maciej** — liczymy **oba**: bonus **terenu** i bonus **muru** obronnego |
| **E** | MP po remisie | **A** — atak = 1 punkt ruchu; reszta zostaje |

**Wzór M_def na hexie miasta:** `M_def_effective = M_def_suma × mnożnik_terenu × mnożnik_muru` (implementacja: współczynniki z danych mapy/miasta).

| # | Temat | Werdykt |
|---|--------|---------|
| **1** | Przegrana ATK — ruch | **§8b + playtest #7:** cofnięcie **grupowo na pole startowe**. „Odskok 1 heks” = remis lub ucieczka obrońcy, nie przegrana ATK. |
| **2** | Pierścień obrońców po przejęciu miasta | **B** (2026-06-26) — ginie tylko obrońca na heksie centrum; pierścień **fan-out −1 heks** (jak pole). *Poprzedni zapis „zostają” (2026-06-30) — skorygowany.* |
| **5** | Remis — ruch | **B** — obie strony fan-out −1 heks; wyjątek heks centrum miasta |
| **3** | Krzywa strat | **Kalibracja v2b (2026-06-30):** zwycięzca `L_MAX/R^p`; przegrany **lustro** `1−L_MAX/R^p` |
| **4** | Oblężenie z zewnątrz | **Krok 11A + §13:** poza tym batchem |

**Uwaga implementacyjna:** dziś `applyCityCaptureToMap` usuwa jednostki wroga w promieniu 1 heks — **do zmiany** zgodnie z **B** (tylko heks centrum).

### ✅ Werdykt + straty (osobno od ruchu — USTALONE)

Kroki 1–12 ABC: zakres B, skład A, filtr D, teren **C** (+ mur miasto), upset B, remis 40%+fan-out, krzywa B, straty wg linii B, UI B+A, wdrożenie pole+miasto A, playtest C.

---

## 15. Kalibracja strat v2b (2026-06-30)

**Kanon:** zwycięzca jak v2; przegrany = **lustro** tej samej krzywej (straty rosną z R).

### Wzory (symulator + przyszły `auto-battle-power.ts`)

```
core_atk = L_MAX / R^p_atk     # gdy liczymy stratę ATK (wygrał lub przegrał)
core_def = L_MAX / R^p_def     # gdy liczymy stratę DEF

ATK wygrywa (R = M_ATK/M_DEF):
  loss_atk = clamp( coef_zwyciezca × L_MAX/R^p_atk , … )
  loss_def = min( 1 , coef_przegrany × (1 − L_MAX/R^p_def) )

DEF wygrywa (R = M_DEF/M_ATK):
  loss_def = clamp( coef_zwyciezca × L_MAX/R^p_def , … )
  loss_atk = min( 1 , coef_przegrany × (1 − L_MAX/R^p_atk) )
```

**Panel sterowania** (`gra/data/auto-battle-params.json`):

| Parametr | Co kręcisz | ↑ wyżej | ↓ niżej |
|----------|------------|---------|---------|
| **`coef_zwyciezca`** | **skala** strat zwycięzcy | więcej krwi po wygranej | zwycięzca zostaje silniejszy |
| **`coef_przegrany`** | **skala** strat przegranego | słabsza armia ginie szybciej | więcej ocalańców |
| **`p_atk`** | **kształt** krzywej ATK vs R | szybciej reaguje na przewagę (mniej krwi ATK przy dużym R; więcej strat ATK gdy przegrywa) | wolniej / łagodniej |
| **`p_def`** | **kształt** krzywej DEF vs R | to samo dla obrońcy | łagodniej dla obrońcy |

Domyślnie: coef = **1,0**, p_atk = p_def = **0,58**.

| Parametr | v1 | v2 (wycofany) | **v2b (kanon)** |
|----------|---:|---:|---:|
| L_MAX | 0.35 | 0.42 | **0.42** |
| p | 0.60 | 0.58 | **0.58** |
| Przegrany | `0.5+0.5/R` | `0.30+0.35/R` | **`coef_przegrany×(1−core)`** |
| Panel zwycięzca | — | — | **`coef_zwyciezca`** |

### Tabela R = 1 … 5 (straty = % utraconej mocy M)

| R | Zwycięzca traci | Przegrany traci |
|--:|----------------:|----------------:|
| 1,0 | 40% (remis) | 40% |
| 1,5 | 33% | **67%** |
| 2,0 | 28% | **72%** |
| 3,0 | 22% | **78%** |
| 4,0 | 19% | **81%** |
| 5,0 | 17% | **84%** |

### Playtest #1 — 10× Hastati vs 10× Falanga, R≈1,11

| Strona | Straty | Hastati/Falanga HP (przykład) |
|--------|-------:|------------------------------|
| ATK (zwycięzca) | ~40% | 19 → **12** |
| DEF (przegrany) | ~61% | 25 → **10** |

Symulator: `python gra/tools/auto-battle-power.py --curve|--demo`

**Strojenie (Maciej — bez rozmowy o wzorach):**

1. `panele-sterowania/Panel-C.xlsx` → arkusz **`Auto-walka`**
2. Kolumna **Wartość**:
   - **`coef_*`** — ile krwi (skala, przy każdym R)
   - **`p_atk` / `p_def`** — jak szybko strata zmienia się z przewagą R (kształt)
3. Zapisz Excel → w czacie: **`eksportuj panel C`**
4. Agent odpala `export-c.py` → `gra/data/auto-battle-params.json`

Symulator: od razu. **Gra:** po wdrożeniu `auto-battle-power.ts` (czyta ten sam JSON) + rebuild kanonu przez MASTER.

**Strojenie inżynierskie:** `L_MAX` w tym samym arkuszu (rzadko).

