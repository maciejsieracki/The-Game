# DRZEWKO TECHNOLOGII — NAPRAWA (DRZEWKO-TECH-FIX)

Data: 2026-07-10 · Baza: HEAD `8854c92` · Decyzje właściciela: **1a / 2a / 3a / 4a**
Audyt wykrył: **Epoka 3 nieosiągalna** (bramki nie do spełnienia + błędny awans epoki). Naprawione w 3 fazach.
Build: tylko do scratchpada. **Bez commita/deployu** (integrator robi wspólny deploy).

---

## DECYZJE (zatwierdzone)

- **1a** — bramka na ULEPSZENIE terenu (nie tylko budynek); Żegluga wymaga ulepszenia **Tartak**.
- **2a** — jednostki żelazne przypięte pod właściwe techy żelaza wg roli.
- **3a** — nowa treść: **Astronomia→Obserwatorium**, **Prawo (Kodeks)→Trybunał**.
- **4a** — kawaleria żelazna (dawniej pod Jeździectwem) trafia pod **Obróbkę żelaza**.

---

## FAZA 1 — Bramki + jawny awans epoki (odblokowuje Epokę 3)

### Zmiany danych (`gra/data/tech.json`)
| Tech | Zmiana |
|---|---|
| **Żegluga** | `wymagany budynek`: `"Tartak"` → `null`; **dodano** `wymagane ulepszenie: "Tartak"` (Tartak to ulepszenie terenu, nie budynek). |
| **Obróbka żelaza** | `wymagany budynek`: `"Odlewnia brązu"` → **`"Piec hutniczy"`** (spełnialne — budynek `odlewnia_brazu`, odblok. Brązownictwem); **dodano** `awansDoEpoki: 3`. |
| **Brązownictwo** | **dodano** `awansDoEpoki: 2`. |

### Zmiany kodu
- `gra/src/data/loader.ts` — `TechDef`: opcjonalne `'wymagane ulepszenie'?`, `awansDoEpoki?`.
- `gra/src/game/research.ts`:
  - `ResearchTechDef`: opcjonalne `'wymagane ulepszenie'?`, `awansDoEpoki?`.
  - `ResearchBuildingGate`: opcjonalne `empireImprovementKeys?`.
  - **nowe:** `slugifyImprovementLabel()`, `improvementGateMet()`, `researchGatesMet()` (= budynek AND ulepszenie).
  - `availableTechs()` / `canResearch()` — realny gate przez `researchGatesMet`.
- `gra/src/game/playerState.ts`:
  - `EmpireResearchGate`: `empireImprovementKeys?`; `asResearchGate()` przekazuje je dalej.
  - Wszystkie 4 punkty bramki (`availableTechs`, `targetAllowed`, `researchStep`, `setPlayerResearchTarget`) → `researchGatesMet`.
  - **Jawny awans epoki:** porzucono heurystykę regex `/epok/i` na Uwagach (fałszywie łapała **Walutę** i **Sztukę wojenną**). Nowa `eraAdvanceTarget()` czyta pole `awansDoEpoki`; `researchStep()`: `state.era = Math.max(state.era, awansDoEpoki)`. Brak pola = brak awansu.
- `gra/src/main.ts` — `empireImprovementKeysForOwner()` (union kluczy ulepszeń z `placedImprovements`); `researchGateForOwner()` przekazuje `empireImprovementKeys`.
- `gra/src/ui/sciencePicker.ts` — tooltip drzewka pokazuje sekcję **„Warunek badania"** (🏛 budynek / 🌾 ulepszenie). `RawTech`/`TechNode` + `buildNodes()` niosą oba pola.

### Usunięcie Kusznika (Epoka „Średniowiecze" → fallback 1)
- `gra/data/units.json` — usunięto jednostkę **Kusznik** (była Nacja=Chiny, `W zamian za: Łucznik`, Epoka=Średniowiecze). Po usunięciu **brak jednostek Epoka=Średniowiecze**.
- `gra/data/tech.json` — usunięto „Kusznik" z listy Jednostek Brązownictwa.
- Wyczyszczono 10 martwych odwołań `"Zmiana na": "Kusznik"` → `"—"` w units.json (pole **nie jest czytane przez silnik** — potwierdzone; higiena danych).

---

## FAZA 2 — Jednostki żelazne pod właściwe techy (silnik gate'uje po `units.json` pole `Tech`)

Reguła nadrzędna: **przenoszono TYLKO jednostki Epoka=Żelazo** (16 spod Brązownictwa + 4 kawaleria spod Jeździectwa). Jednostki brązu nietknięte (gate Koszary + dostęp do brązu zachowany).

### → Obróbka żelaza (16)
Piechota żelazna (12): **Hastati, Drużynnik, Garnizon Harappy, Gwardia hetycka, Piechota neobabilońska, Tyrski miecznik, Gwardia Tyreńska, Thorakites, iButho z iklwa, Wojownik z żelaznym khopesh, Mur tarcz (Sargonid), Miecznik galijski**
Kawaleria żelazna (4, decyzja 4a): **Rydwan celtycki, Konnica lancowa asyryjska, Konnica łucznicza asyryjska, Jeździec z oszczepami**

### → Hutnictwo żelaza (4) — ciężkie/elitarne
**Gaesatae, Soldurii, Wojownik germański, Berserker germański**

Spójność zapewniona dwustronnie: pole `Tech` w `units.json` **oraz** listy „Jednostki: …" w `tech.json` (Brązownictwo/Jeździectwo — usunięto; Obróbka żelaza/Hutnictwo żelaza — dopisano).

### ⚠️ Rozbieżność opisu zadania vs dane (świadoma decyzja)
Zadanie wymieniało „**Wieża oblężnicza** → Oblężnictwo" i „**Wojownik szekelesz** → Hutnictwo żelaza", ale **obie są Epoka=Brąz** w danych. Zgodnie z regułą „przenoś TYLKO Epoka=Żelazo" **pozostały pod Brązownictwem** (to legalne jednostki brązu). Katapulta (Żelazo) już była poprawnie pod Oblężnictwem — bez zmian.

---

## FAZA 3 — Nowa treść

### `gra/data/tech.json`
- **Astronomia** (nowy, po Waluta): Epoka=Brąz, Poziom 5, prereq **Matematyka + Mistycyzm**, koszt **110**, `Odblokowuje budynek: Obserwatorium`, **bez** `awansDoEpoki`.
- **Prawo (Kodeks)**: `Odblokowuje budynek`: `null` → **`Trybunał`**.

### `gra/data/buildings.json`
- **Obserwatorium** (`obserwatorium`): kat. Nauka, epoka 2, `techUnlock: Astronomia`, baza nauka +4 / przyrost +2 (wzorzec na Bibliotece), koszt 30, utrzym. 1.
- **Trybunał** (`trybunal`): kat. Administracja, epoka 2, `techUnlock: Prawo (Kodeks)`, baza pieniądz+1/zadowolenie+1 (anty-korupcja, +porządek; słabszy i wcześniejszy niż Sąd/Pretorium), koszt 30, utrzym. 1.

---

## WERYFIKACJA (wykonana)

| Bramka / test | Wynik |
|---|---|
| `npx tsc --noEmit` | **0** (OK) |
| `node tools/smoke.cjs` (build świeży → scratchpad, `CIV_SMOKE_HTML`) | **SMOKE OK** — „Jednostki: 74, Technologie: 32" |
| `node tools/tech-tree-test.cjs` | **19 pass / 0 fail** (count 31→**32** zaktualizowany) |
| `node tools/research-test.cjs` | **33 pass / 0 fail** |
| Harness behawioralny (14 asercji) | **14 pass / 0 fail** |

Potwierdzone behawioralnie:
- **(b)** `eraAdvanceTarget` = tylko `{Brązownictwo:2, Obróbka żelaza:3}`; **Waluta i Sztuka wojenna NIE ruszają epoki**; pełny przebieg badań osiąga epokę **3**.
- **(a)** Żegluga: bramka blokuje bez `tartak`, przepuszcza z `tartak`; Obróbka żelaza: blokuje bez `odlewnia_brazu` (Piec hutniczy), przepuszcza z nim; slug `Tartak→tartak`, `Kopalnia miedzi→kopalnia_miedzi`.
- **(c)** 0 jednostek Epoka=Żelazo zostało pod Brązownictwem/Jeździectwem; brąz nietknięty.
- **(d)** Astronomia→Obserwatorium i Prawo→Trybunał obecne i spójne (`techUnlock` ↔ `Odblokowuje budynek`).
- **(e)** Kusznik usunięty; **0** jednostek Epoka=Średniowiecze; 0 martwych referencji w danych/silniku.

---

## DO DECYZJI WŁAŚCICIELA / RE-SYNC

1. **Chiński unikat (`civs.json`)** — Chińczycy nadal mają `Jednostka specjalna: "Kusznik (lepszy łucznik)"` + bonus „Kusznik: +20% łuczników". Po usunięciu jednostki Kusznik Chińczycy budują bazowego **Łucznika** (bonus +20% do łuczników dalej działa — realizowany przez `bonusy[]`, nie przez samą jednostkę). Gra się nie psuje, ale **opis unikatu jest niespójny**. *Nie zmieniałem `civs.json` (decyzja produktowa: czym zastąpić chiński unikat dystansowy?).* **[ZAŁOŻENIE — do potwierdzenia]**
2. **Martwy model renderu** — `gra/src/render/units.ts` (~2757) zawiera model „Kusznik"; teraz nieużywany (żadna jednostka o tej nazwie). Nieszkodliwe (dead code). Bez zmian.
3. **PANELE DO RE-SYNC** — zmodyfikowano `tech.json`, `units.json`, `buildings.json`. W `panele-sterowania/` są `gen-panel-a.py…e.py`, `gen-jednostki-*.py`, w `gra/tools/` `build-tech-excel-mirror.py`. **Nie uruchamiałem** (niepewność mapowania panel↔plik; ryzyko nadpisania). **Wymaga ręcznego re-sync JSON→xlsx właściwym `gen-panel-*.py`** (NIGDY `export-*.py`).
