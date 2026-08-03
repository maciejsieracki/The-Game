# PLAN — automatyczne ulepszenia terenu (Maciej 2026-08-02)

**Status:** decyzja **Q1=C** (2026-08-03) — wdrażanie. Profile + checkbox „tylko 👤” (domyślnie off).  
**Cytat:** „przydałaby się też w budowaniu ulepszeń automatyczna funkcja… podzielić na typy… albo tylko tam, gdzie produkują obywatele”.

Powiązane (budynki, nie teren): `PLAN-AUTO-LISTA-BUDOWNICZA-2026-08-02.md` — auto z listy kolejności + szablony epok.

---

## 1. Co jest dziś

| Obszar | Stan |
|--------|------|
| **Auto budynki w mieście** | Profile Budowa (`wzrost` / `wojsko` / `kultura` / `prawo` / `produkcja` / `zrownowazone`) + tryb auto/ręczny |
| **Auto Okolica (pola 👤)** | Profile `zywnosc` / `produkcja` / `podatki` / `zrownowazone` |
| **Ulepszenia terenu (gracz)** | Tylko ręcznie: tryb 🔨 → klik heks → koszt z puli Pracy państwa |
| **Ulepszenia (AI)** | Już ma `planCityImprovements()` — max 1/miasto/turę, stała kolejność food→surowce→infra |

**Wniosek:** logika kwalifikacji heksów i AI-planner są gotowe; brakuje **przełącznika + profili dla gracza** (i wspólnego pickera zamiast tylko AI).

---

## 2. Cel produktowy

Gracz włącza auto-ulepszenia → gra sama wydaje Prácę z puli państwa na ulepszenia w terytorium, wg wybranego **profilu priorytetów** (jak Budowa/Okolica), bez klikania każdego heksu.

---

## 3. Trzy warianty zasięgu (do wyboru jutro)

### A. Całe terytorium miasta (rekomendacja v1)
Jak AI dziś: kandydaci = heksy w terytorium miasta spełniające `canBuild`, tech, sektory.
- **Za:** maksymalna korzyść; spójne z AI; żywność + surowce (tartak nie wymaga 👤).
- **Przeciw:** może budować „na zapas” poza polami, które teraz pracują.

### B. Tylko heksy z obywatelami (👤 na mapie)
Tylko `workedTiles` miasta (+ ewentualnie centrum).
- **Za:** „buduj tam, gdzie już pracujemy”; mniej marnowania Pracy.
- **Przeciw:** surowce terytorialne (tartak/kopalnia bez 👤) prawie nie wejdą; wolniejszy rozwój magazynu.

### C. Hybryda (profil + filtr)
Profil wybiera **co** (żywność / produkcja-surowce / infra), a przełącznik **gdzie**:
- „Tylko pola z 👤” vs „Całe terytorium”.
- **Za:** elastyczność; Maciej testuje oba style.
- **Przeciw:** więcej UI; v1 trochę dłuższa.

**Rekomendacja planu:** **C w UI, v1 startuje jak A** (całe terytorium) + checkbox „tylko pola z obywatelami” domyślnie wyłączony.

---

## 4. Profile priorytetów (mirror miast)

Propozycja 4–5 profili (krócej niż Budowa, bo mniej typów):

| Profil | Najpierw buduje | Potem |
|--------|-----------------|-------|
| **Żywność** | farma, irygacja, hodowla, tarasy, łowiectwo/rybołówstwo | — |
| **Surowce / produkcja** | tartak, kamieniołom, glinianka, kopalnie, sól, złoto, stadnina | — |
| **Infrastruktura** | drogi, fort, posterunek | — |
| **Zrównoważone** | food → surowce → infra (jak obecne AI) | wyrąb gdy blokuje |
| *(opcjonalnie)* **Wyrąb+** | najpierw wyrąb lasów blokujących, potem wg zrównoważonego | |

Mapowanie 1:1 na istniejące `AI_IMPROVEMENT_PRIORITY` / kategorie z `terrain-improvements.json`.

---

## 5. Sterowanie UI (propozycja)

1. **Toolbar w panelu miasta** (obok Okolica / Budowa) albo sekcja w trybie 🔨:
   - Tryb: **Auto / Ręczny**
   - Focus: chipy profili (jak Budowa)
   - Opcja: ☑ Tylko heksy z obywatelami
2. **Budżet:**
   - Max **1 ulepszenie / miasto / turę** (jak AI) — bezpieczny start
   - Albo % puli Pracy zarezerwowanej na auto (suwak) — do ABC później
3. **Feedback:** jedna linia w logu / toast: „Auto: Farma @ (q,r) — −20 Pracy”

Bez wymuszania otwartego trybu Budowa na mapie — auto działa w tle na końcu tury.

---

## 6. Architektura (technicznie, krótko)

```
koniec tury (gracz)
  → dla każdego miasta z ulepszeniaTryb=auto
  → pickAutoImprovement(city, focus, onlyWorked?, pool)
  → qualification = improvement-build.ts (to samo co ręcznie/AI)
  → odejmij z playerPracaPool · postaw pending (jak gracz) lub commit
```

- **Wyciągnąć** `planCityImprovements` z `ai.ts` → wspólny moduł (gracz + AI).
- **Nie duplikować** `canBuild` / sektorów / tech.
- OwnerId-agnostic: ta sama funkcja dla AI.

Pliki startowe: `auto-manage.ts` (wzorzec), `ai.ts` (planner), `improvement-build.ts`, `cityPanel.ts`, `main.ts` (pula + tura).

---

## 7. Ryzyka / decyzje na jutro

1. **Gdzie budować?** A / B / C (sekcja 3).
2. **Ile na turę?** 1/miasto vs więcej vs limit Pracy.
3. **Pending vs od razu?** Gracz dziś ma pending do końca tury — auto powinno też (cofnięcie?) czy commit jak AI.
4. **Wyrąb:** osobny profil czy zawsze na końcu zrównoważonego.
5. **Cywilizacja-specyficzne** (lama, tarasy): auto respektuje te same bramki co ręczne.
6. **Spójność z Zarządcą ⚙:** osobny przełącznik vs część Zarządcy.

---

## 8. Proponowana kolejność wdrożenia (po decyzji)

1. Wspólny `pickAutoImprovement` + testy (port z AI).
2. Stan miasta: `ulepszeniaTryb` / `ulepszeniaFocus` (+ filtr worked).
3. UI toolbar + domyślnie **ręczny**.
4. Wpięcie końca tury + log.
5. Playtest: 1 miasto, profil Żywność vs Surowce.

---

*Koniec planu · 2026-08-02 · do rozmowy z Maciejem.*
