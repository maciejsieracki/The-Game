# Specyfikacja ikon dla Figmy — The Game (Warstwa 1)

**Data:** 2026-06-26  
**Decyzje Macieja:** styl **3C** (minimal line) · paleta **1B** · chipy **6C** (ikona + etykieta tekstowa)  
**Cel:** Figma **nie zgaduje** — każda ikona ma ID, nazwę PL i **dokładny opis tego, co narysować**.

**Powiązane:** [`DECYZJE-WARSTWA1-MACIEJ.md`](DECYZJE-WARSTWA1-MACIEJ.md) · [`FIGMA-CO-WYKORZYSTUJEMY.md`](FIGMA-CO-WYKORZYSTUJEMY.md)

---

## Reguły globalne (obowiązkowe)

| Reguła | Wartość |
|--------|---------|
| Styl | **Minimal line** — stroke 1.5px (24px) / 2px (40px), zaokrąglone końce, **bez wypełnień** (fill: none) |
| Kolor domyślny | `currentColor` — w HUD złoto `#e8d88a`, nauka `#5a9bd4`, zagrożenie `#c84040` |
| Rozmiary eksportu | **24×24** (chipy HUD, pasek miasta) · **40×40** (toolbar mapy, rail panelu miasta) |
| Format | SVG, viewBox kwadratowy, jedna warstwa stroke |
| Etykieta 6C | Ikona **nie zastępuje** tekstu — obok zawsze etykieta PL (patrz kolumna „Etykieta chipu”) |
| Zakaz | Losowe metafory, inne przedmioty niż w kolumnie „Co narysować”, emoji jako final |

**Referencja kodu (obecny stan gry):** `gra/src/ui/hud.ts`, `mapToolbarHud.ts`, `cityPanel.ts`, `icons/scienceOwlIcon.ts`

---

## Tier 1 — Zasoby imperium (HUD + górny pasek panelu miasta)

Te ikony muszą być **spójne wizualnie** — ten sam kształt w HUD mapy i w panelu miasta.

| ID | Nazwa PL | Co narysować (OBOWIĄZKOWO) | Etykieta chipu 6C | Gdzie w grze |
|----|----------|----------------------------|-------------------|--------------|
| `res-food` | Żywność | **Kromka chleba** — owalna bułka / slice z widoczną skórką u góry (jak plaster chleba). **Nie** jabłko, **nie** zboże jako główny symbol | Żywność | HUD · panel miasta (zapasy) · rail Spichlerz |
| `res-work` | Praca | **Młotek** — trzonek + głowica młotka, lekko pochylony. **Nie** kilof, **nie** koło zębate | Praca | HUD · panel miasta (pula pracy) · rail Praca · toolbar Budowa |
| `res-treasury` | Skarbiec | **Sakiewka monet** lub **pojedyncza moneta** z symbolem — preferowana sakiewka z wiązaniem u góry | Skarbiec | HUD · panel miasta · rail Handel |
| `res-science` | Badania / Nauka | **Sowa z beretem** na gałęzi — jak istniejąca ikona w kodzie (`scienceOwlIcon.ts`): sowa profil, oczy, dziób, beret akademicki, ołówek obok. **Nie** mikroskop, **nie** sam napis „Nauka” zamiast ikony | Badania | HUD · panel miasta · toolbar Badania |
| `res-culture` | Kultura | **Maski teatralne** — para masek (komedia + tragedia) lub jedna maska z uśmiechem i smutkiem | Kultura | HUD · panel miasta · rail Kultura |
| `res-religion` | Religia | **Świątynia / pagoda** — dach warstwowy + filary (symbol wiary państwowej). **Nie** krzyż zachodni jako domyślny | Religia | HUD · panel miasta · rail Religia |
| `res-population` | Ludność | **Dwie sylwetki ludzi** (głowa + ramiona) obok siebie — symbol populacji | Ludność | HUD · panel miasta (lokalna) |
| `res-influence` | Wpływ | **Lilia heraldyczna (fleur-de-lis)** — trzy płatki, styl heraldyczny | Wpływ | HUD (środek — Wpływ) |
| `res-settlements` | Osiedla | **Sylwetka miast** — 2–3 budynki o różnej wysokości (silhouette) | Osiedla | HUD (prawy blok) |

---

## Tier 2 — Toolbar mapy (lewy pasek, 40×40)

| ID | Nazwa PL | Co narysować | Tooltip w grze |
|----|----------|--------------|----------------|
| `tb-cities` | Miasto | **Partenon / kolumny** — klasyczna fasada z kolumnami (symbol miasta-grodu) | Miasto — lista i produkcja |
| `tb-science` | Badania | **`res-science`** — ta sama sowa (instancja komponentu) | Badania — postęp i lista |
| `tb-diplomacy` | Dyplomacja | **Uścisk dłoni** — dwie dłonie w uścisku (symbol negocjacji) | Dyplomacja — lista cywilizacji |
| `tb-army` | Wojsko | **Skrzyżowane miecze** — dwa miecze w X | Wojsko — lista armii |
| `tb-build` | Budowa ulepszeń | **Młotek** — **`res-work`** (ta sama instancja) | Budowa ulepszeń |

---

## Tier 3 — Rail panelu miasta (pionowy pasek zakładek, 40×40)

Każda zakładka = przycisk z ikoną + tooltip. Aktywna = obrys złoty (decyzja 5C).

| ID | Tab ID | Co narysować | Tooltip |
|----|--------|--------------|---------|
| `cp-buildings` | budowa | **Partenon / kolumny** — jak `tb-cities` | Budowa — dostępne i w mieście |
| `cp-recruit` | rekrutacja | **Skrzyżowane miecze** — jak `tb-army` | Jednostki do rekrutacji |
| `cp-granary` | spichlerz | **Kromka chleba** — jak `res-food` | Spichlerz |
| `cp-trade` | handel | **Sakiewka / moneta** — jak `res-treasury` | Podział handlu i zamożność |
| `cp-labor` | praca | **Młotek** — jak `res-work` | Podział pracy — budynki i ulepszenia |
| `cp-order` | porzadek | **Waga sprawiedliwości** — klasyczna waga z dwiema misami | Społeczeństwo i porządek |
| `cp-health` | zdrowie | **Kaduceusz** — laska z wężami (symbol medycyny). Jak w kodzie `CADUCEUS_SVG` | Zdrowie miasta |
| `cp-culture` | kultura | **Maski teatralne** — jak `res-culture` | Kultura — granice i progi |
| `cp-religion` | religia | **Świątynia** — jak `res-religion` | Religia — wiara i szerzenie |

---

## Tier 4 — Chipy pomocnicze (panel miasta, dyplomacja, szczegóły)

Mniejsze ikony (24×24), ten sam styl line.

| ID | Nazwa PL | Co narysować | Gdzie |
|----|----------|--------------|-------|
| `chip-manpower` | Rekruci | **Pojedynczy miecz** lub skrzyżowane miecze (mniejsza wersja `tb-army`) | Pasek miasta — Manpower |
| `chip-order` | Porządek | **Waga** — jak `cp-order` | Chip % porządku |
| `chip-happiness` | Szczęście | **Uśmiechnięta twarz** — prosty smiley line-art | Sekcje porządek / religia |
| `chip-garrison` | Garnizon | **Tarcza** — tarcza herbowa | Porządek — garnizon |
| `chip-warning` | Ostrzeżenie | **Trójkąt z wykrzyknikiem** | Alerty (głód armii, rebelia) |
| `chip-rebellion` | Rebelia | **Płomień** — ogień / płomień | Stan rebelii |
| `chip-death` | Minusy / śmierć | **Czaszka** — styl line, nie realistyczna | Zdrowie minusy |
| `chip-heart` | Plusy / zdrowie | **Serce** — line heart | Zdrowie plusy |
| `chip-grain` | Spichlerz (bonus) | **Kłos zboża** — **tylko** jako bonus budynku Spichlerz, **nie** jako główna żywność | Chipy spichlerza |
| `chip-crate` | Bufor / magazyn | **Skrzynia / beczka** | Bufor żywności |
| `chip-map` | Okolica / mapa | **Złożona mapa** — prostokąt z linią brzegu | Okolica · kultura granice |
| `chip-star` | Bonus specjalny | **Gwiazda** 4- lub 5-ramienna | Bonusy religii |
| `chip-trend-up` | Przyrost | **Strzałka w górę** z opcjonalnym wykresem | Statystyki handlu |

---

## Tier 5 — Dyplomacja i HUD meta

| ID | Nazwa PL | Co narysować | Etykieta chipu |
|----|----------|--------------|----------------|
| `dip-alliance` | Sojusz | **Uścisk dłoni** — jak `tb-diplomacy` | Sojusz |
| `dip-pact` | Pakt | **Gołąb z gałązką** — symbol pokoju | Pakt |
| `dip-war` | Wojna | **Skrzyżowane miecze** — czerwony akcent dozwolony | Wojna |
| `dip-war-strip` | Wojna z… | **Skrzyżowane miecze** (mniejsze) + nazwa cywilizacji tekstem | — |
| `ui-menu` | Menu | **Trzy poziome kreski** (hamburger) | Menu |
| `ui-close` | Zamknij | **Krzyżyk X** | — |
| `ui-play` | Wznów | **Trójkąt play** | Wznów |
| `ui-pause` | Wstrzymaj | **Dwie pionowe kreski** | Wstrzymaj |
| `ui-end-turn` | Zakończ turę | **Trójkąt w prawo** + opcjonalnie tekst | Zakończ turę |
| `ui-check` | Sukces / zbudowano | **Ptaszek ✓** | — |
| `ui-lock` | Zablokowane | **Kłódka** | — |
| `ui-denied` | Odrzucono | **Krzyżyk w kółku** | — |
| `ui-accepted` | Zaakceptowano | **Ptaszek w kółku** | — |

---

## Tier 6 — Presety pracy pól / okolica (opcjonalne v1, ale w spec)

Używane w suwakach okolicy miasta — spójne z zasobami.

| ID | Preset | Co narysować |
|----|--------|--------------|
| `field-food` | Żywność | **Kłos zboża** (tu zboże OK — chodzi o pola uprawne) |
| `field-production` | Produkcja | **Młotek** — `res-work` |
| `field-tax` | Podatki | **Moneta** — `res-treasury` |
| `field-balanced` | Zrównoważone | **Waga** — `cp-order` |

---

## Tier 7 — Teren (minimapa / legenda — niższy priorytet)

| ID | Teren | Co narysować |
|----|-------|--------------|
| `terrain-plains` | Równiny | Faliste linie horyzontu |
| `terrain-hills` | Wzgórza | Trzy pagórki |
| `terrain-mountains` | Góry | Szczyt z konturem |
| `terrain-desert` | Pustynia | Wydma / słońce minimal |
| `terrain-water` | Woda | Fala |

---

## Mapowanie: stary emoji → nowa ikona

| Było (emoji) | ID Figmy |
|--------------|----------|
| 🍞 / chleb SVG | `res-food` |
| 🔨 | `res-work` |
| 💰 | `res-treasury` |
| Nauka (tekst) / sowa | `res-science` |
| 🎭 | `res-culture` |
| 🛕 | `res-religion` |
| 👥 | `res-population` |
| ⚜ | `res-influence` |
| 🏘 | `res-settlements` |
| 🏛 | `tb-cities` / `cp-buildings` |
| 🤝 | `tb-diplomacy` / `dip-alliance` |
| ⚔ | `tb-army` / `cp-recruit` / `chip-manpower` |
| ⚖ | `cp-order` / `chip-order` |
| Kaduceusz SVG | `cp-health` |
| ☰ | `ui-menu` |
| ✕ | `ui-close` |

---

## Komponenty Figma (strona 02 Icons)

Utwórz **komponenty master** z wariantami rozmiaru:

```
Icon / res-food / 24
Icon / res-food / 40
… (dla każdego ID Tier 1–5)
```

**Reguła instancji:** `tb-build`, `cp-labor`, `field-production` → **instancja** `res-work`, nie osobny rysunek.

---

## Checklist odbioru (lane UI → Opus / Maciej)

- [ ] Wszystkie ID Tier 1–5 narysowane w 24 i 40 px
- [ ] Praca = młotek wszędzie gdzie w tabeli
- [ ] Żywność główna = kromka chleba (nie kłos)
- [ ] Nauka = sowa z beretem (spójna z kodem)
- [ ] Chipy HUD mają **etykietę tekstową** obok ikony (6C)
- [ ] Export SVG: stroke-only, viewBox 0 0 24 / 0 0 40
- [ ] Brak wypełnień poza akcentem „wojna” / „rebelia” (max 15% opacity)

---

*Spec append-only · zmiana semantyki ikony = decyzja Macieja ABC*
