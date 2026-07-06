# RAPORT — GRAFIKA: co WPIĄĆ (gotowe) + co DOROBIĆ (designer)

**Data:** 2026-07-06 · **Autor:** UX (czat 3)
**Zakres:** poziom ASSETÓW (ikony/infografiki/flagi/surowce), NIE ekranów. To domyka lukę z poprzedniego raportu — tamten sprawdzał 38 ekranów i przyjął „ikony wpięte przez brandAssets", ale nie prześwietlił każdej kategorii assetów.
**Metoda:** 2 audyty Opus (read-only) na drzewie produkcyjnym `srcKopiaMaster` + dane gry `gra\data`.
**Legenda:** ✅ wpięte · 🟡 częściowo/dubel · ❌ brak.

---

## CZĘŚĆ 1 — ✅ GOTOWE ASSETY DESIGNERA, NIEWPIĘTE (mogę wpiąć — UX)

Te rzeczy designer już zrobił, leżą w `ui\icons\brand\`, ale kod ich NIE renderuje:

| Asset (gotowy) | Ile | Gdzie wpiąć w grze | Priorytet |
|---|---|---|---|
| **resources-map: `res-gold` `res-iron` `res-stone` `res-wood`** | 4 | **Panel kontekstu heksu** (`hexContextTooltip.ts`) — teraz surowce/plony to EMOJI+TEKST (🍞🔨💰🪵🪨), zero SVG; oraz panel surowców miasta (`cityPanel.ts` `resourceBrandKey` podmienia je na generyczne ikony tier) | **P0** |
| **terrain-\* (tier7): plains/hills/mountains/desert/water** | 5 | Tooltip/panel terenu heksu + legenda mapy — komplet 24/40 gotowy, **zero wywołań** w kodzie | **P1** |
| **menu-\*: save · credits · language · audio · controls · achievements · emblem-mini** | 7 | Ekran „Ustawienia" (`renderSettings` w `mainMenu.ts` — teraz same teksty+strzałki), zapis gry, ekran „O grze/Osiągnięcia" | **P2** |
| **`chip-order` (tier4)** | 1 | 🟡 dubel z `cp-order` (kod renderuje tylko cp-order) — decyzja: użyć albo usunąć z manifestu | P3 |

**Regres do dogrania (nie „niewpięty", brak pliku w produkcji):** `res-cattle.svg` jest w `gra\src`, ale **NIE MA go w `srcKopiaMaster`** → `resourceBrandKey` zwraca `res-cattle` dla bydła/owiec → w grze pusty/fallback. **[P1 — dograć]**

**Brakujące MAPY (blokują automatyczne wpięcie surowców mapy):** `resources-map-icon-map.json`, `menu-button-map.json` — NIE ISTNIEJĄ. Żeby wpiąć Część 1 pkt 1, trzeba stworzyć mapę surowców + helper `mapResourceIconSvg` (mały kod w `brandAssets.ts`, mój lane).

> **Wpięcie Części 1 = mój lane, gotów na „działaj".** Zakres: helper + mapa surowców mapy + render w hexContextTooltip/cityPanel + terrain w tooltipie heksu + ikony w ekranie ustawień.

---

## CZĘŚĆ 2 — ❌ ELEMENTY GRY BEZ GRAFIKI DESIGNERA (do dorobienia)

Pełna lista per domena (dokładne id/nazwy). To „wszystko co ma formę graficzną, a nie ma jeszcze grafiki".

### A. TECHNOLOGIE — ❌ 31 węzłów, ZERO ikon (całe drzewko nauki)
Brak mapy `tech-icon-map` i folderu `tech/`. Węzły:
Obróbka drewna · Garncarstwo · Murarstwo · Rolnictwo · Łowiectwo · Łucznictwo · Oswojenie zwierząt · Mistycyzm · Wymiana · Gospodarka wodna · Koło · Brązownictwo · Żegluga · Pismo · Religia · Jeździectwo · Wojskowość · Matematyka · Handel · Prawo (Kodeks) · Budownictwo · Waluta · Obróbka żelaza · Inżynieria · Oblężnictwo · Filozofia · Kodeks prawa · Drogi brukowane · Medycyna · Hutnictwo żelaza · Sztuka wojenna.

### B. CUDA ŚWIATA — ❌ 0 dedykowanych ikon (brak wszystkich)
Brak mapy `wonder-icon-map` i folderu `wonders/`. Aktywne (19):
piramidy · wielka_stela · wiszace_ogrody · wyrocznia · roquepertuse · stupa_sanchi · petra · hamonga · kolos · osada_aschaffenburg · ziggurat · mundo_perdido · terakotowa_armia · koloseum · dur_sharrukin · brama_narodow · palac_weiyang · yerkapi · posag_peruna.
Parkowane (epoka 4+): nalanda · angkor_wat · wielki_dzwon · mauzoleum_teodoryka · kopiec_grobowy.

### C. JEDNOSTKI NAZWANE — 🟡 ~67 bez własnej ikony (mają tylko ikonę KATEGORII)
`unit-icon-map.json` mapuje po **typie/roli** (unit-melee/archer/cavalry/siege/elite…), nie po nazwie. **DECYZJA MACIEJA:** jeśli kanon = „1 ikona per typ" → braków **0**. Jeśli „każda nazwana jednostka ma swoją ikonę" → do dorobienia (wybór):
- **Grecja:** Falanga (Hoplita), Hieros Lochos, Wojownik mykeński, Rydwan mykeński, Thorakites
- **Rzym/Ludy Morza:** Hastati, Triari, Sherden, Wojownik tyrreński, szekelesz, Legionarius, Evocati
- **Chiny:** Jeździec chiński, Kusznik, Hu Ben Wei, Halabardnik Shang, Rydwan Shang
- **Zulusi:** Impi, Izijula, uThulwana, iButho z iklwa
- **Inkowie:** Chaska (maczuga), Wojownik z toporem, Huaracoc (procarz), Estólica, Królewska Gwardia, Gwardzista z champi
- **Egipt:** Łucznik egipski, Rydwan egipski, khopesh, Medżaj, żelazny khopesh
- **Sumer:** Łucznik/Rydwan/Włócznik sumeryjski, Gwardia Królewska, Łucznik akadyjski, Mur tarcz
- **Celtowie:** Gaesatae, Soldurii, Rydwan celtycki, Miecznik galijski
- **Germanie:** framea, Berserker
- **Asyria:** Konnica lancowa/łucznicza, Łucznik asyryjski
- **Słowianie:** Drużynnik, Jeździec (drużyna)
- **Harappa:** Jeździec z oszczepnikami, Strażnik bram, Piechota induska, Garnizon
- **Hetyci:** Rydwan Kapadokijski, Piechota hetycka, Gwardia hetycka
- **Babilonia:** Gwardia Ishtar, Wojownik babiloński, Piechota neobabilońska
- **Fenicjanie:** Tyrski miecznik, Wojownik fenicki, Gwardia Tyr
- **Wspólne bez ikony:** Wojownik, Wojownik z mieczem i tarczą, Rydwan (woły/konny), Taran, Katapulta, Wieża oblężnicza

### D. EPOKI 4–10 — ❌ 7 ikon (przyszłość, v0.1 cap=3)
`epoch-icon-map` = kamien/braz/zelazo. Brak: 4 Klasyczna · 5 Średniowiecze · 6 · 7 · 8 · 9 · 10 Informacyjna.

### E. SUROWCE NA MAPIE — ❌ złoża bez ikony w `resources-map/`
Są tylko: salt, stone, wood, iron, gold, horses (6). Brak dla: **glina · bydło · owce · lama** (+ złoża: **miedź/cyna/ruda**, przetworzony **brąz/stal** jeśli mają być na heksie).
(`res-clay.svg`, `res-cattle.svg` istnieją w katalogu HUD, ale nie w `resources-map/` — render mapy ich nie widzi.)

### F. TEREN — ❌ typy/modyfikatory bez ikony
`terrain-*` = plains/hills/mountains/desert/water (5). Brak: **Morze vs Wybrzeże** (dane rozróżniają, asset tylko „water"), modyfikator **Rzeka**, modyfikator **Las**.

### G. ULEPSZENIA — 🟡 reuse-collision (zmapowane, ale dzielą ikonę)
20/20 zmapowanych, ale bez DEDYKOWANEJ ikony (idą przez reuse): **stadnina · glinianka · warzelnia_soli · tarasy · oboz_lowiecki · odlewnia_brązu · wyrąb**. Designer może chcieć osobne.

### H. Sub-nacja „Ludy Morza" — 🟡 bez ikony cyw (używa rosteru Rzymu).

---

## POKRYCIE PEŁNE (✅ nic do roboty)
Budynki **30/30**, Cywilizacje-typy **15/15**, HUD tier1-2 + chipy statusów **13/13**, panel miasta tier3-4-6, dyplomacja tier5, ustawienia kreatora, główne menu (8 używanych ikon).

---

## NAJWIĘKSZE LUKI (priorytet dla designera)
1. **Technologie (31) + Cuda (19–24) = całe domeny bez grafiki** — największa i najbardziej jednoznaczna luka (panel nauki + ikony/modele cudów).
2. **Jednostki nazwane (~67)** — najpierw **decyzja: ikona per typ czy per nazwa**.
3. **Reszta renderu mapy:** epoki 4–10 (7), złoża mapy (glina/bydło/owce/lama…), teren Morze/Wybrzeże + Rzeka/Las.

## NASTĘPNE KROKI
- **UX (ja, na „działaj"):** wpięcie Części 1 — surowce mapy (res-gold/iron/stone/wood + mapa + helper) w panelu heksu i mieście, terrain-* w tooltipie, ikony w ekranie ustawień, dogranie `res-cattle.svg`.
- **Designer:** Część 2 wg priorytetu (najpierw decyzja o jednostkach).
- Gdy przyślesz **swój pakiet zmian designera** — nałożę go i zaktualizuję to zestawienie.
