# Grupa D — model miast-typu (obowiązkowy kontekst)

> **Czytaj na starcie czatu Grupa D** obok `docs/czaty/GRUPA-D-NAUKA-DYPLOMACJA.md`  
> **Decyzja:** `docs/decyzje/D-START-miasta-kopie-typu.md`

---

## Jedno zdanie

**Miasto AI na mapie = kopia danych typu cywilizacji (`civs.json`), nie osobna nacja.** Nazwa z `nazwyKlastra`. AI **obronne**, bez ekspansji.

---

## Co Grupa D musi wiedzieć

| Obszar | Konsekwencja dla lane D |
|--------|-------------------------|
| **Nauka** | Wszystkie kopie typu X mają **ten sam** dostęp do tech epoki startowej co typ X (brak osobnego drzewka per miasto). |
| **Dyplomacja** | Rywale **tego samego typu** = uproszczona warstwa; **obcy typ** = pełna po kontakcie. Relacja start: rywalizacja tego samego typu (-20 zaufanie). |
| **Bonusy cyw** | `civBonusyForOwnerId(owner)` → **zawsze** `ikonaId` typu, nie per nazwa miasta. |
| **AI (`ai.ts`)** | Profil **kopia_typu_obronna**: brak osadników, brak zakładania miast, brak marszu ekspansyjnego; obrona + ewentualna riposta. |
| **Zwycięstwo** | Dominacja = eliminacja miast **własnego typu** gracza; obce typy to łupy do podboju, nie warunek dominacji v1.0. |
| **Dane Excel** | AI-zachowanie: per typ **jeden** profil mapy; Parametry-cyw: preferencje budowy **typu**, nie „Sparty”. |

---

## Symetria (przykład)

Gracz = **Rzymianie** · na mapie aktywni też **Chińczycy**

| | Rzymianie (klaster gracza) | Chińczycy (klaster obcy) |
|--|---------------------------|---------------------------|
| Miasta | Rzym + rywale (Ostia, Kapua…) | Qin, Qi, Chu… |
| `ikonaId` | `rzymianie` | `chinczycy` |
| Bonusy | z JSON Rzymian | z JSON Chińczycy |
| AI | rywale typu — obrona | **to samo** — obrona |
| Cel gracza | zniszczyć/podbć rywali **rzymian** | podbić chińskie kopie (mapa) + pełna dyplomacja |

---

## Pliki do edycji (lane CYWILIZACJE)

| Priorytet | Plik | Zadanie |
|-----------|------|---------|
| P0 | `docs/decyzje/D-START-miasta-kopie-typu.md` | source of truth (gotowe) |
| P0 | `gra/src/game/ai.ts` | gałąź defensywna dla ownerów klastra |
| P1 | `Cywilizacje.xlsx` → AI-zachowanie | profil `kopia_typu_obronna` |
| P1 | `gra/data/civs.json` → `start_gry` | meta opis modelu |
| P2 | `gra/src/game/victory.ts` | komentarz / test: obcy typ ≠ dominacja |
| handoff | `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_miasta-kopie-typu.md` | AI + dane → SILNIK |

---

## Czego NIE robi Grupa D

- **Nie** projektuje layoutu klastra (MAPA — `clusters.ts`).
- **Nie** wpina `main.ts` (SILNIK / Grupa F).
- **Nie** pyta Macieja ponownie o N-1…N-5 (zamknięte).

---

## Status implementacji (Master, 2026-06-27)

- Spawn nazw + klaster gracza: **SILNIK wpięte**
- Spawn pełnego klastra obcych typów: **TODO MAPA+SILNIK**
- AI defensywne: **TODO CYWILIZACJE**
