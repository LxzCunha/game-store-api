import type { PostgrestError } from "@supabase/supabase-js";
import { NotFoundError } from "../errors/NotFoundError.js";

export function isInvalidId(error: PostgrestError): boolean {
    return error.code === "22P02";
}

export function notFoundOrThrow(error: PostgrestError, message: string): never {
    if (isInvalidId(error)) {
        throw new NotFoundError(message);
    }
    throw error;
}
