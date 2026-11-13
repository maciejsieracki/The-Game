# Wiarygodność (dyplomacja)

## Metadane

| id | `wiarygodnosc` |
| tytuł | Wiarygodność |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §74 |
| json_ref | `diplomacy.json`, `diplomacy-credibility.ts` |

---

## Wiki‑S

**Wiarygodność (W)** to globalna reputacja twojego państwa (−100…+100). Wpływa na tempo budowania Zaufania u wszystkich nacji. Sojusz i pakt o nieagresji wymagają **W ≥ 0**. Prezenty dają max **+5 Zaufania/turę** — ten sam limit dla każdego (bez bonusu od wysokiej W).

---

## Wiki‑M

### Czym jest Wiarygodność

W przeciwieństwie do **Zaufania** i **Respektu** (liczone per para dyplomatyczna), **Wiarygodność** jest **jedna na całe imperium** — widoczna dla wszystkich od razu. Mierzy historię dotrzymywania słowa: trwanie traktatów, złamanie paktu, nieautoryzowany przemarsz, pomoc sojusznikowi.

### Pasma (skala −100…+100)

| W | Pasmo |
|---|-------|
| +40…+100 | Wzór cnoty |
| 0…+39 | Uczciwy |
| −39…−1 | Chwiejny |
| −100…−40 | Wiarołomny |

Start: Łatwy **+40** · Normalny **+20** · Trudny **0**.

### Model relacji (FALA 206)

```
Wiarygodność → (tempo) Zaufanie per para
Zaufanie + Respekt = Relacja (0–200)
```

**Relacja** decyduje o progach handlu, NAP, sojuszu. **W** decyduje o twardych bramkach i szybkości wzrostu Zaufania.

### Twarde bramki

| Traktat | Min. W |
|---------|--------|
| Pakt o nieagresji (NAP) | **0** |
| Sojusz wojskowy | **0** |

### Dary i limit Zaufania

Z nadwyżki PN (handel, dar) możesz zyskać **maks. +5 Zaufania na turę** — **stały sufit** dla wszystkich graczy (decyzja FALA 206: bez „Dźwigni 2" zależnej od W). UI pokazuje wiersz **„Wpływ Relacji na deal"** z procentową korektą akceptacji oferty.

### Wchłonięcie miasta-państwa

Osobna akcja dyplomatyczna (v1, tylko MP): wasal ≥ **10 tur**, Respekt ≥ **90**, opłata złotem, zgoda Relacji — patrz Część XII §77.2.

**Powiązane:** [[Handel surowcami (dyplomacja)]] · Część XII · `docs/decyzje/` WIAR-*

---

## Przykład liczbowy

Gracz z **W = +15** (Uczciwy) proponuje **sojusz** — bramka W≥0 **spełniona**. Przy **Relacji 140** i **Zaufaniu 85** (progi sojuszu: Relacja 130, Zaufanie 90) brakuje jeszcze kilku punktów Zaufania — dar +100 PN da max **+1 Zaufania** w tej turze (limit 5/turę, nie 10).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §74

---

## Plusy i minusy

**Dla gracza**
- Plus: wysoka Wiarygodność przyspiesza budowanie Zaufania u wszystkich nacji i daje dostęp do sojuszu (W ≥ 0).
- Plus: dotrzymywanie traktatów (sojusz, pakt, handel) podnosi W co turę, a 30 tur bez wojny daje dodatkowe +3.
- Minus: złamanie paktu (−18), sojuszu (−25) albo atak w oknie karencji (−12) gwałtownie obniża W i blokuje późniejsze traktaty.
- Minus: ujemna W spowalnia wzrost Zaufania i zamyka pakt o nieagresji oraz sojusz (oba wymagają W ≥ 0).

**Dla AI**
- Plus: AI z wysoką W rośnie szybciej w Zaufaniu do gracza, który ją trzyma.
- Minus: wiarołomna AI traci tempo budowania Zaufania.

## Parametry

Wartości z `gra/data/diplomacy.json` (sekcja `params`). Każda wartość w tabeli jest sprawdzana testem `gra/tools/diplo-civpedia-values-test.cjs`.

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| -100 | `diplomacy.json:params.wiarygodnoscSkalaMin` |
| 100 | `diplomacy.json:params.wiarygodnoscSkalaMax` |
| 40 | `diplomacy.json:params.wiarygodnoscProgWzorCnoty` |
| -40 | `diplomacy.json:params.wiarygodnoscProgWiarolomny` |
| 40 | `diplomacy.json:params.wiarygodnoscStartLatwy` |
| 20 | `diplomacy.json:params.wiarygodnoscStartNormalny` |
| 0 | `diplomacy.json:params.wiarygodnoscStartTrudny` |
| -10 | `diplomacy.json:params.wiarygodnoscN1BezOstrzezenia` |
| -18 | `diplomacy.json:params.wiarygodnoscN2ZlamaniePaktuNap` |
| -25 | `diplomacy.json:params.wiarygodnoscN2ZlamaniePaktuSojusz` |
| -12 | `diplomacy.json:params.wiarygodnoscN3AtakWOknieKarencji` |
| -15 | `diplomacy.json:params.wiarygodnoscN4OdmowaObowiazkuSojuszu` |
| -6 | `diplomacy.json:params.wiarygodnoscN5ZerwanieTraktatCzasowy` |
| -4 | `diplomacy.json:params.wiarygodnoscN5ZerwanieHandelCzasowy` |
| -2 | `diplomacy.json:params.wiarygodnoscN6NiedotrzymanieHandluCyklicznego` |
| -2 | `diplomacy.json:params.wiarygodnoscN7NieautoryzowanyPrzemarsz` |
| 10 | `diplomacy.json:params.wiarygodnoscP1FiniszSojusz` |
| 5 | `diplomacy.json:params.wiarygodnoscP2FiniszNap` |
| 5 | `diplomacy.json:params.wiarygodnoscP2FiniszHandel` |
| 1 | `diplomacy.json:params.wiarygodnoscP3FiniszHandelCykliczny` |
| 3 | `diplomacy.json:params.wiarygodnoscP4BezWojny30Tur` |
| 20 | `diplomacy.json:params.wiarygodnoscP5PomocSojusznikowi` |
| 0.03 | `diplomacy.json:params.wiarygodnoscZaufanieDryfNa100` |
| 0 | `diplomacy.json:params.wiarygodnoscProgSojuszMin` |
| 0 | `diplomacy.json:params.wiarygodnoscProgNapMin` |
| 0.1 | `diplomacy.json:params.wiarygodnoscTrwalaPodlogaProcent` |

## Historia / decyzje

FALA 206 (2026-08-03): D3 progi W, tempo W→Z, usunięcie Dźwigni 2, UI „Wpływ Relacji na deal". Hasło dodane rev. G 2026-08-04.
