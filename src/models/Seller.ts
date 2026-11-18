import { ValidationError } from "../errors/ValidationError.js";
import { Person, type PersonData, type Role } from "./Person.js";
import { isDate } from "./validation.js";

export type SellerData = PersonData & {
    hire_date?: string | null;
};

export class Seller extends Person {
    private id: string | undefined;
    private hireDate: string | null;

    constructor(data: SellerData) {
        super(data);

        this.id = undefined;
        this.hireDate = null;

        if (data.hire_date !== undefined) {
            this.changeHireDate(data.hire_date);
        }
    }

    static restore(data: SellerData & { id: string; person_id: string }): Seller {
        const seller = new Seller(data);

        seller.id = data.id;
        seller.personId = data.person_id;

        return seller;
    }

    getRole(): Role {
        return "seller";
    }

    public getId(): string | undefined {
        return this.id;
    }
    public getHireDate(): string | null {
        return this.hireDate;
    }

    changeHireDate(hireDate: string | null): void {
        if (hireDate !== null && !isDate(hireDate)) {
            throw new ValidationError("A data de contratação deve estar no formato AAAA-MM-DD.");
        }
        this.hireDate = hireDate;
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
            hire_date: this.hireDate,
        };
    }
}
