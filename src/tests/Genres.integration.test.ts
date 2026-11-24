
import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import Genres from "../models/Genres.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));


vi.mock("../models/Genres.js", () => ({
  default: {
    findAll: vi.fn().mockResolvedValue([
      { id: "1", name: "Ação", active: true },
      { id: "2", name: "RPG", active: true },
    ]),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));


import app from "../app.js";

describe("Genres - Testes de Integração", () => {
  it("deve retornar status 200 e listar os gêneros", async () => {
    const response = await request(app).get("/genres");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: "1", name: "Ação", active: true },
      { id: "2", name: "RPG", active: true },
    ]);
  });
  
it("deve retornar status 200 ao buscar um gênero pelo ID", async () => {
  const genre = {
    id: "1",
    name: "Ação",
    active: true,
  };

  vi.mocked(Genres.findById).mockResolvedValueOnce(genre);

  const response = await request(app).get("/genres/1");

  expect(response.status).toBe(200);
  expect(response.body).toEqual(genre);
  expect(Genres.findById).toHaveBeenCalledWith("1");
});

  it("deve retornar status 500 quando ocorrer erro na consulta", async () => {
  vi.mocked(Genres.findAll).mockRejectedValueOnce(
    new Error("Falha simulada no banco")
  );

  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  try {
    const response = await request(app).get("/genres");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Erro ao buscar gênero.",
    });
  } finally {
    consoleSpy.mockRestore();
  }
});


it("deve retornar status 201 ao criar um gênero", async () => {
  const newGenre = {
    name: "Aventura",
    description: "Jogos de aventura",
    active: true,
  };

  const createdGenre = {
    id: "3",
    ...newGenre,
  };

  vi.mocked(Genres.create).mockResolvedValueOnce(createdGenre);

  const response = await request(app)
    .post("/genres")
    .send(newGenre);

  expect(response.status).toBe(201);
  expect(response.body).toEqual(createdGenre);
  expect(Genres.create).toHaveBeenCalledWith(newGenre);
});


it("deve retornar status 200 ao atualizar um gênero", async () => {
  const updatedGenre = {
    name: "RPG",
    description: "Jogos de RPG atualizados",
    active: true,
  };

  const savedGenre = {
    id: "1",
    ...updatedGenre,
  };

  vi.mocked(Genres.update).mockResolvedValueOnce(savedGenre);

  const response = await request(app)
    .put("/genres/1")
    .send(updatedGenre);

  expect(response.status).toBe(200);
  expect(response.body).toEqual(savedGenre);
  expect(Genres.update).toHaveBeenCalledWith("1", updatedGenre);
});


it("deve retornar status 200 ao remover um gênero", async () => {
  const removedGenre = {
    id: "1",
    name: "Ação",
    active: true,
  };

  vi.mocked(Genres.remove).mockResolvedValueOnce([removedGenre]);

  const response = await request(app).delete("/genres/1");

  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    message: "Gênero removido com sucesso.",
  });
  expect(Genres.remove).toHaveBeenCalledWith("1");
});


});
