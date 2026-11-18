const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID.test(value);
}

export function isDate(value: unknown): value is string {
    if (typeof value !== "string" || !DATE.test(value)) {
        return false;
    }

    const date = new Date(value);

    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isOptionalText(value: unknown): value is string | null {
    return value === null || typeof value === "string";
}
