# Maciej — decyzje HUD mapy świata (pytania 1–10)

> **WAŻNE — trzy różne ekrany (nie mylić!):**
>
> | Ekran | Co to | Ten plik (Q1–10)? |
> |-------|--------|-------------------|
> | **Mapa świata** | Strategiczna mapa heksów — ruch armii, miasta, tura, HUD imperium | **TAK — wszystkie pytania 1–10 dotyczą TEGO ekranu** |
> | **Mapa bitwy** | Taktyczna bitwa manualna (osobna scena 3D, `battleScene`) | **NIE** — to **D5** (UX bitwy Q2–Q7) + lane UNITS + mockupy `Gra-podglad-BITWA.html` |
> | **Panel miasta** | Okno miasta (budynki, produkcja, suwaki) | **NIE** — osobne decyzje / elementy w panelu (np. Q3 zadowolenie per miasto) |
>
> **Q4 „Wybrana jednostka” = jednostka kliknięta na MAPIE ŚWIATA** (hex strategiczny), nie karta jednostki w bitwie.
>
> **Stare Q1–Q10** = tylko **mapa świata** (Grupa A). Panel miasta → **Grupa B** (B1–B5).
>
> **Routing pytań (obowiązkowy):** `docs/decyzje/MAPA-PYTAN-OPEN.md`
>
> | Legacy Q | Nowy ID | Grupa | Status |
> |----------|---------|-------|--------|
> | Q1 | B5 | B | ZAMKNIĘTE |
> | Q2 | A1-Q2 | A | ZAMKNIĘTE → B |
> | Q3 | B2 | B | ZAMKNIĘTE per miasto |
> | Q4 | **A2-Q4** | A | **ZAMKNIĘTE → A** (2026-06-27) |
> | Q5–Q10 | **A1-Q5…Q10** | A | **ZAMKNIĘTE** |
> | Q11 | **A1-Q11** | A | **ZAMKNIĘTE → A** (2026-06-27) |

---

## Pytanie 1 — Żywność (zapasy miasto vs państwo vs wojsko)

**Status:** **ROZSTRZIGNIĘTE (hybryda — custom, nie A/B/C)** · **Data:** 2026-06-26

### Decyzja Macieja (prosty język)

- **Miasto** nadal ma własną żywność / magazyn / wzrost (jak dotąd planowano).
- **Dodatkowo:** imperium ma **zapasy państwa na wojsko** — globalna pula, z której **wyżywane są jednostki**.
- **Nowy suwak (podział żywności):** gracz ustawia, ile ze „strumienia żywności” imperium idzie na **rozwój miasta**, a ile na **zapasy państwa (wojsko)**.
- **Więcej jednostek** = większe zużycie zapasów państwa (mniej zostaje w magazynie).
- **Zapasy państwa:** na v1.0 **bez limitu góry** — mogą rosnąć w nieskończoność (cap = decyzja późniejsza).
- **Głód (zapasy państwa < 0):** każda tura jednostki tracą **8% max HP** aż do zniszczenia.
- **UI:** żywność widoczna **w mieście** (magazyn, wzrost) **oraz** na mapie — co najmniej **stan zapasów państwa** + ewentualny alert głodu.

### Implikacje techniczne (MASTER → lane)

| Lane | Zadanie |
|------|---------|
| **EKONOMIA** | Model: suwak podziału żywności; `zapasyPanstwa` per owner; koszt żywności per jednostka/tura; tick głodu −8% HP |
| **UI** | Suwak w panelu miasta (lub imperium); na HUD mapy: zapasy państwa + alert |
| **UNITS** | Aplikacja −8% HP/tura gdy głód; kontrakt z EKONOMIA |
| **MAPA/HUD** | Wyświetlenie globalnego poziomu żywności państwa na pasku mapy |

Handoff: `dyspozycje/_handoff/MACIEJ-do-EKONOMIA_zywnosc-hybrid.md`

**Ustalenia spec (2026-06-26):** suwak **global per owner** (nie per miasto); default **70% rozwój / 30% zapasy państwa** — do nadpisania przez Macieja przed kodem ticku.

---

## Pytanie 2 — Bilans co turę (+X/turę)

**Status:** **ROZSTRZIGNIĘTE → B** · **Data:** 2026-06-26 · **Twoja:** **B**

- ~~**A:** Osobny panel po lewej na mapie~~
- **B:** Wszystko w górnym pasku (przyrost przy zasobach) ← **WYBRANE**
- ~~**C:** Panel miasta + na mapie tylko sumy~~

### Implikacje (MASTER → UI)

- Na **mapie świata** brak osobnego panelu „Bilans / turę" po lewej.
- Przyrost co turę (`+X/turę`) przy każdym zasobie na **górnym pasku HUD** (Złoto, Praca, Wpływ, Nauka, Kultura, Żywność państwa). **Bez Zadowolenia** (Q3 = per miasto).
- `empireBalance.ts` — nie jako panel boczny mapy; dane karmią delty w `hud.ts`.
- **Panel miasta** nadal może mieć własny bilans plonów (per miasto) — to nie jest ekran mapy.

---

## Pytanie 3 — Zadowolenie / bunt

**Status:** **ROZSTRZIGNIĘTE → C + per miasto** · **Data:** 2026-06-26 · **Twoja:** **C** (z doprecyzowaniem)

- ~~**A:** Tylko liczba na górnym pasku~~
- ~~**B:** Osobny panel po prawej (szczęście, porządek, T1/T2)~~
- **C:** Liczba + klik → panel szczegółów ← **WYBRANE**

### Doprecyzowanie Macieja (scope)

**Zadowolenie i ewentualny bunt = per miasto, NIE globalnie dla cywilizacji.**

| Ekran | Co pokazujemy |
|-------|----------------|
| **Mapa świata (HUD)** | **Brak** globalnego zadowolenia/porządku/buntu na górnym pasku ani panelu prawym |
| **Mapa — opcjonalnie** | Alert w panelu wydarzeń tylko gdy **konkretne miasto** w T2/buncie (skrót, klik → panel miasta) |
| **Panel miasta** | Skrót (liczba/tier) + **klik → szczegóły**: szczęście, porządek, progi T1/T2, status buntu (`orderPanel.ts` / `order.ts`) |

### Implikacje (MASTER → UI / EKONOMIA)

- Usunąć **Zadowolenie** z górnego paska mockupu D1B (było imperium-wide).
- `order.ts` już per miasto — UI: sekcja w `cityPanel`, nie `empireBalance` / HUD mapy.
- Handoff: `dyspozycje/_handoff/MACIEJ-do-UI_zadowolenie-per-miasto.md`

---

## Pytanie 4 — Wybrana jednostka **na mapie świata**

**ID tematu:** **A2-Q4** · **Grupa A** · `[EKRAN: Mapa świata]`

**Status:** **ZAMKNIĘTE → A** · **Maciej:** **A** · **2026-06-27**

**Kontekst:** Kliknąłeś wojsko na **strategicznej mapie heksów** (ruch, atak, merge) — **nie** ekran bitwy táctical (`battleScene`). UI bitwy → **D5=B** (UNITS/UI proponuje, Ty zatwierdzasz).

- **A:** Pełna karta na dole ekranu mapy świata  
- **B:** Krótki tekst w HUD mapy + akcje bezpośrednio na heksach  
- **C:** Wąski pasek (nazwa + HP + ruch) na mapie świata  

---

## Pytanie 5 — Banery cywilizacji (wojna/pokój)

**ID tematu:** **A1-Q5** · **Grupa A** · `[EKRAN: Mapa świata]`

**Status:** **ZAMKNIĘTE → A+C (custom Maciej 2026-06-26)**

- **Mapa:** tylko wojny **z graczem** — nazwa nacji + ⚔, czerwone wyróżnienie; klik → Dyplomacja.
- **Dyplomacja:** pełne szczegóły relacji + sekcja wojen **między innymi** cywilizacjami (gdy wywiad/dostęp), także bez udziału gracza.

---

## Pytanie 6 — Lewy toolbar (ikony overlay + mapa)

**ID tematu:** **A1-Q6** · **Grupa A**

**Status:** **ZAMKNIĘTE (Maciej 2026-06-26)**

### Wyłączone

| # | Było | Decyzja |
|---|------|---------|
| 1–3 | Epoka, Badania, Idee | NIE — duplikat [A] / brak mechaniki |
| **4** | Doktryny | **NIE — nie ma w grze** |
| **7** | Odblokowane | **NIE — nie wiadomo po co** |
| 9–10 | Granice, Nazwy | NIE w toolbarze → [F2] |

### v1.0 toolbar [C] — 2 ikony (rev. A1-revA)

| Etykieta | Rola |
|----------|------|
| **🏛️ Cuda** | cudy / wielkie dzieła |
| **🔨 Budowa** | tryb placement (D4) |

**OUT:** 📦 Zasoby — wszystkie liczby na [A] lewa kolumna.

**Zasada:** nie powielamy tego samego na [A], [I], mapie [F2] i toolbarze [C].

---

## Rev. [A] — kolumna zasobów (Maciej 2026-06-26)

**Lewa kolumna [A] (kolejność):** Żywność · Złoto · Praca · Badania · Bogactwo · Ludność.

**Prawa [A]:** Epoka · Nacja · Osiedla · Tura · Dyplomacja.

Szczegóły: `docs/decyzje/A1-revA-zasoby-pasek.md` · **OTWARTE A1-Q11:** Kultura + Wpływ?

---

## Nawigacja — górny vs dolny pasek (Maciej 2026-06-26)

**Zasada:** bez duplikatów — co jest na [A], **nie ma** na [I].

| Funkcja | Gdzie | Jak otworzyć |
|---------|-------|--------------|
| **Badania / drzewko** | **[A] górny** | klik wiersz **Badania** (tech + % + PN/t) — **bez** osobnego „Nauka" |
| **Dyplomacja** | **[A] górny** | przycisk **🤝 Dyplomacja** (przy bloku tury) |
| **Miasta** | **[I] dolny** | przycisk Miasta |
| **WYKONAJ / Koniec / Menu** | **[I] dolny** | bez zmian (Q9) |

**Usunąć z mockupu D1B:** przyciski Nauka i Dyplomacja z `#bottom-bar`; **osobny wiersz „Nauka" w grupie zasobów** — zostaje tylko **Badania** w bloku epoki.

---

## Badania = Nauka (Maciej 2026-06-26)

Na HUD mapy **nie ma** dwóch wpisów. **Nauka i Badania to to samo.**

- **Zostaje:** wiersz **Badania** — nazwa tech, pasek %, **+X PN/t**, klik → drzewko.
- **Usunąć:** osobny licznik **Nauka +X/t** w grupie zasobów (Polityka).

---

## Pytanie 7 — Idee (postęp obok tech)

**ID tematu:** **A1-Q7** · **Grupa A**

**Status:** **ZAMKNIĘTE → B (custom Maciej 2026-06-26)**

- W grze **nie ma mechaniki „Idee"** (trop z mockupu MAPA / Civ VII — odrzucone).
- HUD mapy: **tylko Kultura** na górnym pasku (obok Nauki itd.) — **bez** paska/ikony Idee.
- Szczegóły kultury → panel miasta; Nauka overlay = tylko technologie.

---

## Pytanie 8 — Wydarzenia z tury

**ID tematu:** **A1-Q8** · **Grupa A**

**Status:** **ZAMKNIĘTE → A (2026-06-26)**

- **A:** Panel chipów po prawej (D1B) ✓  
- ~~B: Dziennik pod minimapą~~  
- ~~C: Oba~~  

**Implementacja:** mockup `UI/Makieta-HUD-D1B-preview.html` (`#side-panel`, `.sp-chip`); lane `gra/src/ui/sidePanelHud.ts` + hook w `hud.ts`. **Bez** dziennika pod minimapą.

---

## Pytanie 9 — Przycisk „WYKONAJ”

**ID tematu:** **A1-Q9** · **Grupa A**

**Status:** **ZAMKNIĘTE → A + rozszerzenie Maciej (2026-06-26)**

- **A:** Tak, **obok Końca tury** (dolny pasek D1B) ✓  
- ~~B: Tylko chip~~ · ~~C: Dynamiczny~~  

**Rozszerzenie (Maciej):** dopóki są **chipy wymagające decyzji** (A1-Q8) — **nie można** dać „Koniec tury” (przycisk nieaktywny + ewent. tooltip). Chip informacyjny można zamknąć ✕; chip **blocking** — tylko po rozstrzegnięciu (WYKONAJ / klik → panel / akcja).

**Kontrakt (propozycja lane):** `SidePanelEvent.blocking?: boolean`; `getBlockingEventCount()`; `onExecute()` na WYKONAJ = pierwszy blocking chip; brama na `endTurn` + skrót Enter/N.

---

## Pytanie 10 — Przycisk „Koniec tury”

**ID tematu:** **A1-Q10** · **Grupa A**

**Status:** **ZAMKNIĘTE → A+B (Maciej 2026-06-26)** (= opcja C „Oba")

- **A:** Dolny pasek (D1B) — przycisk **Koniec tury** obok WYKONAJ ✓  
- **B:** Duży **okrąg** prawy-dół (~96 px, prototyp MAPA `#btn-end-turn`) ✓  
- ~~C: sformułowanie „Oba"~~ — Maciej: **A+B**

**Zasada:** oba wywołują **tę samą** akcję `onEndTurn`; **obie** respektują **BRAMĘ G1** (disabled gdy blocking chipy).  
**WYKONAJ** tylko na dolnym pasku (Q9) — okrąg = wyłącznie koniec tury.

**Implementacja:** `#bottom-bar` + `#end-turn` floating (mainview wzorzec).

---

*Odpowiedzi: jedna linia w czacie, np. `A1-Q5=C, A1-Q6=B, A2-Q4=B` (nie `2B, 3C` — stare Q2/Q3 zamknięte)*
