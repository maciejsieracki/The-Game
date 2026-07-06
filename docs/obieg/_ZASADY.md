> ⛔ NIEAKTUALNE OD 2026-07-06 — NIE STOSUJ TEGO PROCESU.
> Obowiązujący obieg: dyspozycje/START-TU.md → dyspozycje/OBIEG-KOMUNIKACJI-2026-07-06.md
> → dyspozycje/ROLE-I-ZAKRESY-2026-07-06.md. Kanał pracy: dyspozycje/_handoff/KANAL-PRACA.md.
> Wersje/md5 wyłącznie w dyspozycje/WERSJE.md. Roboczą publikuje tylko INTEGRATOR (Cowork);
> kanon/finalną tylko Grupa G (Cursor) z pakietu DO-KANONU. Zasada: TYLKO DO PRZODU (zero restore).
> Treść poniżej = HISTORIA (kontekst), nie instrukcja do wykonania.

# ⚙️ ZASADY OBIEGU — The Game (Civ)

> **Czytaj na starcie każdego czatu.** Ten plik = jedyne źródło zasad: kto czym jest, jak płynie praca, gdzie się komunikujemy.
> **Role (KANON 2026-06-30):** [`ROLE-2026-06-30.md`](ROLE-2026-06-30.md) · Cała gra → `docs/ROADMAP.md`.

---

## 1. Cztery role (jednoznacznie)

| Rola | Kto / model | Co robi | Edytuje `main.ts`? |
|---|---|---|---|
| **Maciej** | człowiek | Decyzje gameplay (ABC) + playtest finalnej | NIE |
| **Grupy A–E** | Composer 2.5 (czaty tematyczne) | Cała praca deweloperska modułów + pytania ABC do Macieja | NIE |
| **Integrator** (Grupa F) | Composer 2.5 (osobny czat) | Wpina `main.ts`, bramka, publish **ROBOCZA** + PLAYTEST | **TAK — jedyny** |
| **Master Orkiestrator** | hub | Dyspozycje F · weryfikacja F · review · **promocja finalnej** · [`MASTER-ZADANIA.md`](MASTER-ZADANIA.md) | NIE |

**Wycofane:** Opus 4.8 · stary Master GLM · osobny czat review. Patrz [`OBIEG-AKCEPTACJA-2026-06-30.md`](OBIEG-AKCEPTACJA-2026-06-30.md).

**Koniec kolizji nazw:** „Silnik" już **nie** oznacza roli. Integrator = montownia (Grupa F). Master = orkiestracja. Kod gry = po prostu `main.ts`.

**Nazewnictwo grup (KANON):** wyłącznie `Grupa A–F`. Pełny słownik + domeny + zamiany starych nazw → **`docs/obieg/NAZEWNICTWO-GRUP.md`**. ZAKAZ etykiet `UX/UI/MIASTO/EKONOMIA/DANE/DYPLOMACJA/UNITS/MAPA/Silnik`.

**Komendy Macieja:** **`start`** · **`ścieżka`** · **`slack`** / **`start slack`** · `raport` · `status` · `pytania` · `co dalej`. Slack: [`SLACK-OBIEG.md`](SLACK-OBIEG.md) · komendy: [`KOMENDY-MACIEJA.md`](KOMENDY-MACIEJA.md)

---

## 1b. Ścieżka kodu vs gra grywalna (2026-07-05 — OBOWIĄZ)

| Warstwa | Ścieżka | Kto edytuje |
|---------|---------|-------------|
| **Kod źródłowy** | **`gra/src/**`** | Grupy A–E |
| **Integracja** | **`gra/src/main.ts`** | Tylko F |
| **Gra Macieja (dev)** | **`gra-robocza/Gra-ROBOCZA.html`** | Tylko F (publish) |
| **Kanon** | **`gra-kanon/Gra-KANON.html`** | Tylko Master |
| **Finalna** | **`Gra-FINALNA.html`** (root) | Tylko Master |
| **Start / hub** | **`gra-robocza/START.html`** | — |

**📢 Broadcast 2026-07-05:** [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](BROADCAST-NAZWY-PLIKOW-2026-07-05.md) · stary **`Gra-podglad.html` — nie istnieje**.

**⛔ ZAKAZ:** edycja **`gra-robocza/src/**`**, **`gra-kanon/src/**`** (skasowane). Pełna spec: [`OBOWIAZ-SCIEZKA-KODU.md`](OBOWIAZ-SCIEZKA-KODU.md) · trigger: **`ścieżka`**.

---

## 2. Gdzie się komunikujemy (jeden plik na rolę)

| Kto | Plik bieżący |
|---|---|
| Grupa A (mapa+HUD) | `docs/obieg/A-mapa.md` |
| Grupa B (miasto+ekonomia) | `docs/obieg/B-ekonomia.md` |
| Grupa C (walka) | `docs/obieg/C-walka.md` |
| Grupa D (cywilizacje+nauka+dyplomacja+AI) | `docs/obieg/D-cywilizacje.md` |
| Grupa E (start+menu) | `docs/obieg/E-start.md` |
| Integrator (kolejka wpięć) | `docs/obieg/INTEGRATOR-kolejka.md` |
| **Decyzje Macieja (rejestr)** | `docs/obieg/REJESTR-DECYZJI.md` |
| **Cała gra (prawda)** | `docs/ROADMAP.md` |
| Maciej | **czat** (nie czyta plików) |

**Zasada:** plik grupy = **stan bieżący** (nadpisywany, nie puchnie). Historia → `docs/archiwum/`. Szczegółowe kontrakty techniczne → `dyspozycje/_handoff/`.

---

## 3. Przepływ pracy (jedna ścieżka)

```
Maciej (ABC · slack · start)
   ↓
Grupa A–E  — moduł → handoff + plik GOTOWE + Slack #grupa-X
   ↓
Master     — dyspozycja F (+ Slack #master) · [`MASTER-ZADANIA.md`](MASTER-ZADANIA.md)
   ↓
Grupa F    — main.ts → bramka → ROBOCZA + PLAYTEST (+ Slack #grupa-f)
   ↓
Master     — weryfikacja F → review subagent → promocja finalnej ([`DWIE-WERSJE-GRY.md`](DWIE-WERSJE-GRY.md))
   ↓
Master     — ACK (MASTER-WATCH + DZIENNIK + Slack)
   ↓
Master     — **prosi Macieja o playtest** (tylko Master — po kanonie)
   ↓
Maciej     — **`playtest OK`** / **`BUG:`** (tylko na prośbę Mastera)
```

**BUG na dowolnym etapie → wraca do grupy-właściciela** (nie do Integratora, nie Master w kodzie).

---

## 4. Twarde reguły

1. **Tylko Integrator dotyka `main.ts`.** Grupy A–E nigdy. Master nigdy.
2. **Kod lane wyłącznie w `gra/src/`.** ZAKAZ `gra-robocza/src/`, `gra-kanon/src/` ([`OBOWIAZ-SCIEZKA-KODU.md`](OBOWIAZ-SCIEZKA-KODU.md)).
3. **Grupy nie wpinają same** — pchają gotowy moduł + handoff, Integrator wpina.
3. **Master — dyspozycja → wykonanie:** krok 1 ACK/pliki · **krok 2 w tej samej turze** (F via Task, potem weryfikacja/promocja). Zakaz kończyć turę samym „czeka”. [`MASTER-ZADANIA.md`](MASTER-ZADANIA.md)
4. **Decyzje ABC** — format: [`docs/obieg/_ABC-JAK-PYTASZ.md`](_ABC-JAK-PYTASZ.md) (stary „O co chodzi" **wycofany**). Po ABC → **ECHO → START (AskQuestion) → AKCJA** (§7.1b). Decyzja zamknięta → nie pytać ponownie.
5. **Master nie pisze kodu gry** — orkiestruje i weryfikuje (patrz reguła 3).
6. **Testy:** Integrator odpala bramkę po każdym wpięciu; Master tylko czyta wynik.
7. **Build:** zawsze `/tmp` (OneDrive blokuje `dist/`) — patrz `.cursor/rules/civ-workflow.mdc` §6.
8. **Archiwum = przeniesienie, nie kasowanie.** Nic nie ginie.
9. **Maciej ≠ listonosz.** Komunikacja między rolami = pliki + **Slack (trigger)**. Maciej może powiedzieć **`slack`** zamiast dyktować ścieżki. Szczegóły: [`SLACK-OBIEG.md`](SLACK-OBIEG.md).
10. **Playtest = brama Master → Maciej.** Grupy A–E i Integrator F **nigdy** nie proszą Macieja o playtest. Pełna reguła: [`OBOWIAZ-PLAYTEST-GATE.md`](OBOWIAZ-PLAYTEST-GATE.md) · trigger: **`obowiaż`**.
11. **Raport do Macieja = tylko własny lane.** ABC · wdrożenie · przekaz Master — **bez** statusu całej gry. Pełna reguła: [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md) · trigger: **`zakres`**.

---

## 5. Flagi statusu (w plikach obiegu)

- `→ INTEGRATOR: GOTOWE` — grupa skończyła moduł, czeka wpięcia
- `→ MASTER: GOTOWE-ROBOCZA` — F: bramka PASS + `Gra-podglad-ROBOCZA.html` (Master weryfikuje → review → promocja finalnej)
- `→ MASTER: GOTOWE-KANON` — **deprecated** (używaj GOTOWE-ROBOCZA od F; kanon = Master po review)
- `→ MASTER: BLOK` — konflikt techniczny (Integrator nie może wpiąć)
- 🔒 — czeka decyzji ABC Macieja

---

## 6. Ikony statusu (wspólne z ROADMAP)

✅ zrobione w kanonie · 🔄 w toku · ⬜ do zrobienia · 🔒 czeka decyzji Macieja · ⛔ blokada techniczna

---

## 7. Przymus decyzji — żeby odpowiedzi Macieja NIGDY nie ginęły (NIENEGOCJOWALNE)

> Problem, który to likwiduje: Maciej odpowiada / proponuje rozwiązanie → po czasie okazuje się, że nikt tego nie wdrożył. Koniec z tym. Każda decyzja ma ID, status i nadzorcę (Master).

### 7.1 ECHO — zapis ZANIM cokolwiek zrobisz (twarda bramka)

Gdy Maciej w czacie **odpowie na pytanie** lub **zaproponuje rozwiązanie**, agent grupy ma **ZAKAZ** robienia czegokolwiek innego (kod, analiza, kolejne pytania), dopóki nie wykona — jako **pierwszej czynności**:

1. Nada/uzupełni **ID** decyzji (ABC: `B1-Q3`; luźna propozycja: `DEC-RRRRMMDD-NN`).
2. Dopisze decyzję do **`docs/obieg/<grupa>.md`** (sekcja „DECYZJE MACIEJA") + **dosłowny cytat** jego słów.
3. Dopisze/zaktualizuje wiersz w **`docs/obieg/REJESTR-DECYZJI.md`** ze statusem 🟡 ZAPISANA.
4. Odpowie Maciejowi w czacie **jednym zdaniem-potwierdzeniem**:
   `Zapisałem jako <ID>, status ZAPISANA — wdrażam teraz w <plik/moduł>.`

**Bez echa decyzja „nie istnieje".**

### 7.1b START → BALANS → DOMKNIĘCIE — po ABC

1. **ECHO** → 🟡 ZAPISANA  
2. **START** — `AskQuestion`: **Tak — wdrażaj teraz** / **Jeszcze doprecyzujmy**  
3. Po **Tak** → 🔵 W TRAKCIE + kod w tej samej sesji  
4. Po **doprecyzujmy** / dyskusji o balansie → 🟡 doprecyzowanie, **bez kodu**, aż Maciej powie hasło §7.1c  
5. **DOMKNIĘCIE** — hasła Macieja §7.1c → agent **nie stoi**

**ZAKAZ:** po balansie czekać w nieskończoność bez reakcji na §7.1c.

Pełna reguła: `.cursor/rules/decyzje-echo.mdc` §2–3.

### 7.1c Hasła Macieja — domknięcie tematu (Grupy A–E)

| Hasło | Efekt | Adresat |
|-------|-------|---------|
| **`działaj`** | Kod / eksport / testy lane | ten sam agent grupy |
| **`przekaż do Mastera`** | Meldunek `→ MASTER: GOTOWE` + handoff `_handoff/` · Master wpisuje kolejkę F · **Slack §7.1d** | **Master** → dyspozycja → **Integrator (F)** |

Maciej **nie** przenosi treści między czatami — agent grupy zapisuje pliki **i** Slack.

### 7.1e ZAKAZ — nie instruuj Macieja o wklejce do Mastera (Grupy A–E + F)

**Maciej nie jest kurierem.** Master czyta **pliki w repo** (`dyspozycje/_handoff/*`, `*-DO-MASTERA.md`, auto-watch co 15 min).

| ❌ ZAKAZ (stary obieg) | ✅ Kanon (od 2026-06-30) |
|------------------------|---------------------------|
| „Wklej w czacie MASTER" | Zapisz `dyspozycje/_handoff/<grupa>-do-MASTER_<temat>.md` |
| „Skopiuj handoff do hubu" | Append `→ MASTER: GOTOWE` w `<grupa>-DO-MASTERA.md` |
| „Maciej przekaż Masterowi" | Maciej mówi tylko **`przekaż do Mastera`** — resztę robi **agent grupy** |
| Pokazywać Maciejowi blok tekstu do wklejenia | Pokazać Maciejowi tylko **ABC** albo **playtest OK / BUG** |

**Agent grupy:** po handoffie kończysz meldunkiem w plikach + Slack §7.1d. **Nie** kończysz sesji instrukcją dla Macieja „idź do Mastera i wklej".

Pełna spec Macieja: [`MACIEJ-ROLA-MINIMAL.md`](MACIEJ-ROLA-MINIMAL.md) · [`KOMENDY-MACIEJA.md`](KOMENDY-MACIEJA.md).

### 7.1f OBOWIĄZ playtest — tylko Master prosi Macieja (2026-07-02)

**Decyzja Macieja:** nie robi playtestów, dopóki batch nie przejdzie **Integrator F → weryfikacja Master → kanon**.

| Rola | Playtest Macieja |
|------|------------------|
| Grupy A–E | **ZAKAZ** prosić · kończysz na **`przekaż do Mastera`** |
| Integrator F | **ZAKAZ** prosić · kończysz na **`F-do-MASTER: GOTOWE-ROBOCZA`** |
| Master | **Jedyny** kto informuje Macieja: „gotowe do playtestu" |
| Maciej | **`playtest OK` / `BUG:`** tylko po prośbie Mastera |

Trigger odświeżenia u wszystkich: **`obowiaż`** → [`OBOWIAZ-PLAYTEST-GATE.md`](OBOWIAZ-PLAYTEST-GATE.md).

### 7.1f2 Zakres raportu do Macieja (Grupy A–E — OBOWIĄZKOWE)

| Co Maciej dostaje od grupy | Czego NIE |
|----------------------------|-----------|
| Braki **ABC tej grupy** (`pytania`) | Status całej gry |
| Wdrożenie **jej** decyzji (`raport2` §1–2) | Postęp innych grup |
| Przekaz **Master** (`raport2` §3) | Kolejka F, md5, playtest |

Trigger odświeżenia: **`zakres`** → [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md). Pełny obraz = **`raport`** w hubie Master.

### 7.1d Slack po **`przekaż do Mastera`** (Grupy A–E — OBOWIĄZKOWE)

Po meldunku w plikach agent **natychmiast** (MCP `plugin-slack-slack`):

1. **`slack_send_message`** → `#master`  
2. **`slack_send_message`** → `#grupa-<X>` (A…E)

Szablon i ID kanałów: `docs/obieg/SLACK-OBIEG.md` §„Po przekaż do Mastera".  
**ZAKAZ:** kończyć sesję bez Slacka po `przekaż do Mastera` (wyjątek: MCP BLOK → wpis w pliku obiegu).

**Maciej nie otwiera Slacka** — to robi agent grupy.

### 7.2 DOMKNIĘCIE — nie wolno powiedzieć „gotowe" bez dowodu

- Grupa nie zgłasza `→ INTEGRATOR: GOTOWE` bez **dowodu wdrożenia** (plik+funkcja / test) i przesunięcia statusu w rejestrze na 🔵/🟠.
- Integrator nie zamyka wpięcia bez **md5 wersji ROBOCZA** → status 🟢 WDROŻONA + dowód w rejestrze.
- Status ✅ ZWERYFIKOWANA ustawia **tylko Master** (po sprawdzeniu w ROBOCZA).

### 7.3 Nadzór Mastera (zdejmuje weryfikację z Macieja)

- **🟡 ZALEGŁE** = 🟡 ZAPISANA **bez** 🔵 W TRAKCIE w tej samej sesji **lub** bez ruchu przez kolejną sesję → Master eskaluje do grupy.

- **Hasło `status`** (w dowolnym czacie) → Master zwraca listę z rejestru: co ZAPISANE / W TRAKCIE / WDROŻONE / **ZALEGŁE** (leży bez ruchu) + co czeka playtestu.
- **Na starcie każdej sesji Master** — ten sam skan automatycznie, bez pytania.
- Master jest **właścicielem** `ROADMAP.md` i `REJESTR-DECYZJI.md` — to on dba o spójność, nie Maciej.
- Hasło `czego nie wdrożono?` = skrót do listy decyzji otwartych per grupa.

**Skutek dla Macieja:** odpowiadasz raz ABC → agent **wdraża w tej samej sesji** → potwierdzenie z ID → Master pilnuje zaległych.

---

## 8. Bezpieczne zmiany — żeby grupa nie psuła innym (NIENEGOCJOWALNE)

> Problem, który to likwiduje: grupa zmienia swój kawałek, nie wie o ukrytych połączeniach i psuje coś innego (np. miasto wykrzaczyło mapę). Pełna reguła: `.cursor/rules/zmiany-izolacja.mdc`. Mapa połączeń: `docs/obieg/MAPA-POLACZEN.md`. Decyzje ISO-1…4 → `REJESTR-DECYZJI.md`.

### 8.1 Izolacja — buduj własny podgląd PRZED oddaniem
Grupa pracuje tylko na swoich plikach i **buduje własny podgląd testowy** (`$env:TEMP\civ-<grupa>`), żeby zobaczyć efekt u siebie **i sprawdzić sąsiednie ekrany** (mapa/miasto/HUD), zanim odda Integratorowi.

### 8.2 Trzy warstwy zmian (klasyfikuje grupa, weryfikuje Integrator)
- 🟢 **Izolowana** (tylko własny moduł, zero wpływu na wspólny stan/render/`main.ts`) → grupa robi → self-build → handoff; Integrator scala **batchem** (szybko).
- 🟡 **Cross / współdzielona** (dotyka wspólnego stanu, renderu, save, innej grupy) → **obowiązkowo** przez Integratora + mapa połączeń + bramka wizualna.
- 🔴 **Duża / ryzykowna** (przebudowa, nowy system, zmiana struktury stanu) → **najpierw kontrakt z Masterem** + izolacja (worktree).

### 8.3 Integrator = świadomość połączeń
Prowadzi `MAPA-POLACZEN.md`, klasyfikuje każdy handoff, sprawdza coupling, po wpięciu dodaje bramkę wizualną (render smoke) przed `ROBOCZA`.

**Skutek:** drobne poprawki idą szybko (batch), a duże/ryzykowne nie trafiają na ślepo do gry.
