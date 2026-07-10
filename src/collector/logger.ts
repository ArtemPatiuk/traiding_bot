import fs from "fs";

const stream = fs.createWriteStream(
    "collector.log",
    { flags: "a" }
);

export function log(...args: any[]) {

    const line =
        `[${new Date().toLocaleTimeString()}] ` +
        args.map(String).join(" ");

    stream.write(line + "\n");
}

export function closeLogger() {
    stream.end();
}

process.on("SIGINT", () => {
    closeLogger();
    process.exit();
});