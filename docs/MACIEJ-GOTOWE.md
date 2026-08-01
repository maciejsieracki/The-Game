- **2026-08-01 13:44** — ✅ FALA 132 ROBOCZA `a2b17df5` (granice stała opacity 70% bez gradientu + DEPLOY ALL). START: `gra-robocza/START.html` (Ctrl+F5).

- **2026-08-01 13:35** — ✅ FALA 131 ROBOCZA `2cb47461` (postęp UI 10 etapów + zbiegi rzek + granice państw + DEPLOY ALL). START: `gra-robocza/START.html` (Ctrl+F5, **Nowa gra**). Perf Pangea jeszcze nie weszła.

- **2026-08-01 12:52** — ✅ FALA 130 ROBOCZA `85767de4` (rzeki od oceanu + sep 3 + bez relief + bez pętli + DEPLOY ALL). START: `gra-robocza/START.html` (Ctrl+F5, **Nowa gra**).

- **2026-08-01 11:19** — ✅ FALA 129 ROBOCZA `2806b932` (siatka rzek 5×5 + stride 1 + inland + DEPLOY ALL). START: `gra-robocza/START.html` (Ctrl+F5, **Nowa gra**).

- **2026-08-01 10:16** — ✅ FALA 128 ROBOCZA `58755ecf` (poluzowane reguły rzek + DEPLOY ALL). START: `gra-robocza/START.html` (Ctrl+F5, **Nowa gra**).

- **2026-08-01 09:56** — ✅ FALA 127 ROBOCZA `490884f4` (rzeki 10×10 + dyplo NAP/pokój/portret + Glinianka + DEPLOY ALL). START: `gra-robocza/START.html` (Ctrl+F5, **Nowa gra**).

- **2026-08-01 00:06** — ✅ FALA 126 ROBOCZA `f37ec466` (3 etapy rzek + inland + LOD3 + DEPLOY ALL). START: `gra-robocza/START.html` (Ctrl+F5, **Nowa gra**).

- **2026-07-31 23:08** — ✅ FALA 125 ROBOCZA `31210b68` (sojusze + wybrzeże + rzeki + DEPLOY ALL). START: `gra-robocza/START.html` (Ctrl+F5, **Nowa gra** dla mapy).

- **2026-07-31 22:04** — ✅ FALA 124 ROBOCZA `10a2e30d` (dyplo + 1A–7A + fortify miasto + DEPLOY ALL). START: `gra-robocza/START.html` (Ctrl+F5).

- **2026-07-30 11:25** — ✅ FALA 123 ROBOCZA `fb78916f` (armie/dyplo/irygacja/HP/rout + DEPLOY ALL). START: `gra-robocza/START.html`.

- **2026-07-30 08:15** — ✅ FALA 121 ROBOCZA `2930dfa4` (deploy dokończony po OOM Cursor). START: `gra-robocza/START.html`.

## [01:32] ✅ Gotowe — deploy ROBOCZA FALA 120 (874bb48a)

- **2026-07-30 09:11** — ✅ FALA 122 ROBOCZA `9f09757e` (AI-CS-CLUSTER-DIFF + DEPLOY ALL). START: `gra-robocza/START.html`.

**FALA 120** | md5 `874bb48a31c730459d600d89f90e5227` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**Mapa — auto-zajęcie pustego miasta wroga:**
- Rozdzielenie armii (split) lub marsz na heks pustego miasta wroga → miasto zajęte (jak klik `capture_empty`).
- Cywile (zwiadowca/osadnik/robotnik) nadal nie zdobywają.
- Ścieżki: split, koniec animacji marszu, ucięcie marszu na koniec tury.

**Bramki:** tsc 0 · siege-defenders-test 12/12 · VERIFY OK.

## [01:25] ✅ Gotowe — deploy ROBOCZA FALA 119 (ff57aaa5)

- **2026-07-30 09:11** — ✅ FALA 122 ROBOCZA `9f09757e` (AI-CS-CLUSTER-DIFF + DEPLOY ALL). START: `gra-robocza/START.html`.

**FALA 119** | md5 `ff57aaa588b1e7bfe58f569d852c64ea` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**Bitwa — oszczepnik w rosterze deploy:**
- Filtry Konnica / Piechota / Łucznictwo i liczniki typów: oszczepnik trafia do **Łucznictwo** (dystans), zgodnie z `units.json`.
- Wcześniej był klasyfikowany jako piechota — znikał z filtra łuczników i podwajał piechotę.

**Bramki:** tsc 0 · battle-roster-test 7/7 · VERIFY OK.

## [01:12] ✅ Gotowe — deploy ROBOCZA FALA 118 (242adb0d)

- **2026-07-30 09:11** — ✅ FALA 122 ROBOCZA `9f09757e` (AI-CS-CLUSTER-DIFF + DEPLOY ALL). START: `gra-robocza/START.html`.

**FALA 118** | md5 `242adb0def2dae3ab870bd2117064420` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**Dyplomacja — NAP (pokój) przy koszyku:**
- UI pokazywał bilans 0 (NAP 200 PW na obu stronach + 10¤), ale silnik wymagał ≥200 PW **tylko w koszyku** → AI odrzucało mimo „sprawiedliwej" oferty.
- Naprawione: `treatyPnGate` + wyświetlanie accepted — werdykt zgodny z tym, co widzisz na stole.

**Bramki:** tsc 0 · diplomacy-proposal 65/65 · diplomacy-acceptance-points 143/143 · diplomacy-negotiation-table 48/48 · VERIFY OK.

## [00:39] ✅ Gotowe — deploy ROBOCZA FALA 117 (ed968c14)

- **2026-07-30 09:11** — ✅ FALA 122 ROBOCZA `9f09757e` (AI-CS-CLUSTER-DIFF + DEPLOY ALL). START: `gra-robocza/START.html`.

**FALA 117** | md5 `ed968c14fe4983603931f3fe9c683920` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**Mapa — markery złóż na górach:**
- Miedź/żelazo/węgiel/złoto na Wzgórzach/Górach stoją przy podnóżu (pierścień 0.80), nie w środku stromizny kopca.
- Wysokość z `reliefSurfaceSampler` — cały obrys markera opiera się o relief bryły.

**Bramki:** tsc 0 · VERIFY OK.

## [12:45] ✅ Gotowe — deploy ROBOCZA FALA 116 (7df8cf1d)

- **2026-07-30 09:11** — ✅ FALA 122 ROBOCZA `9f09757e` (AI-CS-CLUSTER-DIFF + DEPLOY ALL). START: `gra-robocza/START.html`.

**FALA 116** | md5 `7df8cf1d0e11b5f9a520f08540ad4dfa` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**R-KOPALNIA-UNIWERSALNA-Q1=B — osobne kopalnie:**
- Usunięto uniwersalną **Kopalnia** (`kopalnia`).
- Nowa **Kopalnia żelaza** (`kopalnia_zelaza`): epoka 3, tech **Hutnictwo żelaza**, `ruda_zelaza` 2/t, tylko `zloze=zelazo`.
- **Kopalnia miedzi** obsługuje też legacy nakładkę ZlozeRudy.
- Stare save: `kopalnia` → migracja przy load (`kopalnia_zelaza` / `kopalnia_miedzi`).

**Bramki:** tsc 0 · map-improvement-qualify 96/96 · deposit-building-gate 45/45 · zelazo-gate 24/24 · VERIFY OK.

## [01:05] ✅ Gotowe — deploy ROBOCZA FALA 115 (75fa29d7)

- **2026-07-30 09:11** — ✅ FALA 122 ROBOCZA `9f09757e` (AI-CS-CLUSTER-DIFF + DEPLOY ALL). START: `gra-robocza/START.html`.

**FALA 115** | md5 `75fa29d71ccd7d0ff42080175bd299b4` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**Mapa — złoża/kopalnie na górach:**
- Markery złóż i kopalnie na Wzgórzach/Górach siedzą na reliefie przy ściance heksa (nie „w powietrzu").
- Wspólna funkcja `elevatedTerrainEdgeSurfaceY` — topY pryzmu zamiast TERRAIN_SURFACE_Y / apex kopca przy sektorze krawędzi.

**Poza mapą:** drobna korekta żerdzi palisady Biskupin (skarpa).

**Bramki:** tsc 0 · population-growth-v85 47/47 · population-growth-v85-bonus 20/20 · map-improvement-qualify 94/94 · VERIFY OK · POLE-BITWY `dd399c4b`.

## [00:30] ✅ Gotowe — deploy ROBOCZA FALA 114 (c7f15cb3)

- **2026-07-30 09:11** — ✅ FALA 122 ROBOCZA `9f09757e` (AI-CS-CLUSTER-DIFF + DEPLOY ALL). START: `gra-robocza/START.html`.

**FALA 114** | md5 `c7f15cb3f47c60dba04ec98c689daaee` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**Wyżywienie (panel miasta → Wyżywienie i wzrost):**
- Suwak **Wyżywienie** 0–6 co 0,5 — koszt żywności na mieszkańca = wartość suwaka.
- Tabela wzrostu: od −10% (0) do +7% (6); domyślnie 4 (≈ dawna racja środkowa).
- Stare zapisy: racje 1|2|3 migrują do 2|4|6 przy pierwszym wczytaniu.

**Poza Wyżywieniem:** palisada styl Biskupin w renderze miasta (epoka Kamień).

**Bramki:** tsc 0 · population-growth-v85 47/47 · population-growth-v85-bonus 20/20 · VERIFY OK · POLE-BITWY `dd399c4b`.

## [00:05] ✅ Gotowe — deploy ROBOCZA FALA 113 (9ae07906)

- **2026-07-30 09:11** — ✅ FALA 122 ROBOCZA `9f09757e` (AI-CS-CLUSTER-DIFF + DEPLOY ALL). START: `gra-robocza/START.html`.

**FALA 113** | md5 `9ae07906dc7215050b3cde635d50a5ee` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**DEPLOY ALL sesji (dyplo + HUD + mapa + palisada):**
- Duplikat umów na stole dyplo · koszyk handlu UX · AI oferta zero + trim cykliczny · cooldown 3t po odrzuceniu (no-nag).
- Zoom −/100%/+ i pełny ekran pod minimapą · tooltipy HUD ×2 · skarbiec bilans (kwoty zamiast „—").
- Palisada epoka Kamień (Obróbka drewna) + chip +100% Obrony · rzeki `ensureRiverOutlets`.
- tsc 0 · dip-ai-offer 23/23 · reject-cooldown 14/14 · negot 48/48 · skarbiec 11/11 · koszty 128/128 · POLE-BITWY `dd399c4b`.
- map-gen dopływy: TIMEOUT w teście (>10 min) — do weryfikacji wizualnej rzek.
- Bez ikony palisady z preview (nie w brand).

## [23:13] ✅ Gotowe — deploy ROBOCZA FALA 112 (8d5813ea)

- **2026-07-30 09:11** — ✅ FALA 122 ROBOCZA `9f09757e` (AI-CS-CLUSTER-DIFF + DEPLOY ALL). START: `gra-robocza/START.html`.

**FALA 112** | md5 `8d5813ea025a603d23e04cc923c65b94` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**DEPLOY ALL sesji (dyplo + UI + mapa):**
- Koszyk dyplo od razu na stół (handel/szlaki) · PW nazwy + fix NAP/traktaty PW · AI oferta: Easy vs Normal/Hard (zero/tolerancja).
- Tooltip HUD/toolbar ×2 · mapa: 👤 + granice + ⛏ domyślnie ON · surowce widoczne · glina nie chowa overlay.
- tsc 0 · dip-accept 142/142 · dip-ai-offer 18/18 · hex-plony 9/9 · qualify 94/94 · dip-treaties 12/12 · POLE-BITWY `dd399c4b`.
- Rzeki dopływy: nie w bundlu (bez zmian kodu rzek).
