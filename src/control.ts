/**
 * Control for the Simplex. Only some of these (or, indeed none of
 * these) can be provided to {@link Simplex} or {@link fitSimplex}
 */
export interface SimplexControlParam {
    /** Multiplicative change for nonzero parameters when constructing
     * the initial simplex, default is 0.05. If a starting point has a
     * nonzero value `x` for some dimension, then the value will be
     * perturbed to `x * (1 + deltaNonZero)` */
    deltaNonZero: number;
    /** Absolute change for zero parameters when constructing the
     * initial simplex, default is 0.001. If a starting point has a
     * zero value `x` for some dimension then this value will be
     * perturbed to `deltaZero` */
    deltaZero: number;
    /** Tolerance used in the convergence heuristics. Default is
     * 1e-5. Setting this value too small is likely to result in
     * issues with floating point arithmetic, or very slow convergence
     * in the final steps. */
    tolerance: number;
}

export function simplexControl(control: Partial<SimplexControlParam> = {}) {
    const defaults = {
        deltaNonZero: 0.05,
        deltaZero: 0.001,
        tolerance: 1e-5,
    };
    const ret = {
        deltaNonZero: withDefault(control.deltaNonZero, defaults.deltaNonZero),
        deltaZero: withDefault(control.deltaZero, defaults.deltaZero),
        tolerance: withDefault(control.tolerance, defaults.tolerance),
    };
    if (ret.tolerance <= 0) {
        throw new Error(
            "Invalid control parameter: 'tolerance' must be strictly positive");
    }
    return ret;
}

function withDefault<T>(x: T | undefined, y: T) {
    return x === undefined ? y : x;
}
