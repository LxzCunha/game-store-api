import supabase from "../config/supabase.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { Customer } from "../models/Customer.js";
import PersonRepository from "./PersonRepository.js";
import { notFoundOrThrow } from "./helpers.js";

const NOT_FOUND = "Cliente não encontrado.";
const SELECT = "id, person_id, birth_date, person:people(name, email, phone, address)";

type CustomerRow = {
    id: string;
    person_id: string;
    birth_date: string | null;
    person: {
        name: string;
        email: string;
        phone: string | null;
        address: string | null;
    };
};

function toCustomer(row: CustomerRow): Customer {
    const { person, ...customer } = row;

    return Customer.restore({ ...person, ...customer });
}

async function findAll(): Promise<Customer[]> {
    const { data, error } = await supabase
        .from("customers")
        .select(SELECT)
        .overrideTypes<CustomerRow[], { merge: false }>();

    if (error) {
        throw error;
    }

    return data.map(toCustomer);
}

async function findById(id: string): Promise<Customer> {
    const { data, error } = await supabase
        .from("customers")
        .select(SELECT)
        .eq("id", id)
        .maybeSingle()
        .overrideTypes<CustomerRow, { merge: false }>();

    if (error) {
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
    }

    return toCustomer(data);
}

async function create(customer: Customer): Promise<Customer> {
    const personId = await PersonRepository.create(customer);

    const { data, error } = await supabase
        .from("customers")
        .insert({ person_id: personId, birth_date: customer.getBirthDate() })
        .select("id")
        .single();

    if (error) {
        await PersonRepository.remove(personId);
        throw error;
    }

    return findById(data.id);
}

async function update(customer: Customer): Promise<Customer> {
    const id = customer.getId();

    if (!id) {
        throw new Error("Cliente sem ID não pode ser atualizado.");
    }

    await PersonRepository.update(customer);

    const { error } = await supabase
        .from("customers")
        .update({ birth_date: customer.getBirthDate() })
        .eq("id", id);

    if (error) {
        throw error;
    }

    return findById(id);
}

async function remove(id: string): Promise<Customer> {
    const customer = await findById(id);
    const personId = customer.getPersonId();

    const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

    if (error) {
        throw error;
    }

    if (personId) {
        await PersonRepository.remove(personId);
    }

    return customer;
}

export default {
    findAll,
    findById,
    create,
    update,
    remove
}
