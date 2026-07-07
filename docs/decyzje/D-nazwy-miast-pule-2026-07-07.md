# D-nazwy-miast-pule — pule nazw miast AI (100 + 10 państw)

**Data:** 2026-07-07  
**Status:** WDROŻONE (propozycje AI do przeglądu Macieja)  
**Lane:** CYWILIZACJE / INTEGRATOR

---

## Podsumowanie

Plan ~100 nazw founding + 10 nazw miast-państw **per cywilizacja** był przygotowany w `city-names-pools.json` (research AI). W tej sesji:

1. Zweryfikowano kompletność pul (15 cywilizacji × 100 + 10).
2. Podłączono pulę founding do AI (`pickAiFoundedCityName` w `main.ts`).
3. Miasta-państwa nadal z `nazwyKlastra` w `civs.json` (= `miasta_panstwa` w pools).
4. Naprawiono desync Asyrii (`Nineveh` → `Arbail`).
5. Dodano ścieżkę Excel: `generate-city-names-xlsx.py` + `export-city-names.py`.

---

## 15 cywilizacji (ikonaId)

| ikonaId | nazwa_pl | miasta_cywilizacji | miasta_panstwa | Przykłady państw |
|---------|----------|-------------------:|---------------:|------------------|
| grecy | Grecy | 100 | 10 | Ateny, Sparta, Korynt… |
| rzymianie | Rzymianie | 100 | 10 | Rzym, Ostia, Kapua… |
| chinczycy | Chińczycy | 100 | 10 | Qin, Qi, Chu, Jin… (królestwa) |
| inkowie | Inkowie | 100 | 10 | Cusco, Machu Picchu… |
| zulusi | Zulusi | 100 | 10 | uMgungundlovu, Ondini… |
| egipt | Egipcjanie | 100 | 10 | Memfis, Teby, Heliopolis… |
| sumer | Sumerowie | 100 | 10 | Uruk, Ur, Lagasz… |
| celtowie | Celtowie | 100 | 10 | Bibracte, Gergowia… |
| germanie | Germanie | 100 | 10 | Mattium, Haithabu… |
| harappa | Harappanie | 100 | 10 | Harappa, Mohenjo-daro… |
| hetyci | Hetyci | 100 | 10 | Hattusa, Karkemisz… |
| slowianie | Słowianie | 100 | 10 | Kijów, Kraków, Wolin… |
| babilonia | Babilończycy | 100 | 10 | Babilon, Ur, Sippar… |
| asyria | Asyryjczycy | 100 | 10 | Ninive, Assur, Arbail… |
| fenicjanie | Fenicjanie | 100 | 10 | Tyr, Sydon, Kartagina… |

**Przed:** dane w pools istniały, AI founding używał 12 hardcoded nazw (`cityName()`).  
**Po:** 15×100 + 15×10 w pools; AI founding per typ cywilizacji; państwa z `nazwyKlastra`.

---

## Pliki i wiring

| Plik | Rola |
|------|------|
| `gra/data/city-names-pools.json` | **Źródło prawdy** pul (100 + 10) |
| `gra/data/civs.json` | `nazwyKlastra[10]` — spawn państw; opcjonalnie `nazwyMiast[100]` po export |
| `gra/src/game/civ-names.ts` | `pickAiFoundedCityName`, `validateCityNamesPools` |
| `gra/src/data/loader.ts` | `GameData.cityNamesPools` |
| `gra/src/map/cluster-spawn.ts` | Państwa: `clusterRivalCityName` / `foreignCapitalCityName` |
| `gra/src/main.ts` | AI `foundCity` → `pickAiFoundedCityName` |
| `panele-sterowania/Nazwy-miast-cywilizacji.xlsx` | Podgląd Macieja (generate) |
| `gra/tools/generate-city-names-xlsx.py` | JSON → Excel |
| `gra/tools/export-city-names.py` | pools → civs.json (`nazwyKlastra` + `nazwyMiast`) |
| `gra/tools/city-names-pools-test.cjs` | Walidacja 100/10 + sync + pick AI |

### Przepływ nazw w grze

```
Start gry (klaster):
  gracz stolica     → nazwyKlastra[0]     (civ-names.playerStartCityName)
  państwa gracza    → nazwyKlastra[1..N]  (clusterRivalCityName)
  obce klastry AI   → nazwyKlastra[0..N]  (foreignCapital + rivals)

AI founding (osadnik):
  → pierwsza wolna z miasta_cywilizacji[100] (cityNamesPools)
```

---

## Dla Macieja — Excel

1. Otwórz `panele-sterowania/Nazwy-miast-cywilizacji.xlsx` (arkusze: Podsumowanie, Nazwy, Macierz_100, Macierz_10).
2. Edytuj nazwy; kolumna **Status** = `zaakceptowane` / `do_poprawy`.
3. Po akceptacji: import do `city-names-pools.json` (ręcznie lub przyszły skrypt importu z Excel).
4. `python gra/tools/export-city-names.py` → aktualizuje `civs.json`.
5. Integrator: build `gra-robocza`.

**Uwaga:** Chińczycy — `miasta_panstwa` to nazwy **królestw wojujących** (Qin, Qi, Chu…), nie miasta geograficzne — celowo odróżnia od puli 100 miast.

---

## Próbki nazw (founding)

- **Grecy:** Ateny, Sparta, Korynt, Teby, Argos… (+ 95 historycznych polis)
- **Rzymianie:** Rzym, Ostia, Kapua, Mediolan, Akwileja…
- **Chińczycy:** Xi'an, Luoyang, Pekin, Nankin, Kaifeng…
- **Zulusi:** uMgungundlovu, Ondini, Ulundi, kwaBulawayo…

## Testy

```text
node gra/tools/city-names-pools-test.cjs
node gra/tools/civ-names-test.cjs
npx tsc --noEmit  (w gra/)
```
