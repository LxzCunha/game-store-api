import type { PostgrestError } from "@supabase/supabase-js";
import supabase from "../config/supabase.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { Genre } from "../models/Genres.js";

type GenreRow = {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
};

function toGenre(row: GenreRow): Genre {
    return Genre.restore(row.id, row.name, row.description, row.active);
}

function toRow(genre: Genre) {
    return {
        name: genre.getName(),
        description: genre.getDescription(),
        active: genre.isActive(),
    };
}


function notFoundOrThrow(error: PostgrestError): never {
    if (error.code === "22P02") {
        throw new NotFoundError("Gênero não encontrado.");
    }
    throw error;
}

async function findAll(): Promise<Genre[]> {
    const { data, error } = await supabase
        .from("genres")
        .select("*");

    if (error) {
        throw error;
    }

    return data.map(toGenre);
}

async function findById(id: string): Promise<Genre> {
    const { data, error } = await supabase
        .from("genres")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        notFoundOrThrow(error);
    }

    if (!data) {
        throw new NotFoundError("Gênero não encontrado.");
    }

    return toGenre(data);
}

async function create(genre: Genre): Promise<Genre> {
    const { data, error } = await supabase
        .from("genres")
        .insert(toRow(genre))
        .select()
        .single();

    if (error) {
        throw error;
    }

    return toGenre(data);
}

async function update(genre: Genre): Promise<Genre> {
    const id = genre.getId();

    if (!id) {
        throw new Error("Gênero sem ID não pode ser atualizado.");
    }

    const { data, error } = await supabase
        .from("genres")
        .update(toRow(genre))
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        notFoundOrThrow(error);
    }

    if (!data) {
        throw new NotFoundError("Gênero não encontrado.");
    }

    return toGenre(data);
}

async function remove(id: string): Promise<Genre> {
    const { data, error } = await supabase
        .from("genres")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        notFoundOrThrow(error);
    }

    if (!data) {
        throw new NotFoundError("Gênero não encontrado.");
    }

    return toGenre(data);
}

export default {
    findAll,
    findById,
    create,
    update,
    remove
}
