export enum CounterColor {
    green,
    yellow
}

export function flipColor(color: CounterColor): CounterColor {
    return color == CounterColor.green ? CounterColor.yellow : CounterColor.green;
}