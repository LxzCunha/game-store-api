import supabase from "../config/supabase.js";

async function findAll() {
    const{data, error} = await supabase
    .from("order_items")
    .select("*");

    if(error) {
        throw error;
    }

    return data;
}

async function findById(id: string) {
    const{data, error} = await supabase
    .from("order_items")
    .select("*")
    .eq("id", id)
    .single();

    if(error){
        throw error;
    }

    return data;
}

async function create(orderItem:{
    order_id: string;
    game_id: string;
    quantity: number;
    unit_price: number;
}) {
    const { data, error} = await supabase
    .from("order_items")
    .insert(orderItem)
    .select()
    .single();

    if(error) {
        throw error;
    }

    return data;
}

async function update(
    id: string,
    orderItem: {
    order_id: string;
    game_id: string;
    quantity: number;
    unit_price: number;
}) {
    const { data, error} = await supabase
    .from("order_items")
    .update(orderItem)
    .eq("id", id)
    .select()
    .single();

    if(error) {
        throw error;
    }

    return data;
}

async function remove(id: string) {
    const{data, error} = await supabase
    .from("order_items")
    .delete()
    .eq("id", id)
    .select()
    .single();

    if(error){
        throw error;
    }

    return data;
}

export default {
    findAll,
    findById,
    create,
    update,
    remove
}
