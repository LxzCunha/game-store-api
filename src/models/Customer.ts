import { ValidationError } from "../errors/ValidationError.js";
import { Person, type PersonData, type Role } from "./Person.js";
import { isDate } from "./validation.js";

export type CustomerData = PersonData & {
    birth_date?: string | null;
};

export class Customer extends Person {
    private id: string | undefined;
    private birthDate: string | null;

    constructor(data: CustomerData) {
        super(data);

        this.id = undefined;
        this.birthDate = null;

        if (data.birth_date !== undefined) {
            this.changeBirthDate(data.birth_date);
        }
    }

    static restore(data: CustomerData & { id: string; person_id: string }): Customer {
        const customer = new Customer(data);

        customer.id = data.id;
        customer.personId = data.person_id;

        return customer;
    }

    getRole(): Role {
        return "customer";
    }

    public getId(): string | undefined {
        return this.id;
    }
    public getBirthDate(): string | null {
        return this.birthDate;
    }

    changeBirthDate(birthDate: string | null): void {
        if (birthDate !== null && !isDate(birthDate)) {
            throw new ValidationError("A data de nascimento deve estar no formato AAAA-MM-DD.");
        }
        this.birthDate = birthDate;
    }

    toJSON() {
        return {
            id: this.id,
            person_id: this.getPersonId(),
            name: this.getName(),
            email: this.getEmail(),
            role: this.getRole(),
            phone: this.getPhone(),
            address: this.getAddress(),
            birth_date: this.birthDate,
        };
    }
}
