# ⌨️ KOMENDY MACIEJA — co wpisać, co dostaniesz

> **Twoja rola (kanon):** tylko **kierunek gameplay (ABC)** + **test finalnej wersji**. Reszta → Master. Pełna spec: [`MACIEJ-ROLA-MINIMAL.md`](MACIEJ-ROLA-MINIMAL.md)
> **Najważniejsze:** w czatach grup A–E Maciej: **`działaj`** · **`przekaż do Mastera`**. **`start`/`slack`** = Master/agent, nie Maciej.

## Hasła Macieja (A–E)

| Wpisujesz | Co się stanie |
|-----------|---------------|
| **`reguły`** | **Start dnia** — agent odświeża cały obieg (Slack, archiwum, ABC, zakres, playtest) · format 8 punktów · **wpisz w każdym czacie zanim zaczniesz** |
| **`ścieżka`** | **Broadcast ścieżki kodu** — czytaj [`OBOWIAZ-SCIEZKA-KODU.md`](OBOWIAZ-SCIEZKA-KODU.md) · agent **potwierdza** odczyt · teksty do wklejenia: [`KOMUNIKAT-MACIEJ-SCIEZKA.md`](KOMUNIKAT-MACIEJ-SCIEZKA.md) |
| **`reguły mapa`** | Kanon gameplay MAPA (brzeg 10 hex, ląd od środka, rzeki) · **≠ `reguły`** · [`MAPA-KANON-GENERATOR.md`](MAPA-KANON-GENERATOR.md) |
| **`działaj`** | Agent wdraża u siebie (koniec balansu) |
| **`przekaż do Mastera`** | Agent: pliki + handoff + Slack — **Ty nic nie wklejasz** |
| **`A` / `B` / `C`** | Decyzja ABC |
| **`format`** | Agent przepisuje pytanie (5 kroków) |
| **`pytania`** | Skrót otwartych ABC |
| **`raport2`** | Audyt 3 sekcje: ABC wdrożone · w toku · przekazane Masterowi (Ty nic nie wklejasz) |

**W czatach grup A–E NIE używaj `master` do orkiestracji** — tylko hub Master. W grupie: **`przekaż do Mastera`** · **`raport2`**. Szczegóły: [`LANE-NIE-MASTER.md`](LANE-NIE-MASTER.md).

| **`playtest OK`** / **`BUG: …`** | Wynik testu — **tylko gdy Master otworzył §0 rejestru** |
| **`playtest lista`** | Skrót [`REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md) §1 — co będzie do testu |
| **`rejestr`** | Trigger: dopis §2 rejestru · nie proś o playtest ([`OBOWIAZ-PLAYTEST-REJESTR.md`](OBOWIAZ-PLAYTEST-REJESTR.md)) |
| **`obowiaż`** | **Trigger dla grup A–E:** wymusza regułę „playtest tylko Master → Maciej" ([`OBOWIAZ-PLAYTEST-GATE.md`](OBOWIAZ-PLAYTEST-GATE.md)) |
| **`zakres`** | **Trigger dla grup A–E:** raportuj **tylko swój lane** — ABC, wdrożenie, przekaz Master ([`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)) |

## Hasła agentów (nie Maciej)

| Wpisuje | Kto | Co |
|---------|-----|-----|
| **`start`** | Master | Dyspozycja · agent czyta 🎯 TERAZ |
| **`slack`** | Master | MCP czyta kanały |

---

## Maciej — hub Master (orkiestracja)

| Wpiszesz | Dostaniesz |
|---|---|
| **`reguły`** | **Start dnia** — pełny checklist obiegu (Slack MCP, archiwum sync, ABC, handoff) · [`AUDYT-OBIEG-PAMIEC-SLACK-2026-07-04.md`](AUDYT-OBIEG-PAMIEC-SLACK-2026-07-04.md) |
| **`ścieżka`** | Broadcast: kod tylko `gra/src/` · [`OBOWIAZ-SCIEZKA-KODU.md`](OBOWIAZ-SCIEZKA-KODU.md) · [`KOMUNIKAT-MACIEJ-SCIEZKA.md`](KOMUNIKAT-MACIEJ-SCIEZKA.md) |
| **`reguły mapa`** | Kanon gameplay MAPA · [`MAPA-KANON-GENERATOR.md`](MAPA-KANON-GENERATOR.md) · **≠ `reguły`** |
| **`raport`** | **Status 10 kategorii** + „Brak dowodu / nie zgaduję" — kanon [`R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1`](../decyzje/R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md) (§4 procedura). Playtesty: tylko wpis z najnowszej ROBOCZEJ |
| **`master`** | Skan + wykonanie; pełny status stanu → ten sam układ co **`raport`** (10 kategorii) |
| **`start`** | Krótki skan (backup/audyt); pełny status → **`raport`** |
| **`pytania`** | **Otwarte ABC** — ID + jedno zdanie · tylko realnie czekające (weryfikacja plików decyzji) |
| **`playtest OK`** / **`BUG: …`** | Wynik testu (**tylko po otwarciu §0 rejestru**) |
| **`playtest lista`** | Pełna lista oczekujących testów — [`REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md) §1 |
| **`obowiaż`** | W czacie **grupy A–E:** wymusza regułę playtestu ([`OBOWIAZ-PLAYTEST-GATE.md`](OBOWIAZ-PLAYTEST-GATE.md)) — wpisz w każdej grupie raz |
| **`zakres`** | W czacie **grupy A–E:** wymusza raport **tylko własnego lane** ([`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)) — wpisz w każdej grupie raz |
| **`co dalej`** | 1 priorytet + dlaczego |
| **`plot code`** | Master skanuje **dyspozycje + handoffy** → **przygotowuje kod** (lub blokuje z powodem). Na końcu **musi** napisać **`✅ Gotowe:`** / **`⏸️ Czeka:`** + wpis w [`MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md) |

> **Po każdej przygotowanej paczce:** czat **`✅ Gotowe: …`** + plik [`MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md) (nie tylko dziennik). Szczegóły: [`OBOWIAZ-POWIADOM-MACIEJA.md`](OBOWIAZ-POWIADOM-MACIEJA.md)

## Maciej — czaty grup A–E

| Wpiszesz | Dostaniesz |
|---|---|
| **`status`** | Skrót z pliku obiegu grupy |
| **`czego nie wdrożono?`** | Skrót `status` — tylko otwarte (jeszcze nie w grze) |
| **`pytania`** | Tylko otwarte pytania ABC, które czekają Twojej decyzji (ID + o co chodzi) |
| **`co dalej`** | Rekomendacja: 1 najważniejsza rzecz do zrobienia teraz (+ dlaczego) |
| **`sprawdź <temat>`** | Weryfikacja konkretu: czy zrobione, gdzie, status, co blokuje |
| **`zadanie`** (lub `start` / `działaj`) | **Wywołanie grupy do pracy.** Agent czyta swój plik obiegu (🎯 TERAZ + decyzje) i zaczyna. Wpisujesz w czacie danej grupy |
| **`zadanie panel`** | Grupa robi swój **panel sterowania** (`Panel-X.xlsx`). Można też `zadanie <temat>` dla konkretnego zadania z obiegu |
| **`eksportuj panel`** | Po zmianie wartości w `Panel-X.xlsx` — agent sam odpala eksport i aktualizuje grę. **Ty nie dotykasz terminala** |
| **`format`** (lub `ABC`) | Gdy grupa zadała pytanie źle → agent przepisuje: **Sytuacja → Dlaczego → Cel → opcje → Ask** |
| ~~**`master`**~~ | **NIE w czacie grupy** — orkiestracja tylko w **hubie Master**. Tu: **`przekaż do Mastera`** · **`raport2`** ([`LANE-NIE-MASTER.md`](LANE-NIE-MASTER.md)) |
| **`playtest OK` / `BUG` / `POMIŃ`** | Wynik wspólnego testu finalnej |
| **`obowiaż`** / **`zakres`** | Wymuszenie reguł OBOWIĄZ (playtest · zakres raportu) — wpisz raz per grupa |
| **`archiwizuj czat`** | Pełny eksport korespondencji do archiwum |

## Najczęściej (Maciej)
- **Rytuał dnia:** **① `reguły`** w każdym czacie (obieg) · **`reguły mapa`** = tylko kanon MAPA · **②** właściwa praca (`działaj` / `przekaż` / `master`)
- **Rytuał dnia (legacy):** **① `start` / `działaj`** (w czacie **grupy** z pracą) · **② `master`** (**tylko hub Master** — orkiestracja, F; Ty ABC · playtest **tylko gdy Master poprosi**)
- **Czeka na mnie decyzja?** → **`pytania`**
- **Czy grupa wdrożyła ABC i oddała Masterowi?** → **`raport2`** (w czacie każdej grupy A–E — **tylko lane tej grupy**)
- **Grupa znowu raportuje całą grę?** → wpisz **`zakres`** w czacie grupy (raz)
- **Playtest / zaległe testy?** → **tylko Master** mówi · lane'y **milczą** · Ty testujesz przy ~100% gry
- **Lista testów (gdy poprosisz):** **`playtest lista`** — odpowiada Master z rejestru §1
- **Chcę wiedzieć gdzie stoi projekt (hub Master)** → **`raport`** (10 kategorii + „Brak dowodu / nie zgaduję"; kanon `R-RAPORT-10`)

> **ARCHIWUM — SUPERSEDED:** dawny **`raport`** w 4 sekcjach A·B·C·4 (2026-07-02) — zastąpiony układem 10 kategorii od 2026-08-18. Stary opis w historii gita / `.cursor/rules/komendy-raport.mdc` §ARCHIWUM.

*Słowa można zmienić — powiedz, jeśli wolisz inne.*
