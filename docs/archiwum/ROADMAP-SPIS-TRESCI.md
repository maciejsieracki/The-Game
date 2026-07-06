# 🗺️ The Game (Civ) — SPIS TREŚCI GRY (żywy roadmap)

> **Jedno miejsce na całość gry.** Rozdziały = obszary gry, każdy przypisany do jednej grupy.
> Aktualizuje **Master Silnik (Opus)** po weryfikacji. Maciej czyta to jak spis treści książki.
>
> **Status na:** 2026-06-28 · **Kanon:** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` (md5 `0a049ccc`)
> **Bramka testów:** ✅ **ZIELONA** (szczegóły §Bramka na dole)

---

## 0. Jak czytać ten dokument

- ✅ = zrobione i w grze (kanon) · 🔄 = w toku w lane · ⬜ = do zrobienia · 🔒 = czeka decyzji Macieja (ABC) · ⛔ = blokada techniczna
- **% gotowości** = moja (Master) ocena obszaru względem v1.0.
- Każdy rozdział ma **właściciela** (grupę). Poprawki zawsze wracają do właściciela rozdziału.
- Przepływ: Grupa (lane) → Grupa F (wpięcie + test) → Master (weryfikacja + Opus) → **Maciej (playtest)**.

**Stan ogólny gry:** 🟢 **grywalna end-to-end** (menu → mapa → miasto → ekonomia → walka → AI → dyplomacja → save). Do v1.0 zostaje polish, kilka decyzji ABC i domknięcie kilku łańcuchów cross-lane.

**Średnia gotowość v1.0: ~80%.**

---

## 📕 ROZDZIAŁ 0 — Silnik i integracja · właściciel: **Grupa F** · ~88%

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

**Kolejka F:** po sesji 28.06 **pusta** — czeka dyspozycji Mastera.

---

## 📗 ROZDZIAŁ 1 — Start gry i menu · właściciel: **Grupa E** · ~82%

Pierwsze 60 sekund gracza: menu główne, kreator nowej gry, wejście na mapę.

| | Element | Stan |
|---|---|---|
| ✅ | Kreator nowej gry (5 kroków: cywilizacja, epoka, ustawienia, mapa) | w grze |
| ✅ | Defaulty E1 (Rzym, Kamień, Normal, Standard, typ świata ×4, skala rywali) | w grze |
| ✅ | E1-UX-02: poprawiona nawigacja kroków kreatora | w grze |
| 🔄 | **E-P0-01:** menu główne S0 „5=C" (hybryda) — jeden oficjalny start, koniec rozjazdu mockup/silnik | lane UI, `start` |
| ⬜ | E-P0-06: warunki zwycięstwa (victory) — pełny ekran | współpraca z Grupą D |
| 🔒 | E1-Q6…Q8: menu główne (Kampania / Multiplayer / media) — wizja | czeka ABC Macieja |
| 🔒 | E1-Q9…Q12: szczegóły defaultów (reset gracza, Brąz+tech, kształt Ziemi, zakres rywali) | czeka ABC Macieja |

---

## 📘 ROZDZIAŁ 2 — Mapa świata i HUD · właściciel: **Grupa A** · ~80%

To, co gracz widzi przez większość gry: mapa 3D, interfejs (HUD), minimapa, ruch jednostek.

| | Element | Stan |
|---|---|---|
| ✅ | A-START: start bez osadnika, auto „Załóż miasto", kamera blisko, rzeki w mgle, minimapa=fog | w grze |
| ✅ | HUD D1B: pasek zasobów, toolbar, WYKONAJ + brama końca tury, panel jednostki [H] | w grze |
| ✅ | Tryb budowy z mapy (A4) — stawianie ulepszeń terenu | w grze |
| ✅ | Granica A vs C (ruch + preBattle C1 + oblężenie C3 = mapa; samo starcie = Walka) | kanon |
| 🔄 | **OBL-S6:** obóz oblężniczy 3D na mapie (Civ-MAPA, `start`) | lane MAPA |
| 🔄 | HUD D1 / minimapa — dopracowanie (osobny czat) | w toku |
| 🔄 | Złoża epoki na mapie (E-P0-04/05) | lane MAPA |
| ⬜ | A5: wygląd miast na mapie (10 poziomów × cywilizacja × mur) | spec gotowy, do wpięcia |
| 🔒 | A4-D4: pozostałe ulepszenia terenu (pastwisko/plantacja/tarasy/warzelnia) — kwalifikacja | częściowo, reszta lane MAPA |

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
| 🔄 | **EKO-P2-01:** tick żywności państwa B5 (`advanceEmpireFood`) | lane EKONOMIA |
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
| ⬜ | F-P1-01: atak wrogiego miasta klikiem z mapy (dziś otwiera panel jak własne) | czeka spec A → F |
| 🔒 | C4: balans w trakcie walki (macierz typów jednostek) | jedyne otwarte ABC w Grupie C |

---

## 📗 ROZDZIAŁ 5 — Cywilizacje, dyplomacja, AI · właściciel: **Grupa D** · ~78%

9 typów cywilizacji + bonusy, dyplomacja (audiencja król↔król), AI rywali, barbarzyńcy, zwycięstwo.  
**Drzewko tech + nauka** → **Grupa B** (`docs/decyzje/ROUTING-tech-nauka-Grupa-B.md`).

| | Element | Stan |
|---|---|---|
| ✅ | Model D-START: miasta AI = kopie typu cywilizacji, klastry, AI defensywne, nazwy | w grze |
| ✅ | Bonusy cywilizacji (9×3) — w grze i w testach (`civ-bonusy` 30/30, Celtowie naprawieni) | w grze |
| ✅ | Drzewko nauki + filtr epoki (D1) | w grze |
| ✅ | Dyplomacja: panel, modal wojny, mgła miast Ang, kontakt po spotkaniu (`diplomacy` 135/135) | w grze |
| 🔄 | **D-P0-01:** Excel AI → `civ-ai.json` (parametry zachowań AI) | lane CYWILIZACJE |
| 🔄 | D-P0-02: pełne bonusy cywilizacji v1.0 (wiązania ownerId) | lane CYWILIZACJE |
| 🔄 | E-P0-06: warunki zwycięstwa | z Grupą E |
| 🔄 | Barbarzyńcy | lane CYWILIZACJE |
| 🔒 | D3-Q2/Q3/Q4: ekran audiencji dyplomatycznej (lista spotkanych, akcje TW/Civ) | czeka ABC Macieja |

---

## 🚧 BLOKADY PRZEPŁYWÓW (analiza Mastera — do udrożnienia)

| # | Blokada | Skutek | Kto odblokowuje |
|---|---|---|---|
| **B1** | Opus review sesji 28.06 niezarejestrowany, a `Gra-podglad.html` **już = ROBOCZA** | kanon zmieniony bez formalnego APPROVE | Master (Opus) — domknąć review **lub** cofnąć do poprzedniego kanonu |
| **B2** | Zaległy playtest Macieja (sesja 28.06) | nie wiadomo czy nowy kanon „czuje się" dobrze | **Maciej** — jeden playtest wg checklisty |
| **B3** | `B1-tech-ABC` (Q1–Q5) otwarte | tech ↔ ulepszenia terenu nie połączone | **Maciej** — paczka ABC |
| **B4** | Łańcuch C3 atak miasta / `deploy:false` czeka spec Grupy A | F nie domyka walki o miasta z mapy | Grupa A → handoff → F |
| **B5** | Tracking rozproszony (9 dyspozycji, DZIENNIK 988+, DO/OD-MASTERA, Excel, STAN) | brak jednego widoku całości | **ten plik** + dyscyplina aktualizacji |
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

## 🔜 Najbliższe kroki (kolejka Mastera)

1. **Maciej:** playtest kanonu `0a049ccc` (checklista w czacie) → OK / BUG.
2. **Master/Opus:** domknąć formalny review sesji 28.06 (zarejestrować APPROVE).
3. **Maciej:** paczka ABC `B1-tech` (Q1–Q5) — odblokowuje ekonomię tech↔ulepszenia.
4. **Grupa A:** spec C3 atak miasta z mapy → handoff → F-P1-01/02.
5. **Lane'y w toku:** E (menu S0), MAPA (obóz 3D + złoża), CYW (Excel AI + victory + barbarzyńcy), EKONOMIA (B5 tick).

---

*Źródła stanu: `dyspozycje/DZIENNIK-MASTERA.md`, `docs/czaty/DO-MASTERA.md` + `OD-MASTERA.md`, `dyspozycje/*-STAN.md`, `dyspozycje/F-KOLEJKA-P0.md`, `docs/decyzje/OPUS-REVIEW-QUEUE.md`, bramka `gra/tools/*.cjs`. Pełny plan: `docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md`.*
