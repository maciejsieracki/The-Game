# R-DYST-DREWNO — propozycja tabel kosztów surowcowych (rekrutacja + utrzymanie)

**Status:** 📝 PROPOZYCJA (2026-08-06) — czeka akceptacji Macieja / doprecyzowania liczb  
**Źródła:** `gra/data/units.json` · decyzja Q1 (drewno dla wszystkich jednostek epoki Kamień) · zasada Macieja: *surowiec rekrutacji = też utrzymanie* · wzorzec ilości z Brązu (tam gdzie jest Brąz: zwykle **2**, oblężenie/super **3**)

## Zasady propozycji

1. **Rekrutacja (Kamień → Drewno):** ilości jak **Brąz** u odpowiedników roli (głównie **2**, taran/ciężkie **3**).  
2. **Dystans w Brązie ma dziś Brąz×0** — w Kamieniu i tak dajemy Drewno (Q1); proponuję **2** (jak piechota standardowa), nie 0.  
3. **Utrzymanie surowcowe (nowe — dziś w kodzie jednostek go NIE MA):** proponuję **1 sztuka tego samego surowca / turę**, gdy rekrutacja surowcowa > 0.  
   - Jak budynki: „1 na typ”, nie pełna ilość rekrutacji (pełne ×2/turę szybko zjada tartaki).  
   - Alternatywa ostra: utrzymanie = pełna ilość rekrutacji / turę — tylko jeśli Maciej tak każe.  
4. **Pieniądz / żywność** — bez zmian w tej propozycji (zostają kolumny ¤ i żywność z JSON).  
5. **Parytet AI** — te same koszty dla gracza i AI.

---

## 1. Epoka Kamień — propozycja (dziś wszystko Drewno×0)

| Jednostka | Typ / klasa | Analog w Brązie (koszt Brązu) | **Rekrutacja Drewno** | **Utrzymanie Drewno/turę** | Uwagi |
|-----------|-------------|------------------------------|----------------------:|--------------------------:|-------|
| Wojownik | Swordsman · Standardowa | Wojownik z mieczem i tarczą (**Brąz×2**) | **2** | **1** | |
| Wojownik z maczugą (Chaska) | Offensive · Specjalna | Wojownik z toporem / Offensive (**Brąz×2**) | **2** | **1** | |
| Oszczepnik | Distance · Standardowa | (w Brązie dystans **0**) | **2** | **1** | Q1: drewno mimo 0 w Brązie |
| Łucznik | Distance · Standardowa | j.w. | **2** | **1** | |
| Oszczepnik (Estólica) | Distance · Specjalna | j.w. | **2** | **1** | |
| Oszczepnik Zulu (Izijula) | Distance · Specjalna | j.w. | **2** | **1** | |
| Łucznik egipski | Distance · Specjalna | j.w. | **2** | **1** | |
| Łucznik sumeryjski | Distance · Specjalna | j.w. | **2** | **1** | |
| Taran | Siege · Specjalna | Taran okuty (**Brąz×3**) | **3** | **1** | |
| Zwiadowca | Civilian · Standardowa | brak analogu z Brązem | **1** | **1** | lżejszy cywilny; można podnieść do 2 |

**Suma typów Kamień:** 10 jednostek · rekrutacja Drewno 1–3 · utrzymanie Drewno 1/turę.

---

## 2. Epoka Brąz — rekrutacja (stan JSON) + propozycja utrzymania surowca

Dystans / procarze z **Brąz×0** → utrzymanie surowca **0** (brak surowca rekrutacji).

| Jednostka | Surowiec rekrutacji (dziś) | **Utrzymanie surowiec/turę (propozycja)** |
|-----------|---------------------------|------------------------------------------:|
| Włócznik | Brąz×2 | Brąz **1** |
| Wojownik z mieczem i tarczą | Brąz×2 | Brąz **1** |
| Konnica / Rydwan (woły) / Rydwan konny | Brąz×2 | Brąz **1** |
| Galera | Brąz×2 | Brąz **1** |
| Wszystkie Specjalne wręcz/flanka z Brąz×2 (Impi, khopesh, rydwany civ, Sherden, …) | Brąz×2 | Brąz **1** |
| Taran okuty / Wieża oblężnicza | Brąz×3 | Brąz **1** |
| Super (Gwardie: Sumer, Shang, Medżaj, Inkowie, Zulusi) | Brąz×3 | Brąz **1** |
| Łucznik akadyjski / asyryjski / nubijski | —×0 | **0** |
| Procarz / Procarz (Huaracoc) | —×0 | **0** |

*(Pełna lista ×2 w JSON: 28 jednostek Brąz×2 · 7 jednostek Brąz×3 · reszta dystans 0.)*

---

## 3. Epoka Żelazo — rekrutacja (stan JSON) + propozycja utrzymania surowca

| Jednostka (wzór) | Surowiec rekrutacji (dziś) | **Utrzymanie surowiec/turę (propozycja)** |
|------------------|---------------------------|------------------------------------------:|
| Większość Specjalnych (Hastati, Falanga, Drużynnik, konnice, …) | Żelazo×2 | Żelazo **1** |
| Katapulta / Triari / Super (Evocati, Hieros Lochos, Wojownik germański) | Żelazo×3 | Żelazo **1** |

*(JSON: 20× Żelazo×2 · 5× Żelazo×3.)*

---

## 4. Wdrożenie (gdy Maciej zaakceptuje tabele)

1. `units.json`: Kamień — `Surowiec=Drewno`, `Surowiec (ilość)=…`.  
2. Nowe pole utrzymania surowcowego jednostek (np. `Utrzymanie surowiec` + ilość **albo** reguła silnika: „1/turę tego samego typu co rekrutacja, gdy ilość>0”).  
3. Silnik: pobieranie z puli państwa co turę (parytet AI) + UI (panel miasta / tooltip jednostki).  
4. Testy + Panel-C regen.

## Otwarte do decyzji Macieja (tylko jeśli nie akceptuje defaultu)

- Utrzymanie = **1/turę** (rekomendacja) vs **pełna ilość rekrutacji/turę**.  
- Zwiadowca: Drewno **1** vs **2**.  
- Czy Brąz/Żelazo **dystans z ×0** ma dostać Drewno później, czy zostaje 0.
