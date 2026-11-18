import type { Request, Response } from "express";
import GenresRepository from "../repository/GenresRepository.js";
import { Genre } from "../models/Genres.js";
import { ValidationError } from "../errors/ValidationError.js";
import { NotFoundError } from "../errors/NotFoundError.js";

function sendError(res: Response, error: unknown, message: string) {
    console.error(`${message} `, error);

    if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
    }

    if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message });
}

function applyActive(genre: Genre, active: unknown) {
    if (active === undefined) {
        return;
    }

    if (typeof active !== "boolean") {
        throw new ValidationError("O campo active deve ser true ou false.");
    }

    if (active) {
        genre.activate();
    } else {
        genre.deactivate();
    }
}

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
    } catch (error: any) {
        if (error?.code === "23503") {
            console.error("Erro ao remover gênero: ", error);

            return res.status(409).json({
                message: "Não é possível remover este gênero pois existem jogos vinculados a ele."
            });
        }

        sendError(res, error, "Erro ao remover gênero.");
    }
}

export default {
    getAll,
    getById,
    create,
    update,
    remove
}
