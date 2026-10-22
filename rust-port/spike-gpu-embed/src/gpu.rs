//! wgpu layer of the spike (feature `gpu`): device, one triangle pipeline,
//! frame rendering into a window surface, offscreen self-test.
//!
//! The picture is deliberately trivial and easy to describe to the owner:
//! dark-blue clear colour + one ORANGE triangle in the LEFT part of the window
//! (the "hole" not covered by the HTML panel on the right).

use std::borrow::Cow;

pub use wgpu;

/// Clear colour (linear): dark blue.
pub const CLEAR: wgpu::Color = wgpu::Color {
    r: 0.05,
    g: 0.10,
    b: 0.30,
    a: 1.0,
};

/// Triangle in NDC: left part of the window (x in [-0.85, -0.15]).
pub const TRIANGLE_NDC: [[f32; 2]; 3] = [[-0.85, -0.6], [-0.15, -0.6], [-0.5, 0.6]];

const SHADER: &str = r#"
@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> @builtin(position) vec4<f32> {
    var p = array<vec2<f32>, 3>(
        vec2<f32>(-0.85, -0.6),
        vec2<f32>(-0.15, -0.6),
        vec2<f32>(-0.5, 0.6),
    );
    return vec4<f32>(p[i], 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.55, 0.0, 1.0);
}
"#;

/// Instance + adapter + device + queue.
pub struct Gpu {
    pub instance: wgpu::Instance,
    pub adapter: wgpu::Adapter,
    pub device: wgpu::Device,
    pub queue: wgpu::Queue,
}

impl Gpu {
    /// Request an adapter (optionally compatible with `surface`) and a device.
    pub fn new(
        instance: wgpu::Instance,
        surface: Option<&wgpu::Surface<'_>>,
    ) -> Result<Gpu, String> {
        let adapter = pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            force_fallback_adapter: false,
            compatible_surface: surface,
            ..Default::default()
        }))
        .map_err(|e| format!("request_adapter: {e}"))?;
        let (device, queue) = pollster::block_on(adapter.request_device(&wgpu::DeviceDescriptor {
            label: Some("spike-device"),
            ..Default::default()
        }))
        .map_err(|e| format!("request_device: {e}"))?;
        Ok(Gpu {
            instance,
            adapter,
            device,
            queue,
        })
    }

    /// Adapter description for the report.
    pub fn adapter_info_json(&self) -> serde_json::Value {
        let i = self.adapter.get_info();
        serde_json::json!({
            "name": i.name,
            "backend": format!("{:?}", i.backend),
            "device_type": format!("{:?}", i.device_type),
            "driver": i.driver,
            "driver_info": i.driver_info,
            "vendor": i.vendor,
            "device": i.device,
        })
    }
}

/// Headless instance (no display handle), WGPU_* env overrides honoured.
pub fn headless_instance() -> wgpu::Instance {
    wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle_from_env())
}

/// The triangle pipeline for one colour format.
pub struct TrianglePipeline {
    pub format: wgpu::TextureFormat,
    pipeline: wgpu::RenderPipeline,
}

impl TrianglePipeline {
    pub fn new(device: &wgpu::Device, format: wgpu::TextureFormat) -> Self {
        let module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("spike-triangle"),
            source: wgpu::ShaderSource::Wgsl(Cow::Borrowed(SHADER)),
        });
        let layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("spike-layout"),
            bind_group_layouts: &[],
            immediate_size: 0,
        });
        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("spike-pipeline"),
            layout: Some(&layout),
            vertex: wgpu::VertexState {
                module: &module,
                entry_point: Some("vs_main"),
                compilation_options: Default::default(),
                buffers: &[],
            },
            primitive: wgpu::PrimitiveState::default(),
            depth_stencil: None,
            multisample: wgpu::MultisampleState::default(),
            fragment: Some(wgpu::FragmentState {
                module: &module,
                entry_point: Some("fs_main"),
                compilation_options: Default::default(),
                targets: &[Some(wgpu::ColorTargetState {
                    format,
                    blend: None,
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            multiview_mask: None,
            cache: None,
        });
        TrianglePipeline { format, pipeline }
    }

    /// Clear + triangle into `view`.
    pub fn encode(&self, encoder: &mut wgpu::CommandEncoder, view: &wgpu::TextureView) {
        let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
            label: Some("spike-pass"),
            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                view,
                depth_slice: None,
                resolve_target: None,
                ops: wgpu::Operations {
                    load: wgpu::LoadOp::Clear(CLEAR),
                    store: wgpu::StoreOp::Store,
                },
            })],
            depth_stencil_attachment: None,
            timestamp_writes: None,
            occlusion_query_set: None,
            multiview_mask: None,
        });
        pass.set_pipeline(&self.pipeline);
        pass.draw(0..3, 0..1);
    }
}

/// Outcome of one frame.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FrameOutcome {
    Presented,
    /// Not presented (reason); the caller counts these.
    Skipped(&'static str),
}

/// A configured window surface with its pipeline.
pub struct WindowTarget {
    pub surface: wgpu::Surface<'static>,
    pub config: wgpu::SurfaceConfiguration,
    pipeline: TrianglePipeline,
}

impl WindowTarget {
    /// Configure `surface` for `width x height` physical px (min 1x1).
    pub fn new(
        gpu: &Gpu,
        surface: wgpu::Surface<'static>,
        width: u32,
        height: u32,
    ) -> Result<Self, String> {
        let mut config = surface
            .get_default_config(&gpu.adapter, width.max(1), height.max(1))
            .ok_or("surface nieobslugiwany przez ten adapter (get_default_config = None)")?;
        // Opaque: the map is the bottom layer; transparency belongs to the webview.
        let caps = surface.get_capabilities(&gpu.adapter);
        if caps.alpha_modes.contains(&wgpu::CompositeAlphaMode::Opaque) {
            config.alpha_mode = wgpu::CompositeAlphaMode::Opaque;
        }
        if caps.present_modes.contains(&wgpu::PresentMode::Fifo) {
            config.present_mode = wgpu::PresentMode::Fifo;
        }
        surface.configure(&gpu.device, &config);
        let pipeline = TrianglePipeline::new(&gpu.device, config.format);
        Ok(WindowTarget {
            surface,
            config,
            pipeline,
        })
    }

    pub fn describe(&self) -> String {
        format!(
            "{}x{} format={:?} present_mode={:?} alpha_mode={:?}",
            self.config.width,
            self.config.height,
            self.config.format,
            self.config.present_mode,
            self.config.alpha_mode
        )
    }

    pub fn resize(&mut self, gpu: &Gpu, width: u32, height: u32) {
        if width == 0 || height == 0 {
            return;
        }
        self.config.width = width;
        self.config.height = height;
        self.surface.configure(&gpu.device, &self.config);
    }

    /// Render one frame (clear + triangle) and present it.
    pub fn render(&mut self, gpu: &Gpu) -> FrameOutcome {
        let frame = match self.surface.get_current_texture() {
            wgpu::CurrentSurfaceTexture::Success(t) => t,
            wgpu::CurrentSurfaceTexture::Suboptimal(t) => t,
            wgpu::CurrentSurfaceTexture::Outdated => {
                self.surface.configure(&gpu.device, &self.config);
                return FrameOutcome::Skipped("Outdated (rekonfiguracja)");
            }
            wgpu::CurrentSurfaceTexture::Lost => {
                self.surface.configure(&gpu.device, &self.config);
                return FrameOutcome::Skipped("Lost (rekonfiguracja)");
            }
            wgpu::CurrentSurfaceTexture::Timeout => return FrameOutcome::Skipped("Timeout"),
            wgpu::CurrentSurfaceTexture::Occluded => return FrameOutcome::Skipped("Occluded"),
            _ => return FrameOutcome::Skipped("inny status get_current_texture"),
        };
        let view = frame
            .texture
            .create_view(&wgpu::TextureViewDescriptor::default());
        let mut enc = gpu
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("spike-frame"),
            });
        self.pipeline.encode(&mut enc, &view);
        gpu.queue.submit(Some(enc.finish()));
        gpu.queue.present(frame);
        FrameOutcome::Presented
    }
}

/// Result of the offscreen self-test.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct SelfTest {
    pub size: u32,
    /// RGBA8 at the triangle centroid.
    pub triangle_rgba: [u8; 4],
    /// RGBA8 in the top-right corner (clear colour).
    pub corner_rgba: [u8; 4],
    /// Triangle pixel is orange and corner pixel is dark blue.
    pub ok: bool,
}

/// Expected RGBA8 (UNORM, no sRGB) values.
pub const EXPECT_TRIANGLE: [u8; 4] = [255, 140, 0, 255];
pub const EXPECT_CLEAR: [u8; 4] = [13, 26, 77, 255];

fn close(a: [u8; 4], b: [u8; 4]) -> bool {
    a.iter()
        .zip(b.iter())
        .all(|(x, y)| (*x as i16 - *y as i16).abs() <= 2)
}

/// Pixel of the triangle centroid in a `size x size` target.
pub fn triangle_centroid_px(size: u32) -> (u32, u32) {
    let cx = TRIANGLE_NDC.iter().map(|p| p[0]).sum::<f32>() / 3.0;
    let cy = TRIANGLE_NDC.iter().map(|p| p[1]).sum::<f32>() / 3.0;
    let x = ((cx + 1.0) / 2.0 * size as f32) as u32;
    let y = ((1.0 - cy) / 2.0 * size as f32) as u32;
    (x, y)
}

/// Render clear + triangle into a 64x64 RGBA8 texture and read it back.
/// Proves the GPU pipeline produces the expected pixels; says NOTHING about
/// window composition (that is check P1).
pub fn offscreen_selftest(gpu: &Gpu) -> Result<SelfTest, String> {
    const SIZE: u32 = 64; // 64 * 4 = 256 bytes per row = COPY_BYTES_PER_ROW_ALIGNMENT
    let format = wgpu::TextureFormat::Rgba8Unorm;
    let tex = gpu.device.create_texture(&wgpu::TextureDescriptor {
        label: Some("spike-offscreen"),
        size: wgpu::Extent3d {
            width: SIZE,
            height: SIZE,
            depth_or_array_layers: 1,
        },
        mip_level_count: 1,
        sample_count: 1,
        dimension: wgpu::TextureDimension::D2,
        format,
        usage: wgpu::TextureUsages::RENDER_ATTACHMENT | wgpu::TextureUsages::COPY_SRC,
        view_formats: &[],
    });
    let view = tex.create_view(&wgpu::TextureViewDescriptor::default());
    let buf = gpu.device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("spike-readback"),
        size: (SIZE * SIZE * 4) as u64,
        usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
        mapped_at_creation: false,
    });
    let pipeline = TrianglePipeline::new(&gpu.device, format);
    let mut enc = gpu
        .device
        .create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("spike-selftest"),
        });
    pipeline.encode(&mut enc, &view);
    enc.copy_texture_to_buffer(
        wgpu::TexelCopyTextureInfo {
            texture: &tex,
            mip_level: 0,
            origin: wgpu::Origin3d::ZERO,
            aspect: wgpu::TextureAspect::All,
        },
        wgpu::TexelCopyBufferInfo {
            buffer: &buf,
            layout: wgpu::TexelCopyBufferLayout {
                offset: 0,
                bytes_per_row: Some(SIZE * 4),
                rows_per_image: Some(SIZE),
            },
        },
        wgpu::Extent3d {
            width: SIZE,
            height: SIZE,
            depth_or_array_layers: 1,
        },
    );
    gpu.queue.submit(Some(enc.finish()));
    let (tx, rx) = std::sync::mpsc::channel();
    buf.slice(..).map_async(wgpu::MapMode::Read, move |r| {
        let _ = tx.send(r);
    });
    gpu.device
        .poll(wgpu::PollType::wait_indefinitely())
        .map_err(|e| format!("poll: {e}"))?;
    rx.recv()
        .map_err(|e| format!("map_async callback: {e}"))?
        .map_err(|e| format!("map_async: {e}"))?;
    let px = |data: &[u8], x: u32, y: u32| -> [u8; 4] {
        let i = ((y * SIZE + x) * 4) as usize;
        [data[i], data[i + 1], data[i + 2], data[i + 3]]
    };
    let (tx_, ty_) = triangle_centroid_px(SIZE);
    let (tri, corner) = {
        let data = buf
            .slice(..)
            .get_mapped_range()
            .map_err(|e| format!("get_mapped_range: {e}"))?;
        (px(&data, tx_, ty_), px(&data, SIZE - 2, 1))
    };
    buf.unmap();
    Ok(SelfTest {
        size: SIZE,
        triangle_rgba: tri,
        corner_rgba: corner,
        ok: close(tri, EXPECT_TRIANGLE) && close(corner, EXPECT_CLEAR),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn centroid_pixel() {
        // centroid (-0.5, -0.2) -> x = 0.25*64 = 16, y = 0.6*64 = 38.4 -> 38
        assert_eq!(triangle_centroid_px(64), (16, 38));
    }

    #[test]
    fn expected_unorm_values() {
        let to8 = |v: f64| (v * 255.0).round() as u8;
        assert_eq!(
            [to8(CLEAR.r), to8(CLEAR.g), to8(CLEAR.b), 255],
            EXPECT_CLEAR
        );
        assert_eq!([255, to8(0.55), 0, 255], EXPECT_TRIANGLE);
    }

    /// Offscreen self-test: on a machine without an adapter it reports SKIPPED
    /// (like rust-port/renderer/tests/gpu_probe.rs) instead of failing.
    #[test]
    fn offscreen_selftest_or_skip() {
        use std::io::Write as _;
        match Gpu::new(headless_instance(), None) {
            Ok(gpu) => {
                let r = offscreen_selftest(&gpu).expect("self-test runs");
                let _ = writeln!(
                    std::io::stderr(),
                    "GPU SELFTEST: {r:?} adapter={}",
                    gpu.adapter_info_json()
                );
                assert!(r.ok, "unexpected pixels: {r:?}");
            }
            Err(e) => {
                let _ = writeln!(std::io::stderr(), "SKIPPED: no GPU adapter ({e})");
            }
        }
    }
}
