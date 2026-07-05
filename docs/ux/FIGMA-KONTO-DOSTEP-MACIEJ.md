# Figma — konto, token, co blokuje grupy

**Dla:** Maciej (decyzja operacyjna)  
**Data:** 2026-06-26  
**Plik kanon:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu

---

## Krótko: masz rację, ale są **dwa** różne problemy

| Problem | Co to znaczy | Kto dotknięty |
|---------|--------------|---------------|
| **1. Plan Starter** | max **3 strony** w pliku · limit **MCP** (~kilka wywołań/mies. na Starter) | agenci w Cursorze (automat) |
| **2. Brak tokena / MCP w sesji** | subagenci **grup A–E** zwykle **nie mają** podłączonego Figma MCP — tylko Twój Cursor z pluginem | grupy w Task / osobne czaty |

**Token nie leży w repozytorium Civ** — to poprawne (bezpieczeństwo). Łączy się **w Cursorze na Twoim koncie** albo praca idzie **ręcznie w przeglądarce** (bez tokena).

---

## Co grupy **mogą** bez tokena

Grupy **nie muszą** mieć MCP. Mogą:

1. Otworzyć link pliku w **figma.com** (przeglądarka).
2. Dostać od Ciebie uprawnienie **Can edit** (zaproszenie e-mailem).
3. Układać frame’y ręcznie: baseline PNG + komponenty ze strony 1 DS.

**Eksport PNG z repo** (np. Grupa C ma już 7 plików w `figma/grupa-C/export/`) → w Figmie: **Place image** / import warstwy.

---

## Test MCP (2026-07-01 · sesja MASTER)

| Wywołanie | Wynik |
|-----------|--------|
| `whoami` | ✅ OK — maciej.sieracki@gmail.com · plan **Starter** · seat Full |
| `get_metadata` (plik kanon) | ❌ **Rate limit** — „You've reached the Figma MCP tool call limit on the Starter plan” |

**Wniosek:** logowanie OK · **limit odczytu MCP wyczerpany** (~6/mies. na Starter). `whoami` nie liczy się do limitu — stąd wrażenie „Figma działa”, ale agent nie czyta pliku.

**Bezpieczna ścieżka bez Pro:** layout w **figma.com** (przeglądarka) · export PNG → repo · MCP niepotrzebne.

**Po upgrade Pro Full:** MCP do ~200 odczytów/dzień · sensowne na sprint Warstwy 1 (~80 zł/mies.).

---

- Automatyczne „agent wpisuje frame’y przez MCP” — **limit wyczerpany** (Grupa C melduje: STOP sync MCP).
- 8 stron 00–07 — **niemożliwe**; mamy mapowanie na **3 strony** → [`FIGMA-LIMIT-3-STRONY.md`](FIGMA-LIMIT-3-STRONY.md).
- Lane UI kończy DS (Variables, komponenty, ikony) — na Starter wolno, ale **ręcznie w UI** lub oszczędnie MCP.

---

## Rekomendacja (decyzja operacyjna — bez ABC gameplay)

### Minimum żeby ruszyć (Starter, bez dopłaty)

1. **Ty** kończysz / delegujesz lane UI **stronę 1 · Design System** w pliku (ręcznie w Figmie).
2. **Zapraszasz** edytorów grup (maile) do pliku DS v1 — rola **Editor**.
3. Grupy robią layout **w przeglądarce** — raportują w `figma/grupa-*/RAPORT-FIGMA.md`.
4. MCP w Cursorze **tylko u Ciebie** (MASTER) — oszczędnie, reszta ręcznie.

**Wada:** wolniej, limit 3 stron, mało automatyzacji.

### Docelowo (polecane) — konto **Professional**

| Co daje | Po co |
|---------|--------|
| Więcej stron / plików | sensowny podział DS + ekrany |
| Wyższe limity API / MCP | agenci lane UI mogą znów syncować |
| Variables, Dev Mode pełniej | export tokenów do gry |

**Orientacyjnie:** Figma Professional ~**15 USD / edytor / miesiąc** (sprawdź aktualny cennik na figma.com).

**Po upgrade:** lane UI melduje **GOTOWE 00–02** → grupy wchodzą w layout (strona 2 i 3 wg [`FIGMA-LIMIT-3-STRONY.md`](FIGMA-LIMIT-3-STRONY.md)).

---

## MCP w Cursorze (token / logowanie) — krok po kroku

Tylko **Ty** (Maciej), w **Cursor Desktop**:

1. **Settings** → **MCP** (lub Features → MCP).
2. Włącz serwer **Figma** (`plugin-figma-figma`).
3. **Connect** / **Sign in** → logowanie kontem Figma (u Was: `maciej.sieracki@gmail.com`).
4. Test w czacie MASTER: agent może wywołać `whoami` w Figma MCP.

**To nie jest plik w projekcie** — nie szukaj `FIGMA_TOKEN` w folderze Civ.

Opcjonalnie (skrypty REST, nie MCP):  
Figma → **Settings** → **Security** → **Personal access tokens** → wygeneruj (tylko jeśli lane UI pisze własne skrypty API).

---

## Zaproszenie grup do pliku

1. Otwórz https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu  
2. **Share** → wpisz e-mail członka grupy → **Can edit**  
3. Wyślij im link + [`KOMUNIKATY-FIGMA-GRUPY-A-E.md`](KOMUNIKATY-FIGMA-GRUPY-A-E.md) (zaktualizowane: strony 1–3, nie 00–07)

Grupy **nie potrzebują** Cursor MCP — wystarczy Figma w przeglądarce.

---

## Plan B (gdy nie upgrade teraz)

Grupa **C** już zrobiła **7 PNG + HTML** w repo (`figma/grupa-C/export/`). Inne grupy mogą:

1. Zrobić to samo lokalnie (HTML/PNG jak baseline).
2. Ty lub lane UI **importuje** do Figmy ręcznie Place image.
3. Wdrożenie w grze może iść z **export PNG/SVG** nawet przy słabej synchronizacji cloud.

Figma cloud = **kanon wizualny**; repo `docs/ux/figma/` = **backup i kontrola**.

---

## Status blockera (aktualizacja)

| Blocker | Rozwiązanie |
|---------|-------------|
| Brak DS (00–02) | lane UI / Ty — strona 1 w pliku |
| Starter 3 strony | [`FIGMA-LIMIT-3-STRONY.md`](FIGMA-LIMIT-3-STRONY.md) |
| MCP limit | upgrade **lub** praca ręczna w Figmie |
| Grupy bez tokena | **Share → Can edit** — praca w przeglądarce |
| Grupa A czeka | nadal do **GOTOWE 00–02** (strona 1 DS) |
| **Grupa D (2026-07-01)** | 🟡 dip-* ✅ w pliku · frame’y 0/5 · **MCP limit** · meldunek w STATUS-FIGMA § Inbox |
| **Grupa E (2026-07-01)** | ⏳ spec+baseline 6/6 ✅ · frame’y 0/6 · **MCP ✅** (korekta: `plugin-figma-figma`) · meldunek w STATUS-FIGMA § Inbox |

---

## Wiadomość do wklejenia (lane UI / grupy)

```
BLOCKER Figma — wyjaśnienie:

1. Token MCP jest tylko na koncie Macieja w Cursorze — grupy pracują
   w pliku Figmy w PRZEGLĄDARCE po zaproszeniu Can edit (bez tokena).

2. Plan Starter = max 3 strony + limit automatycznego MCP.
   Docelowo: upgrade Figma Professional (decyzja Macieja).

3. Do startu layoutu grup nadal potrzebna strona 1 · Design System
   (Variables + Components + Icons) — sygnał GOTOWE 00–02.

4. Tymczasem: eksport PNG z docs/ux/figma/grupa-*/export/ można
   importować ręcznie (Place image) — przykład: Grupa C 7/7.

Link pliku: https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu
Mapa 3 stron: docs/ux/FIGMA-LIMIT-3-STRONY.md
```

---

*Operacyjne · nie wymaga ABC gameplay Macieja — chyba że wybierze upgrade vs czekać na Starter*
