# SCHEMAT PRACY — Cowork zamiast Cursora (v2, korekta Macieja 2026-07-06 ~00:15)

> UZUPEŁNIENIE 2026-07-06: aktualne karty ról = ROLE-I-ZAKRESY-2026-07-06.md + OBIEG-KOMUNIKACJI-2026-07-06.md; jest TRZECI czat UX; zamiast gra-robocza/CLAUDE.md czytaj START-TU.md.

Decyzja Macieja: koniec pracy w Cursorze, projekt kończymy TUTAJ (Cowork).
Ten plik = jedyny opis procesu. Nowy czat zaczyna od: gra-robocza/CLAUDE.md + ten plik.

## 1. KTO JEST KIM (dwa czaty Cowork + Maciej)

| Rola | Kto | Co robi |
|---|---|---|
| Właściciel | **Maciej** | decyzje designu + JEDYNY tester (robocza, potem kanon) |
| **MASTER** | czat Cowork nr 1 (Fable) | ZAWSZE WOLNY do rozmowy: dyskusja, plan, pisanie zadań do kanału, weryfikacja wykonania, promocje do kanonu (na hasło) |
| **INTEGRATOR** | czat Cowork nr 2 (Opus) | CAŁE wykonawstwo: zmiany w src (swoimi subagentami wg tematów: MAPA / EKONOMIA / WALKA / CYWILIZACJE / META-AI — dawne Grupy A/B/C/D/E), wpięcia w main.ts, build, stempel, wgranie do gra-robocza, hub — JEDYNY publikujący |
| **UX** | czat Cowork nr 3 (Opus) | implementuje zmiany interfejsu od designera WYŁĄCZNIE w src\ui\** (dawna Grupa 0); nie buduje, nie wgrywa; wpięcia poza ui/ zamawia u INTEGRATORA wpisem w kanale; karta: `_handoff\ROLA-UX.md` |
| **Cursor** | (opcjonalnie, gdy Maciej ma limit) | wyłącznie promocje kanon→finalna wg pakietów `_handoff\DO-KANONU.md` |

Sens podziału (uwaga Macieja): gdy INTEGRATOR pracuje, rozmowa z MASTEREM nie jest
zablokowana. MASTER nie wykonuje prac — wpisuje zadania i weryfikuje.

## 2. KANAŁ ZADAŃ (zero kopiowania przez Macieja)

Plik: `dyspozycje\_handoff\KANAL-PRACA.md` (append-only, wpisy `[HH:MM] OD → DO`,
stopka `CZEKAM-NA:`). MASTER wpisuje tam zadania; Maciej w czacie INTEGRATORA mówi
tylko **„sprawdź kanał"** — i odwrotnie: po meldunku INTEGRATORA mówi MASTEROWI
„sprawdź kanał". Stary KANAL-KRYZYS-2026-07-05.md = zamknięty (kryzys rozwiązany).

## 3. PLIKI I ŁAŃCUCH WERSJI (decyzja Macieja 2026-07-06 ~01:10 — trzy kopie bezpieczeństwa)

| Poziom | Gdzie | Kto odpowiada |
|---|---|---|
| **Robocza** | `gra-robocza\` (Gra-podglad.html + PLAYTEST-* + hub START.html) | INTEGRATOR pracuje, Maciej testuje |
| **Kanon** | `gra-kanon\` | MASTER (przejął tę rolę po masterze z Cursora): promocja robocza→kanon WYŁĄCZNIE na prośbę Macieja — wtedy MASTER akceptuje pracę integratora i zleca mu w kanale wykonanie promocji; Maciej testuje kanon |
| **Finalna** | root projektu | Cursor: Maciej informuje go, że kanon gotowy — Cursor sprawdza i wgrywa do finalnej |

Sens łańcucha: zawsze można sięgnąć poziom wyżej. Zepsuje się robocza → jest kanon.
Zepsuje się kanon → jest finalna. Promocja NIGDY nie przeskakuje poziomu.
Źródła: `gra-robocza\src`. Zadania i dokumenty: `dyspozycje\`.

## 4. PĘTLA ROBOCZA

1. **Maciej ↔ MASTER**: rozmowa — co zrobić / co zepsute (screenshot pomaga).
2. **MASTER** wpisuje zadanie do KANAL-PRACA.md (konkret: pliki, zakres, kryteria).
3. **Maciej** w czacie INTEGRATORA: „sprawdź kanał".
4. **INTEGRATOR**: zmiany w src → tsc=0 → vite → stempel → wgranie do gra-robocza
   (bundle + playtesty + hub) → kontrola markerów → meldunek w kanale
   („Gotowe — Ctrl+F5, stempel: DATA · HASH").
5. **Maciej**: Ctrl+F5 na START.html → testuje → wynik mówi MASTEROWI. Wracamy do 1.

Tożsamość wersji ZAWSZE potwierdza stempel w lewym dolnym rogu gry — jeśli inny
niż w meldunku: Ctrl+F5, dopiero potem zgłoszenie.

## 4. ZASADY (po dzisiejszych decyzjach Macieja)

1. Testy gry robi WYŁĄCZNIE Maciej. MASTER nie uruchamia testów map — tylko
   kompilację i kontrolę markerów przed wgraniem.
2. Bez backupów i kombinacji: jak czegoś brakuje w kodzie — dopisujemy.
3. Determinizm generatora: nie zmieniać kolejności `rand()` (ten sam seed = ta sama mapa).
4. Wgrywamy wyłącznie do `gra-robocza\`. Kanon tylko na hasło „kanon do akceptacji".
5. Decyzje projektowe Macieja — pytania zawsze krótkie, max 3 naraz, format A/B/C.

## 5. STAN I KOLEJKA (na 2026-07-05 ~24:00)

**W bundlu b04524f1 (zweryfikowane w kodzie):** pasek ładowania + generacja w tle
(overlay/worker), plony i tryby auto w mieście (B0.9), panel „Test wydajności"
z kalibracją progów (RTX 5070 = MOCNY), mgła bez zbędnych przeliczeń (A5),
rzeki: ciągłość biegów + domykanie dopływów do rzek + zakaz pierścieni + delty
tylko dla rzek z ujściem + gęstsze dopływy + ujście nad taflą (I1/I2/B0.10/Z1-Z3),
powerPreference GPU (H1).

**KOLEJKA (propozycja — Maciej zatwierdza lub zmienia):**
1. Playtest Macieja bundla b04524f1: mapa+rzeki, widok miasta, panel Test
   wydajności → „Zastosuj zalecane".
2. Rzeki na małych mapach: pojedyncze „bez ujścia" + sieroce delty (znane, zmierzone).
3. C3 — porcjowana budowa sceny (szybsze/płynniejsze wejście w grę na Super Huge).
4. B1–B4 — generacja Super Huge < 60 s (część optymalizacji już wpięta).
5. Batch 3 — FPS (podgląd F9, LOD/merge rzek) → dalej wg MASTER-PLANU.

Pozycje 2–5 idą pętlą z punktu 3: jedna pozycja = jedna wgrywka = jeden playtest.
