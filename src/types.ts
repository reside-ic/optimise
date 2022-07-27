/** The richer result type that can be returned by a {@link TargetFn};
 * use this to return arbitrary additional information back alongside
 * the optimisation.
 */
export interface Result {
    /** Any additional value returned by the target function */
    data: any;
    /** The value of the objective function */
    value: number;
}

/**
 * A point visited by an optimiser
 */
export interface Point<T> {
    /**
     * Any additional value returned by the target function
     * (see {@link @Result})
     */
    data: any;
    /** A unique identifier for the point */
    id: number;
    /** The location in the problem space */
    location: T;
    /** The value of the target function at this point */
    value: number;
}

/**
 * The interface that a function to be minimised must satisfy.
 *
 * * For {@link Simplex}, `T` should be `number[]` representing a
 *   point in n-dimensional space
 * * For {@link Brent}, `T` should be `number` representing a single
 *   real value
 *
 * For both, the return value must either be a number (the objective
 * value to be minimised) or {@link Result} (a rich result type that
 * includes the objective value and additional information; see below).
 *
 * @remarks
 *
 * Sometimes, it is useful to get additional information out of the
 * target function and store it alongside the solution - this is what
 * the {@link Result} return type is for. For example, if fitting a
 * model to data you might end up with a sum-of-squares error used for
 * target fitting, but the model values themselves are of
 * interest. For linear regression we might do this by returning a
 * closure that could be evaluated at any `x` position:
 *
 * ```typescript
 * const xObserved = [0, 1, 2, 3, 4];
 * const yObserved = [0.64, 2.41, 4.29, 6.62, 8.31]
 * function target(theta) {
 *     const c = theta[0]; // intercept
 *     const m = theta[1]; // slope
 *     var tot = 0;
 *     for (var i = 0; i < xObserved.length; ++i) {
 *         tot += (c + m * xObserved[i] - yObserved[i])**2;
 *     }
 *     return {value: tot, data: (x) => x.map(el => c + m * el)};
 * }
 * ```
 *
 * This can be passed through to {@link Simplex} above, and the `data`
 * element of {@link Simplex.result | `Simplex.result()`} will contain
 * the predictor function at the best point. (Do not fit linear
 * regressions with this package - you can do that faster and more
 * accurately with many other methods.)
 *
 * @param location A point in n dimensional space to evaluate
 *
 * @return result The value of the target function at `location`,
 * either as a simple number or a rich {@link Result} type
 */
export type TargetFn<T> = (location: T) => number | Result;

export function checkResult(value: number | Result): Result {
    if (typeof value === "number") {
        return {
            data: null,
            value,
        };
    }
    return value;
}
