import supabase from "../config/supabase.js";

export type Person = {
    name: string;
    email: string;
    role: string;
    phone: string;
    address: string;
};

async function findAll() {
    const {data, error} = await supabase
    .from("people")
    .select("*");

    if(error) {
        throw error;
    }

    return data;
}

async function findById(id: string) {
    const { data, error } = await supabase
        .from("people")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;

    return data;
}

async function create(person: Person) {
    const { data, error } = await supabase
        .from("people")
        .insert(person)
        .select()
        .single();

    if (error) throw error;

    return data;
}

async function update(id: string, person: Partial<Person>) {
    const { data, error } = await supabase
        .from("people")
        .update(person)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;

    return data;
}

async function remove(id: string) {
    const { data, error } = await supabase
        .from("people")
        .delete()
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;

    return data;
}

async function searchByKeyword(keyword: string) {
    const { data, error } = await supabase
    .from("people")
    .select("*")
    .or(`name.ilike.%${keyword}%,email.ilike.%${keyword}%`);

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
