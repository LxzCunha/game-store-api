import { ValidationError } from "../errors/ValidationError.js";
import { isOptionalText } from "./validation.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PersonData = {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
};

export type Role = "customer" | "seller";

export abstract class Person {
    protected personId: string | undefined;
    private name: string;
    private email: string;
    private phone: string | null;
    private address: string | null;

    constructor(data: PersonData) {
        this.personId = undefined;
        this.name = "";
        this.email = "";
        this.phone = null;
        this.address = null;

        this.rename(data.name);
        this.changeEmail(data.email);

        if (data.phone !== undefined) {
            this.changePhone(data.phone);
        }
        if (data.address !== undefined) {
            this.changeAddress(data.address);
        }
    }

    abstract getRole(): Role;

    public getPersonId(): string | undefined {
        return this.personId;
    }
    public getName(): string {
        return this.name;
    }
    public getEmail(): string {
        return this.email;
    }
    public getPhone(): string | null {
        return this.phone;
    }
    public getAddress(): string | null {
        return this.address;
    }

    rename(name: string): void {
        if (typeof name !== "string" || name.trim().length === 0) {
            throw new ValidationError("O nome é obrigatório.");
        }
        this.name = name.trim();
    }
    changeEmail(email: string): void {
        if (typeof email !== "string" || !EMAIL.test(email.trim())) {
            throw new ValidationError("Informe um e-mail válido.");
        }
        this.email = email.trim();
    }
    changePhone(phone: string | null): void {
        if (!isOptionalText(phone)) {
            throw new ValidationError("O telefone deve ser um texto.");
        }
        this.phone = phone;
    }
    changeAddress(address: string | null): void {
        if (!isOptionalText(address)) {
            throw new ValidationError("O endereço deve ser um texto.");
        }
        this.address = address;
    }
}
