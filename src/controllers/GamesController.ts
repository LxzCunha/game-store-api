import type { Request, Response } from "express";
import GamesRepository from "../repository/GamesRepository.js";
import { Game } from "../models/Games.js";
import { applyActive, sendError } from "./helpers.js";

const GENRE_NOT_FOUND = {
    status: 400,
    message: "O gênero informado não existe."
} as const;

async function getAll(req: Request, res: Response) {
    try {
        const games = await GamesRepository.findAll();

        res.status(200).json(games);
    } catch (error) {
        sendError(res, error, "Erro ao buscar jogos.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Jogo não informado."
        });
    }

    try {
        const game = await GamesRepository.findById(id);

        res.status(200).json(game);
    } catch (error) {
        sendError(res, error, "Erro ao buscar jogo.");
    }
}

async function getByGenre(req: Request<{ genreId: string }>, res: Response) {
    const { genreId } = req.params;

    if (!genreId) {
        return res.status(400).json({
            message: "ID do Gênero não informado."
        });
    }

    try {
        const games = await GamesRepository.findByGenre(genreId);

        res.status(200).json(games);
    } catch (error) {
        sendError(res, error, "Erro ao buscar jogos do gênero.");
    }
}

async function create(req: Request, res: Response) {
    const body = req.body ?? {};

    try {
        const game = new Game(body);
        applyActive(game, body.active);

        const createdGame = await GamesRepository.create(game);

        res.status(201).json(createdGame);
    } catch (error) {
        sendError(res, error, "Erro ao criar jogo.", GENRE_NOT_FOUND);
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const body = req.body ?? {};

    if (!id) {
        return res.status(400).json({
            message: "ID do Jogo não informado."
        });
    }

    try {
        const game = await GamesRepository.findById(id);

        if (body.genre_id !== undefined) {
            game.changeGenre(body.genre_id);
        }
        if (body.title !== undefined) {
            game.rename(body.title);
        }
        if (body.description !== undefined) {
            game.changeDescription(body.description);
        }
        if (body.price !== undefined) {
            game.changePrice(body.price);
        }
        if (body.stock_quantity !== undefined) {
            game.changeStockQuantity(body.stock_quantity);
        }
        if (body.release_date !== undefined) {
            game.changeReleaseDate(body.release_date);
        }
        if (body.developer !== undefined) {
            game.changeDeveloper(body.developer);
        }
        if (body.image !== undefined) {
            game.changeImage(body.image);
        }

        applyActive(game, body.active);

        const updatedGame = await GamesRepository.update(game);

        res.status(200).json(updatedGame);
    } catch (error) {
        sendError(res, error, "Erro ao atualizar jogo.", GENRE_NOT_FOUND);
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Jogo não informado."
        });
    }

    try {
        await GamesRepository.remove(id);

        res.status(200).json({
            message: "Jogo removido com sucesso.",
        });
    } catch (error) {
        sendError(res, error, "Erro ao remover jogo.", {
            status: 409,
            message: "Não é possível remover este jogo, pois ele está vinculado a um pedido."
        });
    }
}

export default {
    getAll,
    getById,
    getByGenre,
    create,
    update,
    remove
}
