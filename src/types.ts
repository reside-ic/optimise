export interface Result {
    data: any;  // any additional value returned by the target function
    value: number; // the objective that we are minimising
}

export interface Point {
    data: any;
    id: number;
    location: number[];
    value: number;
}

export type TargetFn = (location: number[]) => number | Result;

export function checkResult(value: number | Result): Result {
    if (typeof value === "number") {
        return {
            data: null,
            value,
        };
    }
    return value;
}
