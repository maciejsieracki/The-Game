# 🅴 GRUPA E — Start gry i menu

> **Trigger Macieja:** `start` → czytaj ten plik · sekcja **🎯 TERAZ** · tylko Grupa E · nie pytaj „co robić?".
> Właściciel: menu główne, kreator nowej gry, pierwsze 60 sekund gracza, wejście na mapę.

## ⛔ OBOWIĄZ ścieżka kodu (2026-07-05 — Maciej **`ścieżka`**) — **PILNE dla E**

**📢 Broadcast:** [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](BROADCAST-NAZWY-PLIKOW-2026-07-05.md)  
**Kod TYLKO:** `gra/src/ui/` (menu, shell). **Publish (F):** `gra-robocza/Gra-ROBOCZA.html`.  
**ZAKAZ:** `gra-robocza/src/`, kanon, finalna, stary `Gra-podglad.html`.  
Modale 2026-07-04 były w złym folderze — **weryfikuj diff vs `gra/src/ui/`**.  
[`OBOWIAZ-SCIEZKA-KODU.md`](OBOWIAZ-SCIEZKA-KODU.md)

## 🚫 OBOWIĄZ playtest — **cisza w czacie** (2026-07-02)

**ZAKAZ** informować Macieja o playtestach (także zaległych). Po kanonie → dopisz [`REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md) **§2**. **Tylko Master** mówi Maciejowi o testach. [`KOMUNIKACJA-PLAYTEST-LANE.md`](KOMUNIKACJA-PLAYTEST-LANE.md) · trigger: **`obowiaż`** · **`rejestr`**

## 🎯 OBOWIĄZ zakres raportu (2026-07-02)

**Do Macieja tylko:** braki **ABC Grupy E** · wdrożenie **Twoich** decyzji · czy **`przekaż do Mastera`** zrobione. **ZAKAZ** raportu całej gry / innych grup / kolejki F. Trigger: **`zakres`** · [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)

## 🔴 PILNE — dyspozycja Master (2026-07-02)

> **Trigger:** `działaj` · [`dyspozycje/MASTER-PILNE-2026-07-02.md`](../../dyspozycje/MASTER-PILNE-2026-07-02.md)

| Pri | Temat | DoD |
|-----|--------|-----|
| **P1** | **E2 kreator** — miasta-państwa · `buildParams()` pełne | ✅ lane **GOTOWE** · handoff zaktualizowany |
| **P2** | **E-P0-06** — pełny ekran zwycięstwa (z **D**) | ✅ UI lane · ROBOCZA `351d8ad6…` |
| **P3** | **`przekaż do Mastera`** + Slack | ✅ meldunek UI-DO-MASTERA |

**Lane:** 🟢 **E2 KREATOR ZAMKNIĘTY (kod)** · promocja kanon = Master

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

1. **✅ ABC wdrożone** — `REJESTR-DECYZJI.md` (Grupa E) + dowód (plik/test/md5)
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


## 📊 PANEL STEROWANIA — ✅ GOTOWY (2026-06-29)
> **Plik:** `panele-sterowania/Panel-E.xlsx` · **Eksport:** `export-e.py` · **Spec:** `docs/grupa-e/PANEL-E-SPEC.md`  
> **Decyzja PANEL-E-FOOD:** nie koliduje z FOOD-HODOWLA.  
> **Maciej:** edytuj Wartość → w czacie: **eksportuj panel**.  
> **JSON:** `ui-params.json` + `e-start-params.json` · wpięcie TS = handoff Integrator.

## 🔀 PANEL-MERGE — scalenie starych Exceli (2026-06-30)

> **Dyspozycja:** `dyspozycje/_handoff/MASTER-do-GRUPY_PANEL-MERGE.md` § Grupa E  
> **Tracker:** `docs/obieg/PANEL-MERGE-TRACKER.md` (wiersz E-M1)

- [ ] E-M1: checklist `UI/UI-parametry.xlsx` vs arkusze `Nowa-gra`, `Menu`
- [ ] `_INFO`: rozróżnienie Generator-E2 (E) vs Panel-A (mapa)
- [ ] Meldunek `GOTOWE-DO-ARCHIWUM`

## 📊 PANEL — UZUPEŁNIENIA (audyt 2026-06-28)

> **Decyzja Macieja (PANEL-AUDYT, 2026-06-28, ABC opcja A):** dorób panel do kompletu. Po uzupełnieniu: round-trip test (Excel→JSON→gra) + status PANEL-2 w `docs/obieg/REJESTR-DECYZJI.md`. Kolumny wg spec §2 (pełne nagłówki: „Zakres/dozwolone", „Wpływ na grę", „Plik źródłowy"). `_INFO` BEZ komend terminala dla Macieja (eksport przez komendę `eksportuj panel`). Pełny audyt: rejestr decyzji.

- [ ] Wpięcie silnika (round-trip): `victory.ts`, `tech-tempo.ts`, `newGameMapDefaults.ts` wciąż czytają z kodu, nie z JSON → handoff do Integratora
- [ ] Scalić generator E2 z Panel-A (JEDNO źródło — koordynacja z Grupą A)
- [ ] Dodać do Excela: `render_quality_bundled`, `seed_mode_default`
- [ ] Trudność/skala AI rywali — uzgodnić, gdzie ma żyć (Panel-D vs Panel-E), bez dublowania

## 🎯 TERAZ
- ✅ **E2 KREATOR — ZAMKNIĘTY (2026-06-26 Master `start`)** — miasta-państwa + typy cyw. na kroku 4 · gęstość w zaawansowanych · `buildParams()` → `generujSwiat` w `main.ts`. Handoff: `UI-do-INTEGRATOR_E2-kreator-gestosc.md` (**GOTOWE**).
- 🔄 **Master:** promocja kanon ROBOCZA `351d8ad6…` (E2 w bundlu) — bez Twojej akcji.
- 🔄 E-P0-06: ekran zwycięstwa — w ROBOCZA, czeka review Master.

## ❓ PYTANIA DO MACIEJA (otwarte ABC)
- ✅ **E2 gęstość świata — ZAMKNIĘTE decyzją Macieja (E2-PARAMS, 28.06)** — parametry generatora ustalone; brak otwartych.
- (brak otwartych E1) — **E1 paczka ABC 1–12 ZAMKNIĘTA (27.06)**

## 🧾 DECYZJE MACIEJA (świeże — echo, przed wdrożeniem)
- **UI-SPRINT-1 (2026-06-26):** **STOP** zmian UX/brand book w kodzie — wstrzymanie sprintu.
- **E2-PARAMS (2026-06-28)** — Maciej: w kreatorze „miasta-państwa zamiast jakości mapy"; `buildParams()` → pełne `NewGameParams` (typy cywilizacji + suwaki gęstości). Jakość mapy E1 przenieść. Status 🟡 ZAPISANA. Rejestr: `docs/obieg/REJESTR-DECYZJI.md`.

## ✅ GOTOWE → INTEGRATOR
- ✅ **E2 kreator** — miasta-państwa · typy cyw. · gęstość · `buildParams()` → `_handoff/UI-do-INTEGRATOR_E2-kreator-gestosc.md` · **→ INTEGRATOR: GOTOWE** (2026-06-26)
- **E1-Q-BUNDLE** — kreator **Jakość mapy** (Niska/Średnia/Wysoka) → `newGameFlow.ts` + `ui-params.json`  
  Batch wspólny: `dyspozycje/_handoff/MASTER-do-INTEGRATOR_E1-F-CITY-HEX-batch.md` · warstwa 🟡
- ✅ E-P0-01…03 menu S0 (5=C, 6=A, 7=A) → `_handoff/GRUPA-E-do-UI_menu-S0-5C.md` · `gra/src/ui/mainMenu.ts` · sync `UI/Gra-podglad-MENU.html`

## 📌 ZAMKNIĘTE (nie pytać ponownie)
- W grze: kreator nowej gry (5 kroków), defaulty E1 (Rzym/Kamień/Normal/Standard/typ świata ×4/skala rywali), E1-UX-02 nawigacja kroków

---
🔗 Historia: `docs/archiwum/` · Kontrakty: `dyspozycje/_handoff/`
