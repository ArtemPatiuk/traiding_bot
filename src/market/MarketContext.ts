
export class MarketContext {
    public slug = "";
    public marketId  = "";
    public upTokenId   = "";
    public downTokenId    = "";

    setMarket(data: {
        slug:string,
        marketId:string,
        upTokenId:string,
        downTokenId:string,

    }){
        this.slug = data.slug;
        this.marketId = data.marketId;
        this.upTokenId = data.upTokenId;
        this.downTokenId = data.downTokenId;
    }
    isReady():boolean {
        return (
            this.upTokenId.length > 0 &&
            this.downTokenId.length > 0
        )
    }

}