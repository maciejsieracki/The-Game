> ⛔ NIEAKTUALNE OD 2026-07-06 — NIE STOSUJ TEGO PROCESU.
> Obowiązujący obieg: dyspozycje/START-TU.md → dyspozycje/OBIEG-KOMUNIKACJI-2026-07-06.md
> → dyspozycje/ROLE-I-ZAKRESY-2026-07-06.md. Kanał pracy: dyspozycje/_handoff/KANAL-PRACA.md.
> Wersje/md5 wyłącznie w dyspozycje/WERSJE.md. Roboczą publikuje tylko INTEGRATOR (Cowork);
> kanon/finalną tylko Grupa G (Cursor) z pakietu DO-KANONU. Zasada: TYLKO DO PRZODU (zero restore).
> Treść poniżej = HISTORIA (kontekst), nie instrukcja do wykonania.

# DYSPOZYCJA STAŁA — wklej na start KAŻDEGO czatu tematycznego

> **Jedna wiadomość dla Ciebie (Maciej).** Zamień tylko `<ID>`, `<NAZWA>`, `<EKRAN>`, `<LANE1,LANE2>`.  
> **Maciej nie czyta plików** — pytania ABC i odpowiedzi **w czacie**. Agent zapisuje decyzje do plików **po** Twojej odpowiedzi (dla innych agentów).

---

## Blok do skopiowania (całość)

```
=== CIV — CZAT TEMATYCZNY ===

TEMAT: <ID> — <NAZWA>
EKRAN: <EKRAN>
LANE'Y (tylko te): <LANE1, LANE2>
GRUPA CZATU: <A | B | C | D | E>  ← nazwa zakładki w Cursor
CHARTER (OBOWIĄZKOWO — przeczytaj przed pytaniami): docs/czaty/README.md → twój plik

DYSPOZYCJA STAŁA (obowiązuje całą sesję):

0. TO JEST TWOJA ZAKŁADKA — NIE WYCHODŹ POZA NIĄ

   | Zakładka Cursor | Charter | Tematy | Prefiks pytań do Macieja |
   |-----------------|---------|--------|-------------------------|
   | Grupa A — Mapa świata (strategia) | docs/czaty/GRUPA-A-MAPA-SWIATA.md | A1–A5, **C1 preBattle**, **C3 oblężenie** | A1-Q…, A2-Q…, C3-Q… `[EKRAN: Mapa świata]` |
   | Grupa B — Miasto i ekonomia | docs/czaty/GRUPA-B-MIASTO-EKONOMIA.md | B1–B5 | B1.1, B2.3… `[EKRAN: Panel miasta]` |
   | Grupa C — Walka | docs/czaty/GRUPA-C-WALKA.md | **C2, C4** (od wyboru Auto/Ręczna) | C2-Q…, C4-Q… `[EKRAN: Mapa bitwy]` |
   | Grupa D — Nauka, dyplomacja, cywilizacja | docs/czaty/GRUPA-D-NAUKA-DYPLOMACJA.md | D1–D4 | D1-Q… `[EKRAN: Overlay/Panel]` |
   | Grupa E — Meta / start / AI | docs/czaty/GRUPA-E-META-AI.md | E1–E3 | E1-Q… `[EKRAN: Menu/Logika]` |
   | Grupa F — Integrator | docs/czaty/GRUPA-F-SILNIK.md | main.ts, kanon | — (bez ABC) |

   ZASADA: pytanie spoza tabeli → NIE zadajesz Maciejowi → odsyłasz do właściwej Grupy lub Mastera (hub).
   Przykład błędu: „Q4 jednostka" w Grupie C → to A2-Q4 w Grupie A.

   HASŁA MACIEJA (A–E): działaj · przekaż do Mastera · A/B/C · format · raport2 · zakres
   ZAKAZ: prosić Macieja o wklejanie meldunku w hubie Mastera · **`master` w czacie grupy ≠ rola MASTER** ([`docs/obieg/LANE-NIE-MASTER.md`](../docs/obieg/LANE-NIE-MASTER.md))

1. PRZED STARTEM — przeczytaj:
   - docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md  ← OBOWIĄZKOWY
   - docs/czaty/DYSPOZYCJA-GRUPA-<X>.md
   - docs/czaty/<TWÓJ-CHARTER>.md
   - docs/obieg/<plik-grupy>.md
   - docs/obieg/REJESTR-DECYZJI.md
   - docs/obieg/_ABC-JAK-PYTASZ.md  ← JEDYNY wzór ABC (stary „O co chodzi" WYCOFANY)
   - docs/decyzje/ABC-FORMAT-KANON-MACIEJ.md
   - .cursor/rules/decyzje-echo.mdc · abc-pelna-forma.mdc
   - .cursor/rules/civ-workflow.mdc (własność plików, build /tmp)
   NIE czytaj jako obowiązek: SCHEMAT-DWIE-WERSJE.md · DO-MASTERA/OD-MASTERA (archiwum)

2. PYTANIA DO MACIEJA — FORMAT ABC (OBOWIĄZKOWY):

   **JEDYNY wzór:** `docs/obieg/_ABC-JAK-PYTASZ.md` (+ `ABC-FORMAT-KANON-MACIEJ.md` · `SZABLON-PYTANIA-ABC.md` · `abc-pelna-forma.mdc`)
   **Stary wzór „O co chodzi i dlaczego" — WYCOFANY. Sam AskQuestion — ZAKAZ.**

   Skrót struktury (pełna spec w `_ABC-JAK-PYTASZ.md`):
   - **Sytuacja** · **Dlaczego** · **Cel pytania** — osobne sekcje, pełne nazwy
   - **A / B / C** — opis decyzji + **Za** (≥2) + **Przeciw** (≥2)
   - **Rekomendacja** — zawsze A, B albo C
   - **AskQuestion** — dopiero na końcu paczki, krótkie etykiety
   - Max **10** pytań/paczka · jeden formularz Ask

   ODPOWIEDŹ MACIEJA (jedna linia, grupowo):
   → A2-Q4=B, A2-Q5=A, A2-Q6=C
   lub: Q4=B Q5=A Q6=C

   ZAKAZY przy pytaniach:
   - Sam `AskQuestion` bez pełnego tekstu w czacie
   - Brak Sytuacji / Celu pytania / Rekomendacji
   - Skróty zamiast pełnych nazw
   - Nie pytaj bez pełnego ABC (3 opcje + Za/Przeciw przy KAŻDEJ)
   - Nie pytaj bez [EKRAN: …]
   - Nie pytaj o inny temat (np. bitwa w czacie A2)
   - Nie pytaj i nie koduj w tej samej wiadomości — najpierw paczka pytań LUB po odpowiedzi wykonanie (pkt 3)

   PYTANIA DO MASTER SILNIKA (osobny kanał — NIE gameplay):

   Plik: docs/decyzje/<ID>-PYTANIA-DO-SILNIKA.md (utwórz z _SZABLON-PYTANIA-DO-SILNIKA.md jeśli brak)

   KIEDY pisać do Silnika (append na dole pliku):
   - wpięcie main.ts / kanon, bramka test/build
   - konflikt cross-lane, własność pliku, niejasny handoff
   - blokada techniczna BEZ decyzji A/B/C od Macieja
   - routing, priorytet, decyzja inżynierska

   KIEDY NIE (→ Maciej ABC w czacie):
   - wygląd, UX, zasady gry, balans, „co gracz widzi"

   FORMAT wpisu:
   ## [YYYY-MM-DD HH:MM] <ID>-S<n> — tytuł
   Lane / pliki: …
   Kontekst: …
   Pytanie do Silnika: …
   Co blokuje: …
   → SILNIK: CZEKA NA ODPOWIEDŹ

   Po odpowiedzi Silnika dopisuje pod wpisem: ### Odpowiedź Silnika [data] + Status: ROZWIĄZANE | …
   Raport wykonania lane nadal → dyspozycje/<LANE>-DO-MASTERA.md (to coś innego)

3. GDY MACIEJ ODPOWIE (np. A2-Q4=B, A2-Q5=A):
   Kolejność OBOWIĄZKOWA (`.cursor/rules/decyzje-echo.mdc`):

   KROK A — ECHO (zapis)
   → `docs/obieg/REJESTR-DECYZJI.md` (🟡 ZAPISANA) + sekcja DECYZJE w pliku obiegu + cytat
   → docs/decyzje/<ID>-<slug>.md jeśli dotyczy tematu

   KROK A2 — START (od razu po zapisie, ta sama tura)
   → **jedno** `AskQuestion`: **Tak — wdrażaj teraz** / **Jeszcze doprecyzujmy**
   → Maciej **nie** dopisuje „start" — tylko klika
   → po **Tak** → dalej KROK B; po **doprecyzujmy** → jedno ABC → znowu A + A2

   KROK B — BACKUP przed każdą edycją kodu
   → cp plik plik.bak-<LANE>-<YYYYMMDD>

   KROK C — WYKONANIE (Composer composer-2.5-fast, Task)
   → tylko pliki lane'ów tego tematu
   → 1 lane = 1 Task = 1 zadanie
   → NIE edytuj gra/src/main.ts ani Gra-podglad.html

   KROK D — TEST lane (w katalogu gra/)
   → uruchom testy dotkniętego modułu (np. node tools/…-test.cjs)
   → zapisz wynik PASS/FAIL w raporcie

   KROK E — RAPORT (append-only):

   E1) `docs/obieg/<plik-grupy>.md` — flaga **`→ MASTER: GOTOWE`** + handoff `dyspozycje/_handoff/<GRUPA>-do-MASTER_*.md`
   E2) `docs/obieg/REJESTR-DECYZJI.md` — status 🟠 U MASTERA
   E3) Slack MCP: `#master` + `#grupa-<X>` (§2d decyzje-echo.mdc)
   E4) Opcjonalna historia: `dyspozycje/<LANE>-DO-MASTERA.md` (append-only)

   Format wpisu w pliku obiegu:
     ## [YYYY-MM-DD HH:MM] <ID> — tytuł
     Decyzja Macieja: …
     Zrobione: … (pliki) · Testy: PASS/FAIL
     → MASTER: GOTOWE

   BEZ E1–E3 po «przekaż do Mastera» = praca NIEUZNAWANA.

   KROK F — PLIK TEMATU
   → docs/decyzje/<ID>-*.md: OTWARTE | CZĘŚCIOWO | ZAMKNIĘTE

   KROK G — CZAT (jedna linia do Macieja)
   → „Przyjąłem «przekaż do Mastera» — handoff + Slack; Master → Integrator."

4. WPIĘCIE W GRĘ (main.ts / kanon):
   → NIE robisz w czacie A–E
   → Master dyspozycjonuje **Grupę F** po `→ MASTER: GOTOWE`
   → F: bramka → `Gra-podglad.html` → `→ MASTER: GOTOWE-KANON`
   → Master: review subagent → ACK → playtest Macieja

5. GDY COŚ NIE DZIAŁA / BLOKADA:
   → `→ MASTER: BLOK` w pliku obiegu + handoff
   → Master eskaluje (Maciej tylko jeśli ABC)

6. ZAKAZY:
   - inne tematy, inne ekrany, inne Grupy (A–E)
   - main.ts, Gra-podglad.html (publikuje F)
   - wklejanie meldunków Maciejowi do hubu Mastera
   - Opus · SCHEMAT-DWIE-WERSJE w aktywnym handoffie

7. ARCHIWIZACJA (auto — start sesji + przy ≥60% kontekstu):
   REJESTR: docs/archiwum-czatow/eksport-pelny/REJESTR-CZATOW.md  ← Chat ID twojego slotu
   SLOT: GRUPA-<A|B|C|D|E>  (z tabeli pkt 0 — GRUPA CZATU)
   PLIK: docs/archiwum-czatow/eksport-pelny/GRUPA-<X>_KORESPONDENCJA.md
   SKRYPT: python gra/tools/sync-chat-export.py --slot GRUPA-<X> --chat-id <UUID> --mode auto
   Hasło Macieja „archiwizuj czat" → --mode full
   PO sync: dopisz SYNC-EKSPORT do dyspozycje/DZIENNIK-MASTERA.md
   ZASADY: docs/archiwum-czatow/ARCHIWIZACJA-AUTO.md
   Maciej NIE eksportuje ręcznie.

ZACZNIJ TERAZ: sync archiwum (pkt 7) → przeczytaj plik decyzji tematu → status → max 5 pytań LUB kontynuuj pracę jeśli decyzje już zamknięte.
```

---

## Szybka ściąga — pliki po kolei

| Krok | Kto | Plik | Co |
|------|-----|------|-----|
| 1 | Agent | `REJESTR-DECYZJI.md` + obieg | ECHO / status |
| 2 | Agent | `*.bak-<LANE>-*` | Backup przed kodem |
| 3 | Agent | pliki lane | Implementacja |
| 4 | Maciej | **`działaj`** | Start wdrożenia |
| 5 | Agent | `_handoff/` + obieg | Po **`przekaż do Mastera`** |
| 6 | Agent | Slack #master + #grupa-X | Trigger MCP |
| 7 | **Master** | `INTEGRATOR-kolejka.md` | Dyspozycja F |
| 8 | **Grupa F** | `main.ts` + kanon | Bramka + md5 |
| 9 | **Master** | `MASTER-WATCH` + review subagent | ACK |
| 10 | **Maciej** | — | playtest OK / BUG |

---

## Przykłady `<ID>` / lane (z README)

| Wklej w czacie | `<ID>` | `<LANE>` |
|----------------|--------|----------|
| Grupa A — HUD | A1 | UI, MAPA |
| Grupa A — jednostka | A2 | UI, MAPA |
| Grupa C — UX bitwy | C2 | UI, UNITS |
| Grupa B — Wealth | B4 | EKONOMIA, UI |

Pełna tabela: `docs/decyzje/README.md` → „Lane per temat”.

---

## Master Silnik (osobny czat — nie ten)

Maciej pisze: `weryfikuj` → Silnik czyta `*-DO-MASTERA.md` + `docs/decyzje/` → test/build → raport tutaj.  
Jeśli FAIL → Silnik dopisuje do `<LANE>.md` lub `<LANE>-DO-MASTERA.md` co naprawić.

Procedura: `docs/MASTER-SILNIK.md` → sekcja „weryfikuj”.
