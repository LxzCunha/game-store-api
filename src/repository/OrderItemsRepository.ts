import supabase from "../config/supabase.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { OrderItem, type OrderItemData } from "../models/OrderItems.js";
import { isInvalidId, notFoundOrThrow } from "./helpers.js";

const NOT_FOUND = "Item do pedido não encontrado.";

type OrderItemRow = OrderItemData & {
    id: string;
};

function toOrderItem(row: OrderItemRow): OrderItem {
    return OrderItem.restore(row);
}

function toRow(orderItem: OrderItem) {
    return {
        order_id: orderItem.getOrderId(),
        game_id: orderItem.getGameId(),
        quantity: orderItem.getQuantity(),
        unit_price: orderItem.getUnitPrice(),
    };
}

async function findAll(): Promise<OrderItem[]> {
    const { data, error } = await supabase
        .from("order_items")
        .select("*");

    if (error) {
        throw error;
    }

    return data.map(toOrderItem);
}

async function findById(id: string): Promise<OrderItem> {
    const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
    }

    return toOrderItem(data);
}

async function findByOrder(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

    if (error) {
        if (isInvalidId(error)) {
            return [];
        }
        throw error;
    }

    return data.map(toOrderItem);
}

async function create(orderItem: OrderItem): Promise<OrderItem> {
    const { data, error } = await supabase
        .from("order_items")
        .insert(toRow(orderItem))
        .select()
        .single();

    if (error) {
        throw error;
    }

    return toOrderItem(data);
}

async function update(orderItem: OrderItem): Promise<OrderItem> {
    const id = orderItem.getId();

    if (!id) {
        throw new Error("Item do pedido sem ID não pode ser atualizado.");
    }

    const { data, error } = await supabase
        .from("order_items")
        .update(toRow(orderItem))
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
    }

    return toOrderItem(data);
}

async function remove(id: string): Promise<OrderItem> {
    const { data, error } = await supabase
        .from("order_items")
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

    return toOrderItem(data);
}

export default {
    findAll,
    findById,
    findByOrder,
    create,
    update,
    remove
}
