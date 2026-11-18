
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: {
    from: mocks.from,
  },
}));

import Games from "../models/Games.js";

describe("Games - Testes Unitários", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


it("deve listar os jogos cadastrados", async () => {
  const games = [
    {
      id: "1",
      title: "Minecraft",
      price: 99.90,
      active: true,
    },
    {
      id: "2",
      title: "Stardew Valley",
      price: 24.90,
      active: true,
    },
  ];

  const select = vi.fn().mockResolvedValue({
    data: games,
    error: null,
  });

  mocks.from.mockReturnValue({ select });

  const result = await Games.findAll();

  expect(mocks.from).toHaveBeenCalledWith("games");
  expect(select).toHaveBeenCalledWith("*");
  expect(result).toEqual(games);
});

it("deve lançar erro quando a consulta de jogos falhar", async () => {
  const databaseError = new Error("Falha no banco");

  const select = vi.fn().mockResolvedValue({
    data: null,
    error: databaseError,
  });

  mocks.from.mockReturnValue({ select });

  await expect(Games.findAll()).rejects.toThrow(
    "Falha no banco"
  );

  expect(mocks.from).toHaveBeenCalledWith("games");
  expect(select).toHaveBeenCalledWith("*");
});


it("deve buscar um jogo pelo ID", async () => {
  const game = {
    id: "1",
    title: "Minecraft",
    price: 99.90,
    active: true,
  };

  const single = vi.fn().mockResolvedValue({
    data: game,
    error: null,
  });

  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });

  mocks.from.mockReturnValue({ select });

  const result = await Games.findById("1");

  expect(mocks.from).toHaveBeenCalledWith("games");
  expect(select).toHaveBeenCalledWith("*");
  expect(eq).toHaveBeenCalledWith("id", "1");
  expect(single).toHaveBeenCalled();
  expect(result).toEqual(game);
});

it("deve buscar jogos por gênero", async () => {
  const games = [
    {
      id: "1",
      genre_id: "10",
      title: "Minecraft",
      price: 99.90,
      active: true,
    },
  ];

  const eq = vi.fn().mockResolvedValue({
    data: games,
    error: null,
  });

  const select = vi.fn().mockReturnValue({ eq });

  mocks.from.mockReturnValue({ select });

  const result = await Games.findByGenre("10");

  expect(mocks.from).toHaveBeenCalledWith("games");
  expect(select).toHaveBeenCalledWith("*");
  expect(eq).toHaveBeenCalledWith("genre_id", "10");
  expect(result).toEqual(games);
});

it("deve criar um jogo com sucesso", async () => {
  const newGame = {
    genre_id: "10",
    title: "Minecraft",
    description: "Jogo de aventura e construção",
    price: 99.90,
    stock_quantity: 50,
    release_date: "2011-11-18",
    developer: "Mojang",
    image: "minecraft.jpg",
    active: true,
  };

  const createdGame = {
    id: "1",
    ...newGame,
  };

  const single = vi.fn().mockResolvedValue({
    data: createdGame,
    error: null,
  });

  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });

  mocks.from.mockReturnValue({ insert });

  const result = await Games.create(newGame);

  expect(mocks.from).toHaveBeenCalledWith("games");
  expect(insert).toHaveBeenCalledWith(newGame);
  expect(select).toHaveBeenCalled();
  expect(single).toHaveBeenCalled();
  expect(result).toEqual(createdGame);
});


it("deve atualizar um jogo com sucesso", async () => {
  const updatedGame = {
    genre_id: "10",
    title: "Minecraft",
    description: "Jogo de aventura atualizado",
    price: 89.90,
    stock_quantity: 40,
    release_date: "2011-11-18",
    developer: "Mojang",
    image: "minecraft.jpg",
    active: true,
  };

  const savedGame = {
    id: "1",
    ...updatedGame,
  };

  const single = vi.fn().mockResolvedValue({
    data: savedGame,
    error: null,
  });

  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });

  mocks.from.mockReturnValue({ update });

  const result = await Games.update("1", updatedGame);

  expect(mocks.from).toHaveBeenCalledWith("games");
  expect(update).toHaveBeenCalledWith(updatedGame);
  expect(eq).toHaveBeenCalledWith("id", "1");
  expect(select).toHaveBeenCalled();
  expect(single).toHaveBeenCalled();
  expect(result).toEqual(savedGame);
});


it("deve remover um jogo com sucesso", async () => {
  const removedGame = {
    id: "1",
    title: "Minecraft",
    price: 99.90,
    active: true,
  };

  const single = vi.fn().mockResolvedValue({
    data: removedGame,
    error: null,
  });

  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const deleteMock = vi.fn().mockReturnValue({ eq });

  mocks.from.mockReturnValue({
    delete: deleteMock,
  });

  const result = await Games.remove("1");

  expect(mocks.from).toHaveBeenCalledWith("games");
  expect(deleteMock).toHaveBeenCalled();
  expect(eq).toHaveBeenCalledWith("id", "1");
  expect(select).toHaveBeenCalled();
  expect(single).toHaveBeenCalled();
  expect(result).toEqual(removedGame);
});


});
