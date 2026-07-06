# C3-Q1 → MAPA — jak gracz zaczyna oblężenie

**Data:** 2026-06-27  
**Od:** Grupa C (Walka) — **przekaz do MAPA** (decyzja Macieja)  
**Do:** Grupa A / lane MAPA + SILNIK (routing)  
**Status:** **ZAMKNIĘTE** — Maciej **2026-06-27** · `docs/decyzje/C3-obleczenie.md` (**C3-Q1=A**)

---

## Kontekst granicy zakresu

Maciej (2026-06-27): **C3-Q1 to temat mapy strategicznej**, nie czatu Walka.  
Grupa C zaczyna od **overlay preBattle (C1)** — plansza „auto vs bitwa ręczna".  
Pełna granica: `docs/grupa-c/GRANICA-C-vs-MAPA.md`

Powiązanie: **C1-Q1=A** — oblężenie **bez szturmu** = tylko mapa, **bez** preBattle do momentu szturmu.

---

## [EKRAN: Mapa świata] C3-Q1 — Jak gracz zaczyna oblężenie miasta z murem?

**O co chodzi (bez żargonu)**

Grasz na **dużej mapie strategicznej** — hexy, miasta, armie. To **nie** jest pole bitwy 3D. Twoja armia dochodzi do **wrogiego miasta z murem**. Od tego momentu gra musi wiedzieć: czy od razu wchodzisz w walkę, czy najpierw **oblężasz** — blokujesz miasto, głodzisz garnizon, budujesz machiny.

To decyzja **przed** overlay preBattle (C1). Bez niej MAPA nie wie, co pokazać po ruchu armii pod mury.

**Dlaczego pytamy teraz**

Blokuje panel oblężenia, wizual stan „oblegane" na mapie i routing w silniku (gałąź bez preBattle).

**A — Jawna akcja „Oblężaj"**

- **Co zrobimy:** Ruch przy murze → wybór **Oblężaj / Szturm / Anuluj**. Dopiero Oblężaj włącza tryb oblężenia.
- **Co zobaczysz jako gracz:** Jasny wybór — głodzić, szturmować od razu, albo anulować.
- **Plusy:** pełna kontrola; brak przypadkowego oblężenia; zgodne z kontraktem UNITS.
- **Minusy / koszt:** jeden krok więcej; UI wyboru akcji.
- **Kiedy gotowe:** ~0,5 sprintu MAPA/UI + SILNIK.

**B — Auto-blokada**

- **Co zrobimy:** Stanie przy murze = od razu `oblegane=true`.
- **Co zobaczysz jako gracz:** Od razu panel oblężenia bez pytania.
- **Plusy:** szybko; mniej klików.
- **Minusy / koszt:** przypadkowe oblężenie; trudny „przejazd obok".
- **Kiedy gotowe:** ~0,3 sprintu.

**C — Prompt pierwszego kontaktu**

- **Co zrobimy:** Dialog przy pierwszym kontakcie; potem pamięć wyboru.
- **Co zobaczysz jako gracz:** Raz pytanie, potem czasem bez — zależy od implementacji.
- **Plusy:** kompromis A/B.
- **Minusy / koszt:** edge case'y pamięci; droższe niż A/B.
- **Kiedy gotowe:** ~0,5–1 sprintu.

**Rekomendacja MASTER:** **A**

**Odpowiedź Macieja:** `C3-Q1=A` (lub B/C)

---

## DoD dla MAPA + SILNIK

- [ ] UI wyboru akcji przy ataku miasta z murem (wg ABC)
- [ ] Gałąź Oblężaj **nie** woła `showPreBattle`
- [ ] Gałąź Szturm / atak jednostki → dopiero C1 preBattle (Grupa C)
- [ ] Render stanu oblężenia na heksie (osobne zadania C3)

— Grupa C → MAPA
