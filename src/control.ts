export interface SimplexControlParam {
    maxIterations: number;
    nonZeroDelta: number;
    zeroDelta: number;
    minErrorDelta: number;
    minTolerance: number;
    rho: number;
    chi: number;
    psi: number;
    sigma: number;
}

export function simplexControl(control: Partial<SimplexControlParam> = {}) {
    const defaults = {
        maxIterations: 200,
        nonZeroDelta: 0.05,
        zeroDelta: 0.001,
        minErrorDelta: 1e-6,
        minTolerance: 1e-5,
        rho: 1,
        chi: 2,
        psi: -0.5,
        sigma: 0.5,
    };
    const ret = {
        maxIterations: withDefault(control.maxIterations,
                                   defaults.maxIterations),
        nonZeroDelta: withDefault(control.nonZeroDelta,
                                  defaults.nonZeroDelta),
        zeroDelta: withDefault(control.zeroDelta,
                               defaults.zeroDelta),
        minErrorDelta: withDefault(control.minErrorDelta,
                                   defaults.minErrorDelta),
        minTolerance: withDefault(control.minTolerance,
                                  defaults.minTolerance),
        rho: withDefault(control.rho, defaults.rho),
        chi: withDefault(control.rho, defaults.chi),
        psi: withDefault(control.rho, defaults.psi),
        sigma: withDefault(control.rho, defaults.sigma),
    };
    // more checks might be worthwhile here, really.
    if (ret.maxIterations < 1) {
        throw controlError("maxIterations", "must be at least 1");
    }
    if (ret.minTolerance <= 0) {
        throw controlError("minTolerance", "must be strictly positive");
    }
    return ret;
}

function controlError(nm: string, message: string) {
    return new Error(`Invalid control parameter: '${nm}' ${message}`);
}

function withDefault<T>(x: T | undefined, y: T) {
    return x === undefined ? y : x;
}
