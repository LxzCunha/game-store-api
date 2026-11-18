import type { Request, Response } from "express";
import Genres from "../models/Genres.js";
import { respondToError } from "../http/errors.js";
import { validateBody, validateId, writeFields } from "../http/validation.js";

const writeErrors = { validateInput: true } as const;

async function getAll(_req: Request, res: Response) {
    try {
        const records = await Genres.findAll();
        return res.status(200).json(records);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar gênero.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do gênero")) return;

    try {
        const record = await Genres.findById(id);
        if (record === null) {
            return res.status(404).json({ message: "Gênero não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar gênero.");
    }
}

async function create(req: Request, res: Response) {
    if (!validateBody(res, req.body, writeFields.genres, { create: true })) return;

    try {
        const record = await Genres.create(req.body);
        return res.status(201).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao criar gênero.", writeErrors);
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do gênero")) return;
    if (!validateBody(res, req.body, writeFields.genres, { create: false })) return;

    try {
        const record = await Genres.update(id, req.body);
        if (record === null) {
            return res.status(404).json({ message: "Gênero não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao atualizar gênero.", writeErrors);
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do gênero")) return;

    try {
        const deleted = await Genres.remove(id);
        if (deleted.length === 0) {
            return res.status(404).json({ message: "Gênero não encontrado para remoção." });
        }

        return res.status(200).json({ message: "Gênero removido com sucesso." });
    } catch (error) {
        return respondToError(res, error, "Erro ao remover gênero.", {
            foreignKey: "Não é possível remover este gênero pois existem jogos vinculados a ele.",
        });
    }
}

export default {
    getAll,
    getById,
    create,
    update,
    remove,
};
