/* tslint:disable */
/* eslint-disable */

/**
 * WebAssembly Swarm Engine — runs the full SIRS simulation in-browser.
 *
 * v4.0.0: Self-evolving agent genomes with Darwinian selection.
 * Targets ~500K agents at 20+ FPS in modern browsers.
 */
export class WasmSwarmEngine {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Deposit pheromone at a location (for placement tools).
     */
    deposit_pheromone(x: number, y: number, channel: number, amount: number): void;
    /**
     * Whether evolution is currently enabled.
     */
    evolution_enabled(): boolean;
    /**
     * Gene diversity: standard deviation of gene_transfer across the population.
     */
    gene_diversity(): number;
    get_danger_emission_threshold(): number;
    get_danger_feedback(): number;
    get_distance_falloff(): number;
    get_evolution_config(): any;
    get_gene_danger_sense_ptr(): number;
    get_gene_decay_ptr(): number;
    get_gene_novelty_drive_ptr(): number;
    get_gene_refractory_ptr(): number;
    get_gene_speed_ptr(): number;
    /**
     * Pointer to gene_transfer array. Length = n_agents.
     */
    get_gene_transfer_ptr(): number;
    /**
     * Pointer to generation array. Length = n_agents.
     */
    get_generation_ptr(): number;
    /**
     * Pointer to health array. Length = n_agents.
     */
    get_health_ptr(): number;
    get_novelty_attraction(): number;
    get_novelty_emission(): number;
    /**
     * Pointer to pheromone channel data. Length = width * height.
     */
    get_pheromone_ptr(channel: number): number;
    /**
     * Pointer to interleaved positions [x0, y0, x1, y1, ...].
     * Length = n_agents * 2.
     */
    get_positions_ptr(): number;
    get_propagation_config(): any;
    get_refractory_buildup(): number;
    get_refractory_decay(): number;
    /**
     * Pointer to refractory array. Length = n_agents.
     */
    get_refractory_ptr(): number;
    get_refractory_threshold(): number;
    get_surprise_decay(): number;
    /**
     * Pointer to surprise array. Length = n_agents.
     */
    get_surprise_ptr(): number;
    get_surprise_transfer(): number;
    /**
     * Current tick number.
     */
    get_tick(): bigint;
    get_vx_ptr(): number;
    get_vy_ptr(): number;
    /**
     * Inject a surprise shockwave at (x, y) with given radius and intensity.
     */
    inject_surprise(x: number, y: number, radius: number, amount: number): void;
    /**
     * Mean generation across all agents.
     */
    mean_generation(): number;
    mean_health(): number;
    mean_refractory(): number;
    mean_surprise(): number;
    /**
     * Number of agents.
     */
    n_agents(): number;
    /**
     * Create a new swarm engine with `n_agents` agents in a `size × size` world.
     */
    constructor(n_agents: number, size: number);
    peak_surprise(): number;
    /**
     * Pheromone grid resolution.
     */
    pheromone_resolution(): number;
    r0_base(): number;
    r0_effective(): number;
    /**
     * Reset the simulation.
     */
    reset(): void;
    set_danger_emission_threshold(v: number): void;
    set_danger_feedback(v: number): void;
    set_death_threshold(v: number): void;
    set_distance_falloff(v: number): void;
    set_evolution_config(config: any): void;
    /**
     * Enable or disable Darwinian evolution of agent genomes.
     */
    set_evolution_enabled(enabled: boolean): void;
    set_health_reward(v: number): void;
    set_health_reward_threshold(v: number): void;
    set_mutation_sigma(v: number): void;
    set_novelty_attraction(v: number): void;
    set_novelty_emission(v: number): void;
    set_propagation_config(config: any): void;
    set_refractory_buildup(v: number): void;
    set_refractory_decay(v: number): void;
    set_refractory_threshold(v: number): void;
    set_reproduction_interval(v: number): void;
    set_surprise_decay(v: number): void;
    set_surprise_transfer(v: number): void;
    /**
     * Advance the simulation by N ticks (for step mode).
     */
    step(n: number): void;
    surprised_count(): number;
    /**
     * Advance the simulation by one tick.
     */
    tick(): void;
    /**
     * World size.
     */
    world_size(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmswarmengine_free: (a: number, b: number) => void;
    readonly wasmswarmengine_deposit_pheromone: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly wasmswarmengine_evolution_enabled: (a: number) => number;
    readonly wasmswarmengine_gene_diversity: (a: number) => number;
    readonly wasmswarmengine_get_danger_emission_threshold: (a: number) => number;
    readonly wasmswarmengine_get_danger_feedback: (a: number) => number;
    readonly wasmswarmengine_get_distance_falloff: (a: number) => number;
    readonly wasmswarmengine_get_evolution_config: (a: number) => any;
    readonly wasmswarmengine_get_gene_danger_sense_ptr: (a: number) => number;
    readonly wasmswarmengine_get_gene_decay_ptr: (a: number) => number;
    readonly wasmswarmengine_get_gene_novelty_drive_ptr: (a: number) => number;
    readonly wasmswarmengine_get_gene_refractory_ptr: (a: number) => number;
    readonly wasmswarmengine_get_gene_speed_ptr: (a: number) => number;
    readonly wasmswarmengine_get_gene_transfer_ptr: (a: number) => number;
    readonly wasmswarmengine_get_generation_ptr: (a: number) => number;
    readonly wasmswarmengine_get_health_ptr: (a: number) => number;
    readonly wasmswarmengine_get_novelty_attraction: (a: number) => number;
    readonly wasmswarmengine_get_novelty_emission: (a: number) => number;
    readonly wasmswarmengine_get_pheromone_ptr: (a: number, b: number) => number;
    readonly wasmswarmengine_get_positions_ptr: (a: number) => number;
    readonly wasmswarmengine_get_propagation_config: (a: number) => any;
    readonly wasmswarmengine_get_refractory_buildup: (a: number) => number;
    readonly wasmswarmengine_get_refractory_decay: (a: number) => number;
    readonly wasmswarmengine_get_refractory_ptr: (a: number) => number;
    readonly wasmswarmengine_get_refractory_threshold: (a: number) => number;
    readonly wasmswarmengine_get_surprise_decay: (a: number) => number;
    readonly wasmswarmengine_get_surprise_ptr: (a: number) => number;
    readonly wasmswarmengine_get_surprise_transfer: (a: number) => number;
    readonly wasmswarmengine_get_tick: (a: number) => bigint;
    readonly wasmswarmengine_get_vx_ptr: (a: number) => number;
    readonly wasmswarmengine_get_vy_ptr: (a: number) => number;
    readonly wasmswarmengine_inject_surprise: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly wasmswarmengine_mean_generation: (a: number) => number;
    readonly wasmswarmengine_mean_health: (a: number) => number;
    readonly wasmswarmengine_mean_refractory: (a: number) => number;
    readonly wasmswarmengine_mean_surprise: (a: number) => number;
    readonly wasmswarmengine_n_agents: (a: number) => number;
    readonly wasmswarmengine_new: (a: number, b: number) => number;
    readonly wasmswarmengine_peak_surprise: (a: number) => number;
    readonly wasmswarmengine_pheromone_resolution: (a: number) => number;
    readonly wasmswarmengine_r0_base: (a: number) => number;
    readonly wasmswarmengine_r0_effective: (a: number) => number;
    readonly wasmswarmengine_reset: (a: number) => void;
    readonly wasmswarmengine_set_danger_emission_threshold: (a: number, b: number) => void;
    readonly wasmswarmengine_set_danger_feedback: (a: number, b: number) => void;
    readonly wasmswarmengine_set_death_threshold: (a: number, b: number) => void;
    readonly wasmswarmengine_set_distance_falloff: (a: number, b: number) => void;
    readonly wasmswarmengine_set_evolution_config: (a: number, b: any) => [number, number];
    readonly wasmswarmengine_set_evolution_enabled: (a: number, b: number) => void;
    readonly wasmswarmengine_set_health_reward: (a: number, b: number) => void;
    readonly wasmswarmengine_set_health_reward_threshold: (a: number, b: number) => void;
    readonly wasmswarmengine_set_mutation_sigma: (a: number, b: number) => void;
    readonly wasmswarmengine_set_novelty_attraction: (a: number, b: number) => void;
    readonly wasmswarmengine_set_novelty_emission: (a: number, b: number) => void;
    readonly wasmswarmengine_set_propagation_config: (a: number, b: any) => [number, number];
    readonly wasmswarmengine_set_refractory_buildup: (a: number, b: number) => void;
    readonly wasmswarmengine_set_refractory_decay: (a: number, b: number) => void;
    readonly wasmswarmengine_set_refractory_threshold: (a: number, b: number) => void;
    readonly wasmswarmengine_set_reproduction_interval: (a: number, b: number) => void;
    readonly wasmswarmengine_set_surprise_decay: (a: number, b: number) => void;
    readonly wasmswarmengine_set_surprise_transfer: (a: number, b: number) => void;
    readonly wasmswarmengine_step: (a: number, b: number) => void;
    readonly wasmswarmengine_surprised_count: (a: number) => number;
    readonly wasmswarmengine_tick: (a: number) => void;
    readonly wasmswarmengine_world_size: (a: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
