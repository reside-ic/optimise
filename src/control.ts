import { withDefault } from "./utils";

/**
 * Control for the Simplex. Only some of these (or, indeed none of
 * these) can be provided to {@link Simplex} or {@link fitSimplex}
 */
export interface SimplexControlParam {
    /** Multiplicative change for nonzero parameters when constructing
     *  the initial simplex, default is 0.05. If a starting point has
     *  a nonzero value `x` for some dimension, then the value will be
     *  perturbed to `x * (1 + deltaNonZero)`
     */
    deltaNonZero: number;
    /** Absolute change for zero parameters when constructing the
     *  initial simplex, default is 0.001. If a starting point has a
     *  zero value `x` for some dimension then this value will be
     *  perturbed to `deltaZero`
     */
    deltaZero: number;

    /** Should we raise an error if the target function fails? If
     *  `true` then any error in the target function is propagated out
     *  from the solver, while if `false` then failure in the target
     *  function is converted into a return value of `-Infinity` (this
     *  is the default behaviour). The default behaviour is designed
     *  for use for functions where some parameters may not make
     *  sense, and can be used to implement bounded optimisation by
     *  raising an error if the parameters are unsuitable.
     */
    errorOnFailure: boolean;
    /** Tolerance used in the convergence heuristics. Default is
     *  1e-5. Setting this value too small is likely to result in
     *  issues with floating point arithmetic, or very slow
     *  convergence in the final steps.
     */
    tolerance: number;
}

export function simplexControl(control: Partial<SimplexControlParam> = {}) {
    const defaults = {
        deltaNonZero: 0.05,
        deltaZero: 0.001,
        errorOnFailure: false,
        tolerance: 1e-5,
    };
    const ret = {
        deltaNonZero: withDefault(control.deltaNonZero, defaults.deltaNonZero),
        deltaZero: withDefault(control.deltaZero, defaults.deltaZero),
        errorOnFailure: withDefault(control.errorOnFailure, defaults.errorOnFailure),
        tolerance: withDefault(control.tolerance, defaults.tolerance),
    };
    if (ret.tolerance <= 0) {
        throw new Error(
            "Invalid control parameter: 'tolerance' must be strictly positive");
    }
    return ret;
}
