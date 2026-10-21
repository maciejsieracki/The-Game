//! Minimal hand-written linear algebra (f64) mirroring the Three.js r169
//! `Vector3` / `Matrix3` / `Matrix4` / `Quaternion` operations that the
//! geometry builders rely on.
//!
//! Every function keeps the exact operation order of the JavaScript source so
//! that results agree with Three.js bit-for-bit wherever the platform `sin`,
//! `cos`, `sqrt`, ... agree, and within a few ULP otherwise. No external math
//! crate is used (dispatch R-RUSTPORT-P4-8: no new dependencies).

/// 3-component vector in f64 (JavaScript numbers are f64).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Vec3 {
    /// X component.
    pub x: f64,
    /// Y component.
    pub y: f64,
    /// Z component.
    pub z: f64,
}

impl Vec3 {
    /// Creates a vector.
    #[must_use]
    pub const fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    /// `this - v`.
    #[must_use]
    pub fn minus(self, v: Self) -> Self {
        Self::new(self.x - v.x, self.y - v.y, self.z - v.z)
    }

    /// `this + v`.
    #[must_use]
    pub fn plus(self, v: Self) -> Self {
        Self::new(self.x + v.x, self.y + v.y, self.z + v.z)
    }

    /// `this * s`.
    #[must_use]
    pub fn scale(self, s: f64) -> Self {
        Self::new(self.x * s, self.y * s, self.z * s)
    }

    /// Dot product.
    #[must_use]
    pub fn dot(self, v: Self) -> f64 {
        self.x * v.x + self.y * v.y + self.z * v.z
    }

    /// Cross product, `Vector3.crossVectors(self, b)`.
    #[must_use]
    pub fn cross(self, b: Self) -> Self {
        let (ax, ay, az) = (self.x, self.y, self.z);
        let (bx, by, bz) = (b.x, b.y, b.z);
        Self::new(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx)
    }

    /// Euclidean length.
    #[must_use]
    pub fn length(self) -> f64 {
        (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
    }

    /// `Vector3.normalize()`: `divideScalar(length() || 1)`, which itself is
    /// `multiplyScalar(1 / s)`.
    #[must_use]
    pub fn normalize(self) -> Self {
        let len = self.length();
        let s = js_or_one(len);
        self.scale(1.0 / s)
    }

    /// `Vector3.lerp(v, alpha)`.
    #[must_use]
    pub fn lerp(self, v: Self, alpha: f64) -> Self {
        Self::new(
            self.x + (v.x - self.x) * alpha,
            self.y + (v.y - self.y) * alpha,
            self.z + (v.z - self.z) * alpha,
        )
    }

    /// Squared distance.
    #[must_use]
    pub fn distance_to_squared(self, v: Self) -> f64 {
        let dx = self.x - v.x;
        let dy = self.y - v.y;
        let dz = self.z - v.z;
        dx * dx + dy * dy + dz * dz
    }

    /// Distance.
    #[must_use]
    pub fn distance_to(self, v: Self) -> f64 {
        self.distance_to_squared(v).sqrt()
    }

    /// `Vector3.applyMatrix4(m)` including the projective divide.
    #[must_use]
    pub fn apply_mat4(self, m: &Mat4) -> Self {
        let (x, y, z) = (self.x, self.y, self.z);
        let e = &m.e;
        let w = 1.0 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
        Self::new(
            (e[0] * x + e[4] * y + e[8] * z + e[12]) * w,
            (e[1] * x + e[5] * y + e[9] * z + e[13]) * w,
            (e[2] * x + e[6] * y + e[10] * z + e[14]) * w,
        )
    }

    /// `Vector3.applyMatrix3(m)`.
    #[must_use]
    pub fn apply_mat3(self, m: &Mat3) -> Self {
        let (x, y, z) = (self.x, self.y, self.z);
        let e = &m.e;
        Self::new(
            e[0] * x + e[3] * y + e[6] * z,
            e[1] * x + e[4] * y + e[7] * z,
            e[2] * x + e[5] * y + e[8] * z,
        )
    }
}

/// JavaScript `x || 1` for a number: `0`, `-0` and `NaN` are falsy.
#[must_use]
pub(crate) fn js_or_one(x: f64) -> f64 {
    if x == 0.0 || x.is_nan() {
        1.0
    } else {
        x
    }
}

/// 4x4 matrix, column-major like `Matrix4.elements`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Mat4 {
    /// Column-major elements (`e[12..15]` is the translation column).
    pub e: [f64; 16],
}

impl Default for Mat4 {
    fn default() -> Self {
        Self::IDENTITY
    }
}

impl Mat4 {
    /// Identity matrix.
    pub const IDENTITY: Self = Self {
        e: [
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
        ],
    };

    /// `Matrix4.set(...)` — arguments in row-major reading order.
    #[allow(clippy::too_many_arguments, clippy::many_single_char_names)]
    #[must_use]
    pub const fn from_rows(
        n11: f64,
        n12: f64,
        n13: f64,
        n14: f64,
        n21: f64,
        n22: f64,
        n23: f64,
        n24: f64,
        n31: f64,
        n32: f64,
        n33: f64,
        n34: f64,
        n41: f64,
        n42: f64,
        n43: f64,
        n44: f64,
    ) -> Self {
        Self {
            e: [
                n11, n21, n31, n41, n12, n22, n32, n42, n13, n23, n33, n43, n14, n24, n34, n44,
            ],
        }
    }

    /// `Matrix4.makeTranslation(x, y, z)`.
    #[must_use]
    pub const fn translation(x: f64, y: f64, z: f64) -> Self {
        Self::from_rows(
            1.0, 0.0, 0.0, x, 0.0, 1.0, 0.0, y, 0.0, 0.0, 1.0, z, 0.0, 0.0, 0.0, 1.0,
        )
    }

    /// `Matrix4.makeScale(x, y, z)`.
    #[must_use]
    pub const fn scaling(x: f64, y: f64, z: f64) -> Self {
        Self::from_rows(
            x, 0.0, 0.0, 0.0, 0.0, y, 0.0, 0.0, 0.0, 0.0, z, 0.0, 0.0, 0.0, 0.0, 1.0,
        )
    }

    /// `Matrix4.makeRotationX(theta)`.
    #[must_use]
    pub fn rotation_x(theta: f64) -> Self {
        let c = theta.cos();
        let s = theta.sin();
        Self::from_rows(
            1.0, 0.0, 0.0, 0.0, 0.0, c, -s, 0.0, 0.0, s, c, 0.0, 0.0, 0.0, 0.0, 1.0,
        )
    }

    /// `Matrix4.makeRotationY(theta)`.
    #[must_use]
    pub fn rotation_y(theta: f64) -> Self {
        let c = theta.cos();
        let s = theta.sin();
        Self::from_rows(
            c, 0.0, s, 0.0, 0.0, 1.0, 0.0, 0.0, -s, 0.0, c, 0.0, 0.0, 0.0, 0.0, 1.0,
        )
    }

    /// `Matrix4.makeRotationZ(theta)`.
    #[must_use]
    pub fn rotation_z(theta: f64) -> Self {
        let c = theta.cos();
        let s = theta.sin();
        Self::from_rows(
            c, -s, 0.0, 0.0, s, c, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
        )
    }

    /// `Matrix4.makeRotationAxis(axis, angle)` (axis must be normalized).
    #[must_use]
    pub fn rotation_axis(axis: Vec3, angle: f64) -> Self {
        let c = angle.cos();
        let s = angle.sin();
        let t = 1.0 - c;
        let (x, y, z) = (axis.x, axis.y, axis.z);
        let tx = t * x;
        let ty = t * y;
        Self::from_rows(
            tx * x + c,
            tx * y - s * z,
            tx * z + s * y,
            0.0,
            tx * y + s * z,
            ty * y + c,
            ty * z - s * x,
            0.0,
            tx * z - s * y,
            ty * z + s * x,
            t * z * z + c,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
        )
    }

    /// `Matrix4.compose(position, quaternion, scale)` — the TRS matrix that
    /// `Object3D.updateMatrix()` builds.
    #[must_use]
    pub fn compose(position: Vec3, q: Quat, scale: Vec3) -> Self {
        let (x, y, z, w) = (q.x, q.y, q.z, q.w);
        let x2 = x + x;
        let y2 = y + y;
        let z2 = z + z;
        let xx = x * x2;
        let xy = x * y2;
        let xz = x * z2;
        let yy = y * y2;
        let yz = y * z2;
        let zz = z * z2;
        let wx = w * x2;
        let wy = w * y2;
        let wz = w * z2;
        let (sx, sy, sz) = (scale.x, scale.y, scale.z);
        Self {
            e: [
                (1.0 - (yy + zz)) * sx,
                (xy + wz) * sx,
                (xz - wy) * sx,
                0.0,
                (xy - wz) * sy,
                (1.0 - (xx + zz)) * sy,
                (yz + wx) * sy,
                0.0,
                (xz + wy) * sz,
                (yz - wx) * sz,
                (1.0 - (xx + yy)) * sz,
                0.0,
                position.x,
                position.y,
                position.z,
                1.0,
            ],
        }
    }

    /// TRS from an Euler rotation (`Object3D.position/rotation/scale`).
    #[must_use]
    pub fn from_trs(position: Vec3, rotation: Euler, scale: Vec3) -> Self {
        Self::compose(position, Quat::from_euler(rotation), scale)
    }

    /// `Matrix4.multiplyMatrices(self, b)` = `self * b` (apply `b` first).
    #[must_use]
    #[allow(clippy::similar_names)]
    pub fn mul(&self, b: &Self) -> Self {
        let ae = &self.e;
        let be = &b.e;
        let (a11, a12, a13, a14) = (ae[0], ae[4], ae[8], ae[12]);
        let (a21, a22, a23, a24) = (ae[1], ae[5], ae[9], ae[13]);
        let (a31, a32, a33, a34) = (ae[2], ae[6], ae[10], ae[14]);
        let (a41, a42, a43, a44) = (ae[3], ae[7], ae[11], ae[15]);
        let (b11, b12, b13, b14) = (be[0], be[4], be[8], be[12]);
        let (b21, b22, b23, b24) = (be[1], be[5], be[9], be[13]);
        let (b31, b32, b33, b34) = (be[2], be[6], be[10], be[14]);
        let (b41, b42, b43, b44) = (be[3], be[7], be[11], be[15]);
        let mut te = [0.0; 16];
        te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
        te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
        te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
        te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
        Self { e: te }
    }
}

/// 3x3 matrix, column-major like `Matrix3.elements`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Mat3 {
    /// Column-major elements.
    pub e: [f64; 9],
}

impl Mat3 {
    /// `Matrix3.getNormalMatrix(m)` = `setFromMatrix4(m).invert().transpose()`.
    #[must_use]
    pub fn normal_matrix(m: &Mat4) -> Self {
        let me = &m.e;
        // setFromMatrix4: upper-left 3x3, still column-major.
        let te = [
            me[0], me[1], me[2], me[4], me[5], me[6], me[8], me[9], me[10],
        ];
        // invert()
        let (n11, n21, n31) = (te[0], te[1], te[2]);
        let (n12, n22, n32) = (te[3], te[4], te[5]);
        let (n13, n23, n33) = (te[6], te[7], te[8]);
        let t11 = n33 * n22 - n32 * n23;
        let t12 = n32 * n13 - n33 * n12;
        let t13 = n23 * n12 - n22 * n13;
        let det = n11 * t11 + n21 * t12 + n31 * t13;
        let mut inv = [0.0; 9];
        if det != 0.0 {
            let det_inv = 1.0 / det;
            inv[0] = t11 * det_inv;
            inv[1] = (n31 * n23 - n33 * n21) * det_inv;
            inv[2] = (n32 * n21 - n31 * n22) * det_inv;
            inv[3] = t12 * det_inv;
            inv[4] = (n33 * n11 - n31 * n13) * det_inv;
            inv[5] = (n31 * n12 - n32 * n11) * det_inv;
            inv[6] = t13 * det_inv;
            inv[7] = (n21 * n13 - n23 * n11) * det_inv;
            inv[8] = (n22 * n11 - n21 * n12) * det_inv;
        }
        // transpose()
        inv.swap(1, 3);
        inv.swap(2, 6);
        inv.swap(5, 7);
        Self { e: inv }
    }
}

/// Unit quaternion.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Quat {
    /// X.
    pub x: f64,
    /// Y.
    pub y: f64,
    /// Z.
    pub z: f64,
    /// W.
    pub w: f64,
}

impl Default for Quat {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
        }
    }
}

/// Rotation order of an [`Euler`] (Three.js `Euler.order`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum EulerOrder {
    /// `'XYZ'` (Three.js default).
    #[default]
    Xyz,
    /// `'YXZ'`.
    Yxz,
    /// `'ZXY'`.
    Zxy,
    /// `'ZYX'`.
    Zyx,
    /// `'YZX'`.
    Yzx,
    /// `'XZY'`.
    Xzy,
}

/// Euler angles in radians (Three.js `Euler`).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Euler {
    /// Rotation about X.
    pub x: f64,
    /// Rotation about Y.
    pub y: f64,
    /// Rotation about Z.
    pub z: f64,
    /// Application order.
    pub order: EulerOrder,
}

impl Euler {
    /// Euler angles with the default `XYZ` order.
    #[must_use]
    pub const fn xyz(x: f64, y: f64, z: f64) -> Self {
        Self {
            x,
            y,
            z,
            order: EulerOrder::Xyz,
        }
    }
}

impl Quat {
    /// `Quaternion.setFromEuler(euler)`.
    #[must_use]
    pub fn from_euler(eu: Euler) -> Self {
        let c1 = (eu.x / 2.0).cos();
        let c2 = (eu.y / 2.0).cos();
        let c3 = (eu.z / 2.0).cos();
        let s1 = (eu.x / 2.0).sin();
        let s2 = (eu.y / 2.0).sin();
        let s3 = (eu.z / 2.0).sin();
        let (x, y, z, w) = match eu.order {
            EulerOrder::Xyz => (
                s1 * c2 * c3 + c1 * s2 * s3,
                c1 * s2 * c3 - s1 * c2 * s3,
                c1 * c2 * s3 + s1 * s2 * c3,
                c1 * c2 * c3 - s1 * s2 * s3,
            ),
            EulerOrder::Yxz => (
                s1 * c2 * c3 + c1 * s2 * s3,
                c1 * s2 * c3 - s1 * c2 * s3,
                c1 * c2 * s3 - s1 * s2 * c3,
                c1 * c2 * c3 + s1 * s2 * s3,
            ),
            EulerOrder::Zxy => (
                s1 * c2 * c3 - c1 * s2 * s3,
                c1 * s2 * c3 + s1 * c2 * s3,
                c1 * c2 * s3 + s1 * s2 * c3,
                c1 * c2 * c3 - s1 * s2 * s3,
            ),
            EulerOrder::Zyx => (
                s1 * c2 * c3 - c1 * s2 * s3,
                c1 * s2 * c3 + s1 * c2 * s3,
                c1 * c2 * s3 - s1 * s2 * c3,
                c1 * c2 * c3 + s1 * s2 * s3,
            ),
            EulerOrder::Yzx => (
                s1 * c2 * c3 + c1 * s2 * s3,
                c1 * s2 * c3 + s1 * c2 * s3,
                c1 * c2 * s3 - s1 * s2 * c3,
                c1 * c2 * c3 - s1 * s2 * s3,
            ),
            EulerOrder::Xzy => (
                s1 * c2 * c3 - c1 * s2 * s3,
                c1 * s2 * c3 - s1 * c2 * s3,
                c1 * c2 * s3 + s1 * s2 * c3,
                c1 * c2 * c3 + s1 * s2 * s3,
            ),
        };
        Self { x, y, z, w }
    }
}
