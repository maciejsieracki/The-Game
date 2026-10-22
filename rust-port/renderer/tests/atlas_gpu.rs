//! RR-T8d `wgpu` upload (feature `gpu`).
//!
//! - Device-free checks (always run with `--features gpu`): formats, blend
//!   states, descriptors, the 2048 ceiling against wgpu's downlevel limit.
//! - `#[ignore]`d: real upload + read-back of every mip level. Needs a GPU
//!   adapter; the container has none (`tests/gpu_probe.rs` reports
//!   `SKIPPED: no GPU adapter`). To be run by the owner with the P4-15
//!   spike: `cargo test --features gpu --test atlas_gpu -- --ignored`.
#![cfg(feature = "gpu")]

use civ_renderer::gpu::wgpu;
use civ_renderer::raster::atlas::gpu::{
    sampler_descriptor, texture_descriptor, texture_descriptor_with_usage, upload_with_usage,
    wgpu_blend_state, wgpu_format, READBACK_TEXTURE_USAGE, TEXTURE_USAGE,
};
use civ_renderer::raster::atlas::mip::mip_size;
use civ_renderer::raster::atlas::scale::MAX_TEXTURE_SIZE;
use civ_renderer::raster::atlas::upload::{
    blend_for, prepare, AlphaMode, MinFilter, Producer, TexFormat,
};

fn t9_like() -> civ_renderer::raster::atlas::TextureData {
    let (w, h) = (72u32, 126u32);
    let mut px = Vec::with_capacity((w * h * 4) as usize);
    for i in 0..w * h {
        let a = (i * 7 % 256) as u8;
        // premultiplied: channel ≤ alpha
        px.extend_from_slice(&[a / 2, a / 3, a, a]);
    }
    prepare(&px, w, h, Producer::T9.options())
}

#[test]
fn formats_and_blend_states() {
    assert_eq!(
        wgpu_format(TexFormat::Rgba8UnormSrgb),
        wgpu::TextureFormat::Rgba8UnormSrgb
    );
    assert_eq!(
        wgpu_format(TexFormat::Rgba8Unorm),
        wgpu::TextureFormat::Rgba8Unorm
    );
    assert_eq!(
        wgpu_blend_state(blend_for(AlphaMode::Straight)),
        wgpu::BlendState {
            color: wgpu::BlendComponent {
                src_factor: wgpu::BlendFactor::SrcAlpha,
                dst_factor: wgpu::BlendFactor::OneMinusSrcAlpha,
                operation: wgpu::BlendOperation::Add,
            },
            alpha: wgpu::BlendComponent {
                src_factor: wgpu::BlendFactor::One,
                dst_factor: wgpu::BlendFactor::OneMinusSrcAlpha,
                operation: wgpu::BlendOperation::Add,
            },
        }
    );
    assert_eq!(
        wgpu_blend_state(blend_for(AlphaMode::Premultiplied)),
        wgpu::BlendState::PREMULTIPLIED_ALPHA_BLENDING
    );
}

#[test]
fn descriptors_follow_the_texture_data() {
    let d = t9_like();
    let td = texture_descriptor(Some("t9"), &d);
    assert_eq!(td.mip_level_count, 7);
    assert_eq!(td.size.width, 72);
    assert_eq!(td.size.height, 126);
    assert_eq!(td.format, wgpu::TextureFormat::Rgba8UnormSrgb);
    assert_eq!(
        td.usage,
        wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST
    );
    assert_eq!(td.usage, TEXTURE_USAGE);
    // The read-back test copies texture -> buffer: wgpu requires COPY_SRC on
    // the source (round 2, zarzut 1), on top of the upload's COPY_DST.
    let rb = texture_descriptor_with_usage(Some("t9"), &d, READBACK_TEXTURE_USAGE);
    assert!(rb.usage.contains(wgpu::TextureUsages::COPY_SRC));
    assert!(rb.usage.contains(wgpu::TextureUsages::COPY_DST));
    assert!(rb.usage.contains(wgpu::TextureUsages::TEXTURE_BINDING));
    assert_eq!(rb.size, td.size);
    assert_eq!(rb.mip_level_count, td.mip_level_count);
    assert_eq!(rb.format, td.format);
    let s = sampler_descriptor(MinFilter::LinearMipmapLinear);
    assert_eq!(s.mipmap_filter, wgpu::MipmapFilterMode::Linear);
    assert_eq!(s.min_filter, wgpu::FilterMode::Linear);
    assert_eq!(
        sampler_descriptor(MinFilter::Linear).mipmap_filter,
        wgpu::MipmapFilterMode::Nearest
    );
    // The DPI × LOD ceiling equals wgpu's downlevel 2D limit.
    assert_eq!(
        MAX_TEXTURE_SIZE,
        wgpu::Limits::downlevel_defaults().max_texture_dimension_2d
    );
}

#[test]
#[ignore = "needs a GPU adapter (none in the container); run on the owner's machine with the P4-15 spike"]
fn upload_and_read_back_every_level() {
    let instance =
        wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle_from_env());
    let adapter =
        pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions::default()))
            .expect("GPU adapter");
    let (device, queue) =
        pollster::block_on(adapter.request_device(&wgpu::DeviceDescriptor::default()))
            .expect("device");
    let data = t9_like();
    // COPY_SRC: `copy_texture_to_buffer` below reads this texture.
    let tex = upload_with_usage(&device, &queue, Some("t9"), &data, READBACK_TEXTURE_USAGE);
    for level in 0..data.desc.mip_level_count {
        let (w, h) = mip_size(data.desc.width, data.desc.height, level);
        let padded = (4 * w).div_ceil(wgpu::COPY_BYTES_PER_ROW_ALIGNMENT)
            * wgpu::COPY_BYTES_PER_ROW_ALIGNMENT;
        let buf = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("readback"),
            size: u64::from(padded * h),
            usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
            mapped_at_creation: false,
        });
        let mut enc = device.create_command_encoder(&wgpu::CommandEncoderDescriptor::default());
        enc.copy_texture_to_buffer(
            wgpu::TexelCopyTextureInfo {
                texture: &tex,
                mip_level: level,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            wgpu::TexelCopyBufferInfo {
                buffer: &buf,
                layout: wgpu::TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: Some(padded),
                    rows_per_image: Some(h),
                },
            },
            wgpu::Extent3d {
                width: w,
                height: h,
                depth_or_array_layers: 1,
            },
        );
        queue.submit([enc.finish()]);
        buf.slice(..)
            .map_async(wgpu::MapMode::Read, |r| r.expect("map"));
        device
            .poll(wgpu::PollType::wait_indefinitely())
            .expect("poll");
        let mapped = buf.slice(..).get_mapped_range().expect("mapped range");
        let expected = &data.chain.levels[level as usize];
        for row in 0..h as usize {
            let got = &mapped[row * padded as usize..row * padded as usize + 4 * w as usize];
            let exp = &expected[row * 4 * w as usize..(row + 1) * 4 * w as usize];
            assert_eq!(
                got, exp,
                "level {level} row {row}: uploaded bytes come back unchanged"
            );
        }
    }
}
