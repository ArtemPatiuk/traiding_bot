
export class RoundSession {
    constructor(
        public readonly slug:string,
        public readonly startTime:number,
        public readonly endTime:number

    ){}

    isActive(now:number = Date.now()){
        return now >= this.startTime &&
                now <= this.endTime
    }
    getLabel(){
        const start = new Date(this.startTime);
        const end = new Date(this.endTime);

        const format = (date:Date) => {
            date.toLocaleTimeString("uk-UA",{
                hour:"2-digit",
                minute:"2-digit"
            });
        }
        return `${format(start)}-${format(end)}`
    }
}