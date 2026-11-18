
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: {
    from: mocks.from,
  },
}));

import Genres from "../models/Genres.js";

describe("Genres - Testes Unitários", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar os gêneros cadastrados", async () => {
    const genres = [
      { id: "1", name: "Ação", active: true },
      { id: "2", name: "RPG", active: true },
    ];

    const select = vi.fn().mockResolvedValue({
      data: genres,
      error: null,
    });

    mocks.from.mockReturnValue({ select });

    const result = await Genres.findAll();

    expect(mocks.from).toHaveBeenCalledWith("genres");
    expect(select).toHaveBeenCalledWith("*");
    expect(result).toEqual(genres);
  });

  it("deve lançar erro quando a consulta falhar", async () => {
    const databaseError = new Error("Falha no banco");

    const select = vi.fn().mockResolvedValue({
      data: null,
      error: databaseError,
    });

    mocks.from.mockReturnValue({ select });

    await expect(Genres.findAll()).rejects.toThrow(
      "Falha no banco"
    );
  });


it("deve buscar um gênero pelo ID", async () => {
  const genre = {
    id: "1",
    name: "Ação",
    description: "Jogos de ação",
    active: true,
  };

  const single = vi.fn().mockResolvedValue({
    data: genre,
    error: null,
  });

  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });

  mocks.from.mockReturnValue({ select });

  const result = await Genres.findById("1");

  expect(mocks.from).toHaveBeenCalledWith("genres");
  expect(select).toHaveBeenCalledWith("*");
  expect(eq).toHaveBeenCalledWith("id", "1");
  expect(single).toHaveBeenCalled();
  expect(result).toEqual(genre);
});


it("deve criar um gênero com sucesso", async () => {
  const newGenre = {
    name: "Aventura",
    description: "Jogos de aventura",
    active: true,
  };

  const createdGenre = {
    id: "3",
    ...newGenre,
  };

  const single = vi.fn().mockResolvedValue({
    data: createdGenre,
    error: null,
  });

  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });

  mocks.from.mockReturnValue({ insert });

  const result = await Genres.create(newGenre);

  expect(mocks.from).toHaveBeenCalledWith("genres");
  expect(insert).toHaveBeenCalledWith(newGenre);
  expect(select).toHaveBeenCalled();
  expect(single).toHaveBeenCalled();
  expect(result).toEqual(createdGenre);
});



it("deve atualizar um gênero com sucesso", async () => {
  const updatedGenre = {
    name: "RPG",
    description: "Jogos de RPG atualizados",
    active: true,
  };

  const savedGenre = {
    id: "1",
    ...updatedGenre,
  };

  const single = vi.fn().mockResolvedValue({
    data: savedGenre,
    error: null,
  });

  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });

  mocks.from.mockReturnValue({ update });

  const result = await Genres.update("1", updatedGenre);

  expect(mocks.from).toHaveBeenCalledWith("genres");
  expect(update).toHaveBeenCalledWith(updatedGenre);
  expect(eq).toHaveBeenCalledWith("id", "1");
  expect(select).toHaveBeenCalled();
  expect(single).toHaveBeenCalled();
  expect(result).toEqual(savedGenre);
});



it("deve remover um gênero com sucesso", async () => {
  const removedGenre = {
    id: "1",
    name: "Ação",
    active: true,
  };

  const select = vi.fn().mockResolvedValue({
    data: [removedGenre],
    error: null,
  });

  const eq = vi.fn().mockReturnValue({ select });
  const deleteMock = vi.fn().mockReturnValue({ eq });

  mocks.from.mockReturnValue({
    delete: deleteMock,
  });

  const result = await Genres.remove("1");

  expect(mocks.from).toHaveBeenCalledWith("genres");
  expect(deleteMock).toHaveBeenCalled();
  expect(eq).toHaveBeenCalledWith("id", "1");
  expect(select).toHaveBeenCalled();
  expect(result).toEqual([removedGenre]);
});

});

