# R-WEB-RECRUIT-FOLLOW-GENERAL-BY-ORIGIN-Q1
STATUS: REGISTERED
DOMAIN: GAME
Owner 2026-11-11: wspólne ustawienie Idź do wodza dotyczy jednostek rekrutowanych z menu Armia lub panelu Rekrutacja. Jednostka zamówiona bezpośrednio w mieście ma domyślnie odznaczone Idź do wodza. Zachować możliwość indywidualnej zmiany po rekrutacji.
GOAL: source-specific recruitment intent persisted with queued order until spawn; city origin defaults false independently of empire toggle; Army/recruitment origin inherits existing toggle. Do not alter existing units/manual orders or AI behavior unintentionally. Audit actual call sites, batch queue quantities/save-load/legacy missingorigin fallback before editing. No change combat/general eligibility.
QUEUE: next qualified slot within max4 active topics. Operator/Evaluator/FC Luna high, tests source origins and persisted intent/save-load, then merge/Robocza/push/readback. Not implemented yet.
