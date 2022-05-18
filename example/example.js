// Slow things down a little!
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function showSimplex(id, obj) {
    var points = obj.simplex().map(el => el.location);
    var path = "M " + points.map(el => el.join(" ")).join(" L ") + " Z";
    var layout = {shapes: [{type: "path", path: path}]};
    Plotly.relayout(id, layout);
}

async function runFit(idInputs, idPlot, target, delayMs) {
    const inputs = idInputs.map(el => document.getElementById(el));
    var location = inputs.map(el => parseFloat(el.value));
    var obj = new dfoptim.Simplex(target, location, {});

    for (;;) {
        obj.step();
        showSimplex(idPlot, obj);
        var res = obj.result();
        for (var i = 0; i < inputs.length; ++i) {
            inputs[i].value = res.location[i];
        }
        if (res.converged) {
            break;
        }
        await delay(delayMs);
    }
}

function setup(target, xr, yr, scale) {
    function seq(from, to, n) {
        ret = new Array(n);
        delta = (to - from) / (n - 1);
        for (var i = 0; i < n - 1; ++i) {
            ret[i] = from + delta * i;
        }
        ret[n - 1] = to;
        return ret;
    }

    function outer(x, y, target) {
        const nx = x.length;
        const ny = x.length;
        var z = new Array(nx);
        for (var i = 0; i < nx; ++i) {
            z[i] = new Array(ny);
            for (var j = 0; j < ny; ++j) {
                z[i][j] = target(x[i], y[j]);
            }
        }
        return z;
    }
    var x = seq(xr[0], xr[1], xr[2]);
    var y = seq(yr[0], yr[1], yr[2]);
    var z = outer(x, y, (y, x) => scale(target([x, y])));
    return [
        {
            z: z,
            x: x,
            y: y,
            type: "contour"
        }
    ];
}

// Below here would depend on application
function banana(x, y, a, b) {
    return (a - x)**2 + b * (y - x * x)**2;
}

var target = (x) => banana(x[0], x[1], 1, 100);
var data = setup(target, [-2, 2, 301], [-2, 2, 301],
                 (x) => Math.log(x + 0.5));
Plotly.newPlot("myDiv", data);

async function fitTarget() {
    await runFit(["x", "y"], "myDiv", target, 100);
}
