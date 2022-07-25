import { checkResult, Result, TargetFn1 } from "./types";
import { copysign, invert, protect, withDefault } from "./utils";

/**
 * Control for the Brent algorithm. Only some of these (or, indeed none of
 * these) can be provided to {@link Brent} or {@link fitBrent}
 */
export interface BrentControlParam {
    /** Search for the maximum, rather than the minimum */
    findMax: boolean;
    /**
     * The tolerance for the optimisation, used to guide the stopping
     * criteria (see {@link Brent})
     */
    tolerance: number;
}

export function brentControl(control: Partial<BrentControlParam>) {
    const defaults = {
        findMax: false,
        tolerance: 1e-6,
    };
    const ret = {
        findMax: withDefault(control.findMax, defaults.findMax),
        tolerance: withDefault(control.tolerance, defaults.tolerance),
    };
    if (ret.tolerance <= 0) {
        throw new Error(
            "Invalid control parameter: 'tolerance' must be strictly positive");
    }
    return ret;
}

/**
 * Run the Brent 1d minimisation on a target function. This is a
 * convenience function and offers little control but a compact
 * interface. For more control, use {@link Brent} directly.
 *
 * @param target The function to be minimised
 *
 * @param lower The lower bound of the interval to search in
 *
 * @param upper The upper bound of the interval to search in
 *
 * @param control Control parameters for the optimisation
 *
 * @param maxIterations The maximum number of iterations of the
 * algorithm (calls to {@link Brent.step | `Brent.step()`}) to
 * take. Because the algorithm is guaranteed to converge, a value of
 * `Infinity` is safe, and is the default.
 *
 * @returns See {@link Brent.result | `Brent.result`} for details
 */
export function fitBrent(target: TargetFn1, lower: number, upper: number,
                         control: Partial<BrentControlParam> = {},
                         maxIterations: number = Infinity) {
    const solver = new Brent(target, lower, upper, control);
    return solver.run(maxIterations);
}

/**
 * Start, improve and interrogate an optimisation of a scalar-argument
 * function (i.e., 1D optimisation). If you are doing dimensional
 * optimisation, you should use {@link Simplex}.
 *
 * Like {@link Simplex}, creating an object does not perform the
 * optimisation, but gives you an object that you can loop through
 * yourself. Use {@link fitBrent} for a one-shot version.
 *
 * The approach here comes from [Brent (1976) - Algorithms for
 * minimization without
 * derivatives](https://maths-people.anu.edu.au/~brent/pd/rpb011i.pdf),
 * and in particular the Algol code on p79-80 and Fortran code from
 * [netlib](https://www.netlib.org/fmm/fmin.f).
 *
 * The description from the paper and code, updated with our names:
 *
 * > the method used is a combination of golden section search and
 * > successive parabolic interpolation.  convergence is never much
 * > slower than that for a fibonacci search.  if `target` has a
 * > continuous second derivative which is positive at the minimum
 * > (which is not at `lower` or `upper`), then convergence is
 * > superlinear, and usually of the order of about 1.324....
 *
 * > the function `target` is never evaluated at two points closer
 * > together than `eps * abs(fmin) + (tolerance / 3)`, where `eps` is
 * > approximately the square root of the relative machine precision.
 * > if `target` is a unimodal function and the computed values of
 * > `target` are always unimodal when separated by at least `eps *
 * > abs(x) + (tolerance / 3)`, then `fmin` approximates the abcissa
 * > of the global minimum of `target` on the interval (`lower`,
 * > `upper`) with an error less than
 * > `3 * eps * abs(fmin) + > tolerance`.  if `target` is not unimodal,
 * > then `fmin` may approximate a local, but perhaps non-global, minimum
 * > to the same accuracy.
 */
export class Brent {
    private readonly _target: TargetFn1;
    private readonly _control: BrentControlParam;
    private readonly _state: BrentState;
    private _converged: boolean = false;
    private _evaluations: number = 0;

    /**
     * @param target The function to be minimised
     *
     * @param lower The lower bound of the interval to search in
     *
     * @param upper The upper bound of the interval to search in
     *
     * @param control Control parameters for the optimisation
     */
    constructor(target: TargetFn1, lower: number, upper: number,
                control: Partial<BrentControlParam> = {}) {
        this._control = brentControl(control);
        this._target = this._control.findMax ? invert(target) : target;
        const m = lower + squaredInverseGoldenRatio * (upper - lower);
        const x = this._point(m);
        const w: Point1 = { ...x };
        const v: Point1 = { ...x };
        this._state = {a: lower, b: upper, v, w, x, d: 0, e: 0};
    }

    /**
     * Advance the optimiser one "step" of the algorithm. This will
     * evaluate `target` once.
     *
     * @return `true` if the algorithm has converged, `false`
     * otherwise. For details about the best point so far, see
     * {@link Brent.result}
     */
    public step() {
        this._converged = this._step();
        return this._converged;
    }

    /**
     * Helper function to run the algorithm until converged. This is
     * very basic and not really intended to be used - you should
     * probably build logic around {@link Brent.step} directly, or if
     * you want a simple interface use the {@link fitBrent} function.
     *
     * @param maxIterations The maximum number of iterations of the
     * algorithm (calls to {@link Brent.step} to take. If we converge
     * before hitting this number we will return early.
     *
     * @return The same object as {@link Brent.result}. Note that the
     * algorithm may not have converged if `maxIterations` is not
     * `Infinity`, so you should check the `.converged` field.
     */
    public run(maxIterations: number = Infinity) {
        if (!this._converged) {
            for (let i = 0; i < maxIterations; ++i) {
                if (this.step()) {
                    break;
                }
            }
        }
        return this.result();
    }

    /**
     * Return information about the best found point so far.
     */
    public result() {
        const best = this._state.x;
        return {
            /** Has the algorithm converged? */
            converged: this._converged,
            /** Any additional data returned by the target function,
             *  for this point
             */
            data: best.data,
            /** The number of times that `target` has been called so far */
            evaluations: this._evaluations,
            /** The number of times that {@link Brent.step} has been
             *  called so far
             */
            iterations: this._evaluations - 1,
            /** The best found location */
            location: best.location,
            /** The value of `target(location)` */
            value: this._control.findMax ? -best.value : best.value,
        };
    }

    private _point(location: number): Point1 {
        this._evaluations++;
        const result = checkResult(this._target(location));
        return {
            data: result.data,
            location,
            value: result.value,
        };
    }

    private _step() {
        const state = this._state;
        const xm = (state.a + state.b) / 2;
        const x = state.x.location;
        const tol1 = sqrtMachineEps * Math.abs(x) +
            this._control.tolerance / 3.0;
        const tol2 = 2.0 * tol1;

        // Test to see if we've converged
        if (Math.abs(x - xm) <= (tol2 - 0.5 * (state.b - state.a))) {
            return true;
        }

        const [p, q] = fitParabola(state, tol1);

        const useGoldenRatio =
            Math.abs(p) >= Math.abs(q * 0.5 * state.e) ||
            p <= q * (state.a - x) ||
            p >= q * (state.b - x);

        if (useGoldenRatio) {
            if (x < xm) {
                state.e = state.b - x;
            } else {
                state.e = state.a - x;
            }
            state.d = squaredInverseGoldenRatio * state.e;
        } else { // Parabolic interpolation
            state.e = state.d;
            state.d = p / q;
            const uNext = x + state.d; // candidate u for below
            // f must not be evaluated too close to a or b (lower or upper)
            if (uNext - state.a < tol2 || state.b - uNext < tol2) {
                state.d = x < xm ? tol1 : -tol1;
            }
        }

        // f must not be evaluated too close to x
        const d = Math.abs(state.d) >= tol1 ? state.d : copysign(tol1, state.d);
        const u = this._point(x + d);

        updateState(u, state);
        return false;
    }
}

interface Point1 {
    readonly data: any;
    readonly location: number;
    readonly value: number;
}

/**
 * See p 73 of the book
 *
 * We track a set of points on the domain [a, b, u, v, w, x], not all
 * distinct.
 *
 * * Initially (`a`, `b`) is the domain of `target` where we will search
 *   for the minimum.
 * * `x` is the point visited with the lowest value of `target`
 * * `w` is the second lowest visited value of `target`
 * * `v` is the previous value of `w`
 * * The values `d` and `e` track the parabolic fit, used by the algorithm
 *   to switch between bisection and interpolation.
 */
interface BrentState {
    /** Current lower bound of the optimum */
    a: number;
    /** Current upper bound of the optimum */
    b: number;

    /** Previous value of `w` */
    v: Point1;
    /** Previous value of `x` */
    w: Point1;
    /** Best found location `x` */
    x: Point1;

    /** Previous value of 'e' */
    d: number;
    /** The value of `p/q` (from the parabola fit) at the second-last
     * cycle, used to determine if the parabola fit should be used or
     * not. Initially zero
     */
    e: number;
}

// Squared inverse of the golden ratio
const squaredInverseGoldenRatio = 0.5 * (3 - Math.sqrt(5));

// Square root of machine precision
const sqrtMachineEps = Math.sqrt(Number.EPSILON);

function updateState(u: Point1, state: BrentState) {
    const x = state.x;
    const w = state.w;
    const v = state.v;
    if (u.value > x.value) {
        if (u.location < x.location) {
            state.a = u.location;
        }
        if (u.location >= x.location) {
            state.b = u.location;
        }
        if (u.value <= w.value || w.location === x.location) {
            state.v = w;
            state.w = u;
        } else if (u.value <= v.value || v.location === x.location || v.location === w.location) {
            state.v = u;
        }
    } else {
        if (u.location >= x.location) {
            state.a = x.location;
        }
        if (u.location < x.location) {
            state.b = x.location;
        }
        state.v = w;
        state.w = x;
        state.x = u;
    }
}

function fitParabola(state: BrentState, tolerance: number): [number, number] {
    if (Math.abs(state.e) <= tolerance) {
        return [0, 0];
    }
    const x = state.x;
    const v = state.v;
    const w = state.w;
    let p = 0;
    let q = 0;
    let r = 0;
    r = (x.location - w.location) * (x.value - v.value);
    q = (x.location - v.location) * (x.value - w.value);
    p = (x.location - v.location) * q - (x.location - w.location) * r;
    q = 2 * (q - r);
    if (q > 0) {
        p = -p;
    } else {
        q = -q;
    }
    return [p, q];
}
