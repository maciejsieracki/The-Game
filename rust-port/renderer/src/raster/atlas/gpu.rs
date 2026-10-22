//! `wgpu` upload of [`TextureData`] (feature `gpu`): texture + every mip
//! level via `Queue::write_texture`, the matching sampler and blend state.
//!
//! Compiled and linted in CI with `--features gpu`; running it needs a GPU
//! adapter (none in the container — `tests/atlas_gpu.rs` is `#[ignore]`d,
//! to be run on the owner's machine together with the P4-15 spike).

use crate::gpu::wgpu;

use super::upload::{BlendFactor, BlendSpec, MinFilter, TexFormat, TextureData};

/// The `wgpu` format of a [`TexFormat`].
#[must_use]
pub const fn wgpu_format(format: TexFormat) -> wgpu::TextureFormat {
    match format {
        TexFormat::Rgba8UnormSrgb => wgpu::TextureFormat::Rgba8UnormSrgb,
        TexFormat::Rgba8Unorm => wgpu::TextureFormat::Rgba8Unorm,
    }
}

/// The `wgpu` blend factor of a [`BlendFactor`].
#[must_use]
pub const fn wgpu_blend_factor(f: BlendFactor) -> wgpu::BlendFactor {
    match f {
        BlendFactor::One => wgpu::BlendFactor::One,
        BlendFactor::SrcAlpha => wgpu::BlendFactor::SrcAlpha,
        BlendFactor::OneMinusSrcAlpha => wgpu::BlendFactor::OneMinusSrcAlpha,
    }
}

/// The `wgpu` blend state of a [`BlendSpec`] (operation `Add`).
#[must_use]
pub const fn wgpu_blend_state(b: BlendSpec) -> wgpu::BlendState {
    wgpu::BlendState {
        color: wgpu::BlendComponent {
            src_factor: wgpu_blend_factor(b.color.0),
            dst_factor: wgpu_blend_factor(b.color.1),
            operation: wgpu::BlendOperation::Add,
        },
        alpha: wgpu::BlendComponent {
            src_factor: wgpu_blend_factor(b.alpha.0),
            dst_factor: wgpu_blend_factor(b.alpha.1),
            operation: wgpu::BlendOperation::Add,
        },
    }
}

/// Usage of an atlas texture in the renderer: sampled + written by
/// `Queue::write_texture`. No `COPY_SRC` — nothing reads it back in play.
pub const TEXTURE_USAGE: wgpu::TextureUsages =
    wgpu::TextureUsages::TEXTURE_BINDING.union(wgpu::TextureUsages::COPY_DST);

/// Usage for a read-back check: [`TEXTURE_USAGE`] plus `COPY_SRC`, which
/// `CommandEncoder::copy_texture_to_buffer` requires on the source texture
/// (wgpu validation error otherwise).
pub const READBACK_TEXTURE_USAGE: wgpu::TextureUsages =
    TEXTURE_USAGE.union(wgpu::TextureUsages::COPY_SRC);

/// Texture descriptor for `data` (2D, one layer, [`TEXTURE_USAGE`]).
#[must_use]
pub fn texture_descriptor<'a>(
    label: Option<&'a str>,
    data: &TextureData,
) -> wgpu::TextureDescriptor<'a> {
    texture_descriptor_with_usage(label, data, TEXTURE_USAGE)
}

/// [`texture_descriptor`] with an explicit `usage` (e.g.
/// [`READBACK_TEXTURE_USAGE`] for a read-back test).
#[must_use]
pub fn texture_descriptor_with_usage<'a>(
    label: Option<&'a str>,
    data: &TextureData,
    usage: wgpu::TextureUsages,
) -> wgpu::TextureDescriptor<'a> {
    wgpu::TextureDescriptor {
        label,
        size: wgpu::Extent3d {
            width: data.desc.width,
            height: data.desc.height,
            depth_or_array_layers: 1,
        },
        mip_level_count: data.desc.mip_level_count,
        sample_count: 1,
        dimension: wgpu::TextureDimension::D2,
        format: wgpu_format(data.desc.options.format),
        usage,
        view_formats: &[],
    }
}

/// Sampler matching the web filter: linear magnification and
/// minification, linear between mip levels for `LinearMipmapLinear`,
/// clamp-to-edge (Three `ClampToEdgeWrapping` default).
#[must_use]
pub fn sampler_descriptor(min_filter: MinFilter) -> wgpu::SamplerDescriptor<'static> {
    wgpu::SamplerDescriptor {
        label: Some("atlas sampler"),
        address_mode_u: wgpu::AddressMode::ClampToEdge,
        address_mode_v: wgpu::AddressMode::ClampToEdge,
        address_mode_w: wgpu::AddressMode::ClampToEdge,
        mag_filter: wgpu::FilterMode::Linear,
        min_filter: wgpu::FilterMode::Linear,
        mipmap_filter: match min_filter {
            MinFilter::Linear => wgpu::MipmapFilterMode::Nearest,
            MinFilter::LinearMipmapLinear => wgpu::MipmapFilterMode::Linear,
        },
        ..wgpu::SamplerDescriptor::default()
    }
}

/// Creates the texture ([`TEXTURE_USAGE`]) and writes every level.
#[must_use]
pub fn upload(
    device: &wgpu::Device,
    queue: &wgpu::Queue,
    label: Option<&str>,
    data: &TextureData,
) -> wgpu::Texture {
    upload_with_usage(device, queue, label, data, TEXTURE_USAGE)
}

/// [`upload`] with an explicit `usage`; it must contain `COPY_DST`.
#[must_use]
pub fn upload_with_usage(
    device: &wgpu::Device,
    queue: &wgpu::Queue,
    label: Option<&str>,
    data: &TextureData,
    usage: wgpu::TextureUsages,
) -> wgpu::Texture {
    let texture = device.create_texture(&texture_descriptor_with_usage(label, data, usage));
    for (level, bytes) in data.chain.levels.iter().enumerate() {
        let level = u32::try_from(level).unwrap_or(u32::MAX);
        let (w, h) = super::mip::mip_size(data.desc.width, data.desc.height, level);
        queue.write_texture(
            wgpu::TexelCopyTextureInfo {
                texture: &texture,
                mip_level: level,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            bytes,
            wgpu::TexelCopyBufferLayout {
                offset: 0,
                bytes_per_row: Some(4 * w),
                rows_per_image: Some(h),
            },
            wgpu::Extent3d {
                width: w,
                height: h,
                depth_or_array_layers: 1,
            },
        );
    }
    texture
}
