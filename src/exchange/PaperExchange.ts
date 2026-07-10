import { Exchange } from "./Exchange.interface";
import { Order, OrderStatus } from "./Order";



export class PaperExchange implements Exchange {

    private orders = new Map<string,Order>();

    async placeLimitOrder(order: Order): Promise<Order> {
        
        order.status = OrderStatus.OPEN;
        this.orders.set(order.id,order);

        return order;

    }
   async cancelOrder(orderId: string): Promise<boolean> {

    const order = this.orders.get(orderId);

    if (!order) {
        return false;
    }

    order.status = OrderStatus.CANCELLED;

    return true;
}
    getOrder(orderId: string): Order | undefined {
        return this.orders.get(orderId)
    }
    getOpenOrders(){
        return [...this.orders.values()].filter(order => order.status === OrderStatus.OPEN)
    }
    hasOpenOrder(tokenId: string): boolean {
    return [...this.orders.values()]
        .some(order =>

            order.tokenId === tokenId &&

            order.status === OrderStatus.OPEN

        );
    }
}