import supabase from "../config/supabase.js";
import type { Person } from "../models/Person.js";

function toRow(person: Person) {
    return {
        name: person.getName(),
        email: person.getEmail(),
        role: person.getRole(),
        phone: person.getPhone(),
        address: person.getAddress(),
    };
}

async function create(person: Person): Promise<string> {
    const { data, error } = await supabase
        .from("people")
        .insert(toRow(person))
        .select("id")
        .single();

    if (error) {
        throw error;
    }

    return data.id;
}

async function update(person: Person): Promise<void> {
    const personId = person.getPersonId();

    if (!personId) {
        throw new Error("Pessoa sem ID não pode ser atualizada.");
    }

    const { error } = await supabase
        .from("people")
        .update(toRow(person))
        .eq("id", personId);

    if (error) {
        throw error;
    }
}

async function remove(personId: string): Promise<void> {
    const { error } = await supabase
        .from("people")
        .delete()
        .eq("id", personId);

    if (error) {
        throw error;
    }
}

export default {
    create,
    update,
    remove
}
