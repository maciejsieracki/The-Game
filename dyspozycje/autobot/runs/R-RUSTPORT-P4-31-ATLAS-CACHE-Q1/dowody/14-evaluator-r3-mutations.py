import subprocess, sys, os, shutil
R='/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/wt/rust-port/renderer'
S='/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/p431ev'
env=dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0', CARGO_TARGET_DIR=S+'/target')
M=[
 ('E1','src/raster/atlas/cache.rs','.filter(|k| !k.ends_with(&keep))','.filter(|k| !k.contains(keep.as_str()))',['--test','atlas_keys']),
 ('E2','src/raster/atlas/keys.rs',"            | '\\u{FEFF}'\n","",['--test','atlas_keys']),
 ('E3','src/raster/atlas/keys.rs','let sign = if rounded < 0.0 {','let sign = if rounded <= 0.0 && rounded != 0.0 || rounded.is_sign_negative() {',['--test','atlas_keys']),
 ('E4','src/raster/atlas/cache.rs','.filter(|k| !live.contains(k.as_str()))','.filter(|k| !live.contains(k.as_str()) && false)',['--test','atlas_nturns']),
 ('E5','src/raster/atlas/mip.rs','(MipSpace::Srgb, false) => round_half_up_u8(v),','(MipSpace::Srgb, false) => round_half_even_u8(v),',['--test','atlas_mip']),
 ('E6','src/raster/atlas/upload.rs','out.push(round_half_even_u8(f64::from(c) * 255.0 / af));','out.push(super::mip::round_half_up_u8(f64::from(c) * 255.0 / af));',['--test','atlas_mip']),
 ('E7','src/raster/atlas/scale.rs','pub const BADGE_MAX_TOTAL_SCALE: f64 = 4.0;','pub const BADGE_MAX_TOTAL_SCALE: f64 = 5.0;',['--test','atlas_keys']),
 ('E8','src/raster/atlas/cache.rs','let purged = if self.lod_purge_pending {','let purged = if self.lod_purge_pending && false {',['--test','atlas_nturns']),
 ('E9','src/raster/atlas/mip.rs','let p = (i as f32 + 0.5) * ratio - 0.5;','let p = (i as f32 + 0.5) * ratio - 0.49;',['--test','atlas_mip']),
 ('E10','src/raster/atlas/gpu.rs','TEXTURE_USAGE.union(wgpu::TextureUsages::COPY_SRC);','TEXTURE_USAGE;',['--features','gpu','--test','atlas_gpu']),
 ('E11','src/raster/atlas/keys.rs','let f = if f.is_nan() || f == 0.0 { 1.0 } else { f };','let f = if f.is_nan() { 1.0 } else { f };',['--test','atlas_keys']),
 ('E12','src/raster/atlas/cache.rs','        self.keys.retain(|k| inner.contains_key(k));\n        Ok(n)','        Ok(n)',['--test','atlas_nturns','--lib']),
 ('E13','src/raster/atlas/keys.rs','format!("c{}", js_to_lower_case(js_trim(&a.civ_icon_id))),','format!("c{}", js_to_lower_case(a.civ_icon_id.trim())),',['--test','atlas_keys']),
 ('E14','src/raster/atlas/mip.rs','    let v = v.clamp(0.0, 1.0);\n','',['--test','atlas_mip','--lib']),
]
only=sys.argv[1:]
for mid,f,old,new,args in M:
    if only and mid not in only: continue
    p=os.path.join(R,f); src=open(p,encoding='utf-8').read()
    n=src.count(old)
    if n!=1: print(mid,'PATTERN_COUNT',n,flush=True); continue
    shutil.copy(p,p+'.bak')
    open(p,'w',encoding='utf-8').write(src.replace(old,new))
    try:
        r=subprocess.run(['cargo','test','--locked']+args,cwd=R,env=env,capture_output=True,text=True,timeout=1200)
        out=r.stdout+r.stderr
        fails=[l for l in out.splitlines() if 'FAILED' in l or 'panicked' in l or l.startswith('error')][:3]
        print(mid,f,'EXIT',r.returncode,'KILLED' if r.returncode!=0 else 'SURVIVED',' | '.join(fails)[:300],flush=True)
    finally:
        shutil.move(p+'.bak',p)
