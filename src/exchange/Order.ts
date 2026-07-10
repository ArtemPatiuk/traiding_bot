export interface Order {
    id:string;
    tokenId:string;
    side:OrderSide;
    type:OrderType;
    price:number;    
    shares:number;
    status:OrderStatus;
    createdAt:number;
}

export interface CreateOrderRequest {
    tokenId: string;
    side: OrderSide;
    type: OrderType;
    price: number;
    shares: number;
}
export enum OrderSide {
    BUY = "BUY",
    SELL = "SELL"
}
export enum OrderStatus {
    NEW = "NEW",
    OPEN = "OPEN",
    FILLED = "FILLED",
    CANCELLED = 'CANCELLED'
}
export enum OrderType {
    LIMIT = "LIMIT",
    MARKET = "MARKET"
}