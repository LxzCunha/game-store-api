import type { Request, Response } from "express";
import CustomerRepository from "../repository/CustomerRepository.js";
import { Customer } from "../models/Customer.js";
import { sendError } from "./helpers.js";

async function getAll(req: Request, res: Response) {
    try {
        const customers = await CustomerRepository.findAll();

        res.status(200).json(customers);
    } catch (error) {
        sendError(res, error, "Erro ao buscar clientes.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Cliente não informado."
        });
    }

    try {
        const customer = await CustomerRepository.findById(id);

        res.status(200).json(customer);
    } catch (error) {
        sendError(res, error, "Erro ao buscar cliente.");
    }
}

async function create(req: Request, res: Response) {
    try {
        const customer = new Customer(req.body ?? {});

        const createdCustomer = await CustomerRepository.create(customer);

        res.status(201).json(createdCustomer);
    } catch (error) {
        sendError(res, error, "Erro ao criar cliente.");
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const body = req.body ?? {};

    if (!id) {
        return res.status(400).json({
            message: "ID do Cliente não informado."
        });
    }

    try {
        const customer = await CustomerRepository.findById(id);

        if (body.name !== undefined) {
            customer.rename(body.name);
        }
        if (body.email !== undefined) {
            customer.changeEmail(body.email);
        }
        if (body.phone !== undefined) {
            customer.changePhone(body.phone);
        }
        if (body.address !== undefined) {
            customer.changeAddress(body.address);
        }
        if (body.birth_date !== undefined) {
            customer.changeBirthDate(body.birth_date);
        }

        const updatedCustomer = await CustomerRepository.update(customer);

        res.status(200).json(updatedCustomer);
    } catch (error) {
        sendError(res, error, "Erro ao atualizar cliente.");
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
        await CustomerRepository.remove(id);

        res.status(200).json({
            message: "Cliente removido com sucesso.",
        });
    } catch (error) {
        sendError(res, error, "Erro ao remover cliente.", {
            status: 409,
            message: "Não é possível remover este cliente pois existem pedidos vinculados a ele."
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
