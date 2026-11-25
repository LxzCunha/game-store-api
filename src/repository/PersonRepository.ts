import type { PostgrestError } from "@supabase/supabase-js";
import supabase from "../config/supabase.js";
import { ConflictError } from "../errors/ConflictError.js";
import type { Person } from "../models/Person.js";

function conflictOrThrow(error: PostgrestError): never {
    if (error.code === "23505") {
        throw new ConflictError("Já existe um cadastro com o e-mail informado.");
    }
    throw error;
}

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
        conflictOrThrow(error);
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
        conflictOrThrow(error);
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
