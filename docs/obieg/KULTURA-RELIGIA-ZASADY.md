# Kultura i religia — zasady wpływu na Szczęście i Prawo (ustawienie „Kultura i religia”)

Źródło: decyzja właściciela z 2026-11-26 (R-WEB-CULT-REL-IMPL-Q1, CULTIMPL). Kod: `gra/src/game/culture-religion-level.ts`
(granice, wartość linii, stan poziomu), `gra/src/game/society-breakdown.ts` (linie w Szczęściu i w Prawie),
`gra/data/society-params.json` (klucze `kultura_religia_poziomy` i `szczescie.szczescie_skala_kultura_religia`).

## Co się liczy

- Każde miasto ma dwie linie: **Kultura** i **Religia**. Każda z nich liczy się i do **Szczęścia**, i do **Prawa** miasta.
- Wartość linii = `(D + (G − D) · udział własnej) · skala epoki`, gdzie `udział własnej` to udział danej
  kultury/religii w mieście [0%–100%], a `skala epoki` to 1,0 / 1,6 / 2,3 dla epok 1 / 2 / 3.
- Linia Kultury i linia Religii w Prawie mają te same punkty co w Szczęściu.
- Jednostka garnizonu nadal daje 20 pkt Prawa (bez zmian).

## Poziomy ustawienia (nowa gra, zaawansowane → „Kultura i religia”)

| Opcja w grze | Poziom | D (0% własnej) | G (100% własnej) | Domyślnie |
|---|---|---|---|---|
| Mały wpływ (łatwy) | `latwy` | −10 | +10 | tak |
| Neutralny (normalny) | `normalny` | −15 | +5 | nie |
| Duży wpływ (trudny) | `trudny` | −20 | 0 (brak plusów) | nie |

Dla poziomu łatwego wynik w Szczęściu jest dokładnie dzisiejszy (`2·x·udział − x`, x = 10/16/23).

## Tryb zgodności (zapisy bez pola)

- Zapis bez pola `kulturaReligiaLevel` (sprzed zmiany) wczytuje się jako **tryb zgodności**: Szczęście liczy się
  dokładnie jak dotąd, a w Prawie NIE ma linii Kultury i Religii.
- Zapis wykonany po zmianie zachowuje wybrany poziom w `newGameParams.advanced.kulturaReligiaLevel`.

## Udział religii w Prawie

- Udział własnej religii bierze się z tego samego źródła co w Szczęściu: `ownReligionShare`, a gdy go brak —
  z sygnału `haRel` (`ownShareFromSignal`; brak sygnału = 0,5). Jedno źródło prawdy dla obu linii.

## Czego ta sekcja NIE zmienia

- Wagi Porządku, progi pasm i bunt pozostają bez zmian.
- Cel garnizonu 2/3/4 (model z analizy `dyspozycje/analizy/KULTURA-RELIGIA-WPLYW-2026-11-26.md`) nie jest
  wdrożony w tym temacie; wymaga osobnej decyzji właściciela.
