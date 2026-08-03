# R-GRACZ-WCHLONIECIE — dyplomatyczne wchłonięcie miasta przez gracza

**Status:** 🟡 ZAPISANA (ECHO 2026-08-03) — czeka wdrożenie / doprecyzowanie liczb  
**Data:** 2026-08-03  
**Powiązane:** `R-AI-MP-WASAL-WCHLONIECIE` Q3 · D3-PROG-G2 · `progWasalizacjaRespekt` = 70

## ECHO — decyzja Macieja (2026-08-03)

Cytat: `R-GRACZ-WCHLONIECIE-Q1 a / R-GRACZ-WCHLONIECIE-Q2 a / R-GRACZ-WCHLONIECIE-Q3 a`

| ID | Odpowiedź | Treść |
|----|-----------|--------|
| **R-GRACZ-WCHLONIECIE-Q1** | **A** | Po wasalizacji, od tury **N** (domyślnie **10**) — akcja „Wchłonięcie” |
| **R-GRACZ-WCHLONIECIE-Q2** | **A** | Próg **Respekt ≥ 90** |
| **R-GRACZ-WCHLONIECIE-Q3** | **A** | **Drogo** (złoto) **+ zgoda** partnera |

## Proponowane domyślne liczby (do potwierdzenia przed kodem)

| Parametr | Propozycja | Skąd |
|----------|------------|------|
| `gracz_wchloniecie_po_wasalu_tur` | **10** | Q1A + szkic Macieja / AI Normalny |
| Okno czasowe | **od tury 10 w górę** (bez górnego limitu), póki trwa wasal | domyślne — do potwierdzenia |
| `progWchloniecieRespekt` | **90** | Q2A / D3-PROG-G2 |
| Zakres v1 | **tylko miasta-państwa** (wasal 1-miastowy) | propozycja z ABC |
| Koszt ¤ | **`150 + 25 × ludność` miasta** (min 200) | „drogo”; strojenie po playteście |
| Zgoda | propozycja jak inne umowy — partner AI może **odmówić** (willingness / fair PN) | Q3A |
| Kara W | **brak** w v1 (Q3A = zgoda, nie jednostronne+kara) | — |

## Stan dziś (przed wdrożeniem)

| Ścieżka | Gracz |
|---------|--------|
| Wojna / oblężenie / puste miasto | TAK |
| Wasalizacja | TAK — Respekt ≥ 70 |
| Dyplomatyczne wchłonięcie | **NIE** (do wdrożenia po `działaj`) |

## Następny krok operacyjny

1. Maciej: **`działaj`** = wdrażaj z liczbami wyżej · **albo** skoryguj koszt / okno / zakres.  
2. Kod: nowa akcja `wchloniecie` (lub rozszerzenie 12) · bramki wasal≥10 · Respekt≥90 · transfer miasta przy akceptacji · UI audiencji.  
3. Deploy osobno na hasło.
