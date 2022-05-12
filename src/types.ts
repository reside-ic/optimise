export interface Result {
    data: any;  // any additional value returned by the target function
    fx: number; // the objective that we are minimising
}

export interface Point {
    data: any;
    x: number[];
    fx: number;
    id: number;
}

export type TargetFn = (x: number[]) => Result;
