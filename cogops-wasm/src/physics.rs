use crate::pool::SwarmPool;
use crate::grid::SpatialHashGrid;
use crate::pheromone::PheromoneField;
use rand::Rng;

/// Runtime-tunable SIRS propagation parameters.
/// R₀_base = transfer / (1 - decay). Default: 0.08 / 0.08 = 1.0 (critical).
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PropagationConfig {
    pub surprise_decay: f32,
    pub surprise_transfer: f32,
    pub distance_falloff: f32,
    pub refractory_threshold: f32,
    pub refractory_buildup: f32,
    pub refractory_decay: f32,
    pub danger_feedback: f32,
    pub novelty_emission: f32,
    pub novelty_attraction: f32,
    pub danger_emission_threshold: f32,
}

impl Default for PropagationConfig {
    fn default() -> Self {
        Self {
            surprise_decay: 0.92,
            surprise_transfer: 0.08,
            distance_falloff: 1.0,
            refractory_threshold: 0.6,
            refractory_buildup: 0.3,
            refractory_decay: 0.98,
            danger_feedback: 0.15,
            novelty_emission: 0.5,
            novelty_attraction: 0.2,
            danger_emission_threshold: 0.3,
        }
    }
}

impl PropagationConfig {
    pub fn r0_base(&self) -> f32 {
        self.surprise_transfer / (1.0 - self.surprise_decay)
    }

    pub fn r0_effective(&self, mean_refractory: f32) -> f32 {
        self.r0_base() * (1.0 - mean_refractory)
    }
}

/// Gene ranges for clamping after mutation. (min, max) pairs.
pub const GENE_RANGES: [(f32, f32); 6] = [
    (0.80, 0.99),  // gene_decay
    (0.01, 0.30),  // gene_transfer
    (0.05, 0.80),  // gene_refractory
    (0.00, 0.50),  // gene_danger_sense
    (0.00, 0.80),  // gene_novelty_drive
    (0.50, 5.00),  // gene_speed
];

/// Configuration for Darwinian evolution of agent genomes.
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SwarmEvolutionConfig {
    pub enabled: bool,
    pub death_threshold: f32,
    pub reproduction_interval: u32,
    pub mutation_sigma: f32,
    pub health_reward: f32,
    pub health_reward_threshold: f32,
}

impl Default for SwarmEvolutionConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            death_threshold: 0.1,
            reproduction_interval: 50,
            mutation_sigma: 0.02,
            health_reward: 0.002,
            health_reward_threshold: 0.3,
        }
    }
}

/// Run one tick of the SIRS neighbor physics + steering.
///
/// When `evo_enabled` is true, reads per-agent genes instead of global config.
pub fn run_neighbor_physics(
    pool: &mut SwarmPool,
    grid: &SpatialHashGrid,
    pheromones: &PheromoneField,
    cfg: &PropagationConfig,
    perception_radius: f32,
    width: f32,
    height: f32,
    evo_enabled: bool,
) {
    let n = pool.n_agents;
    let r = perception_radius;
    let r2 = r * r;

    // Zero-out pre-allocated scratch buffers (no per-tick heap allocation)
    for i in 0..n {
        pool.scratch_vx[i] = 0.0;
        pool.scratch_vy[i] = 0.0;
        pool.scratch_surprise[i] = 0.0;
        pool.scratch_refractory[i] = 0.0;
    }

    for i in 0..n {
        let px = pool.x[i];
        let py = pool.y[i];

        // Per-agent or global parameters
        let decay = if evo_enabled { pool.gene_decay[i] } else { cfg.surprise_decay };
        let transfer = if evo_enabled { pool.gene_transfer[i] } else { cfg.surprise_transfer };
        let refract_buildup = if evo_enabled { pool.gene_refractory[i] } else { cfg.refractory_buildup };
        let danger_fb = if evo_enabled { pool.gene_danger_sense[i] } else { cfg.danger_feedback };
        let novelty_attr = if evo_enabled { pool.gene_novelty_drive[i] } else { cfg.novelty_attraction };
        let max_speed = if evo_enabled { pool.gene_speed[i] } else { 2.0 };

        let mut neighbor_count = 0u32;
        let mut sum_x = 0.0f32;
        let mut sum_y = 0.0f32;
        let mut sep_x = 0.0f32;
        let mut sep_y = 0.0f32;
        let mut weighted_surprise_sum = 0.0f32;
        let mut weight_sum = 0.0f32;

        grid.query_neighbors(i as u32, px, py, r, |j| {
            let jx = pool.x[j as usize];
            let jy = pool.y[j as usize];
            let dx = jx - px;
            let dy = jy - py;
            let d2 = dx * dx + dy * dy;

            if d2 < r2 && d2 > 0.001 {
                let dist = d2.sqrt();
                neighbor_count += 1;
                sum_x += jx;
                sum_y += jy;
                let inv = 1.0 / dist;
                sep_x -= dx * inv;
                sep_y -= dy * inv;

                let normalized_dist = dist / r;
                let w = (1.0 - normalized_dist).max(0.0).powf(cfg.distance_falloff);
                weighted_surprise_sum += pool.surprise[j as usize] * w;
                weight_sum += w;
            }
        });

        // Steering forces
        let mut fx = pool.vx[i] * 0.9;
        let mut fy = pool.vy[i] * 0.9;

        if neighbor_count > 0 {
            let nc = neighbor_count as f32;
            fx += (sum_x / nc - px) * 0.01;
            fy += (sum_y / nc - py) * 0.01;
            fx += sep_x * 0.05;
            fy += sep_y * 0.05;
        }

        // Pheromone gradient steering
        let (gx_trail, gy_trail) = pheromones.gradient(px, py, 2);
        let (gx_danger, gy_danger) = pheromones.gradient(px, py, 1);
        let (gx_novelty, gy_novelty) = pheromones.gradient(px, py, 4);
        fx += 0.3 * gx_trail - 0.5 * gx_danger + novelty_attr * gx_novelty;
        fy += 0.3 * gy_trail - 0.5 * gy_danger + novelty_attr * gy_novelty;

        // Random exploration
        fx += (rand::random::<f32>() - 0.5) * 0.1;
        fy += (rand::random::<f32>() - 0.5) * 0.1;

        // Clamp velocity (per-agent max speed)
        let mag = (fx * fx + fy * fy).sqrt().max(0.001);
        if mag > max_speed {
            fx = fx / mag * max_speed;
            fy = fy / mag * max_speed;
        }

        pool.scratch_vx[i] = fx;
        pool.scratch_vy[i] = fy;

        // SIRS Surprise Propagation (per-agent parameters)
        let mean_neighbor_surprise = if weight_sum > 0.0 {
            weighted_surprise_sum / weight_sum
        } else {
            0.0
        };

        let pheromone_input = pheromones.sample(px, py, 1) * danger_fb;
        let susceptibility = (1.0 - pool.refractory[i]).max(0.0);
        let input = (mean_neighbor_surprise + pheromone_input) * transfer * susceptibility;
        let raw = (pool.surprise[i] * decay + input).max(0.0);
        pool.scratch_surprise[i] = (raw / (1.0 + raw)).min(1.0 - f32::EPSILON);

        // Refractory dynamics
        if pool.surprise[i] > cfg.refractory_threshold {
            pool.scratch_refractory[i] = (pool.refractory[i] + refract_buildup).min(1.0);
        } else {
            pool.scratch_refractory[i] = pool.refractory[i] * cfg.refractory_decay;
        }
    }

    // Write back from scratch buffers
    for i in 0..n {
        pool.vx[i] = pool.scratch_vx[i];
        pool.vy[i] = pool.scratch_vy[i];
        pool.surprise[i] = pool.scratch_surprise[i];
        pool.refractory[i] = pool.scratch_refractory[i];
        pool.x[i] = (pool.x[i] + pool.scratch_vx[i]).clamp(0.0, width);
        pool.y[i] = (pool.y[i] + pool.scratch_vy[i]).clamp(0.0, height);
    }
}

/// Agents deposit pheromones based on their state.
pub fn deposit_agent_pheromones(
    pool: &SwarmPool,
    pheromones: &mut PheromoneField,
    cfg: &PropagationConfig,
) {
    let n = pool.n_agents;

    // Trail markers: subsampled proportionally (1 per ~2000 agents, min 1)
    let trail_stride = (n / 2000).max(1);
    for i in (0..n).step_by(trail_stride) {
        pheromones.deposit(pool.x[i], pool.y[i], 2, 0.1);
    }

    // Danger + novelty: every surprised agent
    for i in 0..n {
        let s = pool.surprise[i];
        if s > cfg.danger_emission_threshold {
            pheromones.deposit(pool.x[i], pool.y[i], 1, s);
        }
        if s > cfg.novelty_emission {
            pheromones.deposit(pool.x[i], pool.y[i], 4, s * 0.5);
        }
    }
}

/// Darwinian evolution: dead agents are replaced by mutated offspring of nearby healthy parents.
pub fn run_evolution(
    pool: &mut SwarmPool,
    grid: &SpatialHashGrid,
    evo: &SwarmEvolutionConfig,
    perception_radius: f32,
) {
    let n = pool.n_agents;
    let death_threshold = evo.death_threshold;
    let sigma = evo.mutation_sigma;
    let r = perception_radius;

    // Collect dead agent indices
    let mut dead: Vec<usize> = Vec::new();
    for i in 0..n {
        if pool.health[i] < death_threshold {
            dead.push(i);
        }
    }

    if dead.is_empty() {
        return;
    }

    let mut rng = rand::thread_rng();

    // Snapshot parent genes (to avoid aliasing during writes)
    let parent_decay = pool.gene_decay.clone();
    let parent_transfer = pool.gene_transfer.clone();
    let parent_refractory = pool.gene_refractory.clone();
    let parent_danger = pool.gene_danger_sense.clone();
    let parent_novelty = pool.gene_novelty_drive.clone();
    let parent_speed = pool.gene_speed.clone();
    let parent_gen = pool.generation.clone();
    let parent_health = pool.health.clone();

    for &dead_idx in &dead {
        let px = pool.x[dead_idx];
        let py = pool.y[dead_idx];

        // Find a healthy parent among neighbors
        let mut parent_idx: Option<usize> = None;
        grid.query_neighbors(dead_idx as u32, px, py, r, |j| {
            let ji = j as usize;
            if parent_idx.is_none() && parent_health[ji] > 0.5 {
                parent_idx = Some(ji);
            }
        });

        // Fallback: random healthy agent
        if parent_idx.is_none() {
            for _ in 0..10 {
                let candidate = rng.gen_range(0..n);
                if parent_health[candidate] > 0.5 {
                    parent_idx = Some(candidate);
                    break;
                }
            }
        }

        if let Some(pi) = parent_idx {
            let mut mutate = |val: f32, min: f32, max: f32| -> f32 {
                let noise = rng.gen::<f32>() * 2.0 - 1.0;
                let noise2 = rng.gen::<f32>() * 2.0 - 1.0;
                let gauss = noise + noise2;
                (val + gauss * sigma).clamp(min, max)
            };

            pool.gene_decay[dead_idx] = mutate(parent_decay[pi], GENE_RANGES[0].0, GENE_RANGES[0].1);
            pool.gene_transfer[dead_idx] = mutate(parent_transfer[pi], GENE_RANGES[1].0, GENE_RANGES[1].1);
            pool.gene_refractory[dead_idx] = mutate(parent_refractory[pi], GENE_RANGES[2].0, GENE_RANGES[2].1);
            pool.gene_danger_sense[dead_idx] = mutate(parent_danger[pi], GENE_RANGES[3].0, GENE_RANGES[3].1);
            pool.gene_novelty_drive[dead_idx] = mutate(parent_novelty[pi], GENE_RANGES[4].0, GENE_RANGES[4].1);
            pool.gene_speed[dead_idx] = mutate(parent_speed[pi], GENE_RANGES[5].0, GENE_RANGES[5].1);
            pool.generation[dead_idx] = parent_gen[pi] + 1;

            pool.health[dead_idx] = 1.0;
            pool.surprise[dead_idx] = 0.0;
            pool.refractory[dead_idx] = 0.0;
        }
    }
}
