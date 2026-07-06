# Audyt Grupy F (Silnik) — raport **dla Master Silnika**

> Maciej **nie czyta** tego pliku. Master czyta po `czaty` lub gdy F dopisze ścieżkę w `SILNIK-DO-MASTERA.md`.

**Data:** 2026-06-27 · **Sesja:** autonomiczna (~2h) · **Bez nowych pytań ABC**

---

## 1. Executive summary

Grupa F wdrożyła **8 batchy** w `main.ts` (save/load, generujSwiat, społeczeństwo B2, preBattle C1, HUD D1B częściowo, kary Porządku). **Gra w przeglądarce nie odzwierciedla tego kodu** — brak `Gra-podglad-ROBOCZA.html` (bramka wymaga Node; agent Cursor bez npm). **`Gra-podglad.html`** (finalna) jest prawdopodobnie **stara** względem źródeł.

**Naprawiono dziś:** bug `newW`/`newH` przy starcie nowej gry; czyszczenie `growthMultMap` przy resetcie gry.

**Uporządkowano:** katalog roboczy `docs/czaty/grupa-f/` (ten raport + indeks + propozycja archiwum).

---

## 2. Co zostało wykonane (szczegóły)

### F1 — Save / load
- Wspólna `restoreGameFromSave()` dla Ctrl+L i menu Wczytaj
- Migracja starych save: `ensureCitySaveDefaults` (podział Handel/Praca, Wealth)
- Parity panelu miasta B3 (suwaki, kup jednostkę)

### F2 — Migracja + AI + mury
- `maMur` przy budowie/migracji z `cityBuilt['mury']`
- Trudność AI w `decideAITurn`
- Drugi `configureCityPanel` (NewGame) zsynchronizowany z boot

### F-A2 — Nowa gra / generator
- `generujSwiat(seed, rozmiar, typSwiata)` z kreatora
- Reset skarbca/nauki/tech; rebuild sceny i jednostek
- **Fix 2026-06-27:** log startu używa `map.szerokoscQ × map.wysokoscR`

### F-B2 — Panel społeczeństwa (haki)
- `cityOrderState` aktualizowany co turę
- `getOrderState`, `getCityHealth` w obu `configureCityPanel`

### F-C1 — Wejście w walkę (decyzje zamknięte)
- `{ defaultAction: 'manual' }` (Enter = bitwa ręczna)
- Skład multi-unit: heks + sąsiedzi w promieniu 1 (ten sam właściciel)
- Anuluj preBattle bez utraty ruchu
- `BattleScene({ deploy: true })`, sync `survivors` po bitwie
- Zapis przed bitwą (Ctrl+S / onSave)

### F-HUD — część 1 i 2
- Moduł `hud.ts` zamiast legacy `#hud` + przycisków Nauka/Dyplomacja
- Minimapa wariant B (`getMinimapData`)
- Pasek wojen z graczem (A1-Q5)
- **A1-Q11:** Kultura z `+X/t` na pasku
- **B2-Q5 (część SILNIK):** chip buntu w panelu wydarzeń (`getEvents`)

### F-B2-porzadek — kary + bunt
- Kary Pieniądz/Nauka/Kultura na **następną** turę (`orderMultMap`)
- Bunt = migracja −1/+1 w imperium (nie znikająca populacja)
- `porzadek: ord.order` widoczny w panelu miasta

---

## 3. Co NIE jest wpięte (kolejka)

| Priorytet | Temat | Kto blokuje |
|-----------|--------|-------------|
| **P0** | Bramka → ROBOCZA | Master / Node |
| **P1** | F-HUD-2: WYKONAJ, brama tury (A1-Q9) | Grupa A / UI (`hud.ts` brak `onExecutePending`) |
| **P1** | Panel jednostki [H] (A2-Q4) | Grupa A — brak modułu do wpięcia |
| **P1** | Tryb budowy mapy A4-D4 | UI toolbar + MAPA placement |
| **P1** | Ikona 🔥 na heksie miasta (B2-Q5) | **MAPA** — brak `getRevolt` w `cities.ts` |
| **P1** | F-C2 — pełna bitwa TW | F po ROBOCZA (UNITS kod gotowy) |
| **P2** | F-D4 audyt bonusów cywilizacji | delegacja CYWILIZACJE |
| **P2** | A4-D4 — 15 ulepszeń z mapy | MAPA + UI, potem SILNIK BLK-04 |
| **—** | E1-Q9…Q12 korekty startu | Maciej czat E (provisional w kodzie) |
| **⛔** | B5 żywność imperium | stub `advanceEmpireFood` — nie wpinaj |

---

## 4. Decyzje Macieja — nie pytaj ponownie

Pełna lista: `docs/decyzje/MAPA-PYTAN-OPEN.md` (zsynchronizowana 2026-06-27) + `docs/MACIEJ-KARTA-DECYZJI.md` (D1–D15).

**Kluczowe dla F (zamknięte):**
- ABC1=A mockup HUD D1B
- A1-Q5, Q7–Q11, A2-Q4, A4-D4-Q1, A4-Q1
- B2-Q1…Q6 (w tym Q5=C chip+hex, Q6=C migracja)
- C1-Q1…Q5, C2-Q2…Q7, D5=B
- B3, B4 (Wealth D3=A), E1 defaulty menu (Rzym, Kamień, 4 typy mapy)

**Otwarte (nie w czacie F):**
- E1-Q9…Q12 → czat E
- B1.2–B1.4, B4.1–B4.2, B5.1–B5.2 → czat B
- C3 oblężenie → czat C

---

## 5. Pliki robocze — gdzie co leży

**Kanoniczny hub F:** `docs/czaty/grupa-f/` (ten folder)

| Warstwa | Lokalizacja |
|---------|-------------|
| Kod integracji | `gra/src/main.ts` |
| Raport F → Master | `dyspozycje/SILNIK-DO-MASTERA.md` |
| Wpisy cross-lane | `docs/czaty/DO-MASTERA.md` § F + § A–E |
| Dyspozycje Master → F | `docs/czaty/OD-MASTERA.md` § F |
| Handoffy aktywne | `dyspozycje/_handoff/*SILNIK*` (4 pliki) |
| Handoffy archiwum | `dyspozycje/_handoff/_archiwum/silnik/` |
| Dashboard decyzji | `docs/decyzje/STATUS.md` |
| Kolejka Opus | `docs/decyzje/OPUS-REVIEW-QUEUE.md` |
| Excel status projektu | `Status-projektu-The-Game.xlsx` (root) — **wymaga ręcznej aktualizacji** |
| Excel ulepszenia D4 | `MIASTO/Ulepszenia-terenu.xlsx` |
| Excel bonusy | `Civ-CYWILIZACJE/Bonusy-cywilizacji-9x3.xlsx` |

Pełna mapa: [INDEX-PLIKOW.md](./INDEX-PLIKOW.md)

---

## 6. Sprzeczności w dokumentacji (naprawione / do decyzji)

| Problem | Status |
|---------|--------|
| STATUS.md — duplikat wierszy B2, „HUD NIE” vs ABC1=A | **Zaktualizowano STATUS.md** |
| MAPA-PYTAN — C1/C2 „OTWARTE” vs zamknięte | **Zaktualizowano MAPA-PYTAN** |
| OD-MASTERA „F-C1 częściowo” | Kod = komplet; Master może zsynchronizować |
| `dyspozycje/SILNIK.md` — stary model kanonu | **Propozycja archiwum** |
| Backupy `main.ts.bak-SILNIK-*` | `.gitignore` — tylko lokalnie; brak w repo |

---

## 7. Propozycja plików do usunięcia / archiwum

**Decyzja na wspólnym spotkaniu z Masterem** — lista: [PROPOZYCJA-ARCHIWUM.md](./PROPOZYCJA-ARCHIWUM.md)

Przeniesiono już do `_archiwum/silnik/` (5 handoffów historycznych). **Nie usunięto** nic bez Twojej zgody.

---

## 8. Excel i panele dla Ciebie

| Plik | Co zaktualizować | Kto |
|------|------------------|-----|
| `Status-projektu-The-Game.xlsx` | % lane SILNIK ~85%, integracja main ~80%, bramka BLOK, data audytu | Master po sprincie / Ty ręcznie |
| `docs/decyzje/STATUS.md` | Dashboard tekstowy — **zaktualizowany przez F** | — |
| `docs/MACIEJ-KARTA-DECYZJI.md` | D1–D15 zamknięte — bez zmian | — |
| `docs/MACIEJ-DECYZJE-ROZWINIETE.md` | Opisy decyzji — bez zmian | — |
| `docs/decyzje/MAPA-PYTAN-OPEN.md` | Routing pytań — **zsynchronizowany** | — |

Agent **nie edytuje** plików `.xlsx` (ryzyko uszkodzenia) — rekomendacja: Master lub Ty po playteście ROBOCZA.

---

## 9. Następne kroki (autonomiczne F po Twoim powrocie)

1. Master: bramka → ROBOCZA → Opus  
2. F: F-HUD-2 gdy Grupa A dostarczy WYKONAJ + panel [H]  
3. MAPA: `getRevolt` → F dopina callback w `_cityRenderOpts`  
4. F: F-C2 po ROBOCZA PASS  

**Ty (Maciej):** nic nie musisz potwierdzać dla zamkniętych ABC. **Playtest ROBOCZA = Master** (weryfikacja przed Opus). **Ty** dostajesz playtest dopiero **finalnej** `Gra-podglad.html` w czacie Master Silnika.

---

*Audyt: subagenci explore + weryfikacja kodu · Archiwum sesji: `docs/archiwum-czatow/lane/` (do dopisania)*
