import supabase from "../config/supabase.js";
import PersonModel, { type Person } from "./Person.js";


type Seller = Person & {
    hire_date: string;
};

function toSeller(row: any) {
    const { person, ...seller } = row;
    return { ...person, ...seller };
}

async function findAll() {
    const { data, error } = await supabase
    .from("seller")
    .select("hire_date, person(*)");

    if (error) throw error;

    return data.map(toSeller);
}

async function findById(id: string) {
    const { data, error } = await supabase
        .from("seller")
        .select("hire_date, person(*)")
        .eq("person_id", id)
        .single();

    if (error){
        throw error;
    }
    if (!data) {
        return null;
    }

    return toSeller(data);
}

async function create(seller: Omit<Seller, "role">) {
    const { hire_date, ...personData } = seller;

    const person = await PersonModel.create({
        ...personData,
        role: "seller"
    });

    const { error } = await supabase
        .from("seller")
        .insert({ person_id: person.id, hire_date });

    if (error) {
        await PersonModel.remove(person.id);
        throw error;
    }

    return { ...person, hire_date };
}

async function update(id: string, seller: Partial<Seller>) {
    const existing = await findById(id);
    if (!existing) return null;

    const { hire_date, role, ...personData } = seller;

    if (hire_date !== undefined) {
        const { error } = await supabase
            .from("seller")
            .update({ hire_date })
            .eq("person_id", id);

        if (error) throw error;
    }

    if (Object.keys(personData).length) {
        await PersonModel.update(id, personData);
    }

    return findById(id);
}

async function remove(id: string) {
    const existing = await findById(id);
    if (!existing) return null;

    await PersonModel.remove(id);

    return existing;
}

export default {
    findAll,
    findById,
    create,
    update,
    remove
}
