import {simplexControl, SimplexControlParam} from "./control";
import {checkResult, Point, Result, TargetFn} from "./types";

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

export function fitSimplex(target: TargetFn, location: number[],
                           control: Partial<SimplexControlParam> = {},
                           maxIterations: number = 200) {
    const solver = new Simplex(target, location, control);
    return solver.run(maxIterations * location.length);
}

export class Simplex {
    // Standard simplex move control. We could put these in the control,
    // but it does not seem ideal to make them tuneable really; we can
    // always move them there later.
    public static readonly rho = 1;
    public static readonly chi = 2;
    public static readonly psi = -0.5;
    public static readonly sigma = 0.5;

    private _target: TargetFn;
    private _control: SimplexControlParam;
    private _simplex: Point[];
    private _n: number;

    private _iterations: number = 0;
    private _id: number = 0;
    private _converged: boolean = false;

    constructor(target: TargetFn, location: number[],
                control: Partial<SimplexControlParam> = {}) {
        this._target = target;
        this._control = simplexControl(control);
        this._n = location.length;

        this._simplex = [];
        this._simplex.push(this._point(location.slice()));
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

    // not really meant to be used that much, it's a bit basic
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

    public result() {
        const best = this._simplex[0];
        return {
            converged: this._converged,
            data: best.data,
            evaluations: this._id,
            iterations: this._iterations,
            location: best.location,
            value: best.value,
        };
    }

    public simplex() {
        return this._simplex.map(
            (el) => ({location: el.location, value: el.value}));
    }

    private _point(location: number[]): Point {
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

    private _update(other: Point) {
        this._simplex[this._n] = other;
        this._sort();
    }

    // Various "moves"
    private _reflect(point: Point, centroid: number[]) {
        return this._point(weightedSum(Simplex.rho, centroid, point.location));
    }

    private _expand(point: Point, centroid: number[]) {
        return this._point(weightedSum(Simplex.chi, centroid, point.location));
    }

    private _contractInside(point: Point, centroid: number[]) {
        return this._point(weightedSum(Simplex.psi, centroid, point.location));
    }

    private _contractOutside(point: Point, centroid: number[]) {
        return this._point(weightedSum(-Simplex.psi * Simplex.rho,
                                       centroid, point.location));
    }

    private _shrink(point: Point, best: number[]) {
        return this._point(weightedSum(-Simplex.sigma, best, point.location));
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
