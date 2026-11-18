import supabase from "../config/supabase.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { Seller } from "../models/Seller.js";
import PersonRepository from "./PersonRepository.js";
import { notFoundOrThrow } from "./helpers.js";

const NOT_FOUND = "Vendedor não encontrado.";
const SELECT = "id, person_id, hire_date, person:people(name, email, phone, address)";

type SellerRow = {
    id: string;
    person_id: string;
    hire_date: string | null;
    person: {
        name: string;
        email: string;
        phone: string | null;
        address: string | null;
    };
};

function toSeller(row: SellerRow): Seller {
    const { person, ...seller } = row;

    return Seller.restore({ ...person, ...seller });
}

async function findAll(): Promise<Seller[]> {
    const { data, error } = await supabase
        .from("sellers")
        .select(SELECT)
        .overrideTypes<SellerRow[], { merge: false }>();

    if (error) {
        throw error;
    }

    return data.map(toSeller);
}

async function findById(id: string): Promise<Seller> {
    const { data, error } = await supabase
        .from("sellers")
        .select(SELECT)
        .eq("id", id)
        .maybeSingle()
        .overrideTypes<SellerRow, { merge: false }>();

    if (error) {
        notFoundOrThrow(error, NOT_FOUND);
    }

    if (!data) {
        throw new NotFoundError(NOT_FOUND);
    }

    return toSeller(data);
}

async function create(seller: Seller): Promise<Seller> {
    const personId = await PersonRepository.create(seller);

    const { data, error } = await supabase
        .from("sellers")
        .insert({ person_id: personId, hire_date: seller.getHireDate() })
        .select("id")
        .single();

    if (error) {
        await PersonRepository.remove(personId);
        throw error;
    }

    return findById(data.id);
}

async function update(seller: Seller): Promise<Seller> {
    const id = seller.getId();

    if (!id) {
        throw new Error("Vendedor sem ID não pode ser atualizado.");
    }

    await PersonRepository.update(seller);

    const { error } = await supabase
        .from("sellers")
        .update({ hire_date: seller.getHireDate() })
        .eq("id", id);

    if (error) {
        throw error;
    }

    return findById(id);
}

async function remove(id: string): Promise<Seller> {
    const seller = await findById(id);
    const personId = seller.getPersonId();

    const { error } = await supabase
        .from("sellers")
        .delete()
        .eq("id", id);

    if (error) {
        throw error;
    }

    if (personId) {
        await PersonRepository.remove(personId);
    }

    return seller;
}

export default {
    findAll,
    findById,
    create,
    update,
    remove
}
