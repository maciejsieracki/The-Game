# ODPOWIEDŹ Design → UI/MASTER · Panel Moc imperium (IMP-01)

**Data:** 2026-07-06  
**Od:** Lane UI (odpowiedź na pytania Design · mockup `Panel Moc imperium v1 2026-07-05`)  
**Status:** **KANON GRY** — nie zgadywać · 6 filarów Design = **błędny model**

**Powiązane:** `gra/data/power-params.json` · `gra/src/game/power-objective.ts` · `gra/src/ui/empireDetailPanel.ts` · `dyspozycje/_handoff/MASTER-do-UI_panel-moc-i-imperium.md` · decyzja **D16 = opcja A**

---

## 1. Skąd wchodzi panel?

| Trigger | Zachowanie docelowe (D16=A) |
|---------|------------------------------|
| **Klik środek górnego paska** — medalion cywilizacji + liczba **Moc** | Otwiera **ten sam panel** · scroll do sekcji **Moc** |
| **Klik chipów lewego paska:** Skarbiec · Praca · Nauka · Kultura · Ludność · Rekruci | **Ten sam panel** slide-in · scroll do sekcji zasobu |
| **Klik liczby rekrutów** pod medalionem Mocy (lewa strona centrum) | Panel · sekcja Rekruci |
| **Skrót klawiaturowy** | **Brak** w v1.0 |
| **Pełny modal centrum** | **NIE** — to legacy `powerOverlayHud.ts` · **wycofujemy** po mockupie |

**Forma UI (MUST):**
- **Slide-in z prawej**
- Szerokość w kodzie: **`min(420px, 94vw)`** — **nie 460px** (Design może doprecyzować 420–440px, ale jeden panel)
- Zamknięcie: **✕** w nagłówku + Esc (jak dziś slide-in)
- **Nie** przycisk „Zamknij" na środku ekranu

**Kod:** `gra/src/ui/hud.ts` → `handleHudBarAction('power' | 'skarbiec' | …)` → `onOpenEmpireDetail(section)` → `empireDetailPanel.ts`

---

## 2. Ile „filarów"? — **NIE 6. Jest 9 składników Mocy (tabela).**

Design założył: *Wojsko · Gospodarka · Nauka · Kultura · Religia · Populacja* — **to nie istnieje w silniku.**

### Kanon P-A — dokładna lista (9 wierszy tabeli)

| # | Etykieta UI (PL) | Klucz `power-objective.ts` | Współczynnik | Skąd liczba w grze |
|---|------------------|----------------------------|--------------|---------------------|
| 1 | **Armia** | `armia` | **×25** | Suma **M_pole** jednostek bojowych imperium (`unit-power.ts`) · oblężnicze w polu = 0 |
| 2 | **Wygrane bitwy** | `bitwy` | **×1** | Model **P-C2-DEF A:** suma M_pole pokonanego wroga **przed walką** (nie „liczba wygranych ×25") |
| 3 | **Ludki** | `ludki` | **×5** | Suma **slotów populacji (ludki)** we wszystkich miastach — **nie** ludność absolutna |
| 4 | **Rekruci (ekw. jedn.)** | `rekruci` | **×5** | `floor(rekruci_bieżący / koszt_werbu[epoka])` |
| 5 | **Miasta** | `miasta` | **×50** | Liczba miast imperium |
| 6 | **Terytorium (heksy)** | `terytorium` | **×0.5** | Heks w zasięgu terytorium miast |
| 7 | **Infrastruktura (budynki)** | `infra` | **×5** | Każdy wybudowany budynek we wszystkich miastach |
| 8 | **Odkrycia / tech** | `tech` | **×20** | Liczba zbadanych technologii imperium |
| 9 | **Ulepszenia terenu** | `ulepszenia` | **×5** | Farmy, drogi, hodowle… w terytorium |

**Źródło prawdy JSON:** `gra/data/power-params.json` → sekcja `skladniki`

### Jedna liczba „Moc" na HUD

```
Moc = round(suma wszystkich: ilość × współczynnik)
```

- **Bez** mnożnika epoki (P-B odrzucone)
- **Bez** normalizacji 0–100 (stary „Wpływ" wycofany)
- Na HUD środek: ta sama liczba co **Moc {N}** w panelu

### Co z „Gospodarką / Religią"?

To **osobne sekcje tego samego slide-in**, **nie** składniki sumy Mocy:

| Sekcja panelu | Trigger HUD | Zawartość |
|---------------|-------------|-----------|
| **Moc imperium** | Klik Moc | Tabela 9 wierszy + ranking + Respekt |
| **Zasoby imperium** | Chipy Skarbiec/Praca/Nauka… | Stan + /t · **tabela per miasto** |
| **Kultura imperium** | Chip Kultura | Suma · progi · tabela miast |
| **Parametry globalne** | (góra panelu) | Epoka · tura · religia państwowa · bonus startowy |

**Religia** — chip na HUD może otwierać overlay religii (`getReligionOverlay`) — **poza** sekcją Moc · w mockupie IMP-01 **nie** łącz z 9 składnikami.

---

## 3. Ranking rywali — **TAK**

| Pole | Wartość |
|------|---------|
| **Czy pokazujemy?** | **TAK** — pod tabelą 9 składników |
| **Skąd dane** | Wszystkie cywilizacje na mapie · Moc każdej = `computeObjectivePower` · **grupowanie po cywilizacji** (nie po ownerId/mieście) |
| **Sortowanie** | Malejąco po `power` |
| **Gracz** | Wiersz z **▸** + wyróżnienie (`.you`) |
| **Format wiersza** | `#rank NazwaCywilizacji — Moc {N}` |

**Kod:** `main.ts` → `buildPowerRankingByCiv()`

**Respekt (osobna linia, nie ranking):**
- Przykład wobec **pierwszego znanego kontaktu dyplomatycznego**
- Wzór: `round(100 × powerSelf / (powerSelf + powerPartner))`
- Copy: „Respekt wobec {AI}: {X}% (Twoja moc A vs B)"

---

## 4. Trend (▲/▼) — **NIE w v1.0**

| Pytanie Design | Odpowiedź |
|----------------|-----------|
| Porównanie do poprzedniej tury? | **Brak w silniku i UI** |
| N tur wstecz? | **Brak** |

**Prośba do Design:** **nie rysuj** ▲/▼ przy składnikach Mocy w v1.  
Jeśli Maciej kiedyś zażąda — osobna decyzja ABC + historia w silniku (dziś nie ma).

---

## 5. Screeny PRZED (stan w grze)

Panel **już istnieje** (brzydki, ale z **prawdziwymi danymi**):

| Plik | Co pokazać |
|------|------------|
| `gra-kanon/START.html` lub `gra-robocza/START.html` | Nowa gra · kilka tur |
| Klik **Moc** (centrum) | Slide-in · sekcja z tabelą 9 wierszy |
| Klik **Skarbiec** | Ten sam panel · tabela miast |

**Lane UI:** wrzuca referencje do `docs/ux/export/screenshots/` gdy Maciej dostarczy print screeny.  
**Design może też sam:** playtest wg powyżej · Ctrl+F5.

**Legacy do ignorowania w mockupie:** modal centrum `powerOverlayHud` — tylko fallback gdy slide-in nie podpięty.

---

## 6. Co poprawić w mockupie v1 2026-07-05

| Design zrobił | Powinno być |
|---------------|-------------|
| 6 filarów (Wojsko, Gospodarka…) | **Tabela 9 składników** (patrz §2) |
| 460px slide-in? | **420px** (±20 OK po review) |
| Trend ▲/▼ | **Usuń** |
| Agregacja „Gospodarka" w Mocy | **Oddzielna sekcja** „Zasoby imperium" (chipy HUD) |

**Deliverable po korekcie:**  
`The Game - Panel Moc imperium v2 2026-07-06 (1E).dc.html`  
(min. 4 klatki: Moc · Skarbiec · Praca · Rekruci)

---

## 7. Pliki dla Design (czytaj w tej kolejności)

1. Ten plik  
2. `docs/ux/DESIGN-ZLECENIE-IMP-01-MOC-2026-07-06.md`  
3. `docs/ux/export/IMP-01-MOC-PANEL-GAP-DLA-DESIGN.html`  
4. `gra/data/power-params.json`  
5. `gra/src/ui/empireDetailPanel.ts` (struktura sekcji — linie 279–346)

---

**Po v2 mockup:** Lane portuje szatę → Master publish → reszta paczki B-P0 (A-08, HEX, C23, C12) **niezależna** — można portować równolegle.
