

export class RoundManager  {
    private roundStart = 0;
    private roundEnd = 0;
    private tradeEnd = 0;
    private currentLabel = "";

    update(timestamp:number):boolean{
        const roundStart = 
            timestamp - (timestamp % (5 * 60 * 1000));

        if(roundStart === this.roundStart){
            return false;
        }
        this.roundStart = roundStart;
        this.roundEnd = roundStart + 5 * 60 * 1000;
        this.tradeEnd = roundStart + 3 * 60 * 1000;
        this.currentLabel = this.createLabel(roundStart);

        return true;
    }
    canTrade(now: number): boolean {
        return now < this.tradeEnd;
    }
    getRoundLabel(): string {
        return this.currentLabel;
    }
    getRoundStart(): number {
        return this.roundStart;
    }
    getRoundEnd(): number {
        return this.roundEnd;
    }
    secondsFromStart(now: number): number {
        return Math.floor((now - this.roundStart) / 1000);
    }
    secondsLeft(now: number): number {
        return Math.max(
            0,
            Math.floor((this.roundEnd - now) / 1000)
        );
    }
    private createLabel(timestamp: number): string {

        const start = new Date(timestamp);

        const end = new Date(timestamp + 5 * 60 * 1000);

        const format = (date: Date) => {

            const hours =
                String(date.getHours()).padStart(2, "0");

            const minutes =
                String(date.getMinutes()).padStart(2, "0");

            return `${hours}:${minutes}`;

        };

        return `${format(start)}-${format(end)}`;

    }

}