import { checkResult, Result } from "./types";

export function withDefault<T>(x: T | undefined, y: T) {
    return x === undefined ? y : x;
}

export function protect<T, U>(target: (x: T) => number | U) {
    return (x: T) => {
        try {
            return target(x);
        } catch {
            return Infinity;
        }
    };
}

/** Invert a target function, allowing maximisation of an objective
 * function rather than minimising.
 *
 * @param target A function conforming to {@link TargetFn}
 *
 * @return Another function that can be passed through to {@link
 * Simplex} or {@link Brent}
 */
export function invert<T>(target: (x: T) => number | Result) {
    return (x: T) => {
        const res = checkResult(target(x));
        res.value = -res.value;
        return res;
    };
}

// https://gcc.gnu.org/onlinedocs/gfortran/SIGN.html
export function copysign(a: number, b: number) {
    return Math.sign(b) * a;
}

export function weightedSum(w: number, v1: number[], v2: number[]) {
    const n = v1.length;
    const ret = new Array(n);
    const w1 = 1 + w;
    const w2 = -w;
    for (let j = 0; j < ret.length; ++j) {
        ret[j] = w1 * v1[j] + w2 * v2[j];
    }
    return ret;
}
