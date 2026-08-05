# START-TU — punkt wejścia dla KAŻDEGO czatu/agenta (czytaj to pierwsze)

Projekt: The Game (4X, TypeScript+Three.js). Właściciel i decyzje: Maciej.
Od 2026-07-06 praca odbywa się w Cowork (Cursor tylko od święta — promocje do finalnej).

## ⛔ PROCEDURA DECYZJI (Maciej 2026-08-03) — czytaj PRZED kodem
**Pełny tekst:** [`PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`](PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md)

1. Case / bug / poprawka / innowacja → **nadaj ID** + zapisz w `REJESTR-PROSB-I-ZADAN.md`.
2. **Nie koduj od razu** — przedstaw rozwiązanie (± ABC) i czekaj.
3. Maciej: **`numer + A|B|C`** → dopiero wtedy implementacja + **commit**.
4. **Deploy** do ROBOCZA **tylko** na hasło **`deploy`** (nie przy samym commicie).

## Przeczytaj w tej kolejności
1. TEN plik (30 sekund) + procedura NUMER→ABC wyżej.
2. **[`AUTOBOT-SCHEMAT-DZIALANIA.md`](AUTOBOT-SCHEMAT-DZIALANIA.md)** — kto za co (Operator / Evaluator / Grok / Maciej) + reguły.
3. `SCHEMAT-PRACY-COWORK-2026-07-05.md` — role (MASTER / INTEGRATOR / UX / Maciej),
   łańcuch wersji robocza→kanon→finalna, pętla robocza.
4. `_handoff/KANAL-PRACA.md` — protokół komunikacji + bieżące zadania (ostatnie wpisy!).
5. Swoją kartę roli, jeśli istnieje (np. `_handoff/ROLA-UX.md`).

## Żelazne zasady (skrót — pełne w schemacie)
1. TYLKO DO PRZODU: zero restore, backupów, archeologii. Braki = piszemy kod od nowa.
2. JEDEN publikujący: build+wgranie robi wyłącznie INTEGRATOR **po haśle Macieja `deploy`**.
   Cele: gra-robocza\ Gra-ROBOCZA.html + PLAYTEST-* + hub START.html. Root i gra-kanon = nie dotykać.
3. Własność plików: nikt nie edytuje cudzych; cross-rola przez wpis w kanale.
4. Wszystko istotne = WPIS w kanale (≤10 linii, stopka CZEKAM-NA). Maciej nie
   przenosi treści między czatami.
5. Determinizm generatora: nie zmieniać kolejności rand(); hash w teście pilnuje.
6. Bash NIE czyta dużych plików projektu (OneDrive tnie) — host-side Read/Grep/Edit.
   Buduje się z kompletnej kopii (aktualnie: srcKopiaMaster).
7. Aktualne numery wersji: TYLKO w `WERSJE.md` (nigdzie indziej nie kopiować).
8. Testuje wyłącznie Maciej (gra); agenci — tylko testy konsolowe i kompilację.
9. Zero sterowania ekranem Macieja bez jego wyraźnej prośby.
10. NUMER → ABC → COMMIT → DEPLOY — patrz procedura na górze (2026-08-03).
11. Przed commit/deploy: **nie uwsteczniaj** wcześniejszych fixów — przegląd `git diff` (zmiany **i** usunięcia) · `R-PROC-NO-REGRESS` / procedura §4a.
12. **AUTOBOT — TWARDA REGUŁA (Maciej 2026-08-05):** **KAŻDA praca** agenta wyłącznie w systemie AutoBot (Operator → Evaluator → Grok final). **ZAKAZ** omijania pętli. Kanon: [`autobot/README.md`](autobot/README.md) · `.cursor/rules/autobot-evaluator-operator.mdc` · `docs/decyzje/R-PROC-AUTOBOT.md`.

## HISTORIA = OBOWIĄZKOWY KONTEKST (korekta Macieja 2026-07-06)
Bannery „NIEAKTUALNE" na starych plikach dotyczą WYŁĄCZNIE procesu (role, publish,
komendy) — NIE wiedzy. Cała historia projektu OBOWIĄZUJE jako kontekst i nowy czat
MUSI z niej korzystać zamiast działać po omacku:
- decyzje projektowe Macieja (ABC): `docs\decyzje\*` — to prawo projektu;
- historia operacyjna: `DZIENNIK-MASTERA.md` (co, kiedy, dlaczego);
- historia domeny: skrzynka `<TWOJA-DOMENA>-DO-MASTERA.md` + handoffy `_handoff\`
  z Twojego obszaru (przeczytaj PRZED pierwszym zadaniem w domenie);
- specyfikacje designu: Spec-*.md, DESIGN-*.md, dyspozycje BLAD-*/DYSPOZYCJA-*.
Zasada: zanim zaczniesz temat, znajdź jego przeszłość (Grep po nazwie tematu w
dyspozycje\ i docs\) — decyzje już podjęte NIE podlegają ponownemu wymyślaniu.

## Mapa plików komunikacji
- `KOMENDY.md` — SŁOWNIK HASEŁ MACIEJA (start/master/raport/sprawdź/OK/BUG) — ZNAĆ NA PAMIĘĆ; „master" = obowiązkowy wpis meldunku „→ MASTER" w kanale; „raport" = format A/B/C
- `OBIEG-KOMUNIKACJI-2026-07-06.md` — 5 reguł obiegu + kto czyta co (WSZYSCY, też Cursor)
- `ROLE-I-ZAKRESY-2026-07-06.md` — pełne karty ról: zakresy, odpowiedzialności, zakazy
- `_handoff/KANAL-PRACA.md` — kanał zadań i meldunków (append-only)
- `_handoff/DO-KANONU.md` — pakiety promocyjne robocza→kanon (prowadzi MASTER)
- `_handoff/ROLA-UX.md` — karta czatu UX
- `WERSJE.md` — rejestr wersji (jedyne źródło md5/stempli)
- `RAPORT-STAN-BATCHY-2026-07-06.md` — co jest w grze / w trakcie / do zrobienia
- `AUDYT-OBIEG-DOKUMENTOW-2026-07-05.md` — czemu system wygląda tak, a nie inaczej
- Stare pliki (KANAL-KRYZYS, MASTER-PLAN, BLAD-B0.x, _handoff/ROLA-do-ROLI) —
  kontekst historyczny; obowiązuje to, co wyżej.
