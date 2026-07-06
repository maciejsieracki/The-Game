# A1-Q9 — WYKONAJ + brama końca tury — katalog sytuacji

> **Decyzja Macieja:** A1-Q9 = **A** + rozszerzenie (2026-06-26)  
> **Mockup:** `UI/Makieta-HUD-D1B-preview.html` (chip blocking + WYKONAJ + Koniec tury)  
> **Handoff:** `dyspozycje/_handoff/UI-do-MASTER_wykonaj-endTurn-gate-A1Q9.md`  
> **Wygląd mockupu:** **ABC1=A (2026-06-27)** — bez zmian wizualnych; tylko logika pod spodem.

---

## 1. Dwa przyciski — różne role

| Przycisk | Rola | Gdy aktywny |
|----------|------|-------------|
| **WYKONAJ** | „Zrób teraz to, co **musi** być rozstrzygnięte" — skok do **pierwszego** oczekującego | Gdy `blockingCount > 0` (świeci / pomarańczowy) |
| **Zakończ turę** | Kończy turę gracza (ruchy, ekonomia, AI) | Gdy `blockingCount === 0` |

**Brama G1:** dopóki istnieje choć jeden chip **blocking** w panelu wydarzeń [E] — **Zakończ turę** jest wyszarzone (tak samo skrót **N** / Enter). **WYKONAJ** otwiera ekran pierwszego blocking (lub ten sam efekt co klik w czerwony chip).

**Chip informacyjny** (np. „Ukończono Metalurgię"): ma ✕, **nie** blokuje końca tury.

**Skąd decyzja:** czat **Grupa A — Mapa świata**, paczka A1-Q5…Q10, **2026-06-26** (`docs/archiwum-czatow/eksport-pelny/GRUPA-A_KORESPONDENCJA.md` ok. linia 2249).

---

## 2. Wygląd vs logika (Maciej 2026-06-27)

- **Mockup D1B = kanon wizualny** (ABC1=A). Nie wracamy do Q13 (okrąg vs prostokąt) — układ jak w mockupie.
- **Logika WYKONAJ / brama** jest **osobna** od wyglądu — dziś w grze **częściowo** wdrożona (bunt); reszta katalogu poniżej = **backlog implementacji**.

---

## 3. Flow gracza (docelowy)

```
Tura gracza → (ruchy, budowa, itd.)
     ↓
Silnik zbiera wydarzenia → panel [E]
     ↓
Czy jest blocking? ──NIE──→ WYKONAJ szary, Koniec tury OK
     │
    TAK
     ↓
Koniec tury zablokowany · WYKONAJ aktywny
     ↓
Gracz: WYKONAJ lub klik chipa blocking
     ↓
Otwiera się właściwy ekran (nauka / bitwa / miasto / dyplomacja…)
     ↓
Po rozstrzygnięciu chip znika lub traci blocking
     ↓
Gdy blockingCount=0 → można Zakończyć turę
```

**Kolejność wielu blocking:** FIFO (pierwszy na liście = pierwszy WYKONAJ). Opcjonalnie numer `(2)` na chipie — P2.

---

## 4. Katalog sytuacji — co może być **blocking**

### A. Walka i mapa świata

| ID | Sytuacja | Chip (przykład) | WYKONAJ otwiera | v1.0 |
|----|----------|-----------------|-----------------|------|
| **B-WAL-1** | Wróg wszedł w kontakt / atak na twoją armię | ⚔ „Wróg atakuje! Rozstrzygnij przed końcem tury" | **preBattle** → mapa bitwy / ucieczka | **TAK** (mockup D1B) |
| **B-WAL-2** | Obleżenie — wymagana decyzja (szturm / blokada / negocjacja) | 🏰 „Obleżenie: [miasto]" | Panel oblężenia / preBattle | P1 |
| **B-WAL-3** | Jednostka ma nie rozstrzygnięte rozkazy bojowe (np. czeka na potwierdzenie) | ⚔ „Armia czeka na rozkaz" | Panel jednostki [H] / wybór akcji | P2 |
| **B-WAL-4** | Propozycja połączenia armii (opcjonalnie blocking) | 🛡 „Połączyć armie?" | Okno Połącz (A3-Q1) | **NIE** (informacyjny lub auto) |

### B. Nauka (Badania)

| ID | Sytuacja | Chip | WYKONAJ otwiera | v1.0 |
|----|----------|------|-----------------|------|
| **B-NAU-1** | **Brak wybranej technologii** (pula PN rośnie, cel pusty) | 🔬 „Wybierz następną technologię" | **sciencePicker** (drzewko) | **TAK** (przykład Macieja) |
| **B-NAU-2** | Ukończono tech — **gracz musi potwierdzić** wybór następnej (jeśli nie auto) | 🔬 „Odkryto: Metalurgia — wybierz cel" | sciencePicker z podświetleniem | P1 |
| **B-NAU-3** | Odblokowano **epokę** — wymagany wybór ścieżki / potwierdzenie | 🏛 „Nowa epoka — wybierz priorytet" | sciencePicker + ewent. modal epoki | P2 |

**Uwaga techniczna:** dziś silnik czasem **auto-wybiera** najtańszą tech (`playerState.ts`). Dla **B-NAU-1** trzeba rozróżnić: „gracz **nie wybrał** celu" vs „system przypisał domyślny" — blocking tylko przy braku **świadomego** wyboru (decyzja produktowa do potwierdzenia).

### C. Miasto i ekonomia

| ID | Sytuacja | Chip | WYKONAJ otwiera | v1.0 |
|----|----------|------|-----------------|------|
| **B-MIA-1** | **Bunt** — migracja mieszkańców (B2-Q5=C, B2-Q6=C) | 🔥 „Bunt: [miasto]" | **Panel miasta** (sekcja Porządek) | **TAK** (wdrożone w ROBOCZA) |
| **B-MIA-2** | Miasto **bez produkcji** (kolejka pusta, wymagany wybór) | 🏙 „[Miasto]: wybierz produkcję" | Panel miasta → zakładka produkcja | P1 |
| **B-MIA-3** | **Nowe miasto** — nazwa / potwierdzenie lokalizacji | 🏙 „Nowe osiedle — nazwij" | Modal nazwy / panel miasta | P1 |
| **B-MIA-4** | **Bankructwo / deficyt** — wymagana decyzja (co sprzedać / co wstrzymać) | 💰 „Kryzys finansowy" | Panel miasta / overlay ekonomii | P2 (Wealth B5) |
| **B-MIA-5** | **Wzrost miasta** — wybór ulepszenia pól / specjalizacji | 🌾 „[Miasto]: wybierz rozwój" | Panel miasta | P2 |

**B-MIA-1:** chip informuje o buncie; blocking = gracz **musiał zobaczyć** skutek (migracja) w panelu — nie ignoruje kryzysu.

### D. Dyplomacja

| ID | Sytuacja | Chip | WYKONAJ otwiera | v1.0 |
|----|----------|------|-----------------|------|
| **B-DYP-1** | **Propozycja traktatu** (sojusz, pokój, handel) wymaga odpowiedzi | 🤝 „Persja proponuje pokój" | **diplomacyPanel** (fokus nacja) | P1 |
| **B-DYP-2** | **Ultimatum / wypowiedzenie wojny** — musisz potwierdzić reakcję | ⚠ „Wypowiedziano wojny — odpowiedz" | diplomacyPanel | P1 |
| **B-DYP-3** | **Tajny wywiad** — wybór akcji szpiegowskiej (jeśli w v1.0) | 🕵 „Raport wywiadu — decyzja" | diplomacyPanel / modal | P2 |
| **B-DYP-4** | Wojna z tobą — **informacja** (A1-Q5) | 🚩 „Wojna z Persją" | dyplomacja (opcjonalnie) | **NIE blocking** (informacyjny + ✕) |

### E. Kultura, religia, cuda

| ID | Sytuacja | Chip | WYKONAJ | v1.0 |
|----|----------|------|---------|------|
| **B-KUL-1** | Wybór **polityki kulturowej** / doktryny (jeśli mechanika) | 🎭 „Wybierz politykę kultury" | Overlay kultury (A1-Q12) | P2 |
| **B-REL-1** | **Fundacja religii** / wybór beliefów | ⛪ „Załóż religię" | Overlay religii | P2 |
| **B-CUD-1** | **Cuda** — wybór projektu cudu imperium | ✨ „Wybierz cud" | Overlay cudów (toolbar) | P2 |

*(A1-Q7: brak „Idee" na HUD — nie blocking.)*

### F. Inne / meta

| ID | Sytuacja | Chip | WYKONAJ | v1.0 |
|----|----------|------|---------|------|
| **B-MET-1** | **Wydarzenie losowe** (karta decyzji) | 📜 „Plaga — wybierz reakcję" | Modal wydarzenia | P2 |
| **B-MET-2** | **Zwycięstwo / porażka** — ekran końca gry | 🏆 / 💀 | Overlay game over | osobna brama (już jest) |
| **B-MET-3** | **Tutorial** — pierwszy raz: wymuszony krok samouczka | 💡 „Dokończ wprowadzenie" | Krok tutorialu | P2 |

---

## 5. Co jest **informacyjne** (✕, nie blokuje)

| Przykład | Dlaczego nie blocking |
|----------|------------------------|
| „Ukończono: Metalurgia" | Gratulacja — gracz może zamknąć ✕ |
| „Ateny: produkcja ukończona — Wojownik gotowy" | Jednostka już na mapie; opcjonalny skok |
| „Sojusz z Egiptem przedłużony" | Log dyplomacji |
| „+12 Pieniądza w tej turze" | Podsumowanie (A1-Q8) |
| Baner wojny z nami (A1-Q5) | Skok do dyplomacji, ale **nie** musisz kończyć przed turą |

---

## 6. Stan implementacji (2026-06-27)

| Element | Stan |
|---------|------|
| UI `bottomBarHud` (WYKONAJ + gate) | ✅ moduł |
| UI `sidePanelHud` (`blocking`) | ✅ moduł |
| `main.ts` `collectTurnEvents` | 🟡 tylko **bunt** (`revolt-*`, blocking) |
| `executeFirstBlockingEvent` | 🟡 tylko bunt → panel miasta |
| Mockup D1B demo | ✅ preBattle jako blocking |
| Katalog B-NAU-1, B-WAL-1, B-DYP-* | ❌ nie podpięte |

---

## 7. Propozycja priorytetu v1.0 (do ABC Macieja — opcjonalnie)

**Minimum sensowne WYKONAJ na v1.0:**

1. **B-WAL-1** — atak wroga (mockup)
2. **B-NAU-1** — brak wybranej technologii (Twój przykład)
3. **B-MIA-1** — bunt (Grupa B, już częściowo)

**Później:** B-MIA-2 produkcja, B-DYP-1 propozycje dyplomatyczne.

---

## 8. Powiązane decyzje zamknięte

| ID | Treść |
|----|--------|
| A1-Q8=A | Panel chipów po prawej |
| A1-Q9=A | WYKONAJ + brama |
| A1-Q10 | Mockup revB = prostokąt Koniec tury (**ABC1 nadpisuje okrąg** — Maciej 2026-06-27) |
| B2-Q5=C | Chip buntu + ikona 🔥 |
| B2-Q6=C | Efekt buntu: migracja, nie utrata miasta |

---

*Aktualizacja: 2026-06-27 · Grupa A*
