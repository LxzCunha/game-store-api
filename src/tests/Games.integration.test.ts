
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import Games from "../models/Games.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../models/Games.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByGenre: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import app from "../app.js";

describe("Games - Testes de Integração", () => {


it("deve retornar status 200 e listar os jogos", async () => {
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

  vi.mocked(Games.findAll).mockResolvedValueOnce(games);

  const response = await request(app).get("/games");

  expect(response.status).toBe(200);
  expect(response.body).toEqual(games);
  expect(Games.findAll).toHaveBeenCalled();
});


it("deve retornar status 500 quando ocorrer erro na consulta", async () => {
  vi.mocked(Games.findAll).mockRejectedValueOnce(
    new Error("Falha simulada no banco")
  );

  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  try {
    const response = await request(app).get("/games");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Erro ao buscar jogos.",
    });
  } finally {
    consoleSpy.mockRestore();
  }
});


it("deve retornar status 200 ao buscar um jogo pelo ID", async () => {
  const game = {
    id: "1",
    title: "Minecraft",
    price: 99.90,
    active: true,
  };

  vi.mocked(Games.findById).mockResolvedValueOnce(game);

  const response = await request(app).get("/games/1");

  expect(response.status).toBe(200);
  expect(response.body).toEqual(game);
  expect(Games.findById).toHaveBeenCalledWith("1");
});

it("deve retornar status 200 ao buscar jogos por gênero", async () => {
  const games = [
    {
      id: "1",
      genre_id: "10",
      title: "Minecraft",
      price: 99.90,
      active: true,
    },
  ];

  vi.mocked(Games.findByGenre).mockResolvedValueOnce(games);

  const response = await request(app).get("/games/genre/10");

  expect(response.status).toBe(200);
  expect(response.body).toEqual(games);
  expect(Games.findByGenre).toHaveBeenCalledWith("10");
});


it("deve retornar status 201 ao criar um jogo", async () => {
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

  vi.mocked(Games.create).mockResolvedValueOnce(createdGame);

  const response = await request(app)
    .post("/games")
    .send(newGame);

  expect(response.status).toBe(201);
  expect(response.body).toEqual(createdGame);
  expect(Games.create).toHaveBeenCalledWith(newGame);
});


it("deve retornar status 200 ao atualizar um jogo", async () => {
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

  vi.mocked(Games.update).mockResolvedValueOnce(savedGame);

  const response = await request(app)
    .put("/games/1")
    .send(updatedGame);

  expect(response.status).toBe(200);
  expect(response.body).toEqual(savedGame);
  expect(Games.update).toHaveBeenCalledWith("1", updatedGame);
});

it("deve retornar status 200 ao remover um jogo", async () => {
  const removedGame = {
    id: "1",
    title: "Minecraft",
    price: 99.90,
    active: true,
  };

  vi.mocked(Games.remove).mockResolvedValueOnce(removedGame);

  const response = await request(app).delete("/games/1");

  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    message: "Jogo removido com sucesso.",
  });
  expect(Games.remove).toHaveBeenCalledWith("1");
});


it("deve retornar status 409 ao remover jogo vinculado a pedido", async () => {
  const databaseError = Object.assign(
    new Error("Violação de chave estrangeira"),
    { code: "23503" }
  );

  vi.mocked(Games.remove).mockRejectedValueOnce(databaseError);

  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  try {
    const response = await request(app).delete("/games/1");

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Não é possível remover este jogo, pois ele está vinculado a um pedido."
    });
    expect(Games.remove).toHaveBeenCalledWith("1");
  } finally {
    consoleSpy.mockRestore();
  }
});



});
