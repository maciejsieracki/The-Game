# Kolejka ABC otwartych — audyt 2026-07-27

**Aktualizacja:** 2026-07-27  
**Standard zapisu:** `docs/decyzje/ABC-ZAPIS-PLIKOWY.md` — każde pytanie = osobny plik `docs/decyzje/<ID>.md` w pełnej formie ABC + **Odpowiedź Macieja** po ECHO.  
**Źródło analiz:** subagenci sesji 2026-07-27 + audyt rejestru

## Indeks

| ID | Status | Odpowiedź Macieja | Plik szczegółowy |
|----|--------|-------------------|------------------|
| **C-WIAR-N4-AI** | 🔵 W TRAKCIE | **B** (2026-07-27) | `C-WIAR-N4-AI.md` |
| **C-WIAR-D4** | 🟢 WDROŻONA | **A** (2026-07-27) | `C-WIAR-D4.md` |
| **C-WIAR-N1-UX** | 🟢 WDROŻONA | **A** (2026-07-27) | `C-WIAR-N1-UX.md` |
| **P-AI-006** | ⏸ OTWARTE | — | `P-AI-006.md` |
| **P-AI-007** | ⏸ OTWARTE | — | `P-AI-007.md` |
| **P-AI-008** | ⏸ OTWARTE | — | `P-AI-008.md` |
| **R-MAPGEN-KOLEJNOSC-Q1** | ⏸ OTWARTE | — | `R-MAPGEN-KOLEJNOSC-Q1.md` |
| **R-MAPGEN-KOLEJNOSC-Q2** | ⏸ OTWARTE | — | `R-MAPGEN-KOLEJNOSC-Q2.md` |
| **R-MAPGEN-KOLEJNOSC-Q3** | ⏸ OTWARTE | — | `R-MAPGEN-KOLEJNOSC-Q3.md` |
| **C-TEREN-IMPL-1** | ⏸ OTWARTE | — | `C-TEREN-IMPL-1.md` |
| **C-TEREN-IMPL-2** | ⏸ OTWARTE | — | `C-TEREN-IMPL-2.md` |
| **C-TEREN-IMPL-3** | ⏸ OTWARTE | — | `C-TEREN-IMPL-3.md` |
| **R-BITWA-POWTORKA-I** | ⛔ BRAK ABC | decyzja 2026-07-24 | `R-BITWA-POWTORKA-I.md` |

**Bez ABC (tylko wdrożenie techniczne):** K1, K2, R-TEREN-DOPIAC (kod gotowy), R-DYP-IKONA-TLO, Pyt. 18, Pyt. 19.

> §1–§11 poniżej = kopia robocza; **kanon** → osobne pliki `<ID>.md` (migracja w toku).

---

## §1 — [TEMAT: Wiarygodność] C-WIAR-D4

**Sytuacja**  
Dźwignia 4 (pierwszy kontakt) jest w specyfikacji, ale nie ma wdrożenia ani liczb. Startowe Zaufanie zależy od typu cywilizacji i trudności — zero odczytu Wiarygodności.

**Cel pytania**  
Ustalić wzór i skalę modyfikatora startowego Zaufania od globalnej Wiarygodności (gracz i symetrycznie AI).

**Dlaczego teraz**  
Dźwignie 1 i 2 są w silniku; bez Dźwigni 4 reputacja nie dociera do pierwszego wrażenia.

**A — Lekki sygnał: ±5 pkt Zaufania na start** (`startZaufanie + round(W / 20)`)  
Za: subtelne; spójne z dzielnikiem 20. Przeciw: efekt ledwo widoczny przy jednorazowym kontakcie.

**B — Wyraźny sygnał: ±15 pkt** (`round(W / 7)` lub tabela progów)  
Za: gracz od razu czuje reputację. Przeciw: jedna zdrada może zamknąć dyplomację od razu.

**C — Tylko ujemna strona** (W &lt; 0 obniża start; W ≥ 0 bez bonusu)  
Za: karzemy złą reputację, nie nagradzamy drugi raz. Przeciw: brak nagrody przed ekspansją.

**Rekomendacja: A**

---

## §2 — [TEMAT: Wiarygodność] C-WIAR-N1-UX

**Sytuacja**  
Specyfikacja wymaga modala z trzema opcjami przy ataku poza wojną. Kod ma tylko Anuluj/Tak. Kary N1 działają w silniku bez wyboru ze specyfikacji.

**Cel pytania**  
Ustalić docelowy przepływ UI przy inicjacji walki (zasada: kara tylko po uprzedzeniu).

**Dlaczego teraz**  
Rdzeń N1 działa; bez modala trzyopcjiowego wdrożenie jest niepełne.

**A — Pełny modal trzyopcjiowy** (wypowiedz / atak bez ostrzeżenia z podglądem N1+N2+N3 / anuluj)  
Za: zgodność ze specyfikacją; świadomy wybór. Przeciw: więcej kliknięć; przebudowa modala.

**B — Wojna teraz, atak następnej tury; kara N1 po fakcie**  
Za: mniej przycisków. Przeciw: łamie zasadę uprzedzenia.

**C — Dwa przyciski akcji + anuluj** (wypowiedz bez ataku vs wypowiedz i atakuj teraz z karą N1)  
Za: kompromis UX. Przeciw: odbiega od literalnej specyfikacji.

**Rekomendacja: A**

---

## §3 — [TEMAT: Ekspansywność AI] P-AI-006

**Sytuacja**  
`ekspansywnosc` w `civ-ai.json` = 0 wszędzie; kod używa mnożnika przy wyborze heksa founding (`1 + ekspansywnosc × 0,1`).

**Cel pytania**  
Jakie wartości per nacja i czy wystarczy JSON, czy rozszerzyć wpływ na częstotliwość founding.

**Dlaczego teraz**  
Ostatni łatwy parametr Panelu D z gotowym wpięciem w silnik.

**A — Macierz 1:1** (9×0, 6×3 z `civ-matrix.json`), tylko dane  
Za: minimalny diff. Przeciw: 9 głównych nacji bez różnic.

**B — Wartości per nacja dla wszystkich 15** (np. Rzym 5, Chiny 2, domyślnie 3; sync macierzy), tylko dane  
Za: zróżnicowanie we wszystkich meczach; kod gotowy. Przeciw: tabela 15 wartości; słaby sygnał przy koszcie 20 Pracy.

**C — Jak B + rozszerzenie w `ai.ts`** (próg rezerwy Pracy, skrócenie blokady klastra, bonus founding)  
Za: ekspansja odczuwalna. Przeciw: większy zakres; ryzyko zbyt agresywnej AI.

**Rekomendacja: B** (propozycja tabeli w `REJESTR-PROBLEMOW-AI.md` / subagent P-AI-006)

---

## §4 — [TEMAT: Produkcja miasta AI] P-AI-007

**Sytuacja**  
`chooseCityProduction` czyta tylko delty archetypu z `ai-params.json`. Pola `priorytetMilitarny/Ekonomia/Nauka` z Panelu D są martwe. Brak Biblioteki/Akademii w kandydatach produkcji.

**Cel pytania**  
Jak podpiąć trzy priorytety z Panelu D do produkcji AI.

**Dlaczego teraz**  
Strojenie kolumn w Excelu bez tej decyzji nie ma efektu.

**A — Warstwa per-nacja na archetyp + budynki nauki** (`(priorytet−5)×15` pkt)  
Za: aktywuje Panel D; zachowuje archetypy. Przeciw: dwa źródła priorytetów; więcej kodu.

**B — Tylko Panel D; archetyp wyłączony z produkcji**  
Za: jedna prawda w Excelu. Przeciw: regresja delt archetypu.

**C — Wojsko+ekonomia w produkcji; nauka tylko w badaniach**  
Za: najszybsze. Przeciw: `priorytetNauka` wprowadza w błąd.

**Rekomendacja: A**

---

## §5 — [TEMAT: AI — próg zagrożenia] P-AI-008

**Sytuacja**  
Każda wroga jednostka w 5 hex → Mury score 300+ wygrywają z rozwojem. Cel #1 Mocy nie wyłącza trybu zagrożenia.

**Cel pytania**  
Zmienić logikę zagrożenia, żeby AI nie muruje przy odległym patrolu.

**Dlaczego teraz**  
Koliduje z P-AI-004 (cel Mocy).

**A — Tylko próg 7 hex**  
Za: jedna liczba w `ai-params.json`. Przeciw: zwiadowca w 6–7 hex nadal blokuje; nie wspiera celu Mocy.

**B — Wyjątek gdy nie #1 Mocy** (bez Murów-pierwsze)  
Za: wspiera P-AI-004. Przeciw: słabsze AI łatwiejszym celem.

**C — 7 hex + wyjątek gdy nie #1 Mocy**  
Za: mniej fałszywych alarmów + cel rozwojowy. Przeciw: dwa warunki; więcej przypadków brzegowych.

**Rekomendacja: C**

---

## §6 — [TEMAT: Generator mapy] R-MAPGEN-KOLEJNOSC-Q1

**Sytuacja**  
Las i złoża są po rzekach i reliefie w kodzie; REJESTR mówi W TOKU ze starymi liniami. Testy fair-play 8/8, relief-grid 6/6.

**Cel pytania**  
Zamknąć temat kolejności czy czyścić pośredni las w `classifyTerrain`.

**Dlaczego teraz**  
REJESTR wprowadza w błąd.

**A — Zamknąć WDROŻONE; kod bez zmian**  
Za: minimalny diff; testy OK. Przeciw: kod mylący.

**B — Zamknąć + usunąć pośredni las z classify/reapplyLandTerrain**  
Za: jeden kanoniczny moment lasu. Przeciw: większy diff.

**C — Zostawić W TOKU (playtest wizualny)**  
Za: ostrożność. Przeciw: problem już naprawiony w kodzie.

**Rekomendacja: A**

---

## §7 — [TEMAT: Generator mapy] R-MAPGEN-KOLEJNOSC-Q2

**Sytuacja**  
REJESTR: górzystość 19–20% (80A). Kod: ~10% lądu (C-MAPA-Q2=B). Fair-play zielone przy 10%.

**Cel pytania**  
Jedna docelowa górzystość lądu na tier Średni relief.

**Dlaczego teraz**  
19% koliduje z limitem Gór/Wzgórz w komórce 25×25.

**A — ~10% (C-MAPA-Q2=B); REJESTR aktualizowany**  
Za: testy zielone; spójne z kodem. Przeciw: mniej gór niż 80A.

**B — ~19% (80A); łagodzenie fair-play**  
Za: bardziej górzysty świat. Przeciw: historia failów fair-play.

**C — Kompromis ~15%**  
Za: pośrednio. Przeciw: trzecia kalibracja.

**Rekomendacja: A**

---

## §8 — [TEMAT: Generator mapy] R-MAPGEN-KOLEJNOSC-Q3

**Sytuacja**  
`ensureReliefGridCoverage` 2× na mapie, 3× na Ziemi. Czas generacji 5,98 s vs próg 5 s.

**Cel pytania**  
Zostawić wieloetapowy floor reliefu czy uprościć pipeline.

**Dlaczego teraz**  
Wpływa na zamknięcie R-MAPGEN i czas generacji.

**A — Wszystkie przebiegi bez zmian**  
Za: testy zielone. Przeciw: wolniejsza generacja.

**B — Jeden floor po finalnej geografii**  
Za: prostszy pipeline. Przeciw: ryzyko relief-grid.

**C — Dwa przebiegi (przed rzekami + finalny)**  
Za: kompromis. Przeciw: wymaga audytu redundancji.

**Rekomendacja: A**

---

## §9 — [EKRAN: Bitwa ręczna 3D] C-TEREN-IMPL-1

**Sytuacja**  
C-TEREN-Q1=A: etapy 1–3 wdrożone w jednym batchu w `gra/src/`; test 26/26; nie w `gra-robocza/`.

**Cel pytania**  
Jeden deploy czy trzy osobne publikacje z weryfikacją między etapami.

**Dlaczego teraz**  
Integrator potrzebuje decyzji przed buildem.

**A — Jeden deploy (3 etapy naraz)**  
Za: kod spięty; mniej iteracji. Przeciw: trudniej wyizolować regresję.

**B — Trzy deploye etapami**  
Za: zgodne z planem R-TEREN-DOPIAC. Przeciw: sztuczne rozbijanie zmergowanego kodu.

**C — Jeden deploy + checklista 3 scenariuszy w jednej sesji**  
Za: kompromis; kod jeden batch. Przeciw: jeden wpis WERSJE.

**Rekomendacja: C**

---

## §10 — [EKRAN: Bitwa ręczna 3D] C-TEREN-IMPL-2

**Sytuacja**  
Obrona Gór ×1,75 w kodzie; JSON mówi +50%. JSON obiecuje koszt piechoty 3–4; plansza: koszt 2.

**Cel pytania**  
Kanon liczbowy Gór i koszt ruchu piechoty.

**Dlaczego teraz**  
JSON, Poradnik i kod mogą się rozjeżdżać.

**A — Obrona ×1,75; piechota koszt 2; sync JSON**  
Za: spójne z kodem i Poradnikiem. Przeciw: JSON koszt 3–4 niespełniony.

**B — Obrona ×1,75; piechota koszt 3 na Górach (`isMountain`)**  
Za: bliżej JSON. Przeciw: zmiana `_moveCostForUnit`.

**C — Obrona z JSON (+75%); piechota koszt 2**  
Za: jedno źródło danych. Przeciw: refaktor mnożnika obrony.

**Rekomendacja: A**

---

## §11 — [EKRAN: Bitwa ręczna 3D] C-TEREN-IMPL-3

**Sytuacja**  
Efekty terenu (obrona, Δ zasięg, blokada gór) działają po cichu; tooltip TEREN tylko dla brodu.

**Cel pytania**  
Czy i jak pokazać modyfikatory terenu w UI bitwy.

**Dlaczego teraz**  
R-TEREN-BITWA-WERYF: problem UX „działa po cichu".

**A — Po cichu (tylko silnik)**  
Za: zero UI. Przeciw: niespójne z brodem.

**B — Wiersz TEREN w tooltipie dla wszystkich efektów**  
Za: spójny wzorzec z brodem. Przeciw: więcej pracy UI.

**C — Tylko blokady/koszty ruchu w UI; obrona i zasięg po cichu**  
Za: szybsze. Przeciw: ukryty bonus +75% / −1 zasięg.

**Rekomendacja: B**

---

## Historia zapisu

| Data | Co |
|------|-----|
| 2026-07-27 | Utworzono plik; C-WIAR-N4-AI=B w `C-WIAR-N4-AI.md` |
| 2026-07-27 | Pozostałe 11 pytań — pełna forma ABC z audytu subagentów |
