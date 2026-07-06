# MASTER → UI: statystyki jednostek TW w panelu — wdrożone 2026-07-03

**STATUS: GOTOWE (Master)** · kanon md5 **`04d21f3087be8f4e85470ddad2335e70`**

---

## Kontekst

Pass balansu walki (`health ×1,5`, `missileAttack ÷2`) był w JSON, ale **UI pokazywało legacy** (`Atak: 88`, `Health: 75`) — mylące vs faktyczna walka TW.

---

## Co zmieniono

**Plik:** `gra/src/ui/cityPanel.ts` — sekcja **Walka** w karcie szczegółów jednostki (produkcja / encyklopedia w panelu miasta).

| Było (legacy) | Jest (TW — to samo co `combat.ts`) |
|---------------|-------------------------------------|
| Atak | Atak w zwarciu (`meleeAttack`) |
| Obrona | Obrona (`meleeDefence`) |
| Uderzenie | Bonus szarży (`chargeBonus`) |
| Atak dystansowy (legacy kolumna) | Atak dystansowy (`missileAttack`) |
| HP (`Health`) | HP (`health`, fallback `Health`) |
| Pancerz / Przebicie (legacy) | Pancerz / Przebicie (`armor` / `piercing`) |
| — | **Obrażenia broni** (`weaponDamage`) — nowy wiersz |

Bez zmian: Ruch, Zasięg, Pociski, Widok pola, Morale, Ekonomia.

Sync: **gra-robocza/** + **gra-kanon/** (snapshot 2026-07-03).

---

## Czego UI **nie** ruszano

- `preBattle.ts` (przed bitwą) — etykiety M / Łączna siła bez zmian
- HUD mapy wojska
- Design mockupy C-06 / W3 miasto
- `main.ts`

---

## Co lane UI ma zrobić

1. **Wiedzieć:** karta jednostki w panelu miasta = **TW v3**, zgodna z walką po fixie sceny T.
2. **Opcjonalnie:** jeśli macie inne miejsca z `u.Atak` / `u.Health` — wyrównać do TW (grep `u.Atak` w `gra/src/ui/`).
3. **Design:** encyklopedia / wiki — te same nazwy pól co w panelu (nie legacy macierz v2).
4. **Playtest Macieja:** produkcja jednostki → szczegóły → sekcja Walka: Łucznik HP **12**, dystans **3**.

---

## Powiązane

- `_handoff/MASTER-do-UNITS_balans-scena-T-2026-07-03.md`
- `_handoff/MASTER-do-MIASTO_balans-jednostki-info-2026-07-03.md`
