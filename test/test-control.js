"use strict";
var expect = require("chai").expect;
var control = require("../lib/control.js");

describe("control parameters", () => {
    it("has sensible defaults", () => {
        var x = control.simplexControl();
        expect(x.maxIterations).to.eql(200);
        expect(x.nonZeroDelta).to.eql(0.05);
        expect(x.zeroDelta).to.eql(0.001);
        expect(x.minErrorDelta).to.eql(0.000001);
        expect(x.minTolerance).to.eql(0.00001);
        expect(x.rho).to.eql(1);
        expect(x.chi).to.eql(2);
        expect(x.psi).to.eql(-0.5);
        expect(x.sigma).to.eql(0.5);
    });

    it("accepts one new parameter", () => {
        var x = control.simplexControl({maxIterations: 20});
        expect(x.maxIterations).to.eql(20);
        expect(x.rho).to.eql(1);
    });


    it("accepts several parameters", () => {
        var x = control.simplexControl({maxIterations: 20,
                                        minTolerance: 0.001});
        expect(x.maxIterations).to.eql(20);
        expect(x.minTolerance).to.eql(0.001);
    });
});
