# HANDOFF CYWILIZACJE -> MASTER: Mechanizacja bonusów cywilizacji

**Data:** 2026-06-25  
**Od:** CYWILIZACJE  
**Do:** MASTER (do rozdania działom: UNITS/BITWA, MIASTO, EKONOMIA)

---

## Status T3=A — potwierdzone

Maciej zatwierdził decyzję T3=A (2026-06-25). Schemat `bonusy[]` w `gra/data/civs.json` jest **GOTOWY** (dane CYWILIZACJE). Każdy bonus zawiera pola: `typ`, `cel`, `wartosc`, `opis`, `realizuje`.

**MECHANIZACJA EFEKTÓW należy do działów według pola `"realizuje"`:**
- `"realizuje": "walka"` → **UNITS / BITWA**
- `"realizuje": "miasto"` → **MIASTO**
- `"realizuje": "ekonomia"` → **EKONOMIA**

Wartości (`wartosc`) są wstępne — do korekty przez Macieja i właściwe działy w toku implementacji.

---

## Tabela bonusów z civs.json — pogrupowana po "realizuje"

### realizuje=walka (-> UNITS/BITWA) — 23 efekty

| nacja | typ | cel | wartosc | opis |
|-------|-----|-----|---------|------|
| Grecy | bonus_obrona | piechota | 0.20 | Falanga: +20% obrony piechoty przy ataku frontalnym (szyld i oszczep) |
| Grecy | jednostka_specjalna | piechota | Falanga (Hoplita) | Hoplita = ulepszona piechota z tarczą; silna od frontu, odpiera szarżę kawalerii |
| Rzymianie | bonus_walka | piechota | 0.15 | Legion: +15% ataku i pancerza piechoty szturmowej; dyscyplina bojowa +morale |
| Rzymianie | jednostka_specjalna | piechota | Legion (Legionista) | Legionista = ciężka piechota z pilum; silny atak + pancerz + morale |
| Chińczycy | bonus_walka | lukownicy | 0.20 | Kusznik: +20% ataku i zasięgu łuczników/kuszników (przewaga dystansowa) |
| Chińczycy | bonus_walka | kawaleria | 0.15 | Konnica stepowa: +15% uderzenia kawalerii przy szarży |
| Chińczycy | jednostka_specjalna | dystans | Kusznik (lepszy łucznik) | Kusznik = silniejszy łucznik z kuszą; większy zasięg i przebicie pancerza |
| Inkowie | bonus_walka | piechota | 0.20 | Teren górski: +20% walki w lesie i dżungli (znajomość terenu) |
| Inkowie | jednostka_specjalna | piechota | Chaska / Królewska Gwardia | Chaska (maczuga gwiaździsta) = elitarna piechota; Królewska Gwardia = oddziały prestiżowe |
| Zulusi | bonus_walka | piechota | 0.20 | Ruch i morale: +20% prędkości piechoty i +morale przy ataku w grupie (formacja buffalo) |
| Zulusi | jednostka_specjalna | piechota | Impi | Impi = szybka piechota z assegai; silna w zmasowanym ataku, słaba na dystans |
| Egipt | bonus_walka | lukownicy | 0.20 | Łucznicy na rydwanach: +20% ataku dystansowego; rydwany z dużym zapasem strzał |
| Egipt | bonus_walka | rydwany | 0.15 | Szybkie rydwany: +15% prędkości i zasięgu ataku rydwanów bojowych |
| Egipt | jednostka_specjalna | piechota | Medżaj (Gwardia Faraona) | Medżaj = elitarna gwardia; najlepsza piechota Egiptu, ochrona centrum miasta |
| Sumerowie | bonus_obrona | piechota | 0.20 | Ciężka piechota: +20% obrony i HP ciężkiej piechoty (pancerz brązowy + tarcza) |
| Sumerowie | bonus_walka | rydwany | 0.15 | Ciężkie rydwany bojowe: +15% HP i obrony rydwanów (masywna konstrukcja) |
| Sumerowie | jednostka_specjalna | piechota | Gwardia Królewska Sumeru | Gwardia Królewska = szczyt ciężkiej piechoty Sumeru; pancerz i lanca; +obrona miasta |
| Celtowie | bonus_walka | piechota | 0.25 | Brawura szarży: +25% ataku piechoty przy pierwszym uderzeniu (furia celtycka) |
| Celtowie | bonus_walka | piechota | 0.15 | Długi miecz galijski: +15% Uderzenia (zasięg ostrza i siła cięcia) |
| Celtowie | jednostka_specjalna | piechota | Miecznik galijski | Miecznik galijski = wojownik z długim mieczem; silny w szarży, słabszy w przeciągłej obronie |
| Germanie | bonus_walka | piechota | 0.25 | Zasadzka leśna: +25% ataku przy walce w lesie lub przy pierwszym ciosie z zasadzki |
| Germanie | bonus_walka | piechota | 0.15 | Furia bojowa: +15% ataku na starciu (bonus morale przy bezpośrednim kontakcie) |
| Germanie | jednostka_specjalna | piechota | Wojownik germański (framea) | Framea = włócznia/oszczep germański; celny rzut + walka wręcz; specjalista od zasadzki |

---

### realizuje=miasto (-> MIASTO) — 1 efekt

| nacja | typ | cel | wartosc | opis |
|-------|-----|-----|---------|------|
| Rzymianie | koszt_redukcja | budynki | 0.20 | Inżynieria rzymska: -20% kosztu Produkcji budowli; szybsza budowa dróg |

---

### realizuje=ekonomia (-> EKONOMIA) — 3 efekty

| nacja | typ | cel | wartosc | opis |
|-------|-----|-----|---------|------|
| Grecy | bonus_zloto | handel | 0.15 | Morskie szlaki handlowe: +15% złota z portów i dróg morskich (Korynt, Ateny) |
| Inkowie | bonus_nauka | wszystko | 0.15 | Kalendarz słoneczny: +15% produkcji punktów nauki (astronomia i agronomia) |
| Zulusi | bonus_walka | piechota | 0.10 | Tania rekrutacja: koszt rekrutacji Impi -10% (liczebność > jakość) |

---

## Podsumowanie — liczba efektów per dział

| Dział | Efektów |
|-------|---------|
| UNITS/BITWA (walka) | 23 |
| MIASTO (miasto) | 1 |
| EKONOMIA (ekonomia) | 3 |
| **RAZEM** | **27** |

---

## Prośba do Mastera

Proszę o rozdanie tej listy do właściwych działów:
- **UNITS/BITWA** — 23 efekty walki (bonusy obrony, ataku, jednostki specjalne)
- **MIASTO** — 1 efekt (redukcja kosztu budowli Rzymian)
- **EKONOMIA** — 3 efekty (złoto z handlu Grecy, nauka Inkowie, koszt rekrutacji Zulusi)

Każdy dział implementuje odczyt `bonusy[]` z `civs.json` i stosuje efekty swojego zakresu (`realizuje`) we własnej logice.

**Uwaga: wartości (`wartosc`) są wstępne — do korekty przez Macieja i właściwe działy w toku implementacji.**

Źródło danych: `gra/data/civs.json` (pole `bonusy[]` per cywilizacja, 9 nacji, 27 efektów łącznie).

*— CYWILIZACJE, 2026-06-25*
