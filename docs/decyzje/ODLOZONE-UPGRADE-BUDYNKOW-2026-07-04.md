# Odłożone — upgrade budynków + UI panelu miasta

> **Status:** 🟡 **ABC ZAMKNIĘTE 2026-07-05** — kanon: `KANON-UPGRADE-BUDYNKOW-2026-07-05.md` · wdrożenie: `działaj`  
> **Priorytet:** po domknięciu paczek ABC EKO-TECH (forty, sól, brąz…) · przed pełnym wdrożeniem JSON upgrade’ów

---

## Dlaczego wracamy

Temat **upgrade budynków** jest **niedokończony**. Maciej (2026-07-04):

> Musimy wrócić do upgrade’u budynków. Przemyśleć **jak to pokazywać na planie budowy miasta** — sekcja **wybudowane** oraz **bonusy** z tych budynków.

---

## Co już mamy (kanon werbalny + paczka 1)

| Element | Stan |
|---------|------|
| **Zasada** | 1 budynek na łańcuch; po upgrade **stary id znika**, nowy zajmuje slot |
| **Bonusy** | W JSON upgrade’u = **już zsumowane** statystyki (Koszary+Akademia itd.) |
| **Tech** | Odblokowuje **prawo do rozbudowy**, nie zawsze od razu jednostki |
| **T-TECH-8** | Kamienne kręgi → upgrade → Świątynia (suma bonusów) — **UI listy otwarte** |
| **ABC-7** | Odlewnia brązu → upgrade Odlewnia żelaza |
| **Werbalnie** | Kopalnia żelaza, Akademia Wojskowa, Wielka Kuźnia, Mury, Port, Biblioteka→Akademia, Akwedukt… |

Pełna mapa propozycji (ABC-20…24): archiwum Grupa B ~2026-07-01.

---

## Co trzeba domknąć (ABC + UX)

### A) Lista **wybudowanych** budynków w panelu miasta

- Po upgrade: pokazujemy **nowy typ** (np. Świątynia), czy też historię (Kręgi → Świątynia)?
- Czy ikona / etykieta **„Rozbudowano z X"**?
- Handoff roboczy: `dyspozycje/_handoff/MASTER-do-UI_kult-upgrade-lista-2026-07-04.md`

### B) **Plan budowy** / kolejka produkcji

- Pozycja **„Rozbuduj Koszary → Akademia Wojskowa"** zamiast drugiego budynku?
- Koszt, czas, prereq tech — jak w zwykłej budowie?
- Czy upgrade **zajmuje ten sam slot** w limicie budynków miasta?

### C) **Bonusy** — prezentacja graczowi

- Tooltip: **„Zawiera bonusy: Koszary (+…)"** vs tylko końcowe liczby?
- Panel okolica / statystyki miasta: jedna linia czy rozpiska składników?
- Spójność z **sumą w JSON** (gracz nie liczy sam).

### E) **Lokalizacja w mieście — pakiet trójek** (Maciej 2026-07-05, jutro)

> Budynki trzymają się łączyć w **trójki** — **jeden po drugim w pakiecie**. Do rozstrzygnięcia ABC jutro (`upgrade`).

| Wariant | Co w grze | Pytanie do Macieja |
|---------|-----------|-------------------|
| **E1 — Łańcuch 3 stopni** | Slot miasta = **jeden wiersz**: Budynek I → II → III (upgrade zastępuje, w UI widać całą „ścieżkę”) | Czy każdy typ ma dokładnie 3 poziomy? |
| **E2 — Dzielnica 3 slotów** | Miasto ma **pakiety po 3 sloty** (np. wojskowy / gospodarczy / kultura); w pakiecie budujesz po kolei | Czy pakiety są sztywne per epoka? |
| **E3 — Tylko wizual 3D** | W panelu lista jak dziś; na **modelu miasta** budynki z tego samego pakietu stoją obok siebie | Czy 2D wystarczy na v1.0? |

**Rekomendacja jutro (wstępna):** zacząć od **E1 + UPG-UI** (panel) — najmniej ryzyka; 3D pakietów (E3) jako faza 2.

---

| ID | Temat |
|----|--------|
| ABC-20 | Port wielki — kiedy (Handel / Inżynieria / dwa etapy) |
| ABC-21 | Akademia vs Teatr (upgrade Biblioteki + Teatr osobno?) |
| ABC-22 | Mury ufortyfikowane vs Cytadela |
| ABC-23 | Prereq Drogi brukowane |
| ABC-24 | Bonus droga brukowana (ruch / handel) |
| **UPG-UI** | Prezentacja w panelu (A/B/C — do zaprojektowania) |

---

## Kiedy przypomnieć Maciejowi

1. Po **paczce 2/3** EKO-TECH (ABC-10…19 minimum), **albo**
2. Gdy lane **UI** bierze panel budowy miasta, **albo**
3. Na prośbę Macieja: **`upgrade`** / **`wróć do upgrade’ów`**

---

## Lane przy wdrożeniu

| Lane | Rola |
|------|------|
| **CYWILIZACJE** | `upgradeFrom`, zsumowane staty w JSON |
| **EKONOMIA** | produkcja upgrade, `builtIds` zastąpienie |
| **UI** | lista wybudowanych + kolejka „Rozbuduj" + tooltip bonusów |
| **SILNIK/MASTER** | wpięcie `main.ts` po handoffach |

---

## Powiązane pliki

- `docs/decyzje/D-EKO-TECH-PACZKA1-2026-07-04.md` (T-TECH-8, ABC-7)
- `dyspozycje/_handoff/MASTER-do-UI_kult-upgrade-lista-2026-07-04.md`
- Archiwum: `docs/archiwum-czatow/eksport-pelny/GRUPA-B_KORESPONDENCJA.md` (~35069 upgrade map)
