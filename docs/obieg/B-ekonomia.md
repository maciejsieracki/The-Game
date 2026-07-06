# 🅱️ GRUPA B — Miasto i ekonomia

> **Trigger Macieja:** `start` → czytaj ten plik · sekcja **🎯 TERAZ** · tylko Grupa B · nie pytaj „co robić?".
> Właściciel: panel miasta, produkcja, surowce, populacja, porządek/bunt, kultura/religia, Wealth, żywność, Power, **drzewko technologii + parametry nauki** (decyzja Macieja 2026-06-28).

## ⛔ OBOWIĄZ ścieżka kodu (2026-07-05 — Maciej **`ścieżka`**)

**📢 Broadcast:** [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](BROADCAST-NAZWY-PLIKOW-2026-07-05.md)  
**Kod TYLKO:** `gra/src/` (`game/`, `ui/cityPanel`…). **Publish (F):** `gra-robocza/Gra-ROBOCZA.html`.  
**ZAKAZ:** `gra-robocza/src/`, kanon, finalna, stary `Gra-podglad.html`. [`OBOWIAZ-SCIEZKA-KODU.md`](OBOWIAZ-SCIEZKA-KODU.md)

## 🚫 OBOWIĄZ playtest — **cisza w czacie** (2026-07-02)

**ZAKAZ** informować Macieja o playtestach (także zaległych). Po kanonie → dopisz [`REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md) **§2**. **Tylko Master** mówi Maciejowi o testach. [`KOMUNIKACJA-PLAYTEST-LANE.md`](KOMUNIKACJA-PLAYTEST-LANE.md) · trigger: **`obowiaż`** · **`rejestr`**

## 🎯 OBOWIĄZ zakres raportu (2026-07-02)

**Do Macieja tylko:** braki **ABC Grupy B** · wdrożenie **Twoich** decyzji · czy **`przekaż do Mastera`** zrobione. **ZAKAZ** raportu całej gry / innych grup / kolejki F. Trigger: **`zakres`** · [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)

## 🔴 PILNE — dyspozycja Master (2026-07-02)

> **Trigger:** `działaj` · [`dyspozycje/MASTER-PILNE-2026-07-02.md`](../../dyspozycje/MASTER-PILNE-2026-07-02.md) · kanon `de9b53e…`

| Pri | Temat | DoD |
|-----|--------|-----|
| **P1** | **B1-Q3** — drzewko **liniowe** (Maciej już wybrał **B**) | `economy.ts` / `tech.json` · testy lane |
| **P2** | Panel-B — arkusze **Budynki · Technologie · Surowce** | `export-b.py` · FOOD tylko z Panel-A |
| **P3** | Handoff | `EKONOMIA-do-MASTER_B1-Q3-panel-B-*.md` · **`przekaż do Mastera`** · Slack |

**Lane:** 🟠 **U MASTERA** (PILNE 2026-07-02 zamknięte w lane · handoff + testy)

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

1. **✅ ABC wdrożone** — `REJESTR-DECYZJI.md` (Grupa B) + dowód (plik/test/md5)
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

> **POTWIERDZENIE ZASAD: ISO v1 — stosuję (2026-06-29, lane B)**

> Cel: nie psuć gry innym. Maciej = zero terminala; sprawdza agent grupy. Pełny dok: `docs/obieg/WERSJE-TESTOWE.md`.

Twój agent, zanim napisze `→ INTEGRATOR: GOTOWE`:
1. `cd gra` → `.\tools\grupa-selftest.ps1 -Grupa B` (typecheck + testy B + build → `%TEMP%\civ-B`),
2. opcjonalny podgląd: skopiuj build do **`Gra-podglad-PLAYTEST-MIASTO.html`** (patrz § poniżej),
3. sprawdź swój ekran + sąsiednie (mapa/miasto/HUD),
4. handoff z **warstwą** (🟢/🟡/🔴) + **MD5 wersji** + **„co sprawdzić po wpięciu"**.

**Nie dotykaj:** `main.ts`, `Gra-podglad.html`, `Gra-podglad-ROBOCZA.html` — ROBOCZA publikuje tylko Integrator.

## 🎮 Pliki testowe — TYLKO PLAYTEST-MIASTO (2026-06-29)

> **Cel:** Grupa B nie nadpisuje kanonu ani ROBOCZA — unikamy „syfu”, gdy kilka czatów publikuje ten sam HTML.
>
> **Prototyp UX okolicy (Civ V, osobny):** `Gra-podglad-OKOLICA-UX.html` — `docs/grupa-b/OKOLICA-UX-MACIEJ.md`

| Plik | Grupa B | Uwagi |
|------|---------|--------|
| **`Gra-podglad-OKOLICA-UX.html`** | ✅ sandbox UX | Okolica na mapie 3D — overlay, bez mini-map · **nie** zastępuje PLAYTEST-MIASTO |
| **`Gra-podglad-PLAYTEST-MIASTO.html`** | ✅ **JEDYNY** docelowy podgląd B po buildzie | Miasto, ekonomia, okolica, produkcja — instrukcja: `docs/grupa-b/PLAYTEST-MIASTO-MACIEJ.md` |
| `%TEMP%\civ-B\` | ✅ build roboczy (lokalnie) | `npx vite build --outDir $env:TEMP\civ-B` — **nie commituj** |
| `Gra-podglad-ROBOCZA.html` | ⛔ **ZAKAZ** | Tylko **Integrator (F)** · playtest gry = **Master → Maciej** |
| `Gra-podglad.html` | ⛔ **ZAKAZ** | Kanon — tylko Master/Integrator po review |
| `UI/Gra-podglad-MIASTO.html` | ⛔ nie do testów kodu | Stary mock HTML, nie bundel silnika |

**Po zielonym self-checku** (opcjonalny podgląd wizualny lane B):

```powershell
cd gra
npx vite build --outDir $env:TEMP\civ-B
Copy-Item "$env:TEMP\civ-B\index.html" "..\Gra-podglad-PLAYTEST-MIASTO.html"
```

> **Uwaga (2026-06-29):** `PLAYTEST-MIASTO` to **ten sam bundel** co ROBOCZA/kanon — inna nazwa pliku wyzwala tryb `?playtest=miasto` (Testpolis). Jeśli naprawa jest tylko w ROBOCZA, skopiuj też:  
> `Copy-Item ..\Gra-podglad-ROBOCZA.html ..\Gra-podglad-PLAYTEST-MIASTO.html`  
> Integrator przy pełnej bramce robi to automatycznie (`tools/bramka-test-publish.ps1` kopiuje build do kanon + ROBOCZA + PLAYTEST-WALKA + **PLAYTEST-MIASTO**).

**Własność kodu B:** `gra/src/game/economy*.ts`, `okolica.ts`, `cities.ts`, `production.ts`, `wealth.ts`, `order.ts`, … + `gra/src/ui/cityPanel.ts`, `orderPanel.ts`, `sciencePicker.ts` + eksporty JSON. **`main.ts` = handoff do Integratora.**

## ✅ ZAMKNIĘTE — B5-SPICH Spichlerz + wzrost (2026-06-29)

> **Kanon:** `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` · **Status:** 🟡 ZAPISANA — kod **CZEKA** (Maciej: najpierw kolejne ustalenia, potem jeden batch B → Integrator).

Skrót: bufor wzrostu zawsze; bez Spichlerza zerowanie przy awansie + wojsko bez składania; ze Spichlerzem 50% bufora + zapasy państwa; rekrutacja nigdy blokowana.

## 📊 PANEL STEROWANIA — **WYKONANE** (2026-06-26)

> **AB-KOLEJNOSC:** Panel-B zamknięty · **FOOD-HODOWLA = następny krok (kod).**

- **Panel:** `panele-sterowania/Panel-B.xlsx` · **Eksport:** `export-b.py` · **Gen:** `gen-panel-b.py` · **Test:** `test-panel-b-roundtrip.py`
- **JSON:** `miasto-params.json`, `econ-params.json`, `society-params.json`, `terrain-improvements.json` (arkusz **Zywnosc-kanon**)
- **Dok:** `docs/grupa-b/PANEL-B-SPEC.md` · `docs/grupa-b/B-PANEL-INWENTARYZACJA.md`
- **Maciej:** edytuj **Wartość** → napisz **`eksportuj panel`** (bez terminala)

## 🔀 PANEL-MERGE — scalenie starych Exceli (2026-06-30)

> **Dyspozycja:** `dyspozycje/_handoff/MASTER-do-GRUPY_PANEL-MERGE.md` § Grupa B  
> **Tracker:** `docs/obieg/PANEL-MERGE-TRACKER.md` (wiersze B-M1…B-M7)

**Priorytet P0:** B-M7 — usuń `Zywnosc-kanon` + stop zapis do `terrain-improvements.json` w `export-b.py`.

- [ ] B-M7 P0: duplikat FOOD (master = Panel-A)
- [ ] B-M3: **NOWY** arkusz `Budynki` ← `MIASTO/Budynki.xlsx`
- [ ] B-M6: **NOWY** arkusz `Technologie` ← `Technologie-drzewko.xlsx`
- [ ] B-M5: **NOWY** arkusz `Surowce` ← `Surowce.xlsx`
- [ ] B-M1, B-M2, B-M4: pełny diff Ekonomia / Społeczeństwo / Panel-przeglad
- [ ] Meldunek `GOTOWE-DO-ARCHIWUM` per plik w trackerze

## 🔴 P0 — BLOKER PANELU (audyt zweryfikowany przez Master, 2026-06-28, decyzja PANEL-P0-FIX)
> **PILNE, zanim Maciej kliknie „eksportuj panel" w czacie B.** Arkusz `Zywnosc-kanon` w Panel-B **dubluje FOOD** i `export-b.py` pisze do `terrain-improvements.json` — pliku, którego **właścicielem jest Grupa A**. Ryzyko: nadpisanie kanonu jedzenia w grze starymi wartościami.
- [ ] Usuń arkusz `Zywnosc-kanon` z Panel-B **albo** zsynchronizuj 1:1 z Panel-A i oznacz READONLY (źródło prawdy FOOD = **Panel-A**).
- [ ] `export-b.py`: NIE zapisuje do `terrain-improvements.json` (usuń tę gałąź eksportu).
- [ ] `_INFO` Panel-B: usuń „python export-b.py" → instrukcja „napisz `eksportuj panel`" (Maciej zero terminala).
- Po naprawie: round-trip B bez dotykania FOOD + status PANEL-2-B w `REJESTR-DECYZJI.md`.

## 📊 PANEL — UZUPEŁNIENIA (audyt 2026-06-28)

> **Decyzja Macieja (PANEL-AUDYT, 2026-06-28, ABC opcja A):** dorób panel do kompletu. Po uzupełnieniu: round-trip test (Excel→JSON→gra) + status PANEL-2 w `docs/obieg/REJESTR-DECYZJI.md`. Kolumny wg spec §2 (pełne nagłówki: „Zakres/dozwolone", „Wpływ na grę", „Plik źródłowy"). `_INFO` BEZ komend terminala dla Macieja (eksport przez komendę `eksportuj panel`). Pełny audyt: rejestr decyzji.

- [ ] Drzewko technologii (`gra/data/tech.json`) — dodać arkusz LUB jawnie oznaczyć ścieżkę poza panelem
- [ ] Budynki (`gra/data/buildings.json`: koszty, `przyrost`, efekty) — wpiąć lub jawny link (`export-budynki.py`)
- [ ] FOOD-HODOWLA: bydło/owce/lama — klucze JSON
- [ ] Kolumny §2: ID UNIKALNE (`B-xxx`) zamiast numerów wierszy; pełne nagłówki kolumn
- [ ] `_INFO`: usunąć „python export-b.py" (Maciej zero terminala) → komenda `eksportuj panel`
- [ ] Duplikat FOOD z Panel-A — uzgodnić jedno źródło (koordynacja z Grupą A)

## 🎯 TERAZ
- ✅ **B2-D18** — balans start × trudność · formularz ABC 2026-07-02 · **→ MASTER GOTOWE** · handoff `EKONOMIA-do-MASTER_D18-BALANS-GOTOWE.md`
- ✅ **B5-SP-LIMIT** — cap 100×Spichlerze · overflow przepada · testy **16/16** + **9/9**
- ✅ **D16-D17-START** — Maciej **A+A** 2026-07-01 · lane **GOTOWE** · handoff `EKONOMIA-do-MASTER_D16-D17-START-GOTOWE.md`
- ✅ **Paczka ABC 1–11** — **ZAMKNIĘTA** 2026-06-27 · lane → Integrator GOTOWE
- ✅ **FOOD-HODOWLA P2** — lane done · `food-hodowla-test.cjs` **26/26**
- ✅ **PANEL-MERGE B-M1…B-M7** — **GOTOWE-DO-ARCHIWUM** 2026-06-30 · `export-b.py` bez FOOD
- ✅ **Okolica 4C** — profile + ręczna korekta w `okolica.ts` + `cityPanel.ts`
- ✅ **B5-Spichlerz** — lane **GOTOWE** · testy **9+10+26** · handoff `EKONOMIA-do-MASTER_B5-spichlerz-GOTOWE.md`
- ✅ **P-C2-DEF A** — moduł `power-objective.ts` · test **12/12** · wpięcie `main.ts` → Integrator F
- 🔒 **B1-tech-Q3** posterunek = **C wdrożone** — **nie pytaj**

## 🟠 U MASTERA (2026-07-01 · meldunek zbiorczy)

| Pole | Wartość |
|------|---------|
| **Status** | → MASTER: **GOTOWE** |
| **Paczka** | `dyspozycje/_handoff/EKONOMIA-do-MASTER_paczka-lane-B-2026-07-01.md` |
| **Batche** | D16-D17-START · B5-SP-LIMIT · B5-Spichlerz · P-C2-DEF (moduł) |
| **Testy (self-check)** | society **21/21** · wire **34/34** · wealth **28/28** · empire-food **16/16** · spichlerz **9/9** · power **12/12** · food-hodowla **26/26** |
| **Integrator F** | `MASTER-do-INTEGRATOR_D16-D17-wiring-2026-07-01.md` · `EKONOMIA-do-INTEGRATOR_p-c2-def-a.md` |
| **Slack outbox** | `docs/obieg/SLACK-OUTBOX-GRUPA-B-2026-07-01.md` wiad. 5 |
| **Maciej** | **nie wkleja** — pliki = prawda |

**Lane B:** **IDLE** — paczka D16–D18 w kanonie · playtest = **Master → Maciej** (OBOWIĄZ-PT)

## 🟠 U MASTERA (2026-07-02 · D18)

| Pole | Wartość |
|------|---------|
| **Batch** | D18-BALANS-TRUDNOSC |
| **Handoff** | `EKONOMIA-do-MASTER_D18-BALANS-GOTOWE.md` |
| **Integrator** | `EKONOMIA-do-INTEGRATOR_d18-main-wiring.md` |
| **Testy** | society **26/26** · wealth **28/28** · culture-religion **51/51** |

## 🧾 DECYZJE MACIEJA (świeże — echo, przed wdrożeniem)
- **P-C2-DEF (2026-07-01):** **A** — pkt Mocy z bitwy = **suma M_pole wroga przed walką**; **bez bonusu underdog**; remis = 0 → `docs/decyzje/P-C2-DEF-wygrana-bitwa-2026-07-01.md` · lane B ✅ · Integrator F 🟡
- **P-C2-B* / P-ARMIA-B (2026-06-26):** Moc — Armia=suma siły bojowej; pkt za bitwę ważone siłą pokonanego. **Gate:** testy kalibracji + osobne ABC **P-C2-DEF** (wygrana mniejsza/większa armia).
- **REMIND-START-A (2026-06-26):** złoże rezerwuje hex — brak ulepszenia gracza na złożu (handoff A+B).
- **JEDN-KOSZT-v1 (2026-06-29):** rekrutacja jednostek v1.0 = **Civ-style** (💰 + ludność + tech). `Surowiec` w JSON/Excel **zostaje jako dane referencyjne** — wdrożenie w silniku dopiero **v2.0**.
- **JEDN-KOSZT-roadmap (2026-06-29):** krok 2 = bramka **tech LUB dostęp do surowca**; krok 3 = koszty surowców + produkcja + magazyn. → `docs/decyzje/JEDN-KOSZT-roadmap-v1-v2.md`
- **AB-KOLEJNOSC (2026-06-28)** — **Panel-B ✅ 2026-06-26** → następny **FOOD-HODOWLA** (kod). Rejestr: `docs/obieg/REJESTR-DECYZJI.md`.
- **C-panel (2026-06-26):** C1=A drawer ~45% · C2=A mapa przyciemniona · C3=A zakładki u góry → **WDROŻONE** w `cityPanel.ts`
- **D-OKOLICA-OVERLAY (2026-06-26):** _„Zamiast dodatkowej mapy w mieście — nakładka na główną mapę: siatka pracowników i ulepszeń, mapa lekko przeszarzona jak Civ V. Nie ucinamy mapy, nie utrzymujemy dwóch map.”_ → **ZATWIERDZONE** · kontrakt: `dyspozycje/_handoff/EKONOMIA+UI-do-MAPA+SILNIK_okolica-overlay-2026-06-26.md`

## ✅ GOTOWE → INTEGRATOR
- **Panel-B (PANEL-EXEC)** — Excel + export + round-trip · warstwa **🟢 izolowana** (tylko JSON) · `docs/grupa-b/PANEL-B-SPEC.md`
- **OKOLICA-UX prototyp (2026-06-26)** — sandbox Civ V: mapa 3D pełnoekran + overlay (`cityOkolicaOverlay.ts`) + drawer bez mini-map · **osobny HTML** · md5: `6244808E89057B446DC1677219AE33B6` · handoff: `dyspozycje/_handoff/EKONOMIA+UI-do-MAPA+SILNIK_okolica-overlay-2026-06-26.md` · warstwa 🟡 (wpięcie później)
- **F-CITY-HEX** — `city-hex-clear.ts` + `cities.ts` (`centerWorkedTile`) · wpięcie w main = Integrator  
  Batch: `dyspozycje/_handoff/MASTER-do-INTEGRATOR_E1-F-CITY-HEX-batch.md` · warstwa 🟡
- **C-panel drawer (2026-06-26)** — `cityPanel.ts`: drawer 45% prawo, backdrop 55% dim + blokada klików mapy · **bez `main.ts`** · warstwa 🟢 · PLAYTEST-MIASTO md5: `611613F49B8FDB92A550CAE887606DB3`
- **Okolica auto→ręczny (Integrator 2026-06-29)** — klik wolne pole z auto = 👤 na klikniętym heksie (bez pełnej puli auto). ROBOCZA md5 `F8C116C41C23DA21E8C039F5DBA9242B` · playtest Macieja: Ctrl+F5, pop=1
- **EKO-P2-01** — tick B5 `advanceEmpireFood` + WIRE 5 · test `empire-food-b5-test.cjs` **9/9** · handoff: `dyspozycje/_handoff/EKONOMIA-do-SILNIK_B5-empire-food.md`
- **F-B-TECH-SYNC-29** — B1 tech + koszt miasta · handoff: `dyspozycje/_handoff/EKONOMIA+MAPA-do-SILNIK_B1-tech-sync-2026-06-29.md`
- **F-B-OKOLICA-TOGGLE** — panel miasta: klik toggle 👤 + bilans plonów (`okolica.ts`, `turn-economy.ts`, `cityPanel.ts`) · **bez `main.ts`** · podgląd: `Gra-podglad-PLAYTEST-MIASTO.html` (Integrator → ROBOCZA)

## 📌 ZAMKNIĘTE (nie pytać ponownie)
- **B5** hybryda żywności (Q1/Q2 2026-06-26/27) · **B1-tech** ABC (2026-06-29)
- B2-Q1…Q6 · B3 · B4 · panel miasta, bunt, plony ×15, kultura+religia, wyrąb+tartak, Power

---
🔗 Historia: `docs/archiwum/` · Kontrakty: `dyspozycje/_handoff/`
