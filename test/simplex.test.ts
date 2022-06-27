import {fitSimplex, Simplex} from "../src/simplex";
import {simplexControl} from "../src/control";

describe("optimise simple problem", () => {
    // multivariate quadratic
    var target = (x: number[]) => x.map(
        (xi: number) => xi * xi).reduce((a: number, b: number) => a + b, 0);

    it("can construct a new optimiser", () => {
        var obj = new Simplex(target, [2, 4]);
        var res = obj.result();
        expect(res.location).toEqual([2, 4]);
        expect(res.value).toBeCloseTo(20);
        expect(res.iterations).toBeCloseTo(0);
        expect(res.evaluations).toBeCloseTo(3);
        expect(res.converged).toBe(false);
    });

    it("can find simple minimum", () => {
        var obj = new Simplex(target, [2, 4]);
        var res = obj.run(100);
        expect(res.converged).toBe(true);
        expect(res.value).toBeGreaterThanOrEqual(0);
        expect(res.value).toBeLessThanOrEqual(1e-5);
    });
});

describe("configure initial simplex", () => {
    var target = (x: number[]) => x.map(
        (xi: number) => xi * xi).reduce((a: number, b: number) => a + b, 0);

    it("starting points away from zero are scaled", () => {
        var ctl = simplexControl({deltaNonZero: 0.5});
        var obj = new Simplex(target, [2, 4], ctl);
        const points = obj.simplex();
        // TODO:
        expect(points[0].location).toEqual([2, 4]);
        expect(points[1].location).toEqual([3, 4]);
        expect(points[2].location).toEqual([2, 6]);
    });

    it("starting points at zero are scaled", () => {
        var ctl = simplexControl({deltaNonZero: 0.5, deltaZero: 0.1});
        var obj = new Simplex(target, [0, 2], ctl);
        const points = obj.simplex();
        expect(points[0].location).toEqual([0, 2]);
        expect(points[1].location).toEqual([0.1, 2]);
        expect(points[2].location).toEqual([0, 3]);
    });
})

describe("high level interface", () => {
    var banana = function(x: number, y: number, a: number, b: number) {
        return (a - x)**2 + b * (y - x * x)**2;
    }
    var target = (x: number[]) => banana(x[0], x[1], 1, 100);
    var ctl = simplexControl({deltaNonZero: 0.5, tolerance: 1e-3});

    var res = fitSimplex(target, [-1.5, 1], ctl, 1000);
    expect(res.converged).toBe(true);
    expect(res.value).toBeLessThanOrEqual(1e-3);
});

describe("can accumulate additional information", () => {
    // Basic least squared regression, returning prediction function.
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [1.46, 1.23, 1.94, 2.64, 3.03, 3.15, 4.46, 4.82, 5.44, 5.98];
    function target(theta: number[]) {
        const c = theta[0]; // intercept
        const m = theta[1]; // slope
        var tot = 0;
        for (var i = 0; i < x.length; ++i) {
            tot += (c + m * x[i] - y[i])**2;
        }
        return {value: tot, data: (x: number[]) => x.map(
            (el: number) => c + m * el)};
    }

    var res = new Simplex(target, [1, 1]);
    var ans = res.run(100);
    expect(ans.location[0]).toBeCloseTo(0.4106600527809162);
    expect(ans.location[1]).toBeCloseTo(0.5462435359499496);
    expect(ans.data(x)).toEqual(
        x.map((el: number) => ans.location[0] + ans.location[1] * el));
})

describe("can cope with errors thrown in the target function", () => {
    const target = (theta: number[]) => {
        if (Math.min(...theta) < 0) {
            throw Error("Negative values not allowed");
        }
        return theta.map((x: number) => x * x)
            .reduce((a: number, b:number) => a + b, 0);
    }

    it("minimises correctly, even with errors", () => {
        const obj = new Simplex(target, [2, 4]);
        const result = obj.run(100);
        expect(result.converged).toBe(true);
        expect(result.value).toBeCloseTo(0);
    });

    it("throws if control does not prevent it", () => {
        const obj = new Simplex(target, [2, 4], {errorOnFailure: true});
        expect(() => obj.run(100)).toThrow("Negative values not allowed");
    });

    it("throws if starting value not valid, regardless of control", () => {
        expect(() => new Simplex(target, [2, -4], {errorOnFailure: false}))
            .toThrow("Negative values not allowed");
    });
});
