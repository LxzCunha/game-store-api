import supabase from "../config/supabase.js";

async function findAll() {
    const{data, error} = await supabase
    .from("genres")
    .select("*");

    if(error) {
        throw error;
    }

    console.log(data)
    return data;
}

async function findById(id: string) {
    const{data, error} = await supabase
    .from("genres")
    .select("*")
    .eq("id", id)
    .single();

    if(error){
        throw error;
    }

    return data;
}

async function create(genre:{
    name: string;
    description: string;
    active:boolean;
}) {
    const { data, error} = await supabase
    .from("genres")
    .insert(genre)
    .select()
    .single();

    if(error) {
        throw error;
    }

    return data;
}

async function update(
    id: string,
    genre: {
    name: string;
    description: string;
    active:boolean;
}) {
    const { data, error} = await supabase
    .from("genres")
    .update(genre)
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
    .from("genres")
    .delete()
    .eq("id", id)
    .select();

    if(error){
        throw error;
    }

    return data;
}

async function searchByKeyword(keyword: string) {
    const { data, error } = await supabase
    .from("genres")
    .select("*")
    .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);

    if(error) {
        throw error;
    }

    return data;
}

export default {
    findAll,
    findById,
    create,
    update,
    remove,
    searchByKeyword
}