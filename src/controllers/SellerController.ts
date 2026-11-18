import type { Request, Response } from "express";
import SellerRepository from "../repository/SellerRepository.js";
import { Seller } from "../models/Seller.js";
import { sendError } from "./helpers.js";

async function getAll(req: Request, res: Response) {
    try {
        const sellers = await SellerRepository.findAll();

        res.status(200).json(sellers);
    } catch (error) {
        sendError(res, error, "Erro ao buscar vendedores.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Vendedor não informado."
        });
    }

    try {
        const seller = await SellerRepository.findById(id);

        res.status(200).json(seller);
    } catch (error) {
        sendError(res, error, "Erro ao buscar vendedor.");
    }
}

async function create(req: Request, res: Response) {
    try {
        const seller = new Seller(req.body ?? {});

        const createdSeller = await SellerRepository.create(seller);

        res.status(201).json(createdSeller);
    } catch (error) {
        sendError(res, error, "Erro ao criar vendedor.");
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const body = req.body ?? {};

    if (!id) {
        return res.status(400).json({
            message: "ID do Vendedor não informado."
        });
    }

    try {
        const seller = await SellerRepository.findById(id);

        if (body.name !== undefined) {
            seller.rename(body.name);
        }
        if (body.email !== undefined) {
            seller.changeEmail(body.email);
        }
        if (body.phone !== undefined) {
            seller.changePhone(body.phone);
        }
        if (body.address !== undefined) {
            seller.changeAddress(body.address);
        }
        if (body.hire_date !== undefined) {
            seller.changeHireDate(body.hire_date);
        }

        const updatedSeller = await SellerRepository.update(seller);

        res.status(200).json(updatedSeller);
    } catch (error) {
        sendError(res, error, "Erro ao atualizar vendedor.");
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
        await SellerRepository.remove(id);

        res.status(200).json({
            message: "Vendedor removido com sucesso.",
        });
    } catch (error) {
        sendError(res, error, "Erro ao remover vendedor.", {
            status: 409,
            message: "Não é possível remover este vendedor pois existem pedidos vinculados a ele."
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
