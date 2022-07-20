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
 * @param target A function conforming to {@link TargetFn} or {@link
 * TargetFn1}
 *
 * @return Another function that can be passed through to {@link
 * Simplex} (if `target` was {@link TargetFn}) or {@link Brent} (if
 * `target` was {@link TargetFn1})
 */
export function invert<T>(target: (x: T) => number | Result) {
    return (x: T) => {
        const res = checkResult(target(x));
        res.value = -res.value;
        return res;
    };
}
