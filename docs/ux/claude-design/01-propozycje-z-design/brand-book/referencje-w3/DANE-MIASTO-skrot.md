# Dane miasta — skrót dla mockupu W3

## Pola nagłówka

| Etykieta UI | Przykład demo | Skąd w grze |
|-------------|---------------|-------------|
| Nazwa | „Rzym" | `City.name` |
| Populacja | 23 | `City.population` |
| Epoka | 2 (Brąz) | imperium gracza, nie pole miasta |
| Stolica | gwiazdka / chip | pierwsze miasto gracza |
| Właściciel | Rzymianie | `ownerId` → cywilizacja |

## Plony na turę (6 chipów górnych)

| Chip | Klucz gry | Przykład demo |
|------|-----------|---------------|
| Żywność | `zywnosc` | +8 |
| Praca | `praca` | +36 |
| Skarbiec | `pieniadz` | +12 (lub 240 zapas imperium) |
| Nauka | `nauka` | +4 |
| Kultura | `kultura` | +2 |
| Zamożność | `luksus` (strumień handlu) | +3 |

**NIE ma** osobnego yieldu „wpływ" — kultura/religia/zamożność to osobne panele.

## Wzrost populacji

- Próg: **10 + populacja × 8** (normal) → przy pop 4: **42**
- Magazyn demo: **14 / 42**
- Pasek: 33%

## Kolejka produkcji

```text
kolejka[0] = w budowie (postęp np. 12/25)
kolejka[1..] = oczekujące
wstrzymana = badge ⏸
```

Przyciski: **Buduj** · **Kup** (złoto = 2× koszt Pracy) · **Wykup** · **Wstrzymaj/Wznów** · **Usuń** · **↑↓**

## Porządek (panel cp-order)

```
PorPct = 0.5 × SzPct + 0.5 × PrawPct
```

| PorPct | Etykieta bandu |
|--------|----------------|
| ≥90 | Ład |
| 70–89 | Spokój |
| 50–69 | Napięcie |
| 30–49 | Niepokój |
| 10–29 | Bunt |
| <10 | Bunt skrajny (grace 2 tury) |

## Handel — 3 suwaki (kroki 10%, suma 100%)

Domyślnie: Nauka **20%** · Pieniądz **70%** · Zamożność **10%**

## Praca — 1 suwak

Domyślnie: **70%** Pracy miasta → budynki (reszta → pula imperium)

## Okolica

- Pola robocze = **populacja** (4 pop → 4 👤)
- Promień rośnie z pop (min 5, max 15 hex od miasta)
- Focus: zrownowazone · zywnosc · produkcja · podatki
- Tereny (terrain-yields): Łąka 4🌾 1⚒ · Równina 2🌾 · Wzgórza 1🌾 2⚒ · Morze 2🌾 2💰

## Garnizon

Lista jednostek na heksie miasta — wpływa na **PrawPct** (nie SzPct).

## Akcje header

◀▶ miasto · ✏ rename · ⚙ auto-zarządca · widok artystyczny · Aa (3 rozmiary) · ✕ zamknij
