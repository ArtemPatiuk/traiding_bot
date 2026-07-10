import { CreateOrderRequest, Order } from "./Order";

export interface Exchange {
    placeLimitOrder(request:CreateOrderRequest): Promise<Order>;
    cancelOrder(orderId:string):Promise<boolean>;
    getOrder(orderId:string): Order | undefined;
    getOpenOrders(): Order[];
    hasOpenOrder(tokenId: string): boolean;
}