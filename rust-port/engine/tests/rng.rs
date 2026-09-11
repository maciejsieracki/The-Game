use civ_engine::{Rng, RngError};

#[test]
fn seeded_stream_matches_the_typescript_lcg_and_repeats() {
    let expected = [
        (1_083_814_273, 0.2523451747838408),
        (378_494_188, 0.08812504541128874),
        (2_479_403_867, 0.5772811982315034),
        (955_863_294, 0.22255426598712802),
        (1_613_448_261, 0.37566019711084664),
    ];

    let mut first = Rng::new(42);
    let mut repeated = Rng::new(42);

    for (expected_state, _) in expected {
        assert_eq!(first.next_u32(), expected_state);
        assert_eq!(first.state(), expected_state);
    }

    let mut values = Rng::new(42);
    for (_, expected_value) in expected {
        assert_eq!(values.next_f64(), expected_value);
    }

    let mut first = Rng::new(42);
    for _ in 0..expected.len() {
        assert_eq!(first.next_u32(), repeated.next_u32());
    }
}

#[test]
fn copied_state_and_forks_reproduce_independent_streams() {
    let mut parent = Rng::new(7);
    let _ = parent.next_u32();
    let checkpoint = parent.state();

    let mut resumed = Rng::from_state(checkpoint);
    assert_eq!(parent.next_u32(), resumed.next_u32());

    let branch_parent = Rng::from_state(checkpoint);
    let mut left = branch_parent.fork(1);
    let mut right = branch_parent.fork(2);
    let left_first = left.next_u32();
    let right_first = right.next_u32();
    assert_ne!(left_first, right_first);
    assert_eq!(left_first, branch_parent.fork(1).next_u32());
    assert_eq!(right_first, branch_parent.fork(2).next_u32());
    assert_eq!(branch_parent.state(), checkpoint);

    let left_second = left.next_u32();
    let right_second = right.next_u32();
    assert_ne!(left_second, right_second);
}

#[test]
fn serialized_state_round_trip_resumes_the_exact_stream() {
    let mut original = Rng::new(0xdead_beef);
    for _ in 0..3 {
        original.next_u32();
    }

    let encoded = serde_json::to_string(&original).expect("RNG state serializes");
    let restored: Rng = serde_json::from_str(&encoded).expect("RNG state deserializes");

    assert_eq!(restored, original);

    let mut expected = original;
    let mut resumed = restored;
    for _ in 0..16 {
        assert_eq!(resumed.next_u32(), expected.next_u32());
    }
}

#[test]
fn ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end() {
    assert_eq!(
        Rng::new(1).gen_range(3, 3),
        Err(RngError::InvalidRange { start: 3, end: 3 })
    );
    assert_eq!(
        Rng::new(1).gen_range(8, 2),
        Err(RngError::InvalidRange { start: 8, end: 2 })
    );

    let mut rng = Rng::new(123);
    for _ in 0..4_096 {
        let value = rng.gen_range(10, 13).expect("non-empty range is valid");
        assert!((10..13).contains(&value));
    }
}
