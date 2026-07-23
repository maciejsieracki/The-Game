# DECYZJA — imiona władców per cywilizacja × epoka (ZAAKCEPTOWANE 2026-07-23)

Maciej zaakceptował w całości (2× „Akceptuję całość"): 15 cywilizacji × 4 epoki = **60 imion**.
Wchodzi do `gra/data/civs.json` jako pole `wodzowie: {kamien, braz, zelazo, antyk}` per cywilizacja.
Antyk = na zapas (gra kończy dziś na Żelazie); fallback wyświetlania: antyk→zelazo→braz→kamien.
UI: imię przy medalionie władcy (karta dowódcy bitwy, preBattle, dyplomacja) — razem z portretami
(paczka PORTRETY-WLADCOW; portrety Żelaza i Antyku — TODO po stronie Macieja/Gemini/Design).

| ikonaId | Kamień | Brąz | Żelazo | Antyk |
|---|---|---|---|---|
| grecy | Minos | Agamemnon | Leonidas | Aleksander Wielki |
| rzymianie | Romulus | Numa Pompiliusz | Scypion Afrykański | Juliusz Cezar |
| chinczycy | Huang Di | Yu Wielki | Qin Shi Huang | Han Wudi |
| inkowie | Manco Cápac | Wirakocza Inka | Pachacuti | Túpac Inca Yupanqui |
| zulusi | Zulu kaMalandela | Senzangakhona | Czaka | Cetshwayo |
| egipt | Narmer | Chufu | Ramzes II | Kleopatra VII |
| sumerowie/sumer | Alulim | Gilgamesz | Ur-Nammu | Szulgi |
| celtowie | Ambigatos | Brennus | Wercyngetoryks | Boudika |
| germanie | Mannus | Ariowist | Arminiusz | Alaryk I |
| harappa | Starszy z Mehrgarh | Kapłan-Król z Mohendżo-Daro | Radża Dholaviry | Aśoka |
| hetyci | Labarna I | Hattusili I | Suppiluliuma I | Suppiluliuma II |
| slowianie | Lech | Krak | Samo | Mieszko I |
| babilonia | Sumu-abum | Hammurabi | Nabuchodonozor II | Nabonid |
| asyria | Puzur-Aszur I | Tiglat-Pileser I | Aszurbanipal | Sennacheryb |
| fenicjanie | Agenor | Hiram I | Dydona-Elissa | Hannibal Barkas |

Uwagi z akceptacji:
- Rzym-Kamień = Romulus spójny z portretem (wilcza czapa).
- Asyria-Antyk: Sennacheryb historycznie wcześniejszy niż Aszurbanipal — świadomie (ikoniczność > chronologia); alternatywa odrzucona: Aszur-uballit II.
- Kobiety: Dydona-Elissa (Żelazo), Kleopatra VII, Boudika (Antyk).

---

# DECYZJE BATCHA 2026-07-23 (wieczór, dopisek)

- **Wielka Kuźnia + Lazaret: USUNIĘTE Z PLANÓW NA STAŁE** (decyzja Macieja) — nie odparkowujemy; zamiast tego w przyszłości projektujemy NOWE budynki kolejnych epok od zera (przyszłe zlecenie dla Claude Design: lista + infografiki).
- **Batch 14 tematów zlecony do samodzielnej realizacji** (1,2,3,4,5,6,7,8,9,10,11,15,21,23 z listy sesji; po jednym subagencie per temat, trudne=Fable: #2 drzewko, #15 Ludy Morza).
- **Lista NA PÓŹNIEJ** (nie ruszać bez sygnału): 13 glina/ruda→brąz ilościowy · 14 balans Fenicjan ×11,4 · 20 większe plansze bitwy (czarne tło→rysowany ląd) · 22 muzyka Brązu/Żelaza z plików · zewnętrzne: 16 Cuda (Design) · 17 portrety Żelaza/Antyku (Maciej/Gemini) · 18 playtest Macieja · 19 promocja KANON (sesja lokalna).
- **NA PÓŹNIEJ (dopisek z #10):** niespójne `Bonus vs Mount %` u innych jednostek Typ=Spearman (szekelesz=25, Strażnik bram Harappy=0, Piechota induska=0, Piechota hetycka=0 — reguła świata mówi 50) — decyzja ABC: celowy balans elit czy przeoczenie.
- **USTALENIE #21 (restrukturyzacja drzewka):** 6/9 decyzji z planu D1–D9 (DRZEWKO-TECH-ANALIZA-CIV.md) jest JUŻ WDROŻONE w tech.json (D4,D5,D6,D7,D8,D9 + rozszerzone D2), łącznie z przesunięciem „Hutnictwa żelaza" na T3 Brązu z awansem — mimo że dokumenty mówiły „nierozstrzygnięte". OTWARTE do ABC: D1 (Łucznictwo prereq Łowiectwo) i D3 (nowy tech-pomost „Wytop rudy" — dziś inny mechanizm daje ten sam efekt). Drobiazg: Uwagi Astronomii mówią „Matematyka+Mistycyzm", dane mówią „Matematyka+Religia". Rekomendacja: uznać plan za zastąpiony stanem faktycznym, D1/D3 zapytać przy okazji.
- **DECYZJE ABC 2026-07-23 (wieczór 2):** D1=A (Łucznictwo←Łowiectwo) · D3=zamknięte bez pomostu (obowiązuje obecna zasada progresji badań — zweryfikować i udokumentować) · SPEAR=bonus vs Mount 50 dla WSZYSTKICH jednostek z włócznią (kryterium: broń, nie tylko Typ) · HANDEL-UMOWA=B (trasy handlowe WYMAGAJĄ traktatu Umowa Handlowa — zmienia HANDEL-Q1/Q8!) · CUDA-AI=A (AI buduje cuda) · FENICJA=B (×11,4 zostaje — tożsamość handlowa) · BRAZ-ILOSC=B przygotowawczo: NA RAZIE tylko licznik wolumenów surowców w magazynach (bez zmian mechaniki; przyszłość: część surowców do budowy, część jako dostęp).
