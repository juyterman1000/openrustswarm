mod pool;
mod grid;
mod pheromone;
mod physics;

use wasm_bindgen::prelude::*;
use pool::SwarmPool;
use grid::SpatialHashGrid;
use pheromone::PheromoneField;
use physics::{PropagationConfig, SwarmEvolutionConfig, run_neighbor_physics, deposit_agent_pheromones, run_evolution};

/// WebAssembly Swarm Engine — runs the full SIRS simulation in-browser.
///
/// v4.0.0: Self-evolving agent genomes with Darwinian selection.
/// Targets ~500K agents at 20+ FPS in modern browsers.
#[wasm_bindgen]
pub struct WasmSwarmEngine {
    pool: SwarmPool,
    pheromones: PheromoneField,
    grid: SpatialHashGrid,
    config: PropagationConfig,
    evo_config: SwarmEvolutionConfig,
    width: f32,
    height: f32,
    perception_radius: f32,
    tick_count: u64,
    pheromone_res: usize,

    // Interleaved position buffer for zero-copy GPU upload: [x0, y0, x1, y1, ...]
    positions_buf: Vec<f32>,
}

#[wasm_bindgen]
impl WasmSwarmEngine {
    /// Create a new swarm engine with `n_agents` agents in a `size × size` world.
    #[wasm_bindgen(constructor)]
    pub fn new(n_agents: usize, size: f32) -> Self {
        let mut pool = SwarmPool::new(n_agents);
        pool.randomize_positions(size, size);

        // Seed initial surprise wave in center 5% of agents
        let center = size / 2.0;
        let seed_radius = size * 0.05;
        for i in 0..n_agents {
            let dx = pool.x[i] - center;
            let dy = pool.y[i] - center;
            if dx * dx + dy * dy < seed_radius * seed_radius {
                pool.surprise[i] = 0.8;
            }
        }

        // Scale all data structures proportionally to agent count.
        // Pheromone resolution: ~sqrt(n_agents), clamped to [32, 1024]
        let pheromone_res = ((n_agents as f32).sqrt() as usize)
            .next_power_of_two()
            .clamp(32, 1024);

        // Perception radius: scales with world density
        let perception = if n_agents <= 100 {
            size * 0.15  // Small swarms: wide perception
        } else {
            10.0  // Large swarms: fixed perception
        };

        // Grid hash table: >= 2× agent count for low collision rate, min 1024
        let min_grid = 1024usize;
        let grid_size = (n_agents * 2).max(min_grid).next_power_of_two();

        Self {
            pool,
            pheromones: PheromoneField::new(pheromone_res, pheromone_res, size / pheromone_res as f32),
            grid: SpatialHashGrid::new(grid_size, perception, [0.0, 0.0]),
            config: PropagationConfig::default(),
            evo_config: SwarmEvolutionConfig::default(),
            width: size,
            height: size,
            perception_radius: perception,
            tick_count: 0,
            pheromone_res,
            positions_buf: vec![0.0; n_agents * 2],
        }
    }

    /// Advance the simulation by one tick.
    pub fn tick(&mut self) {
        self.tick_count += 1;

        // Spatial locality sort (amortized)
        if self.tick_count % 100 == 0 {
            self.pool.update_spatial_hashes(self.width);
            self.pool.sort_by_spatial_hash();
        }

        // Rebuild spatial hash grid
        let n = self.pool.n_agents;
        self.grid.counts_reset();
        for i in 0..n {
            let (cx, cy) = self.grid.world_to_cell(self.pool.x[i], self.pool.y[i]);
            self.grid.count_agent(cx, cy);
        }
        self.grid.compute_offsets();
        for i in 0..n {
            let (cx, cy) = self.grid.world_to_cell(self.pool.x[i], self.pool.y[i]);
            self.grid.scatter_agent(cx, cy, i as u32);
        }

        // Physics + SIRS propagation (per-agent genes when evolution enabled)
        run_neighbor_physics(
            &mut self.pool,
            &self.grid,
            &self.pheromones,
            &self.config,
            self.perception_radius,
            self.width,
            self.height,
            self.evo_config.enabled,
        );

        // Pheromone deposit + diffusion
        deposit_agent_pheromones(&self.pool, &mut self.pheromones, &self.config);
        self.pheromones.tick();

        // Health decay + evolution reward
        let evo = &self.evo_config;
        for i in 0..n {
            self.pool.health[i] *= 0.999;
            if evo.enabled && self.pool.surprise[i] > evo.health_reward_threshold {
                self.pool.health[i] = (self.pool.health[i] + evo.health_reward).min(1.0);
            }
        }

        // Evolution: death & reproduction
        if self.evo_config.enabled
            && self.evo_config.reproduction_interval > 0
            && self.tick_count % self.evo_config.reproduction_interval as u64 == 0
        {
            run_evolution(&mut self.pool, &self.grid, &self.evo_config, self.perception_radius);
        }
    }

    /// Number of agents.
    pub fn n_agents(&self) -> usize {
        self.pool.n_agents
    }

    /// World size.
    pub fn world_size(&self) -> f32 {
        self.width
    }

    /// Current tick number.
    pub fn get_tick(&self) -> u64 {
        self.tick_count
    }

    /// Pheromone grid resolution.
    pub fn pheromone_resolution(&self) -> usize {
        self.pheromone_res
    }

    // ── Zero-copy pointers for JS ArrayBuffer views ──

    /// Pointer to interleaved positions [x0, y0, x1, y1, ...].
    /// Length = n_agents * 2.
    pub fn get_positions_ptr(&mut self) -> *const f32 {
        let n = self.pool.n_agents;
        for i in 0..n {
            self.positions_buf[i * 2] = self.pool.x[i];
            self.positions_buf[i * 2 + 1] = self.pool.y[i];
        }
        self.positions_buf.as_ptr()
    }

    /// Pointer to surprise array. Length = n_agents.
    pub fn get_surprise_ptr(&self) -> *const f32 {
        self.pool.surprise.as_ptr()
    }

    /// Pointer to health array. Length = n_agents.
    pub fn get_health_ptr(&self) -> *const f32 {
        self.pool.health.as_ptr()
    }

    /// Pointer to refractory array. Length = n_agents.
    pub fn get_refractory_ptr(&self) -> *const f32 {
        self.pool.refractory.as_ptr()
    }

    /// Pointer to pheromone channel data. Length = width * height.
    pub fn get_pheromone_ptr(&self, channel: usize) -> *const f32 {
        self.pheromones.channel_data(channel).as_ptr()
    }

    /// Pointer to generation array. Length = n_agents.
    pub fn get_generation_ptr(&self) -> *const u32 {
        self.pool.generation.as_ptr()
    }

    /// Pointer to gene_transfer array. Length = n_agents.
    pub fn get_gene_transfer_ptr(&self) -> *const f32 {
        self.pool.gene_transfer.as_ptr()
    }

    // ── Metrics ──

    pub fn mean_surprise(&self) -> f32 {
        let sum: f32 = self.pool.surprise.iter().sum();
        sum / self.pool.n_agents as f32
    }

    pub fn mean_health(&self) -> f32 {
        let sum: f32 = self.pool.health.iter().sum();
        sum / self.pool.n_agents as f32
    }

    pub fn mean_refractory(&self) -> f32 {
        let sum: f32 = self.pool.refractory.iter().sum();
        sum / self.pool.n_agents as f32
    }

    pub fn r0_effective(&self) -> f32 {
        self.config.r0_effective(self.mean_refractory())
    }

    pub fn surprised_count(&self) -> usize {
        self.pool.surprise.iter().filter(|&&s| s > 0.1).count()
    }

    pub fn peak_surprise(&self) -> f32 {
        self.pool.surprise.iter().cloned().fold(0.0f32, f32::max)
    }

    /// Mean generation across all agents.
    pub fn mean_generation(&self) -> f32 {
        let sum: f64 = self.pool.generation.iter().map(|&g| g as f64).sum();
        (sum / self.pool.n_agents as f64) as f32
    }

    /// Gene diversity: standard deviation of gene_transfer across the population.
    pub fn gene_diversity(&self) -> f32 {
        let n = self.pool.n_agents as f64;
        let mean: f64 = self.pool.gene_transfer.iter().map(|&v| v as f64).sum::<f64>() / n;
        let var: f64 = self.pool.gene_transfer.iter().map(|&v| {
            let d = v as f64 - mean;
            d * d
        }).sum::<f64>() / n;
        var.sqrt() as f32
    }

    /// Whether evolution is currently enabled.
    pub fn evolution_enabled(&self) -> bool {
        self.evo_config.enabled
    }

    // ── Evolution control ──

    /// Enable or disable Darwinian evolution of agent genomes.
    pub fn set_evolution_enabled(&mut self, enabled: bool) {
        self.evo_config.enabled = enabled;
    }

    // ── User interaction ──

    /// Inject a surprise shockwave at (x, y) with given radius and intensity.
    pub fn inject_surprise(&mut self, x: f32, y: f32, radius: f32, amount: f32) {
        let r2 = radius * radius;
        for i in 0..self.pool.n_agents {
            let dx = self.pool.x[i] - x;
            let dy = self.pool.y[i] - y;
            if dx * dx + dy * dy < r2 {
                self.pool.surprise[i] = (self.pool.surprise[i] + amount).min(0.99);
            }
        }
    }

    /// Deposit pheromone at a location (for placement tools).
    pub fn deposit_pheromone(&mut self, x: f32, y: f32, channel: usize, amount: f32) {
        self.pheromones.deposit(x, y, channel, amount);
    }

    /// Reset the simulation.
    pub fn reset(&mut self) {
        let n = self.pool.n_agents;
        let size = self.width;

        self.pool = SwarmPool::new(n);
        self.pool.randomize_positions(size, size);

        // Re-seed surprise
        let center = size / 2.0;
        let seed_radius = size * 0.05;
        for i in 0..n {
            let dx = self.pool.x[i] - center;
            let dy = self.pool.y[i] - center;
            if dx * dx + dy * dy < seed_radius * seed_radius {
                self.pool.surprise[i] = 0.8;
            }
        }

        self.pheromones = PheromoneField::new(
            self.pheromone_res, self.pheromone_res,
            size / self.pheromone_res as f32,
        );
        self.tick_count = 0;
    }

    /// Advance the simulation by N ticks (for step mode).
    pub fn step(&mut self, n: u32) {
        for _ in 0..n {
            self.tick();
        }
    }

    // ── PropagationConfig getters ──

    pub fn get_surprise_decay(&self) -> f32 { self.config.surprise_decay }
    pub fn get_surprise_transfer(&self) -> f32 { self.config.surprise_transfer }
    pub fn get_distance_falloff(&self) -> f32 { self.config.distance_falloff }
    pub fn get_refractory_threshold(&self) -> f32 { self.config.refractory_threshold }
    pub fn get_refractory_buildup(&self) -> f32 { self.config.refractory_buildup }
    pub fn get_refractory_decay(&self) -> f32 { self.config.refractory_decay }
    pub fn get_danger_feedback(&self) -> f32 { self.config.danger_feedback }
    pub fn get_novelty_emission(&self) -> f32 { self.config.novelty_emission }
    pub fn get_novelty_attraction(&self) -> f32 { self.config.novelty_attraction }
    pub fn get_danger_emission_threshold(&self) -> f32 { self.config.danger_emission_threshold }
    pub fn r0_base(&self) -> f32 { self.config.r0_base() }

    // ── PropagationConfig setters ──

    pub fn set_surprise_decay(&mut self, v: f32) { self.config.surprise_decay = v; }
    pub fn set_surprise_transfer(&mut self, v: f32) { self.config.surprise_transfer = v; }
    pub fn set_distance_falloff(&mut self, v: f32) { self.config.distance_falloff = v; }
    pub fn set_refractory_threshold(&mut self, v: f32) { self.config.refractory_threshold = v; }
    pub fn set_refractory_buildup(&mut self, v: f32) { self.config.refractory_buildup = v; }
    pub fn set_refractory_decay(&mut self, v: f32) { self.config.refractory_decay = v; }
    pub fn set_danger_feedback(&mut self, v: f32) { self.config.danger_feedback = v; }
    pub fn set_novelty_emission(&mut self, v: f32) { self.config.novelty_emission = v; }
    pub fn set_novelty_attraction(&mut self, v: f32) { self.config.novelty_attraction = v; }
    pub fn set_danger_emission_threshold(&mut self, v: f32) { self.config.danger_emission_threshold = v; }

    // ── EvolutionConfig setters ──

    pub fn set_death_threshold(&mut self, v: f32) { self.evo_config.death_threshold = v; }
    pub fn set_reproduction_interval(&mut self, v: u32) { self.evo_config.reproduction_interval = v; }
    pub fn set_mutation_sigma(&mut self, v: f32) { self.evo_config.mutation_sigma = v; }
    pub fn set_health_reward(&mut self, v: f32) { self.evo_config.health_reward = v; }
    pub fn set_health_reward_threshold(&mut self, v: f32) { self.evo_config.health_reward_threshold = v; }

    // ── Bulk config via serde ──

    pub fn get_propagation_config(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.config).unwrap_or(JsValue::NULL)
    }

    pub fn set_propagation_config(&mut self, config: JsValue) -> Result<(), JsValue> {
        let cfg: PropagationConfig = serde_wasm_bindgen::from_value(config)
            .map_err(|e| JsValue::from_str(&format!("{}", e)))?;
        self.config = cfg;
        Ok(())
    }

    pub fn get_evolution_config(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.evo_config).unwrap_or(JsValue::NULL)
    }

    pub fn set_evolution_config(&mut self, config: JsValue) -> Result<(), JsValue> {
        let cfg: SwarmEvolutionConfig = serde_wasm_bindgen::from_value(config)
            .map_err(|e| JsValue::from_str(&format!("{}", e)))?;
        self.evo_config = cfg;
        Ok(())
    }

    // ── Extra zero-copy pointers for color modes ──

    pub fn get_vx_ptr(&self) -> *const f32 { self.pool.vx.as_ptr() }
    pub fn get_vy_ptr(&self) -> *const f32 { self.pool.vy.as_ptr() }
    pub fn get_gene_decay_ptr(&self) -> *const f32 { self.pool.gene_decay.as_ptr() }
    pub fn get_gene_speed_ptr(&self) -> *const f32 { self.pool.gene_speed.as_ptr() }
    pub fn get_gene_danger_sense_ptr(&self) -> *const f32 { self.pool.gene_danger_sense.as_ptr() }
    pub fn get_gene_novelty_drive_ptr(&self) -> *const f32 { self.pool.gene_novelty_drive.as_ptr() }
    pub fn get_gene_refractory_ptr(&self) -> *const f32 { self.pool.gene_refractory.as_ptr() }
}
