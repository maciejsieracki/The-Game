# HANDOFF: Model Dostępu Surowców v0.1 — podział cross-lane

**Autor:** Sonnet-subagent sesji EKONOMIA  
**Data:** 2026-06-25  
**Status:** GOTOWY DO ROZDZIAŁU przez Mastera  
**Źródło modelu:** zatwierdzony przez Maciej 2026-06-25 (czat)  
**Pełna dokumentacja:** `Civ/EKONOMIA/EKONOMIA-analiza-surowce-budynki.md` — sekcja "MODEL DOSTĘPU v0.1"

---

## Kontekst: co się zmieniło

W v0.1 surowce to **DOSTĘP** (boolean per cywilizacja), nie ilości w magazynie.
Budynki-przetwórnie dostają **płaski bonus** (+Praca/+Pieniądz), bramkowany dostępnością surowca.
Konwertery ilościowe (converters.ts), magazyn per-typ i przeroby Excel → PARKOWANE do v0.2.

---

## Definicja Done (DoD) — per lane

### LANE: MAPA / SILNIK

- [ ] **Terytorium** cywilizacji = unia zasięgów wszystkich jej miast + fortów + strażnic.  
  Każde nowe miasto/fort/strażnica rozszerza terytorium przy postawieniu.
- [ ] **Ulepszenia terenu** (kopalnia, farma, pastwisko itp.) można stawiać **wyłącznie w terytorium** własnej cywilizacji.  
  Próba postawienia poza terytorium → błąd/blokada UI.
- [ ] **Złoża surowców** są przypisane do heksów na mapie globalnej (pole `surowiec` lub `zloza` na heksie).  
  Format do uzgodnienia z lane DANE (`resources.json` → `id` ASCII).
- [ ] Silnik eksponuje funkcję/dane: `dostępneSurowce(civId): Set<string>` — zbiór kluczy ASCII surowców dostępnych danej cywilizacji (złoże w terytorium + ulepszenie postawione). Używane przez EKONOMIA do bramkowania.

---

### LANE: DANE

- [ ] **`gra/data/resources.json`** — każdy surowiec dostaje pole `"id"` (ASCII lowercase, bez polskich znaków):
  ```json
  { "id": "ruda", "nazwa": "Ruda", ... }
  { "id": "drewno", "nazwa": "Drewno", ... }
  { "id": "kamien", "nazwa": "Kamień", ... }
  { "id": "zloto", "nazwa": "Złoto", ... }
  ...
  ```
  Klucze `id` muszą być spójne z kluczami używanymi w `buildings.json` → `wymaganySurowiec`.

- [ ] **`gra/data/improvements.json`** — nowy plik, definicje ulepszeń terenu:
  ```json
  [
    { "id": "kopalnia",  "nazwa": "Kopalnia",  "kosztPracy": 20, "wymaganaTech": "Murarstwo",       "surowiecOdblokowany": "ruda",   "efekty": { "praca": 1 } },
    { "id": "farma",     "nazwa": "Farma",     "kosztPracy": 10, "wymaganaTech": "Rolnictwo",        "surowiecOdblokowany": null,     "efekty": { "zywnosc": 2 } },
    { "id": "pastwisko", "nazwa": "Pastwisko", "kosztPracy": 15, "wymaganaTech": "OswojeniZwierzat", "surowiecOdblokowany": "bydlo",  "efekty": { "zywnosc": 1 } }
  ]
  ```
  Pole `surowiecOdblokowany` wskazuje, który surowiec (klucz ASCII) jest dostępny gdy ulepszenie stoi na złożu.
  Parametry liczbowe (kosztPracy, efekty) do pobrania z `econ-params.json` (klucze `ulepszenie_*` już istnieją).

---

### LANE: MIASTO

- [ ] **Budynki-przetwórnie** — dodać/uzupełnić wpisy w `gra/data/buildings.json`:
  - Każdy budynek przetworczy (Stolarnia, Warsztat kamieniarski, dawne konwertery: Tartak/Mielerz/Cegielnia/Huta/Garncarnia) dostaje:
    - `"bonus"`: płaska wartość (+Praca lub +Pieniądz) zamiast przepustowości ilościowej
    - `"wymaganySurowiec"`: klucz ASCII surowca (z `resources.json`) lub `null` (brak wymogu)
  - Przykład:
    ```json
    { "id": "stolarnia",  "bonus": { "praca": 5 }, "wymaganySurowiec": "drewno" },
    { "id": "kuznia",     "bonus": { "praca": 6, "pieniadz": 1 }, "wymaganySurowiec": "ruda" },
    { "id": "tartak",     "bonus": { "praca": 3 }, "wymaganySurowiec": "drewno" },
    { "id": "huta",       "bonus": { "praca": 4 }, "wymaganySurowiec": "ruda" },
    { "id": "garncarnia", "bonus": { "zadowolenie": 1, "praca": 2 }, "wymaganySurowiec": "glina" }
    ```

- [ ] **Naprawa Kuźni:** zmienić `wymaganySurowiec` z `"miedź lub cyna"` → `"ruda"` (Miedź/Cyna nie istnieją w resources.json).

- [ ] **Brakujące budynki** — dodać do `buildings.json` z płaskim bonusem:
  | Budynek | Epoka | Bonus (propozycja) | wymaganySurowiec |
  |---|---|---|---|
  | Kopalnia (miejska) | Kamień | +3 Praca | `kamien` lub `ruda` |
  | Młyn | Kamień | +2 Praca + mnożnik ×2 Pracy brutto (Spec §1.2) | `drewno` |
  | Mennica | Brąz | +mnożnik Handlu→Pieniądz (Spec §2.3) | `ruda` lub `null` |
  | Akwedukt | Brąz | odblokowuje wzrost populacji >4 (Spec §econ-params `akwedukt_prog`) | `null` |
  | Stajnia | Brąz | dostęp do jednostek konnych (bramkowanie w UNITS) | `kon` |

- [ ] **Epoka Żelazo** — budynki Żelaza do zaprojektowania (brak danych; Maciej zatwierdził 3 epoki, ale Żelazo bez definicji budynków). Placeholder: puste `epokaWejscia: 3` w buildings.json z `TODO`.

---

### LANE: EKONOMIA (moje — kontrakt do wpięcia przez Mastera)

- [x] `economy.ts` już sumuje płaskie bazy budynków (praca/pieniądz z buildings.json).
- [ ] **Reguła bramkowania** — nowa logika w `economy.ts` (lub `turn-economy.ts`):
  ```typescript
  // Pseudokod — kontrakt do wpięcia
  function activeBuildingBonus(building: Building, dostępneSurowce: Set<string>): number {
    if (!building.wymaganySurowiec) return building.bonus; // zawsze aktywny
    return dostępneSurowce.has(building.wymaganySurowiec) ? building.bonus : 0;
  }
  ```
  Wywołanie: przy obliczaniu `cityYield` dla każdego budynku w mieście, przekazać zbiór `dostępneSurowce` cywilizacji (dostarcza MAPA/SILNIK).

- [x] **PARKOWANE — NIE ruszać:**
  - `converters.ts` — logika 1:1 + przepustowość (30/30 PASS) → zostaje bez zmian
  - `applyResourceIntake` / `resourceStorageCapacityPerType` w `economy-upkeep.ts` → parking
  - Ilości surowców w magazynie per-typ → nie używane w v0.1

---

### LANE: DYPLOMACJA (szkic — poza zakresem v0.1)

- [ ] Handel surowcami = wymiana **dostępu** (nie ilości):  
  Umowa dyplomatyczna → tymczasowy wpis do `dostępneSurowce(civId)` surowca sojusznika.  
  Mechanika: czas trwania umowy, warunek pokoju/sojuszu, możliwe wygaśnięcie.  
  Szczegóły do zaprojektowania przez lane DYPLOMACJA w v0.2+.

---

## Zależności między lane'ami (kolejność)

```
DANE (resources.json + improvements.json)
  ↓ dostarcza klucze ASCII surowców
MIASTO (buildings.json + wymaganySurowiec)
  ↓ dostarcza definicje budynków
MAPA/SILNIK (terytorium + dostępneSurowce)
  ↓ dostarcza Set<string> per cywilizacja
EKONOMIA (bramkowanie bonusu w economy.ts)
  ↓ wynik: cityYield z aktywnym/nieaktywnym bonusem
```

---

## Pytania otwarte (do decyzji Mastera/Maciej)

**Q-A1:** Jak dokładnie MAPA/SILNIK eksponuje `dostępneSurowce`?  
Opcje: (a) pole na obiekcie `cywilizacja` aktualizowane co turę, (b) funkcja wołana z `economy.ts`, (c) event/callback.  
Rekomendacja: pole na obiekcie cywilizacji (najprostsza integracja z economy.ts).

**Q-A2:** Epoka Żelazo — kiedy projektujemy budynki?  
Maciej zatwierdził 3 epoki, ale Żelazo bez definicji budynków i ekonomii. Czy to blokuje release v0.1 (Kamień+Brąz działające), a Żelazo jako pusty shell?

**Q-A3:** Mennica — płaski bonus czy mnożnik?  
Spec §2.3 mówi o mnożniku Handel→Pieniądz po Walucie+Mennicy. Mnożnik to wyjątek od „płaski bonus" — czy Mennica dostaje specjalne pole `mnoznik` w buildings.json, czy płaski bonus +X Pieniądza?

---

## DECYZJE MACIEJ (2026-06-25) — ROZSTRZYGNIETE. ROUTING: do MIASTO

- **Q-A1 = A:** `dostepneSurowce` = **pole na obiekcie cywilizacji, odswiezane co ture** (MAPA/SILNIK liczy terytorium + zloza z postawionymi ulepszeniami → Set<string> kluczy ASCII). EKONOMIA czyta to pole przy bramkowaniu bonusu budynku.
- **Q-A2 → MACIEJ KORYGUJE (2026-06-25): ZELAZO = PROJEKTUJEMY** (wczesniejsze "shell" mastera bylo pomylka). ALE to **glownie BUDYNKI = lane MIASTO** (juz zlecone tam). EKONOMIA: moja ekonomia jest **epoko-agnostyczna** (cap=epoka×10, prog skaluje sie z epoka, mnozniki dzialaja dla kazdej epoki) — Zelazo **NIE wymaga nowych modulow ekonomii ode mnie**; ewent. dodam parametry Zelaza, gdyby okazaly sie potrzebne. Realna robota nad Zelazem = **MIASTO** (budynki) + **DANE** (zloza/surowce zelaza). Placeholder "shell" z poprzedniej wersji = NIEAKTUALNY.
- **Q-A3 = A (z refinementem mastera 2A):** **Mlyn i Mennica zostaja MNOZNIKAMI** (zgodnie ze Spec §1.2/§2.3). Logika JUZ jest w economy.ts (maMlyn → ×mnoznik Pracy + bonus; maMennica/mennicaMnoznik → Handel→Pieniadz ×mnoznik). REFINEMENT mastera (2A): mnoznik Handel→Pieniadz dziala na **POZIOMIE CYWILIZACJI**, gated po Walucie+Mennicy, **baza = 2**, a **wariacja per-nacja przychodzi z CYWILIZACJE**. **Mennica = pole `mnoznik` w buildings.json** (MIASTO realizuje/odblokowuje mnoznik). Wartosc/per-nacja mnoznika NIE nalezy do EKONOMIA — to CYWILIZACJE + MIASTO. EKONOMIA dostarcza tylko istniejaca mechanike mnoznika w economy.ts.

>> **MACIEJ POLECIL: PRZEKAZAC DO MIASTO.** Caly blok "bonusy budynkow w miescie + Mlyn/Mennica + definicje budynkow + epoka Zelazo" jest w gestii **lane MIASTO** (potwierdzone przez Macieja: "to sa tematy samego miasta"). EKONOMIA NIE robi tych bonusow — dostarcza tylko: (1) reguly bramkowania (kontrakt sekcja LANE: EKONOMIA wyzej), (2) parametry w econ-params.json. Master: rozdysponuj sekcje MIASTO (+ DANE/MAPA) do wlasciwych zakladek; Zelazo = nowy temat projektowy dla MIASTO przed releasem.

