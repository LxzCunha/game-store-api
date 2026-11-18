import { ValidationError } from "../errors/ValidationError.js";

export class Genre {
    private id: string | undefined;
    private name: string;
    private description: string | null;
    private active: boolean;

    constructor(name: string, description?: string | null) {
        this.id = undefined;
        this.name = "";
        this.description = null;
        this.active = true;

        this.rename(name);

        if (description !== undefined) {
            this.changeDescription(description);
        }
    }

    static restore(id: string, name: string, description: string | null, active: boolean): Genre {
        const genre = new Genre(name, description);

        genre.id = id;
        genre.active = active;

        return genre;
    }

    public getId(): string | undefined {
        return this.id;
    }
    public getName(): string {
        return this.name;
    }
    public getDescription(): string | null {
        return this.description;
    }
    public isActive(): boolean {
        return this.active;
    }

    rename(name: string): void {
        if (typeof name !== "string" || name.trim().length === 0) {
            throw new ValidationError("O nome do gênero é obrigatório.");
        }
        this.name = name.trim();
    }
    changeDescription(description: string | null): void {
        if (description !== null && typeof description !== "string") {
            throw new ValidationError("A descrição do gênero deve ser um texto.");
        }
        this.description = description;
    }

    activate(): void {
        this.active = true;
    }
    deactivate(): void {
        this.active = false;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            active: this.active,
        };
    }
}
