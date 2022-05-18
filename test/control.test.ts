import {simplexControl} from "../src/control";

describe("control parameters", () => {
    it("has sensible defaults", () => {
        var x = simplexControl();
        expect(x.deltaNonZero).toBeCloseTo(0.05);
        expect(x.deltaZero).toBeCloseTo(0.001);
        expect(x.tolerance).toBeCloseTo(0.00001);
    });

    it("accepts one new parameter", () => {
        var x = simplexControl({deltaNonZero: 0.005});
        expect(x.deltaNonZero).toBeCloseTo(0.005);
        expect(x.deltaZero).toBeCloseTo(0.001);
    });

    it("accepts several parameters", () => {
        var x = simplexControl({deltaNonZero: 0.005,
                                        deltaZero: 0.01});
        expect(x.deltaNonZero).toBeCloseTo(0.005);
        expect(x.deltaZero).toBeCloseTo(0.01);
    });

    it("validates control parameters", () => {
        expect(() => {simplexControl({tolerance: -0.01});}).
            toThrow("'tolerance' must be strictly positive");
    });
});
