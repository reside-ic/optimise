## Derivative-free optimisation in javascript

[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)
[![build status](https://github.com/reside-ic/dfoptim/workflows/ci/badge.svg)](https://github.com/reside-ic/dfoptim/actions)
[![codecov.io](https://codecov.io/github/reside-ic/dfoptim/coverage.svg?branch=master)](https://codecov.io/github/reside-ic/dfoptim?branch=master)

Very simple optimisation, using the [Simplex (Nelder-Mead) method](https://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method)

We provide two interfaces. In the first, you can dfoptim a function in a single go:

```
const point = dfoptim.fitSimplex(target, start, control, maxIterations);
```

which will look for the minimum of the vector-valued function `target`, starting from location `start`. The `control` object is described below and affects how the optimisation initialises and terminates, and the `maxIterations` is a per-dimension number of iterations (e.g., for a problem with 10 dimensions we will take at most `10 * maxIterations` steps before giving up).

The return value will be an object with fields:

* `converged`: indicates if we have successfully converged (bool)
* `data`: see below
* `evaluations`: the number of times that `target` was called
* `iterations`: the number of iterations of the algorithm (always greater than `evaluations`)
* `location`: the best location (input to `target`)
* `value`: the value of the target function at `location`

Running the optimisation may take a while, and no information can be retrieved while it runs, so we also provide a more stateful interface. The function above can be implemented as:

```
const opt = new dfoptim.Simplex(target, start)
while (true) {
  if (opt.step()) {
    break;
  }
}
const point = opt.result();
```

Where

* `opt` is our optimiser. At this point, it has done basic set up (creating the first simplex) but not taken any steps
* The `step()` method advances the algorithm one step, which will take one or two evaluations of the target function and may or may not find a better point than our current best. It returns `true` if we have converged.
* The `result()` method returns the object described above.

Sometimes, it is useful to get additional information out of the target function and store it alongside the solution. For example, if fitting a model to data you might end up with a sum-of-squares error used for target fitting, but the model values themselves are of interest. For linear regression (which you would fit with a different packge!) we might do this by returning a closure that could be evaluated at any `x` position:

```
function target(theta) {
    const c = theta[0]; // intercept
    const m = theta[1]; // slope
    var tot = 0;
    for (var i = 0; i < x.length; ++i) {
        tot += (c + m * x[i] - y[i])**2;
    }
    return {value: tot, data: (x) => x.map(el => c + m * el)};
}
```

This can be passed through to `fitSimplex` or `Simplex` above, and the `data` element of the result will contain the predictor function at the best point.

There are a few control parameters that can be passed via an object as the third argument to `fitSimplex` or `Simplex`

* `deltaNonZero`: a multiplicatative scaling factor for non-zero initial parameter points (displacing `x` to `x * (1 + deltaNonZero)`)
* `deltaZero`: an additive for zero initial points (replacing `x` of zero with `deltaZero`)
* `tolerance`: A small number, indicating the "tolerance" of the algorithm - the smaller this is the more we try and refine the solution. We stop when the difference between the and worst point in the simplex is smaller than this value (absolutely or relatively) **and** where the largest size of any axis of the simplex drops below this value.

## Example

Run

```
npm run build
npm run example
```

Then open `example/index.html` for a simple example.

## Licence

MIT © Imperial College of Science, Technology and Medicine

Please note that this project is released with a [Contributor Code of Conduct](CONDUCT.md). By participating in this project you agree to abide by its terms.
