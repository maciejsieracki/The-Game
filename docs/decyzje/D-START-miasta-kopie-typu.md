# D-START — Miasta na mapie = kopie typu cywilizacji (model Macieja)

**Status:** **ZAMKNIĘTE** (decyzja produktowa Macieja, 2026-06-27)  
**Właściciel implementacji:** **Grupa D** (CYWILIZACJE: dane + AI + dyplomacja + zwycięstwo)  
**Powiązane:** `D-START-klaster-nazwy.md` · `DESIGN-cywilizacje-spawn.md` · `docs/grupa-d/MODELE-MIAST-TYPU.md`

---

## TL;DR (Maciej)

Na mapie **nie ma osobnych „50 nacji”**. Są **typy cywilizacji** (9 w rosterze). Każdy typ ma **klaster miast** — to **kopie tego samego typu**: ta sama gospodarka, bonusy, jednostki, zależności. Różnią się **nazwą miasta** (`nazwyKlastra[i]`) i **właścicielem AI**.

- **Gracz** — jeden typ (np. Grecy); wokół niego **rywale tego samego typu** (Sparta, Korynt…).
- **Inne typy na mapie** (np. Chińczycy) — **ten sam schemat**: klaster miast chińskich nazw, chińska gospodarka, chińskie bonusy. **Też trzeba je zdobyć** — nie są „inną grą” ani pełnymi ekspansywnymi imperiami.

**Zachowanie AI tych miast:** defensywne · **nie rozwijają się** · **nie zakładają** nowych miast · **nie podbijają** · bronią się · prędzej czy później **padną łupem**.

---

## Model (kanon produktowy)

### Co to jest „miasto rywala”

| Aspekt | Reguła |
|--------|--------|
| **Tożsamość** | **Kopia typu** z `civs.json` — NIE osobna nacja z własnym rosterem |
| **Dane** | `ikonaId`, `bonusy[]`, `mnoznikHandelPieniadz`, religia, jednostka specjalna — **identyczne jak typ** |
| **Nazwa** | Z `nazwyKlastra[]` tego typu (N-1A…N-3A) |
| **Etykieta UI** | Rywal tego samego typu co gracz → **tylko nazwa miasta** (N-2A). Obcy typ w pełnej dyplomacji → nazwa nacji z JSON |
| **Cel gameplay** | **Zdobyć** (wojna / oblężenie) — satelity **nie są** partnerami dyplomatycznymi na równi z graczem |

### Symetria typów na mapie

```
Typ gracza (np. grecy)          Typ obcy (np. chinczycy)
─────────────────────          ─────────────────────────
[0] Ateny  → GRACZ             [0] Qin    → AI (obrona)
[1] Sparta → AI rywal          [1] Qi     → AI (obrona)
[2] Korynt → AI rywal          …
…                              [N] …      → AI (obrona)
```

**Ten sam mechanizm** dla każdego aktywnego typu na mapie. Gracz widzi u siebie greckie kopie; Chińczycy na mapie to chińskie kopie — **do podbicia**, zanim/pełna interakcja z typem (dyplomacja pełna po kontakcie — D-START-3A).

### Gospodarka i zależności

- Tick ekonomiczny, produkcja, upkeep, bonusy cyw — **jak dla danego `ikonaId`** (`civBonusyForCivKey`, `economy.ts`).
- **Brak** osobnych parametrów per „miasto Sparta” poza stanem gry (populacja, budynki, oblężenie).
- Grupa D utrwala w **AI-zachowanie / Parametry-cyw**: profil **„miasto typu — tylko obrona”** (patrz niżej).

### AI — profil obowiązkowy (D-START-AI-1)

| Zachowanie | Wartość |
|------------|---------|
| Zakładanie miast | **NIE** |
| Ekspansja terytorialna | **NIE** |
| Agresywny atak na gracza | **ograniczony** (obrona garnizonu, riposta przy granicy — do doprecyzowania w AI-zachowanie) |
| Budowa / rozwój | **minimalny** lub **wyłączony** w v1.0 (miasto stoi, broni się) |
| Dominujący styl | **DEFENSYWNY** — utrzymanie miasta do czasu podboju |

**Implikacja dla `ai.ts`:** osobna gałąź lub flaga `isTypCityCopy` — **nie** pełny `decideAITurn` ekspansyjny.

### Dyplomacja (spójność z D-START)

| Warstwa | Kto | Tryb |
|---------|-----|------|
| Klaster gracza | ten sam typ | **Uproszczona** (pokój, wojna, handel) — D-START-2B |
| Obcy typ | inny `ikonaId` | **Pełna** po kontakcie — D-START-3A |

Satelity **tego samego typu** to rywale do **eliminacji** (zwycięstwo dominacji typu), nie sojusznicy długoterminowi.

### Zwycięstwo (`victory.ts`)

- Bez zmian kierunku: **dominacja = zero miast rywali własnego typu** gracza.
- Miasta **obcych typów** — podbój = kontrola mapy / surowce; **nie** warunek dominacji (chyba że Maciej później doda cel „wszyscy typy”).

---

## Luka vs kod (2026-06-27)

| Element | Stan | Kto domyka |
|---------|------|------------|
| Nazwy + klaster gracza + N rywali | **Wpięte** (`cluster-start`, `main.ts`) | SILNIK ✅ |
| Obcy typ — **tylko 1 stolica** spawn | **LUKA** — powinno być **klaster miast typu** (jak u gracza) | MAPA spawn + SILNIK |
| Gospodarka per typ na AI | **Częściowo** (`civBonusyForOwnerId`) | CYWILIZACJE — audyt |
| AI defensywne, bez ekspansji | **NIE wdrożone** (`ai.ts` nadal ekspansyjny) | CYWILIZACJE + SILNIK wpiecie |
| `civ-ai.json` profil „kopia typu” | **BRAK** | CYWILIZACJE (arkusz AI-zachowanie) |

---

## Zadania Grupy D (CYWILIZACJE lane)

1. **Dokumentacja danych** — wpis do `civs.json` / `start_gry` meta: `modelMiastTypu: "kopia_obronna"`.
2. **Arkusz AI-zachowanie** — kolumna/profil: `profilMapy` = `kopia_typu_obronna` | `gracz` | `barbarzyncy` (propozycja).
3. **`ai.ts`** — gałąź: owner z klastra typu → tylko garnizon / obrona oblężenia; **zero** `foundCity` / ekspansja.
4. **`diplomacy.ts` / panel** — utrzymać warstwy; satelici typu = relacja rywalizacji (-20 zaufanie start).
5. **Handoff MAPA+SILNIK** — spawn **wszystkich** miast klastra per obcy typ (nie tylko stolica).
6. **Test:** start Standard → Chińczycy mają ≥2 chińskie miasta AI, ten sam `ikonaId`, AI nie zakłada 3. miasta przez 20 tur.

---

## Cytat intencji (Maciej, 2026-06-27)

> Inne miasta na mapie to kopie tej samej cywilizacji co typ — u gracza greckie nazwy, u Chińczyków chińskie. Ta sama gospodarka i zależności typu. Najpierw trzeba je zdobyć. Nie rozwijają się, nie podbijają — defensywne, prędzej czy później padną.

---

## Następne ABC (opcjonalnie — tylko jeśli Master zapyta)

| ID | Pytanie | Propozycja Master |
|----|---------|-------------------|
| D-START-AI-2 | Czy obcy typ spawnuje **pełne 10** miast czy skala jak rywale gracza (2–8)? | **A** pełny klaster pozycji z MAPA, **B** skala jak menu rywali |
| D-START-AI-3 | Minimalna budowa w kopii (mury? jednostka startowa)? | **A** tylko garnizon v1.0 |

*Maciej nie musi odpowiadać teraz — Grupa D implementuje profil defensywny; skala spawnu obcych = rekomendacja **A** (pełne pozycje klastra, puste heksy jeśli MAPA da mniej).*
