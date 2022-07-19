import { checkResult, Result } from "./types";

// Here's a 1-shot version to try and tidy up once we get some tests
// sorted out for it.
export type TargetFn1 = (x: number) => number;

export interface Point1 {
    readonly data: any;
    readonly location: number;
    readonly value: number;
}

export class Brent {
    private readonly _target: TargetFn1;
    private readonly _tolerance: number;
    private readonly _state: BrentState;
    private _converged: boolean = false;

    constructor(target: TargetFn1, lower: number, upper: number,
                tolerance: number = 1e-6) {
        this._target = target;
        this._tolerance = tolerance;
        const m = lower + squaredInverseGoldenRatio * (upper - lower);
        const x = this._point(m);
        const w: Point1 = { ...x };
        const v: Point1 = { ...x };
        this._state = {a: lower, b: upper, v, w, x, d: 0, e: 0};
    }

    public step() {
        this._converged = brentStep(this._target, this._tolerance, this._state);
        return this._converged;
    }

    public run() {
        if (!this._converged) {
            while (!this.step()) {
            }
        }
    }

    private _point(location: number): Point1 {
        const result = checkResult(this._target(location));
        return {
            data: result.data,
            location,
            value: result.value,
        };
    }
}

function point(location: number, target: TargetFn1): Point1 {
    const result = checkResult(target(location));
    return {
        data: result.data,
        location,
        value: result.value,
    };
}

/**
 * See p 73
 *
 * We track a set of points on the domain [a, b, u, v, w, x], not all
 * distinct.
 *
 * * Initially (`a`, `b`) is the domain of `target` where we will search
 *   for the minimum.
 * * `x` is the point visited with the lowest value of `target`
 * * `w` is the second lowest visited value of `target`
 * * `v` is the previous value of `w`
 * * `fx`, `fw` and `fv` are the values of `target` evaluated at `x`, `w`
 *   and `v` respectively.
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
    /** Best value of `x` */
    x: Point1,

    /** Previous value of 'e' */
    d: number;
    /** The value of `p/q` (from the parabola fit) at the second-last
     * cycle, used to determine if the parabola fit should be used or
     * not. Initially zero
     */
    e: number;

}

// https://www.netlib.org/fmm/fmin.f
// https://maths-people.anu.edu.au/~brent/pd/rpb011i.pdf, p 79-80
export function brent(target: TargetFn1, lower: number, upper: number,
                      tolerance: number = 1e-6): Point1 {
    const m = lower + squaredInverseGoldenRatio * (upper - lower);
    const x = point(m, target);
    const w: Point1 = { ...x };
    const v: Point1 = { ...x };
    const state: BrentState = {a: lower, b: upper, v, w, x, d: 0, e: 0};

    while (brentStep(target, tolerance, state)) {
    }

    return state.x;
}

const sqrtMachineEps = Math.sqrt(Number.EPSILON);

function brentStep(target: TargetFn1, tolerance: number, state: BrentState) {
    const xm = (state.a + state.b) / 2;
    const x = state.x;

    const tol1 = sqrtMachineEps * Math.abs(x.location) + tolerance / 3.0;
    const tol2 = 2.0 * tol1;

    // Test to see if we've converged (could move this out of here?)
    if (Math.abs(x.location - xm) <= (tol2 - 0.5 * (state.b - state.a))) {
        return false;
    }

    // Fit parabola
    const [p, q] = fitParabola(state, tol1);

    const useGoldenRatio =
        Math.abs(p) >= Math.abs(q * 0.5 * state.e) ||
        p <= q * (state.a - x.location) ||
        p >= q * (state.b - x.location);

    if (useGoldenRatio) {
        if (x.location < xm) {
            state.e = state.b - x.location;
        } else {
            state.e = state.a - x.location;
        }
        state.d = squaredInverseGoldenRatio * state.e;
    } else {
        // Parabolic interpolation
        state.e = state.d;
        state.d = p / q;
        const u = x.location + state.d; // candidate u for below
        // f must not be evaluated too close to ax or bx
        if (u - state.a < tol2 || state.b - u < tol2) {
            state.d = x.location < xm ? tol1 : -tol1;
        }
    }

    // f must not be evaluated too close to x
    const d = Math.abs(state.d) >= tol1 ? state.d : copysign(tol1, state.d);
    const u = point(x.location + d, target);

    // update  a, b, v, w, and x
    updateState(u, state);
    return true;
}

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
        return [0, 0]
    }
    const x = state.x;
    const v = state.v;
    const w = state.w;
    // Fit parabola
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
        q = -q; // not in fmin?
    }
    return [p, q];
}

// https://gcc.gnu.org/onlinedocs/gfortran/SIGN.html
function copysign(a: number, b: number) {
    return Math.sign(b) * a;
}

// Squared inverse of the golden ratio
const squaredInverseGoldenRatio = 0.5 * (3 - Math.sqrt(5));
