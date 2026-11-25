import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import GenresRepository from "../repository/GenresRepository.js";
import { Genre } from "../models/Genres.js";
import { NotFoundError } from "../errors/NotFoundError.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../repository/GenresRepository.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import app from "../app.js";

const ID = "11111111-1111-4111-8111-111111111111";
const record = { id: ID, name: "Ação", description: "Jogos de ação", active: true };
const genre = () => Genre.restore(record.id, record.name, record.description, record.active);

describe("Genres - Testes de Integração", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("deve retornar status 200 e listar os gêneros", async () => {
    vi.mocked(GenresRepository.findAll).mockResolvedValueOnce([genre()]);

    const response = await request(app).get("/genres");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record]);
  });

  it("deve retornar status 500 quando ocorrer erro na consulta", async () => {
    vi.mocked(GenresRepository.findAll).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await request(app).get("/genres");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro ao buscar gêneros." });
  });

  it("deve retornar status 200 ao buscar um gênero pelo ID", async () => {
    vi.mocked(GenresRepository.findById).mockResolvedValueOnce(genre());

    const response = await request(app).get(`/genres/${ID}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(GenresRepository.findById).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 404 quando o gênero não existir", async () => {
    vi.mocked(GenresRepository.findById).mockRejectedValueOnce(new NotFoundError("Gênero não encontrado."));

    const response = await request(app).get(`/genres/${ID}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Gênero não encontrado." });
  });

  it("deve retornar status 201 ao criar um gênero", async () => {
    vi.mocked(GenresRepository.create).mockImplementationOnce(async (created) =>
      Genre.restore(ID, created.getName(), created.getDescription(), created.isActive())
    );

    const response = await request(app)
      .post("/genres")
      .send({ name: "  Aventura ", description: "Jogos de aventura", active: false });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: ID, name: "Aventura", description: "Jogos de aventura", active: false });
    expect(vi.mocked(GenresRepository.create).mock.calls[0]?.[0]).toBeInstanceOf(Genre);
  });

  it("deve retornar status 400 e não gravar quando o nome não for informado", async () => {
    const response = await request(app).post("/genres").send({ description: "Sem nome" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O nome do gênero é obrigatório." });
    expect(GenresRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando active não for booleano", async () => {
    const response = await request(app).post("/genres").send({ name: "RPG", active: "sim" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O campo active deve ser true ou false." });
  });

  it("deve retornar status 400 quando o JSON for malformado", async () => {
    const response = await request(app)
      .post("/genres")
      .set("Content-Type", "application/json")
      .send('{"name": ');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Requisição inválida." });
  });

  it("deve retornar status 500 quando a criação falhar", async () => {
    vi.mocked(GenresRepository.create).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await request(app).post("/genres").send({ name: "RPG" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro ao criar gênero." });
  });

  it("deve retornar status 200 ao atualizar só os campos enviados", async () => {
    vi.mocked(GenresRepository.findById).mockResolvedValueOnce(genre());
    vi.mocked(GenresRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(`/genres/${ID}`).send({ name: "RPG" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...record, name: "RPG" });
  });

  it("deve retornar status 404 ao atualizar um gênero que não existe", async () => {
    vi.mocked(GenresRepository.findById).mockRejectedValueOnce(new NotFoundError("Gênero não encontrado."));

    const response = await request(app).put(`/genres/${ID}`).send({ name: "RPG" });

    expect(response.status).toBe(404);
    expect(GenresRepository.update).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 ao atualizar com nome vazio", async () => {
    vi.mocked(GenresRepository.findById).mockResolvedValueOnce(genre());

    const response = await request(app).put(`/genres/${ID}`).send({ name: "" });

    expect(response.status).toBe(400);
    expect(GenresRepository.update).not.toHaveBeenCalled();
  });

  it("deve retornar status 200 ao remover um gênero", async () => {
    vi.mocked(GenresRepository.remove).mockResolvedValueOnce(genre());

    const response = await request(app).delete(`/genres/${ID}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Gênero removido com sucesso." });
    expect(GenresRepository.remove).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 404 ao remover um gênero que não existe", async () => {
    vi.mocked(GenresRepository.remove).mockRejectedValueOnce(new NotFoundError("Gênero não encontrado."));

    const response = await request(app).delete(`/genres/${ID}`);

    expect(response.status).toBe(404);
  });

  it("deve retornar status 409 quando existirem jogos vinculados ao gênero", async () => {
    vi.mocked(GenresRepository.remove).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).delete(`/genres/${ID}`);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Não é possível remover este gênero pois existem jogos vinculados a ele.",
    });
  });
});
