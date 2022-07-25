import {simplexControl, SimplexControlParam} from "./control";
import {checkResult, Point, Result, TargetFn} from "./types";
import {protect} from "./utils";

function weightedSum(w: number, v1: number[], v2: number[]) {
    const n = v1.length;
    const ret = new Array(n);
    const w1 = 1 + w;
    const w2 = -w;
    for (let j = 0; j < ret.length; ++j) {
        ret[j] = w1 * v1[j] + w2 * v2[j];
    }
    return ret;
}

/**
 * Run the Simplex algorithm on a target function. This is a
 * convenience function and offers little control but a compact
 * interface. For more control, use {@link Simplex} directly.
 *
 * @param target The function to be minimised
 *
 * @param location The initial location to start the search from
 *
 * @param control Control parameters, as an object
 *
 * @param maxIterations The maximum number of iterations, per
 * dimension, of the algorithm (calls to {@link Simplex.step |
 * `Simplex.step()`}) to take. For example, if you pass `maxIterations`
 * of 200 and are solving a problem where `location.length` is 5,
 * you'll take a maximum of 1000 steps in total. If we converge before
 * hitting this number we will return early.
 *
 * @returns See {@link Simplex.result | `Simplex.result`} for details
 */
export function fitSimplex(target: TargetFn, location: number[],
                           control: Partial<SimplexControlParam> = {},
                           maxIterations: number = 200) {
    const solver = new Simplex(target, location, control);
    return solver.run(maxIterations * location.length);
}

/**
 * Start, improve and interrogate an optimisation. Unlike
 * {@link fitSimplex}, which does this in a single step, the `Simplex`
 * class creates mutable state representing a (potentially)
 * partially-completed optimisation process, which you are then
 * responsible for pushing around in a loop. This means that if the
 * optimisation is slow and you want to make it cancelleable, or if
 * you want to report back anything about the progress of the
 * optimsiation, you are free to do so as you'll only ever hit a
 * method here for as long as it takes to call your `target` function
 * a few times.
 *
 * @example
 * ```typescript
 * var banana = function(x: number, y: number, a: number, b: number) {
 *   return (a - x)**2 + b * (y - x * x)**2;
 * };
 * var obj = Simplex(
 *             (loc: number[]) => banana(loc[0], loc[1], 1, 100),
 *             [-2, -2]);
 * obj.result();
 * obj.step();
 * obj.run(10);
 * ```
 */
export class Simplex {
    // Standard simplex move control. We could put these in the control,
    // but it does not seem ideal to make them tuneable really; we can
    // always move them there later.
    private readonly rho = 1;
    private readonly chi = 2;
    private readonly psi = -0.5;
    private readonly sigma = 0.5;

    private _target: TargetFn;
    private _control: SimplexControlParam;
    private _simplex: Array<Point<number[]>>;
    private _n: number;

    private _iterations: number = 0;
    private _id: number = 0;
    private _converged: boolean = false;

    /**
     * @param target The function to be minimised
     *
     * @param location The initial location to start the search from
     *
     * @param control Control parameters, as an object
     */
    constructor(target: TargetFn, location: number[],
                control: Partial<SimplexControlParam> = {}) {
        this._target = target;
        this._control = simplexControl(control);
        this._n = location.length;

        this._simplex = [];
        this._simplex.push(this._point(location.slice()));

        // Now that the first point has been run without error we can
        // cope with any failure in the target function, if wanted:
        if (!control.errorOnFailure) {
            this._target = protect(target);
        }
        for (let i = 0; i < this._n; ++i) {
            const p = location.slice();
            if (p[i]) {
                p[i] *= (1 + this._control.deltaNonZero);
            } else {
                p[i] = this._control.deltaZero;
            }
            this._simplex.push(this._point(p));
        }
        this._sort();
    }

    /**
     * Advance the optimiser one "step" of the algorithm. This will
     * usually evaluate `target` once or twice, depending on if
     * proposal finds an improved point or not.
     *
     * @return `true` if the algorithm has converged, `false`
     * otherwise. For details about the best point so far, see
     * {@link Simplex.result}
     */
    public step() {
        this._iterations++;
        if (this._isConverged()) {
            this._converged = true;
            return true;
        }

        const n = this._n;
        const best = this._simplex[0];
        const worst = this._simplex[n];
        const centroid = this._centroid();

        // reflect the worst point past the centroid
        const reflected = this._reflect(worst, centroid);

        if (reflected.value < best.value) {
            // if the reflected point is the best seen, then possibly
            // expand
            const expanded = this._expand(worst, centroid);
            this._update(expanded.value < reflected.value ?
                         expanded : reflected);
        } else if (reflected.value >= this._simplex[n - 1].value) {
            // if the reflected point is worse than the second worst,
            // we need to contract
            const contracted = reflected.value > worst.value ?
                  this._contractInside(worst, centroid) :
                  this._contractOutside(worst, centroid);

            if (contracted.value < worst.value) {
                this._update(contracted);
            } else {
                // NOTE: this is very hard to trigger, requiring
                // specific features of the target function.
                for (let i = 1; i <= n; ++i) {
                    this._simplex[i] = this._shrink(this._simplex[i],
                                                    best.location);
                }
                this._sort();
            }
        } else {
            this._update(reflected);
        }

        return false;
    }

    /**
     * Helper function to run the algorithm until converged. This is
     * very basic and not really intended to be used - you should
     * probably build logic around {@link Simplex.step} directly, or if
     * you want a simple interface use the {@link fitSimplex} function.
     *
     * @param maxIterations The maximum number of iterations of the
     * algorithm (calls to {@link Simplex.step} to take. If we converge
     * before hitting this number we will return early.
     *
     * @return The same object as {@link Simplex.result}. Note that the
     * algorithm may not have converged, so you should check the
     * `.converged` field.
     */
    public run(maxIterations: number) {
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
        const best = this._simplex[0];
        return {
            /** Has the algorithm converged? */
            converged: this._converged,
            /** Any additional data returned by the target function,
             *  for this point
             */
            data: best.data,
            /** The number of times that `target` has been called so far */
            evaluations: this._id,
            /** The number of times that {@link Simplex.step} has been
             *  called so far
             */
            iterations: this._iterations,
            /** The best found location */
            location: best.location,
            /** The value of `target(location)` */
            value: best.value,
        };
    }

    /**
     * Returns an array of the points that make up the Simplex. This
     * is primarily provided for visualisation or debugging, but it
     * could also be used to derive alternative early exit criteria.
     *
     * @return An array of objects, sorted from best to worst. Each
     * object has fields `location` and `value`.
     */
    public simplex() {
        return this._simplex.map(
            (el) => ({location: el.location, value: el.value}));
    }

    private _point(location: number[]): Point<number[]> {
        const result = checkResult(this._target(location));
        return {
            data: result.data,
            id: this._id++,
            location,
            value: result.value,
        };
    }

    private _sort() {
        this._simplex.sort((a, b) => a.value - b.value);
    }

    private _centroid() {
        const n = this._n;
        const ret = new Array(n);
        for (let i = 0; i < n; ++i) {
            ret[i] = 0;
            for (let j = 0; j < n; ++j) {
                ret[i] += this._simplex[j].location[i];
            }
            ret[i] /= n;
        }
        return ret;
    }

    private _update(other: Point<number[]>) {
        this._simplex[this._n] = other;
        this._sort();
    }

    // Various "moves"
    private _reflect(point: Point<number[]>, centroid: number[]) {
        return this._point(weightedSum(this.rho, centroid, point.location));
    }

    private _expand(point: Point<number[]>, centroid: number[]) {
        return this._point(weightedSum(this.chi, centroid, point.location));
    }

    private _contractInside(point: Point<number[]>, centroid: number[]) {
        return this._point(weightedSum(this.psi, centroid, point.location));
    }

    private _contractOutside(point: Point<number[]>, centroid: number[]) {
        return this._point(weightedSum(-this.psi * this.rho,
                                       centroid, point.location));
    }

    private _shrink(point: Point<number[]>, best: number[]) {
        return this._point(weightedSum(-this.sigma, best, point.location));
    }

    private _isConverged() {
        const tolerance = this._control.tolerance;
        const best = this._simplex[0];
        const worst = this._simplex[this._n];
        const objectiveSame = worst.value - best.value < tolerance ||
            1 - best.value / worst.value < tolerance;

        let maxDiff = 0.0;
        for (let i = 0; i < this._n; ++i) {
            maxDiff = Math.max(maxDiff,
                               Math.abs(best.location[i] - worst.location[i]));
        }

        const hasShrunk = maxDiff < tolerance;
        return hasShrunk && objectiveSame;
    }
}
