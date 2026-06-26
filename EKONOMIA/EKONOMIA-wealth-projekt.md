# EKONOMIA — System WEALTH (zamoznosc spoleczenstwa)

> Status: **ZATWIERDZONY** (implementacja: `gra/src/game/wealth.ts`; testy: `gra/tools/wealth-test.cjs`).
> Autor: sesja Civ-EKONOMIA. Data decyzji: 2026-06-24. Ostatnia aktualizacja: 2026-06-25.

---

## 1. Miejsce w suwakach podzialu

Miasto generuje **Handel netto** (po korupcji). Gracz suwakiem dzieli go na trzy strumienie:

| Strumien | Co robi |
|---|---|
| **Nauka** | punkty badan (do RESEARCH) |
| **Skarbiec (Podatek)** | pieniadz do centralnego skarbca gracza |
| **Spoleczenstwo** | dawny "Luksus" — zostawiony obywatelom; zasila **Wealth** |

Strumien Spoleczenstwo (`spoleczMoney`) trafia co ture do puli Wealth zamiast dawac bezposrednio +Zadowolenie z przelicznika Luksusu. Zadowolenie daje teraz **poziom Wealth** (patrz sekcja 4).

---

## 2. Mechanika — opis slowny

**Wealth** (zamoznosc) dziala per MIASTO, analogicznie do Zywnosci→Populacja:

1. **Pula** — co ture: `pula += spoleczMoney - decay`
   - `decay = wealthRownowaga(W, epoka) * miastoMoney`
   - Rownowaga rosnie liniowo z poziomem: im bogatsze spoleczenstwo, tym wieksze "wymagania" co do utrzymania stylu zycia.
2. **Awans** — gdy `pula >= prog(L)`: `poziom += 1`, `pula = floor(pula * zachowaniePoAwansie)`
   - Prog: `prog(L) = progNaPoziom * (L+1) * epoka` — kolejne poziomy w tej samej epoce sa coraz drozsze; w wyzszej epoce wszystko kosztuje proporcjonalnie wiecej.
   - Mozliwe wiele awansow w jednej turze.
3. **Spadek** — gdy `pula < 0`: `pula = 0`, `poziom -= 1` (o 1 poziom; bufor musi sie wyczerpac zanim nastapi cofniecie).
4. **Cap** — `cap = epoka * capNaEpoke` (domyslnie 10): epoka 1 -> max 10, epoka 10 -> max 100.
5. **Mnoznik** — stosowany do strumienia podatku do Skarbca: `mnoznik = max(1, 1 + (W-1) * mnoznikNaPoziom)`. Przy W=1 mnoznik = x1 (brak premii). Rosnie liniowo z poziomem.
6. **Zadowolenie** — `floor(W/10) * zadowolenieNa10pkt` (W=0 -> karaZero; W=10 -> +1; W=100 -> +10).
7. **Start** — kazde miasto startuje z `{ poziom: 1, pula: 0 }` (mnoznik x1, zadowolenie 0).

**Trade-off**: nizszy podatek -> wiecej dla spoleczenstwa -> szybszy wzrost Wealth -> wiekszy mnoznik podatku. Krotkoterminowo tracisz, dlugoterminowo zyskujesz.

---

## 3. Wzory formalne

```
cap(epoka)         = epoka * capNaEpoke
prog(L, epoka)     = progNaPoziom * (L+1) * epoka
mnoznik(W)         = max(1, 1 + (W-1) * mnoznikNaPoziom)
rownowaga(W,epoka) = utrzymanieBaza + (W/cap) * (utrzymaniePrzyCap - utrzymanieBaza)
decay(W,M,epoka)   = rownowaga(W,epoka) * M          [M = calkowity pieniadz miasta]
zadowolenie(W)     = 0==W ? karaZero : floor(W/10) * zadowolenieNa10pkt

--- tick per tura ---
pula  += spoleczMoney - decay
if pula < 0:        pula = 0; poziom -= 1  [min 0]
while pula >= prog(poziom,epoka) AND poziom < cap:
    pula  -= prog(poziom, epoka)
    poziom += 1
    pula   = floor(pula * zachowaniePoAwansie)
```

---

## 4. Parametry easy / normal / hard

| Klucz JSON | easy | normal | hard | Jednostka | Opis |
|---|---|---|---|---|---|
| `wealth_cap_na_epoke` | 10 | 10 | 10 | poziom/epoka | cap = epoka * wartosc |
| `wealth_prog_na_poziom` | 3.5 | 4.5 | 6.0 | srodki | prog(L) = wartosc*(L+1)*epoka |
| `wealth_mnoznik_na_poziom` | 0.18 | 0.15 | 0.12 | x/poziom | mnoznik = max(1, 1+(W-1)*k) |
| `wealth_utrzymanie_baza` | 0.15 | 0.20 | 0.25 | udzial | % pieniadza przy W=0 |
| `wealth_utrzymanie_przy_cap` | 0.35 | 0.40 | 0.50 | udzial | % pieniadza przy W=cap |
| `wealth_zachowanie_po_awansie` | 0.6 | 0.5 | 0.4 | ulamek | ile puli zostaje po awansie |
| `wealth_zadowolenie_na_10pkt` | 1 | 1 | 1 | zadowoleni | +zadowolenie co 10 poziomow |
| `wealth_kara_zero` | -1 | -2 | -3 | zadowoleni | kara przy W=0 |

---

## 5. Wyniki balansu (symulacje, normal)

### 5.1 Czas do W=10

Przy suwaku Spoleczenstwo = 60% i miastoMoney = 20 (epoka 1):

- spoleczMoney = 12; decay(W=1..10) rosnie od ~4.4 do ~8
- Osiagniecie W=10: okolo **tury 48**

### 5.2 Strategia 40% Wealth vs 90% Podatek

Porownanie skumulowanego skarbca przy dwoch strategiach (miastoMoney=20, epoka 1, 100 tur):

| Strategia | Skarbiec tura 48 | Skarbiec tura 100 |
|---|---|---|
| 90% podatek (10% spol, W~1) | ~540 | ~900 |
| 40% Wealth / 60% podatek | ~288 + rosnacy mnoznik | >900 (crossover ~tura 48) |

Crossover: okolo **tury 48** strategia 40%/60% zaczyna generowac wiekszy skumulowany skarbiec niz 90% podatek. Na dlugich horyzontach (tura 100+) przewaga Wealth jest istotna.

### 5.3 Mnoznik przy W=100 (cap epoka 10)

| Trudnosc | Parametr k | Mnoznik (W=100) |
|---|---|---|
| easy | 0.18 | x(1 + 99*0.18) = **x18.82** |
| normal | 0.15 | x(1 + 99*0.15) = **x15.85** |
| hard | 0.12 | x(1 + 99*0.12) = **x12.88** |

### 5.4 Przykladowe wartosci mnoznika (normal)

| Poziom W | Mnoznik |
|---|---|
| 1 | x1.00 |
| 5 | x1.60 |
| 10 | x2.35 |
| 20 | x3.85 |
| 50 | x8.35 |
| 100 | x15.85 |

---

## 6. Styk z innymi modulami

| Modul | Rola |
|---|---|
| `economy.ts` | dostarcza `spoleczMoney` (udzial suwaka * pieniadz netto); odbiera `mnoznik` do przemnozenia strumienia podatku |
| `turn-economy.ts` | wywoluje `advanceWealth(state, spol, M, epoka, p)` per miasto; zapisuje `WealthState` do `PlayerState` |
| `playerState.ts` | przechowuje `WealthState` per miasto (pole `wealth: WealthState`) |
| `research.ts` | dostarcza numer epoki (do cap i prog) |
| ORDER / zadowolenie | odbiera `wealthZadowolenie(poziom, p)` jako wklad do bilansu zadowolenia miasta |
| UI | wskaznik poziomu / puli / mnoznika / progu; suwak Spoleczenstwo |
| AI | optymalizuje podatki vs Wealth (dlugi vs krotki horyzont) |

---

## 7. Pliki implementacji

- `gra/src/game/wealth.ts` — modul (eksporty: `WealthParams`, `FALLBACK_WEALTH_PARAMS`, `loadWealthParams`, `wealthCap`, `wealthMnoznik`, `wealthZadowolenie`, `wealthRownowaga`, `wealthProg`, `advanceWealth`, `freshWealthState`, `WealthState`, `WealthTickResult`)
- `gra/tools/wealth-test.cjs` — testy (25 asercji, wszystkie PASS)
- `gra/data/econ-params.json` — grupa `"wealth"` z 8 parametrami (easy/normal/hard)
- `EKONOMIA/EKONOMIA-panel-parametrow.xlsx` — arkusz "Wealth" z tabela parametrow
