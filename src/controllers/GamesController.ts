import type { Request, Response } from "express";
import Games from "../models/Games.js";

async function getAll(req: Request, res: Response) {
    try {
        const games = await Games.findAll();

        res.status(200).json(games);
    } catch (error) {
        console.error("Erro ao buscar jogos: ", error);

        res.status(500).json({
            message: "Erro ao buscar jogos.",
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
        const games = await Games.searchByKeyword(keyword);

        res.status(200).json(games);
    } catch (error) {
        console.error("Erro ao pesquisar por jogo: ", error);

        res.status(500).json({
            message: "Erro ao pesquisar jogo.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Jogo não informado."
        })
    }

    try {
        const game = await Games.findById(id);

        res.status(200).json(game);
    } catch (error) {
        console.error("Erro ao buscar jogo: ", error);

        res.status(404).json({
            message: "Jogo não encontrado.",
        });
    }
}

async function create(req: Request, res: Response) {
    try {
        const game = await Games.create(req.body);

        res.status(200).json(game);
    } catch (error) {
        console.error("Erro ao criar jogo: ", error);

        res.status(500).json({
            message: "Erro ao criar jogo.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Jogo não informado."
        })
    }

    try {
        const game = await Games.update(id, req.body);

        res.status(200).json(game);
    } catch (error) {
        console.error("Erro ao atualizar jogo: ", error);

        res.status(500).json({
            message: "Erro ao atualizar jogo.",
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID do Jogo não informado."
        });
    }

    try {
        await Games.remove(id);

        return res.status(200).json({
            message: "Jogo removido com sucesso.",
        });

    } catch (error: any) {
        console.error("Erro ao remover jogo: ", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Não é possível remover este jogo, pois ele está vinculado a um pedido."
            });
        }

        return res.status(500).json({
            message: "Erro ao remover jogo.",
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