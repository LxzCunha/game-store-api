import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: {
    from: mocks.from,
  },
}));

import { Game, type GameData } from "../models/Games.js";
import GamesRepository from "../repository/GamesRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ValidationError } from "../errors/ValidationError.js";

const ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "33333333-3333-4333-8333-333333333333";
const GENRE_ID = "22222222-2222-4222-8222-222222222222";

const data: GameData = {
  genre_id: GENRE_ID,
  title: "Minecraft",
  description: "Jogo de aventura e construção",
  price: 99.9,
  stock_quantity: 50,
  release_date: "2011-11-18",
  developer: "Mojang",
  image: "minecraft.jpg",
};

const row = { id: ID, ...data, active: true };

const otherRow = {
  id: OTHER_ID,
  genre_id: GENRE_ID,
  title: "Stardew Valley",
  description: null,
  price: 24.9,
  stock_quantity: 0,
  release_date: null,
  developer: null,
  image: null,
  active: true,
};

const withData = (overrides: Record<string, unknown>) =>
  ({ ...data, ...overrides }) as unknown as GameData;

describe("Game - Entidade", () => {
  it("deve criar um jogo ativo, sem ID, com todos os campos e o título sem espaços nas pontas", () => {
    const game = new Game({ ...data, title: "  Minecraft  " });

    expect(game.getId()).toBeUndefined();
    expect(game.getGenreId()).toBe(GENRE_ID);
    expect(game.getTitle()).toBe("Minecraft");
    expect(game.getDescription()).toBe("Jogo de aventura e construção");
    expect(game.getPrice()).toBe(99.9);
    expect(game.getStockQuantity()).toBe(50);
    expect(game.getReleaseDate()).toBe("2011-11-18");
    expect(game.getDeveloper()).toBe("Mojang");
    expect(game.getImage()).toBe("minecraft.jpg");
    expect(game.isActive()).toBe(true);
  });

  it("deve usar os valores padrão quando os campos opcionais não forem informados", () => {
    const game = new Game({ genre_id: GENRE_ID, title: "Minecraft", price: 99.9 });

    expect(game.getStockQuantity()).toBe(0);
    expect(game.getDescription()).toBeNull();
    expect(game.getReleaseDate()).toBeNull();
    expect(game.getDeveloper()).toBeNull();
    expect(game.getImage()).toBeNull();
    expect(game.isActive()).toBe(true);
  });

  it("deve aceitar preço e estoque iguais a zero", () => {
    const game = new Game({ ...data, price: 0, stock_quantity: 0 });

    expect(game.getPrice()).toBe(0);
    expect(game.getStockQuantity()).toBe(0);
  });

  it("deve aceitar null nos campos de texto opcionais e na data de lançamento", () => {
    const game = new Game({ ...data, description: null, release_date: null, developer: null, image: null });

    expect(game.getDescription()).toBeNull();
    expect(game.getReleaseDate()).toBeNull();
    expect(game.getDeveloper()).toBeNull();
    expect(game.getImage()).toBeNull();
  });

  it.each([undefined, "", "10", "abc", 123, "11111111-1111-4111-8111-11111111111"])(
    "deve rejeitar o genre_id %j",
    (genreId) => {
      expect(() => new Game(withData({ genre_id: genreId }))).toThrow(
        "O gênero do jogo (genre_id) deve ser um UUID válido."
      );
    }
  );

  it.each([undefined, "", "   ", 123, null])("deve rejeitar o título %j", (title) => {
    expect(() => new Game(withData({ title }))).toThrow("O título do jogo é obrigatório.");
  });

  it.each([
    ["ausente", undefined],
    ["nulo", null],
    ["negativo", -1],
    ["em texto (\"349.90\")", "349.90"],
    ["NaN", NaN],
    ["infinito", Infinity],
  ])("deve rejeitar o preço %s", (_label, price) => {
    expect(() => new Game(withData({ price }))).toThrow(
      "O preço do jogo deve ser um número maior ou igual a zero."
    );
  });

  it.each([-1, 1.5, "10", null])("deve rejeitar a quantidade em estoque %j", (stockQuantity) => {
    expect(() => new Game(withData({ stock_quantity: stockQuantity }))).toThrow(
      "A quantidade em estoque deve ser um número inteiro maior ou igual a zero."
    );
  });

  it.each([
    ["description", "A descrição do jogo deve ser um texto."],
    ["developer", "A desenvolvedora do jogo deve ser um texto."],
    ["image", "A imagem do jogo deve ser um texto."],
  ])("deve rejeitar o campo %s quando não for texto", (field, message) => {
    expect(() => new Game(withData({ [field]: 10 }))).toThrow(message);
  });

  it.each(["2023-02-30", "2023-13-01", "18/11/2011", "2011-11-18T00:00:00Z", "", 20111118])(
    "deve rejeitar a data de lançamento %j",
    (releaseDate) => {
      expect(() => new Game(withData({ release_date: releaseDate }))).toThrow(
        "A data de lançamento deve estar no formato AAAA-MM-DD."
      );
    }
  );

  it("deve aceitar uma data de lançamento em ano bissexto", () => {
    expect(new Game({ ...data, release_date: "2024-02-29" }).getReleaseDate()).toBe("2024-02-29");
  });

  it("deve lançar ValidationError e manter o valor anterior quando uma alteração for rejeitada", () => {
    const game = new Game(data);

    expect(() => game.changePrice(-5)).toThrow(ValidationError);
    expect(() => game.rename("   ")).toThrow(ValidationError);
    expect(game.getPrice()).toBe(99.9);
    expect(game.getTitle()).toBe("Minecraft");
  });

  it("deve ativar e desativar o jogo", () => {
    const game = new Game(data);

    game.deactivate();
    expect(game.isActive()).toBe(false);

    game.activate();
    expect(game.isActive()).toBe(true);
  });

  it("deve restaurar um jogo do banco com ID e status", () => {
    const game = Game.restore({ ...row, active: false });

    expect(game.getId()).toBe(ID);
    expect(game.isActive()).toBe(false);
    expect(game.toJSON()).toEqual({
      id: ID,
      genre_id: GENRE_ID,
      title: "Minecraft",
      description: "Jogo de aventura e construção",
      price: 99.9,
      stock_quantity: 50,
      release_date: "2011-11-18",
      developer: "Mojang",
      image: "minecraft.jpg",
      active: false,
    });
  });
});

describe("GamesRepository - Testes Unitários", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar os jogos cadastrados como entidades", async () => {
    const select = vi.fn().mockResolvedValue({ data: [row, otherRow], error: null });
    mocks.from.mockReturnValue({ select });

    const result = await GamesRepository.findAll();

    expect(mocks.from).toHaveBeenCalledWith("games");
    expect(select).toHaveBeenCalledWith("*");
    expect(result[0]).toBeInstanceOf(Game);
    expect(result.map((game) => game.toJSON())).toEqual([row, otherRow]);
  });

  it("deve lançar erro quando a consulta de jogos falhar", async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: new Error("Falha no banco") });
    mocks.from.mockReturnValue({ select });

    await expect(GamesRepository.findAll()).rejects.toThrow("Falha no banco");
    expect(mocks.from).toHaveBeenCalledWith("games");
    expect(select).toHaveBeenCalledWith("*");
  });

  it("deve buscar um jogo pelo ID", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    const result = await GamesRepository.findById(ID);

    expect(mocks.from).toHaveBeenCalledWith("games");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(maybeSingle).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Game);
    expect(result.toJSON()).toEqual(row);
  });

  it("deve lançar NotFoundError quando o jogo não existir", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(GamesRepository.findById(ID)).rejects.toThrow("Jogo não encontrado.");
  });

  it("deve lançar NotFoundError quando o ID não for um UUID (erro 22P02)", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(GamesRepository.findById("1")).rejects.toThrow(NotFoundError);
  });

  it("deve propagar outros erros do banco ao buscar pelo ID", async () => {
    const databaseError = { code: "XX000", message: "Falha no banco" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: databaseError });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(GamesRepository.findById(ID)).rejects.toBe(databaseError);
  });

  it("deve buscar jogos por gênero", async () => {
    const eq = vi.fn().mockResolvedValue({ data: [row], error: null });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    const result = await GamesRepository.findByGenre(GENRE_ID);

    expect(mocks.from).toHaveBeenCalledWith("games");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("genre_id", GENRE_ID);
    expect(result[0]).toBeInstanceOf(Game);
    expect(result.map((game) => game.toJSON())).toEqual([row]);
  });

  it("deve devolver lista vazia quando o ID do gênero não for um UUID (erro 22P02)", async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(GamesRepository.findByGenre("10")).resolves.toEqual([]);
  });

  it("deve propagar outros erros do banco ao buscar por gênero", async () => {
    const databaseError = { code: "XX000", message: "Falha no banco" };
    const eq = vi.fn().mockResolvedValue({ data: null, error: databaseError });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(GamesRepository.findByGenre(GENRE_ID)).rejects.toBe(databaseError);
  });

  it("deve criar um jogo gravando os dados da entidade", async () => {
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValue({ insert });

    const result = await GamesRepository.create(new Game(data));

    expect(mocks.from).toHaveBeenCalledWith("games");
    expect(insert).toHaveBeenCalledWith({ ...data, active: true });
    expect(select).toHaveBeenCalled();
    expect(single).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Game);
    expect(result.toJSON()).toEqual(row);
  });

  it("deve gravar os valores padrão dos campos opcionais ao criar", async () => {
    const single = vi.fn().mockResolvedValue({ data: otherRow, error: null });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    mocks.from.mockReturnValue({ insert });

    const game = new Game({ genre_id: GENRE_ID, title: "Stardew Valley", price: 24.9 });
    game.deactivate();

    await GamesRepository.create(game);

    expect(insert).toHaveBeenCalledWith({
      genre_id: GENRE_ID,
      title: "Stardew Valley",
      description: null,
      price: 24.9,
      stock_quantity: 0,
      release_date: null,
      developer: null,
      image: null,
      active: false,
    });
  });

  it("deve propagar a violação de chave estrangeira ao criar", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    const single = vi.fn().mockResolvedValue({ data: null, error: foreignKeyError });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    mocks.from.mockReturnValue({ insert });

    await expect(GamesRepository.create(new Game(data))).rejects.toBe(foreignKeyError);
  });

  it("deve atualizar um jogo pelo ID da entidade", async () => {
    const saved = { ...row, description: "Jogo de aventura atualizado", price: 89.9, stock_quantity: 40 };
    const maybeSingle = vi.fn().mockResolvedValue({ data: saved, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ update });

    const game = Game.restore(row);
    game.changeDescription("Jogo de aventura atualizado");
    game.changePrice(89.9);
    game.changeStockQuantity(40);

    const result = await GamesRepository.update(game);

    expect(mocks.from).toHaveBeenCalledWith("games");
    expect(update).toHaveBeenCalledWith({
      ...data,
      description: "Jogo de aventura atualizado",
      price: 89.9,
      stock_quantity: 40,
      active: true,
    });
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(select).toHaveBeenCalled();
    expect(maybeSingle).toHaveBeenCalled();
    expect(result.toJSON()).toEqual(saved);
  });

  it("deve recusar atualizar um jogo sem ID", async () => {
    await expect(GamesRepository.update(new Game(data))).rejects.toThrow(
      "Jogo sem ID não pode ser atualizado."
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("deve lançar NotFoundError ao atualizar um jogo que não existe", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) });

    await expect(GamesRepository.update(Game.restore(row))).rejects.toThrow(NotFoundError);
  });

  it("deve propagar a violação de chave estrangeira ao atualizar", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: foreignKeyError });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) });

    await expect(GamesRepository.update(Game.restore(row))).rejects.toBe(foreignKeyError);
  });

  it("deve remover um jogo e devolver o registro removido", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const deleteMock = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ delete: deleteMock });

    const result = await GamesRepository.remove(ID);

    expect(mocks.from).toHaveBeenCalledWith("games");
    expect(deleteMock).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(select).toHaveBeenCalled();
    expect(maybeSingle).toHaveBeenCalled();
    expect(result.toJSON()).toEqual(row);
  });

  it("deve lançar NotFoundError ao remover um jogo que não existe", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) });

    await expect(GamesRepository.remove(ID)).rejects.toThrow(NotFoundError);
  });

  it("deve lançar NotFoundError ao remover com um ID que não é UUID (erro 22P02)", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) });

    await expect(GamesRepository.remove("1")).rejects.toThrow(NotFoundError);
  });

  it("deve propagar a violação de chave estrangeira ao remover", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: foreignKeyError });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) });

    await expect(GamesRepository.remove(ID)).rejects.toBe(foreignKeyError);
  });
});
