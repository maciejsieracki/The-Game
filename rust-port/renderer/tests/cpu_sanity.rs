//! CPU sanity test: the crate and all its modules build and link without
//! any GPU stack, and the build-configuration readback is truthful.

#[test]
fn gpu_feature_readback_matches_build_configuration() {
    assert_eq!(civ_renderer::gpu_feature_enabled(), cfg!(feature = "gpu"));
}
