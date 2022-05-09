"use strict";

var expect = require("chai").expect;
var simplex = require("../lib/simplex.js");
var control = require("../lib/control.js");

describe("optimise simple problem", () => {
    // multivariate quadratic
    var target = (x) => x.map(x => x * x).reduce((a, b) => a + b, 0);

    it("can construct a new optimiser", () => {
        var obj = new simplex.Simplex(target, [2, 4]);
        var res = obj.result();
        expect(res.x).to.eql([2, 4]);
        expect(res.fx).to.eql(20);
        expect(res.iterations).to.eql(0);
        expect(res.evaluations).to.eql(3);
        expect(res.converged).to.be.false;
    });

    it("can find simple minimum", () => {
        var obj = new simplex.Simplex(target, [2, 4]);
        var res = obj.run(100);
        expect(res.converged).to.be.true;
        expect(res.fx).to.be.at.least(0);
        expect(res.fx).to.be.at.most(1e-5);
    });
});

describe("configure initial simplex", () => {
    var target = (x) => x.map(x => x * x).reduce((a, b) => a + b, 0);

    it("starting points away from zero are scaled", () => {
        var ctl = control.simplexControl({deltaNonZero: 0.5});
        var obj = new simplex.Simplex(target, [2, 4], ctl);
        expect(obj._simplex[0].x).to.eql([2, 4]);
        expect(obj._simplex[1].x).to.eql([3, 4]);
        expect(obj._simplex[2].x).to.eql([2, 6]);
    });

    it("starting points at zero are scaled", () => {
        var ctl = control.simplexControl({deltaNonZero: 0.5, deltaZero: 0.1});
        var obj = new simplex.Simplex(target, [0, 2], ctl);
        expect(obj._simplex[0].x).to.eql([0, 2]);
        expect(obj._simplex[1].x).to.eql([0.1, 2]);
        expect(obj._simplex[2].x).to.eql([0, 3]);
    });
})

describe("high level interface", () => {
    var banana = function(x, y, a, b) {
        return (a - x)**2 + b * (y - x * x)**2;
    }
    var target = (x) => banana(x[0], x[1], 1, 100);
    var ctl = control.simplexControl({deltaNonZero: 0.5, tolerance: 1e-3});
    var res = new simplex.simplex(target, [-1.5, 1], ctl, 1000);
    expect(res.converged).to.be.true;
    expect(res.fx).to.be.at.most(1e-3);
});
