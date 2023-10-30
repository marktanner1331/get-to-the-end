export enum CounterColor {
    green,
    yellow
}

export namespace CounterColor {
    export function flipColor(color: CounterColor): CounterColor {
        return color == CounterColor.green ? CounterColor.yellow : CounterColor.green;
    }
}