# Handel — punkty akceptacji (PN)

**Decyzja:** Maciej 2026-07-29 · **Źródło kodu:** `gra/data/diplomacy-acceptance-points.json` + runtime `diplomacy-value-catalog.ts`

**Skala względna:** sojusz pełny >> sojusz defensywny >> NAP >> traktat handlowy ≈ umowa szlaków >> umowa wymiany >> granice. Koszyk PN liczony runtime; traktaty mają PN bazowe stałe.

**Saldo stołu:** `Saldo PN = Oddajemy − Min. fair`, gdzie `Min. fair = W zamian × (100 / Relacja)`. Przy traktatach dodatkowo próg Relacji (lub Respekt/Zaufanie) ze słodzikiem (1 pkt ease / 25 PN netto, max 20 pkt).

---

## Traktaty i akcje dyplomatyczne

| Element | Punkty | Jednostka |
|---------|--------|-----------|
| Sojusz pełny | 500 | umowa (próg Relacji 151) |
| Sojusz defensywny | 420 | umowa (próg Relacji 151) |
| Pakt nieagresji (NAP) | 200 | umowa (próg Relacji 50) |
| Traktat handlowy (`umowa_szlakow`) | 80 | umowa |
| Umowa handlowa AI (`umowa_handlowa`) | 80 | umowa |
| Umowa wymiany surowców (`handel`) | 40 | wymiana |
| Traktat granic | 60 | umowa (próg Relacji 100) |
| Wasalizacja | 350 | umowa (próg Respektu 70) |
| Trybut — zadanie | 120 | /t (próg Respektu 70) |
| Trybut — oferta | 100 | once |
| Namów do wojny | 150 | once (próg Zaufania 50) |
| Ultimatum | 180 | once |
| Wymiana technologii (`tech`) | 0 (baza) | once — PN z `tech.json` |
| Dar / prezent (`dar`) | 0 (baza) | once — tylko koszyk PN |

---

## Koszyk wymiany — waluty i praca

| Element | Punkty | Jednostka |
|---------|--------|-----------|
| Złoto (¤) | 1 PN / 1 ¤ | once lub /t |
| Praca | 1 PN / 1 Praca | once lub /t |
| Żywność (spichlerz) | 1 PN / 1 żywność | once |

---

## Koszyk — surowce ilościowe (pakiet = 10 szt.)

Cena jednostkowa × pakiet_wielkosc (10) = PN **na 1 pakiet** w koszyku.

| Element | Punkty / pakiet | Jednostka |
|---------|-----------------|-----------|
| Drewno | 20 | once lub /t |
| Kamień | 30 | once lub /t |
| Glina | 20 | once lub /t |
| Cegła | 50 | once lub /t |
| Ruda (żelaza) | 40 | once lub /t |

Źródło cen: `econ-params.json` → `handel_surowce`.

---

## Koszyk — dostęp do złoża (1 hex)

| Element | Punkty | Jednostka |
|---------|--------|-----------|
| Glina (złoże) | 50 | once |
| Sól | 50 | once |
| Konie | 100 | once |
| Węgiel | 100 | once |
| Miedź | 120 | once |
| Żelazo | 150 | once |

Źródło: `diplomacy.json` → `handel_zloze.cena_baza`.

---

## Koszyk — technologie i jednostki

| Element | Punkty | Jednostka |
|---------|--------|-----------|
| Technologia | Koszt nauki × tempo gry | once (per tech z `tech.json`) |
| Jednostka wojskowa | Pieniądz (koszt) z `units.json` | once (per typ jednostki) |
| Dostęp surowca (boolean) | min koszt_praca ulepszenia odblokowującego | once (indeks z `terrain-improvements.json`) |

### Modyfikator trudności partii — **wszystkie elementy koszyka** (Maciej 2026-07-29)

Dotyczy **każdej** pozycji koszyka: surowce, ¤, praca, żywność, jednostki, tech, złoża itd.

**Baza PN** = wartość z katalogu (dla tech: `Koszt nauki` × tempo gry — **bez** osobnego mnożnika easy/hard na tech).

Perspektywa: **gracz ludzki** (ownerId 0), trudność i tempo z **aktualnego stanu partii** (nie stale z menu).

| Sytuacja | Easy | Normal | Hard |
|----------|------|--------|------|
| **My oddajemy** (koszyk „oddajemy") | × **1,5** (+50%) | ×1,0 | × **0,5** (−50%) |
| **My dostajemy** (koszyk „dostajemy") | × **0,5** (−50%) | ×1,0 | × **1,5** (+50%) |

Implementacja: `basketSidePnDifficultyMultiplier()` + `diplomacySumPn()` w `diplomacy-value-catalog.ts`; `resolveProposalPn()` przekazuje `difficulty`, `proposerOwnerId`, `tempoGry`.

Przykłady (tempo standardowa, koszt nauki tech = 10):
- Easy, gracz oddaje tech: 10 × 1,5 = **15 PN**
- Hard, gracz dostaje tech: 10 × 1,5 = **15 PN**
- Hard, gracz oddaje 100 ¤: 100 × 0,5 = **50 PN**
- Easy, gracz dostaje 100 ¤ (propozycja od AI): 100 × 0,5 = **50 PN**

---

## Słodzik i fair trade

| Reguła | Wartość |
|--------|---------|
| Słodzik — ease Relacji | 1 pkt / 25 PN netto (max 20 pkt) |
| Fair trade — kurs | Min oddane = oczekiwane × (100 / Relacja) |
