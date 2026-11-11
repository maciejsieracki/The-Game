# R-WEB-AI-BRONZE-STOCK-EXCESS-Q1
STATUS: REGISTERED
DOMAIN: GAME
Owner 2026-11-11: Inca diplomacy resource counter displays 24818 bronze; suspected impossible resource accumulation.
GOAL: identify whether negotiation input is actual stock, stale draft, wrong owner/resource, or resource generation/trade/save inflation. Do not assume displayed amount is proof of production bug. Audit current published FALA617 foundry25/50 limits, number/levels of converters, resource inputs, owner-era, AI economy production/trades/start grants/save migration; construct quantitative reproduction and minimal fix only if proven.
SCOPE: initial read-only source/tests audit; record concrete allowlist before any game edit. Preserve approved bronze25/50, all research costs and unrelated AI behavior. No arbitrary stock cap or deletion of legitimate existing player resources. Existing save may contain historical output; distinguish from new current-code defect. Missing save/turn data is a limit, not invented provenance.
TESTS: actual UI amount source, owner mapping, production flow/inventory conservation, AI/player parity and old-save roundtrip as applicable. Baseline RED before fix; focused regressions after. Operator Luna high → separate Evaluator → conditional Defense → independent Final Control → merge/Robocza/push/readback.
SCHEDULING: replaces paused barter candidate topic in max4 active topics. Barter candidate f20b81654 preserved separately; evaluation resumes after slot free.
