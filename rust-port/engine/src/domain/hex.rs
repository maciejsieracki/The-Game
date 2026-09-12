use serde::{Deserialize, Serialize};
use std::{fmt, str::FromStr};

/// Axial coordinates for a pointy-top hex grid.
///
/// The third cube coordinate is derived as `s = -q - r`; storing only the
/// axial pair keeps the value compact while preserving the cube invariants.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub struct HexCoord {
    pub q: i32,
    pub r: i32,
}

pub type Hex = HexCoord;
pub type AxialCoord = HexCoord;

impl HexCoord {
    pub const fn new(q: i32, r: i32) -> Self {
        Self { q, r }
    }

    pub const fn q(self) -> i32 {
        self.q
    }

    pub const fn r(self) -> i32 {
        self.r
    }

    pub const fn s(self) -> i32 {
        -self.q - self.r
    }

    pub const fn cube(self) -> CubeCoord {
        CubeCoord {
            q: self.q,
            r: self.r,
            s: self.s(),
        }
    }

    pub const fn from_cube(cube: CubeCoord) -> Self {
        debug_assert!(cube.is_valid());
        Self::new(cube.q, cube.r)
    }

    /// Returns the six adjacent cells in clockwise axial order, starting east.
    pub const fn neighbors(self) -> [Self; 6] {
        [
            Self::new(self.q + 1, self.r),
            Self::new(self.q + 1, self.r - 1),
            Self::new(self.q, self.r - 1),
            Self::new(self.q - 1, self.r),
            Self::new(self.q - 1, self.r + 1),
            Self::new(self.q, self.r + 1),
        ]
    }

    pub const fn neighbor(self, direction: HexDirection) -> Self {
        let (dq, dr) = direction.offset();
        Self::new(self.q + dq, self.r + dr)
    }

    pub const fn distance(self, other: Self) -> u32 {
        let dq = (self.q - other.q).unsigned_abs();
        let dr = (self.r - other.r).unsigned_abs();
        let ds = (self.s() - other.s()).unsigned_abs();
        let max_qr = if dq > dr { dq } else { dr };
        if max_qr > ds {
            max_qr
        } else {
            ds
        }
    }

    pub const fn is_adjacent(self, other: Self) -> bool {
        self.distance(other) == 1
    }

    pub const fn within_distance(self, other: Self, radius: u32) -> bool {
        self.distance(other) <= radius
    }

    /// Canonical map key used by the existing game data (`q,r`).
    pub fn key(self) -> String {
        format!("{},{}", self.q, self.r)
    }
}

impl fmt::Display for HexCoord {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{},{}", self.q, self.r)
    }
}

impl From<(i32, i32)> for HexCoord {
    fn from((q, r): (i32, i32)) -> Self {
        Self::new(q, r)
    }
}

impl FromStr for HexCoord {
    type Err = HexCoordParseError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        let mut parts = value.split(',');
        let q = parts
            .next()
            .ok_or(HexCoordParseError::MissingQ)?
            .trim()
            .parse()
            .map_err(|_| HexCoordParseError::InvalidQ)?;
        let r = parts
            .next()
            .ok_or(HexCoordParseError::MissingR)?
            .trim()
            .parse()
            .map_err(|_| HexCoordParseError::InvalidR)?;
        if parts.next().is_some() {
            return Err(HexCoordParseError::TooManyComponents);
        }
        Ok(Self::new(q, r))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HexCoordParseError {
    MissingQ,
    MissingR,
    InvalidQ,
    InvalidR,
    TooManyComponents,
}

impl fmt::Display for HexCoordParseError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = match self {
            Self::MissingQ => "missing q coordinate",
            Self::MissingR => "missing r coordinate",
            Self::InvalidQ => "invalid q coordinate",
            Self::InvalidR => "invalid r coordinate",
            Self::TooManyComponents => "too many coordinate components",
        };
        formatter.write_str(message)
    }
}

impl std::error::Error for HexCoordParseError {}

/// Cube representation of an axial coordinate.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CubeCoord {
    pub q: i32,
    pub r: i32,
    pub s: i32,
}

impl CubeCoord {
    pub const fn new(q: i32, r: i32, s: i32) -> Option<Self> {
        if q + r + s == 0 {
            Some(Self { q, r, s })
        } else {
            None
        }
    }

    pub const fn is_valid(self) -> bool {
        self.q + self.r + self.s == 0
    }
}

/// Direction names for the six axial neighbors.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum HexDirection {
    East,
    NorthEast,
    NorthWest,
    West,
    SouthWest,
    SouthEast,
}

pub type Direction = HexDirection;

pub const fn hex_distance(from: HexCoord, to: HexCoord) -> u32 {
    from.distance(to)
}

pub const fn neighbors(coordinate: HexCoord) -> [HexCoord; 6] {
    coordinate.neighbors()
}

impl HexDirection {
    pub const ALL: [Self; 6] = [
        Self::East,
        Self::NorthEast,
        Self::NorthWest,
        Self::West,
        Self::SouthWest,
        Self::SouthEast,
    ];

    pub const fn offset(self) -> (i32, i32) {
        match self {
            Self::East => (1, 0),
            Self::NorthEast => (1, -1),
            Self::NorthWest => (0, -1),
            Self::West => (-1, 0),
            Self::SouthWest => (-1, 1),
            Self::SouthEast => (0, 1),
        }
    }
}
