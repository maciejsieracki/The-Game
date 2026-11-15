# Osłabienie w bitwie: głód wojska i deficyt złota

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `oslabienie-glod-deficyt` |
| **tytuł** | Osłabienie w bitwie — głód wojska i deficyt złota |
| **kategoria** | Wojsko i gospodarka |
| **poradnik_ref** | Część VIII §50 (żywność wojska), Część VI (skarbiec) |
| **decyzja_ref** | `R-DEFICYT-ZLOTA-KARA-Q1=A`, `R-DEFICYT-ZLOTA-TRIGGER-Q1=B`, `PYTANIE-85`, `C-GLOD-Q1=A` |
| **json_ref** | `econ-params.json` (`glod_wojska_stat_mult`, `zloto_deficyt_stat_mult`), `empire-food.ts`, `gold-deficit.ts`, `combat.ts` |
| **status_v1** | ✅ |

---

## Wiki‑S (tooltip)

Jednostki armii, które w danej turze **głodują** (zapasy państwa < 0) albo gdy **Skarbiec < 0** po zbankowaniu tury, walczą osłabione: staty bojowe spadają o **25%** (mnożnik 0,75). Pancerz się nie zmienia. Okno przed bitwą pokazuje tę karę.

---

## Wiki‑M (artykuł)

**Co robi:** mnoży staty bojowe jednostek **bez pancerza** przez mnożnik z econ-params. Domyślnie `0,75`, czyli **−25%**, na poziomach Łatwy, Normalny i Trudny.

**Które staty:** atak wręcz, obrona wręcz, obrażenia broni, przebicie, bonus szarży, zdrowie bojowe i atak dystansowy. Próg dezercji rośnie ×1,25 (`×(2 − 0,75)`), więc jednostka dezerteruje wcześniej. Pancerz nie jest zmieniany.

**Kiedy działa:**

| Kara | Warunek (w danej turze) | Źródło |
|------|-------------------------|--------|
| **Głód wojska** | Zapasy państwa < 0 po koszcie armii | `empire-food.ts` (`isArmyHungry`) |
| **Deficyt złota** | Skarbiec właściciela < 0 po zbankowaniu tury | `gold-deficit.ts` (`isGoldDeficit`) |

Obie kary są niezależne i kumulują się: przy obu naraz jednostka dostaje dwa mnożniki (0,75 × 0,75).

**Kogo dotyczy:** każdą armię bojową **gracza i AI** (cywilizacje). **Barbarzyńcy nigdy** nie są osłabiani tymi karami. Jednostki cywilne (np. osadnicy) nie są brane pod uwagę.

**Ostrzeżenie w oknie przed bitwą:** jeśli strona ma co najmniej jedną walczącą jednostkę i działa któraś kara, okno przed bitwą pokazuje np. „Osłabieni: głód wojska −25%, deficyt złota −25% (poza pancerzem)”. Procent jest liczony z mnożnika w danych, nie wpisany na sztywno.

**Inny mechanizm — utrata zdrowia:** osobno, po karencji, działa atrycja HP. Głód wojska: po 3 turach z rzędu bez zapasów, −8% maks. zdrowia na turę (poziom Normalny). Deficyt złota ma tę samą karencję (3 tury) i tę samą stawkę. Osłabienie statów z tego hasła działa od pierwszej tury kary.

**Co z tym zrobić:** żeby zdjąć karę, odbuduj zapas żywności (patrz [Spichlerz](spichlerz.md) i [Suwak żywności](suwak-zywnosci.md)) albo wróć na dodatni Skarbiec (podatki i handel). Pula rekrutów miasta to osobna sprawa, patrz [Manpower — rekruci](manpower-rekruci.md).

---

## Poradnik‑L

→ Część VIII §50 (żywność wojska) w `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md`.

---

## Wzory (jeśli dotyczy)

- Mnożnik bojowy: `staty_bojowe × mnoznik` (bez pancerza), `mnoznik` z `glod_wojska_stat_mult` lub `zloto_deficyt_stat_mult` (domyślnie 0,75).
- Próg dezercji: `prog × (2 − mnoznik)`.
- Kumulacja: `mnoznik_glod × mnoznik_deficyt` (przy obu karach).

---

## Historia / decyzje (know‑how zespołu)

Hasło zweryfikowane w kodzie 2026-11-14 (R-WEB-DOCS-CIVPEDIA-WEAKENED-PENALTY-AND-STALE-TEXTS-Q1). Kara głodu: `PYTANIE-85`, mnożnik 0,75 w `econ-params.json` (wszystkie poziomy trudności). Kara deficytu złota: `R-DEFICYT-ZLOTA-KARA-Q1=A`, trigger `R-DEFICYT-ZLOTA-TRIGGER-Q1=B`. Ostrzeżenie w oknie przed bitwą: `R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1` (`gra/src/ui/battle-weakened-note.ts`, `gra/tools/prebattle-weakened-warning-test.cjs`). Zakres: kod nie rozróżnia gracza od AI (parytet), wyłączeni są tylko barbarzyńcy.
