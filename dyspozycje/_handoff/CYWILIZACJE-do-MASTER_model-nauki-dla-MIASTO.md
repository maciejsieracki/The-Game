# CYWILIZACJE → MASTER : model „nauka/ekonomia miasta" — do rozdania (MIASTO + EKONOMIA)

Data: 2026-06-25 | Od: **CYWILIZACJE** | Dla: **MIASTO** (mechanika per‑miasto) + **EKONOMIA** (agregacja globalna) | Status: **PROŚBA O ROZDANIE**

## Ustalenia (Maciej + EKONOMIA) — model nauki
Nauka = część outputu miasta dzielonego suwakiem („podatek"): część na **produkcję** (jednostki/budynki), część do **skarbca** (Pieniądz), część na **Naukę**, część na **rozwój**. Część strumienia **Handlu** zamienia się na Naukę. Nauka ma **MAGAZYN** (zbiera się) i jest **wydawana na technologie** (każda tech ma `Koszt nauki`).

## Granice działów (kto co buduje)
- **MIASTO** — mechanika PER‑MIASTO: suwak podziału outputu (produkcja / Pieniądz / Nauka / rozwój), wyświetlanie w panelu miasta, magazyn nauki gracza (zbieranie + wydawanie na wybrane tech).
- **EKONOMIA** — agregacja GLOBALNA: sumuje z miast Naukę / Pieniądz / Pracę do globalnej puli „do wydania na mapie". Wzór nauki/turę: `_handoff/EKONOMIA-do-MASTER_tempo-nauki.md`.
- **CYWILIZACJE (ja)** — TYLKO dane drzewka: `Koszt nauki` per tech (`tech.json`, 10–50, zweryfikowane vs tempo EKONOMII) + wybór techu przez AI (`chooseAIResearch`). NIE mechanika miasta, NIE pula globalna.

## DECYZJA MACIEJA (2026-06-25): magazyn = WSPÓLNA PULA
Nauka = **wspólna PULA punktów**: gracz ZBIERA punkty nauki (sumowane z miast przez EKONOMIĘ) do jednej puli i WYDAJE je na **dowolną** technologię (spełniającą prereqi) o koszcie `Koszt nauki`. To NIE jest model „postęp pod jedną wybraną tech".

SKUTKI (do realizacji):
- **research.ts** (właściciel/MIASTO): zmiana z `biezace`+`postep` (postęp pod jedną tech) na **pulę punktów** + akcję „kup technologię" (`pula -= Koszt nauki`; dodaj do `ukonczone`; sprawdź prereqi).
- **MIASTO**: UI magazynu (saldo nauki gracza) + wybór/zakup technologii z drzewka.
- **CYWILIZACJE (ja)**: `chooseAIResearch` jest **KOMPATYBILNY bez zmian** — zwraca docelową technologię (najwyższy priorytet, prereqi spełnione, nie‑ukończona); silnik „kupuje" ją z puli, gdy `pula ≥ Koszt nauki`. Koszty w `tech.json` bez zmian.

## Prośba do mastera
Rozdaj do **MIASTO**: zbuduj mechanikę per‑miasto (suwak podziału + magazyn nauki + wydawanie na tech) wg powyższego. Potwierdź **EKONOMII** agregację globalną. Moja część (koszty tech + wybór AI) jest gotowa i nie blokuje.
