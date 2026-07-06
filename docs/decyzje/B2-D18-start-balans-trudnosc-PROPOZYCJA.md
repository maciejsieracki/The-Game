# B2-D18 — Start gry: bazowe wartości per trudność (propozycja wstępna)

> **Status:** ⚪ **ODŁOŻONE** — Maciej **2026-07-02**: **C — Obecny kompromis (D16)** (bez tabel §3–§7)  
> **Kontekst:** playtest 2026-07-01 (bunt T1, kara wody nad rzeką) · **D16-D17 = A** (wdrożenie w B)  
> **Cel sesji jutro:** zatwierdzić tabelę → wpisać do `society-params.json` / `econ-params.json` (+ ewent. kod dla progów buntu)

---

## 1. Filozofia (założenie)

| Poziom | Gracz na starcie | Porządek T1 (cel) | Presja |
|--------|------------------|-------------------|--------|
| **Easy** | Uczy się mechanik bez alarmu buntu | PorPct **≥ 30%**, brak „Bunt skrajny” do ~T5 | Kary łagodne, bonusy startowe wyższe |
| **Normal** | Civ-like: wyzwanie, ale fair | PorPct **≥ 22%**, stabilizacja po 1–2 turach | Balans referencyjny (D16-A) |
| **Hard** | Wczesna presja administracyjna | PorPct **≥ 15%**, możliwy „Napięcie”, rzadko skrajny bunt T1 | Kary mocniejsze, mniejsze bufory |

**Zasada:** na **żadnym** poziomie nie chcemy fałszywego **„Bunt skrajny” w turze 1** przy założeniu miasta (pop=1, brak garnizonu) — to bug UX, nie trudność.

---

## 2. Scenariusz testowy (wspólny dla wszystkich poziomów)

Miasto gracza **T1, pop=1**, bez garnizonu, bez świątyni, suwak luksus **10%**, własna kultura 100%, **brak dominującej religii**, **D17 wpięte** (rzeka liczy się z sąsiedztwa).

Formuła (bez zmian):

```
PorPct = waga_Sz × SzPct + waga_Praw × PrawPct     (domyślnie 50/50)
SzPct  = 100 × netto_sz / szMax(epoka)             (epoka 1: szMax=12)
PrawPct = 100 × netto_praw / prawMax(epoka)        (epoka 1: prawMax=12)
Bunt skrajny gdy PorPct < próg_krytyczny (dziś: 10% w kodzie)
```

---

## 3. Pakiet startowy — **NOWE / zmieniane** (D16 + D18)

Propozycja wartości po wdrożeniu logiki D16-A (+ D17-A osobno).

| Klucz JSON (propozycja) | Easy | Normal | Hard | Uwagi |
|-------------------------|------|--------|------|-------|
| **`prawo_bonus_osada`** *(nowy)* | **4** | **3** | **2** | +pkt Prawa gdy pop ≤ 4; linia UI „Osada” |
| **`prawo_osada_prog_pop`** *(nowy)* | 4 | 4 | 4 | Próg populacji bonusu osady |
| **`religia_kara_brak_religii`** *(logika D16)* | **0** | **0** | **−1** | Easy/Normal: kara **tylko gdy jest świątynia** a brak dominacji; Hard: −1 zawsze bez dominacji |
| **`wealth_kara_zero`** | **0** | **0** | **−1** | D16-A: neutralna bieda na easy/normal |
| **`wealth_immunitet_utrzymania_tur`** *(nowy)* | **8** | **5** | **3** | Tury od założenia: poziom W nie spada z utrzymania |
| **`porzadek_prog_bunt_skrajny_pct`** *(nowy → kod)* | **5** | **8** | **10** | Próg „Bunt skrajny”; dziś hardcoded 10% |
| **`porzadek_grace_tur_bunt`** *(nowy → kod)* | **3** | **2** | **2** | Grace po wejściu w strefę krytyczną; dziś 2 |

### Symulacja netto Sz / Praw (T1, bez rzeki, bez Wealth kary)

| Składnik | Easy | Normal | Hard |
|----------|------|--------|------|
| Kultura 100% | +3 | +2 | +1 |
| Religia (brak świątyni) | 0 | 0 | −1 |
| Małe miasto | +2 | +1 | +0 |
| Wealth W=1 (po immunitet) | 0 | 0 | 0 |
| **Netto Sz** | **+5** | **+3** | **0** |
| **SzPct** | **42%** | **25%** | **0%** |
| Bonus osady (Prawo) | +4 | +3 | +2 |
| **PrawPct** | **33%** | **25%** | **17%** |
| **PorPct (50/50)** | **~38%** | **~25%** | **~8%** |

**Wniosek wstępny:** Hard przy samych parametrach JSON nadal może wpaść w strefę krytyczną — **konieczny** niższy próg buntu (10→8%) albo **`porzadek_waga_szczescie` = 0,6 / Prawo 0,4** na hard tylko dla pop≤4. Do decyzji jutro.

---

## 4. Zdrowie i woda (D17 + D18)

| Klucz | Easy | Normal | Hard | Uwagi |
|-------|------|--------|------|-------|
| `zdrowie_rzeka` | **3** | **2** | **1** | bez zmian vs dziś |
| `zdrowie_kara_brak_wody` | **−1** | **−2** | **−3** | bez zmian; **D17** = brak kary gdy `cityHasWaterAccess` |
| `zdrowie_male_miasto_bonus` | **2** | **1** | **0** | bez zmian |
| `zdrowie_prog_zagęszczenia` | **5** | **4** | **3** | bez zmian |

**T1 nad rzeką (D17 OK):** Easy +4 zdrowia · Normal +3 · Hard +2 (vs dziś −1 z fałszywą karą).

---

## 5. Szczęście — kary i bonusy startowe (istniejące klucze)

Wartości **docelowe** (część już w JSON — kolumna „dziś” = zgodna).

| Klucz | Easy | Normal | Hard | Dziś OK? |
|-------|------|--------|------|----------|
| `kultura_zadowolenie_100pct` | 3 | 2 | 1 | ✅ |
| `szczescie_male_miasto_bonus` | 2 | 1 | 0 | ✅ |
| `religia_kara_brak_religii` | 0* | 0* | −1 | ⚠️ logika D16 |
| `wealth_kara_zero` | 0 | 0 | −1 | ⚠️ D16 |
| `szczescie_kara_wysokie_podatki` | 0 | −1 | −2 | ✅ |
| `szczescie_prog_zagęszczenia` | 5 | 4 | 3 | ✅ |

\* z warunkiem „bez świątyni = 0” (D16).

---

## 6. Wealth — utrzymanie i presja ekonomiczna

| Klucz | Easy | Normal | Hard | Kierunek |
|-------|------|--------|------|----------|
| `wealth_utrzymanie_baza` | **0,12** | **0,18** | **0,22** | łatwiej utrzymać W na easy |
| `wealth_utrzymanie_przy_cap` | **0,30** | **0,38** | **0,48** | |
| `wealth_prog_na_poziom` | **3,0** | **4,5** | **6,0** | dziś OK |
| `wealth_immunitet_utrzymania_tur` | **8** | **5** | **3** | **nowy** |

*(Obniżenie utrzymania na easy o ~20% vs dziś — mniej spadków W1→0 przed immunitetem.)*

---

## 7. Porządek — wagi i progi (mid/late game)

| Klucz | Easy | Normal | Hard | Uwagi |
|-------|------|--------|------|-------|
| `porzadek_waga_szczescie` | **0,55** | **0,50** | **0,45** | Easy: Sz ważniejsze na starcie |
| `porzadek_waga_prawo` | **0,45** | **0,50** | **0,55** | Hard: Prawo ważniejsze |
| `porzadek_prog_t1` | −2 | 0 | 1 | dziś OK |
| `porzadek_kara_produkcja_t1` | −0,10 | −0,15 | −0,20 | dziś OK |

**Do kodu (dziś stałe w `society-breakdown.ts`):**

| Stała | Easy | Normal | Hard |
|-------|------|--------|------|
| `REVOLT_CRITICAL_POR_PCT` | 5 | 8 | 10 |
| `REVOLT_GRACE_TURNS` | 3 | 2 | 2 |

---

## 8. Prawo — garnizon i budynki (późniejsza gra)

Bez zmian względem dziś; ważne dla skali trudności po T10:

| Klucz | Easy | Normal | Hard |
|-------|------|--------|------|
| `prawo_garnizon_per_jednostka` | 25 | 20 | 15 |
| `prawo_garnizon_cap_jednostek` | 5 | 5 | 4 |
| `prawo_ratusz` | 4 | 3 | 2 |

---

## 9. Checklist na jutro (Maciej)

1. **Playtest** po wdrożeniu D16-D17 (Grupa B) — `gra-robocza/START.html`, 3 trudności.
2. **Potwierdzić / skorygować** tabelę §3–§7 (szczególnie **Hard T1** — czy 8% PorPct akceptowalne z grace, czy podnieść bonus osady).
3. **ABC jednym batchiem** — karta pytań: **`docs/decyzje/B2-D18-ABC-MACIEJ.md`** (D18-0…D18-6).
4. Eksport: **`eksportuj panel`** → B aktualizuje `society-params.json` + `econ-params.json`.

---

## 10. Pytania otwarte → karta ABC

Szczegółowe opcje A/B/C: **`docs/decyzje/B2-D18-ABC-MACIEJ.md`**

| ID | Temat (skrót) |
|----|----------------|
| D18-0 | Zakres wdrożenia (pełny pakiet / tylko JSON / pilot) |
| D18-1 | Hard T1 — ostry start vs PorPct ≥15% |
| D18-2 | Religia na hard — kara od startu vs tylko ze świątynią |
| D18-3 | Immunitet Wealth: 8/5/3 vs 10/5/3 vs 5/5/0 |
| D18-4 | Easy: bonus stolicy T1–T10 |
| D18-5 | Wagi Sz/Prawo per trudność |
| D18-6 | Bonus osady +4/+3/+2 vs warianty |

*(D18-Q1…Q4 z wersji wstępnej = D18-1…D18-4.)*

---

*Propozycja Master · 2026-07-01 · do analizy w sesji B2-D18*
