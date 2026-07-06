# KANON — Upgrade budynków (Maciej 2026-07-05)

> **Status:** 🟢 **WDROŻONA** w ROBOCZA (2026-07-05) — test 28/28 · md5 `89a870fb…`  
> **Paczki:** `PACZKA-UPGRADE-1/2/3-ABC-2026-07-05.md`

## Zasady ogólne

| Zasada | Treść |
|--------|--------|
| **Slot** | 1 łańcuch = **1 slot**; max **3 stopnie** w pakiecie (UPG-LOC **A**) |
| **Bonusy** | W JSON upgrade = **już zsumowane**; gracz widzi **skład** (UPG-BONUS **A+C**) |
| **Produkcja** | **Rozbuduj X→Y** w kolejce miasta (UPG-PROD **A**) |
| **UI zbudowane** | Nowy typ + ikona **↗** (UPG-UI **B**) |

## Decyzje szczegółowe

| ID | Decyzja | Implementacja |
|----|---------|---------------|
| UPG-LOC | **A** | Łańcuch 3 stopni; info o poprzednich poziomach |
| UPG-UI | **B** | ↗ upgrade przy nazwie |
| UPG-BONUS | **A+C** | Tooltip skład + panel po ↗ |
| UPG-PROD | **A** | Kolejka produkcji |
| ABC-20 | **B** | Port → Port wielki @ **Inżynieria** |
| ABC-21 | **B** | **Merge** Biblioteka→Akademia+Teatr (**1 budynek**) |
| ABC-22 | **C** | **Mury → Cytadela** (1 slot obrony) |
| ABC-23 | **A** | Drogi brukowane: **Inżynieria + Budownictwo** |
| ABC-24 | **A** | Droga brukowana: **+2 ruch** tylko |

## Łańcuchy upgrade (docelowe v1.0)

| Podstawa | Upgrade | Tech (orientacyjnie) |
|----------|---------|----------------------|
| Port handlowy | Port wielki | Inżynieria |
| Mury | Cytadela | Inżynieria (do doprecyzowania w JSON) |
| Biblioteka | Akademia (+Teatr merge) | Filozofia |
| Koszary | Akademia wojskowa | Sztuka wojenna |
| Kuźnia żelaza | Wielka Kuźnia | Hutnictwo żelaza |
| Piec hutniczy | Odlewnia żelaza | (już `upgradeFrom`) |
| Kamienne kręgi | Świątynia | Religia (już) |
| Droga (teren) | Droga brukowana | Drogi brukowane |

## Kolizja do rozwiązania przy wdrożeniu

**ABC-10** wprowadziło budynek **`fort`** = Cytadela + **Fort na mapie**.  
**ABC-22 C** = Cytadela jako **upgrade Murów** w mieście.  
→ Lane **CYWILIZACJE + UI:** rozdzielić id (`mury`→`cytadela_miasto`?) vs **`fort`** mapa; jedna nazwa wyświetlana „Cytadela”.

## Lane

| Lane | Zakres |
|------|--------|
| CYWILIZACJE | `upgradeFrom`, merge Teatr→Akademia, Port wielki, JSON |
| EKONOMIA | produkcja „Rozbuduj”, zamiana `builtIds` |
| UI | ↗, tooltip, panel składu bonusów, pakiet 3 stopni |
| UNITS | Triari / elita → bramka **Akademia wojskowa** (werbalny kanon) |
| MAPA | droga brukowana (ABC-23/24 już częściowo w terenie) |
