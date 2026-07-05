# Raport Figma — Grupa B

**Strona Figmy:** str. 2 · sekcja B (legacy: 04 Screens B) · plik „The Game — Design System v1”  
**URL:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu  
**Status:** 🔒 **STOP layout** — inbox lane UI **przyjęty ✅** · **GOTOWE 00–02 ✅** (2026-07-01) · czeka **za Grupą E** (potem A wg **8A**) · **0/8** cloud  
**Decyzje stylu:** 1B · 2C · 3C · 4C · 5C · 6C · 7A · 8A → [`DECYZJE-WARSTWA1-MACIEJ.md`](../../DECYZJE-WARSTWA1-MACIEJ.md) · **zamknięte**  
**Meldunki (tylko Figma):** [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) § Reguła meldunków · append poniżej

---

## Kolejka frame’ów (baseline → redesign)

| Priorytet | Frame Figma | Baseline PNG | Rejestr | Uwagi layoutu |
|-----------|-------------|--------------|---------|---------------|
| 1 | B-01 Panel miasta pełny | `baseline/B/B-01_panel-miasta-pelny.png` | B-01 | Layout 3 kolumn zachować · ramka **5C** · Georgia tytuły **2C** |
| 2 | B-02 Pasek zasobów | `baseline/B/B-02_pasek-zasobow.png` | B-02 | Chipy **6C**: ikona + wartość + etykieta PL (Ludność, Rekruci, Żywność, Praca, Skarb, Nauka, Kultura, Religia, Porządek) |
| 3 | B-15 Budowa — lista | `baseline/B/B-15_budowa-lista.png` | B-15, B-16 | Split: dostępne + w mieście · przyciski **4C** Buduj/Ulepsz |
| 4 | B-17 Rekrut — lista | `baseline/B/B-17_rekrut-lista.png` | B-17 | Miniaturki jednostek · hover → B-30 |
| 5 | B-29 Dock budynek | `baseline/B/B-29_dock-budynek-hover.png` | B-29, B-30 | Dock lewy 280px · panel **5C** · typografia **2C** |
| 6 | B-30 Dock jednostka 3D | `baseline/B/B-30_dock-jednostka-3d.png` | B-30 | Canvas 3D w grze **bez zmian** — tylko ramka docka |
| 7 | B-33 Hub badań | `baseline/B/B-33_hub-nauki.png` | B-33 | Toolbar 🦉 · spójność z panelem (złoto + niebieski nauki) |
| 8 | B-34 Drzewko tech | `baseline/B/B-34_drzewko-tech.png` | B-34 | Dock obok huba · węzły SVG → komponenty line **3C** |

**Rail B-14 (9 ikon Tier 3)** — element layoutu w **B-01** + osobny komponent rail:

| Tab | ID spec | Ikona (3C) |
|-----|---------|------------|
| Budowa | `cp-buildings` | Partenon / kolumny |
| Rekrut | `cp-recruit` | Skrzyżowane miecze |
| Spichlerz | `cp-granary` | Kromka chleba |
| Handel | `cp-trade` | Sakiewka / moneta |
| Praca | `cp-labor` | **Młotek** |
| Porządek | `cp-order` | Waga |
| Zdrowie | `cp-health` | Kaduceusz |
| Kultura | `cp-culture` | Maski teatralne |
| Religia | `cp-religion` | Świątynia |

**Po 8 frame’ach obowiązkowych (faza 2):** zakładki Spichlerz/Handel/Praca/Porządek/Zdrowie/Kultura/Religia (B-18…B-25) · karty szczegółów B-03…B-10 (DoD: min. **Ludność + Praca**) · B-12 Produkcja.

**Referencja layoutu (nie kanon grafiki):** `Gra-podglad-OKOLICA-UX.html`  
**Playtest baseline:** `Gra-podglad-PLAYTEST-MIASTO.html` · nauka: `Gra-podglad-PLAYTEST-MAPA.html`

---

## Meldunki (append-only — dopisuj na dole)

**Reguła (OBOWIĄZKOWE):** każdy POSTĘP / STOP / GOTOWE → wpis `[YYYY-MM-DD]` tutaj (5–15 linii: co · frame’y **N/M** · blokery). Skrót dla lane UI → `dyspozycje/UI-DO-MASTERA.md`. Maciej czyta repo — w czacie: *„Zapisane w RAPORT-FIGMA.md § [data]”*. Pełna reguła: [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) § Reguła meldunków.

---

### [2026-06-26] — START

- **Co zrobione:**
  - Przyjęto dyspozycję redesignu Grupy B (panel miasta / ekonomia / nauka).
  - Baseline PRZED: **8 PNG** w `docs/ux/baseline/B/` ✅
  - Rejestr UX: sekcja Grupa B (**37 wpisów** B-01…B-37) ✅ — [`REJEST-UX-MASTER.md`](../../REJEST-UX-MASTER.md)
  - Spec ikon 3C Tier 3 (rail) + chipy 6C — [`FIGMA-SPEC-IKONY.md`](../../FIGMA-SPEC-IKONY.md) ✅
  - Kolejka 8 frame’ów + mapowanie rail — tabela powyżej
  - Folder eksportu: `docs/ux/figma/grupa-B/export/` ✅
- **Frame'y w Figmie:** _(brak — czeka na fundament)_
- **Baseline użyte:** gotowe do importu (B-01, B-02, B-15, B-17, B-29, B-30, B-33, B-34)
- **Komponenty z biblioteki:** wymagane ze stron **00 Tokens · 01 Components · 02 Icons** — **niedostępne**
- **Blokery / pytania do MASTER:**
  - 🔴 **BLOCKER:** `STATUS-FIGMA.md` — strony **00–02 = ⏳**, **brak URL** pliku Figmy. **Nie startujemy layoutu na 04 Screens B** do sygnału lane UI „GOTOWE 00–02”.
  - 🟡 **B-33/B-34:** baseline z playtestu mapy (hub + drzewko poza panelem miasta) — layout spójny wizualnie z B-01/B-02.
  - 🟡 **B-30:** miniatura 3D jednostki w docku — w redesignie **ramka + staty**, nie model Three.js.
- **Eksport PNG:** folder `export/` utworzony · eksport po frame’ach — **nie**

**Definition of Done — postęp:** 0/8 frame’ów cloud · 0/5 checklist DoD · **praca teraz:** weryfikacja spec rail + chipy (bez layoutu)

| DoD | Status |
|-----|--------|
| 8 frame’ów baseline pokrytych | ⬜ (po GOTOWE 00–02) |
| Ramka panelu = wariant 5C z 01 Components | ⬜ |
| Rail 9 ikon zgodny z FIGMA-SPEC Tier 3 | 🟡 **w trakcie weryfikacji spec** |
| Karty szczegółów — min. Ludność + Praca (B-03, B-07) | ⬜ (po odblokowaniu) |
| RAPORT-FIGMA.md: GOTOWE | ⬜ |

---

### [2026-06-26] — STOP layout · inbox przyjęty · praca: spec rail + chipy

- **Inbox lane UI (Grupa 0):** meldunek w `STATUS-FIGMA.md` § Inbox — **przyjęty ✅**
- **Plik kanon:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu · fileKey `COVbTJUV5dx8MzMxfWlYeu`
- **STOP layoutu:** **nie układać** 8 frame’ów (B-01…B-34) w cloud — czekamy sygnał **GOTOWE 00–02**
- **Co robimy teraz (tylko Figma, bez kodu):**
  - Weryfikacja **rail Tier 3** (9 ikon) vs [`FIGMA-SPEC-IKONY.md`](../../FIGMA-SPEC-IKONY.md)
  - **Krytyczne:** `res-work` / `cp-labor` = **młotek** (Praca + toolbar Budowa) · `cp-health` = **kaduceusz** (zdrowie)
  - **Chipy 6C:** ikona + wartość + **etykieta PL** (nie samo emoji)
- **Gotowe lokalnie:** baseline **8/8** → `docs/ux/baseline/B/` · rejestr **37** UX · export folder pusty
- **Po sygnale GOTOWE 00–02:** strona **2 · sekcja B** · baseline @ **35%** lock · 8 frame’ów + DoD min. **B-03 Ludność + B-07 Praca** + export PNG → `export/`
- **Decyzje stylu:** zamknięte u Macieja — bez pytań ABC

**Definition of Done — postęp:** 0/8 frame’ów cloud · 0/5 checklist DoD

---

### [2026-06-26] — REGUŁA meldunków (Maciej · obowiązkowa)

- **Potwierdzone:** POSTĘP / STOP / GOTOWE → append tutaj · skrót lane UI → `UI-DO-MASTERA.md` · Maciej czyta repo (nie czat).
- **Frame’y cloud:** **0/8** · **STOP layout** · blocker: GOTOWE 00–02.
- **Następny krok:** weryfikacja rail Tier 3 + chipy 6C (spec only).

---

### [2026-07-01] — STOP layout · blocker zaktualizowany (GOTOWE 00–02 ✅)

- **Inbox lane UI:** meldunek **[2026-06-26] STOP** — nadal **przyjęty ✅** (bez zmian merytorycznych)
- **GOTOWE 00–02:** sygnał lane UI **2026-07-01** ✅ — **nie** czekamy już na stronę 1 DS (min. pod E)
- **Nowy blocker layoutu:** **Grupa E** w pilocie **E-01** (priorytet Macieja · **8A**) · potem **A** → **dopiero B** na str. 2 · sekcja B
- **Teraz (bez cloud):** dokończyć weryfikację **rail Tier 3** (9 ikon) + **chipy 6C** vs [`FIGMA-SPEC-IKONY.md`](../../FIGMA-SPEC-IKONY.md) · baseline **8/8** ✅
- **Po sygnale startu B:** 8 frame’ów B-01…B-34 · DoD min. **B-03 Ludność + B-07 Praca** · export PNG → `export/`
- **Review Macieja:** jak E — **tylko PNG** w `export/` (bez Figmy) — patrz [`grupa-E/CHECKLIST-REVIEW-MACIEJ.md`](../grupa-E/CHECKLIST-REVIEW-MACIEJ.md) (wzorzec)

**Definition of Done — postęp:** **0/8** frame’ów cloud · **0/5** checklist DoD · rail spec 🟡 w trakcie

---

## Co zrobić po odblokowaniu

1. Otworzyć stronę **04 Screens B** w pliku Figmy.
2. Dla **każdego z 8 baseline** (tabela powyżej):
   - import PNG z `docs/ux/baseline/B/` → opacity **35%** → **lock** warstwy tła;
   - na wierzchu **tylko** instancje z **01 Components** i ikony z **02 Icons**;
   - nazwa frame = ID (np. `B-02 Pasek zasobów`).
3. **B-01:** zachować layout 3 kolumn (lewo produkcja · środek mapa · prawo zakładki + okolica).
4. **B-02:** każdy zasób = komponent **Chip 6C** z etykietą PL (nie samo emoji).
5. **Rail:** przyciski 40×40, ikony Tier 3, aktywna zakładka = złoty obrys **5C**.
6. **Przyciski akcji:** outline **4C** (Buduj, Wykup, Dalej…).
7. Eksport → `docs/ux/figma/grupa-B/export/`.
8. Wpis **GOTOWE** (append) + lista frame’ów.

---

*Szablon · kolejne wpisy: POSTĘP / GOTOWE*
