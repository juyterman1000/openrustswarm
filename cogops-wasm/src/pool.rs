/// Vec-based Struct-of-Arrays agent pool for WebAssembly.
///
/// Equivalent to MmapSwarmPool but uses heap-allocated Vec<f32> instead of
/// anonymous mmap regions. Scales from 10 to millions of agents.
pub struct SwarmPool {
    pub n_agents: usize,

    // Core physics
    pub x: Vec<f32>,
    pub y: Vec<f32>,
    pub vx: Vec<f32>,
    pub vy: Vec<f32>,

    // Cognitive state
    pub surprise: Vec<f32>,
    pub refractory: Vec<f32>,
    pub health: Vec<f32>,

    // Spatial hashing metadata
    pub cell_index: Vec<u32>,

    // Evolvable genome (per-agent behavioral parameters)
    pub gene_decay: Vec<f32>,          // surprise decay rate [0.8, 0.99]
    pub gene_transfer: Vec<f32>,       // surprise transfer rate [0.01, 0.3]
    pub gene_refractory: Vec<f32>,     // refractory buildup rate [0.05, 0.8]
    pub gene_danger_sense: Vec<f32>,   // danger pheromone sensitivity [0.0, 0.5]
    pub gene_novelty_drive: Vec<f32>,  // novelty attraction weight [0.0, 0.8]
    pub gene_speed: Vec<f32>,          // max velocity [0.5, 5.0]
    pub generation: Vec<u32>,          // lineage counter

    // Pre-allocated scratch buffers (reused each tick — zero per-tick allocation)
    pub scratch_vx: Vec<f32>,
    pub scratch_vy: Vec<f32>,
    pub scratch_surprise: Vec<f32>,
    pub scratch_refractory: Vec<f32>,
}

impl SwarmPool {
    pub fn new(n_agents: usize) -> Self {
        Self {
            n_agents,
            x: vec![0.0; n_agents],
            y: vec![0.0; n_agents],
            vx: vec![0.0; n_agents],
            vy: vec![0.0; n_agents],
            surprise: vec![0.0; n_agents],
            refractory: vec![0.0; n_agents],
            health: vec![1.0; n_agents],
            cell_index: vec![0; n_agents],
            gene_decay: vec![0.92; n_agents],
            gene_transfer: vec![0.08; n_agents],
            gene_refractory: vec![0.3; n_agents],
            gene_danger_sense: vec![0.15; n_agents],
            gene_novelty_drive: vec![0.2; n_agents],
            gene_speed: vec![2.0; n_agents],
            generation: vec![0; n_agents],
            // Pre-allocate scratch buffers — reused every tick, zero per-tick allocation
            scratch_vx: vec![0.0; n_agents],
            scratch_vy: vec![0.0; n_agents],
            scratch_surprise: vec![0.0; n_agents],
            scratch_refractory: vec![0.0; n_agents],
        }
    }

    pub fn randomize_positions(&mut self, width: f32, height: f32) {
        for i in 0..self.n_agents {
            self.x[i] = rand::random::<f32>() * width;
            self.y[i] = rand::random::<f32>() * height;
        }
    }

    pub fn update_spatial_hashes(&mut self, world_width: f32) {
        let cell_size = 10.0f32;
        let cols = (world_width / cell_size).ceil() as u32;

        for i in 0..self.n_agents {
            let cx = (self.x[i] / cell_size) as u32;
            let cy = (self.y[i] / cell_size) as u32;
            self.cell_index[i] = cy * cols + cx;
        }
    }

    pub fn sort_by_spatial_hash(&mut self) {
        let n = self.n_agents;
        let mut indices: Vec<usize> = (0..n).collect();
        indices.sort_unstable_by_key(|&i| self.cell_index[i]);

        let old_x = self.x.clone();
        let old_y = self.y.clone();
        let old_vx = self.vx.clone();
        let old_vy = self.vy.clone();
        let old_surprise = self.surprise.clone();
        let old_refractory = self.refractory.clone();
        let old_health = self.health.clone();
        let old_cell = self.cell_index.clone();
        let old_gene_decay = self.gene_decay.clone();
        let old_gene_transfer = self.gene_transfer.clone();
        let old_gene_refractory = self.gene_refractory.clone();
        let old_gene_danger_sense = self.gene_danger_sense.clone();
        let old_gene_novelty_drive = self.gene_novelty_drive.clone();
        let old_gene_speed = self.gene_speed.clone();
        let old_generation = self.generation.clone();

        for (new_idx, &old_idx) in indices.iter().enumerate() {
            self.x[new_idx] = old_x[old_idx];
            self.y[new_idx] = old_y[old_idx];
            self.vx[new_idx] = old_vx[old_idx];
            self.vy[new_idx] = old_vy[old_idx];
            self.surprise[new_idx] = old_surprise[old_idx];
            self.refractory[new_idx] = old_refractory[old_idx];
            self.health[new_idx] = old_health[old_idx];
            self.cell_index[new_idx] = old_cell[old_idx];
            self.gene_decay[new_idx] = old_gene_decay[old_idx];
            self.gene_transfer[new_idx] = old_gene_transfer[old_idx];
            self.gene_refractory[new_idx] = old_gene_refractory[old_idx];
            self.gene_danger_sense[new_idx] = old_gene_danger_sense[old_idx];
            self.gene_novelty_drive[new_idx] = old_gene_novelty_drive[old_idx];
            self.gene_speed[new_idx] = old_gene_speed[old_idx];
            self.generation[new_idx] = old_generation[old_idx];
        }
    }

    /// Estimated memory in MB.
    pub fn estimated_mb(&self) -> f64 {
        let bytes_per_agent = 15 * std::mem::size_of::<f32>();
        (self.n_agents * bytes_per_agent) as f64 / (1024.0 * 1024.0)
    }
}
