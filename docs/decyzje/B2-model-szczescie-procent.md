# B2 — Model Szczęścia procentowego (kanon)

| Pole | Wartość |
|------|---------|
| **Decyzja Macieja** | **1C** (2026-06-27, czat Grupa B) |
| **Status** | **ZAMKNIĘTE** — **1C** + **2A** (2026-06-27) · implementacja EKONOMIA + UI |
| **Powiązane** | `B2-szczescie-progi-efektow.md`, `society-params.json`, `MIASTO/Spec-spoleczenstwo.md` |

---

## Co ustalił Maciej (nie liczyć ludzi — tylko %)

1. **NIE** liczymy w silniku „ile zadowolonych / kontentnych / niezadowolonych” jako osobnych głów (odrzucamy model B z pyt. 1).
2. **NIE** pokazujemy graczowi liczby ludzi w trzech koszykach jako **źródła prawdy** — pokazujemy **procent szczęścia** (`SzPct`).
3. **TAK** — pełna **rozpiska +/-** w panelu (jak Zdrowie): każdy czynnik widoczny, gracz wie co na co wpływa.
4. **TAK** — wzór procentu: najpierw **SzMax** (maksimum możliwe w danej chwili), potem **Netto = Σ plusy − Σ minusy**, na końcu **`SzPct = 100 × Netto / SzMax`** (cap — patrz niżej).

Emotikony 😊/😐/😠 z B2-Q1=A mogą zostać jako **wizualizacja z progów %** (patrz progi), nie jako osobny licznik ludzi.

---

## Wzór (silnik)

```
SzMax  = szczescie_szmax_baza(epoka_miasta)     // patrz JSON — do dopisania
Plusy  = Σ składników dodatnich (tabela poniżej)
Minusy = Σ składników ujemnych (tabela poniżej)
Netto  = Plusy − Minusy
SzPct  = clamp(0, szczescie_cap_pct, round(100 × Netto / SzMax))
```

| Parametr | Propozycja startowa (Excel) | Uwagi |
|----------|----------------------------|--------|
| `szmax_kamien` | 12 | epoka miasta Kamień |
| `szmax_braz` | 18 | epoka Brąz |
| `szmax_zelazo` | 24 | epoka Żelazo |
| `szczescie_cap_pct` | 120 | powyżej 100% = „super-zadowolenie” |

**SzMax „w danej chwili”:** v1.0 = **stała z epoki miasta** (nie rośnie z populacją). Rozszerzenie później: `SzMax += bonus` z budynków — tylko jeśli Maciej zaakceptuje w Excel.

**Porządek:** v1.0 mapujemy **tiery efektów bezpośrednio z SzPct** (patrz `B2-szczescie-progi-efektow.md`), zamiast liczyć „ludzi niezadowolonych”. Istniejące kary B2-Q6 (`orderMultByCity`) wiążą się z progiem **niepokój/bunt**, nie ze strajkiem per głowa.

---

## Składniki wpływające na Szczęście (plus / minus)

Źródło liczb: `gra/data/society-params.json` → sekcja `szczescie` (+ Wealth D3=A, budynki z `buildings.json`).

### Plusy (+)

| ID JSON | Opis w panelu | Jak liczyć (normal) |
|---------|---------------|---------------------|
| `szczescie_swiatynia` | Świątynia | +1 pkt jeśli budynek w mieście |
| `szczescie_amfiteatr` | Amfiteatr / rozrywka | +1 pkt |
| `szczescie_luksus_na_mieszkanca` | Luksus / Wealth (pula) | +1 pkt na co N jednostek Luksusu w puli (N=5 normal) — **Wealth D3=A** |
| `szczescie_bonus_luksus_*` | **Niskie podatki** (udział Luksus %) | **+1…+5 pkt** przy Luksus ≥30/40/50/60/70% — patrz `B2-narzedzia-stabilizacji.md` |
| `szczescie_ustroj_bonus` | Ustrój polityczny | +1 pkt (gdy mechanika ustroju wpięta; inaczej 0 v1.0) |
| `szczescie_religia_dominujaca` | Nasza religia dominuje | +2 pkt (≥50% wyznawców naszej wiary) |
| `szczescie_kultura_dominujaca` | Nasza kultura dominuje | +1 pkt (≥80% kultury własnej) |
| `szczescie_male_miasto_bonus` | Małe miasto (niskie zagęszczenie) | +1 pkt jeśli pop ≤ próg zagęszczenia |
| Budynki (z `przyrost.zadowolenie`) | Inne budynki | suma z `buildings.json` — jak dziś w silniku |

### Minusy (−)

| ID JSON | Opis w panelu | Jak liczyć (normal) |
|---------|---------------|---------------------|
| `szczescie_kara_wielkosc_miasta` | Zagęszczenie | −1 pkt × (pop − próg) dla pop > próg (próg=4) |
| `szczescie_kara_wojna` | Wojna / zmęczenie wojenne | −3 pkt gdy cywilizacja w stanie wojny |
| `szczescie_kara_obca_kultura` | Obca kultura dominuje | −1 pkt (<50% kultury własnej) |
| `szczescie_kara_obca_religia` | Obca religia dominuje | −2 pkt |
| `szczescie_kara_wysokie_podatki` | Wysokie podatki | −1 pkt × poziom powyżej bazy (z suwaka Handel) |

### Wpięcie v1.0 — **2A (Maciej 2026-06-27)**

**Pełna lista Spec** — wszystkie wiersze tabel plus/minus powyżej **oraz** budynki z `przyrost.zadowolenie` w `buildings.json`. Wymaga haków: wojna, podatki (suwaki), udział kultury/religii per miasto, Wealth D3=A, ustrój (0 dopóki brak mechaniki — wiersz ukryty lub „—”).

---

## UI panelu (sekcja Szczęście)

W lewej kolumnie, **pod** Mieszkańcy / nad Porządek:

```
Szczęście                          72%
─────────────────────────────────────
  Świątynia                    +1
  Wealth (Luksus)              +2
  Wojna                        −3
  Zagęszczenie (6−4)           −2
  Podatki (poz. 2)             −1
─────────────────────────────────────
  Netto:  −3    SzMax: 18  →  72%
```

Opcjonalnie pod paskiem: emotikony **jako skrót wizualny** z progów (np. 72% → 😐😊 mix), **nie** jako liczby ludzi.

---

## Implementacja (lane)

| Lane | Plik / API |
|------|------------|
| EKONOMIA | `computeHappinessBreakdown(city, ctx) → { lines[], netto, szMax, szPct, tier }` |
| EKONOMIA | klucze `szmax_*`, `szczescie_cap_pct` w `society-params.json` |
| UI | sekcja w `cityPanel.ts`; **przebudowa** Mieszkańcy — koszyki z `szPct`, nie `happinessBreakdown` per głowa |
| SILNIK | haki w `configureCityPanel`; Porządek czyta `szPct` / tier |
| Excel | `Spoleczenstwo-parametry.xlsx` — kolumny SzMax + progi % |

Handoff: `dyspozycje/_handoff/EKONOMIA-do-UI_szczescie-procent.md` (do utworzenia po **2**).

---

## Konflikt — rozstrzygnięty

**B2-Q12=C** (2026-06-27): w skrajnym progu **po 2 turach grace** możliwa **rebelia AI** — rozszerzenie B2-Q6=C. Spec: `B2-Q12-bunt-rebelia.md`.

---

## Historia

| Data | Zdarzenie |
|------|-----------|
| 2026-06-27 | Maciej: **1C** + model % (nie liczyć ludzi; rozpiska; SzMax/Netto/SzPct) |
| 2026-06-27 | Maciej: **2A** — pełna lista czynników Spec w v1.0 |
| 2026-06-27 | Agent: spec składników + progi (draft) |
