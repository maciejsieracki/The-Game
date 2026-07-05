# Dyspozycja: inwentaryzacja UX (Grupy A–E)

**Od:** Maciej (decydent) / koordynacja UX  
**Do:** Grupa A, B, C, D, E (osobny wpis w każdym czacie)  
**Cel:** jeden wspólny rejestr **wszystkich** powierzchni UI, których używacie — także tych widocznych **dopiero po kliknięciu** w grze.

---

## Tekst do wklejenia — wybierz grupę

Poniżej **5 gotowych bloków** (A–E) — wklej odpowiedni w czat danej grupy (bez edycji).

---

### Prośba — inwentaryzacja UX (Grupa A)

Potrzebuję **pełnej listy UX-ów**, z których korzystacie w Grupie A — nie tylko mockupów HTML, ale **modułów w grze** i ekranów po kliknięciu.

**Dlaczego:** zbiorczy katalog HTML nie pokazuje większości paneli (np. miasto po kliku, dock hover, huby). Bez Waszej listy brakuje wpisów.

**Co zróbcie (jednorazowo, ~30–60 min):**

1. Otwórz [`docs/ux/_szablon-GRUPA-UX.md`](../ux/_szablon-GRUPA-UX.md).
2. Wypełnij tabelę w [`docs/ux/REJEST-UX-MASTER.md`](../ux/REJEST-UX-MASTER.md) → sekcja **§ Grupa A** (append lub edycja tabeli).
3. Dla każdego UX podaj:
   - **nazwę** (po polsku),
   - **kiedy się pojawia** (np. „klik miasto”, „toolbar 🦉”, „koniec tury”),
   - **plik TS/HTML** (ścieżka),
   - **mockup** jeśli jest (albo `— tylko w Gra-podglad.html`),
   - **status** (gotowe / mockup / placeholder / wpięte w main),
   - **jak Maciej ma to zobaczyć** (krok playtestu 1–2 zdania).

4. **Build podglądu:** jeśli macie dedykowany `Gra-podglad-PLAYTEST-….html` — wpisz w tabelę (pełna lista: [`PODGLAD-GRY-INDEX.md`](PODGLAD-GRY-INDEX.md)).

5. Dopisz na końcu sekcji: `Status: UX-INWENTARZ GOTOWE · data · autor`.

**Składanie plików — gdzie co jest u nas:**

| Typ | Gdzie szukać |
|-----|----------------|
| Moduły DOM | `gra/src/ui/<nazwa>.ts` |
| Bitwa 3D UI | `gra/src/battle/battleScene.ts`, `manualBattle.ts` |
| Wpięcie / kolejność | `gra/src/main.ts` (import `show…`) |
| Mockupy statyczne | `UI/*.html`, `Civ-MAPA/`, `Civ-UNITS/`, root `Gra-podglad-*.html` |
| Spec / decyzje | `docs/grupa-a/`, `docs/decyzje/` |

**Grupa A — przypomnienie zakresu:** HUD mapy, toolbar, minimapa, panel jednostki, side panel wydarzeń, dolny pasek, tryb budowy, preBattle wejście z mapy, oblężenie C3 (panele mapy), pickery overlay (kultura/religia/power), lista miast/armii/dyplo z toolbara.

Nie czekaj na inne grupy — wypełnij **tylko swój** zakres.

---

## Tekst do wklejenia w czat Grupy B

### Prośba — inwentaryzacja UX (Grupa B)

Potrzebuję **pełnej listy UX-ów**, z których korzystacie w Grupie B — nie tylko mockupów HTML, ale **modułów w grze** i ekranów po kliknięciu.

**Dlaczego:** zbiorczy katalog HTML nie pokazuje większości paneli (np. miasto po kliku, dock hover, huby). Bez Waszej listy brakuje wpisów.

**Co zróbcie (jednorazowo, ~30–60 min):**

1. Otwórz [`docs/ux/_szablon-GRUPA-UX.md`](../ux/_szablon-GRUPA-UX.md).
2. Wypełnij tabelę w [`docs/ux/REJEST-UX-MASTER.md`](../ux/REJEST-UX-MASTER.md) → sekcja **§ Grupa B** (append lub edycja tabeli).
3. Dla każdego UX podaj:
   - **nazwę** (po polsku),
   - **kiedy się pojawia** (np. „klik miasto”, „toolbar 🦉”, „koniec tury”),
   - **plik TS/HTML** (ścieżka),
   - **mockup** jeśli jest (albo `— tylko w Gra-podglad.html`),
   - **status** (gotowe / mockup / placeholder / wpięte w main),
   - **jak Maciej ma to zobaczyć** (krok playtestu 1–2 zdania).

4. **Build podglądu:** jeśli macie dedykowany `Gra-podglad-PLAYTEST-….html` — wpisz w tabelę (pełna lista: [`PODGLAD-GRY-INDEX.md`](PODGLAD-GRY-INDEX.md)).

5. Dopisz na końcu sekcji: `Status: UX-INWENTARZ GOTOWE · data · autor`.

**Składanie plików — gdzie co jest u nas:**

| Typ | Gdzie szukać |
|-----|----------------|
| Moduły DOM | `gra/src/ui/<nazwa>.ts` |
| Bitwa 3D UI | `gra/src/battle/battleScene.ts`, `manualBattle.ts` |
| Wpięcie / kolejność | `gra/src/main.ts` (import `show…`) |
| Mockupy statyczne | `UI/*.html`, `Civ-MAPA/`, `Civ-UNITS/`, root `Gra-podglad-*.html` |
| Spec / decyzje | `docs/grupa-b/`, `docs/decyzje/` |

**Grupa B — przypomnienie zakresu:** `cityPanel.ts` + `cityUxFrame` (cały flow po kliku miasta), hover dock, unit mini 3D, order panel, sekcje produkcji/budowy/rekrutu/okolica/garnizon/społeczeństwo, pasek zasobów miasta, **scienceHub + sciencePicker** (wg mapowania B).

Nie czekaj na inne grupy — wypełnij **tylko swój** zakres.

---

## Tekst do wklejenia w czat Grupy C

### Prośba — inwentaryzacja UX (Grupa C)

Potrzebuję **pełnej listy UX-ów**, z których korzystacie w Grupie C — nie tylko mockupów HTML, ale **modułów w grze** i ekranów po kliknięciu.

**Dlaczego:** zbiorczy katalog HTML nie pokazuje większości paneli (np. miasto po kliku, dock hover, huby). Bez Waszej listy brakuje wpisów.

**Co zróbcie (jednorazowo, ~30–60 min):**

1. Otwórz [`docs/ux/_szablon-GRUPA-UX.md`](../ux/_szablon-GRUPA-UX.md).
2. Wypełnij tabelę w [`docs/ux/REJEST-UX-MASTER.md`](../ux/REJEST-UX-MASTER.md) → sekcja **§ Grupa C** (append lub edycja tabeli).
3. Dla każdego UX podaj:
   - **nazwę** (po polsku),
   - **kiedy się pojawia** (np. „klik miasto”, „toolbar 🦉”, „koniec tury”),
   - **plik TS/HTML** (ścieżka),
   - **mockup** jeśli jest (albo `— tylko w Gra-podglad.html`),
   - **status** (gotowe / mockup / placeholder / wpięte w main),
   - **jak Maciej ma to zobaczyć** (krok playtestu 1–2 zdania).

4. **Build podglądu:** jeśli macie dedykowany `Gra-podglad-PLAYTEST-….html` — wpisz w tabelę (pełna lista: [`PODGLAD-GRY-INDEX.md`](PODGLAD-GRY-INDEX.md)).

5. Dopisz na końcu sekcji: `Status: UX-INWENTARZ GOTOWE · data · autor`.

**Składanie plików — gdzie co jest u nas:**

| Typ | Gdzie szukać |
|-----|----------------|
| Moduły DOM | `gra/src/ui/<nazwa>.ts` |
| Bitwa 3D UI | `gra/src/battle/battleScene.ts`, `manualBattle.ts` |
| Wpięcie / kolejność | `gra/src/main.ts` (import `show…`) |
| Mockupy statyczne | `UI/*.html`, `Civ-MAPA/`, `Civ-UNITS/`, root `Gra-podglad-*.html` |
| Spec / decyzje | `docs/grupa-c/`, `docs/decyzje/` |

**Grupa C — przypomnienie zakresu:** `preBattle.ts`, `battleScene.ts` UI (paski, log, speed), oblężenie na polu bitwy, panel armii (mockup), merge/split/stack prompty jeśli traktujecie jako walka.

Nie czekaj na inne grupy — wypełnij **tylko swój** zakres.

---

## Tekst do wklejenia w czat Grupy D

### Prośba — inwentaryzacja UX (Grupa D)

Potrzebuję **pełnej listy UX-ów**, z których korzystacie w Grupie D — nie tylko mockupów HTML, ale **modułów w grze** i ekranów po kliknięciu.

**Dlaczego:** zbiorczy katalog HTML nie pokazuje większości paneli (np. miasto po kliku, dock hover, huby). Bez Waszej listy brakuje wpisów.

**Co zróbcie (jednorazowo, ~30–60 min):**

1. Otwórz [`docs/ux/_szablon-GRUPA-UX.md`](../ux/_szablon-GRUPA-UX.md).
2. Wypełnij tabelę w [`docs/ux/REJEST-UX-MASTER.md`](../ux/REJEST-UX-MASTER.md) → sekcja **§ Grupa D** (append lub edycja tabeli).
3. Dla każdego UX podaj:
   - **nazwę** (po polsku),
   - **kiedy się pojawia** (np. „klik miasto”, „toolbar 🦉”, „koniec tury”),
   - **plik TS/HTML** (ścieżka),
   - **mockup** jeśli jest (albo `— tylko w Gra-podglad.html`),
   - **status** (gotowe / mockup / placeholder / wpięte w main),
   - **jak Maciej ma to zobaczyć** (krok playtestu 1–2 zdania).

4. **Build podglądu:** jeśli macie dedykowany `Gra-podglad-PLAYTEST-….html` — wpisz w tabelę (pełna lista: [`PODGLAD-GRY-INDEX.md`](PODGLAD-GRY-INDEX.md)).

5. Dopisz na końcu sekcji: `Status: UX-INWENTARZ GOTOWE · data · autor`.

**Składanie plików — gdzie co jest u nas:**

| Typ | Gdzie szukać |
|-----|----------------|
| Moduły DOM | `gra/src/ui/<nazwa>.ts` |
| Bitwa 3D UI | `gra/src/battle/battleScene.ts`, `manualBattle.ts` |
| Wpięcie / kolejność | `gra/src/main.ts` (import `show…`) |
| Mockupy statyczne | `UI/*.html`, `Civ-MAPA/`, `Civ-UNITS/`, root `Gra-podglad-*.html` |
| Spec / decyzje | `docs/grupa-d/`, `docs/decyzje/` |

**Grupa D — przypomnienie zakresu:** `diplomacyPanel`, `diplomacyAudience`, `diplomacyPendingHud`, ewent. UI wyboru cywilizacji w kreatorze (jeśli dotyczy D).

Nie czekaj na inne grupy — wypełnij **tylko swój** zakres.

---

## Tekst do wklejenia w czat Grupy E

### Prośba — inwentaryzacja UX (Grupa E)

Potrzebuję **pełnej listy UX-ów**, z których korzystacie w Grupie E — nie tylko mockupów HTML, ale **modułów w grze** i ekranów po kliknięciu.

**Dlaczego:** zbiorczy katalog HTML nie pokazuje większości paneli (np. miasto po kliku, dock hover, huby). Bez Waszej listy brakuje wpisów.

**Co zróbcie (jednorazowo, ~30–60 min):**

1. Otwórz [`docs/ux/_szablon-GRUPA-UX.md`](../ux/_szablon-GRUPA-UX.md).
2. Wypełnij tabelę w [`docs/ux/REJEST-UX-MASTER.md`](../ux/REJEST-UX-MASTER.md) → sekcja **§ Grupa E** (append lub edycja tabeli).
3. Dla każdego UX podaj:
   - **nazwę** (po polsku),
   - **kiedy się pojawia** (np. „klik miasto”, „toolbar 🦉”, „koniec tury”),
   - **plik TS/HTML** (ścieżka),
   - **mockup** jeśli jest (albo `— tylko w Gra-podglad.html`),
   - **status** (gotowe / mockup / placeholder / wpięte w main),
   - **jak Maciej ma to zobaczyć** (krok playtestu 1–2 zdania).

4. **Build podglądu:** jeśli macie dedykowany `Gra-podglad-PLAYTEST-….html` — wpisz w tabelę (pełna lista: [`PODGLAD-GRY-INDEX.md`](PODGLAD-GRY-INDEX.md)).

5. Dopisz na końcu sekcji: `Status: UX-INWENTARZ GOTOWE · data · autor`.

**Składanie plików — gdzie co jest u nas:**

| Typ | Gdzie szukać |
|-----|----------------|
| Moduły DOM | `gra/src/ui/<nazwa>.ts` |
| Bitwa 3D UI | `gra/src/battle/battleScene.ts`, `manualBattle.ts` |
| Wpięcie / kolejność | `gra/src/main.ts` (import `show…`) |
| Mockupy statyczne | `UI/*.html`, `Civ-MAPA/`, `Civ-UNITS/`, root `Gra-podglad-*.html` |
| Spec / decyzje | `docs/grupa-e/`, `docs/decyzje/` |

**Grupa E — przypomnienie zakresu:** `mainMenu.ts`, `newGameFlow.ts`, game over overlay (`main.ts`), globalne ustawienia, shell przed mapą.

Nie czekaj na inne grupy — wypełnij **tylko swój** zakres.

---

## Zakres przypomnienia per grupa (skrót)

| Grupa | UX w Waszym zakresie (minimum do wpisania) |
|-------|---------------------------------------------|
| **A** | `hud.ts` + minimap, toolbar, bottom bar, side panel, unit panel, build mode, city/army/diplo list HUD, empire overlays, preBattle trigger, siege panels, map unit cursor, ghost budowy/miasta |
| **B** | **`cityPanel.ts` + `cityUxFrame`** (cały flow po kliku miasta), hover dock, unit mini 3D, order panel, sekcje produkcji/budowy/rekrutu/okolica/garnizon/społeczeństwo, pasek zasobów miasta, **scienceHub + sciencePicker** (wg mapowania B) |
| **C** | `preBattle.ts`, `battleScene.ts` UI (paski, log, speed), oblężenie na polu bitwy, panel armii (mockup), merge/split/stack prompty jeśli traktujecie jako walka |
| **D** | `diplomacyPanel`, `diplomacyAudience`, `diplomacyPendingHud`, ewent. UI wyboru cywilizacji w kreatorze (jeśli dotyczy D) |
| **E** | `mainMenu.ts`, `newGameFlow.ts`, game over overlay (`main.ts`), globalne ustawienia, shell przed mapą |

**Grupa F (Integrator):** zbiera wpisy, aktualizuje katalog HTML — **nie** wypełnia tabel za Was.

---

## Po zebraniu A–E

1. Integrator / UI: merge → `REJEST-UX-MASTER.md` kompletny.
2. Odświeżyć `UI/Katalog-UX-wszystkie-panele.html` (linki playtest + iframe tylko gdzie ma sens).
3. Maciej: playtest wg kolumny „Jak zobaczyć”.
