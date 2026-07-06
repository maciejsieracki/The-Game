# Roster-6 + Celtowie — parametry i wygląd (Maciej · 2026-07-04)

**Cel:** jedna karta decyzyjna — najpierw **staty i reguły**, potem **4 widoki** każdej jednostki.  
**Źródło nazw/lore:** Grupa D (CYW) · **implementacja statów + modele:** Grupa C (UNITS).  
**Stan danych:** `gra/data/units.json` — **67 wpisów** (draft statów roster-6 już w pliku; **do Twojej akceptacji**).

---

## 1. Podział ról (nie mylić)

| Kto | Co dostarcza |
|-----|----------------|
| **Grupa D / CYW** | `civs.json` — nazwa spec., bonus cyw, epoka startu, charakter, `W zamian za` (propozycja) |
| **Grupa C / UNITS** | `units.json` — liczby, tech, epoka jednostki, testy walki, modele 3D |
| **Ty (Maciej)** | Akceptacja balansu (ABC) · referencje wizualne **4 strony** · ewent. korekty lore |
| **EKONOMIA** | Produkcja w mieście — filtr `Nacja` + token `jednostka_specjalna` (osobny batch) |

**Grupa D nie wpisuje statów** — tylko nazwy i sens jednostki. Macierz liczb = UNITS wg reguł poniżej.

---

## 2. Parametry — co znaczy każde pole (prosto)

Każdy wiersz w `units.json` to jedna jednostka. Pola dzielimy na **4 grupy**.

### A. Tożsamość i produkcja

| Pole | Zasada |
|------|--------|
| **Jednostka** | Unikalna nazwa PL (jak w `civs.json` dla spec.) |
| **Nacja** | Dokładnie: `Harappa`, `Hetyci`, `Słowianie`, `Babilonia`, `Asyria`, `Fenicjanie`, `Celtowie` — inaczej nie widać w produkcji |
| **Kultura** | = Nacja (spójność z panelem) |
| **Epoka** | Kamień / Brąz / Żelazo — **kiedy jednostka „żyje” w drzewku** |
| **Dostępna w epokach** | Zwykle `Brąz;Żelazo` lub tylko `Żelazo` dla późnych |
| **Tech** | `Brązownictwo`, `Łucznictwo`, `Jeździectwo`, `—` (super) |
| **W zamian za** | Jednostka bazowa z drzewka (np. `Włócznik`) — **pusta (`—`)** = najemnik / super / osobna ścieżka |
| **Super-jednostka** | `TAK` tylko dla elity 1/szt., koszt 0, stolica — **roster-6 na razie głównie Specjalna, nie Super** |
| **Klasa** | `Specjalna` (upgrade cyw) · `Standardowa` · `Super` |
| **Typ** | `Swordsman` · `Spearman` · `Distance` · `Mount` · … — wpływa na countery |
| **Rola (linia)** | `Wręcz` · `Dystans` · `Flanka` · … — UI i AI bitwy |

### B. Koszty (mapa + miasto)

| Pole | Typowa skala |
|------|----------------|
| **Pieniądz (koszt)** | 14–22 (spec.) · 0 (super) |
| **Surowiec** | `braz` / `drewno` / `Koń` / `—` |
| **Surowiec (ilość)** | 3–5 brąz · 1 koń |
| **Utrzymanie / turę** | 1–3 |
| **Ruch** (mapa) | Piechota 2–3 · Konnica 4–5 |
| **Ruch w bitwie (heksy)** | Piechota 3–4 · Konnica/rydwan 5–6 |

### C. Walka — liczby widoczne w grze (PL v2)

To **główne pola**, które widzisz w karcie jednostki i tooltipie bitwy:

| Pole | Sens gameplay |
|------|----------------|
| **Atak** | Trafienie w zwarciu (szansa uderzyć) |
| **Uderzenie** | Siła szarży / dodatkowe obrażenia w 1. rundzie |
| **Obrona** | Trudniej trafić w zwarciu |
| **Health** | Punkty życia |
| **Pancerz** | Redukcja obrażeń |
| **Przebicie** | Ignoruje część pancerza |
| **Atak dystansowy** | Siła strzału (0 = czysta piechota) |
| **Zasięg ataku (hex)** | Zasięg w heksach (`—` = brak) |
| **Ilość pocisków** | Amunicja (łuk, oszczepy, pilum) |
| **Morale bazowe / ucieczki** | Kiedy ucieka z pola |
| **Próg dezercji (% health)** | % HP → rout |

### D. Moc armii (M) — jedna liczba do porównań

Decyzja **2A** (Maciej 2026-06-30). Wzór w grze (`unit-power.ts`):

```
M = (Atak + Uderzenie + Przebicie + Uderzenie/2 + Atak_dystansowy/2)
  + (Obrona + Pancerz + Health/2)
```

*(Uproszczenie do review — silnik mapuje też pola TW v3, gdy będą w Excelu.)*

**Kotwice — nie przekraczać bez ABC:**

| Jednostka kotwica | M (~) | Rola |
|-------------------|-------|------|
| Wojownik (kamień) | ~28 | baza |
| Włócznik / Wojownik miecz+tarcza | ~38–42 | standard Brąz |
| Konnica | ~42 | kawaleria bazowa |
| Jeździec chiński | ~35 | spec. konnica wczesna |
| Hastati | ~45 | spec. piechota z pilum |
| Medżaj / Gwardia Królewska | ~52–55 | **super** — sufit elity |
| **Konnica lancowa asyryjska** | **>> Konnica** | cel Macieja: najmocniejsza ofensywa |

---

## 3. Reguły balansu (Grupa C stosuje przy każdej nowej jednostce)

### R1 — Jednostka specjalna cywilizacji

1. **Nazwa** = z `civs.json` → `Jednostka specjalna`.
2. **W zamian za** = z briefu D (tabela w §5).
3. **Moc:** ok. **+8–15% M** vs jednostka bazowa, którą zastępuje — **wyjątek:** profil „obronny” (Harappa) → wyższa Obrona/HP, nie Atak.
4. **Bonus cyw** (np. +20% łuczników Asyrii) = **osobny mnożnik w kodzie** — nie dublować w statach jednostki.

### R2 — Elita dodatkowa (nie spec. w civs)

Np. *Piechota induska*, *Wojownik babiloński* — między bazą a spec.; **+5–10% M** vs baza.

### R3 — Konnica / rydwan

- **Lanca (Asyria):** Atak/Uderzenie/Przebicie **wyraźnie** nad Konnicą; Health 80+.
- **Łucznik konny:** `Atak dystansowy` + pociski; **słabsza** Obrona wręcz vs lanca.
- **Rydwan spec.:** wzór Rydwan egipski / Kapadokijski — mobilność + szarża.

### R4 — Dystans

- **Łucznik asyryjski:** nad Łucznikiem kamienny i Łucznikiem egipskim, pod Kusznikiem (epoka).
- Zasięg 3–4 hex · pociski 12–20.

### R5 — Celtowie (decyzje 2026-07-04)

| Jednostka | Reguła |
|-----------|--------|
| **Soldurii** | Spec. cyw · `W zamian za: Wojownik` · **identyczne staty co Gaesatae** (CELT-Q2=A) |
| **Gaesatae** | Najemnik · `W zamian za: —` · te same staty · rename dawnego Wojownika celtyckiego |
| **Rydwan celtycki** | Bez zmian (już w grze) |

### R6 — Spójność epok

| Start cyw | Typowa pierwsza spec. |
|-----------|------------------------|
| Kamień (Harappa) | Spec. w **Brązie** (po Brązownictwie) |
| Brąz (Hetyci, Babilonia, Asyria) | Brąz lub Żelazo dla konnicy elitarnej |
| Żelazo (Słowianie, Fenicjanie) | **Tylko Żelazo** — Brąz pomijamy |

### R7 — Test przed kanonem

- `node tools/combat-test.cjs` — **6/6**
- Playtest: 1 bitwa spec. vs baza (np. Drużynnik vs Włócznik)
- Meldunek z liczbami M dla kontrowersyjnych (Asyria konnice)

---

## 4. Pełna lista jednostek roster-6 (+ Celtowie) — draft statów

**Legenda:** ★ = jednostka spec. w `civs.json` · M ≈ szacunek z wzoru §2D

### Celtowie (3 + rydwan)

| Jednostka | ★ | W zamian za | Epoka | Atk/Uderz/Obr | HP | M≈ | Profil D |
|-----------|---|-------------|-------|---------------|-----|-----|----------|
| **Soldurii** | ★ | Wojownik | Żelazo | 8/6/5 | 55 | ~44 | Gwardia wodza, miecz+tarcza+torc |
| **Gaesatae** | | — | Żelazo | 8/6/5 | 55 | ~44 | Najemnik, szarża |
| Rydwan celtycki | | Rydwan konny | Żelazo | (istniejący) | | | |

### Harappa

| Jednostka | ★ | W zamian za | Epoka | Atk/Uderz/Obr | HP | M≈ | Profil D |
|-----------|---|-------------|-------|---------------|-----|-----|----------|
| **Strażnik bram Harappy** | ★ | Włócznik | Brąz | 6/5/9 | 70 | ~48 | Obrona > atak, bramy miasta-plan |
| Piechota induska | | Włócznik | Brąz | 7/6/7 | 60 | ~45 | Piechota doliny |
| Garnizon Harappy | | Woj. miecz+tarcza | Żelazo | 8/7/8 | 65 | ~50 | Garnizon żelazny |

### Hetyci

| Jednostka | ★ | W zamian za | Epoka | Atk/Uderz/Obr | HP | M≈ | Profil D |
|-----------|---|-------------|-------|---------------|-----|-----|----------|
| **Rydwan Kapadokijski** | ★ | Rydwan konny | Brąz | 8/9/3 | 90 | ~55 | Charyotycy, flanka |
| Piechota hetycka | | Włócznik | Brąz | 7/6/8 | 65 | ~46 | Fortyfikacje |
| Gwardia hetycka | | Woj. miecz+tarcza | Żelazo | 9/8/8 | 70 | ~52 | Elita pałacu |

### Słowianie

| Jednostka | ★ | W zamian za | Epoka | Atk/Uderz/Obr | HP | M≈ | Profil D |
|-----------|---|-------------|-------|---------------|-----|-----|----------|
| **Drużynnik** | ★ | Włócznik | Żelazo | 8/7/6 | 55 | ~44 | Drużyna księcia, las |
| **Jeździec z szczepnikami** | | Konnica | Żelazo | 7/6/4 + dyst 5 | 70 | ~48 | Rzut + włócznia |

### Babilonia

| Jednostka | ★ | W zamian za | Epoka | Atk/Uderz/Obr | HP | M≈ | Profil D |
|-----------|---|-------------|-------|---------------|-----|-----|----------|
| **Gwardia Ishtar** | ★ | Woj. khopesh | Brąz | 9/8/8 | 75 | ~52 | Garda świątynna |
| Wojownik babiloński | | Woj. khopesh | Brąz | 7/6/7 | 55 | ~43 | Standard khopesh |
| Piechota neobabilońska | | Woj. miecz+tarcza | Żelazo | 8/7/8 | 65 | ~50 | Neobabilońska |

### Asyria

| Jednostka | ★ | W zamian za | Epoka | Atk/Uderz/Obr | HP | M≈ | Profil D |
|-----------|---|-------------|-------|---------------|-----|-----|----------|
| **Łucznik asyryjski** | ★ | Łucznik | Brąz | 5/3/7 + dyst 12 | 25 | ~38 | Imperium, łuk |
| **Konnica lancowa asyryjska** | | Konnica | Żelazo | 10/12/5 | 85 | ~58 | Najmocniejsza szarża |
| **Konnica łucznicza asyryjska** | | Konnica | Żelazo | 7/5/3 + dyst 12 | 75 | ~52 | Łuk konny |

### Fenicjanie

| Jednostka | ★ | W zamian za | Epoka | Atk/Uderz/Obr | HP | M≈ | Profil D |
|-----------|---|-------------|-------|---------------|-----|-----|----------|
| **Tyrski miecznik** | ★ | Woj. miecz+tarcza | Żelazo | 8/7/6 | 55 | ~44 | Kolonia / Tyr |
| Wojownik fenicki | | Woj. miecz+tarcza | Brąz | 6/6/6 | 50 | ~40 | Lekka piechota |
| Gwardia Tyr | | Woj. miecz+tarcza | Żelazo | 8/7/7 | 60 | ~47 | Elita miasta |

---

## 5. Pytania ABC — parametry (odpowiedz kiedy chcesz)

Skopiuj linię i uzupełnij:

```
ROSTER-6 staty:
1. Tabela §4 OK / korekty: …
2. Asyria konnice za mocne / OK / za słabe: …
3. Harappa obrona (Obrona 9) OK / zmień: …
4. Elity dodatkowe (Piechota induska itd.) zostają / tylko ★ spec: …
```

---

## 6. Faza 2 — wygląd (4 strony) — **następny krok z Tobą**

### Styl docelowy (bez zmian)

- **Roblox R6** — humanoid z brył + pancerz/broń (patrz `Civ-UNITS/Referencje-jednostek/README-referencje.md`)
- **4 widoki:** **przód · tył · lewy · prawy** (jak Legionista i galeria)
- Kolor frakcji = `ownerColor` (tarcza/szata), reszta historyczna

### Gdzie składasz referencje

```
Civ-UNITS/Referencje-jednostek/roster-6/
  Soldurii/
    ref-front.png
    ref-back.png
    ref-left.png
    ref-right.png
    notatki.txt          ← 3–5 linii: broń, hełm, tarcza, epoka
  Strażnik-bram-Harappy/
    ...
```

*(Foldery utworzymy po Twoim „idź wygląd”.)*

### Kolejność pracy wizualnej (propozycja)

| Pri | Jednostka | Dlaczego |
|-----|-----------|----------|
| 1 | **Soldurii** + **Gaesatae** | Celtowie — model częściowo jest |
| 2 | **Konnica lancowa** + **Konnica łucznicza** asyryjska | Referencja bliskowschodnia (Maciej 2026-07-03) |
| 3 | **Strażnik bram Harappy** · **Rydwan Kapadokijski** · **Drużynnik** | Po 1 spec. z każdego tier-1 |
| 4 | Reszta elit + linie (Piechota induska, Gwardia Tyr…) | Po akceptacji ★ |

### Po Twoich PNG

1. UNITS: `buildNamedUnit()` w `render/units.ts` — model na nazwę
2. Galeria: `Civ-UNITS/Galeria-jednostek-4widoki.html` lub `gra/src/gallery4/` — weryfikacja 4 stron
3. Opus review → kanon

---

## 7. Pliki powiązane

| Plik | Rola |
|------|------|
| `dyspozycje/_handoff/CYW-do-GRUPA-C_jednostki-spec-brief-2026-07-04.md` | Brief D (nazwy, bez statów) |
| `dyspozycje/_handoff/MASTER-do-GRUPA-C_jednostki-faza2-roster6-2026-07-03.md` | Batchy, fieldPower cele |
| `docs/decyzje/D-cyw-roster-6-REZERWA.md` | Lore + bonusy 6 nacji |
| `gra/data/units.json` | Draft liczb (67 wpisów) |
| `gra/data/civs.json` | 15 cywilizacji |

---

**Status:** Faza 1 (parametry) — **czeka ABC Macieja** · Faza 2 (4 widoki) — **po akceptacji §5**
