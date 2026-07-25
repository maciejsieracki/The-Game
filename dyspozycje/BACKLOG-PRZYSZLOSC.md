# BACKLOG — rzeczy czekające na przyszłość
Aktualizacja: 2026-07-25. Nic z tej listy nie jest w toku. Wracamy do tematu **dopiero na sygnał Macieja**.

**Do wdrożenia z dzisiejszej rundy decyzji budynkowych** (decyzje zapisane, kod jeszcze nie dotknięty —
pełny opis i kolejność w `DECYZJE-BUDYNKI-2026-07-25.md` §„Skrót statusu wdrożenia"): nowy budynek Baszta
(+100% obrony) · siatka Prawa (Pałac/Dom Starszyzny/Dwór Zarządcy/Pretorium/Trybunał/Sąd) · reguła
stała-wartość-per-tier dla łańcuchów „w górę" · lokalizacja Pałac=tylko stolica /
Dom Starszyzny+Dwór Zarządcy+Pretorium=tylko regiony · osiem grup dziedzinowych w panelu miasta ·
usunięcie Ratusza i Karawanseraju · utrzymanie zróżnicowane (Pytanie 19).

## A. Zaparkowane świadomą decyzją właściciela

| Temat | Decyzja | Warunek powrotu |
|---|---|---|
| **Awans budynków przez poziomy 4–10** | Zasada „1 poziom budynku = 1 epoka", każdy poziom z innymi surowcami. Poziomów na zapas NIE projektujemy. | Powstanie epoki 4 (klasycznej) |
| **Wielka Kuźnia** | Parametry przyjęte z góry (mnożnik 23, upgrade Kuźni żelaza). Budynek ma `epokaWejscia: 4` → dziś nieosiągalny. | Epoka klasyczna |
| **Weterani jednostek** | „Kwestie weteranów załatwimy później" — osobny system doświadczenia bojowego, niezależny od dwóch ścieżek ulepszeń z budynków. | Sygnał Macieja |
| **Hastati** (`gra/src/render/hastati-opus5.ts`, 92 mesh / 1378 tri) | Model gotowy, **niewpięty** — jednostka epoki Żelaza spoza bieżącego zakresu. | Prace nad epoką Żelaza |
| **Mock-up zdobycia miasta** | „Stary mock-up trzeba będzie dać do designera." | Decyzja o odświeżeniu UI zdobycia |
| **Ranking Mocy** | `C-RANK-Q1 = B` — bez zmian na teraz. | Sygnał Macieja |
| **8 pozostałych łańcuchów budynków** (Odlewnia, Port, Świątynia, Biblioteka→Akademia, Mury→Cytadela, Koszary→Akademia wojskowa, Kuźnia→Wielka Kuźnia, Spichlerz) | Ta sama zasada „1 poziom = 1 epoka" — nie projektujemy na zapas. | Kolejne epoki |
| **Ratusz** (usunięty całkowicie 2026-07-25 — zadanie handel/Ratusz, patrz `KANAL-PRACA.md`) | Maciej: „Ratusz będzie kolejnym etapem rozwoju budynków po Pretorium, ale dopiero w średniowieczu." Wraca jako kolejny szczebel łańcucha administracji lokalnej (Dom Starszyzny → Dwór Zarządcy → Pretorium → **Ratusz**), z wartością Prawa do ustalenia wtedy — NIE reużywać starych 35/27/22 z `prawo_ratusz` bez nowej decyzji ABC. | Epoka średniowiecza |

## B. Dług techniczny — do zrobienia, ale nie pilne

| # | Temat | Skąd wiadomo |
|---|---|---|
| 1 | **Martwe pole `odblokowuje`** w murach/forcie/warsztacie — flagi ustawia hardkod `id === 'mury'` w `main.ts:2016`; pola nie ma nawet w typie `BuildingDef`. Ryzyko: ktoś zmieni wartość w danych sądząc, że steruje logiką. | Audyt martwych parametrów, PYTANIE 21 |
| 2 | **Wielka Kuźnia — niespójna kategoria** („Produkcja" bez „+Wojsko", jako jedyna kuźnia) + brak `koszt_surowce` + brak adnotacji „PARKOWANIE". | Audyt, PYTANIE 22 |
| 3 | **Martwy import `buildingEffectAtLevel`** w `cityPanel.ts:64` — nigdy niewywoływany. | Raport subagenta linearyzacji |
| 4 | **Martwa funkcja `formatYieldLine`** w `cityPanel.ts:4584` — nigdzie niewywoływana. | Audyt |
| 5 | **`gra/src/battle/facing.ts` — martwy kod** ze starej siatki heksów. Żywy system to czterokierunkowy `Dir`/`relativeHit` w `battleScene.ts:234-319`. | Audyt sterowania bitwą |
| 6 | **`suppressed` zdublowane** — pole w danych ORAZ hardkodowany `Set(['teatr'])` w `building-upgrades.ts:17`. | Audyt |
| 7 | **`wymagania` (tekst) nigdy nie jest parsowane jako logika** — czysto opisowe, choć wygląda na warunek. | Audyt |
| 8 | **Porażki testów do wyczyszczenia:** `akwedukt-popcap-test.cjs`, `auto-manage-test.cjs`, `growthmult-compound-test.cjs` — po jednej porażce (próg wzrostu populacji, dopasowanie kategorii auto-budowy). | Raport subagenta linearyzacji |
| 9 | **`nazwyPoziomow` dłuższe niż `maksPoziom`** w danych (np. Targowisko ma 10 nazw przy maks. 3). UI już przycina wyświetlanie, ale dane zostają rozdmuchane. | Raport subagenta linearyzacji |

## C. Zadania gameplayowe czekające na decyzję
Pełne pytania ABC: **`dyspozycje/PYTANIA-OTWARTE.md`**
- ~~**PYTANIE 18** — profil Pretorium po sprzątnięciu~~ — **ODPOWIEDZIANE 2026-07-25** (Kultura 5 pkt/turę,
  obrona+mnożnik do zera; szczegóły `DECYZJE-BUDYNKI-2026-07-25.md` §8)
- ~~**PYTANIE 19** — utrzymanie budynków: zróżnicowane czy płaskie~~ — **ODPOWIEDZIANE 2026-07-25 = A**
  (zróżnicowane z danych; szczegóły `DECYZJE-BUDYNKI-2026-07-25.md` §8)
- **PYTANIE 20** — Targowisko: co z zamierzonym bonusem handlowym (rekomendacja A, wciąż OTWARTE)
- **PYTANIE 21** — martwe pole `odblokowuje` (szkic)
- **PYTANIE 22** — Wielka Kuźnia: kategoria + parkowanie (szkic)
- **PYTANIE 23** — odznaki ulepszeń na żetonach jednostek: szczegóły prezentacji (szkic)

## D. Pomiary i weryfikacja
| Temat | Stan |
|---|---|
| **Pomiar FPS** przed dokładaniem kolejnych epok (decyzja 14A) | Odłożony do zakończenia bieżącej fali refaktorów — pomiar w trakcie przebudowy ekonomii byłby niemiarodajny |
| **Audyt Civpedii** pod kątem martwych obietnic parametrów | W toku (subagent) |
| **Playtest po wdrożeniu ścieżek ulepszeń** | Do zaplanowania — zmiana dotyka balansu każdej jednostki |

## E. Zasady zapamiętane (nie do zrobienia, do przestrzegania)
- **Zgodność historyczna = warunek strategiczny.** Dwa powracające błędy: *metal tam, gdzie nie mógł istnieć* oraz *oznaczenia rangi na zwykłym żołnierzu*.
- **Parytet AI** — każda zmiana dla gracza musi działać identycznie dla AI, bez warunków na `ownerId`.
- **Nie projektujemy na zapas.**
- **Modele:** wszystkie prace zlecane subagentom **Sonnet 5**; Opus 5 / Fable 5 tylko za wyraźną zgodą właściciela.
- **Każda prośba właściciela trafia do `REJESTR-PROSB-I-ZADAN.md`** — narracja w czacie nie jest śledzeniem.
- **Zakaz otwierania nowych wątków pytaniami (Maciej, 2026-07-25).** Wolno dopytywać tylko o wątek AKTUALNIE
  prowadzony; problemy znalezione przy okazji trafiają cicho do `PYTANIA-OTWARTE.md`, bez wzmianki w czacie.
  Pełny zapis: `CLAUDE.md` §„Jak pracować z właścicielem" pkt 2, `PAMIEC-ROBOCZA-CIV.md` §1a.
- **Każda liczba ma nazwany parametr, jednostkę i kontekst (Maciej, 2026-07-25).** Zakaz „baza 16"/„daje 35" bez
  powiedzenia czego dotyczy. Pełny zapis: `CLAUDE.md` §„Jak pracować z właścicielem" pkt 3, `PAMIEC-ROBOCZA-CIV.md` §1a.
