/* @ts-self-types="./cogops_wasm.d.ts" */

/**
 * WebAssembly Swarm Engine — runs the full SIRS simulation in-browser.
 *
 * v4.0.0: Self-evolving agent genomes with Darwinian selection.
 * Targets ~500K agents at 20+ FPS in modern browsers.
 */
export class WasmSwarmEngine {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmSwarmEngineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmswarmengine_free(ptr, 0);
    }
    /**
     * Deposit pheromone at a location (for placement tools).
     * @param {number} x
     * @param {number} y
     * @param {number} channel
     * @param {number} amount
     */
    deposit_pheromone(x, y, channel, amount) {
        wasm.wasmswarmengine_deposit_pheromone(this.__wbg_ptr, x, y, channel, amount);
    }
    /**
     * Whether evolution is currently enabled.
     * @returns {boolean}
     */
    evolution_enabled() {
        const ret = wasm.wasmswarmengine_evolution_enabled(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Gene diversity: standard deviation of gene_transfer across the population.
     * @returns {number}
     */
    gene_diversity() {
        const ret = wasm.wasmswarmengine_gene_diversity(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_danger_emission_threshold() {
        const ret = wasm.wasmswarmengine_get_danger_emission_threshold(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_danger_feedback() {
        const ret = wasm.wasmswarmengine_get_danger_feedback(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_distance_falloff() {
        const ret = wasm.wasmswarmengine_get_distance_falloff(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {any}
     */
    get_evolution_config() {
        const ret = wasm.wasmswarmengine_get_evolution_config(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_gene_danger_sense_ptr() {
        const ret = wasm.wasmswarmengine_get_gene_danger_sense_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_gene_decay_ptr() {
        const ret = wasm.wasmswarmengine_get_gene_decay_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_gene_novelty_drive_ptr() {
        const ret = wasm.wasmswarmengine_get_gene_novelty_drive_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_gene_refractory_ptr() {
        const ret = wasm.wasmswarmengine_get_gene_refractory_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_gene_speed_ptr() {
        const ret = wasm.wasmswarmengine_get_gene_speed_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Pointer to gene_transfer array. Length = n_agents.
     * @returns {number}
     */
    get_gene_transfer_ptr() {
        const ret = wasm.wasmswarmengine_get_gene_transfer_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Pointer to generation array. Length = n_agents.
     * @returns {number}
     */
    get_generation_ptr() {
        const ret = wasm.wasmswarmengine_get_generation_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Pointer to health array. Length = n_agents.
     * @returns {number}
     */
    get_health_ptr() {
        const ret = wasm.wasmswarmengine_get_health_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_novelty_attraction() {
        const ret = wasm.wasmswarmengine_get_novelty_attraction(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_novelty_emission() {
        const ret = wasm.wasmswarmengine_get_novelty_emission(this.__wbg_ptr);
        return ret;
    }
    /**
     * Pointer to pheromone channel data. Length = width * height.
     * @param {number} channel
     * @returns {number}
     */
    get_pheromone_ptr(channel) {
        const ret = wasm.wasmswarmengine_get_pheromone_ptr(this.__wbg_ptr, channel);
        return ret >>> 0;
    }
    /**
     * Pointer to interleaved positions [x0, y0, x1, y1, ...].
     * Length = n_agents * 2.
     * @returns {number}
     */
    get_positions_ptr() {
        const ret = wasm.wasmswarmengine_get_positions_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {any}
     */
    get_propagation_config() {
        const ret = wasm.wasmswarmengine_get_propagation_config(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_refractory_buildup() {
        const ret = wasm.wasmswarmengine_get_refractory_buildup(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_refractory_decay() {
        const ret = wasm.wasmswarmengine_get_refractory_decay(this.__wbg_ptr);
        return ret;
    }
    /**
     * Pointer to refractory array. Length = n_agents.
     * @returns {number}
     */
    get_refractory_ptr() {
        const ret = wasm.wasmswarmengine_get_refractory_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_refractory_threshold() {
        const ret = wasm.wasmswarmengine_get_refractory_threshold(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_surprise_decay() {
        const ret = wasm.wasmswarmengine_get_surprise_decay(this.__wbg_ptr);
        return ret;
    }
    /**
     * Pointer to surprise array. Length = n_agents.
     * @returns {number}
     */
    get_surprise_ptr() {
        const ret = wasm.wasmswarmengine_get_surprise_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_surprise_transfer() {
        const ret = wasm.wasmswarmengine_get_surprise_transfer(this.__wbg_ptr);
        return ret;
    }
    /**
     * Current tick number.
     * @returns {bigint}
     */
    get_tick() {
        const ret = wasm.wasmswarmengine_get_tick(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {number}
     */
    get_vx_ptr() {
        const ret = wasm.wasmswarmengine_get_vx_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_vy_ptr() {
        const ret = wasm.wasmswarmengine_get_vy_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Inject a surprise shockwave at (x, y) with given radius and intensity.
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {number} amount
     */
    inject_surprise(x, y, radius, amount) {
        wasm.wasmswarmengine_inject_surprise(this.__wbg_ptr, x, y, radius, amount);
    }
    /**
     * Mean generation across all agents.
     * @returns {number}
     */
    mean_generation() {
        const ret = wasm.wasmswarmengine_mean_generation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    mean_health() {
        const ret = wasm.wasmswarmengine_mean_health(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    mean_refractory() {
        const ret = wasm.wasmswarmengine_mean_refractory(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    mean_surprise() {
        const ret = wasm.wasmswarmengine_mean_surprise(this.__wbg_ptr);
        return ret;
    }
    /**
     * Number of agents.
     * @returns {number}
     */
    n_agents() {
        const ret = wasm.wasmswarmengine_n_agents(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Create a new swarm engine with `n_agents` agents in a `size × size` world.
     * @param {number} n_agents
     * @param {number} size
     */
    constructor(n_agents, size) {
        const ret = wasm.wasmswarmengine_new(n_agents, size);
        this.__wbg_ptr = ret >>> 0;
        WasmSwarmEngineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    peak_surprise() {
        const ret = wasm.wasmswarmengine_peak_surprise(this.__wbg_ptr);
        return ret;
    }
    /**
     * Pheromone grid resolution.
     * @returns {number}
     */
    pheromone_resolution() {
        const ret = wasm.wasmswarmengine_pheromone_resolution(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    r0_base() {
        const ret = wasm.wasmswarmengine_r0_base(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    r0_effective() {
        const ret = wasm.wasmswarmengine_r0_effective(this.__wbg_ptr);
        return ret;
    }
    /**
     * Reset the simulation.
     */
    reset() {
        wasm.wasmswarmengine_reset(this.__wbg_ptr);
    }
    /**
     * @param {number} v
     */
    set_danger_emission_threshold(v) {
        wasm.wasmswarmengine_set_danger_emission_threshold(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_danger_feedback(v) {
        wasm.wasmswarmengine_set_danger_feedback(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_death_threshold(v) {
        wasm.wasmswarmengine_set_death_threshold(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_distance_falloff(v) {
        wasm.wasmswarmengine_set_distance_falloff(this.__wbg_ptr, v);
    }
    /**
     * @param {any} config
     */
    set_evolution_config(config) {
        const ret = wasm.wasmswarmengine_set_evolution_config(this.__wbg_ptr, config);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable Darwinian evolution of agent genomes.
     * @param {boolean} enabled
     */
    set_evolution_enabled(enabled) {
        wasm.wasmswarmengine_set_evolution_enabled(this.__wbg_ptr, enabled);
    }
    /**
     * @param {number} v
     */
    set_health_reward(v) {
        wasm.wasmswarmengine_set_health_reward(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_health_reward_threshold(v) {
        wasm.wasmswarmengine_set_health_reward_threshold(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_mutation_sigma(v) {
        wasm.wasmswarmengine_set_mutation_sigma(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_novelty_attraction(v) {
        wasm.wasmswarmengine_set_novelty_attraction(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_novelty_emission(v) {
        wasm.wasmswarmengine_set_novelty_emission(this.__wbg_ptr, v);
    }
    /**
     * @param {any} config
     */
    set_propagation_config(config) {
        const ret = wasm.wasmswarmengine_set_propagation_config(this.__wbg_ptr, config);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} v
     */
    set_refractory_buildup(v) {
        wasm.wasmswarmengine_set_refractory_buildup(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_refractory_decay(v) {
        wasm.wasmswarmengine_set_refractory_decay(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_refractory_threshold(v) {
        wasm.wasmswarmengine_set_refractory_threshold(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_reproduction_interval(v) {
        wasm.wasmswarmengine_set_reproduction_interval(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_surprise_decay(v) {
        wasm.wasmswarmengine_set_surprise_decay(this.__wbg_ptr, v);
    }
    /**
     * @param {number} v
     */
    set_surprise_transfer(v) {
        wasm.wasmswarmengine_set_surprise_transfer(this.__wbg_ptr, v);
    }
    /**
     * Advance the simulation by N ticks (for step mode).
     * @param {number} n
     */
    step(n) {
        wasm.wasmswarmengine_step(this.__wbg_ptr, n);
    }
    /**
     * @returns {number}
     */
    surprised_count() {
        const ret = wasm.wasmswarmengine_surprised_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Advance the simulation by one tick.
     */
    tick() {
        wasm.wasmswarmengine_tick(this.__wbg_ptr);
    }
    /**
     * World size.
     * @returns {number}
     */
    world_size() {
        const ret = wasm.wasmswarmengine_world_size(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WasmSwarmEngine.prototype[Symbol.dispose] = WasmSwarmEngine.prototype.free;

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_83742b46f01ce22d: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_a5a435bd7bbec835: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_boolean_get_c0f3f60bac5a78d1: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_5398f5bb970e0daa: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_41dbb8413020e076: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_function_3c846841762788c1: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_781bc9f159099513: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_7ef6b97b02428fae: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_52709e72fb9f179c: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_5bcc3bed3c69e72b: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_34bb9d9dcfa21373: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_395e606bd0ee4427: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_6ddd609b62940d55: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_2d781c1f4d5c0ef8: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_crypto_38df2bab126b63dc: function(arg0) {
            const ret = arg0.crypto;
            return ret;
        },
        __wbg_getRandomValues_c44a50d8cfdaebeb: function() { return handleError(function (arg0, arg1) {
            arg0.getRandomValues(arg1);
        }, arguments); },
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_101e2bf31071a9f6: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_740438561a5b956d: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isSafeInteger_ecd6a7f9c3e053cd: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_length_ea16607d7b61445b: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_msCrypto_bd5a034af96bcba6: function(arg0) {
            const ret = arg0.msCrypto;
            return ret;
        },
        __wbg_new_5f486cdf45a04d78: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_ab79df5bd7c26067: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_with_length_825018a1616e9e55: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_node_84ea875411254db1: function(arg0) {
            const ret = arg0.node;
            return ret;
        },
        __wbg_process_44c7a14e11e9f69e: function(arg0) {
            const ret = arg0.process;
            return ret;
        },
        __wbg_prototypesetcall_d62e5099504357e6: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_randomFillSync_6c25eac9869eb53c: function() { return handleError(function (arg0, arg1) {
            arg0.randomFillSync(arg1);
        }, arguments); },
        __wbg_require_b4edbdcf3e2a1ef0: function() { return handleError(function () {
            const ret = module.require;
            return ret;
        }, arguments); },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_static_accessor_GLOBAL_8adb955bd33fac2f: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_ad356e0db91c7913: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_f207c857566db248: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_bb9f1ba69d61b386: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subarray_a068d24e39478a8a: function(arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_versions_276b2795b1c6a219: function(arg0) {
            const ret = arg0.versions;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./cogops_wasm_bg.js": import0,
    };
}

const WasmSwarmEngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmswarmengine_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('cogops_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
