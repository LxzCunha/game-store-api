import supabase from "../config/supabase.js";
import PersonModel, { type Person } from "./Person.js";


type Customer = Person & {
    birth_date: string;
};

function toCustomer(row: any) {
    const { person, ...customer } = row;
    return { ...person, ...customer };
}

async function findAll() {
    const { data, error } = await supabase
    .from("customers")
    .select("id, person_id, birth_date, person:people(*)");

    if (error) throw error;

    return data.map(toCustomer);
}

async function findById(id: string) {
    const { data, error } = await supabase
        .from("customers")
        .select("id, person_id, birth_date, person:people(*)")
        .eq("id", id)
        .single();

    if (error){
        throw error;
    }
    if (!data) {
        return null;
    }

    return toCustomer(data);
}

async function create(customer: Omit<Customer, "role">) {
    const { birth_date, ...personData } = customer;

    const person = await PersonModel.create({
        ...personData,
        role: "customer"
    });

    const { data, error } = await supabase
        .from("customers")
        .insert({ person_id: person.id, birth_date })
        .select("id, person_id, birth_date")
        .single();

    if (error) {
        await PersonModel.remove(person.id);
        throw error;
    }

    return { ...person, ...data };
}

async function update(id: string, customer: Partial<Customer>) {
    const existing = await findById(id);
    if (!existing) return null;

    const { birth_date, role, ...personData } = customer;

    if (birth_date !== undefined) {
        const { error } = await supabase
            .from("customers")
            .update({ birth_date })
            .eq("id", id);

        if (error) throw error;
    }

    if (Object.keys(personData).length) {
        await PersonModel.update(existing.person_id, personData);
    }

    return findById(id);
}

async function remove(id: string) {
    const existing = await findById(id);
    if (!existing) return null;

    const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

    if (error) throw error;

    await PersonModel.remove(existing.person_id);

    return existing;
}

async function searchByKeyword(keyword: string) {
    const { data, error } = await supabase
    .from("customer")
    .select("*")
    .or(`name.ilike.%${keyword}%,email.ilike.%${keyword}%`);

    if(error) {
        throw error;
    }

    return data;
}

export default {
    findAll,
    findById,
    create,
    update,
    remove,
    searchByKeyword,
}
