/// Fibonacci spatial hash grid for O(N) neighbor queries.
///
/// Adapted from core grid.rs — identical algorithm, no OS dependencies.
pub struct SpatialHashGrid {
    counts: Vec<u32>,
    offsets: Vec<u32>,
    data: Vec<u32>,
    table_size: usize,
    mask: usize,
    pub cell_size: f32,
    pub world_min: [f32; 2],
}

impl SpatialHashGrid {
    pub fn new(table_size: usize, cell_size: f32, world_min: [f32; 2]) -> Self {
        assert!(table_size.is_power_of_two());
        SpatialHashGrid {
            counts: vec![0u32; table_size],
            offsets: vec![0u32; table_size],
            data: Vec::new(),
            table_size,
            mask: table_size - 1,
            cell_size,
            world_min,
        }
    }

    #[inline(always)]
    fn hash(&self, cx: i32, cy: i32) -> usize {
        let key = (cx as u64).wrapping_mul(2654435761)
                ^ (cy as u64).wrapping_mul(2246822519);
        (key.wrapping_mul(11400714819323198485) >> (64 - self.table_size.trailing_zeros())) as usize
            & self.mask
    }

    #[inline(always)]
    pub fn world_to_cell(&self, x: f32, y: f32) -> (i32, i32) {
        let cx = ((x - self.world_min[0]) / self.cell_size).floor() as i32;
        let cy = ((y - self.world_min[1]) / self.cell_size).floor() as i32;
        (cx, cy)
    }

    pub fn counts_reset(&mut self) {
        self.counts.iter_mut().for_each(|c| *c = 0);
    }

    #[inline]
    pub fn count_agent(&mut self, cx: i32, cy: i32) {
        let h = self.hash(cx, cy);
        self.counts[h] += 1;
    }

    pub fn compute_offsets(&mut self) {
        let total: u32 = self.counts.iter().sum();
        if self.data.len() < total as usize {
            self.data.resize(total as usize, 0);
        }
        let mut running = 0u32;
        for h in 0..self.table_size {
            self.offsets[h] = running;
            running += self.counts[h];
        }
        self.counts.iter_mut().for_each(|c| *c = 0);
    }

    #[inline]
    pub fn scatter_agent(&mut self, cx: i32, cy: i32, agent_idx: u32) {
        let h = self.hash(cx, cy);
        let slot = (self.offsets[h] + self.counts[h]) as usize;
        self.data[slot] = agent_idx;
        self.counts[h] += 1;
    }

    #[inline]
    pub fn query_neighbors<F>(
        &self,
        self_idx: u32,
        qx: f32, qy: f32, r: f32,
        mut callback: F,
    ) where
        F: FnMut(u32),
    {
        let (cx0, cy0) = self.world_to_cell(qx - r, qy - r);
        let (cx1, cy1) = self.world_to_cell(qx + r, qy + r);

        for cy in cy0..=cy1 {
            for cx in cx0..=cx1 {
                let h = self.hash(cx, cy);
                let start = self.offsets[h] as usize;
                let end = start + self.counts[h] as usize;
                for &idx in &self.data[start..end] {
                    if idx != self_idx {
                        callback(idx);
                    }
                }
            }
        }
    }
}
