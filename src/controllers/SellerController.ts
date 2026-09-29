import type { Request, Response } from "express";
import Seller from "../models/Seller.js";

async function getAll(req: Request, res: Response) {
    try {
        const categories = await Seller.findAll();

        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao buscar vendedor: ", error);

        res.status(500).json({
            message: "Erro ao buscar vendedor.",
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
        const categories = await Seller.searchByKeyword(keyword);

        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao pesquisar por vendedor: ", error);

        res.status(500).json({
            message: "Erro ao pesquisar vendedor.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Vendedor não informado."
        })
    }

    try {
        const category = await Seller.findById(id);

        res.status(200).json(category);
    } catch (error) {
        console.error("Erro ao buscar vendedor: ", error);

        res.status(404).json({
            message: "Vendedor não encontrado.",
        });
    }
}

async function create(req: Request, res: Response) {
    try {
        const category = await Seller.create(req.body);

        res.status(201).json(category);
    } catch (error) {
        console.error("Erro ao criar vendedor: ", error);

        res.status(500).json({
            message: "Erro ao criar vendedor.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Vendedor não informado."
        })
    }

    try {
        const category = await Seller.update(id, req.body);

        res.status(200).json(category);
    } catch (error) {
        console.error("Erro ao atualizar vendedor: ", error);

        res.status(500).json({
            message: "Erro ao atualizar vendedor.",
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Vendedor não informado."
        });
    }

    try {
        const deleted = await Seller.remove(id);

        if (!deleted) {
            return res.status(404).json({
                message: "Vendedor não encontrado para remoção."
            });
        }

        return res.status(200).json({
            message: "Vendedor removido com sucesso.",
        });
    } catch (error: any) {
        console.error("Erro ao remover vendedor: ", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Não é possível remover este vendedor pois existem pedidos vinculados a ele."
            });
        }

        return res.status(500).json({
            message: "Erro ao remover vendedor.",
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