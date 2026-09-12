#[path = "../src/domain/resource_production.rs"]
mod resource_production;

use resource_production::{resolve_resource_production, stack_resource_production, ResourceKey};

#[test]
fn lumber_mill_and_quarry_follow_the_200_300_450_era_vector() {
    for (era, expected) in [(1, 200), (2, 300), (3, 450)] {
        assert_eq!(
            resolve_resource_production("tartak", era)
                .expect("lumber mill produces wood")
                .amount,
            expected
        );
        assert_eq!(
            resolve_resource_production("kamieniolom", era)
                .expect("quarry produces stone")
                .amount,
            expected
        );
    }
}

#[test]
fn invalid_or_missing_era_is_safe_and_other_improvements_stay_flat() {
    for era in [0, 4, 99] {
        assert_eq!(
            resolve_resource_production("tartak", era)
                .expect("lumber mill produces wood")
                .amount,
            200
        );
        assert_eq!(
            resolve_resource_production("kamieniolom", era)
                .expect("quarry produces stone")
                .amount,
            200
        );
    }

    for (key, resource, amount) in [
        ("glinianka", ResourceKey::Clay, 50),
        ("kopalnia_miedzi", ResourceKey::CopperOre, 20),
        ("kopalnia_zelaza", ResourceKey::IronOre, 20),
        ("kopalnia_cyny", ResourceKey::TinOre, 20),
        ("warzelnia_soli", ResourceKey::Salt, 50),
        ("stadnina", ResourceKey::Horse, 25),
        ("kopalnia_zlota", ResourceKey::Gold, 1),
    ] {
        let yield_row = resolve_resource_production(key, 3).expect("known producer");
        assert_eq!(yield_row.resource, resource, "resource for {key}");
        assert_eq!(yield_row.amount, amount, "amount for {key}");
    }

    assert_eq!(ResourceKey::Wood.as_str(), "drewno");
    assert_eq!(
        serde_json::to_string(&ResourceKey::CopperOre).expect("resource serializes"),
        "\"ruda\""
    );
}

#[test]
fn multiple_layers_stack_additively_per_resource() {
    let totals = stack_resource_production(["tartak", "tartak", "kamieniolom", "glinianka"], 3);

    assert_eq!(totals.amount_for(ResourceKey::Wood), 900);
    assert_eq!(totals.amount_for(ResourceKey::Stone), 450);
    assert_eq!(totals.amount_for(ResourceKey::Clay), 50);
    assert_eq!(totals.amount_for(ResourceKey::Gold), 0);
    assert_eq!(totals.get(ResourceKey::Stone), Some(450));
}

#[test]
fn resolver_rejects_non_producers_and_accepts_legacy_aliases() {
    assert!(resolve_resource_production("farma", 1).is_none());
    assert!(resolve_resource_production("nieznane", 1).is_none());
    assert_eq!(
        resolve_resource_production("lumber_mill", 2)
            .expect("English alias")
            .resource,
        ResourceKey::Wood
    );
    assert_eq!(
        resolve_resource_production("quarry", 2)
            .expect("English alias")
            .amount,
        300
    );
    assert_eq!(
        resource_production::resource_yield_for_improvement("tartak", 1)
            .expect("resolver compatibility alias")
            .amount,
        200
    );
    assert_eq!(
        resource_production::territory_resource_yield_for_improvement("tartak", 1)
            .expect("territorial resolver compatibility alias")
            .resource,
        ResourceKey::Wood
    );
    assert_eq!(
        resource_production::resource_production_for("kamieniolom", 3)
            .expect("short resolver compatibility alias")
            .amount,
        450
    );
}

#[test]
fn era_scaling_rounds_like_the_typescript_resolver_and_saturates() {
    assert_eq!(
        resource_production::resource_production_amount_for_era("tartak", 5, 2),
        8
    );
    assert_eq!(
        resource_production::resource_production_amount_for_era("tartak", 5, 3),
        11
    );
    assert_eq!(
        resource_production::resource_production_amount_for_era("tartak", u32::MAX, 3),
        u32::MAX
    );
}
