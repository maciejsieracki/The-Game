# Raport Figma — Grupa A

**Strona Figmy:** 03 Screens A · plik „The Game — Design System v1”  
**Plik kanon:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu  
**Status:** 🔒 **STOP layout** — meldunek w inboxie lane UI **przyjęty ✅** · czeka **GOTOWE 00–02**  
**Decyzje stylu:** 1B · 2C · 3C · 4C · 5C · 6C · 7A · 8A → [`DECYZJE-WARSTWA1-MACIEJ.md`](../../DECYZJE-WARSTWA1-MACIEJ.md) · **zamknięte — bez pytań do Macieja**  
**Meldunki (tylko Figma):** [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) § Reguła meldunków · append poniżej

---

## Kolejka frame’ów (baseline → redesign)

| Priorytet | Frame Figma | Baseline PNG | Rejestr |
|-----------|-------------|--------------|---------|
| 1 | A-01 HUD | `baseline/A/A-01_hud-gora.png` | A-01 |
| 2 | A-02 Toolbar | `baseline/A/A-02_toolbar.png` | A-02 |
| 3 | A-03 Dolny pasek | `baseline/A/A-03_dolny-pasek.png` | A-03 |
| 4 | A-04 Side panel | `baseline/A/A-04_panel-wydarzen.png` | A-04 |
| 5 | A-06 Panel jednostki | `baseline/A/A-06_panel-jednostki.png` | A-06 |
| 6 | A-08 Tryb budowy | `baseline/A/A-08_tryb-budowy.png` | A-08 |
| 7 | A-11 Lista dyplo | `baseline/A/A-11_lista-dyplomacji.png` | A-11 |
| 8 | A-16 Pre-bitwa | `baseline/A/A-16_pre-bitwa.png` | A-16 |

**Po baseline (faza 2):** A-05 minimapa · A-07 stos · A-09–A-10 listy · A-13 Wpływ · A-26 chipy dyplo · pozostałe z rejestru (30 wpisów).

---

## Co robimy teraz (bez layoutu w cloud)

| Reguła | Akcja |
|--------|--------|
| **STOP layout** | **Nic nie budujemy** na stronie A w pliku Figmy — reguła globalna do sygnału **GOTOWE 00–02**. |
| **Opcjonalnie** | Weryfikacja baseline **A-06** (`.civ-army-stack`, nie mockup A2-Q4) i **A-16** (mockup HTML → ewent. podmiana z live przed layoutem). |
| **Przygotowanie** | Kolejność startu po odblokowaniu: **A-01 HUD** → A-02 → A-03 → A-04 → A-06 → A-08 → A-11 → A-16 (8 frame’ów). |
| **Po GOTOWE 00–02** | Baseline PNG ~35% lock + instancje z biblioteki DS (Panel 5C · Chip 6C · Btn 4C · ikony 3C). |
| **Wdrożenie w grze (8A)** | **Drugi batch** — po Grupie E. |

---

## Meldunki (append-only — dopisuj na dole)

**Reguła (OBOWIĄZKOWE):** każdy POSTĘP / STOP / GOTOWE → wpis `[YYYY-MM-DD]` tutaj (5–15 linii: co · frame’y **N/M** · blokery). Skrót dla lane UI → `dyspozycje/UI-DO-MASTERA.md`. Maciej czyta repo — w czacie: *„Zapisane w RAPORT-FIGMA.md § [data]”*. Pełna reguła: [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) § Reguła meldunków.

### [2026-07-01] — START

- **Co zrobione:**
  - Przyjęto dyspozycję redesignu Grupy A (HUD mapy).
  - Baseline PRZED: 8 PNG w `docs/ux/baseline/A/` ✅
  - Rejestr UX: sekcja Grupa A (30 wpisów) ✅ — [`REJEST-UX-MASTER.md`](../../REJEST-UX-MASTER.md)
  - Spec ikon 3C: [`FIGMA-SPEC-IKONY.md`](../../FIGMA-SPEC-IKONY.md) — przeczytane (chipy 6C: ikona + wartość + etykieta PL)
  - Kolejka 8 frame’ów baseline — tabela powyżej
- **Frame'y w Figmie:** _(brak — czeka na fundament)_
- **Baseline użyte:** gotowe do importu (A-01, A-02, A-03, A-04, A-06, A-08, A-11, A-16)
- **Komponenty z biblioteki:** wymagane ze stron 00 Tokens · 01 Components · 02 Icons — **niedostępne**
- **Blokery / pytania do MASTER:**
  - 🟡 **MCP Figma podłączone** (whoami: Maciej Sieracki ✅) — serwer `plugin-figma-figma`.
  - 🔴 **BLOCKER do layoutu:** sygnał lane UI **GOTOWE 00–02** (URL kanon jest w `STATUS-FIGMA.md`).
  - 🟡 **A-16 baseline:** PNG z mockupu HTML (nie live pre-bitwa) — przy layoutcie można poprawić ręcznym zrzutem z gry.
  - 🟡 **A-06 baseline:** w grze = panel stosu `.civ-army-stack` (nie mockup A2-Q4) — redesign dotyczy tego stanu.
- **Eksport PNG:** folder `export/` utworzony · eksport po frame’ach — nie

**Definition of Done — postęp:** 0/8 frame’ów · 0/6 checklist DoD

---

### [2026-07-01] — Meldunek → lane UI (Grupa 0)

- **Gdzie:** [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) § **Inbox** — wpis **OD GRUPY A → lane UI**
- **Skrót dla lane UI:** MCP ✅ (`plugin-figma-figma`) · URL kanon ✅ · **czeka sygnał GOTOWE 00–02** (nie brak pluginu ani URL)
- **UI-DO-MASTERA:** skrót dopisany ✅

---

### [2026-07-01] — Dyspozycja lane UI · meldunek przyjęty

- **Od:** lane UI (Grupa 0) / MASTER — potwierdzenie inboxu
- **Przyjęto:** meldunek Grupy A w `STATUS-FIGMA.md` § Inbox ✅
- **Stan:** 🔒 **STOP layout** frame’ów w cloud — czekamy **GOTOWE 00–02**
- **Plik:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu
- **Teraz:** brak pracy w Figmie · opcjonalna weryfikacja baseline A-06 / A-16
- **Start layoutu:** od **A-01 HUD** (8 frame’ów w tabeli powyżej)
- **Decyzje stylu:** zamknięte — **bez nowych pytań do Macieja**
- **Definition of Done — postęp:** 0/8 frame’ów · 0/6 checklist DoD · **gotowość do startu** ✅

---

### [2026-07-01] — Protokół meldunków (Warstwa 1 / Figma) · przyjęty

- **Zakres:** wyłącznie makiet Figmy w pliku DS v1 — **nie** zastępuje innych raportów (`UNITS-DO-MASTERA`, Integrator, playtest itd.).
- **Obowiązek:** każdy POSTĘP / STOP / GOTOWE → append tutaj (sekcja Meldunki, 5–15 linii: co zrobione · frame’y X/Y · blokery).
- **Lane UI:** skrót w `dyspozycje/UI-DO-MASTERA.md` (wpis OD GRUPY A) gdy istotne dla fundamentu DS.
- **Maciej:** czyta pliki w repo — **bez** przeklejania z czatu.
- **Czat:** jedna linia *„Zapisane w RAPORT-FIGMA.md § [data]”*.
- **Stan:** 🔒 STOP layout · **0/8** frame’ów · blocker: **GOTOWE 00–02** (lane UI).

---

### [2026-07-01] — POSTĘP · weryfikacja baseline (bez Figmy)

- **Co zrobione:** ponowny przebieg `gra/tools/baseline-screenshots-a.cjs` → **8/8** PNG w `docs/ux/baseline/A/` (PLAYTEST-MAPA).
- **A-06:** ✅ **live silnik** — panel stosu `.civ-army-stack` (bez fallbacku mockup A2-Q4).
- **A-16:** ⚠️ nadal **mockup HTML** (`UI/Makieta-preBattle.html`) — headless nie otwiera pre-bitwy na canvas; podmiana ręczna przed layoutem lub przy A-16.
- **Frame’y Figma:** **0/8** — bez zmian (STOP layout).
- **Blocker:** **GOTOWE 00–02** od lane UI — bez zmian.

---

## Co zrobić po odblokowaniu (lane UI → „GOTOWE 00–02” + URL w STATUS-FIGMA)

1. Otworzyć stronę **03 Screens A** w pliku Figmy (link z `STATUS-FIGMA.md`).
2. Dla **każdego z 8 baseline** (tabela powyżej):
   - import PNG z `docs/ux/baseline/A/` → opacity **~35%** → **lock** warstwy tła;
   - na wierzchu **tylko** instancje z **01 Components** i ikony z **02 Icons**;
   - nazwa frame = ID (np. `A-01 HUD`).
3. Chipy HUD wg **6C:** `[ikona 24px] [wartość] [etykieta PL]` (Żywność, Praca, Skarbiec…).
4. Eksport opcjonalny → `docs/ux/figma/grupa-A/export/`.
5. Wpis **GOTOWE** w tym pliku (append) + lista frame’ów.

### Uwagi do layoutu (przy pracy)

| Frame | Uwaga |
|-------|--------|
| **A-16** Pre-bitwa | Baseline PNG pochodzi z **mockupu HTML** — przy layoutcie **warto podmienić** zrzutem z live gry (`Gra-podglad.html` → atak sąsiada). |
| **A-06** Panel jednostki | Baseline = **panel stosu armii** `.civ-army-stack` (stan silnika), **nie** mockup A2-Q4 — redesign dotyczy tego stanu. |

---

*Szablon · kolejne wpisy: POSTĘP / GOTOWE*
