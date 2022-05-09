import {simplexControl, SimplexControlParam} from "./control";
import {Point, TargetFn} from "./types";

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

export function simplex(target: TargetFn, x: number[],
                        control: Partial<SimplexControlParam> = {},
                        maxIterations: number = 200) {
    const solver = new Simplex(target, x, control);
    return solver.run(maxIterations * x.length);
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

    constructor(target: TargetFn, x: number[],
                control: Partial<SimplexControlParam> = {}) {
        this._target = target;
        this._control = simplexControl(control);
        this._n = x.length;

        this._simplex = [];
        this._simplex.push(this._point(x.slice()));
        for (let i = 0; i < this._n; ++i) {
            const p = x.slice();
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

        if (reflected.fx < best.fx) {
            // if the reflected point is the best seen, then possibly
            // expand
            const expanded = this._expand(worst, centroid);
            this._update(expanded.fx < reflected.fx ? expanded : reflected);
        } else if (reflected.fx >= this._simplex[n - 1].fx) {
            // if the reflected point is worse than the second worst,
            // we need to contract
            const contracted = reflected.fx > worst.fx ?
                  this._contractInside(worst, centroid) :
                  this._contractOutside(worst, centroid);

            if (contracted.fx < worst.fx) {
                this._update(contracted);
            } else {
                // if we don't contract here, we're done
                if (Simplex.sigma >= 1) {
                    this._converged = true;
                    return true;
                }
                // otherwise, do a reduction (all points towards best)
                for (let i = 1; i <= n; ++i) {
                    this._simplex[i] = this._reduce(this._simplex[i], best.x);
                }
                this._sort();
            }
        } else {
            this._update(reflected);
        }

        return false;
    }

    // not really meant to be used that much, it's a bit stupid
    public run(maxIterations: number) {
        if (!this._converged) {
            for (let i = 0; i < maxIterations; ++i) {
                // const p = this._simplex[0];
                // console.log(`${i}: ${p.x} => ${p.fx}`);
                if (this.step()) {
                    break;
                }
            }
        }
        return this.result();
    }

    public result() {
        return {x: this._simplex[0].x,
                fx: this._simplex[0].fx,
                iterations: this._iterations,
                evaluations: this._id,
                converged: this._converged};
    }

    private _point(x: number[]): Point {
        const fx = this._target(x);
        return {x, fx, id: this._id++};
    }

    private _sort() {
        this._simplex.sort((a, b) => a.fx - b.fx);
    }

    private _centroid() {
        const n = this._n;
        const ret = new Array(n);
        for (let i = 0; i < n; ++i) {
            ret[i] = 0;
            for (let j = 0; j < n; ++j) {
                ret[i] += this._simplex[j].x[i];
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
    private _reflect(x: Point, centroid: number[]) {
        return this._point(weightedSum(Simplex.rho, centroid, x.x));
    }

    private _expand(x: Point, centroid: number[]) {
        return this._point(weightedSum(Simplex.chi, centroid, x.x));
    }

    private _contractInside(x: Point, centroid: number[]) {
        return this._point(weightedSum(Simplex.psi, centroid, x.x));
    }

    private _contractOutside(x: Point, centroid: number[]) {
        return this._point(weightedSum(-Simplex.psi * Simplex.rho,
                                       centroid, x.x));
    }

    private _reduce(x: Point, best: number[]) {
        return this._point(weightedSum(-Simplex.sigma, best, x.x));
    }

    private _isConverged() {
        const s = this._simplex;
        const ctl = this._control;
        let maxDiff = 0.0;
        for (let i = 0; i < this._n; ++i) {
            maxDiff = Math.max(maxDiff, Math.abs(s[0].x[i] - s[1].x[i]));
        }

        const a = (Math.abs(s[0].fx - s[this._n].fx) < ctl.minErrorDelta);
        const b = maxDiff < ctl.minTolerance;
        return a && b;
    }
}
