# Playtest walki — instrukcja (2026-07-01)

**Rebuild PLAYTEST (2026-07-01):** `Gra-podglad-PLAYTEST-WALKA.html` · md5 **`9AC325821135770E38831FF33C3A985C`** — zawiera layout TW preBattle (Pole 3D z murem), szanse **M armii**, fix Grupy C. **Ctrl+F5** po otwarciu.

**Kanon** `Gra-podglad.html` — **nie** nadpisany (czeka pełna bramka F + Opus). Do testu użyj PLAYTEST-WALKA, ROBOCZA (ten sam md5) albo `?playtest=mapa` po publish kanonu.

---

## Główny playtest mapy świata (aktualny)

**Potyczka 1v1, oblężenie C3, preBattle, Auto/Ręczna:**

```
Gra-podglad.html?playtest=mapa
```

Dev: `http://localhost:5173/?playtest=mapa`

Preset: `playtestMapaSwiata.ts` — Testpolis + **3× Hastati**, **Ateny** z murem + **Łucznik** w garnizonie.  
Opcjonalnie gęstość E2: `?density=low|medium|high`

**Scenariusze:**
1. **Potyczka na mapie** — zaznacz Hastati → klik wroga obok → preBattle → Auto / Ręczna
2. **Szturm** — Hastati przy Atenach → klik miasto → Oblężaj / Szturm → preBattle

**Szanse na preBattle** = prognoza **M armii** (auto-walka v2b), nie stary hitChance TW.

---

## Test odskoku 3v3 (pole, bez miast)

**Dwuklik (zalecane):** `Gra-podglad-PLAYTEST-ODSKOK.html`

Alternatywa z parametrem URL (często ginie przy dwukliku): `?playtest=odskok`

**Układ:** 3× Hastati (M≈150) vs 3× Łucznik (M≈45) — armia gracza ~**3×** mocniejsza.  
**Flow:** zaznacz **środkowego** Hastati → klik **środkowego** Łucznika → **Auto** (~77% szans).  
**Oczekiwane:** po wygranej wróg **odskakuje** o 1–3 heksy od linii bitwy.

---

## Test odskoku + oblężenie miasta (3v3 + Ateny)

**Dwuklik (zalecane):** `Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html`

Alternatywy: `Gra-podglad-PLAYTEST-ODSKOK-OBLEZENIE.html` · `?playtest=odskok-obl`

**Układ:** jak odskok 3v3, ale **środkowy Łucznik (e1) jest w garnizonie Aten** (mur).  
Boczne Łuczniki (e0, e2) zostają na polu.

**Scenariusze:**
1. **Oblężenie / szturm** — zaznacz **środkowego** Hastati (stoi przy Atenach) → klik **Ateny** → **Oblężaj** lub **Szturm**
2. **Potyczka na polu** — atak bocznych Łuczników (e0 / e2) → Auto → test odskoku

**Oczekiwane:** garnizon = 1 Łucznik w mieście; po szturmacie / oblężeniu działa flow preBattle + obóz 3D jak w `?playtest=mapa`.

---

```
Gra-podglad.html?playtest=walka
```

Preset: `playtestWalkaMapy.ts` — **1× Hastati** + **Ateny** (tylko test szturmu, **bez** Falangi obok).

---

## Pełna gra

Menu → Nowa gra — ten sam silnik co powyżej.
