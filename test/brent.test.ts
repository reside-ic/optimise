import { Brent, runBrent } from "../src/brent";

describe("finds a minimum", () => {
    it("finds easy min", () => {
        const parabola = (x: number) => x * x;
        expect(runBrent(parabola, -3, 3).location).toBeCloseTo(0);
        expect(runBrent(parabola, -10, 3).location).toBeCloseTo(0);
        expect(runBrent(parabola, 0, 3).location).toBeCloseTo(0);
    });

    it("finds harder min", () => {
        const fn = (x: number) => -(x + Math.sin(x)) * Math.exp(-x * x);
        expect(runBrent(fn, -10, 10).location).toBeCloseTo(0.6795786640979207);
    });

    it("can fail to converge", () => {
        const parabola = (x: number) => x * x;
        const result = runBrent(parabola, -2, 2, 1e-6, 3);
        expect(result.converged).toBe(false);
    });
});

describe("lower-level interface provides more control", () => {
    it("can be constructed", () => {
        const parabola = (x: number) => x * x;
        const solver = new Brent(parabola, -3, 3);
        expect(solver.result().converged).toBe(false);
        expect(solver.run(3).converged).toBe(false);
        expect(solver.run().converged).toBe(true);
        const res = solver.result();
        expect(res.location).toBeCloseTo(0);
        expect(res.value).toBeCloseTo(0);
    });
});

describe("can accumulate additional information", () => {
    // Same example as the simplex case but just optimising the slope
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [0.54, 1.25, 1.44, 2.23, 2.59, 2.76, 3.41, 3.61, 4.32, 4.86];
    function target(m: number) {
        let value = 0;
        for (let i = 0; i < x.length; ++i) {
            value += (m * x[i] - y[i]) ** 2;
        }
        const data = (z: number[]) => z.map((el: number) => m * el);
        return {data, value};
    }

    const res = new Brent(target, 0, 10);
    const ans = res.run(100);
    expect(ans.converged).toBe(true);
    expect(ans.location).toBeCloseTo(0.483168831168832);
    expect(ans.data(x)).toEqual(
        x.map((el: number) => ans.location * el));
});
