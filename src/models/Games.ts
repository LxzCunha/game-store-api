import supabase from "../config/supabase.js";


async function findAll() {
    const{data, error} = await supabase
    .from("games")
    .select("*");

    if(error) {
        throw error;
    }

    console.log(data);
    return data;
}

async function findById(id: string) {
    const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        throw error;
    } 

    return data;
}

async function findByGenre(genreId: string) {
    const{data, error} = await supabase
    .from("games")
    .select("*")
    .eq("genre_id", genreId);

    if(error) {
        throw error;
    }

    return data;
}

async function create(game:{
    genre_id: string;
    title: string;
    description: string;
    price: number;
    stock_quantity: number;
    release_date: string;
    developer: string;
    image: string;
    active: boolean;
}) {
    const { data, error } = await supabase
        .from("games")
        .insert(game)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function update(
    id: string,
    game: {
    genre_id: string;
    title: string;
    description: string;
    price: number;
    stock_quantity: number;
    release_date: string;
    developer: string;
    image: string;
    active: boolean;
}) {
    const { data, error } = await supabase
        .from("games")
        .update(game)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function remove(id: string) {
    const { data, error } = await supabase
        .from("games")
        .delete()
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export default {
    findAll,
    findById,
    findByGenre,
    create,
    update,
    remove
}
