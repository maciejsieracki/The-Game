# Audyt obiegu — pamięć, Slack, archiwum, hasło `reguły`

**Data:** 2026-07-04  
**Trigger:** Maciej — komunikacja między grupami kuleje · Slack martwy · archiwum nie działa · potrzeba **jednego hasła** na start dnia  
**Zakres:** tylko proces (reguły + pliki obiegu) · **bez kodu gry**

---

## Werdykt skrót

| # | Temat | Reguły w plikach | Realnie działa | Główna przyczyna |
|---|--------|------------------|----------------|------------------|
| 1 | Podział reguł MASTER/UI/lane | 🟡 częściowo | 🟡 | Za dużo `alwaysApply` naraz · duplikaty · stare nazwy lane |
| 2 | Rytuał startu (jedno hasło) | 🔴 brak `reguły` | 🔴 | Jest tylko `zasady` (ISO testów) — nie pełny obieg |
| 3 | Decyzje ABC (Maciej) | 🟢 `decyzje-echo.mdc` | 🟡 | Reguła jest · agenci **nie egzekwują** ECHO + AskQuestion |
| 4 | Archiwum ≥60% kontekstu | 🟢 reguła + hook | 🔴 | Ostatni sync **2026-06-28** · brak `SYNC-EKSPORT` w DZIENNIK · agenci nie odpalają skryptu |
| 5 | Slack po handoff | 🟢 `decyzje-echo` §2d | 🔴 | MCP nie wywoływany · fallback outbox bez wysyłki |

---

## 1. Podział reguł (punkt 1 — „wykonany”)

**Co jest:** 12 plików w `.cursor/rules/`, z czego **8× `alwaysApply: true`**:

- `civ-workflow.mdc` (duży, stare lane + nowe Grupa A–F)
- `komendy-raport.mdc`
- `decyzje-echo.mdc`
- `chat-export-auto.mdc`
- `master-silnik-orchestration.mdc`
- `abc-pelna-forma.mdc`
- `obowiaz-playtest-master-only.mdc`
- `model-routing.mdc`

**Co działa:** treść obiegu **jest** w regułach — Slack, ABC, playtest gate, komendy Macieja.

**Co nie działa:** agent dostaje **ścianę tekstu** na starcie → i tak „zapomina” w środku sesji · brak **jednego** krótkiego triggera na przypomnienie.

**Rekomendacja (dokumentacyjna, bez refactoru teraz):**
- Docelowo: **1 cienka reguła alwaysApply** (`reguly-start.mdc`, ≤50 linii) + reszta `alwaysApply: false` z globami.
- Na dziś: hasło **`reguły`** w `komendy-raport.mdc` = wymuszone odświeżenie całego obiegu (patrz §6).

---

## 2. Hasło `reguły` — jeden trigger na start dnia

**Problem:** Maciej musi przypominać o Slacku, archiwum, ABC, zakresie, playteście osobno.

**Rozwiązanie (wdrożone w regułach):** Maciej wpisuje **`reguły`** (aliasy: `reguly`, `obieg`, `przypomnij zasady`) w **dowolnym czacie** grupy A–F lub Master.

Agent **natychmiast** (bez dopytywania) wykonuje checklist §6 i odpowiada **stałym formatem** (8 punktów PASS/FAIL).

**Różnica vs `zasady`:** `zasady` = tylko ISO wersja testów (`zmiany-izolacja.mdc`). **`reguły` = cały obieg operacyjny.**

**Rytuał dnia Macieja (2 hasła):**
1. **`reguły`** — w każdym czacie, z którego dziś pracujesz (A–F + Master)
2. Potem właściwa praca: **`działaj`** / **`przekaż do Mastera`** / **`master`** (hub)

---

## 3. Decyzje Macieja (ABC)

**Reguły:** `.cursor/rules/decyzje-echo.mdc` (alwaysApply) · `abc-pelna-forma.mdc` · `docs/obieg/_ZASADY.md` §7.

**Co powinno działać po ABC Macieja:**
1. ECHO → rejestr + cytat
2. AskQuestion „wdrażaj teraz?"
3. `działaj` → kod w lane
4. `przekaż do Mastera` → handoff + **Slack §2d**

**Gdzie kuleje:** agenci kończą na 🟡 ZAPISANA · pomijają AskQuestion · nie robią §3 AKCJA.

**W `reguły` checklist:** punkt **ABC-ECHO** — agent potwierdza, że zna sekwencję i nie zostawi ZAPISANA bez `działaj`.

---

## 4. Archiwum (korespondencja)

**Wytyczne:** `docs/archiwum-czatow/ARCHIWIZACJA-AUTO.md` · `.cursor/rules/chat-export-auto.mdc` · hook `.cursor/hooks/pre-compact-sync.py` (w `hooks.json`).

**Progi:** reguła mówi **≥60%** kontekstu (Maciej wspomniał 80% — traktuj **≥60% obowiązkowo**, przy **≥80%** dodatkowo proponuj nowy czat).

**Dowód, że nie działa:**
- `REJESTR-CZATOW.md` — ostatni sync **2026-06-28** (dziś 2026-07-04)
- `DZIENNIK-MASTERA.md` — **brak** linii `SYNC-EKSPORT:` (agent nigdy nie melduje syncu)
- Hook `preCompact` działa **tylko** gdy chat ID jest w REJESTRZE — nowe czaty / zmiana ID = **cisza**

**W `reguły` checklist:** agent odpala `sync-chat-export.py --mode auto` **w tej samej turze** co odpowiedź na `reguły` (jeśli zna slot + chat-id).

**Hasło awaryjne Macieja:** **`archiwizuj czat`** — pełny sync natychmiast (już w `ARCHIWIZACJA-AUTO.md`).

---

## 5. Slack — dlaczego „umarł”

**Reguły:** `decyzje-echo.mdc` §2d · `SLACK-OBIEG.md` · kanały + ID w tabeli.

**Obowiązek:** po **`przekaż do Mastera`** agent wysyła MCP `slack_send_message` → `#master` + `#grupa-X`. **Maciej nie pisze na Slacku.**

**Dlaczego nie działa w praktyce:**
1. Agent **nie wywołuje MCP** (pliki „wystarczą")
2. MCP **wygasła autoryzacja** — brak `Slack: BLOK MCP` w plikach obiegu (agent powinien dopisać)
3. Fallback **`docs/obieg/SLACK-OUTBOX-*.md`** — tworzony, **bez wysyłki** i bez eskalacji
4. Master nie robi **`slack`** na starcie sesji (odczyt kanałów)

**W `reguły` checklist:** agent testuje MCP (`slack_search_channels` lub odczyt `#master`) → PASS / **BLOK MCP** + ścieżka outbox.

**Maciej — co zrobić raz:**
- Cursor → MCP → **Slack** → ponowna autoryzacja workspace The Game
- W hubie Master: wpisz **`slack`** — jeśli agent nie czyta kanałów, MCP nadal martwe

**Zasada do egzekucji:** meldunek **`→ MASTER: GOTOWE` bez Slack PASS = INCOMPLETE** (Master odrzuca do poprawki lane).

---

## 6. Format odpowiedzi agenta na hasło `reguły`

Agent odpowiada **zawsze** tym układem (PASS / FAIL / N/A per punkt):

```
## reguły — [Grupa X / Master] · [data]

1. **Rola:** … (lane / Master hub — bez kodu main.ts?)
2. **Plik obiegu:** … (🎯 TERAZ — 1 linia)
3. **ABC Maciej:** ECHO → AskQuestion → działaj → przekaż (TAK/NIE znam)
4. **Slack:** MCP PASS · #master + #grupa-X po przekaż / BLOK MCP: …
5. **Archiwum:** sync uruchomiony TAK/NIE · slot · ścieżka eksport-pelny/
6. **Playtest:** lane milczy · Master → rejestr §2 (TAK/NIE)
7. **Zakres raportu:** tylko własny lane (TAK/NIE)
8. **Handoff:** szablon przekaż do Mastera gotowy (TAK/NIE)

→ Gotowy do pracy. Czekam na: działaj / przekaż / start / master
```

**Master hub — dodatkowo punkt 9:** backup dzienny · MASTER-WATCH · bez kodu miasta/walki poza dyspozycją.

---

## 7. Komunikacja między grupami — co naprawić bez MCP

| Krok | Kto | Co |
|------|-----|-----|
| 1 | Lane | `przekaż do Mastera` → pliki **najpierw** |
| 2 | Lane | Slack **w tej samej sesji** (§2d) |
| 3 | Master | `slack` + skan `_handoff/` + `INTEGRATOR-kolejka.md` |
| 4 | Master | dyspozycja F **w tej samej turze** (nie „czeka") |
| 5 | F | `→ MASTER: GOTOWE-ROBOCZA` + Slack `#grupa-f` |

**Maciej nie jest kurierem** — jeśli lane prosi o wklejenie do Mastera = **błąd procesu** (już w regułach, trzeba egzekwować przez `reguły`).

---

## 8. Pliki zaktualizowane tym audytem

| Plik | Zmiana |
|------|--------|
| `.cursor/rules/komendy-raport.mdc` | sekcja **`reguły`** |
| `docs/obieg/KOMENDY-MACIEJA.md` | hasło `reguły` + rytuał dnia |
| ten plik | audyt + checklist |

---

## 9. Co Master robi po raporcie Macieja „UI gotowe"

Bez kodu — tylko: wpis DZIENNIK · weryfikacja handoff · ewent. dyspozycja F · **nie** implementacja UI.

---

*Audyt operacyjny · kod gry nietknięty · 2026-07-04*
