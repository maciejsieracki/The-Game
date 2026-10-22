#![forbid(unsafe_code)]
fn main() {
    let svg = r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 12h18M12 3v18" stroke="#e8d88a" stroke-width="2" fill="none"/></svg>"##;
    let tree = resvg::usvg::Tree::from_str(svg, &resvg::usvg::Options::default()).unwrap();
    let mut pm = resvg::tiny_skia::Pixmap::new(92, 92).unwrap();
    let s = 92.0 / 24.0;
    resvg::render(&tree, resvg::tiny_skia::Transform::from_scale(s, s), &mut pm.as_mut());
    let nz = pm.data().chunks(4).filter(|p| p[3] != 0).count();
    println!("svg rendered 92x92, non-transparent px = {nz}");
}
