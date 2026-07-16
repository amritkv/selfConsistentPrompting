/**
 * Shared CLI utilities: ANSI color helpers and a lightweight terminal spinner.
 * Kept dependency-free intentionally so the tool runs with just the SDKs.
 */

const codes = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
};

function paint(code, text) {
    return `${code}${text}${codes.reset}`;
}

export const color = {
    bold: (t) => paint(codes.bold, t),
    dim: (t) => paint(codes.dim, t),
    red: (t) => paint(codes.red, t),
    green: (t) => paint(codes.green, t),
    yellow: (t) => paint(codes.yellow, t),
    blue: (t) => paint(codes.blue, t),
    magenta: (t) => paint(codes.magenta, t),
    cyan: (t) => paint(codes.cyan, t),
    gray: (t) => paint(codes.gray, t),
};

/**
 * Prints a section header with a divider so model outputs are easy to scan.
 */
export function section(title, colorFn = color.cyan) {
    const line = "─".repeat(60);
    console.log(`\n${color.gray(line)}`);
    console.log(colorFn(color.bold(title)));
    console.log(`${color.gray(line)}`);
}

/**
 * Minimal spinner. Returns a stop() function that clears the spinner line.
 * Falls back to a single log line when stdout is not a TTY (e.g. piped output).
 */
export function startSpinner(text) {
    if (!process.stdout.isTTY) {
        console.log(`${text}...`);
        return () => {};
    }

    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    const interval = setInterval(() => {
        const frame = frames[i % frames.length];
        process.stdout.write(`\r${color.cyan(frame)} ${text}`);
        i += 1;
    }, 80);

    return () => {
        clearInterval(interval);
        process.stdout.write(`\r${" ".repeat(text.length + 4)}\r`);
    };
}
