import supabase from "../config/supabase.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { Order, type OrderData } from "../models/Orders.js";
import { isInvalidId, notFoundOrThrow } from "./helpers.js";

const NOT_FOUND = "Pedido não encontrado.";

type OrderRow = Required<OrderData> & {
    id: string;
    active: boolean;
};

function toOrder(row: OrderRow): Order {
    return Order.restore(row);
}

function toRow(order: Order) {
    return {
        customer_id: order.getCustomerId(),
        seller_id: order.getSellerId(),
        order_date: order.getOrderDate(),
        status: order.getStatus(),
        total: order.getTotal(),
        active: order.isActive(),
    };
}

async function findAll(): Promise<Order[]> {
    const { data, error } = await supabase
        .from("orders")
        .select("*");

    if (error) {
        throw error;
    }

    return data.map(toOrder);
}

async function findById(id: string): Promise<Order> {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
    }

    return toOrder(data);
}

async function findByColumn(column: "customer_id" | "seller_id", id: string): Promise<Order[]> {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq(column, id);

    if (error) {
        if (isInvalidId(error)) {
            return [];
        }
        throw error;
    }

    return data.map(toOrder);
}

async function findByCustomer(customerId: string): Promise<Order[]> {
    return findByColumn("customer_id", customerId);
}

async function findBySeller(sellerId: string): Promise<Order[]> {
    return findByColumn("seller_id", sellerId);
}

async function create(order: Order): Promise<Order> {
    const { data, error } = await supabase
        .from("orders")
        .insert(toRow(order))
        .select()
        .single();

    if (error) {
        throw error;
    }

    return toOrder(data);
}

async function update(order: Order): Promise<Order> {
    const id = order.getId();

    if (!id) {
        throw new Error("Pedido sem ID não pode ser atualizado.");
    }

    const { data, error } = await supabase
        .from("orders")
        .update(toRow(order))
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
    }

    return toOrder(data);
}

async function remove(id: string): Promise<Order> {
    const { data, error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
    }

    return toOrder(data);
}

export default {
    findAll,
    findById,
    findByCustomer,
    findBySeller,
    create,
    update,
    remove
}
