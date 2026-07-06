# 🗺️ The Game (Civ) — ROADMAP (jedyna prawda)

> **Jedno miejsce na całość gry.** Rozdziały = obszary gry, każdy przypisany do jednej grupy.
> Aktualizuje **Master** po weryfikacji. Maciej czyta to jak spis treści książki.
> Zasady obiegu i role → `docs/obieg/_ZASADY.md`.
> **Decyzje Macieja (czy wdrożone?) → `docs/obieg/REJESTR-DECYZJI.md`** · hasło `status` = aktualny obraz wdrożeń.
>
> **Status na:** 2026-06-28 · **Kanon:** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` (md5 `0a049ccc`)
> **Bramka testów:** ✅ **ZIELONA** (szczegóły §Bramka na dole)

---

## 0. Jak czytać ten dokument

- ✅ = zrobione i w grze (kanon) · 🔄 = w toku w grupie · ⬜ = do zrobienia · 🔒 = czeka decyzji Macieja (ABC) · ⛔ = blokada techniczna
- **% gotowości** = ocena Mastera względem v1.0.
- Każdy rozdział ma **właściciela** (grupę). Poprawki zawsze wracają do właściciela rozdziału.
- Przepływ: Grupa → **Integrator** (wpięcie + test) → Master (weryfikacja) → **Maciej + Master (test finalnej razem)** → kanon.

**Stan ogólny gry:** 🟢 **grywalna end-to-end** (menu → mapa → miasto → ekonomia → walka → AI → dyplomacja → save). Do v1.0 zostaje polish, kilka decyzji ABC i domknięcie kilku łańcuchów cross-lane.

**Średnia gotowość v1.0: ~80%.**

---

## 📕 ROZDZIAŁ 0 — Silnik gry i integracja · właściciel: **Integrator (Grupa F)** · ~88%

Szkielet gry: wpinanie modułów wszystkich grup do `main.ts`, bramka testów, publikacja wersji roboczej.

| | Element | Stan |
|---|---|---|
| ✅ | Save / Load (z migracją starych zapisów) | w grze |
| ✅ | Generator mapy z kreatora (`generujSwiat` — seed, rozmiar, typ świata) | w grze |
| ✅ | Pętla startu: Menu → kreator → mapa → pierwsze miasto | w grze |
| ✅ | Wpięcie HUD D1B, panelu miasta, preBattle, bitwy 3D, oblężenia | w grze |
| ✅ | Bramka testów + publikacja `Gra-podglad-ROBOCZA.html` | działa |
| 🔄 | Sesja 28.06 (B5 żywność HUD, F2 🎭/⛪, tartak→Drewno, save ulepszeń) | **czeka Opus + playtest Macieja** |
| ⬜ | F-P1-01: atak wrogiego miasta z mapy (C3) | czeka spec Grupy A |
| ⬜ | F-P1-02: `deploy:false` (pozycje z mapy zamiast deploy na polu bitwy) | czeka spec Grupy A |
| ⛔ | `advanceEmpireFood` — stub | odblokuje B5 (Grupa B) |

**Kolejka Integratora:** po sesji 28.06 **pusta** — czeka dyspozycji Mastera. (`docs/obieg/INTEGRATOR-kolejka.md`)

---

## 📗 ROZDZIAŁ 1 — Start / Meta / UI · właściciel: **Grupa E** · ~82%

Pierwsze 60 sekund gracza: menu główne, kreator nowej gry, wejście na mapę. Plus: warunki zwycięstwa (meta) i globalny shell UI/menu (NIE panel miasta = B, NIE HUD mapy = A).

| | Element | Stan |
|---|---|---|
| ✅ | Kreator nowej gry (5 kroków: cywilizacja, epoka, ustawienia, mapa) | w grze |
| ✅ | Defaulty E1 (Rzym, Kamień, Normal, Standard, typ świata ×4, skala rywali) | w grze |
| ✅ | E1-UX-02: poprawiona nawigacja kroków kreatora | w grze |
| 🔄 | **E-P0-01:** menu główne S0 „5=C" (hybryda) — jeden oficjalny start, koniec rozjazdu mockup/silnik | grupa E |
| ⬜ | E-P0-06: warunki zwycięstwa (victory) — pełny ekran | współpraca z Grupą D |
| 🔄 | E1-Q6…Q12: menu główne + defaulty startu — **ZAMKNIĘTE 27.06** (paczka 1–12), czeka wdrożenia handoffów | implementacja |

---

## 📘 ROZDZIAŁ 2 — Mapa świata i HUD · właściciel: **Grupa A** · ~80%

To, co gracz widzi przez większość gry: mapa 3D, interfejs (HUD), minimapa, ruch jednostek.

| | Element | Stan |
|---|---|---|
| ✅ | A-START: start bez osadnika, auto „Załóż miasto", kamera blisko, rzeki w mgle, minimapa=fog | w grze |
| ✅ | HUD D1B: pasek zasobów, toolbar, WYKONAJ + brama końca tury, panel jednostki [H] | w grze |
| ✅ | Tryb budowy z mapy (A4) — stawianie ulepszeń terenu | w grze |
| ✅ | Granica A vs C (ruch + preBattle C1 + oblężenie C3 = mapa; samo starcie = Walka) | kanon |
| 🔄 | **OBL-S6:** obóz oblężniczy 3D na mapie (Civ-MAPA) | grupa A |
| 🔄 | HUD D1 / minimapa — dopracowanie | w toku |
| 🔄 | Złoża epoki na mapie (E-P0-04/05) | grupa A |
| ⬜ | A5: wygląd miast na mapie (10 poziomów × cywilizacja × mur) | spec gotowy, do wpięcia |
| 🔒 | A4-D4: pozostałe ulepszenia terenu (pastwisko/plantacja/tarasy/warzelnia) — kwalifikacja | częściowo |

---

## 📙 ROZDZIAŁ 3 — Miasto i ekonomia · właściciel: **Grupa B** · ~83%

Panel miasta, produkcja, surowce, populacja, porządek/bunt, kultura/religia, bogactwo (Wealth), żywność.

| | Element | Stan |
|---|---|---|
| ✅ | Panel miasta: mieszkańcy, porządek, zdrowie, suwaki B3, Wealth, auto-zarządca ⚙ | w grze |
| ✅ | Społeczeństwo % + nagłówek, 🔥 ostrzeżenie przy grace buntu | w grze |
| ✅ | Bunt B2-Q5: chip w wydarzeniach + ikona 🔥 na heksie | w grze |
| ✅ | Kary porządku (Pieniądz/Nauka/Kultura), migracja zamiast znikania pop | w grze |
| ✅ | Plony × 15 ulepszeń terenu, kultura+religia, split imperium/wojsko | w grze |
| ✅ | Wyrąb (FREE, usuwa las) + Tartak (tech „Obróbka drewna") + Drewno w Surowcach | w grze |
| ✅ | Power (Potęga) — składniki: ludność, miasta+terytorium, gospodarka | w grze |
| 🔄 | **EKO-P2-01:** tick żywności państwa B5 (`advanceEmpireFood`) | grupa B |
| 🔒 | **B1-tech-ABC (Q1–Q5):** drzewko technologii ↔ ulepszenia — **blokuje** integrację tech↔plony | **czeka ABC Macieja** |
| ⬜ | B1.4: auto vs ręczne pola pracy | po decyzji |

---

## 📕 ROZDZIAŁ 4 — Walka · właściciel: **Grupa C** (pole bitwy) + **Grupa A** (wejście z mapy) · ~85%

preBattle (Auto/Ręczna/Wycofaj), bitwa 3D w stylu Total War, oblężenie, balans.

| | Element | Stan |
|---|---|---|
| ✅ | preBattle C1: Auto / Bitwa ręczna / Wycofaj, skład multi-unit (sąsiednie heksy) | w grze |
| ✅ | Bitwa 3D (C2): minimapa, tooltipy, górny pasek, motyw, skróty, efekty TW | w grze |
| ✅ | Oblężenie C3 z mapy: modal Oblężaj/Szturm, panel, markery, kapitulacja z głodu → przejęcie | w grze |
| ✅ | AI auto-oblężenie + save/load markerów | w grze |
| ✅ | Powrót z bitwy na mapę (synchronizacja ocalałych) | w grze |
| ⬜ | F-P1-01: atak wrogiego miasta klikiem z mapy (dziś otwiera panel jak własne) | czeka spec A → Integrator |
| 🔒 | C4: balans w trakcie walki (macierz typów jednostek) | jedyne otwarte ABC w Grupie C |

---

## 📗 ROZDZIAŁ 5 — Cywilizacje, dyplomacja, AI · właściciel: **Grupa D** · ~78%

> Nauka/technologia → **Grupa B** (Rozdział 3). AI rywali + barbarzyńcy = **Grupa D** (decyzja NAZ-2, 2026-06-28).

9 typów cywilizacji + bonusy, drzewko nauki, dyplomacja (audiencja król↔król), AI rywali, barbarzyńcy, zwycięstwo.

| | Element | Stan |
|---|---|---|
| ✅ | Model D-START: miasta AI = kopie typu cywilizacji, klastry, AI defensywne, nazwy | w grze |
| ✅ | Bonusy cywilizacji (9×3) — w grze i w testach (`civ-bonusy` 30/30, Celtowie naprawieni) | w grze |
| ✅ | Drzewko nauki + filtr epoki (D1) | w grze |
| ✅ | Dyplomacja: panel, modal wojny, mgła miast Ang, kontakt po spotkaniu (`diplomacy` 135/135) | w grze |
| 🔄 | **D-P0-01:** Excel AI → `civ-ai.json` (parametry zachowań AI) | grupa D |
| 🔄 | D-P0-02: pełne bonusy cywilizacji v1.0 (wiązania ownerId) | grupa D |
| 🔄 | E-P0-06: warunki zwycięstwa | z Grupą E |
| 🔄 | Barbarzyńcy | grupa D |
| 🔄 | D3-Q1…Q4: ekran audiencji dyplomatycznej — **ZAMKNIĘTE 27.06**, czeka wdrożenia (`diplomacyAudience.ts`) | implementacja |

---

## 🧾 ŚLEDZENIE DECYZJI (żeby Twoje odpowiedzi nie ginęły)

> Pełna lista z cyklem życia → `docs/obieg/REJESTR-DECYZJI.md`. Master pilnuje, nie Maciej.

- Każda Twoja odpowiedź dostaje **ID** i status: 🟡 ZAPISANA → 🔵 W TRAKCIE → 🟠 U INTEGRATORA → 🟢 WDROŻONA → ✅ ZWERYFIKOWANA.
- Agent grupy **musi** zapisać Twoją decyzję (z cytatem) **zanim** cokolwiek zrobi — i potwierdzić Ci ID jednym zdaniem (bramka „ECHO", `_ZASADY.md` §7).
- **Hasło `status`** (dowolny czat) → dostajesz: co zapisane / wdrożone / **zaległe** + co czeka playtestu.

---

## 🔒 OTWARTE PYTANIA DO MACIEJA (wszystkie — jedno miejsce)

> Wszystko, co czeka Twojej decyzji ABC. Odpowiadasz w czacie właściwej grupy; agent zapisuje i zamyka.

**Stan 2026-06-28: BRAK otwartych ABC wymagających Twojej decyzji.** Wszystkie wcześniej listowane pytania są ZAMKNIĘTE — czekają tylko **wdrożenia**, nie kolejnej decyzji (zweryfikowane w plikach `docs/decyzje/`):

| Wcześniej „otwarte" | Faktyczny stan | Co teraz |
|---|---|---|
| B1-tech Q1–Q5 | ✅ ZAMKNIĘTE (29.06) | wdrożenie — Grupa B / Integrator |
| C4 | ✅ ZAMKNIĘTE (C4-Q1=A, 29.06) | wdrożone, czeka Opus |
| D3-Q2/Q3/Q4 | ✅ ZAMKNIĘTE (27.06) | wdrożenie audiencji — Grupa D → UI/Integrator |
| E1-Q6…Q12 | ✅ ZAMKNIĘTE (paczka 1–12, 27.06) | wdrożenie handoffów — Grupa E |
| A4-D4 | ✅ audit zamknięty | R7 Łodzie — opcjonalne |

**Opcjonalne / odłożone (nie blokują):** A-R7 (łodzie bez terytorium), B1-tech-Q3 (posterunek).

➡️ Realny backlog = **implementacja** powyższych (handoffy/TODO), nie pytania. Patrz rozdziały grup + `INTEGRATOR-kolejka.md`.

---

## ✅ ZAMKNIĘTE DECYZJE (rejestr — nie pytać ponownie)

> Pełna treść każdej decyzji: `docs/decyzje/<ID>.md` oraz `docs/MACIEJ-KARTA-DECYZJI.md` (D1–D15).

| Obszar | Zamknięte |
|---|---|
| Karta decyzji | **D1–D15** (HUD 6B, Wealth, UX bitwy, panel armii, posiłki, Katapulta, drzewko, miasta BRĄZU, minimapa…) |
| Start / cywilizacje | D-START-1B/2B/3A · D-START miasta-kopie-typu · N-1A…N-5B |
| Mapa / HUD | A1-Q5…Q12 · A2-Q4 · A4-D4 (część zakwalifikowana) |
| Miasto / ekonomia | B2-Q1…Q6 (szczęście/porządek/bunt) · B3 (suwaki) · B4 (model Wealth) |
| Walka | C1-Q1…Q5 (wejście w walkę) · C2-Q2…Q7 (UX bitwy 3D) · C3 (oblężenie z mapy) |

---

## 🚧 BLOKADY PRZEPŁYWÓW (do udrożnienia)

| # | Blokada | Skutek | Kto odblokowuje |
|---|---|---|---|
| **B1** | Opus review sesji 28.06 niezarejestrowany, a `Gra-podglad.html` **już = ROBOCZA** | kanon zmieniony bez formalnego APPROVE | Master (Opus) — domknąć review **lub** cofnąć kanon |
| **B2** | Zaległy playtest Macieja (sesja 28.06) | nie wiadomo, czy nowy kanon „czuje się" dobrze | **Maciej + Master** — wspólny test finalnej |
| **B3** | `B1-tech-ABC` (Q1–Q5) otwarte | tech ↔ ulepszenia terenu nie połączone | **Maciej** — paczka ABC |
| **B4** | Łańcuch C3 atak miasta / `deploy:false` czeka spec Grupy A | Integrator nie domyka walki o miasta z mapy | Grupa A → handoff → Integrator |
| **B5** | ~~Tracking rozproszony~~ | **➡️ rozwiązywane:** `docs/ROADMAP.md` + `docs/obieg/` | ten porządek |
| **B6** | `GRUPA-E` i `MASTER-Work` współdzielą chat-id w rejestrze | ryzyko nadpisania archiwum | Master — rozdzielić sloty |

---

## ✅ Bramka testów (zweryfikowano 2026-06-28, kod = kanon `0a049ccc`)

| Suite | Wynik | | Suite | Wynik |
|---|---|---|---|---|
| logic | 203/203 | | diplomacy | 135/135 |
| grupa-b-lane | 27/27 | | civ-bonusy | 30/30 |
| oblezenie | 27/27 | | ai | 198/198 |
| map-siege | 6/6 | | combat | OK |
| siege-ai | 17/17 | | society-breakdown | 18/18 |
| cluster-start | 35/35 | | wire-ekonomia | 29/29 |
| smoke | OK (canvas 2, rAF 1) | | wealth | 25/25 |

`battle-smoke`: ✅ z jednym **znanym WARN** (przycisk auto przy ponownym otwarciu preBattle — nie blokuje).

---

## 🎛️ INICJATYWA: Panele sterowania (Excel per grupa) — w toku

> Decyzje PANEL-1…4 (2026-06-28). Spec: `docs/obieg/PANEL-STEROWANIA-SPEC.md`. Cel: jeden Excel/grupa = panel balansu (Excel = źródło prawdy → eksport → JSON → gra).

| Grupa | Plik docelowy | Status |
|---|---|---|
| A | `panele-sterowania/Panel-A.xlsx` | ⬜ do zrobienia (dyspozycja wysłana) |
| B | `panele-sterowania/Panel-B.xlsx` | ✅ 2026-06-26 (`export-b.py`, Zywnosc-kanon) |
| C | `panele-sterowania/Panel-C.xlsx` | ✅ 2026-06-29 |
| D | `panele-sterowania/Panel-D.xlsx` | ✅ 2026-06-29 |
| E | `panele-sterowania/Panel-E.xlsx` | ✅ 2026-06-29 |

Każda grupa: inwentaryzacja → panel → wpięcie (eksport→JSON) → przeniesienie zadań → archiwizacja starych plików. Master pilnuje przez `REJESTR-DECYZJI.md`.

---

## 🛡️ INICJATYWA: Bezpieczne zmiany (izolacja + warstwy) — wdrożone

> Decyzje ISO-1…4 (2026-06-28). Reguła: `.cursor/rules/zmiany-izolacja.mdc`. Mapa połączeń: `docs/obieg/MAPA-POLACZEN.md`. Cel: grupa nie psuje innym (np. miasto wykrzaczyło mapę).

- **ISO-1 Izolacja:** grupa buduje własny podgląd `/tmp` przed oddaniem (sprawdza też sąsiednie ekrany).
- **ISO-2 Warstwy:** 🟢 izolowana→batch · 🟡 cross→Integrator+mapa+bramka wizualna · 🔴 duża→kontrakt z Masterem+worktree.
- **ISO-3 Mapa połączeń:** Integrator prowadzi `MAPA-POLACZEN.md`, sprawdza każdy handoff.
- **ISO-4 Bramka wizualna:** render smoke przed `ROBOCZA` (zadanie w `INTEGRATOR-kolejka.md`).

---

## 🔜 Najbliższe kroki

1. **Maciej + Master:** wspólny test finalnej `0a049ccc` → OK / BUG.
2. **Master/Opus:** domknąć formalny review sesji 28.06 (zarejestrować APPROVE).
3. **Maciej:** paczka ABC `B1-tech` (Q1–Q5) — odblokowuje ekonomię tech↔ulepszenia.
4. **Grupa A:** spec C3 atak miasta z mapy → handoff → Integrator (F-P1-01/02).
5. **Grupy w toku:** E (menu S0), A (obóz 3D + złoża), D (Excel AI + victory + barbarzyńcy), B (B5 tick).

---

*Stan operacyjny grup → `docs/obieg/<grupa>.md`. Kolejka wpięć → `docs/obieg/INTEGRATOR-kolejka.md`. Decyzje Macieja → `docs/obieg/REJESTR-DECYZJI.md`. Zasady → `docs/obieg/_ZASADY.md`. Historia → `docs/archiwum/`.*
