//! Swarm Engine
//!
//! Handles massive-scale agent simulation using tensor-based state (SoA).
//! Inspired by modern simulation frameworks.

pub mod criticality_test;
pub mod evolution_test;
pub mod grid;
pub mod lod;
pub mod master_pipeline;
pub mod mmap_pool;
pub mod pheromone;
pub mod pollination;
pub mod promoter;
pub mod py_api;
pub mod scale_test;
pub mod spatial;
pub mod swarm_engine;
pub mod tensor_engine;
pub mod watcher;

use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;

pub use lod::{DormantAgent, ProductionTensorSwarm, SimplifiedPool};
pub use master_pipeline::{PropagationConfig, SwarmEvolutionConfig};
pub use promoter::PromotionLogic;
pub use spatial::GridMap;
pub use tensor_engine::TensorSwarm;

/// Configuration for the Swarm Engine
#[derive(Clone, Debug)]
#[pyclass]
pub struct SwarmConfig {
    #[pyo3(get, set)]
    pub population_size: usize,
    #[pyo3(get, set)]
    pub world_width: usize,
    #[pyo3(get, set)]
    pub world_height: usize,
    #[pyo3(get, set)]
    pub max_threads: usize,
    /// Ebbinghaus decay rate: controls how fast low-surprise events are forgotten.
    /// High rate = fast forgetting of routine events; Low rate = slow forgetting of all events.
    /// Range: (0, 1). Default: 0.1.
    #[pyo3(get, set)]
    pub ebbinghaus_decay_rate: f32,
}

#[pymethods]
impl SwarmConfig {
    #[new]
    #[pyo3(signature = (population_size = 100000, world_width = 1000, world_height = 1000, max_threads = 8, ebbinghaus_decay_rate = 0.1))]
    pub fn new(
        population_size: usize,
        world_width: usize,
        world_height: usize,
        max_threads: usize,
        ebbinghaus_decay_rate: f32,
    ) -> PyResult<Self> {
        if !(0.0..=1.0).contains(&ebbinghaus_decay_rate) {
            return Err(PyValueError::new_err(format!(
                "ebbinghaus_decay_rate must be in [0.0, 1.0], got {}",
                ebbinghaus_decay_rate
            )));
        }
        Ok(SwarmConfig {
            population_size,
            world_width,
            world_height,
            max_threads,
            ebbinghaus_decay_rate,
        })
    }
}

impl Default for SwarmConfig {
    fn default() -> Self {
        SwarmConfig {
            population_size: 100_000,
            world_width: 1000,
            world_height: 1000,
            max_threads: 8,
            ebbinghaus_decay_rate: 0.1,
        }
    }
}
