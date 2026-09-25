# 00-dispatch — R-CYWILIZACJE-MACIERZ-ALL-113-SPOLECZENSTWO-R2

**Role:** Operator recovery r2
**Kanban:** `t_ed41ddcd`
**Base:** `origin/main=a8c9cf6c181f688201dd45e6a5871da1b0eb1301`
**Worktree:** `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-all-spoleczenstwo-r2-20260923`
**Branch:** `hermes/R-CYWILIZACJE-MACIERZ-ALL-113-SPOLECZENSTWO-R2-20260923`
**Fields:** `kultura_naplyw_proc`, `religia_spread_proc`, five `porzadek_*` fields.
**Recovery findings:** pure resolvers were wired, but main.ts omitted `civKey` on live calls.
**Contract:** wire main runtime path; wealth remains separate; no data change; no commit/push/merge/deploy.
