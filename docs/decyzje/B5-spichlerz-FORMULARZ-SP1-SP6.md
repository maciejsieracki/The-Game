# FORMULARZ DECYZJI — Spichlerz B5 (SP1–SP6)

| Pole | Wartość |
|------|---------|
| **ID paczki** | B5-SP PLAYTEST |
| **Ekran** | Panel miasta (zakładka 🍞) + HUD mapy |
| **Test przed decyzją** | `Gra-podglad-ROBOCZA.html` → **Ctrl+F5** |
| **Kanon wdrożony** | `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` |
| **Data formularza** | 2026-07-01 |
| **Status** | **WYPEŁNIONE** — Maciej 2026-07-01 |

---

## Instrukcja

1. Przetestuj w ROBOCZA: miasto **bez** Spichlerza (kilka tur) i **ze** Spichlerzem.
2. Przy każdym pytaniu wybierz **A**, **B** lub **C**.
3. Wpisz litery w czacie: `SP1=A SP2=A SP3=A SP4=B SP5=A SP6=A`
4. Przy **SP1C**, **SP2C**, **SP5C** — dopisz 1–2 zdania własnymi słowami.

### Już zamknięte (nie wybieraj ponownie)

| ID | Decyzja |
|----|---------|
| B5-Q1 | Model hybrydowy (bufor miasta + zapasy państwa) |
| Pyt. 9 | **A** — suwak splitu w panelu miasta |
| Pyt. 10 | **A** — domyślnie **70/30** |
| B5-SPICH | Bez Spichlerza bufor→0 przy +1; ze Spichlerzem 50%; zapasy armii tylko ze Spichlerzem |

---

## SP1 — Sign-off model Spichlerza (P0)

**[EKRAN: Panel miasta → Spichlerz / Wzrost ludności]**

### O co chodzi

Dwa „magazyny": **bufor wzrostu** 🍞 (per miasto) i **zapasy państwa** 📦 (armia). Spichlerz: **50% bufora po wzroście** + **składanie żywności na armię**. Kod wdrożony — pytamy, czy **akceptujesz** po playteście.

### Opcje

| | **A — Zatwierdzam model** | **B — Reguły OK, bug w grze** | **C — Reguły do zmiany** |
|---|---|---|---|
| **Co zrobimy** | Sign-off B5-SPICH | Fix implementacji, kanon zostaje | Nowy kanon → handoff lane B |
| **Co zobaczysz** | Bez zmian reguł | Po fixie = jak w kanonie | Inna ekonomia |
| **Plusy** | Domknięcie batcha | Design bez przeróbki | Pełna zgodność z wizją |
| **Minusy** | UI może wymagać SP4 | Opóźnienie fix | ~1 sprint przeróbki |
| **Czas** | Już jest | ~2–4 dni | ~1 sprint |

**Rekomendacja MASTER:** **A** (lub **B** jeśli liczby kłamią).

**Twoja litera SP1:** `___`

**Komentarz (przy B/C):** _______________________________________________

---

## SP2 — Bufor po wzroście ludności — ze Spichlerzem w mieście (P1)

**[EKRAN: Pasek Wzrost 🍞 / szczegóły Spichlerz]**

### O co chodzi

Przy +1 mieszkańcu bufor jest „zużywany". **Ze Spichlerzem** dziś zostaje **50%** (np. 18→9). **Bez Spichlerza** → **0**.

### Opcje

| | **A — 50%** *(obecne)* | **B — 33%** | **C — 66%** |
|---|---|---|---|
| **Co zobaczysz** | Civ-owy standard | Słabszy Spichlerz | Mocniejszy boom miast |
| **Plusy** | Kanon 2026-06-29 | Wolniejszy wzrost | Spichlerz = must-build |
| **Minusy** | Szybki boom w wielu miastach | Mniej satysfakcji z budynku | Ryzyko OP |
| **Czas** | Już jest | ~1 dzień | ~1 dzień |

**Rekomendacja MASTER:** **A**.

**Twoja litera SP2:** `___` *(przy C: np. SP2C 40%)*

---

## SP3 — Kiedy imperium może składać żywność na armię? (P1)

**[EKRAN: Chip 📦 Zapasy + suwak Rozwój/armia]**

### O co chodzi

**Bez Spichlerza:** wojsko je tylko z bieżącej tury, reszta przepada. **Ze Spichlerzem:** 📦 rośnie. Dziś: wystarczy **≥1 Spichlerz gdziekolwiek** w imperium.

### Opcje

| | **A — Jeden Spichlerz w imperium** *(obecne)* | **B — Spichlerz w każdym mieście produkującym** | **C — Tylko stolica ze Spichlerzem** |
|---|---|---|---|
| **Co zobaczysz** | Stolica ze Spichlerzem = całe państwo odkłada | Więcej budynków do zarządzania | Kolonie bez efektu na 📦 |
| **Plusy** | Prosto, mało mikro | Głębsza ekspansja | Stolica strategiczna |
| **Minusy** | Może być „za tanio" | Trudniejsze dla nowego gracza | Definicja stolicy |
| **Czas** | Już jest | ~0,5 sprintu | ~0,5 sprintu |

**Rekomendacja MASTER:** **A** na v1.0.

**Twoja litera SP3:** `___`

---

## SP4 — Gdzie widzisz zapasy armii 📦? (P1)

**[EKRAN: Panel miasta + HUD mapy]**

### O co chodzi

Masz zamknięte **9A** (suwak w panelu). Chip 📦 jest dziś **tylko w panelu miasta**. Pytamy, czy na **mapie** też potrzebujesz liczby.

### Opcje

| | **A — Tylko panel miasta** *(9A)* | **B — Panel + HUD mapy** | **C — Tylko HUD mapy** |
|---|---|---|---|
| **Co zobaczysz** | 📦 po otwarciu miasta | 📦 na mapie i w panelu | Split w mieście, stan na mapie |
| **Plusy** | Mniej clutteru | Wygodne przy wojnie | Rozdział lokal/global |
| **Minusy** | Nie widać na mapie | Gęstszy HUD | Odwraca część 9A |
| **Czas** | Już jest | ~0,5 sprintu | ~0,5 sprintu |

**Rekomendacja MASTER:** **B** jeśli brakowało 📦 na mapie; inaczej **A**.

**Twoja litera SP4:** `___`

---

## SP5 — Domyślny suwak Rozwój miast / armia (P1)

**[EKRAN: Suwak pod Wzrost / Armia]**

### O co chodzi

Gdy nie ruszasz suwaka: dziś **70% miasta / 30% wojsko** (pyt. **10A**). Potwierdzenie po playteście.

### Opcje

| | **A — 70/30** *(10A)* | **B — 50/50** | **C — Inne — podaj %** |
|---|---|---|---|
| **Co zobaczysz** | Szybsze miasta, wojsko wymaga uwagi | Bezpieczniejsze wojsko | Twój balans |
| **Plusy** | Spec lane | Mniej głodu „z niczego" | Pełna kontrola |
| **Minusy** | Ryzyko głodu bez edukacji | Wolniejsze miasta | Musisz podać liczby |
| **Czas** | Już jest | ~1 dzień | ~1 dzień |

**Rekomendacja MASTER:** **A**, chyba że playtest = za częsty głód → **B**.

**Twoja litera SP5:** `___` *(przy C: np. SP5C 60/40)*

---

## SP6 — Limit zapasów armii 📦 (P2)

**[EKRAN: 📦 Zapasy + szczegóły]**

### O co chodzi

Dziś **brak górnego limitu** — 📦 może rosnąć w nieskończoność. Pytamy o v1.0.

### Opcje

| | **A — Bez limitu** *(obecne)* | **B — Ostrzeżenie UI przy wysokich** | **C — Twardy limit pojemności** |
|---|---|---|---|
| **Co zobaczysz** | Hoarding możliwy | Info bez kary | Nadwyżka przepada |
| **Plusy** | Prosto | Zero zmiany balansu | Głębsza ekonomia |
| **Minusy** | Późna gra zbyt bezpieczna | Tylko kosmetyka | ~1 sprint |
| **Czas** | Już jest | ~2–3 dni | ~1 sprint |

**Rekomendacja MASTER:** **A** na v1.0.

**Twoja litera SP6:** `___`

---

## Podsumowanie — wpisz litery

| ID | Temat | Litera | Data |
|----|-------|--------|------|
| SP1 | Sign-off model | **A** | 2026-07-01 |
| SP2 | % bufora po wzroście | **A** (50%) | 2026-07-01 |
| SP3 | Składanie na armię | **A** (≥1 Spichlerz w imperium) | 2026-07-01 |
| SP4 | Gdzie widać 📦 | **C** (tylko HUD mapy) | 2026-07-01 |
| SP5 | Domyślny suwak | **A** (70/30) | 2026-07-01 |
| SP6 | Limit zapasów | **C** — **100 🍞 na każdy Spichlerz** w państwie (2×=200…); upgrade budynków — osobna decyzja później | 2026-07-01 |

### Odpowiedź Macieja (zapis)

```
SP1=A SP2=A SP3=A SP4=C SP5=A SP6=C
SP6 szczegóły: limit = 100 żywności × liczba Spichlerzy w państwie (np. 2 → 200).
Upgrade poziomów Spichlerza (większa pojemność) — decyzja później.

SP6-overflow=A  SP4-szczegoly=A  SP6-HUD=B  (doprecyzowanie 2026-07-01)
```

| ID | Decyzja |
|----|---------|
| **SP6-overflow** | **A** — nadwyżka powyżej limitu **przepada** co turę |
| **SP4-szczegóły** | **A** — 📦 **tylko HUD**; panel = bufor 🍞 + suwak (bez zapasów nawet w szczegółach) |
| **SP6-HUD** | **B** — na mapie: **142 / 200** (z limitem) |

### Uwaga SP4 vs pyt. 9A

**9A** (zamknięte): suwak splitu w panelu miasta. **SP4=C** dotyczy **wyświetlania 📦 Zapasy** — tylko HUD mapy, **nie** chip w panelu. Suwak 70/30 zostaje w panelu (SP5=A).

---

## Po Twoich decyzjach (MASTER)

→ Zapis `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` + `REJESTR-DECYZJI.md`  
→ Handoff lane B / UI / A (zależnie od SP2–SP6)  
→ Integrator F tylko jeśli wymaga `main.ts`
