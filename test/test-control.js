"use strict";
var expect = require("chai").expect;
var control = require("../lib/control.js");

describe("control parameters", () => {
    it("has sensible defaults", () => {
        var x = control.simplexControl();
        expect(x.deltaNonZero).to.eql(0.05);
        expect(x.deltaZero).to.eql(0.001);
        expect(x.tolerance).to.eql(0.00001);
    });

    it("accepts one new parameter", () => {
        var x = control.simplexControl({deltaNonZero: 0.005});
        expect(x.deltaNonZero).to.eql(0.005);
        expect(x.deltaZero).to.eql(0.001);
    });

    it("accepts several parameters", () => {
        var x = control.simplexControl({deltaNonZero: 0.005,
                                        deltaZero: 0.01});
        expect(x.deltaNonZero).to.eql(0.005);
        expect(x.deltaZero).to.eql(0.01);
    });

    it("validates control parameters", () => {
        expect(() => {control.simplexControl({tolerance: -0.01});}).
            to.throw("'tolerance' must be strictly positive");
    });
});
