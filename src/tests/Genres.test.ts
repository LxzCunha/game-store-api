import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: {
    from: mocks.from,
  },
}));

import { Genre } from "../models/Genres.js";
import GenresRepository from "../repository/GenresRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ValidationError } from "../errors/ValidationError.js";

const ID = "11111111-1111-4111-8111-111111111111";

const row = {
  id: ID,
  name: "Ação",
  description: "Jogos de ação",
  active: true,
};

describe("Genre - Entidade", () => {
  it("deve criar um gênero ativo, sem ID e com o nome sem espaços nas pontas", () => {
    const genre = new Genre("  RPG  ", "Jogos de RPG");

    expect(genre.getId()).toBeUndefined();
    expect(genre.getName()).toBe("RPG");
    expect(genre.getDescription()).toBe("Jogos de RPG");
    expect(genre.isActive()).toBe(true);
  });

  it("deve usar descrição nula quando ela não for informada", () => {
    expect(new Genre("RPG").getDescription()).toBeNull();
  });

  it.each([undefined, "", "   ", 123])("deve rejeitar o nome %j", (name) => {
    expect(() => new Genre(name as string)).toThrow(ValidationError);
  });

  it("deve rejeitar uma descrição que não seja texto", () => {
    expect(() => new Genre("RPG", 10 as unknown as string)).toThrow(
      "A descrição do gênero deve ser um texto."
    );
  });

  it("deve ativar e desativar o gênero", () => {
    const genre = new Genre("RPG");

    genre.deactivate();
    expect(genre.isActive()).toBe(false);

    genre.activate();
    expect(genre.isActive()).toBe(true);
  });

  it("deve restaurar um gênero do banco com ID e status", () => {
    const genre = Genre.restore(ID, "Ação", null, false);

    expect(genre.getId()).toBe(ID);
    expect(genre.isActive()).toBe(false);
    expect(genre.toJSON()).toEqual({ id: ID, name: "Ação", description: null, active: false });
  });
});

describe("GenresRepository - Testes Unitários", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar os gêneros cadastrados como entidades", async () => {
    const select = vi.fn().mockResolvedValue({ data: [row], error: null });
    mocks.from.mockReturnValue({ select });

    const result = await GenresRepository.findAll();

    expect(mocks.from).toHaveBeenCalledWith("genres");
    expect(select).toHaveBeenCalledWith("*");
    expect(result[0]).toBeInstanceOf(Genre);
    expect(result.map((genre) => genre.toJSON())).toEqual([row]);
  });

  it("deve lançar erro quando a consulta falhar", async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: new Error("Falha no banco") });
    mocks.from.mockReturnValue({ select });

    await expect(GenresRepository.findAll()).rejects.toThrow("Falha no banco");
  });

  it("deve buscar um gênero pelo ID", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    const result = await GenresRepository.findById(ID);

    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(result.toJSON()).toEqual(row);
  });

  it("deve lançar NotFoundError quando o gênero não existir", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(GenresRepository.findById(ID)).rejects.toThrow(NotFoundError);
  });

  it("deve lançar NotFoundError quando o ID não for um UUID (erro 22P02)", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(GenresRepository.findById("abc")).rejects.toThrow(NotFoundError);
  });

  it("deve criar um gênero gravando os dados da entidade", async () => {
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValue({ insert });

    const result = await GenresRepository.create(new Genre("Ação", "Jogos de ação"));

    expect(mocks.from).toHaveBeenCalledWith("genres");
    expect(insert).toHaveBeenCalledWith({ name: "Ação", description: "Jogos de ação", active: true });
    expect(result.getId()).toBe(ID);
  });

  it("deve atualizar um gênero pelo ID da entidade", async () => {
    const saved = { ...row, name: "RPG", active: false };
    const maybeSingle = vi.fn().mockResolvedValue({ data: saved, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ update });

    const genre = Genre.restore(ID, "Ação", "Jogos de ação", true);
    genre.rename("RPG");
    genre.deactivate();

    const result = await GenresRepository.update(genre);

    expect(update).toHaveBeenCalledWith({ name: "RPG", description: "Jogos de ação", active: false });
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(result.toJSON()).toEqual(saved);
  });

  it("deve recusar atualizar um gênero sem ID", async () => {
    await expect(GenresRepository.update(new Genre("RPG"))).rejects.toThrow(
      "Gênero sem ID não pode ser atualizado."
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("deve remover um gênero e devolver o registro removido", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const deleteMock = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ delete: deleteMock });

    const result = await GenresRepository.remove(ID);

    expect(deleteMock).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(result.toJSON()).toEqual(row);
  });

  it("deve lançar NotFoundError ao remover um gênero que não existe", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) });

    await expect(GenresRepository.remove(ID)).rejects.toThrow(NotFoundError);
  });

  it("deve propagar a violação de chave estrangeira ao remover", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: foreignKeyError });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) });

    await expect(GenresRepository.remove(ID)).rejects.toBe(foreignKeyError);
  });
});
