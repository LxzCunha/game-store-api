import supabase from "../config/supabase.js";

async function findAll() {
    const{data, error} = await supabase
    .from("orders")
    .select("*");

    if(error) {
        throw error;
    }

    return data;
}

async function findById(id: string) {
    const{data, error} = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

    if(error){
        throw error;
    }

    return data;
}

async function create(order:{
    customer_id: string;
    seller_id: string;
    order_date: string;
    status: string;
    total: number;
    active: boolean;
}) {
    const { data, error} = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();

    if(error) {
        throw error;
    }

    return data;
}

async function update(
    id: string,
    order: {
    customer_id: string;
    seller_id: string;
    order_date: string;
    status: string;
    total: number;
    active: boolean;
}) {
    const { data, error} = await supabase
    .from("orders")
    .update(order)
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
    .from("orders")
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
