export interface SimplexControlParam {
    deltaNonZero: number;
    deltaZero: number;
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
