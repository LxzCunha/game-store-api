import supabase from "../config/supabase.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { Game, type GameData } from "../models/Games.js";
import { isInvalidId, notFoundOrThrow } from "./helpers.js";

const NOT_FOUND = "Jogo não encontrado.";

type GameRow = GameData & {
    id: string;
    active: boolean;
};

function toGame(row: GameRow): Game {
    return Game.restore(row);
}

function toRow(game: Game) {
    return {
        genre_id: game.getGenreId(),
        title: game.getTitle(),
        description: game.getDescription(),
        price: game.getPrice(),
        stock_quantity: game.getStockQuantity(),
        release_date: game.getReleaseDate(),
        developer: game.getDeveloper(),
        image: game.getImage(),
        active: game.isActive(),
    };
}

async function findAll(): Promise<Game[]> {
    const { data, error } = await supabase
        .from("games")
        .select("*");

    if (error) {
        throw error;
    }

    return data.map(toGame);
}

async function findById(id: string): Promise<Game> {
    const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
    }

    return toGame(data);
}

async function findByGenre(genreId: string): Promise<Game[]> {
    const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("genre_id", genreId);

    if (error) {
        if (isInvalidId(error)) {
            return [];
        }
        throw error;
    }

    return data.map(toGame);
}

async function create(game: Game): Promise<Game> {
    const { data, error } = await supabase
        .from("games")
        .insert(toRow(game))
        .select()
        .single();

    if (error) {
        throw error;
    }

    return toGame(data);
}

async function update(game: Game): Promise<Game> {
    const id = game.getId();

    if (!id) {
        throw new Error("Jogo sem ID não pode ser atualizado.");
    }

    const { data, error } = await supabase
        .from("games")
        .update(toRow(game))
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
    }

    return toGame(data);
}

async function remove(id: string): Promise<Game> {
    const { data, error } = await supabase
        .from("games")
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

    return toGame(data);
}

export default {
    findAll,
    findById,
    findByGenre,
    create,
    update,
    remove
}
