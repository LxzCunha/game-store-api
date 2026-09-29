import type { Request, Response } from "express";
import Customer from "../models/Customer.js";

async function getAll(req: Request, res: Response) {
    try {
        const categories = await Customer.findAll();

        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao buscar cliente: ", error);

        res.status(500).json({
            message: "Erro ao buscar cliente.",
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
        const categories = await Customer.searchByKeyword(keyword);

        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao pesquisar por cliente: ", error);

        res.status(500).json({
            message: "Erro ao pesquisar cliente.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Cliente não informado."
        })
    }

    try {
        const category = await Customer.findById(id);

        res.status(200).json(category);
    } catch (error) {
        console.error("Erro ao buscar cliente: ", error);

        res.status(404).json({
            message: "Cliente não encontrado.",
        });
    }
}

async function create(req: Request, res: Response) {
    try {
        const category = await Customer.create(req.body);

        res.status(200).json(category);
    } catch (error) {
        console.error("Erro ao criar cliente: ", error);

        res.status(500).json({
            message: "Erro ao criar cliente.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Cliente não informado."
        })
    }

    try {
        const category = await Customer.update(id, req.body);

        res.status(200).json(category);
    } catch (error) {
        console.error("Erro ao atualizar cliente: ", error);

        res.status(500).json({
            message: "Erro ao atualizar cliente.",
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Cliente não informado."
        });
    }

    try {
        const deleted = await Customer.remove(id);

        if (!deleted) {
            return res.status(404).json({
                message: "Cliente não encontrado para remoção."
            });
        }

        return res.status(200).json({
            message: "Cliente removido com sucesso.",
        });
    } catch (error: any) {
        console.error("Erro ao remover cliente: ", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Não é possível remover este cliente pois existem pedidos vinculados a ele."
            });
        }

        return res.status(500).json({
            message: "Erro ao remover cliente.",
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