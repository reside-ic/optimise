## Derivative-free optimisation in javascript

[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)
[![build-and-test](https://github.com/reside-ic/dfoptim/actions/workflows/ci.yml/badge.svg)](https://github.com/reside-ic/dfoptim/actions/workflows/ci.yml)
[![codecov.io](https://codecov.io/github/reside-ic/dfoptim/coverage.svg?branch=main)](https://codecov.io/github/reside-ic/dfoptim?branch=main)

Very simple optimisation, using the [Simplex (Nelder-Mead) method](https://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method)

We provide two interfaces. In the first, you can dfoptim a function in a single go:

```
const point = dfoptim.fitSimplex(target, start);
```

which will look for the minimum of the vector-valued function `target`, starting from location `start`.

Running the optimisation may take a while, and no information can be retrieved while it runs, so we also provide a more stateful interface. The function above can be implemented as:

```
const opt = new dfoptim.Simplex(target, start)
while (!opt.step()) {
  // do something
}
const point = opt.result();
```

Where

* `opt` is our optimiser. At this point, it has done basic set up (creating the first simplex) but not taken any steps
* The `step()` method advances the algorithm one step, which will take one or two evaluations of the target function and may or may not find a better point than our current best. It returns `true` if we have converged.
* The `result()` method returns information about the best point.

## Example

Run

```
npm run build
npm run webpack
```

Then open `example/index.html` for a simple example.

## Licence

MIT © Imperial College of Science, Technology and Medicine

Please note that this project is released with a [Contributor Code of Conduct](CONDUCT.md). By participating in this project you agree to abide by its terms.
