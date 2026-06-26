# Dyplomacja — zasady (zwięzła specyfikacja wykonawcza)

> **Status:** wersja 1.0 — 2026-06-22, sesja **Civ-DYPLOMACJA**.
> **Spójne z:** `PROJEKT-GRY-master.md` (intencja), `Dyplomacja-szablon.md` (projekt), `gra/data/diplomacy.json` (panel), `gra/src/game/diplomacy.ts` (model wykonawczy).
> **Hierarchia prawdy:** dla silnika wiążące są `diplomacy.ts` + `diplomacy.json.params`; `Dyplomacja-szablon.md` = intencja projektowa; ten plik = jedno miejsce, które je godzi.

Ten dokument zastępuje rozsypaną wiedzę (szablon + json + kod) jednym streszczeniem parametrów i logiki. Wartości liczbowe pochodzą z `DIPLOMACY_PARAMS` (= `diplomacy.json.params`).

---

## 1. Model relacji

- **Relacja ogólna = Zaufanie + Respekt**, zakres **0–200** (suma dwóch składowych 0–100; nigdy ujemna).
- **Zaufanie** 0–100 — *soft power* / goodwill; zmieniane przez akcje (pakty, handel, podarunki, zdrady). Start **20**.
- **Respekt / Strach** 0–100 — *hard power*; zależy od siły militarnej, wygranych bitew i potęgi cywilizacji, liczony względem partnera. Start **30**.
- **Start Relacji = 50** (= 20 + 30). *[założenie (a) — patrz §6]*
- **Dźwignia negocjacyjna:** wysoki Respekt → można wymuszać (trybut, ultimatum, wasalizacja); wysokie Zaufanie → handel, sojusz, wymiana technologii; oba wysokie → pełna dźwignia; oba niskie → dyplomacja nieskuteczna.

**Relacja startowa per para (z `initialRelation`):**

| Para | Zaufanie | Respekt | Relacja |
|---|---|---|---|
| Ten sam typ (rywalizacja −20) | 0 | 30 | 30 |
| Różne typy główne (różnica kult. −5) | 15 | 30 | 45 |
| Główny ↔ drobny (bez kary) | 20 | 30 | 50 |

---

## 2. Parametry modelu (źródło: `diplomacy.json.params`)

### 2.1 Progi akcji (panel C)

| Akcja / warunek | Próg |
|---|---|
| Sojusz wojskowy | Zaufanie ≥ 60 |
| Wymiana technologii | Zaufanie ≥ 70 |
| Żądanie wasalizacji | Respekt ≥ 70 |
| Żądanie wchłonięcia | Respekt ≥ 90 |
| Dyplomacja w ogóle możliwa | Relacja ≥ 30 |
| Sojusze realistyczne | Relacja ≥ 120 |

### 2.2 Mnożniki globalne (panel E)

`mnoznikZaufania = 1`, `mnoznikRespektu = 1`, `mnoznikPodarunku = 1`, `turyEfektuPodarunku = 5`.

### 2.3 Cywilizacje drobne (§5.2, skala 0–200) *[założenie (b)]*

| Próg | Wartość | Znaczenie |
|---|---|---|
| `progPoboczneAkceptacja` | Respekt > 60 | akceptują trybut / NAP / wchłonięcie |
| `progPoboczneHandel` | Relacja > 30 | prosty handel + otwarte granice (cywilne) |
| `progPoboczneWojna` | Relacja < 15 | mogą wypowiedzieć wojnę (remap z „< −40") |

---

## 3. Zmiany parametrów

### 3.1 Jednorazowe — modyfikatory §3.3 (klucze w `params`)

| Zdarzenie | Parametr | Δ |
|---|---|---|
| Zawarcie umowy handlowej | Zaufanie | +2 |
| Pomoc w wojnie sojusznikowi | Zaufanie | +10 |
| Wspólny wróg — nawiązanie | Zaufanie | +5 |
| Podarunek (gratis) | Zaufanie | +6 (× `mnoznikPodarunku`) |
| Złamany pakt przez gracza | Zaufanie | −40 |
| Złamany pakt przez AI | Zaufanie | −20 |
| Zdrada / atak z zaskoczenia | Zaufanie | −50 (+ stan: wojna) |
| Szpiegostwo wykryte | Zaufanie | −15 |
| Rywalizacja tego samego typu (start) | Zaufanie | −20 |
| Różnica kulturowa (start) | Zaufanie | −5 |
| Znacząca przewaga militarna | Respekt | +15 |
| Gracz słabszy militarnie | Respekt | −10 |
| Wygrana bitwa | Respekt | +5 |
| Akceptacja trybutu | Respekt | +10 |
| Wspólny wróg — akceptacja | Respekt | +10 |

### 3.2 Co turę — stany trwające (panel D)

| Stan | Δ Zaufanie/turę |
|---|---|
| Aktywny handel | +1 |
| Aktywny pakt (NAP/sojusz) | +1 |
| Efekt dobrej woli (podarunek) | +1 (przez `turyEfektuPodarunku`) |
| Wspólny wróg (kooperacja) | +1 |
| Wspólna religia | +0.5 (max +15) |
| Odmienna religia | −0.5 (max −10) |
| Ekspansja przy granicy | −2 |
| Urazy historyczne | −2 (zanikają co 20 tur) |

### 3.3 Zdarzenia z akcji (szablon §1) — literały w kodzie, poza `params`

Pochodzą z tabel akcji (nie z tabeli modyfikatorów §3.3), więc są wartościami stałymi w `applyDiplomaticEvent`, a nie kluczami `params`:

| Zdarzenie (`DiplomaticEvent`) | Efekt | Stan |
|---|---|---|
| `wojna_wypowiedziana` (bez casus belli) | Zaufanie −20 | wojna |
| `wojna_casus_belli` (z casus belli) | Zaufanie −10 | wojna |
| `pokoj` | Zaufanie +5 | pokój |
| `ultimatum_spelnione` | Zaufanie −5 | — |
| `ultimatum_bezpodstawne` | Zaufanie −10, Respekt −10 | — |
| `trybut_odmowa` | Zaufanie −10 | — |
| `trybut_oferta_przyjeta` | Zaufanie +5 | — |
| `wymiana_tech_gratis` | Zaufanie +5 | — |
| `wspolna_religia` (seed) | Zaufanie +1 | — |

*Każda zmiana jest clampowana do [0, 100] per składowa; Relacja wynika z sumy.*

---

## 4. Logika AI (`aiDiplomacyStance`)

Zwraca skłonności `{ willingnessWar, willingnessPeace, willingnessTrade, willingnessAlly }` ∈ [0, 1]; silnik mapuje je na decyzje/prawdopodobieństwa.

**Cywilizacje główne:**
- **Wojna** = agresja archetypu (×0.5) + Respekt/100 (×0.3) + (1 − Relacja/200) (×0.2); zero, gdy już trwa wojna.
- **Pokój** = 0.8 w stanie pokoju; na wojnie = zmęczenie wojną (turaWojny/20, max 0.5) + presja (gdy słabszy militarnie) + goodwill (Zaufanie/100 ×0.2).
- **Handel** = gdy Relacja ≥ 30: handel archetypu (×0.6) + Relacja/200 (×0.4).
- **Sojusz** = tylko gdy Zaufanie ≥ 60 ∧ Relacja ≥ 120: Zaufanie/100 (×0.6) + bonus lojalności archetypu + nadwyżka Relacji.

**Cywilizacje drobne (§5.2):** `willingnessAlly = 0` zawsze; `Trade = 0.6` gdy Relacja > 30 (inaczej 0.2); `War = 0.2` gdy Relacja < 15 (inaczej 0.05); `Peace` = strach (Respekt/60, lub 0.9 gdy Respekt > 60).

**Archetypy (Dyplomacja-szablon.md §4):**

| Typ | Agresja | Handel | Bonus lojalności (sojusz) |
|---|---|---|---|
| Grecy | 0.40 | 0.75 | +0.10 |
| Rzymianie | 0.75 | 0.50 | 0 |
| Chińczycy | 0.20 | 0.85 | +0.20 |
| Inkowie | 0.45 | 0.25 | +0.15 |
| Zulusi | 0.90 | 0.20 | −0.20 |
| Egipt | 0.35 | 0.60 | 0 |
| Babilon | 0.30 | 0.65 | 0 |
| Drobna | 0.15 | 0.60 | n/d (sojusz = 0) |

---

## 5. Dostępność akcji (szablon §2)

12 akcji; główni rywale = pełny zestaw, drobni = podzbiór (UPR = uproszczona).

| Akcja | Główni | Drobni |
|---|---|---|
| 1. Nawiązanie kontaktu | TAK | TAK |
| 2. Pakt o nieagresji | TAK | UPR (auto, 10 tur) |
| 3. Sojusz wojskowy | TAK | NIE |
| 4. Otwarte granice / przemarsz | TAK | UPR (cywilne) |
| 5. Umowa handlowa | TAK | UPR (jednorazowa) |
| 6. Wymiana / sprzedaż technologii | TAK | NIE |
| 7. Wspólny wróg / namowa do wojny | TAK | NIE |
| 8. Żądanie / oferta trybutu | TAK | TAK |
| 9. Ultimatum / groźba | TAK | UPR (tylko poddanie) |
| 10. Pokój / zawieszenie broni | TAK | TAK |
| 11. Wypowiedzenie wojny | TAK | TAK |
| 12. Wasalizacja / wchłonięcie | TAK | TAK |

---

## 6. Przyjęte założenia (do akceptacji mastera)

- **(a) Start Relacji = 50** (nie 60). Relacja jest pochodną (Zaufanie 20 + Respekt 30); „60" było legacy. Poprawione w `diplomacy.json` (`parametry_relacji` + `params`) i `Dyplomacja.xlsx` (`Parametry relacji!C3`).
- **(b) §3.1 (Relacja 0–200) ma pierwszeństwo nad §5.2** (progi ujemne). Ponieważ Relacja = suma dwóch wartości ≥ 0, nie bywa ujemna. Próg wojny drobnych przemapowany: `progPoboczneWojna` −40 → **15** (skala 0–200). Trigger „gracz atakuje" z §5.2 obsługuje silnik, nie model.

**Otwarte (czeka na decyzję / inne sesje):**
- Pełne narzędzie eksportu `Dyplomacja.xlsx → diplomacy.json` (na razie blok `params` uzupełniony ręcznie, zgodny z modelem; `export-data.py` nie używać — regeneruje wszystkie JSON-y).
- Wpięcie modelu do pętli tury (SILNIK) + panel dyplomacji (UI).

---

## 7. Kontrakt techniczny (dla SILNIK + UI)

- **Plik:** `gra/src/game/diplomacy.ts` — czysty: **bez DOM, bez THREE**, deterministyczny.
- **API:**
  - `relationScore(rel) → 0–200`
  - `applyDiplomaticEvent(rel, event, params?) → nowa Relation` (immutable, clamp 0–100)
  - `aiDiplomacyStance(aiPlayer, otherPlayer, rel, ctx) → { war, peace, trade, ally }`
  - `initialRelation(playerA, playerB) → Relation`
  - `toRelation(RelacjaDyplomatyczna) → Relation` (rzut stanu gry na model)
  - `loadDiplomacyParams(json) → Partial<DiplomacyParams>` (czyta `json.params`; brak → `{}`)
- **Wczytanie panelu (raz przy init, po stronie SILNIK):**
  `const params = { ...DIPLOMACY_PARAMS, ...loadDiplomacyParams(diplomacyJson) };` — i przekazywać `params` do `applyDiplomaticEvent`.
- **Typy:** `gra/src/types/diplomacy.ts` (`RelacjaDyplomatyczna`, `StanWojny`, `RodzajTraktatu`, `DiplomacyState`, `DiplomacyConfig`).
- **Test:** `gra/tools/diplomacy-test.cjs` — 90 asercji, `tsc` czysty (strict).
- **Stan:** model gotowy i przetestowany, **NIEWPIĘTY**. Wpięcie do tury = SILNIK; panel/okno dyplomacji = UI.

---

## 8. Źródła

`PROJEKT-GRY-master.md`, `Dyplomacja-szablon.md`, `gra/data/diplomacy.json`, `gra/src/game/diplomacy.ts`, `gra/src/types/diplomacy.ts`.
