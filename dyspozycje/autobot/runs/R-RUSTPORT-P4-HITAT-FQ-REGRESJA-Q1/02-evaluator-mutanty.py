import subprocess, os
W="/home/user/The-Game/.claude/worktrees/wf_424d6905-9a3-2/rust-port"
S="/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad"
P=W+"/renderer/src/battle/playback.rs"
orig=open(P).read()
base=open(S+"/hitat-ev-pb-base.rs").read()
env=dict(os.environ,CARGO_INCREMENTAL="0",CARGO_PROFILE_DEV_DEBUG="0",CARGO_PROFILE_TEST_DEBUG="0",CARGO_TARGET_DIR=S+"/hitat-ev-target2")
REN=["cargo","test","--test","battle_playback","--test","battle_playback_move_shot"]
E="    at == t0 + nominal || at == t0 + pin_frame_time(PIN_FRAME_MS, nominal)\n"
muts=[
 ("V0 baza playback.rs (regresja HitAt w kliencie)", None, base, "client", ["cargo","test","--test","siege_battle_client"]),
 ("V1 okno domkniete [nom, siatka]", E, "    at >= t0 + nominal && at <= t0 + pin_frame_time(PIN_FRAME_MS, nominal)\n", "renderer", REN),
 ("V4 TowerShot tez przez siatke (poluzowanie)", "                if *land_at != a.t0 + RANGED_FLY_MS {", "                if !is_pin_event_time(a.t0, RANGED_FLY_MS, *land_at) {", "renderer", ["cargo","test"]),
 ("V6 dodatkowa klatka (+16) akceptowana", E, "    at == t0 + nominal || at == t0 + pin_frame_time(PIN_FRAME_MS, nominal) || at == t0 + pin_frame_time(PIN_FRAME_MS, nominal) + PIN_FRAME_MS\n", "renderer", REN),
 ("V10 lunge startuje z hit_at - BLOW_HIT_T", "(ud.col, ud.row), a.t0);", "(ud.col, ud.row), *hit_at - BLOW_HIT_T);", "renderer", REN),
 ("V11 siatka 8 ms", E, "    at == t0 + nominal || at == t0 + pin_frame_time(PIN_FRAME_MS / 2.0, nominal)\n", "renderer", REN),
]
try:
  for name,old,new,crate,cmd in muts:
    if old is None: src=new
    else:
        assert orig.count(old)==1,(name,orig.count(old)); src=orig.replace(old,new)
    open(P,"w").write(src)
    r=subprocess.run(cmd,cwd=W+"/"+crate,env=env,capture_output=True,text=True)
    out=r.stdout+r.stderr
    status="ZABITY" if r.returncode!=0 else "PRZEZYL"
    hint=[l.strip()[:160] for l in out.splitlines() if "HitAt" in l or "panicked" in l or "error[" in l][:3]
    print(f"{name}: {status} (exit {r.returncode}) {hint}",flush=True)
finally:
  open(P,"w").write(orig); print("RESTORED",flush=True)
