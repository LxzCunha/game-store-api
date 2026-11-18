import { ValidationError } from "../errors/ValidationError.js";
import { isDate, isUuid } from "./validation.js";

export type OrderData = {
    customer_id: string;
    seller_id: string;
    order_date?: string;
    status?: string;
    total?: number;
};

export class Order {
    private id: string | undefined;
    private customerId: string;
    private sellerId: string;
    private orderDate: string | undefined;
    private status: string;
    private total: number;
    private active: boolean;

    constructor(data: OrderData) {
        this.id = undefined;
        this.customerId = "";
        this.sellerId = "";
        this.orderDate = undefined;
        this.status = "pending";
        this.total = 0;
        this.active = true;

        this.changeCustomer(data.customer_id);
        this.changeSeller(data.seller_id);

        if (data.order_date !== undefined) {
            this.changeOrderDate(data.order_date);
        }
        if (data.status !== undefined) {
            this.changeStatus(data.status);
        }
        if (data.total !== undefined) {
            this.changeTotal(data.total);
        }
    }

    static restore(data: Required<OrderData> & { id: string; active: boolean }): Order {
        const order = new Order(data);

        order.id = data.id;
        order.active = data.active;

        return order;
    }

    public getId(): string | undefined {
        return this.id;
    }
    public getCustomerId(): string {
        return this.customerId;
    }
    public getSellerId(): string {
        return this.sellerId;
    }
    public getOrderDate(): string | undefined {
        return this.orderDate;
    }
    public getStatus(): string {
        return this.status;
    }
    public getTotal(): number {
        return this.total;
    }
    public isActive(): boolean {
        return this.active;
    }

    changeCustomer(customerId: string): void {
        if (!isUuid(customerId)) {
            throw new ValidationError("O cliente do pedido (customer_id) deve ser um UUID válido.");
        }
        this.customerId = customerId;
    }
    changeSeller(sellerId: string): void {
        if (!isUuid(sellerId)) {
            throw new ValidationError("O vendedor do pedido (seller_id) deve ser um UUID válido.");
        }
        this.sellerId = sellerId;
    }
    changeOrderDate(orderDate: string): void {
        if (!isDate(orderDate)) {
            throw new ValidationError("A data do pedido deve estar no formato AAAA-MM-DD.");
        }
        this.orderDate = orderDate;
    }
    changeStatus(status: string): void {
        if (typeof status !== "string" || status.trim().length === 0) {
            throw new ValidationError("O status do pedido é obrigatório.");
        }
        this.status = status.trim();
    }
    changeTotal(total: number): void {
        if (typeof total !== "number" || !Number.isFinite(total) || total < 0) {
            throw new ValidationError("O total do pedido deve ser um número maior ou igual a zero.");
        }
        this.total = total;
    }

    activate(): void {
        this.active = true;
    }
    deactivate(): void {
        this.active = false;
    }

    toJSON() {
        return {
            id: this.id,
            customer_id: this.customerId,
            seller_id: this.sellerId,
            order_date: this.orderDate,
            status: this.status,
            total: this.total,
            active: this.active,
        };
    }
}
