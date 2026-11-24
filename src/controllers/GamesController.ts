import type { Request, Response } from "express";
import Games from "../models/Games.js";
import { respondToError } from "../http/errors.js";
import { validateBody, validateId, writeFields } from "../http/validation.js";

const writeErrors = {
    validateInput: true,
    foreignKey: "O gênero informado não existe.",
} as const;

async function getAll(_req: Request, res: Response) {
    try {
        const records = await Games.findAll();
        return res.status(200).json(records);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar jogos.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do jogo")) return;

    try {
        const record = await Games.findById(id);
        if (record === null) {
            return res.status(404).json({ message: "Jogo não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar jogo.");
    }
}

async function getByGenre(req: Request<{ genreId: string }>, res: Response) {
    const { genreId } = req.params;
    if (!validateId(res, genreId, "do gênero")) return;

    try {
        const records = await Games.findByGenre(genreId);
        return res.status(200).json(records);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar jogos do gênero.");
    }
}

async function create(req: Request, res: Response) {
    if (!validateBody(res, req.body, writeFields.games, { create: true })) return;

    try {
        const record = await Games.create(req.body);
        return res.status(201).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao criar jogo.", writeErrors);
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do jogo")) return;
    if (!validateBody(res, req.body, writeFields.games, { create: false })) return;

    try {
        const record = await Games.update(id, req.body);
        if (record === null) {
            return res.status(404).json({ message: "Jogo não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao atualizar jogo.", writeErrors);
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do jogo")) return;

    try {
        const deleted = await Games.remove(id);
        if (deleted === null) {
            return res.status(404).json({ message: "Jogo não encontrado para remoção." });
        }

        return res.status(200).json({ message: "Jogo removido com sucesso." });
    } catch (error) {
        return respondToError(res, error, "Erro ao remover jogo.", {
            foreignKey: "Não é possível remover este jogo, pois ele está vinculado a um pedido.",
        });
    }
}

export default {
    getAll,
    getById,
    getByGenre,
    create,
    update,
    remove,
};
