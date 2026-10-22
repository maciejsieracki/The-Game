//! Operation-for-operation replicas of the Three.js r169 math used by the
//! web picker (`three@0.169.0`, `src/math/{Vector3,Matrix4,Quaternion,Ray,
//! Sphere,Box3,Triangle}.js`).
//!
//! Every function keeps the exact order of IEEE 754 double operations of the
//! JavaScript original (Rust does not contract `a * b + c` into FMA), so the
//! results are bit-identical to the browser as long as the inputs are. Each
//! item names the Three.js method it mirrors.
//!
//! `Math.sin/cos` go through [`crate::jsmath`] (V8 fdlibm, bit-exact), not the
//! platform `libm` (R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1).

use crate::jsmath::{js_cos, js_sin};

/// `Math.min` for non-NaN inputs, including `Math.min(-0, +0) == -0`.
#[must_use]
pub fn js_min(a: f64, b: f64) -> f64 {
    if a < b || (a == b && a.is_sign_negative()) {
        a
    } else {
        b
    }
}

/// `Math.max` for non-NaN inputs, including `Math.max(-0, +0) == +0`.
#[must_use]
pub fn js_max(a: f64, b: f64) -> f64 {
    if a > b || (a == b && a.is_sign_positive()) {
        a
    } else {
        b
    }
}

/// `THREE.Vector3` (double precision, like JS numbers).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Vec3 {
    /// X component.
    pub x: f64,
    /// Y component.
    pub y: f64,
    /// Z component.
    pub z: f64,
}

impl Vec3 {
    /// `new Vector3(x, y, z)`.
    #[must_use]
    pub const fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    /// `subVectors(self, o)`.
    #[must_use]
    pub fn sub_vec(self, o: Self) -> Self {
        Self::new(self.x - o.x, self.y - o.y, self.z - o.z)
    }

    /// `addVectors(self, o)`.
    #[must_use]
    pub fn add_vec(self, o: Self) -> Self {
        Self::new(self.x + o.x, self.y + o.y, self.z + o.z)
    }

    /// `multiplyScalar(s)`.
    #[must_use]
    pub fn scale(self, s: f64) -> Self {
        Self::new(self.x * s, self.y * s, self.z * s)
    }

    /// `dot(o)`.
    #[must_use]
    pub fn dot(self, o: Self) -> f64 {
        self.x * o.x + self.y * o.y + self.z * o.z
    }

    /// `crossVectors(self, b)`.
    #[must_use]
    pub fn cross(self, b: Self) -> Self {
        Self::new(
            self.y * b.z - self.z * b.y,
            self.z * b.x - self.x * b.z,
            self.x * b.y - self.y * b.x,
        )
    }

    /// `lengthSq()`.
    #[must_use]
    pub fn length_sq(self) -> f64 {
        self.x * self.x + self.y * self.y + self.z * self.z
    }

    /// `length()`.
    #[must_use]
    pub fn length(self) -> f64 {
        self.length_sq().sqrt()
    }

    /// `normalize()` = `divideScalar(length() || 1)` = `multiplyScalar(1 / len)`.
    #[must_use]
    pub fn normalize(self) -> Self {
        let len = self.length();
        // JS `len || 1`: 0 and NaN are falsy.
        let len = if len == 0.0 || len.is_nan() { 1.0 } else { len };
        self.scale(1.0 / len)
    }

    /// `addScaledVector(v, s)`.
    #[must_use]
    pub fn add_scaled(self, v: Self, s: f64) -> Self {
        Self::new(self.x + v.x * s, self.y + v.y * s, self.z + v.z * s)
    }

    /// `distanceToSquared(v)`.
    #[must_use]
    pub fn distance_to_squared(self, v: Self) -> f64 {
        let dx = self.x - v.x;
        let dy = self.y - v.y;
        let dz = self.z - v.z;
        dx * dx + dy * dy + dz * dz
    }

    /// `distanceTo(v)`.
    #[must_use]
    pub fn distance_to(self, v: Self) -> f64 {
        self.distance_to_squared(v).sqrt()
    }

    /// `applyMatrix4(m)` (projective: divides by `w`).
    #[must_use]
    pub fn apply_matrix4(self, m: &Mat4) -> Self {
        let (x, y, z) = (self.x, self.y, self.z);
        let e = &m.e;
        let w = 1.0 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
        Self::new(
            (e[0] * x + e[4] * y + e[8] * z + e[12]) * w,
            (e[1] * x + e[5] * y + e[9] * z + e[13]) * w,
            (e[2] * x + e[6] * y + e[10] * z + e[14]) * w,
        )
    }

    /// `transformDirection(m)` (upper 3x3, then `normalize()`).
    #[must_use]
    pub fn transform_direction(self, m: &Mat4) -> Self {
        let (x, y, z) = (self.x, self.y, self.z);
        let e = &m.e;
        Self::new(
            e[0] * x + e[4] * y + e[8] * z,
            e[1] * x + e[5] * y + e[9] * z,
            e[2] * x + e[6] * y + e[10] * z,
        )
        .normalize()
    }

    /// `min(v)` (component-wise `Math.min`).
    #[must_use]
    pub fn min(self, v: Self) -> Self {
        Self::new(
            js_min(self.x, v.x),
            js_min(self.y, v.y),
            js_min(self.z, v.z),
        )
    }

    /// `max(v)` (component-wise `Math.max`).
    #[must_use]
    pub fn max(self, v: Self) -> Self {
        Self::new(
            js_max(self.x, v.x),
            js_max(self.y, v.y),
            js_max(self.z, v.z),
        )
    }
}

/// `THREE.Quaternion`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Quat {
    /// X component.
    pub x: f64,
    /// Y component.
    pub y: f64,
    /// Z component.
    pub z: f64,
    /// W component.
    pub w: f64,
}

impl Quat {
    /// Identity quaternion.
    pub const IDENTITY: Self = Self {
        x: 0.0,
        y: 0.0,
        z: 0.0,
        w: 1.0,
    };

    /// `setFromEuler(new Euler(x, y, z, 'XYZ'))` (the default order used by
    /// `Object3D.rotation`).
    #[must_use]
    pub fn from_euler_xyz(x: f64, y: f64, z: f64) -> Self {
        let c1 = js_cos(x / 2.0);
        let c2 = js_cos(y / 2.0);
        let c3 = js_cos(z / 2.0);
        let s1 = js_sin(x / 2.0);
        let s2 = js_sin(y / 2.0);
        let s3 = js_sin(z / 2.0);
        Self {
            x: s1 * c2 * c3 + c1 * s2 * s3,
            y: c1 * s2 * c3 - s1 * c2 * s3,
            z: c1 * c2 * s3 + s1 * s2 * c3,
            w: c1 * c2 * c3 - s1 * s2 * s3,
        }
    }

    /// `setFromRotationMatrix(m)` (upper 3x3 must be a pure rotation).
    #[must_use]
    pub fn from_rotation_matrix(m: &Mat4) -> Self {
        let te = &m.e;
        let (m11, m12, m13) = (te[0], te[4], te[8]);
        let (m21, m22, m23) = (te[1], te[5], te[9]);
        let (m31, m32, m33) = (te[2], te[6], te[10]);
        let trace = m11 + m22 + m33;
        if trace > 0.0 {
            let s = 0.5 / (trace + 1.0).sqrt();
            Self {
                w: 0.25 / s,
                x: (m32 - m23) * s,
                y: (m13 - m31) * s,
                z: (m21 - m12) * s,
            }
        } else if m11 > m22 && m11 > m33 {
            let s = 2.0 * (1.0 + m11 - m22 - m33).sqrt();
            Self {
                w: (m32 - m23) / s,
                x: 0.25 * s,
                y: (m12 + m21) / s,
                z: (m13 + m31) / s,
            }
        } else if m22 > m33 {
            let s = 2.0 * (1.0 + m22 - m11 - m33).sqrt();
            Self {
                w: (m13 - m31) / s,
                x: (m12 + m21) / s,
                y: 0.25 * s,
                z: (m23 + m32) / s,
            }
        } else {
            let s = 2.0 * (1.0 + m33 - m11 - m22).sqrt();
            Self {
                w: (m21 - m12) / s,
                x: (m13 + m31) / s,
                y: (m23 + m32) / s,
                z: 0.25 * s,
            }
        }
    }
}

/// `THREE.Matrix4`: 16 doubles in column-major order (`elements`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Mat4 {
    /// Column-major elements, exactly like `Matrix4.elements`.
    pub e: [f64; 16],
}

impl Mat4 {
    /// Identity matrix.
    pub const IDENTITY: Self = Self {
        e: [
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
        ],
    };

    /// Widens an instance matrix stored as `Float32Array`
    /// (`InstancedMesh.getMatrixAt`) to doubles; exact.
    #[must_use]
    pub fn from_f32(m: &[f32; 16]) -> Self {
        let mut e = [0.0; 16];
        for (d, s) in e.iter_mut().zip(m.iter()) {
            *d = f64::from(*s);
        }
        Self { e }
    }

    /// Narrows to `Float32Array` storage (`InstancedMesh.setMatrixAt`).
    #[must_use]
    // Rounding to f32 is the point: this mirrors the Float32Array store.
    #[allow(clippy::cast_possible_truncation)]
    pub fn to_f32(&self) -> [f32; 16] {
        let mut out = [0.0f32; 16];
        for (d, s) in out.iter_mut().zip(self.e.iter()) {
            *d = *s as f32;
        }
        out
    }

    /// `makeScale(x, y, z)`.
    #[must_use]
    pub fn make_scale(x: f64, y: f64, z: f64) -> Self {
        let mut m = Self::IDENTITY;
        m.e[0] = x;
        m.e[5] = y;
        m.e[10] = z;
        m
    }

    /// `multiplyMatrices(a, b)` = `a * b`.
    #[must_use]
    pub fn multiply(a: &Self, b: &Self) -> Self {
        let ae = &a.e;
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

    /// `invert()` (cofactor formula; a singular matrix becomes all zeros).
    #[must_use]
    pub fn invert(&self) -> Self {
        let te = &self.e;
        let (n11, n21, n31, n41) = (te[0], te[1], te[2], te[3]);
        let (n12, n22, n32, n42) = (te[4], te[5], te[6], te[7]);
        let (n13, n23, n33, n43) = (te[8], te[9], te[10], te[11]);
        let (n14, n24, n34, n44) = (te[12], te[13], te[14], te[15]);
        let t11 =
            n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44
                + n22 * n33 * n44;
        let t12 =
            n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44
                - n12 * n33 * n44;
        let t13 =
            n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44
                + n12 * n23 * n44;
        let t14 =
            n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34
                - n12 * n23 * n34;
        let det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
        if det == 0.0 {
            return Self { e: [0.0; 16] };
        }
        let det_inv = 1.0 / det;
        let mut o = [0.0; 16];
        o[0] = t11 * det_inv;
        o[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43
            + n21 * n34 * n43
            + n23 * n31 * n44
            - n21 * n33 * n44)
            * det_inv;
        o[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42
            - n21 * n34 * n42
            - n22 * n31 * n44
            + n21 * n32 * n44)
            * det_inv;
        o[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42
            + n21 * n33 * n42
            + n22 * n31 * n43
            - n21 * n32 * n43)
            * det_inv;
        o[4] = t12 * det_inv;
        o[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43
            - n11 * n34 * n43
            - n13 * n31 * n44
            + n11 * n33 * n44)
            * det_inv;
        o[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42
            + n11 * n34 * n42
            + n12 * n31 * n44
            - n11 * n32 * n44)
            * det_inv;
        o[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42
            - n11 * n33 * n42
            - n12 * n31 * n43
            + n11 * n32 * n43)
            * det_inv;
        o[8] = t13 * det_inv;
        o[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43
            + n11 * n24 * n43
            + n13 * n21 * n44
            - n11 * n23 * n44)
            * det_inv;
        o[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42
            - n11 * n24 * n42
            - n12 * n21 * n44
            + n11 * n22 * n44)
            * det_inv;
        o[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42
            + n11 * n23 * n42
            + n12 * n21 * n43
            - n11 * n22 * n43)
            * det_inv;
        o[12] = t14 * det_inv;
        o[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33
            - n11 * n24 * n33
            - n13 * n21 * n34
            + n11 * n23 * n34)
            * det_inv;
        o[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32
            + n11 * n24 * n32
            + n12 * n21 * n34
            - n11 * n22 * n34)
            * det_inv;
        o[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32
            - n11 * n23 * n32
            - n12 * n21 * n33
            + n11 * n22 * n33)
            * det_inv;
        Self { e: o }
    }

    /// `compose(position, quaternion, scale)`.
    #[must_use]
    pub fn compose(position: Vec3, q: Quat, scale: Vec3) -> Self {
        let (x, y, z, w) = (q.x, q.y, q.z, q.w);
        let (x2, y2, z2) = (x + x, y + y, z + z);
        let (xx, xy, xz) = (x * x2, x * y2, x * z2);
        let (yy, yz, zz) = (y * y2, y * z2, z * z2);
        let (wx, wy, wz) = (w * x2, w * y2, w * z2);
        let (sx, sy, sz) = (scale.x, scale.y, scale.z);
        let mut te = [0.0; 16];
        te[0] = (1.0 - (yy + zz)) * sx;
        te[1] = (xy + wz) * sx;
        te[2] = (xz - wy) * sx;
        te[3] = 0.0;
        te[4] = (xy - wz) * sy;
        te[5] = (1.0 - (xx + zz)) * sy;
        te[6] = (yz + wx) * sy;
        te[7] = 0.0;
        te[8] = (xz + wy) * sz;
        te[9] = (yz - wx) * sz;
        te[10] = (1.0 - (xx + yy)) * sz;
        te[11] = 0.0;
        te[12] = position.x;
        te[13] = position.y;
        te[14] = position.z;
        te[15] = 1.0;
        Self { e: te }
    }

    /// `lookAt(eye, target, up)` applied to the identity (only the upper 3x3
    /// is written, like Three.js; the rest stays identity).
    #[must_use]
    pub fn look_at(eye: Vec3, target: Vec3, up: Vec3) -> Self {
        let mut z = eye.sub_vec(target);
        if z.length_sq() == 0.0 {
            z.z = 1.0;
        }
        z = z.normalize();
        let mut x = up.cross(z);
        if x.length_sq() == 0.0 {
            if up.z.abs() == 1.0 {
                z.x += 0.0001;
            } else {
                z.z += 0.0001;
            }
            z = z.normalize();
            x = up.cross(z);
        }
        x = x.normalize();
        let y = z.cross(x);
        let mut m = Self::IDENTITY;
        m.e[0] = x.x;
        m.e[4] = y.x;
        m.e[8] = z.x;
        m.e[1] = x.y;
        m.e[5] = y.y;
        m.e[9] = z.y;
        m.e[2] = x.z;
        m.e[6] = y.z;
        m.e[10] = z.z;
        m
    }

    /// `makePerspective(left, right, top, bottom, near, far)` with the
    /// default `WebGLCoordinateSystem`.
    #[must_use]
    pub fn make_perspective(
        left: f64,
        right: f64,
        top: f64,
        bottom: f64,
        near: f64,
        far: f64,
    ) -> Self {
        let x = 2.0 * near / (right - left);
        let y = 2.0 * near / (top - bottom);
        let a = (right + left) / (right - left);
        let b = (top + bottom) / (top - bottom);
        let c = -(far + near) / (far - near);
        let d = (-2.0 * far * near) / (far - near);
        Self {
            e: [
                x, 0.0, 0.0, 0.0, 0.0, y, 0.0, 0.0, a, b, c, -1.0, 0.0, 0.0, d, 0.0,
            ],
        }
    }

    /// `getMaxScaleOnAxis()`.
    #[must_use]
    pub fn max_scale_on_axis(&self) -> f64 {
        let te = &self.e;
        let sx = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
        let sy = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
        let sz = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];
        js_max(js_max(sx, sy), sz).sqrt()
    }

    /// `setFromMatrixPosition(m)`.
    #[must_use]
    pub fn position(&self) -> Vec3 {
        Vec3::new(self.e[12], self.e[13], self.e[14])
    }
}

/// `THREE.Sphere` (only what `Mesh.raycast` needs).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Sphere {
    /// Centre.
    pub center: Vec3,
    /// Radius.
    pub radius: f64,
}

impl Sphere {
    /// `applyMatrix4(m)`.
    #[must_use]
    pub fn apply_matrix4(self, m: &Mat4) -> Self {
        Self {
            center: self.center.apply_matrix4(m),
            radius: self.radius * m.max_scale_on_axis(),
        }
    }

    /// `containsPoint(p)`.
    #[must_use]
    pub fn contains_point(&self, p: Vec3) -> bool {
        p.distance_to_squared(self.center) <= self.radius * self.radius
    }
}

/// `THREE.Ray`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Ray {
    /// Origin.
    pub origin: Vec3,
    /// Direction (normalized by every producer in this module).
    pub direction: Vec3,
}

impl Ray {
    /// `at(t)`.
    #[must_use]
    pub fn at(&self, t: f64) -> Vec3 {
        self.origin.add_scaled(self.direction, t)
    }

    /// `applyMatrix4(m)`: origin projectively, direction via
    /// `transformDirection` (re-normalized).
    #[must_use]
    pub fn apply_matrix4(&self, m: &Mat4) -> Self {
        Self {
            origin: self.origin.apply_matrix4(m),
            direction: self.direction.transform_direction(m),
        }
    }

    /// `distanceToPlane(plane)` for `Plane(normal, constant)`.
    #[must_use]
    pub fn distance_to_plane(&self, normal: Vec3, constant: f64) -> Option<f64> {
        let denominator = normal.dot(self.direction);
        if denominator == 0.0 {
            // plane.distanceToPoint(origin) === 0
            if normal.dot(self.origin) + constant == 0.0 {
                return Some(0.0);
            }
            return None;
        }
        let t = -(self.origin.dot(normal) + constant) / denominator;
        if t >= 0.0 {
            Some(t)
        } else {
            None
        }
    }

    /// `intersectPlane(plane, target)`.
    #[must_use]
    pub fn intersect_plane(&self, normal: Vec3, constant: f64) -> Option<Vec3> {
        self.distance_to_plane(normal, constant).map(|t| self.at(t))
    }

    /// `intersectSphere(sphere, target)`.
    #[must_use]
    pub fn intersect_sphere(&self, sphere: &Sphere) -> Option<Vec3> {
        let v = sphere.center.sub_vec(self.origin);
        let tca = v.dot(self.direction);
        let d2 = v.dot(v) - tca * tca;
        let radius2 = sphere.radius * sphere.radius;
        if d2 > radius2 {
            return None;
        }
        let thc = (radius2 - d2).sqrt();
        let t0 = tca - thc;
        let t1 = tca + thc;
        if t1 < 0.0 {
            return None;
        }
        if t0 < 0.0 {
            return Some(self.at(t1));
        }
        Some(self.at(t0))
    }

    /// `intersectTriangle(a, b, c, backfaceCulling, target)`.
    #[must_use]
    pub fn intersect_triangle(
        &self,
        a: Vec3,
        b: Vec3,
        c: Vec3,
        backface_culling: bool,
    ) -> Option<Vec3> {
        let edge1 = b.sub_vec(a);
        let edge2 = c.sub_vec(a);
        let normal = edge1.cross(edge2);
        let mut ddn = self.direction.dot(normal);
        let sign;
        if ddn > 0.0 {
            if backface_culling {
                return None;
            }
            sign = 1.0;
        } else if ddn < 0.0 {
            sign = -1.0;
            ddn = -ddn;
        } else {
            return None;
        }
        let diff = self.origin.sub_vec(a);
        let ddqxe2 = sign * self.direction.dot(diff.cross(edge2));
        if ddqxe2 < 0.0 {
            return None;
        }
        let dde1xq = sign * self.direction.dot(edge1.cross(diff));
        if dde1xq < 0.0 {
            return None;
        }
        if ddqxe2 + dde1xq > ddn {
            return None;
        }
        let qdn = -sign * diff.dot(normal);
        if qdn < 0.0 {
            return None;
        }
        Some(self.at(qdn / ddn))
    }
}

/// `Triangle.getNormal(a, b, c, target)`.
#[must_use]
pub fn triangle_normal(a: Vec3, b: Vec3, c: Vec3) -> Vec3 {
    let t = c.sub_vec(b).cross(a.sub_vec(b));
    let len_sq = t.length_sq();
    if len_sq > 0.0 {
        return t.scale(1.0 / len_sq.sqrt());
    }
    Vec3::new(0.0, 0.0, 0.0)
}
