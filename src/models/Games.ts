import { ValidationError } from "../errors/ValidationError.js";
import { isDate, isOptionalText, isUuid } from "./validation.js";

export type GameData = {
    genre_id: string;
    title: string;
    price: number;
    stock_quantity?: number;
    description?: string | null;
    release_date?: string | null;
    developer?: string | null;
    image?: string | null;
};

export class Game {
    private id: string | undefined;
    private genreId: string;
    private title: string;
    private description: string | null;
    private price: number;
    private stockQuantity: number;
    private releaseDate: string | null;
    private developer: string | null;
    private image: string | null;
    private active: boolean;

    constructor(data: GameData) {
        this.id = undefined;
        this.genreId = "";
        this.title = "";
        this.description = null;
        this.price = 0;
        this.stockQuantity = 0;
        this.releaseDate = null;
        this.developer = null;
        this.image = null;
        this.active = true;

        this.changeGenre(data.genre_id);
        this.rename(data.title);
        this.changePrice(data.price);

        if (data.stock_quantity !== undefined) {
            this.changeStockQuantity(data.stock_quantity);
        }
        if (data.description !== undefined) {
            this.changeDescription(data.description);
        }
        if (data.release_date !== undefined) {
            this.changeReleaseDate(data.release_date);
        }
        if (data.developer !== undefined) {
            this.changeDeveloper(data.developer);
        }
        if (data.image !== undefined) {
            this.changeImage(data.image);
        }
    }

    static restore(data: GameData & { id: string; active: boolean }): Game {
        const game = new Game(data);

        game.id = data.id;
        game.active = data.active;

        return game;
    }

    public getId(): string | undefined {
        return this.id;
    }
    public getGenreId(): string {
        return this.genreId;
    }
    public getTitle(): string {
        return this.title;
    }
    public getDescription(): string | null {
        return this.description;
    }
    public getPrice(): number {
        return this.price;
    }
    public getStockQuantity(): number {
        return this.stockQuantity;
    }
    public getReleaseDate(): string | null {
        return this.releaseDate;
    }
    public getDeveloper(): string | null {
        return this.developer;
    }
    public getImage(): string | null {
        return this.image;
    }
    public isActive(): boolean {
        return this.active;
    }

    changeGenre(genreId: string): void {
        if (!isUuid(genreId)) {
            throw new ValidationError("O gênero do jogo (genre_id) deve ser um UUID válido.");
        }
        this.genreId = genreId;
    }
    rename(title: string): void {
        if (typeof title !== "string" || title.trim().length === 0) {
            throw new ValidationError("O título do jogo é obrigatório.");
        }
        this.title = title.trim();
    }
    changeDescription(description: string | null): void {
        if (!isOptionalText(description)) {
            throw new ValidationError("A descrição do jogo deve ser um texto.");
        }
        this.description = description;
    }
    changePrice(price: number): void {
        if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
            throw new ValidationError("O preço do jogo deve ser um número maior ou igual a zero.");
        }
        this.price = price;
    }
    changeStockQuantity(stockQuantity: number): void {
        if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
            throw new ValidationError("A quantidade em estoque deve ser um número inteiro maior ou igual a zero.");
        }
        this.stockQuantity = stockQuantity;
    }
    changeReleaseDate(releaseDate: string | null): void {
        if (releaseDate !== null && !isDate(releaseDate)) {
            throw new ValidationError("A data de lançamento deve estar no formato AAAA-MM-DD.");
        }
        this.releaseDate = releaseDate;
    }
    changeDeveloper(developer: string | null): void {
        if (!isOptionalText(developer)) {
            throw new ValidationError("A desenvolvedora do jogo deve ser um texto.");
        }
        this.developer = developer;
    }
    changeImage(image: string | null): void {
        if (!isOptionalText(image)) {
            throw new ValidationError("A imagem do jogo deve ser um texto.");
        }
        this.image = image;
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
            genre_id: this.genreId,
            title: this.title,
            description: this.description,
            price: this.price,
            stock_quantity: this.stockQuantity,
            release_date: this.releaseDate,
            developer: this.developer,
            image: this.image,
            active: this.active,
        };
    }
}
