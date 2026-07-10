import fs from "node:fs";
import path from "node:path";
import { ActionType, StrategyAction } from "../strategy/StrategyAction";

export class StrategyLogger {

    private readonly logDir = "logs";

    constructor() {

        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }

    }

    log(action: StrategyAction): void {

        const file = path.join(
            this.logDir,
            `${action.strategy}.txt`
        );

        const line = this.format(action);

        fs.appendFileSync(file, line + "\n");

    }

    private format(action: StrategyAction): string {

        const time = new Date(action.ts).toLocaleTimeString();

        switch (action.type) {

            case ActionType.ROUND_STARTED:

                return `[${time}] ROUND STARTED ${action.round}`;

            case ActionType.ENTER:

                return `[${time}] ENTER ${action.firstSide} ${action.firstPrice?.toFixed(2)}`;

            case ActionType.LOCK:

                return `[${time}] LOCK ${action.firstSide} ${action.firstPrice?.toFixed(2)} -> ${action.secondSide} ${action.secondPrice?.toFixed(2)} SUM=${action.sum?.toFixed(2)}`;

            case ActionType.ROUND_TIMEOUT:

                return `[${time}] ROUND TIMEOUT`;

        }

    }

}