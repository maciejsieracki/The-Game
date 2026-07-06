# Maciej — otwarte ABC Grupy C (Walka)

**Data:** 2026-06-27 (granica A vs C)  
**Ten plik = indeks agentów Grupy C** — nie paczka do wklejenia w czacie.  
**Zakres czatu Walka:** **C2 + C4** (od wyboru Auto/Ręczna na preBattle).

**NIE ten czat:** A1–A5, **C1 preBattle**, **C3 oblężenie** → **Grupa A** · `docs/grupa-c/GRANICA-C-vs-MAPA.md`

**Zamknięte — NIE pytaj:** C2-Q2/Q3/Q4/Q6/Q7, D5, D8, D10 · C1-Q1…Q5 (decyzje w Grupa A, plik `C1-wejscie-walke.md`)

---

## Otwarte (Grupa C pyta Macieja)

| ID | Temat | Ekran |
|----|-------|-------|
| **C4-Q1** | Balans macierzy walki w scenie bitwy | `[EKRAN: Mapa bitwy]` |

Pełne ABC C4-Q1: sekcja poniżej (max 1 pytanie/paczka).

---

## C4-Q1 — [EKRAN: Mapa bitwy] Balans walki — macierz counterów

**O co chodzi i dlaczego decydujemy**

Dział UNITS przygotował **analizę balansu** (`Civ-UNITS/Macierz-walki-analiza.md`): skala 0–100, macierz 1v1 (np. Falanga vs Kawaleria), model Total War. Pytanie: czy to staje się **kanonem statystyk** w `units.json` na v1.0, czy czekamy na Excel / Twoją weryfikację. **Blokuje** eksport danych i testy combat po zmianie statów.

**A — Akceptuj analizę v2.0 jako bazę v1.0**

- **Co zrobimy:** Staty jednostek (Brąz/Żelazo) jak w analizie — Falanga tanka, Łucznik vs piechota itd.
- **Co zobaczysz jako gracz:** Walka auto i ręczna od razu „czuje się" jak Total War — tanki trzymają linię, kawaleria bije łuczników.
- **Plusy:** spójny balans od razu; testy combat mają sens; UNITS może exportować.
- **Minusy:** bez Twojego playtestu liczb — ryzyko „za twarde/za miękkie".

**B — Najpierw skrót w czacie (top 5 matchupów), potem decyduję**

- **Co zrobimy:** Na razie **bez** zmiany units.json; dostajesz tabelę „kto kogo bije i w ilu turach".
- **Co zobaczysz jako gracz:** Na razie obecne staty w grze; decyzja po podglądzie liczb.
- **Plusy:** kontrola bez czytania plików; świadoma decyzja.
- **Minusy:** opóźnia export o 1 rundę pytań.

**C — Zostaw obecne units.json do v1.0; balans po v1.0**

- **Co zrobimy:** Dzisiejsze staty w grze; macierz czeka.
- **Co zobaczysz jako gracz:** Bez zmian w balansie do v1.0.
- **Plusy:** zero ryzyka regresji teraz.
- **Minusy:** niespójność z analizą UNITS; walka może być źle zbalansowana w v1.0.

**Rekomendacja:** **B** (bezpiecznie) lub **A** jeśli ufasz turniejowi UNITS.

**Odpowiedź Macieja:** `C4-Q1=A` (lub B/C)

---

*Po odpowiedzi → zapis `docs/decyzje/C4-zasady-walki.md` → dyspozycje UNITS.*
