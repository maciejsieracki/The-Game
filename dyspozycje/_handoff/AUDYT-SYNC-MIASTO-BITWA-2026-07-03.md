# Audyt sync · miasto vs bitwa · 2026-07-03

**Decyzja Macieja:** kod miasta w grze = **źródło prawdy** · Designer **dostosowuje mockup**, nie odwrotnie · bitwa dalej w `gra/` z Masterem.

---

## 1. Miasto — **identyczne wszędzie** ✅

Pliki UI miasta: **`gra/` = `gra-kanon/` = `gra-robocza/`** (ten sam MD5, modyfikacja 2026-07-03 ~21:33)

| Plik | MD5 (skrót) | Zawiera m.in. |
|------|-------------|---------------|
| `src/ui/cityPanel.ts` | `0eaf8f71…` | `#cs-mapbtn`, `#civ-v-map-close`, `#cs-okolica-center`, 7 zakładek W4 |
| `src/ui/cityUxFrame.ts` | `cac8a14e…` | chrome mapy widoczny, winieta, layout 2 rail |
| `src/render/rangeOverlay.ts` | `1ad417bf…` | overlay zasięgu pól |
| ikony surowców `res-*.svg` | zgodne | Bydło, Glina, Koń, Sól |

**Playtest miasta:** `gra-kanon/START.html` · bundle md5 **`153fcda2f71e1e9ab3a538d8b9c10f9e`**

**Wniosek:** po playteście F ROBOCZA **nie było** nowszych zmian miasta w tym czacie ani u Ciebie osobno — **nic nie trzeba portować z lane**. Problem był tylko w **mockupach Design** (stary brief W3-1E).

---

## 2. Bitwa — **`gra/` nowsze** (celowo)

| Plik | Kanon | gra | Kto |
|------|-------|-----|-----|
| `src/battle/battleScene.ts` | 22:04 | **22:28** | Ty + Master · praca trwa |
| `src/ui/preBattle.ts` | = kanon | = kanon | bez rozjazdu |

**Kanon bitwa = starszy** do czasu promocji po Twoim OK.

---

## 3. Inne rozjazdy `gra/` vs kanon (nie miasto)

| Plik | gra nowsze | Temat |
|------|------------|-------|
| `src/main.ts` | 22:17 vs 17:42 | integracja (Master/F) |
| `src/map/generator.ts` | 22:23 | MAPA |
| `src/map/gen-helpers.ts` | 22:22 | MAPA |
| `src/ui/newGameFlow.ts` | 22:17 | kreator |
| `data/ui-params.json` | 22:16 | parametry UI (nie cityPanel.ts) |
| `data/e-start-params.json` | 22:16 | start gry |
| `data/map-gen-params.json` | 22:16 | generator |

**Nie dotyczy miasta** · nie kopiować kanon → gra dla tych plików.

---

## 4. Co robi Designer (po START)

1. Otworzyć **`gra-kanon/START.html`** → miasto → zrobić mockup **W3 v3** = **to co widać w grze**
2. Czytać delta: `_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md` §2
3. **NIE** wracać do 9 rail / okolica tylko w panelu / brak Mapa-Esc
4. W4 v2 zakładki — tylko jako referencja polish; pełny ekran = **W3 v3**

**Hasło unfreeze Design:** `START — W3-miasto-v3-delta`

---

## 5. Co robi lane UI

| Temat | Status |
|-------|--------|
| Port chrome miasta | **NIE TRZEBA** — już w kanonie |
| Tor A polish | **ANULOWANY** — kod = baseline |
| Design W3 v3 | czeka START Design |
| Bitwa C-06 | osobny tor · nie mieszać |

---

## 6. Pre-bitwa C-01 (2026-07-03)

| | |
|---|---|
| **Kod** | `preBattle.ts` — **identyczny** gra = kanon = robocza · już v3 TW |
| **Design teraz** | **C-04** modal Atak na miasto (`cityAttackChoice.ts`) — **stary UI emoji** · brief C04-C05 |
| **Design sync** | **C-01** pre-bitwa TW — **inny ekran** · po wyborze Szturm · kod już v3 |
| **Design później** | C-06 deployment · C-07+ pole bitwy (**HOLD**) |

---

## 7. Prosty model (żeby się nie gubić)

```
gra/          = warsztat (bitwa NOWSZA · pre-bitwa OK · miasto OK)
gra-robocza/  = kopia kanonu do testów lane
gra-kanon/    = playtest miasto + pre-bitwa · starsza bitwa deployment
Design        = miasto W3 v3 · C-01 sync · C-06 HOLD
```

**Promocja kanonu** = tylko gdy skończysz bitwę + OK playtest + Opus.
