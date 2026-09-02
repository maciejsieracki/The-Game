# Palac

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `palac` |
| **tytuł** | Palac |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Palac** — budynek (Kultura/Administracja), epoka Kamień. Koszt od **40** pracy, utrzymanie **2** ¤/t. Bez dodatkowej technologii.

---

## Wiki‑M

### Co robi
Palac wzmacnia miasto w kategorii **Kultura/Administracja**. Poziom 1: **+3 kultury** (+2 na poziom), **+1 pkt szczęścia** (+1 na poziom), **+5 % mnożnika Daniny** (+0 na poziom). Maksymalnie **10** poziomów — każdy kosztuje więcej pracy (+**12** od poprzedniego), ale daje większy przyrost.
### Koszty
- **Budowa poz. 1:** 40 pracy
- **Każdy kolejny poziom:** +12 pracy
- **Utrzymanie:** 2 ¤/turę (+1 ¤/poziom)
- Bez dodatkowej technologii.
Warunek: -.
- **Uwaga:** 1 na miasto (siedziba zarzadcy); glowne zrodlo kultury miasta
- **Budynek startowy:** Pałac stoi **już zbudowany** w każdym nowo założonym mieście, poza normalną kolejką produkcji — w praktyce nigdy nie płacisz zań surowca przy zakładaniu miasta, tylko Pracę na kolejne poziomy rozbudowy. (`buildings.json` formalnie ma wpisany koszt materiałowy drewno/kamień — dotyczy tylko hipotetycznego przypadku odbudowy, nie normalnej gry.)
### Strategia gracza
Buduj **przed** przekroczeniem progu zagęszczenia (pop > 4) lub po podboju obcego miasta — szczęście podnosi też **porządek**.
### Typowe błędy
- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.
- Ignorowanie utrzymania: 2 ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.
- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.
**Powiązane:** Produkcja miejska · Utrzymanie · Kultura/Administracja

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | 40 | **4 tur** | +3 kultury, +1 pkt szczęścia, +5 % mnożnika Daniny | 2 ¤/t |
| Poziom 2 | 52 | **6 tur** | więcej (patrz niżej) | 2 ¤/t |
| Poziom 3 | 64 | — | **+7 kultury, +3 pkt szczęścia, +5 % mnożnika Daniny** | 2 ¤/t |

Korzyść jakościowa (obrona, szczęście, kultura) — policz wpływ w panelu **Miasto** przed/po budowie.

**Przyspieszenie za złoto:** jeśli brakuje **20** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

Wygenerowano z danych gry · rev. F 2026-07-24 (dopisano: budynek startowy, w praktyce bez kosztu surowcowego) · pierwotnie rev. E 2026-07-03 (pogłębienie + przykłady).

## Rys historyczny

Pierwsze siedziby władzy w dziejach ludzkości bywały skromnymi domostwami wodzów plemiennych — drewnianymi lub glinianymi budowlami wyróżniającymi się z otoczenia jedynie rozmiarem i położeniem w centrum osady. To właśnie tam gromadzili się starsi rodu, by naradzać się w sprawach wojny, podziału łupów i sporów między klanami, a sam wódz musiał swą pozycję potwierdzać nie tyle przepychem budowli, co osobistym autorytetem i skutecznością w boju. Archeolodzy odnajdują ślady takich wczesnych „domów wodza” w osadach epoki brązu na terenie całej Europy i Bliskiego Wschodu — nieco większe fundamenty, ślady palenisk ceremonialnych i pozostałości darów składanych władcy przez poddanych. W społecznościach bez pisma to właśnie taki dom pełnił funkcję sądu, skarbca i miejsca przyjmowania obcych posłów jednocześnie, będąc namacalnym centrum władzy plemiennej. Z czasem coraz trwalsza pozycja wodzów przełożyła się na coraz ambitniejsze budowle, torując drogę ku prawdziwym pałacom epok późniejszych.
