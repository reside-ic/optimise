export interface SimplexControlParam {
    deltaNonZero: number;
    deltaZero: number;
    minErrorDelta: number;
    minTolerance: number;
}

export function simplexControl(control: Partial<SimplexControlParam> = {}) {
    const defaults = {
        // initialisation
        deltaNonZero: 0.05,
        deltaZero: 0.001,
        // convergence - rename these at some point
        minErrorDelta: 1e-6,
        minTolerance: 1e-5,
    };
    const ret = {
        deltaNonZero: withDefault(control.deltaNonZero,
                                  defaults.deltaNonZero),
        deltaZero: withDefault(control.deltaZero,
                               defaults.deltaZero),
        minErrorDelta: withDefault(control.minErrorDelta,
                                   defaults.minErrorDelta),
        minTolerance: withDefault(control.minTolerance,
                                  defaults.minTolerance),
    };
    // more checks might be worthwhile here, really.
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
