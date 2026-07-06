# Schemat: wersja robocza vs finalna (2026-06-27)

> ⛔ **ARCHIWUM — aktywny kanon:** [`docs/obieg/DWIE-WERSJE-GRY.md`](../obieg/DWIE-WERSJE-GRY.md) · zadania Master: [`MASTER-ZADANIA.md`](../obieg/MASTER-ZADANIA.md)  
> **Obowiązuje:** `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md` · `docs/obieg/_ZASADY.md`

> **Jeden dokument dla wszystkich zakładek.** Czytaj po `master` / na start czatu.  
> **Pełny słownik grup:** `docs/obieg/NAZEWNICTWO-GRUP.md`  
> Szczegóły techniczne bramki: `SILNIK-MASTER-FLOW.md`

---

## Reguła przepływu (Maciej, 2026-06-27) — **OBOWIĄZKOWA**

**Pełny tekst:** `docs/czaty/REGULA-PRZEPLYWU-2026-06-27.md`

```
Grupy A–E  →  → INTEGRATOR: GOTOWE
Grupa F (Integrator)  →  wpina main.ts + TESTUJE  →  → MASTER: GOTOWE-ROBOCZA
Master    →  weryfikuje (NIE koduje, NIE wpina)
              OK  → Maciej: Gra-podglad.html + co sprawdzić
              NIE OK  → grupa źródłowa (NIE „dopnij w F”)
Poprawka  →  od początku u właściciela grupy → znów F → Master → Maciej
```

---

## Podsumowanie operacyjne (Maciej, 2026-06-27)

1. **Czaty grup (A–E)** — ABC + praca w swoim obszarze. Koniec: **`→ INTEGRATOR: GOTOWE`** + handoff (nie `main.ts`).
2. **Grupa F (Integrator)** — wpina `main.ts`, **testuje po wpięciu** (bramka), publikuje wewnętrznie ROBOCZA → **`→ MASTER: GOTOWE-ROBOCZA`**.
3. **Master** — **nie poprawia, nie wpina, nie kombinuje.** Weryfikuje raport F. OK → Opus → **`Gra-podglad.html`** + checklista dla Ciebie. NIE OK → **grupa źródłowa** (Master nie zna pełnego kontekstu grupy).

**Ty (Maciej):** czat ABC + playtest **gdy Master da znać**. Jeden plik: **`Gra-podglad.html`**. Odpowiedź: `playtest OK` / `playtest BUG: …` / `playtest POMIŃ`. BUG → Master kieruje do grupy, nie naprawia sam.

**Po promocji** Master pisze w czacie: co nowego + checklista + „dwuklik `Gra-podglad.html`".

---

## Dwie kopie gry (bundle HTML)

| | **Robocza** | **Finalna** |
|---|-------------|-------------|
| **Plik** | `Gra-podglad-ROBOCZA.html` | `Gra-podglad.html` |
| **Po co** | Cała gra do testów grupy + Ty + Opus | „Produkcja” — stabilna, po review |
| **Kto publikuje** | **Grupa F (Integrator)** (po PASS bramki) | **Master** (po Opus APPROVE) |
| **Kto dotyka** | Wszyscy **grają / testują** tutaj | Tylko Master (kopia z roboczej) |
| **Cofnięcie** | `main.ts.bak-SILNIK-*` + poprzedni build roboczy | `_backup/Gra-podglad.html.bak-YYYYMMDD` |

**Kod źródłowy** (`gra/src/…`) — grupy edytują **swoje moduły**; **`main.ts` tylko Grupa F (Integrator)**.

*(Stara nazwa `Gra-podglad-TEST.html` = to samo co ROBOCZA — nie używać w nowych wpisach.)*

---

## Przepływ (prosty)

```
┌─────────────────────────────────────────────────────────────┐
│  Zakładki A–E  —  praca w swoim zakresie (mapa, walka, UI…) │
│  Decyzje ABC tylko tutaj (raz = kanon)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │ raport + flaga
                            ▼
              docs/obieg/<grupa>.md
              → INTEGRATOR: GOTOWE  (+ handoff w _handoff/ jeśli jest)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Grupa F (Integrator)  —  JEDYNY editor main.ts             │
│  1. Wpięcie batchu  2. Bramka  3. Gra-podglad-ROBOCZA.html  │
└───────────────────────────┬─────────────────────────────────┘
                            │ → MASTER: GOTOWE-ROBOCZA
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Master  —  NIE edytuje main.ts                             │
│  1. Czyta raporty (czaty)  2. Pakiet Opus  3. Po APPROVE:   │
│     ROBOCZA → Gra-podglad.html + backup + STATUS + DZIENNIK │
└─────────────────────────────────────────────────────────────┘
```

**Wpinanie w silnik** — zawsze przez **Grupę F (Integrator)**, nie przez Mastera ani grupy A–E w `main.ts`.  
Zakładki **zgłaszają gotowość** → F **realizuje, testuje, publikuje roboczą** → Master **promuje do finalnej**.

---

## Kto co robi (1 tabela)

| Rola | Zakładka | Kod | Bundle HTML | Raportuje do |
|------|----------|-----|-------------|--------------|
| **Maciej** | A–E | ABC gameplay | gra na **ROBOCZA** | — |
| **Grupa A–E** | tematyczna | swoje pliki w `gra/src/` | mockupy `UI/` | `docs/obieg/<grupa>.md` |
| **Grupa F (Integrator)** | Integrator | **`main.ts`** + bramka | **`Gra-podglad-ROBOCZA.html`** | `docs/obieg/INTEGRATOR-kolejka.md` + `SILNIK-DO-MASTERA.md` |
| **Master** | ten czat | ❌ | **`Gra-podglad.html`** po Opus | `OPUS-REVIEW-QUEUE.md`, `docs/obieg/` |

---

## Gdzie pisać (żeby wszyscy wiedzieli)

| Kierunek | Plik | Kiedy |
|----------|------|--------|
| **Master → grupy A–F** | `docs/obieg/<grupa>.md` | Dyspozycja, routing, decyzja przekazana (np. ABC1=A) |
| **Grupa → Master (+ F)** | `docs/obieg/<grupa>.md` + `INTEGRATOR-kolejka.md` | Postęp, `→ INTEGRATOR: GOTOWE`, `→ MASTER: …` |
| **F → Master (szczegóły)** | `dyspozycje/SILNIK-DO-MASTERA.md` | Bramka, md5 roboczej, backup, FAIL |
| **Handoff grupa → F** | `dyspozycje/_handoff/*-do-MASTER*.md` | Kontrakt wpięcia (F czyta przy batchu) |
| **Master → Opus** | `docs/decyzje/OPUS-REVIEW-QUEUE.md` | Po `GOTOWE-ROBOCZA` |
| **Stan projektu** | `docs/decyzje/STATUS.md`, `dyspozycje/DZIENNIK-MASTERA.md` | Agenci (Master **nie** odsyła Macieja) |
| **Decyzja Macieja (gameplay)** | `docs/decyzje/<ID>.md` + KARTA | W zakładce tematycznej, nie w Masterze |

*(Stare `DO-MASTERA`/`OD-MASTERA` → archiwum; nowy obieg = `docs/obieg/`.)*

---

## Flagi w raportach (słownik)

| Flaga | Znaczenie | Kto reaguje |
|-------|-----------|-------------|
| `→ INTEGRATOR: GOTOWE` | Grupa skończyła; można wpiąć w `main.ts` | **Grupa F (Integrator)** (`master`) |
| `→ MASTER: GOTOWE-ROBOCZA` | F: bramka PASS + `Gra-podglad-ROBOCZA.html` | **Master** (`czaty`) |
| `→ MASTER: BLOK` | Bramka FAIL lub brak Node — opis | Master / Maciej technicznie |
| Opus **APPROVE** | Review OK | Master → kopia na **finalną** |
| Opus **BLOCK** | Poprawki | F lub grupa; **nie** finalna |

---

## Zasady (skrót)

1. **ABC w zakładce = święte** — Master i F nie pytają ponownie.
2. **Robocza może się psuć** — finalna zostaje; cofasz backup / poprzednią roboczą.
3. **Finalna tylko po Opus** — nigdy bez kolejki review.
4. **Grupy nie piszą `main.ts`** — tylko `→ INTEGRATOR: GOTOWE`.
5. **Master nie robi wpięć** — tylko Opus + promocja HTML finalnego.

---

## Komendy

| Gdzie | Komenda | Efekt |
|-------|---------|--------|
| Grupa A–F | `master` | Czytaj `docs/obieg/<grupa>.md` |
| Grupa F (Integrator) | `master` | + pipeline → **ROBOCZA** |
| Master | `czaty` | Czytaj `INTEGRATOR-kolejka.md` → Opus / promocja **finalnej** |

---

## Bramka (Grupa F)

```powershell
cd gra
.\tools\bramka-test-publish.ps1
```

Wynik: `Gra-podglad-ROBOCZA.html` + md5 w raporcie.
