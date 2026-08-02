# PLAN — auto-budowa z listy (kolejność + szablony epok) · Maciej 2026-08-02

**Status:** plan do rozmowy jutro — **bez implementacji**.  
**Cytat:** „w miastach brakuje ustawienia, że nie wybierasz typu budynku, tylko buduje po kolei z listy… w przyszłości lista dla danej epoki… w danym mieście mogę wgrać listę”.

Powiązane: `PLAN-AUTO-ULEPSZENIA-2026-08-02.md` (auto ulepszeń terenu — osobny tor).

---

## 1. Co jest dziś (ważne — żeby nie mylić)

| Tryb | Stan |
|------|------|
| **Ręczny** | Gracz klika budynek → kolejka miasta |
| **Auto wg profilu** | Już działa: chipy Budowa (wzrost / wojsko / kultura / prawo / produkcja / zrównoważone) → `pickAutoBuildItem` wybiera **kategorię**, potem najtańszy dostępny budynek w tej kategorii |
| **Auto wg listy kolejności** | **Brak** — nie da się powiedzieć „najpierw Spichlerz, potem Koszary, potem Targowisko” |

**Wniosek:** Maciej opisuje **trzeci tryb** (lista), nie samo włączenie auto. Profile kategorii zostają jako szybki start; lista = pełna kontrola kolejności.

---

## 2. Cel produktowy

1. **v1 — lista w mieście:** w panelu Budowa gracz układa własną kolejkę docelową (dowolna długość) → tryb **Lista** buduje **ściśle po kolei**, pomijając to, czego nie da się jeszcze zbudować (brak tech / surowców / już stoi), i wraca do pozycji gdy się odblokuje **albo** przeskakuje dalej (do ABC).
2. **v2 — szablon epoki:** osobna „receptura” na epokę (Kamień / Brąz / Żelazo): ustalasz raz listę budynków w kolejności → **wgrywasz** do miasta (lub do wszystkich miast) → każde miasto z tą listą buduje tak samo.

---

## 3. Trzy tryby Budowy (propozycja UI)

```
[ Ręczny ]  [ Auto: profil ]  [ Lista ]
```

| Tryb | Zachowanie |
|------|------------|
| **Ręczny** | jak dziś |
| **Auto: profil** | jak dziś (`budowaFocus`) |
| **Lista** | bierze następny element z `budowaLista[]` który jest legalny (tech, epoka, koszt surowców, nie zbudowany, dostępny w tym mieście) |

Domyślnie: **Ręczny** (bez zaskoczenia).

---

## 4. Lista miasta (v1)

### Co to jest
Tablica ID budynków w ustalonej kolejności, np.:

`spichlerz → studnia → koszary → targowisko → …`

- Długość: **bez limitu** (Maciej: „tyle, jak chcę”).
- Edycja: przeciągnij / ↑↓ / usuń / dodaj z katalogu dostępnych (albo z pełnej listy epoki z szarym „jeszcze niedostępne”).
- Po zbudowaniu pozycji: kursor idzie dalej; zbudowane zostają odhaczone (nie buduje drugi raz tego samego ID, chyba że budynek ma wiele poziomów — wtedy kolejny poziom wg reguł gry).

### Gdy pozycja zablokowana
**Decyzja na jutro (A/B/C):**

| | Zachowanie | Sens |
|---|------------|------|
| **A. Pomiń i wróć później** | idź dalej listą; gdy odblokuje się wcześniejsza — wróć | elastyczne, mniej przestojów |
| **B. Czekaj** | kolejka pusta / nic nie buduj, aż ta pozycja będzie legalna | ścisła kolejność „jak zapisałem” |
| **C. Pomiń na stałe w tym mieście** | raz pominięta = skreślona z listy miasta | proste, ryzykowne przy pomyłce |

**Rekomendacja planu:** **A** (pomiń tymczasowo + wróć), z opcjonalnym „twardym czekaniem” na pozycję (pin) później.

### Jednostki na liście?
Na start: **tylko budynki** (jak auto profil). Jednostki zostają ręczne / osobna kolejka — mniej chaosu. Do ABC jeśli Maciej chce mieszaną listę.

---

## 5. Szablony epok (v2 — „w przyszłości”)

### Idea
Gracz (lub my w danych startowych) ma **Bibliotekę list**:

| Szablon | Epoka | Przykład kolejności |
|---------|-------|---------------------|
| „Start Kamienia” | 1 | Spichlerz → Studnia → … |
| „Wojsko Brązu” | 2 | Koszary → … |
| „Stolica Żelaza” | 3 | … |

- Szablon = nazwa + epoka + lista ID (dowolna długość).
- **Wgraj do miasta** → kopiuje listę do `city.budowaLista` + ustawia tryb Lista.
- Opcja później: **Wgraj do wszystkich miast** / tylko nowe miasta / tylko bez własnej listy.

### Skąd lista startowa
- v2a: tylko ręczne szablony gracza (zapis w save).
- v2b: gotowe szablony w JSON (balans / poradnik) + gracz może klonować i edytować.

**Rekomendacja:** najpierw v1 (lista per miasto w save), potem v2a (szablony w save), potem ewentualnie JSON kanoniczny.

---

## 6. Gdzie w UI

1. Zakładka **Budowa** — przełącznik trybów + gdy Lista:
   - pasek „kolejka docelowa” (numery 1…N),
   - przycisk **Edytuj listę**,
   - (v2) **Wgraj szablon…**
2. Feedback: „Następne z listy: Spichlerz” / „Lista: 3/12 — czekam na tech X”.
3. Alert „Kolejka pusta” — **nie** gdy tryb Lista i są jeszcze niedostępne pozycje (komunikat inny: „Lista czeka na odblokowanie”).

---

## 7. Architektura (krótko)

```
pickAutoBuildItem(city, …)
  jeśli tryb === 'lista' → nextFromBudowaLista(city.budowaLista, dostępne)
  jeśli tryb === 'auto'  → jak dziś (profil kategorii)
  jeśli 'reczny'         → null
```

- Stan: `budowaTryb: 'reczny' | 'auto' | 'lista'` (+ istniejący `budowaFocus` tylko dla `auto`).
- `budowaLista: string[]` (ID budynków) + opcjonalnie `budowaListaCursor`.
- v2: `budowaSzablony: { id, nazwa, epoka, lista }[]` w meta save / osobny store gracza.
- Save/load + te same bramki co dziś (`buildableProduction`, SUROW-CIV-01 pula państwa).
- AI **nie** używa list gracza (zostaje własna heurystyka) — chyba że później damy AI te same szablony z JSON.

Pliki: `auto-manage.ts`, `cities.ts`, `cityPanel.ts`, `main.ts` (save meta), testy `auto-manage-test.cjs`.

---

## 8. Ryzyka / decyzje na jutro

1. **Tryby:** zostawić profil + dodać Listę, czy zastąpić profile listą? → **rekomendacja: trzy tryby obok siebie**.
2. **Blokada pozycji:** A pomiń+wróć / B czekaj / C skreśl (sekcja 4).
3. **Zakres wgrania szablonu:** tylko to miasto / wszystkie / nowe miasta.
4. **Epoka szablonu:** filtruj listę do budynków ≤ bieżącej epoki gracza, czy pełna lista z szarymi pozycjami?
5. **Poziomy budynków (upgrade):** osobne pozycje na liście vs auto „następny poziom tego samego ID”.
6. **Kolejność vs ręczna kolejka miasta:** Lista **dopina** do kolejki produkcji gdy front pusty (jak obecne auto) — nie kasuje ręcznych wpisów gracza.

---

## 9. Kolejność wdrożenia (po decyzji)

1. **v1:** `budowaTryb='lista'` + `budowaLista` + picker + testy + UI edycji w jednym mieście.
2. Save/load listy.
3. Komunikaty / alerty.
4. **v2:** biblioteka szablonów + „Wgraj do miasta”.
5. (opcjonalnie) szablony startowe w JSON per epoka.

---

## 10. Relacja do auto-ulepszeń

| Tor | Co |
|-----|-----|
| Budynki | ten plan (lista / profil / ręczny) |
| Ulepszenia terenu | `PLAN-AUTO-ULEPSZENIA-…` (profile żywność/surowce + filtr 👤) |

Jutro można omówić **oba** w jednej rozmowie: najpierw budynki (lista), potem ulepszenia — albo odwrotnie, jak wolisz.

---

*Koniec planu · 2026-08-02 · do rozmowy z Maciejem.*
