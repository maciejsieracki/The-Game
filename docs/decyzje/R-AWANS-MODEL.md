# R-AWANS-MODEL — awans budynków „w górę" vs „w bok"

**Data audytu:** 2026-08-05  
**Operator:** AutoBot VERIFY/CLOSE  
**Źródło decyzji:** `dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §1 (Pytanie 25 = B, per łańcuch)

## Reguła

| Rodzaj | Zachowanie | Przykłady |
|--------|------------|-----------|
| **W górę** | Następca kasuje poprzednika (`upgradeFrom`); stała wartość per tier | Pałac I→II→III, Kuźnia, Spichlerz, Port, Piec hutniczy |
| **W bok** | Oba budynki stoją obok siebie; wartości następcy rozdzielone (bez podwójnego liczenia) | Mury+Cytadela+Baszta, Biblioteka+Akademia, Koszary+Akademia wojskowa, Kamienne kręgi+Świątynia |

## Audyt `buildings.json` (2026-08-05, `main`)

Cztery pary „w bok" — **brak `upgradeFrom`** (PASS):

| ID następcy | `upgradeFrom` | Wartości rozdzielone |
|-------------|---------------|----------------------|
| `fort` (Cytadela) | brak | obrona wyłącznie procentowa (`obrona: 0`) |
| `akademia` | brak | nauka 6, kultura 5 (Biblioteka: 3+2) |
| `akademia_wojskowa` | brak | praca 3 (Koszary: 2) |
| `swiatynia` | brak | kultura 2, zadowolenie 2 (Kamienne kręgi: 1+1) |

Łańcuchy „w górę" — **`upgradeFrom` nietknięte** (PASS): `palac_ii`←`palac`, `palac_iii`←`palac_ii`, `kuznia_zelaza`←`kuznia`, `wielka_kuznia`←`kuznia_zelaza`, `spichlerz_ii`←`spichlerz`, `port_wielki`←`port`, `dom_starszyzny`→`dwor_zarzadcy`→`pretorium`, odlewnie.

**Commit źródłowy:** `2354fb7` (`feat(miasto): grupy budynkow w panelu + likwidacja awansu bocznego`) — na `main` od 2026-07-25.  
**Pierwszy deploy ROBOCZA:** FALA 11, md5 `dd1ec38e` (2026-07-25). FALA 11.1 `98b1403a` przywróciła prerekwizyt kolejności budowy (`CITY_BUILDING_PREREQ`) bez przywracania `upgradeFrom`.

## Wyniki testów (audyt 2026-08-05)

| Suite | Wynik | Uwagi |
|-------|-------|-------|
| `upgrade-budynki-test.cjs` | 47/48 PASS | Jedyny FAIL: `no handel bonus on bruk` — poza zakresem R-AWANS-MODEL |
| `unit-building-bonuses-test.cjs` | 82/82 PASS | Sekcja F: brak `upgradeFrom` na 4 parach bocznych |
| `grupy-budynkow-test.cjs` | 80/83 PASS | Sekcja A (upgradeFrom): PASS; 3 FAIL = licznik 41 budynków (Baszta) vs stary expected 40 |

**Kod gameplay:** bez zmian w tej sesji — audyt potwierdził zgodność z decyzją.
