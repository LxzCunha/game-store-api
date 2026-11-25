import type { Request, Response } from "express";
import GenresRepository from "../repository/GenresRepository.js";
import { Genre } from "../models/Genres.js";
import { applyActive, sendError } from "./helpers.js";

async function getAll(req: Request, res: Response) {
    try {
        const genres = await GenresRepository.findAll();

        res.status(200).json(genres);
    } catch (error) {
        sendError(res, error, "Erro ao buscar gêneros.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Gênero não informado."
        });
    }

    try {
        const genre = await GenresRepository.findById(id);

        res.status(200).json(genre);
    } catch (error) {
        sendError(res, error, "Erro ao buscar gênero.");
    }
}

async function create(req: Request, res: Response) {
    const { name, description, active } = req.body ?? {};

    try {
        const genre = new Genre(name, description);
        applyActive(genre, active);

        const createdGenre = await GenresRepository.create(genre);

        res.status(201).json(createdGenre);
    } catch (error) {
        sendError(res, error, "Erro ao criar gênero.");
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const { name, description, active } = req.body ?? {};

    if (!id) {
        return res.status(400).json({
            message: "ID do Gênero não informado."
        });
    }

    try {
        const genre = await GenresRepository.findById(id);

        if (name !== undefined) {
            genre.rename(name);
        }

        if (description !== undefined) {
            genre.changeDescription(description);
        }

        applyActive(genre, active);

        const updatedGenre = await GenresRepository.update(genre);

        res.status(200).json(updatedGenre);
    } catch (error) {
        sendError(res, error, "Erro ao atualizar gênero.");
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Gênero não informado."
        });
    }

    try {
        await GenresRepository.remove(id);

        res.status(200).json({
            message: "Gênero removido com sucesso.",
        });
    } catch (error) {
        sendError(res, error, "Erro ao remover gênero.", {
            status: 409,
            message: "Não é possível remover este gênero pois existem jogos vinculados a ele."
        });
    }
}

export default {
    getAll,
    getById,
    create,
    update,
    remove
}
