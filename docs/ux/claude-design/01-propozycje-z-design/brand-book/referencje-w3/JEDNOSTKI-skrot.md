# Jednostki — skrót dla mockupu rekrutacji

**Pełna lista:** 50 wierszy w `gra/data/units.json` (repo). W mockupie pokaż **min. 6 kart** + 1 zablokowaną.

## Przykłady do kart (epoka Kamień / Brąz)

| Jednostka | Epoka | koszt Pracy | Tech | Rola | unit-* |
|-----------|-------|-------------|------|------|--------|
| Wojownik | Kamień | 10 | — | Wręcz | unit-melee |
| Procarz | Brąz | 8 | — | Dystans | unit-sling |
| Oszczepnik | Kamień | 10 | — | Wręcz | unit-spear |
| Łucznik | Kamień | 8 | — | Dystans | unit-archer |
| Zwiadowca | Kamień | 12 | — | Zwiad | unit-scout |
| Włócznik | Brąz | 10 | — | Wręcz | unit-spear |
| Konnica | Brąz | 16 | — | Konnica | unit-cavalry |
| Galera | Brąz | 20 | Żegluga | Morska | unit-naval |

## Bramka Koszar (obowiązkowo na mockupie)

Jednostka epoki **Brąz** bez Koszar w mieście = karta **zablokowana**:

> „Wymaga: Koszary"

Przykład: **Włócznik** — szary + kłódka gdy brak koszar.

## Jednostki specjalne cywilizacji

Pole `W zamian za` ≠ „—" → zastępuje bazową (np. Hastati zamiast Wojownika) — w mockupie **nie musisz** wszystkich 50; wystarczy 1 karta z etykietą „Specjalna cywilizacji".

## Przyciski rekrutacji

- **Rekrutuj** — kolejka Pracy (jak budynek)
- **Kup jednostkę** — płatność ze skarbca (osobny flow)

## Mapowanie ikon

`eksport/unit-icon-map.json`:

lucznik→unit-archer · wlocznik/oszczepnik→unit-spear · miecznik/falanga→unit-melee · konnica→unit-cavalry · procarz→unit-sling · galera→unit-naval · zwiadowca→unit-scout · robotnik/osadnik→unit-worker · katapulta/taran→unit-siege · super→unit-elite · _default→unit-default
