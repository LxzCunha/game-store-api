import { ValidationError } from "../errors/ValidationError.js";
import { isUuid } from "./validation.js";

export type OrderItemData = {
    order_id: string;
    game_id: string;
    quantity: number;
    unit_price: number;
};

export class OrderItem {
    private id: string | undefined;
    private orderId: string;
    private gameId: string;
    private quantity: number;
    private unitPrice: number;

    constructor(data: OrderItemData) {
        this.id = undefined;
        this.orderId = "";
        this.gameId = "";
        this.quantity = 0;
        this.unitPrice = 0;

        this.changeOrder(data.order_id);
        this.changeGame(data.game_id);
        this.changeQuantity(data.quantity);
        this.changeUnitPrice(data.unit_price);
    }

    static restore(data: OrderItemData & { id: string }): OrderItem {
        const orderItem = new OrderItem(data);

        orderItem.id = data.id;

        return orderItem;
    }

    public getId(): string | undefined {
        return this.id;
    }
    public getOrderId(): string {
        return this.orderId;
    }
    public getGameId(): string {
        return this.gameId;
    }
    public getQuantity(): number {
        return this.quantity;
    }
    public getUnitPrice(): number {
        return this.unitPrice;
    }

    changeOrder(orderId: string): void {
        if (!isUuid(orderId)) {
            throw new ValidationError("O pedido do item (order_id) deve ser um UUID válido.");
        }
        this.orderId = orderId;
    }
    changeGame(gameId: string): void {
        if (!isUuid(gameId)) {
            throw new ValidationError("O jogo do item (game_id) deve ser um UUID válido.");
        }
        this.gameId = gameId;
    }
    changeQuantity(quantity: number): void {
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new ValidationError("A quantidade deve ser um número inteiro maior que zero.");
        }
        this.quantity = quantity;
    }
    changeUnitPrice(unitPrice: number): void {
        if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new ValidationError("O preço unitário deve ser um número maior ou igual a zero.");
        }
        this.unitPrice = unitPrice;
    }

    toJSON() {
        return {
            id: this.id,
            order_id: this.orderId,
            game_id: this.gameId,
            quantity: this.quantity,
            unit_price: this.unitPrice,
        };
    }
}
