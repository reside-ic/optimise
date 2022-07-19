import { brent } from "../src/brent";

describe("finds a minimum", () => {
    it("uses same points as R code", () => {
        const parabola = (x: number) => {
            console.log(x);
            return x * x;
        }

        brent(parabola, -2, 2, 0.0001220703125);
    });

    it("finds easy min", () => {
        const parabola = (x: number) => x * x;
        expect(brent(parabola, -3, 3).location).toBeCloseTo(0);
        expect(brent(parabola, -10, 3).location).toBeCloseTo(0);
        expect(brent(parabola, 0, 3).location).toBeCloseTo(0);
    });

    it("finds harder min", () => {
        const fn = (x: number) => -(x + Math.sin(x)) * Math.exp(-x * x);
        expect(brent(fn, -10, 10).location).toBeCloseTo(0.6795786640979207);
    });
})
