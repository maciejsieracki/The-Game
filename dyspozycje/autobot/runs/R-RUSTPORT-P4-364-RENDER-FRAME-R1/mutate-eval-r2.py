import subprocess, os, sys
RF='/home/user/The-Game/.claude/worktrees/wf_cb4802ac-c57-2/rust-port/engine/src/domain/render_frame.rs'
ENG='/home/user/The-Game/.claude/worktrees/wf_cb4802ac-c57-2/rust-port/engine'
L='/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/ev364r2'
M=[
 ("EV10-kon-zawsze-0", "        .filter_map(|stock| stock.get(\"kon\"))\n        .sum();", "        .filter_map(|stock| stock.get(\"kon\"))\n        .sum::<f64>() * 0.0;"),
 ("EV11-ulepszenie-fotel-seat-nie-glowny-wlasne-jednostki-puste", "    for u in state.units.iter().filter(|u| u.owner_id == primary) {", "    for u in state.units.iter().filter(|u| u.owner_id == primary && false) {"),
]
src=open(RF).read()
env=dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0', CARGO_TARGET_DIR=L+'/tgt')
out=open(L+'/evmut.log','a')
try:
  for name,old,new in M:
    assert src.count(old)==1,(name,src.count(old))
    open(RF,'w').write(src.replace(old,new))
    r=subprocess.run(['cargo','test','--test','p4_364_render_frame'],cwd=ENG,env=env,capture_output=True,text=True)
    fails=[l.split()[1] for l in r.stdout.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
    comp='error[' in r.stderr
    v='ZABITY' if r.returncode!=0 else 'PRZEZYL'
    out.write(f"{name}: exit={r.returncode} {v}{' (blad kompilacji)' if comp else ''}; FAILED: {', '.join(fails)}\n"); out.flush()
finally:
  open(RF,'w').write(src)
out.write('DONE\n')
