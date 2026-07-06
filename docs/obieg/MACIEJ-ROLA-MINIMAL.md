# Maciej — rola minimalna (kanon)

> **Zasada Macieja (2026-06-26):** przy **minimalnym moim nakładzie** robię tylko **kierunek gameplay** i **test finalnej wersji gry**.
> Reszta = Master + grupy + Slack MCP — **bez listonoszenia**.

---

## Twoje 2 zadania

| # | Zadanie | Kiedy | Jak (minimalnie) |
|---|---------|-------|------------------|
| **1** | **Kierunek gameplay** | Gdy coś wymaga wyboru produktowego | Odpowiedź **A / B / C** → agent **pyta od razu** formularzem „wdrażam?" → klik **Tak** (nic nie dopisujesz) |
| **2** | **Test gry** | **Praca:** zawsze **`gra-robocza/START.html`** (D1A) · **Finalna:** tylko gdy Master poda md5 kanonu | Ctrl+F5 · pieczęć w rogu (D2A) · **`playtest OK`** / **`BUG: …`** |

**Nie testujesz** modułów „u grupy gotowych" ani „wpiętych u F" — dopiero gdy **Master** w hubie ogłosi gotowy kanon i checklistę.

**Jedno drzwi (D1A):** szczegóły → [`MACIEJ-PLAYTEST-JEDNO-DRZWI.md`](MACIEJ-PLAYTEST-JEDNO-DRZWI.md) · **nie** otwieraj root `Gra-podglad.html` w trakcie sprintu.

**Grupy informują Cię tylko o:** brakach **ABC w ich lane** · wdrożeniu **ich** decyzji · **`przekaż do Mastera`**. Pełny obraz projektu = **`raport`** w hubie Master, nie 6 czatów. Reguła: [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md) · trigger u grup: **`zakres`**.

To wszystko, co **musisz** robić regularnie.

---

## Czego NIE robisz (Master przejmuje)

| Nie Twój problem | Kto |
|------------------|-----|
| Slack (czytanie, pisanie, kanały) | Master + MCP |
| Odpalanie grup (`start` w 6 czatach) | Master dyspozycjonuje + Slack trigger |
| Orkiestracja, kolejka F, md5, bramki | Master + Grupa F |
| Review techniczny przed ACK | Master (subagent readonly) |
| Eksport paneli, terminal, build | Grupy + F |
| Czytanie raportów „dla ciekawości” | Opcjonalne — tylko gdy **sam** wpiszesz `raport` |

**Jeden czat z Masterem** wystarczy na playtest i skrót `pytania`. **ABC możesz też ustalać w czacie grupy** (np. Grupa C) — agent grupy **sam zapisuje** decyzję; **Ty nic nie przekazujesz** Masterowi ani Integratorowi.

Szczegóły przepływu „z dołu w górę": [`PRZEPLYW-OD-GORY-I-DOLU.md`](PRZEPLYW-OD-GORY-I-DOLU.md)

---

## Przepływ z Twojej perspektywy

```
[Grupy pracują w tle]
        ↓
Master → #master: „gotowe do playtestu · md5 …"  ← **tylko Master, po kanonie**
        ↓
Ty → grasz · playtest OK / BUG   ← **tylko na tę prośbę**
        ↓
(lub) Master → pytania ABC → Ty: A/B/C → wraca do pracy
```

**Slack:** możesz **w ogóle nie otwierać** — Master czyta MCP. Ty dostajesz sygnał w hubie albo krótki ping, gdy coś od Ciebie zależy.

---

## Komendy — tylko te, które realnie używasz

| Komenda | Po co |
|---------|-------|
| **`pytania`** | Co czeka na ABC (skrót, bez ściany tekstu) |
| **`playtest OK`** / **`BUG: …`** | Wynik testu finalnej |
| **`A` / `B` / `C`** (przy pytaniu) | Decyzja — potem agent pyta **„wdrażam?"** (klik, bez dopisywania tekstu) |
| **`format`** / **`ABC`** | Grupa źle sformułowała pytanie → ma przepisać: Sytuacja → Dlaczego → Cel → opcje → Ask |
| **`raport`** | Tylko gdy **chcesz** wiedzieć gdzie stoi projekt |
| **`co dalej`** | Jedna rekomendacja — gdy nie wiesz, czy coś od Ciebie wisi |
| **`plot code`** | Dyspozycje w repo → agent **przygotuje kod**; czat **`✅ Gotowe:`** / **`⏸️ Czeka:`** + wpis w [`MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md) |
| **`działaj`** | Koniec dyskusji/balansu — agent **koduje od razu** (w czacie grupy) |
| **`przekaż do Mastera`** | Kod lane gotowy — agent **oddaje Masterowi** (Master → Integrator) |

Reszta (`start`, `slack`, `eksportuj panel`, …) — **dla agentów**, nie dla Ciebie.

---

## Po ABC — dwie fazy (ważne)

### Faza 1 — dyskusja / balans (agent **nie koduje**)

1. Wybierasz **A / B / C**.
2. Agent zapisuje (ECHO).
3. Agent pyta: **„Tak — wdrażaj teraz?"** / **„Jeszcze doprecyzujmy"**.
4. Klikasz **Jeszcze doprecyzujmy** (albo dalej ustalacie liczby) → agent **czeka**, zapisuje ustalenia, **bez kodu**.

### Faza 2 — domykasz temat (agent **musi** ruszyć)

Gdy uważasz, że temat jest zamknięty, w **tym samym czacie grupy**:

| Krok | Hasło | Co robi agent |
|------|-------|---------------|
| **A** | **`działaj`** | Wdraża w kodzie / panelu (testy lane) |
| **B** | **`przekaż do Mastera`** | Oddaje moduł **Masterowi** — handoff + meldunek; Master dyspozycjonuje **Integratora (F)** |

**Krok B** możesz powiedzieć od razu, jeśli kod już jest — agent dokończy testy i zapisze meldunek.  
**Nie** idziesz osobno do czatu Mastera — wystarczy hasło w czacie **grupy**. Agent **sam** zapisuje pliki **i** postuje na Slack `#master` + `#grupa-X` (Ty Slacka nie otwierasz).

**Problem „agent stoi":** jeśli po balansie nic się nie dzieje → wpisz **`działaj`**. To **nie** jest błąd procesu — to Twoja brama domknięcia tematu.

---

Każde pytanie ABC od grupy A–E:

1. **Sytuacja** — co jest w grze dziś  
2. **Dlaczego** — czemu teraz  
3. **Cel** — co ma dać Twoja decyzja  
4. **Opcje A / B / C** — pełny opis (Za / Przeciw)  
5. **Krótki formularz Ask** — tylko etykiety do kliknięcia  

Szczegóły: `docs/decyzje/SZABLON-PYTANIA-ABC.md` · źle sformułowane → wpisz **`format`**

---

## Powiązane

- [`KOMENDY-MACIEJA.md`](KOMENDY-MACIEJA.md) — pełna lista (archiwum komend)
- [`ROLE-2026-06-30.md`](ROLE-2026-06-30.md) — role techniczne
- [`MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md) — **co agent przygotował** (log)
- [`MACIEJ-CO-WISI.md`](../MACIEJ-CO-WISI.md) — co aktualnie czeka (krótko)
