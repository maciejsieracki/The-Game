# 🅰️ GRUPA A — Mapa świata i HUD

> **Trigger Macieja:** **`działaj`** → czytaj ten plik · sekcja **🎯 TERAZ** · tylko Grupa A · nie pytaj „co robić?". (Obieg 2026-06-30 — komenda `start` wycofana.)
> Właściciel: mapa 3D, HUD, minimapa, ruch jednostek, tryb budowy z mapy, wejście do walki z mapy.

## ⛔ OBOWIĄZ ścieżka kodu (2026-07-05 — Maciej **`ścieżka`**)

**📢 Nazwy plików (broadcast):** [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](BROADCAST-NAZWY-PLIKOW-2026-07-05.md)  
**Kod TYLKO:** `gra/src/` (`map/`, `render/`, `ui/hud`…). **Publish:** Integrator F → **`gra-robocza/Gra-ROBOCZA.html`**.  
**ZAKAZ:** `gra-robocza/src/`, `gra-kanon/`, kanon/finalna, stary `Gra-podglad.html`.  
Pełna reguła: [`OBOWIAZ-SCIEZKA-KODU.md`](OBOWIAZ-SCIEZKA-KODU.md)

## 🚫 OBOWIĄZ playtest — **cisza w czacie** (2026-07-02)

**ZAKAZ** informować Macieja o playtestach (także zaległych). Po kanonie → dopisz [`REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md) **§2**. **Tylko Master** mówi Maciejowi o testach. [`KOMUNIKACJA-PLAYTEST-LANE.md`](KOMUNIKACJA-PLAYTEST-LANE.md) · trigger: **`obowiaż`** · **`rejestr`**

## 🎯 OBOWIĄZ zakres raportu (2026-07-02)

**Do Macieja tylko:** braki **ABC Grupy A** · wdrożenie **Twoich** decyzji · czy **`przekaż do Mastera`** zrobione. **ZAKAZ** raportu całej gry / innych grup / kolejki F. Trigger: **`zakres`** · [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)

## 🔴 PILNE — dyspozycja Master (2026-07-02)

> **Trigger:** `działaj` · Pełna spec: [`dyspozycje/MASTER-PILNE-2026-07-02.md`](../../dyspozycje/MASTER-PILNE-2026-07-02.md) · kanon `de9b53e…`

| Pri | Temat | Status |
|-----|--------|--------|
| **P1** | **F-P1-01** — spec ataku wrogiego miasta z mapy | **✅ SPEC GOTOWY** 2026-07-02 · GAP-A1/A2 → F/SILNIK |
| **P2** | Panel-A checklist PANEL-AUDYT | **✅ GOTOWE** (sync P7) |

**Handoffy P1:**
- Spec: `docs/decyzje/F-P1-01-atak-miasta-z-mapy.md`
- → C (kanon): `dyspozycje/_handoff/A-do-C_map-attack-city-F-P1-01.md`
- → C (skrót): `dyspozycje/_handoff/A-do-C_map-attack-spec-F-P1-01.md`
- → F: `dyspozycje/_handoff/A-do-INTEGRATOR_map-attack-city-P1.md`
- Moduł: `gra/src/map/map-attack-city.ts` · test `map-attack-city-test.cjs` **8/8**

**Po P1:** **`przekaż do Mastera`** ✅

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

1. **✅ ABC wdrożone** — `REJESTR-DECYZJI.md` (Grupa A) + dowód (plik/test/md5)
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


## 🔗 Koordynacja z Grupą B (Miasto/Ekonomia)

> **Maciej 2026-06-29:** B robi swoją część panelu/parametrów; po GOTOWE przekaże paczkę → **A wpina do Panel-A** (bez robienia dwa razy). MAPA **czeka** na handoff, nie duplikuje arkuszy B.

---
> **🥇 PRIORYTET 1 (decyzja AB-KOLEJNOSC, Maciej 2026-06-28): NAJPIERW Panel-A, POTEM FOOD-HODOWLA.** Po `zadanie panel` rób tylko ten panel, nie pytaj o kolejność.
> **Twój panel balansu:** `panele-sterowania/Panel-A.xlsx`. Spec OBOWIĄZKOWA: `docs/obieg/PANEL-STEROWANIA-SPEC.md`.
- **Cel:** Excel = źródło prawdy → `export-a.py` → JSON → gra (Maciej kręci balansem).
- **Zbierasz:** generator mapy, mgła, ulepszenia terenu, zasięgi, typy świata.
- **5 kroków:** inwentaryzacja → budowa panelu (kolumny wg spec §2) → wpięcie (eksport→JSON; `main.ts`→handoff do Grupy F) → przeniesienie otwartych zadań do ROADMAP/obieg → archiwizacja starych plików (1:1).
- **Źródła + DoD:** spec §5/§6. Po wykonaniu: status PANEL-2 w `docs/obieg/REJESTR-DECYZJI.md` + `→ INTEGRATOR: GOTOWE` jeśli dotyka kodu.

## 🔀 PANEL-MERGE — scalenie starych Exceli (2026-06-30)

> **Dyspozycja:** `dyspozycje/_handoff/MASTER-do-GRUPY_PANEL-MERGE.md` § Grupa A  
> **Tracker:** `docs/obieg/PANEL-MERGE-TRACKER.md` (wiersze A-M1…A-M3)

- [x] A-M1: `MIASTO/Ulepszenia-terenu.xlsx` → Panel-A (100% parametrów) ✅ 2026-06-30
- [x] A-M2: `Plony-terenow.xlsx` → arkusz `Plony-terenow` ✅ 2026-06-30
- [x] A-M3: koordynacja z B — usunięcie duplikatu FOOD (`Zywnosc-kanon`) ✅ 2026-06-30
- [x] Meldunek `GOTOWE-DO-ARCHIWUM` w trackerze ✅

## 📊 PANEL — UZUPEŁNIENIA (audyt 2026-06-28)

> **Decyzja Macieja (PANEL-AUDYT, 2026-06-28, ABC opcja A):** dorób panel do kompletu. Po uzupełnieniu: round-trip test (Excel→JSON→gra) + status PANEL-2 w `docs/obieg/REJESTR-DECYZJI.md`. Kolumny wg spec §2 (pełne nagłówki: „Zakres/dozwolone", „Wpływ na grę", „Plik źródłowy"). `_INFO` BEZ komend terminala dla Macieja (eksport przez komendę `eksportuj panel`). Pełny audyt: rejestr decyzji.

- [x] Plony bazowe terenów → arkusz **Plony-terenow** → `terrain-yields.json`
- [x] Koszty ruchu po terenie → **Ruch-po-terenie** → `terrain-movement.json`
- [x] Defaulty generatora: **Generator-rozmiary** → `map-gen-params.json` (kod czeka Integrator)
- [x] Reguły złóż rarity + min epoka → **Zloza-generator** → `map-gen-params.json`
- [x] FOOD-HODOWLA: bydło/owce/lama — klucze JSON **GOTOWE** (EKONOMIA P2); MAPA: regen Panel-A + eksport + kod M1–M7
- [x] Handoff: `MAPA-do-INTEGRATOR_map-gen-params.md`
- [x] Kolumny §2: pełne nagłówki (Zakres/dozwolone, Wpływ na grę, Plik źródłowy)
- [x] E2: źródło prawdy balansu generatora = Panel-A (kreator UI = Grupa E)

## 🎯 TERAZ — kolejność (aktualizacja 2026-07-02)

> **Obieg Macieja (2 kroki — osobno):** ① **`start`** → agent czyta ten plik + self-check (**bez** Slack/handoff) · ② później **`master`** → `→ MASTER: GOTOWE` + handoff + Slack (**Maciej nie wkleja** do hubu).

| Priorytet | Zadanie | Status |
|-----------|---------|--------|
| **P1** | Panel-A audyt PANEL-AUDYT | **✅ GOTOWE** |
| **P2** | FOOD-HODOWLA (M1–M7 + Panel-A hodowla) | **✅ GOTOWE** |
| **P3** | E2 generator (`worldDensity`) | **✅ GOTOWE** |
| **P4** | **A1-Q12** overlay + **MAPA-F2** toggle | **✅ w kanonie** `de9b53e…` |
| **P5** | **C3** oblężenie | **✅ lane** · Q7 layout ✅ |
| **P7** | **Panel-A sync** (JSON→Excel, gap audit) | **✅ GOTOWE** · 🟢 u Mastera 2026-07-02 |

### P7 — Panel-A sync ✅ (2026-07-02)

- Regen `Panel-A.xlsx` z aktualnego JSON (17 ulepszeń; bez plantacja/luksus)
- Naprawa `map-gen-params.json` + export dry-run 0
- Inwentaryzacja: `docs/obieg/A-PANEL-INWENTARYZACJA.md`
- **Maciej:** edycja Excel → **`eksportuj panel`**

### P4 — A1-Q12 + MAPA-F2 ✅ lane UI (2026-07-01)

- Decyzje: **A1-Q12a/b=A** · **MAPA-F2-Q1→MAPA** (zamknięte 2026-06-26)
- **Zrobione:** klik 🎭/⛪ na pasku [A] → overlay · dblclick ikon przy minimapie → overlay · klik = toggle zasięgu 3D (kanon F)
- Handoff: `dyspozycje/_handoff/A-do-INTEGRATOR_A1-Q12-minimap-dblclick.md`
- **Opcjonalnie F:** wzbogacić dane overlay (progi, presja) w `buildCultureOverlayData()`

### P3 — E2 generator ✅

- Handoff: `dyspozycje/_handoff/MASTER-do-MAPA_E2-gestosc-generator.md`
- Test: `gra/tools/world-density-test.cjs` — **28 pass, 0 fail**
- PLAYTEST mapa: Integrator F (`F-do-MASTER_E2-PLAYTEST-B2Q5-2026-06-30.md`)

### P5 — C3 oblężenie ✅ (lane + kanon 2026-06-30)

- Flow: `cityAttackChoice` → `siegeMapPanel` → preBattle/szturm · testy **map-siege 6/6 · oblezenie 27/27**
- **2026-07-01:** panel Q7=A — boczny overlay (prawa krawędź, mapa widoczna) zamiast pełnoekranowego
- Handoff kanon: `UI+UNITS+SILNIK-do-INTEGRATOR_C3-oblezenie-szturm-2026-06-30.md`
- OBL-S6 3D obozy: `MAPA-do-INTEGRATOR_oboz-3D-OBL-S6.md` (wpięcie F)

### Inne (niski priorytet)

- ✅ **A5-S1** sign-off bronzepreview v1.0 — Maciej **A** 2026-07-01
- ✅ **A5-S2** kamień = jeden styl wspólny — Maciej **A** 2026-07-01

## ❓ PYTANIA DO MACIEJA (otwarte ABC)
- 🔒 A4-D4: **audit MAP-P1-04 zamknięty**

## 🧾 DECYZJE MACIEJA (świeże — echo, przed wdrożeniem)
- **F-P1-01-Q1 (2026-07-02):** Maciej **A** — miasto **bez muru**, klik obok: brak obrońców → zdobycie + **komunikat** (bez ekranu przed bitwą); są obrońcy → ekran przed bitwą.
- **F-P1-01-Q2 (2026-07-02):** Maciej **A** — ruch **na hex** wrogiego miasta bez muru → **ten sam flow** co klik.
- **Wdrożenie:** spec + handoff F/C zaktualizowane · kod = **SILNIK/F** · **`przekaż do Mastera`** ✅
- **A-R7-IMP (2026-07-01):** Maciej **A** — wdrażaj zamkniętą decyzję **B** (łodzie tylko w terytorium miasta, wybrzeże + morze). Cytat: „A — Wdrażaj B teraz".
- **A5-S1 (2026-07-01):** Maciej **A** — akceptuj podgląd miast brązu v1.0 (10 cyw × poziomy 1–10 × mur/bez muru). Cytat: „A — Akceptuj v1.0".
- **A5-S2 (2026-07-01):** Maciej **A** — epoka kamienia: **jeden wspólny styl** dla wszystkich cywilizacji w v1.0. Cytat: „A — Jeden wspólny styl kamienia".
- **REMIND-START-A (2026-06-26):** złoże rezerwuje hex — gate w `improvement-build.ts` ✅ test 41/41 → **U INTEGRATORA** (`_handoff/MAPA-do-INTEGRATOR_REMIND-START-A.md`).
- **AB-KOLEJNOSC (2026-06-28)** — Panel przed FOOD (potwierdzone 2026-06-29).
- **E2-PARAMS (2026-06-28)** — generator gęstości (P3) **✅ GOTOWE lane** 2026-07-01.
- **C3-Q1…Q10 (2026-06-27)** — oblężenie **ZAMKNIĘTE** · `docs/decyzje/C3-obleczenie.md`.
- **B2-Q5** — hex 🔥 buntu render **✅ lane** · chip→kamera **✅ Integrator F**.

## ✅ GOTOWE → MASTER (2026-07-02) — **master sesja 4 (P7 Panel-A)**

**→ MASTER: GOTOWE** · P7 Panel-A sync ✅ · lane **IDLE** · A5 ✅ ZWERYFIKOWANA

Handoff: `dyspozycje/_handoff/A-do-MASTER_stan-lane-2026-07-02.md`  
Slack: `docs/obieg/SLACK-OUTBOX-A-2026-07-02.md` § ping sesja 4

---

## ✅ GOTOWE → MASTER (2026-07-02) — **start + master** (A5)

## ✅ GOTOWE → MASTER (2026-06-26) — **start + master** (archiwum)

**→ MASTER: GOTOWE** · obieg: ① start ② master

Handoff: `dyspozycje/_handoff/A-do-MASTER_stan-lane-2026-07-01.md`  
P0: A-R7 rebuild · Slack ping 2026-07-01 (sesja start+master)

---

## ✅ GOTOWE → MASTER (2026-07-01) — **A-R7 rebuild kanon (PILNE)**

**→ MASTER: GOTOWE** · Maciej: **a** (= przekaż) · kod ✅ · kanon ❌

Handoff: `dyspozycje/_handoff/A-do-INTEGRATOR_A-R7-rebuild-kanon-2026-07-01.md`  
Test lane: `map-improvement-qualify-test.cjs` **43/43**  
**Akcja Master:** dyspozycja F **P0 A-R7-REBUILD** (sam rebuild, bez ABC)

Slack: `docs/obieg/SLACK-OUTBOX-A-R7-2026-07-01.md`

---

## ✅ GOTOWE → MASTER (🟠 2026-07-01)

**→ MASTER: GOTOWE** — paczka P1–P4 + PANEL-MERGE  
Handoff: `dyspozycje/_handoff/A-do-MASTER_PACZKA-P1-P4-2026-07-01.md`  
Slack: `docs/obieg/SLACK-OUTBOX-A-2026-07-01.md` (outbox — MCP niedostępny w sesji)

## ✅ GOTOWE → INTEGRATOR
- **C3-Q7 layout** (2026-07-01) — `siegeMapPanel.ts` boczny panel (Q7=A) · batch z A1-Q12-UI  
  → `dyspozycje/_handoff/A-do-INTEGRATOR_A1-Q12-minimap-dblclick.md` (rozszerzyć o C3-Q7)
- **A1-Q12 + MAPA-F2** (2026-07-01) — overlay 🎭/⛪ · dblclick minimapa  
  → `dyspozycje/_handoff/A-do-INTEGRATOR_A1-Q12-minimap-dblclick.md` · warstwa 🟡
- **E1-Q-BUNDLE + F-CITY-HEX** (2026-06-29) — kod w src ✅ · ROBOCZA rebuild czeka  
  → `dyspozycje/_handoff/MASTER-do-INTEGRATOR_E1-F-CITY-HEX-batch.md`  
  Warstwa 🟡 · las parity 98/98 · sign-off Maciej (podgląd + czysty hex miasta)
- **MAP-P1-04** audit ulepszeń A4-D4 → `dyspozycje/_handoff/MAPA-do-INTEGRATOR_ulepszenia-audit-P1-04.md`
- **OBL-S6** obóz oblężniczy 3D → `dyspozycje/_handoff/MAPA-do-INTEGRATOR_oboz-3D-OBL-S6.md`
- **E-P0-04/05** złoża miedzi/żelaza per epoka → `dyspozycje/_handoff/MAPA-do-INTEGRATOR_zloza-epoki-E-P0.md`

## 📌 ZAMKNIĘTE (nie pytać ponownie)
- A1-Q5…Q12 (HUD 6B, pasek zasobów, układ) · A2-Q4 (jednostka na mapie) · A4-D4 (część zakwalifikowana)
- A1-Q12a/b=A · MAPA-F2-Q1 · C3-Q1…Q10 (decyzje 2026-06-27)
- A-START (bez osadnika, auto „Załóż miasto", kamera, rzeki w mgle, minimapa=fog) — w grze

---
🔗 Historia: `docs/archiwum/` · Kontrakty: `dyspozycje/_handoff/`
