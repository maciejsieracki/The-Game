# R-WEB-ARMY-FOLLOW-LEADER-AUTO-MERGE-NO-PROMPT-Q1 — dispatch (2026-11-09)

GOAL (zgłoszenie właściciela + zrzut przycisku „IDŹ DO WODZA: WŁĄCZONE”): gdy jednostka/armia ma włączony tryb „Idź do wodza/generała” (podążaj), po dotarciu do armii wodza łączy się z nią AUTOMATYCZNIE, bez pytania o zgodę na połączenie, i zostaje wcielona do całej armii. Pytanie o połączenie zostaje WYŁĄCZNIE przy ręcznym najechaniu jednostką gracza na inną własną jednostkę/armię (przy wyłączonym trybie podążania).
BAZA: main po FALA 567. Operator: HAIKU 5.5.
ZAKRES:
1. Diagnoza: gdzie jest tryb podążania za wodzem (szukaj „IDŹ DO WODZA”, followLeader/idzDoWodza w main.ts, armyPanel/ui), gdzie powstaje monit o połączenie (merge/połącz prompt), jak dziś kończy się marsz do wodza.
2. Naprawa: przy włączonym trybie i dotarciu/wejściu na heks armii wodza → scalenie bez monitu (ta sama funkcja scalania co po akceptacji monitu; limity armii/stack/dowódcy respektowane — gdy scalenie niemożliwe z powodu limitu, pokaż hint zamiast monitu i nie scalaj). Ręczne najechanie bez trybu — monit jak dotąd. Dotyczy tylko gracza (AI bez zmian).
3. Komunikat po polsku („Dołączono do armii wodza”), bez surowych id; powiadomienie w zakładce „Inne” lub hint, nie modal.
4. Test `gra/tools/army-follow-leader-auto-merge-test.cjs`: tryb ON → scalenie bez monitu; tryb OFF + ręczny ruch → monit; limit armii → brak scalenia z hintem; brak regresji merge-prompt testów.
ALLOWLISTA: gra/src/main.ts, gra/src/ui/* (panel armii), gra/src/game/army-*.ts, nowy test, runs/<ID>/. Zakaz: WERSJE.md, gra-robocza/, build/dev, git add -A, push/deploy.
