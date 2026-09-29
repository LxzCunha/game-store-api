import type { Request, Response } from "express";
import Genres from "../models/Genres.js";

async function getAll(req: Request, res: Response) {
    try {
        const categories = await Genres.findAll();

        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao buscar gênero: ", error);

        res.status(500).json({
            message: "Erro ao buscar gênero.",
        });
    }
}

async function getByKeyword(req: Request<{ keyword: string }>, res: Response) {
    const { keyword } = req.params;

    if (!keyword || typeof keyword != "string") {
        res.status(400).json({
            message: "Palavra-chave não informada."
        })
    }

    try {
        const categories = await Genres.searchByKeyword(keyword);

        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao pesquisar por gênero: ", error);

        res.status(500).json({
            message: "Erro ao pesquisar gênero.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Gênero não informado."
        })
    }

    try {
        const category = await Genres.findById(id);

        res.status(200).json(category);
    } catch (error) {
        console.error("Erro ao buscar gênero: ", error);

        res.status(404).json({
            message: "Gênero não encontrada.",
        });
    }
}

async function create(req: Request, res: Response) {
    try {
        const category = await Genres.create(req.body);

        res.status(201).json(category);
    } catch (error) {
        console.error("Erro ao criar gênero: ", error);

        res.status(500).json({
            message: "Erro ao criar gênero.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Gênero não informado."
        })
    }

    try {
        const category = await Genres.update(id, req.body);

        res.status(200).json(category);
    } catch (error) {
        console.error("Erro ao atualizar gênero: ", error);

        res.status(500).json({
            message: "Erro ao atualizar gênero.",
        });
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
        const deleted = await Genres.remove(id);

        if (!deleted) {
            return res.status(404).json({
                message: "Gênero não encontrado para remoção."
            });
        }

        return res.status(200).json({
            message: "Gênero removido com sucesso.",
        });
    } catch (error: any) {
        console.error("Erro ao remover gênero: ", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Não é possível remover este gênero pois existem jogos vinculados a ele."
            });
        }

        return res.status(500).json({
            message: "Erro ao remover gênero.",
        });
    }
}

export default {
    getAll,
    getById,
    getByKeyword,
    create,
    update,
    remove
}