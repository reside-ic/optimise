"use strict";

var expect = require("chai").expect;
var simplex = require("../lib/simplex.js");
var control = require("../lib/control.js");

describe("optimise simple problem", () => {
    // multivariate quadratic
    var target = x => x.map(x => x * x).reduce((a, b) => a + b, 0);

    it("can construct a new optimiser", () => {
        var obj = new simplex.Simplex(target, [2, 4]);
        var res = obj.result();
        expect(res.location).to.eql([2, 4]);
        expect(res.value).to.eql(20);
        expect(res.iterations).to.eql(0);
        expect(res.evaluations).to.eql(3);
        expect(res.converged).to.be.false;
    });

    it("can find simple minimum", () => {
        var obj = new simplex.Simplex(target, [2, 4]);
        var res = obj.run(100);
        expect(res.converged).to.be.true;
        expect(res.value).to.be.at.least(0);
        expect(res.value).to.be.at.most(1e-5);
    });
});

describe("configure initial simplex", () => {
    var target = x => x.map(x => x * x).reduce((a, b) => a + b, 0);

    it("starting points away from zero are scaled", () => {
        var ctl = control.simplexControl({deltaNonZero: 0.5});
        var obj = new simplex.Simplex(target, [2, 4], ctl);
        const points = obj.simplex();
        expect(points[0].location).to.eql([2, 4]);
        expect(points[1].location).to.eql([3, 4]);
        expect(points[2].location).to.eql([2, 6]);
    });

    it("starting points at zero are scaled", () => {
        var ctl = control.simplexControl({deltaNonZero: 0.5, deltaZero: 0.1});
        var obj = new simplex.Simplex(target, [0, 2], ctl);
        const points = obj.simplex();
        expect(points[0].location).to.eql([0, 2]);
        expect(points[1].location).to.eql([0.1, 2]);
        expect(points[2].location).to.eql([0, 3]);
    });
})

describe("high level interface", () => {
    var banana = function(x, y, a, b) {
        return (a - x)**2 + b * (y - x * x)**2;
    }
    var target = x => banana(x[0], x[1], 1, 100);
    var ctl = control.simplexControl({deltaNonZero: 0.5, tolerance: 1e-3});

    var res = simplex.simplex(target, [-1.5, 1], ctl, 1000);
    expect(res.converged).to.be.true;
    expect(res.value).to.be.at.most(1e-3);
});

describe("can accumulate additional information", () => {
    // Basic least squared regression, returning prediction function.
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [1.46, 1.23, 1.94, 2.64, 3.03, 3.15, 4.46, 4.82, 5.44, 5.98];
    function target(theta) {
        const c = theta[0]; // intercept
        const m = theta[1]; // slope
        var tot = 0;
        for (var i = 0; i < x.length; ++i) {
            tot += (c + m * x[i] - y[i])**2;
        }
        return {value: tot, data: x => x.map(el => c + m * el)};
    }

    var res = new simplex.Simplex(target, [1, 1]);
    var ans = res.run(100);
    expect(ans.location[0]).to.eql(0.4106600527809162);
    expect(ans.location[1]).to.eql(0.5462435359499496);
    expect(ans.data(x)).eql(
        x.map(el => ans.location[0] + ans.location[1] * el));
})
