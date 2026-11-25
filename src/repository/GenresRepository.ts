import supabase from "../config/supabase.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { Genre } from "../models/Genres.js";
import { notFoundOrThrow } from "./helpers.js";

const NOT_FOUND = "Gênero não encontrado.";

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
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
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
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
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
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
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
