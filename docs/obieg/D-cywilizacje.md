# 🅳 GRUPA D — Cywilizacje, dyplomacja, AI

> **Trigger Macieja:** `start` → czytaj ten plik · sekcja **🎯 TERAZ** · tylko Grupa D · nie pytaj „co robić?".
> Właściciel: 9 typów cywilizacji + bonusy, dyplomacja (audiencja), AI rywali, barbarzyńcy, zwycięstwo.
> **NIE właściciel:** drzewko tech + parametry nauki → **Grupa B** (`docs/decyzje/ROUTING-tech-nauka-Grupa-B.md`, 2026-06-28).

## ⛔ OBOWIĄZ ścieżka kodu (2026-07-05 — Maciej **`ścieżka`**)

**📢 Broadcast:** [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](BROADCAST-NAZWY-PLIKOW-2026-07-05.md)  
**Kod TYLKO:** `gra/src/` + `gra/data/`. **Publish (F):** `gra-robocza/Gra-ROBOCZA.html`.  
**ZAKAZ:** `gra-robocza/src/`, kanon, finalna, stary `Gra-podglad.html`. [`OBOWIAZ-SCIEZKA-KODU.md`](OBOWIAZ-SCIEZKA-KODU.md)

## 🚫 OBOWIĄZ playtest — **cisza w czacie** (2026-07-02)

**ZAKAZ** informować Macieja o playtestach (także zaległych). Po kanonie → dopisz [`REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md) **§2**. **Tylko Master** mówi Maciejowi o testach. [`KOMUNIKACJA-PLAYTEST-LANE.md`](KOMUNIKACJA-PLAYTEST-LANE.md) · trigger: **`obowiaż`** · **`rejestr`**

## 🎯 OBOWIĄZ zakres raportu (2026-07-02)

**Do Macieja tylko:** braki **ABC Grupy D** · wdrożenie **Twoich** decyzji · czy **`przekaż do Mastera`** zrobione. **ZAKAZ** raportu całej gry / innych grup / kolejki F. Trigger: **`zakres`** · [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)

## ⛔ BLOKADA ABC — cuda P1 (2026-06-26)

**Grupa D wysłała D-CUD2 w złym formacie** (brak Cel/Dlaczego, brak Za/Przeciw, rekomendacja w opcji A). **Maciej odrzucił.**

| Reguła | Akcja |
|--------|--------|
| **ZAKAZ** | Własne skrócone wersje pytań do Macieja |
| **OBOWIĄZEK** | **D-CUD2** 🔵 wdrożenie aktywne — Maciej **C** · `MASTER-do-GRUPA-D_D-CUD2-utrzymanie.md` · trigger Grupa D: **`działaj`** |
| **Self-check** | 8× TAK z `_ABC-JAK-PYTASZ.md` — inaczej **STOP** |
| **Echo Master** | [`ECHO-ABC-DO-GRUP.md`](../master/ECHO-ABC-DO-GRUP.md) — wklej w czat Grupy D · czekaj **ABC OK** |

## 🔴 PILNE — dyspozycja Master (2026-07-02)

> **Trigger:** `działaj` · [`dyspozycje/MASTER-PILNE-2026-07-02.md`](../../dyspozycje/MASTER-PILNE-2026-07-02.md)

| Pri | Temat | DoD |
|-----|--------|-----|
| **P1** | **E-P0-06** — ekran zwycięstwa (z **Grupą E**) | ✅ F wpięte · `F-do-MASTER_VICTORY-E-P0-06-2026-07-02.md` |
| **P2** | Panel-D — **`eksportuj panel`** | ✅ `export-d.py` OK (zmian=0) · round-trip **PASS** (start 2026-07-02) |

Sojusz v1.2 display: ✅ kanon — **nie powtarzaj**.

**Lane:** ✅ **IDLE** — P1+P2 domknięte · **`przekaż do Mastera`** wykonane

---

## 📨 JAK PYTASZ MACIEJA

> **JEDYNY wzór — stary tekst „O co chodzi i dlaczego" WYCOFANY.**  
> Przed **każdą** paczką ABC **czytaj i stosuj wyłącznie:**
> [`_ABC-JAK-PYTASZ.md`](_ABC-JAK-PYTASZ.md) · [`ABC-FORMAT-KANON-MACIEJ.md`](../decyzje/ABC-FORMAT-KANON-MACIEJ.md) · [`SZABLON-PYTANIA-ABC.md`](../decyzje/SZABLON-PYTANIA-ABC.md) · `.cursor/rules/abc-pelna-forma.mdc`
>
> Maciej: **`format`** / **`ABC`** → przepisz natychmiast w pełnej formie.  
> **Po ABC:** `.cursor/rules/decyzje-echo.mdc` (ECHO → AskQuestion „wdrażaj?" → AKCJA)

## ⌨️ HASŁO MACIEJA: `raport2`

Gdy Maciej wpisze **`raport2`** (alias **`raport 2`**) — odpowiedz **natychmiast** w 3 sekcjach ([`RAPORT2-INSTRUKCJA.md`](RAPORT2-INSTRUKCJA.md) · reguła: `.cursor/rules/komendy-raport.mdc`):

1. **✅ ABC wdrożone** — `REJESTR-DECYZJI.md` (Grupa D) + dowód (plik/test/md5)
2. **🔜 Nie wdrożone / w toku** — status + co blokuje
3. **📤 Przekazane Masterowi** — handoff + `→ MASTER: GOTOWE` + Slack · brakuje → **dopisz sam**

Końcówka: `Gotowe u Mastera: TAK/NIE · brakuje: …` · **ZAKAZ:** „wklej do Mastera".

## 🛡️ ZASADY ZMIAN (izolacja — żeby nie psuć innym)

> Nowe (ISO-1…4, 2026-06-28). Pełna reguła: `.cursor/rules/zmiany-izolacja.mdc` · Mapa połączeń: `docs/obieg/MAPA-POLACZEN.md`.

- **Buduj własny podgląd przed oddaniem:** `npx vite build --outDir $env:TEMP\civ-<grupa>` → sprawdź swój ekran I sąsiednie (mapa/miasto/HUD).
- **Sklasyfikuj warstwę w handoffie:** 🟢 izolowana (własny moduł) · 🟡 cross/wspólny stan/render/save · 🔴 duża/przebudowa.
- 🟢 → Integrator scala batchem (szybko). 🟡 → tylko przez Integratora (sprawdzi mapę połączeń + bramka wizualna). 🔴 → najpierw kontrakt z Masterem + osobna gałąź.
- **Nigdy** nie ruszaj `main.ts` ani plików innych grup. Dotykasz `render/*` lub wspólnego stanu (`playerState`) = minimum 🟡.

## 📦 SELF-CHECK PRZED HANDOFFEM (ISO-5 + SIMP-1)

> **POTWIERDZENIE ZASAD: ISO v1 — _do uzupełnienia przez grupę: „stosuję (RRRR-MM-DD)"_**

> Cel: nie psuć gry innym. Maciej = zero terminala; sprawdza agent grupy. Pełny dok: `docs/obieg/WERSJE-TESTOWE.md`.

Twój agent, zanim napisze `→ INTEGRATOR: GOTOWE`:
1. `typecheck` (czy kod się kompiluje),
2. testy Twojego obszaru (zielone),
3. handoff z **warstwą** (🟢 izolowana / 🟡 cross / 🔴 duża) + **„co sprawdzić po wpięciu"**.

Pełnego buildu całej gry **nie robisz** — to rola Integratora (ma wszystkie klocki i sprawdza wygląd).


## 📊 PANEL STEROWANIA — ZADANIE (PANEL, 2026-06-28)

> **Twój panel balansu:** `panele-sterowania/Panel-D.xlsx` · **Inwentaryzacja:** `docs/obieg/D-PANEL-INWENTARYZACJA.md`  
> **Spec:** `docs/obieg/PANEL-STEROWANIA-SPEC.md`

| Krok | Status |
|------|--------|
| Inwentaryzacja | ✅ `D-PANEL-INWENTARYZACJA.md` |
| Generator Excel | ✅ `gen-panel-d.py` |
| Export | ✅ `export-d.py` |
| **Panel-D.xlsx** | ✅ 8 arkuszy (w tym AI-zachowanie) |
| Round-trip test | ✅ `test-panel-d-roundtrip.py` |
| PANEL-2 w REJESTR | ✅ **Maciej OK hub** (2026-06-30) · balans liczb = **operacja ciągła**, nie jednorazowa |

**Workflow balansu (Maciej):** otwórz `Panel-D.xlsx` → zmień **Wartość** → w czacie D: **eksportuj panel** → opcjonalnie rebuild kanonu. **Bez Opusa, bez main.ts** (same JSON).

**UX-INWENTARZ:** ✅ `docs/ux/REJEST-UX-MASTER.md` § Grupa D (15 wpisów, 2026-06-29)

## 🔀 PANEL-MERGE — ✅ WYKONANE (2026-06-30)

> **Tracker:** `docs/obieg/PANEL-MERGE-TRACKER.md` — D-M1…D-M6 ✅

- [x] D-M1…D-M5: arkusze w Panel-D + `export-d.py` bez `--full`
- [x] D-M6: koniec workflow „eksportuj panel pełny"
- [x] Round-trip + dry-run Master ✅

## 🔴 P0 — BLOKER PANELU (audyt zweryfikowany przez Master, 2026-06-28, decyzja PANEL-P0-FIX)
> **Panel-D NIE jest zsynchronizowany z grą** — dry-run eksportu pokazał ~76 oczekujących zmian AI/barbarzyńcy. Excel ≠ JSON: panel zbudowany, ale eksport nieodpalony (lub xlsx zregenerowany bez sync).
- [ ] Odpal eksport Panel-D → JSON (efekt komendy `eksportuj panel`): `diplomacy.json` + `ai-params.json` mają mieć wartości z Excela.
- [ ] Zweryfikuj round-trip (zmiana w Excel → eksport → widoczna w `gra/data/*.json`).
- Po naprawie: status PANEL-2-D w `REJESTR-DECYZJI.md`.

## 📊 PANEL — UZUPEŁNIENIA (audyt 2026-06-28)

> **Decyzja Macieja (PANEL-AUDYT, 2026-06-28, ABC opcja A):** dorób panel do kompletu. Po uzupełnieniu: round-trip test (Excel→JSON→gra) + status PANEL-2 w `docs/obieg/REJESTR-DECYZJI.md`. Kolumny wg spec §2 (pełne nagłówki: „Zakres/dozwolone", „Wpływ na grę", „Plik źródłowy"). `_INFO` BEZ komend terminala dla Macieja (eksport przez komendę `eksportuj panel`). Pełny audyt: rejestr decyzji.

- [x] Bonusy cywilizacji — osobny Excel + `export-d.py --full` (tabela w `D-PANEL-INWENTARYZACJA.md`)
- [x] `civ-ai.json` + `civ-params.json` — `Cywilizacje.xlsx` + `--full`
- [x] Parametry AI (`ekspansja_*`, `dyplomacja_*`, `ai_wycofanie_*`) — arkusz **AI-zachowanie**
- [ ] Arkusz „Zwycięstwo": eksport do JSON — **v1.1** (dziś dokumentacja + stałe w `victory.ts`)
- [x] Akcje dyplomatyczne — `Dyplomacja.xlsx` + `--full`
- [x] `_INFO`: bez komend terminala (eksportuj panel w czacie)

## 🎯 TERAZ

- 🟠 **→ MASTER: GOTOWE** (2026-06-30) — sojusz v1.2 · Panel-D progi · handoff UI/F  
  Handoff: `dyspozycje/_handoff/D-do-MASTER_sojusz-v12-panel-params-display.md` · Slack: `docs/obieg/SLACK-OUTBOX-D-2026-06-30.md`
- 🟢 **Sojusz v1.2 wdrożony w lane** — premia siły proponenta · usunięto partnerRw 0.4–0.7 · testy 17/17 + 140/140
- 🔵 **Czeka dyspozycja lane** — sojusz v1.2 display ✅ w kanonie `de9b53e…` (KANON-BATCH-3)
- 🟢 **M jednostki → Power WPIĘTE** — kanon `3DAE1AA5…` / `5D965EB7…` (sprawdź MASTER-WATCH)

## 🧾 DECYZJE MACIEJA (świeże — echo, przed wdrożeniem)
- **D-CUD2 (2026-06-26):** **C** — utrzymanie wygasłego cudu = **50%** starej stawki (`floor(utrzymanie/2)`, min. 0). → `docs/decyzje/D-CUD2-utrzymanie-wygasly.md`
- **D3-v1.1 (2026-06-30):** `T1A` trybut ze skarbca · **dwa sojusze** (defensywny + pełny, brak wojny=zryw) · `T3A` handel jednorazowy · `T4B` wszystko naraz → `docs/decyzje/D3-v1.1-MACIEJ-2026-06-30.md`

## ✅ GOTOWE → INTEGRATOR (Grupa F wpina main.ts)
- **E-P0-06** victory 10=A* → `dyspozycje/_handoff/CYWILIZACJE-do-SILNIK_victory-10A.md` (test 12/12)
- **E2-11** barbarians 11=C* → `dyspozycje/_handoff/CYWILIZACJE-do-SILNIK_barbarians-11C.md` (test 55/55)
- **diplomacy.ts** — bramka **135/135** (2026-06-29, bez zmian kodu)

## 📌 ZAMKNIĘTE (nie pytać ponownie)
- D-P0-01, D-P0-02/03 (bonusy 30/30) · E-P0-06 · E2-11 (moduły lane)
- D1–D15 (karta decyzji) · D-START-1B/2B/3A · D-START miasta-kopie-typu · N-1A…N-5B
- W grze: model D-START (kopie typu, klastry, AI defensywne, nazwy), bonusy 9×3 (30/30), dyplomacja (135/135)

---
🔗 Historia: `docs/archiwum/` · Kontrakty: `dyspozycje/_handoff/`
