# 🅲 GRUPA C — Walka

> **Obieg 2026-06-30:** Maciej **`działaj`** · **`przekaż do Mastera`** · `.cursor/rules/decyzje-echo.mdc`
> **ZAKAZ:** nie pokazuj Maciejowi „Wklej w czacie MASTER" — meldunek **tylko w plikach** (`_handoff/` + `C-*-DO-MASTERA.md`). Master czyta repo sam.
> Agent czyta ten plik po onboardingu lub gdy Master wpisze `start`.

## ⛔ OBOWIĄZ ścieżka kodu (2026-07-05 — Maciej **`ścieżka`**)

**📢 Broadcast:** [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](BROADCAST-NAZWY-PLIKOW-2026-07-05.md)  
**Kod TYLKO:** `gra/src/` (`battle/`, `combat.ts`, `siege.ts`…). **Publish (F):** `gra-robocza/Gra-ROBOCZA.html`.  
**ZAKAZ:** `gra-robocza/src/`, kanon, finalna, stary `Gra-podglad.html`. [`OBOWIAZ-SCIEZKA-KODU.md`](OBOWIAZ-SCIEZKA-KODU.md)

## 🚫 OBOWIĄZ playtest — **cisza w czacie** (2026-07-02)

**ZAKAZ** informować Macieja o playtestach (także zaległych). Po kanonie → dopisz [`REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md) **§2**. **Tylko Master** mówi Maciejowi o testach. [`KOMUNIKACJA-PLAYTEST-LANE.md`](KOMUNIKACJA-PLAYTEST-LANE.md) · trigger: **`obowiaż`** · **`rejestr`**

## 🎯 OBOWIĄZ zakres raportu (2026-07-02)

**Do Macieja tylko:** braki **ABC Grupy C** · wdrożenie **Twoich** decyzji · czy **`przekaż do Mastera`** zrobione. **ZAKAZ** raportu całej gry / innych grup / kolejki F. Trigger: **`zakres`** · [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)

## 🔴 PILNE — dyspozycja Master (2026-07-02)

> **Trigger:** `działaj` · [`dyspozycje/MASTER-PILNE-2026-07-02.md`](../../dyspozycje/MASTER-PILNE-2026-07-02.md)

| Pri | Temat | DoD |
|-----|--------|-----|
| **P1** | **F-P1-01** — atak wrogiego miasta z mapy | ✅ **→ INTEGRATOR: GOTOWE** · handoff `C-do-INTEGRATOR_map-attack-F-P1-01-2026-07-02.md` |
| **P2a** | **Panel-C sesja 1 — macierz jednostek** (C-BAL-Q1) | ✅ **eksport 2026-07-05** · robocza `5206766b…` |
| **P3** | **Jednostki Faza 1+2** (Maciej 2026-07-03) | handoff **`MASTER-do-GRUPA-C_jednostki-faza2-roster6-2026-07-03.md`** · trigger **`działaj`** |

**Panel-C JSON:** ✅ w kanonie `de9b53e…` · **P1 → F** (wpięcie `main.ts`)

### 🎯 TERAZ — jednostki roster (2026-07-05)

**Status:** 🟢 **KOMPLET w kanonie** — `units.json` **75** · md5 kanon `0b8a9a7…`  
**Meldunek:** `GRUPA-C-do-MASTER_jednostki-roster6-20260704.md` + batch 3 (`roster6-batch3-patch.cjs`)

| Batch | Zakres | Stan |
|-------|--------|------|
| **0** | Wojownik germański → Brąz + SUPER | ✅ |
| **1** | Asyria · Słowianie | ✅ |
| **2** | Harappa, Hetyci, Babilonia, Fenicjanie | ✅ |
| **3** | Oryginalne 7 + Miecznik galijski | ✅ |

**POLE-BITWY:** v4.1 w kanonie (`253c91bc…`) · deploy · Strategia 1E · grupowanie

**Kolejka lane C (kod):** **pusta** · P2b Auto-walka = następna sesja balansu (opcjonalnie)

---

### 🎯 TERAZ — archiwum (2026-07-04)

**Status:** ✅ Batch Celtowie + roster-6 wdrożony — zamknięte w kanonie 2026-07-05

**Handoff (archiwum):** `dyspozycje/_handoff/MASTER-do-GRUPA-C_jednostki-faza2-roster6-2026-07-03.md`

---

## ⌨️ HASŁO MACIEJA: `raport2`

Gdy Maciej wpisze **`raport2`** (alias **`raport 2`**) — odpowiedz **natychmiast** w 3 sekcjach ([`RAPORT2-INSTRUKCJA.md`](RAPORT2-INSTRUKCJA.md) · reguła: `.cursor/rules/komendy-raport.mdc`):

1. **✅ ABC wdrożone** — `REJESTR-DECYZJI.md` (Grupa C) + dowód (plik/test/md5)
2. **🔜 Nie wdrożone / w toku** — status + co blokuje
3. **📤 Przekazane Masterowi** — handoff + `→ MASTER: GOTOWE` + Slack · brakuje → **dopisz sam**

Końcówka: `Gotowe u Mastera: TAK/NIE · brakuje: …` · **ZAKAZ:** „wklej do Mastera".

## 📨 JAK PYTASZ MACIEJA

> **JEDYNY wzór — stary tekst „O co chodzi i dlaczego" WYCOFANY.**  
> Przed **każdą** paczką ABC **czytaj i stosuj wyłącznie:**
> [`_ABC-JAK-PYTASZ.md`](_ABC-JAK-PYTASZ.md) · [`ABC-FORMAT-KANON-MACIEJ.md`](../decyzje/ABC-FORMAT-KANON-MACIEJ.md) · [`SZABLON-PYTANIA-ABC.md`](../decyzje/SZABLON-PYTANIA-ABC.md) · `.cursor/rules/abc-pelna-forma.mdc`
>
> Maciej: **`format`** / **`ABC`** → przepisz natychmiast w pełnej formie.  
> **Po ABC:** `.cursor/rules/decyzje-echo.mdc` (ECHO → AskQuestion „wdrażaj?" → AKCJA)

## 🛡️ ZASADY ZMIAN (izolacja — żeby nie psuć innym)

> Nowe (ISO-1…4, 2026-06-28). Pełna reguła: `.cursor/rules/zmiany-izolacja.mdc` · Mapa połączeń: `docs/obieg/MAPA-POLACZEN.md`.

- **Buduj własny podgląd przed oddaniem:** `npx vite build --outDir $env:TEMP\civ-<grupa>` → sprawdź swój ekran I sąsiednie (mapa/miasto/HUD).
- **Sklasyfikuj warstwę w handoffie:** 🟢 izolowana (własny moduł) · 🟡 cross/wspólny stan/render/save · 🔴 duża/przebudowa.
- 🟢 → Integrator scala batchem (szybko). 🟡 → tylko przez Integratora (sprawdzi mapę połączeń + bramka wizualna). 🔴 → najpierw kontrakt z Masterem + osobna gałąź.
- **Nigdy** nie ruszaj `main.ts` ani plików innych grup. Dotykasz `render/*` lub wspólnego stanu (`playerState`) = minimum 🟡.

## 📦 SELF-CHECK PRZED HANDOFFEM (ISO-5 + SIMP-1)

> **POTWIERDZENIE ZASAD: ISO v1 — stosuję (2026-06-29)****

> Cel: nie psuć gry innym. Maciej = zero terminala; sprawdza agent grupy. Pełny dok: `docs/obieg/WERSJE-TESTOWE.md`.

Twój agent, zanim Maciej powie **`przekaż do Mastera`**:
1. `typecheck` (czy kod się kompiluje),
2. testy Twojego obszaru (zielone),
3. handoff z **warstwą** (🟢 izolowana / 🟡 cross / 🔴 duża) + **„co sprawdzić po wpięciu"**.

Pełnego buildu całej gry **nie robisz** — to rola Integratora (ma wszystkie klocki i sprawdza wygląd).


## 📊 PANEL STEROWANIA — **KOMPLET** (2026-06-29, audyt opcja A)

- **Panel:** `panele-sterowania/Panel-C.xlsx` (10 arkuszy, **50** jednostek, 50 bojowych)
- **Eksport:** `export-c.py` · **Gen:** `gen-panel-c.py` · **Round-trip:** `test-panel-c-roundtrip.py`
- **JSON:** `combat-params.json` (+ `siege_ai`) · `units.json` · `counters.json` · `terrain-combat.json`
- **Kod:** `combat.ts`, `siege.ts`, `siegeAi.ts` czytają z JSON

## 🔀 PANEL-MERGE — scalenie starych Exceli (2026-06-30)

> **Dyspozycja:** `dyspozycje/_handoff/MASTER-do-GRUPY_PANEL-MERGE.md` § Grupa C  
> **Tracker:** `docs/obieg/PANEL-MERGE-TRACKER.md` (wiersze C-M1, C-M2)

- [x] C-M2: `Macierz-walki.xlsx` → zastąpione Panel-C (pre-merge)
- [x] C-M1: audyt `Jednostki.xlsx` vs Panel-C (Widok pola, pełna lista jednostek) — tracker ✅ 2026-06-30
- [x] Meldunek `GOTOWE-DO-ARCHIWUM` dla C-M1

## 🎯 TERAZ

**Status:** 🔄 **P2 Panel-C balans** · kolejność Macieja **A → B → C** (C-BAL-Q1 ✅)

| Pri | Temat | Stan |
|-----|--------|------|
| **P2a** | **Sesja 1 — macierz jednostek** (Panel-C) | 🔄 **TERAZ** · edycja Excel → **`eksportuj panel C`** |
| **P2b** | Sesja 2 — Auto-walka na mapie | ⏸ po meldunku P2a |
| **P2c** | Sesja 3 — oblężenie | ⏸ na końcu |
| **P1** | F-P1-01 | ✅ w kanonie |

- **Handoff F:** `C-do-INTEGRATOR_map-attack-F-P1-01-2026-07-02.md`
- **Testy:** map-field-battle **15/15** · map-attack-city **8/8**
- **Grupa C:** koniec · **nie** `main.ts`
- **C2v2 / playtest:** ⏸ po kanonie

**U Mastera:** dyspozycja F batch · oblężenie 3v3 (osobny handoff)

## 🎯 TERAZ (archiwum — playtest oblężenie)

**Status:** 🟠 **→ MASTER: GOTOWE** · playtest oblężenie 3v3 (2026-06-26)

- **Handoff:** `dyspozycje/_handoff/C-do-MASTER_oblezenie-playtest-2026-06-26.md`
- **Decyzja Macieja:** M×W+ pierścień = **B** — fan-out −1 heks (skorygować stary zapis „zostają” w v2b)
- **Fixy:** OBL-CAP-01 · preset 3 Hastati · preBattle 1 pasek szans · bonusy bojowe only · pierścień fan-out
- **Warstwa:** 🟡 cross (`post-battle-map.ts`, `preBattle.ts`, `playtestOdskok3v3.ts`, `civ-bonuses.ts`) · **NIE** `main.ts`
- **Testy:** `post-battle-map-test.cjs` **10/10** · `civ-bonusy-test.cjs` **33/33**
- **Playtest:** `Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html` · md5 `A416D5ECACA0DBF2E2B157FD0D8093C5`
- **Uwaga:** delta **po** zamkniętym P0 `C-ODSKOK-FANOUT` (kanon `ED4C8E2B…`) — Master: **nowy batch F**, nie powtarzać P0
- **Slack outbox:** `docs/obieg/SLACK-OUTBOX-C-2026-06-26.md` · **✅ WYSŁANE** (#master + #grupa-c)
- **Maciej:** **nie playtestujesz tutaj** — playtest = **Master → Maciej** po kanonie (OBOWIĄZ-PT)

**Wcześniej (zamknięte u Mastera):** P0 odskok fan-out · kanon `ED4C8E2B…` · handoff `C-do-MASTER_odskok-fanout-2026-07-01.md`

## ❓ PYTANIA DO MACIEJA (otwarte ABC)
- (brak — **C-BAL-Q1** ✅ zamknięte 2026-06-26)

## 🧾 DECYZJE MACIEJA (świeże — echo, przed wdrożeniem)
- **C2-FLOW (2026-07-03):** **Najpierw rozstawianie (deploy)** → **Start** → dopiero wtedy walka **RĘCZNIE** (AUTO opcjonalnie). ATK pierwszy / DEF wróg pierwszy. Reguły walki **nie obowiązują** w deploy. Spec: `docs/decyzje/C2-FLOW-manual-start-tura.md` · **⏸ wdrożenie** (C2v2 / UNITS).
- **C-BAL-Q1 (2026-06-26):** Kolejność balansu Panel-C: **najpierw A** (macierz jednostek), **potem B** (Auto-walka), **na końcu C** (oblężenie). Cytat: „a później B, a na końcu C". → `docs/decyzje/C-BAL-Q1-panel-c-kolejnosc.md` · handoff `MASTER-do-GRUPA-C_panel-c-balans-kolejnosc.md`
- **C2v2-ODŁÓŻ (2026-06-26):** Poprawki UX bitwy 3D (zaznaczanie, atak) — **nie teraz**; **playtesty bitwy dopiero po kanonie**; kolejność jak **C2v2-Q2=B** (balance-check / Panel-C → potem C2-UX v2). Paczka pytań C2v2-Q1…Q3 **zapisana, nieaktywna** — wracamy po kanonie.
- **M×W+ pierścień (2026-06-26):** **B** — po wygranej ATK na mieście wojska obrońcy w pierścieniu **fan-out −1 heks** (jak pole); tylko garnizon na centrum = 100% wipe. Kanon: `docs/AUTO-WALKA-MOC-ALGORYTM.md` §13a/§14.
- **C2-UX-defer (2026-06-29):** „W samej bitwie będą poprawki — zaznaczanie, atakowanie nie do końca intuicyjne — **nie teraz**, później.” → **potwierdzone 2026-06-26:** po **kanonie**; playtest bitwy 3D wtedy; C2v2-Q2=B.
- **Balance-check (2026-06-29):** „Na pewno trzeba będzie zrobić **balance check w bitwach**” — po ROBOCZA + playtest; parametry w Panel-C.
- **JEDN-KOSZT-v1 (2026-06-29):** v1.0 rekrutacja jednostek = **styl Civ** (tylko 💰 ze skarbca + ludność + tech). Pola `Surowiec` w `units.json` / Panel-C = **informacja na v2.0**, **nie** egzekwować w silniku.
- **JEDN-KOSZT-roadmap (2026-06-29):** **Krok 2 (v2.0)** — cywilizacja musi mieć **dostęp do tech LUB surowca**, żeby produkować jednostkę (bramka, bez pełnego odejmowania zapasów). **Krok 3 (v2.0)** — pełne koszty surowców (jednostki + budynki), produkcja surowców, magazynowanie. Pełna spec: `docs/decyzje/JEDN-KOSZT-roadmap-v1-v2.md`.

## ✅ GOTOWE → MASTER

- **F-P1-01 launchFieldBattleFromMap (2026-07-02)** — **→ INTEGRATOR: GOTOWE** · 🟡 cross · handoff `C-do-INTEGRATOR_map-attack-F-P1-01-2026-07-02.md` · `map-field-battle-test` **15/15** · `map-attack-city-test` **8/8** · **NIE** `main.ts`
- **Playtest oblężenie 3v3 (2026-06-26)** — **→ MASTER: GOTOWE** · 🟠 U MASTERA · handoff `C-do-MASTER_oblezenie-playtest-2026-06-26.md` · post-battle **10/10** · civ-bonusy **33/33** · PLAYTEST-OBL md5 `A416D5EC…`
- **Fix odskoku fan-out (2026-07-01)** — **ZAMKNIĘTE P0** · kanon `ED4C8E2B…` · handoff `C-do-MASTER_odskok-fanout-2026-07-01.md`
- **AUTO-WALKA v2b (2026-06-26)** — **→ MASTER: GOTOWE** · handoff `C-do-MASTER_auto-walka-v2b.md`
- **Panel-C komplet** — **🟢 w kanonie** md5 `de9b53e…` (KANON-BATCH-3)
- **C4 balans macierzy** — **WPIĘTE** · ROBOCZA md5 `0adf96de…` · Opus przed kanonem

## 📌 ZAMKNIĘTE (nie pytać ponownie)
- **C2v2** (UX v2 — zaznaczanie/atak po kanonie) — **ODŁOŻONE** · nie pytaj do promocji kanonu · archiwum pytań: rozmowa 2026-06-26 (C2v2-Q1…Q3)
- **C4-Q1=A** (2026-06-29) — macierz v2.0 = kanon statów Brąz/Żelazo
- C1-Q1…Q5 (wejście w walkę) · C2-Q2…Q7 (UX bitwy 3D) · C3 (oblężenie z mapy)
- W grze: preBattle C1, bitwa 3D C2, oblężenie C3 z mapy, AI auto-oblężenie, powrót z bitwy
- **Auto-walka M v2b** (2026-06-26) — werdykt M + wspólny ruch mapy auto/ręczna · Panel-C Auto-walka

## ⏳ ZALEŻNE OD GRUPY A
- ~~F-P1-01: atak wrogiego miasta klikiem z mapy~~ → **C DONE** · czeka **F** (main.ts)

---
🔗 Historia: `docs/archiwum/` · Kontrakty: `dyspozycje/_handoff/`
