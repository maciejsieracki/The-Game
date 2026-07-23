# Władcy (portrety i imiona per epoka)

## Metadane

| id | `wladcy` |
| tytuł | Władcy (portrety i imiona per epoka) |
| kategoria | Cywilizacje i dyplomacja |
| poradnik_ref | Część XIII (Cywilizacje), Część XII (Dyplomacja) |
| json_ref | `civs.json` (pole `wodzowie`) |

---

## Wiki‑S

Każda z **15 cywilizacji** ma w `civs.json` cztery imiona władców — po jednym na epokę: **Kamień, Brąz, Żelazo** (dziś grywalne) + **Antyk** (nazwa zarezerwowana na przyszłość — gra dziś kończy się na Żelazie). Portret władcy w medalionie (bitwa / preBattle / audiencja dyplomatyczna) dobiera się automatycznie do **cywilizacji i bieżącej epoki gracza/AI**.

---

## Wiki‑M

### Skąd biorą się imiona i portrety

Pole `wodzowie` w `civs.json` (klucze `kamien`/`braz`/`zelazo`/`antyk`) przypisuje każdej cywilizacji historyczne imię władcy na epokę — np. Rzym: Romulus (Kamień) → Numa Pompiliusz (Brąz) → Scypion Afrykański (Żelazo) → Juliusz Cezar (Antyk, rezerwa). Portrety to osobne assety `portrait-{civId}-{epoka}.jpg` (256×256) — **45 plików = 15 cywilizacji × 3 epoki** (Kamień/Brąz/Żelazo); epoka Antyk ma imię, ale **jeszcze nie ma** własnego portretu.

### Fallback wsteczny

Jeśli portret bieżącej epoki nie istnieje (np. brak jeszcze narysowanego wariantu), silnik (`leaderPortraitUrl`) bierze **najbliższy wcześniejszy** dostępny portret tej samej cywilizacji (Żelazo → Brąz → Kamień) zamiast pokazywać puste miejsce. Gdy cywilizacja jest nieznana lub nie ma żadnego portretu, wywołujący zostawia dotychczasowy medalion bez zmian.

### Gdzie widać portret władcy

- **Karty dowódców w bitwie i preBattle** (HUD TW-v5).
- **Ekran audiencji dyplomatycznej** — portret władcy obok relacji/zaufania/szacunku.

### Epoka „Antyk" — na zapas

„Antyk" to **czwarta pozycja** w `wodzowie`, przygotowana na przyszłość: gra dziś ma 3 epoki (Kamień→Brąz→Żelazo); dane ekonomii/manpower (`epoka-ludnosc-manpower.json`) też mają wiersz „epoka 4" zarezerwowany. Traktuj imię „Antyk" jako **rezerwę projektową**, nie jako aktywną epokę do zagrania.

**Powiązane:** poszczególne strony cywilizacji (np. [[Grecy]], [[Rzymianie]]) · Dyplomacja · Bitwa

---

## Przykład liczbowy

Gracz gra Grecją, jest w epoce **Żelazo** (era 3) → medalion pokazuje portret `portrait-grecja-zelazo.jpg` i imię **Leonidas**. Awansuje formalnie do epoki 4 (gdyby istniała) → imię zmieniłoby się na **Aleksander Wielki**, ale portret (którego jeszcze nie ma) spadłby z powrotem na wariant Żelazo przez fallback.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/13-cywilizacje.md` · `docs/PORADNIK-GRACZA/12-dyplomacja.md` §76 (panel audiencji)

---

## Historia / decyzje

Wdrożenie **PORTRETY WŁADCÓW** — deploy `48249d90` (2026-07-21), pełne wdrożenie wg dyspozycji `docs/ux/claude-design/.../PORTRETY-WLADCOW-2026-07-23/DYSPOZYCJA-WDROZENIE.md`; imiona władców 60 (15 cywilizacji × 4 epoki, w tym Antyk) dodane do danych wcześniej (deploy `f736ca21`). Hasło dodane 2026-07-23 (audyt CIVPEDII) — funkcja żyje w grze od kilku dni, nie miała dotąd hasła w encyklopedii.
