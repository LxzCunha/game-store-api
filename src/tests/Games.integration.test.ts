import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import GamesRepository from "../repository/GamesRepository.js";
import { Game } from "../models/Games.js";
import { NotFoundError } from "../errors/NotFoundError.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../repository/GamesRepository.js", () => ({
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

const ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "33333333-3333-4333-8333-333333333333";
const GENRE_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_GENRE_ID = "44444444-4444-4444-8444-444444444444";

const body = {
  genre_id: GENRE_ID,
  title: "Minecraft",
  description: "Jogo de aventura e construção",
  price: 99.9,
  stock_quantity: 50,
  release_date: "2011-11-18",
  developer: "Mojang",
  image: "minecraft.jpg",
  active: true,
};

const record = { id: ID, ...body };

const otherRecord = {
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

const game = () => Game.restore(record);

const saveWithId = async (created: Game) => Game.restore({ ...created.toJSON(), id: ID });

describe("Games - Testes de Integração", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("deve retornar status 200 e listar os jogos", async () => {
    vi.mocked(GamesRepository.findAll).mockResolvedValueOnce([game(), Game.restore(otherRecord)]);

    const response = await request(app).get("/games");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record, otherRecord]);
    expect(GamesRepository.findAll).toHaveBeenCalled();
  });

  it("deve retornar status 500 quando ocorrer erro na consulta", async () => {
    vi.mocked(GamesRepository.findAll).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await request(app).get("/games");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro ao buscar jogos." });
  });

  it("deve retornar status 200 ao buscar um jogo pelo ID", async () => {
    vi.mocked(GamesRepository.findById).mockResolvedValueOnce(game());

    const response = await request(app).get(`/games/${ID}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(GamesRepository.findById).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 404 quando o jogo não existir", async () => {
    vi.mocked(GamesRepository.findById).mockRejectedValueOnce(new NotFoundError("Jogo não encontrado."));

    const response = await request(app).get(`/games/${ID}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Jogo não encontrado." });
  });

  it("deve retornar status 500 quando a busca pelo ID falhar", async () => {
    vi.mocked(GamesRepository.findById).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await request(app).get(`/games/${ID}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro ao buscar jogo." });
  });

  it("deve retornar status 200 ao buscar jogos por gênero", async () => {
    vi.mocked(GamesRepository.findByGenre).mockResolvedValueOnce([game()]);

    const response = await request(app).get(`/games/genre/${GENRE_ID}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record]);
    expect(GamesRepository.findByGenre).toHaveBeenCalledWith(GENRE_ID);
    expect(GamesRepository.findById).not.toHaveBeenCalled();
  });

  it("deve retornar status 200 e lista vazia quando o gênero não tiver jogos", async () => {
    vi.mocked(GamesRepository.findByGenre).mockResolvedValueOnce([]);

    const response = await request(app).get(`/games/genre/${GENRE_ID}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("deve retornar status 500 quando a busca por gênero falhar", async () => {
    vi.mocked(GamesRepository.findByGenre).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await request(app).get(`/games/genre/${GENRE_ID}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro ao buscar jogos do gênero." });
  });

  it("deve retornar status 201 ao criar um jogo", async () => {
    vi.mocked(GamesRepository.create).mockImplementationOnce(saveWithId);

    const response = await request(app).post("/games").send(body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(record);

    const created = vi.mocked(GamesRepository.create).mock.calls[0]?.[0];
    expect(created).toBeInstanceOf(Game);
    expect(created?.toJSON()).toEqual({ ...body, id: undefined });
  });

  it("deve retornar status 201 aplicando os valores padrão e o título sem espaços nas pontas", async () => {
    vi.mocked(GamesRepository.create).mockImplementationOnce(saveWithId);

    const response = await request(app)
      .post("/games")
      .send({ genre_id: GENRE_ID, title: "  Stardew Valley ", price: 0, active: false });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: ID,
      genre_id: GENRE_ID,
      title: "Stardew Valley",
      description: null,
      price: 0,
      stock_quantity: 0,
      release_date: null,
      developer: null,
      image: null,
      active: false,
    });
  });

  it("deve retornar status 400 e não gravar quando o título não for informado", async () => {
    const { title: _title, ...withoutTitle } = body;

    const response = await request(app).post("/games").send(withoutTitle);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O título do jogo é obrigatório." });
    expect(GamesRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o genre_id não for um UUID", async () => {
    const response = await request(app).post("/games").send({ ...body, genre_id: "10" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O gênero do jogo (genre_id) deve ser um UUID válido." });
    expect(GamesRepository.create).not.toHaveBeenCalled();
  });

  it.each([-10, "349.90", null])("deve retornar status 400 quando o preço for %j", async (price) => {
    const response = await request(app).post("/games").send({ ...body, price });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O preço do jogo deve ser um número maior ou igual a zero." });
    expect(GamesRepository.create).not.toHaveBeenCalled();
  });

  it.each([-1, 1.5, "50"])("deve retornar status 400 quando a quantidade em estoque for %j", async (stockQuantity) => {
    const response = await request(app).post("/games").send({ ...body, stock_quantity: stockQuantity });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "A quantidade em estoque deve ser um número inteiro maior ou igual a zero.",
    });
    expect(GamesRepository.create).not.toHaveBeenCalled();
  });

  it.each(["2023-02-30", "18/11/2011"])("deve retornar status 400 quando a data de lançamento for %j", async (releaseDate) => {
    const response = await request(app).post("/games").send({ ...body, release_date: releaseDate });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "A data de lançamento deve estar no formato AAAA-MM-DD." });
    expect(GamesRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando um campo de texto opcional não for texto", async () => {
    const response = await request(app).post("/games").send({ ...body, developer: 10 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "A desenvolvedora do jogo deve ser um texto." });
    expect(GamesRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando active não for booleano", async () => {
    const response = await request(app).post("/games").send({ ...body, active: "sim" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O campo active deve ser true ou false." });
    expect(GamesRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o JSON for malformado", async () => {
    const response = await request(app)
      .post("/games")
      .set("Content-Type", "application/json")
      .send('{"title": ');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Requisição inválida." });
    expect(GamesRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 ao criar um jogo com gênero inexistente", async () => {
    vi.mocked(GamesRepository.create).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).post("/games").send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O gênero informado não existe." });
  });

  it("deve retornar status 500 quando a criação falhar", async () => {
    vi.mocked(GamesRepository.create).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await request(app).post("/games").send(body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro ao criar jogo." });
  });

  it("deve retornar status 200 ao atualizar um jogo", async () => {
    const changes = {
      ...body,
      description: "Jogo de aventura atualizado",
      price: 89.9,
      stock_quantity: 40,
    };
    vi.mocked(GamesRepository.findById).mockResolvedValueOnce(game());
    vi.mocked(GamesRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(`/games/${ID}`).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: ID, ...changes });
    expect(GamesRepository.findById).toHaveBeenCalledWith(ID);
    expect(vi.mocked(GamesRepository.update).mock.calls[0]?.[0]).toBeInstanceOf(Game);
  });

  it("deve retornar status 200 ao atualizar só os campos enviados", async () => {
    vi.mocked(GamesRepository.findById).mockResolvedValueOnce(game());
    vi.mocked(GamesRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app)
      .put(`/games/${ID}`)
      .send({ price: 89.9, developer: null, active: false });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...record, price: 89.9, developer: null, active: false });
  });

  it("deve retornar status 404 ao atualizar um jogo que não existe", async () => {
    vi.mocked(GamesRepository.findById).mockRejectedValueOnce(new NotFoundError("Jogo não encontrado."));

    const response = await request(app).put(`/games/${ID}`).send({ price: 89.9 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Jogo não encontrado." });
    expect(GamesRepository.update).not.toHaveBeenCalled();
  });

  it.each([
    [{ title: "" }, "O título do jogo é obrigatório."],
    [{ genre_id: "10" }, "O gênero do jogo (genre_id) deve ser um UUID válido."],
    [{ price: "89.90" }, "O preço do jogo deve ser um número maior ou igual a zero."],
    [{ release_date: "2023-02-30" }, "A data de lançamento deve estar no formato AAAA-MM-DD."],
  ])("deve retornar status 400 ao atualizar com %j", async (changes, message) => {
    vi.mocked(GamesRepository.findById).mockResolvedValueOnce(game());

    const response = await request(app).put(`/games/${ID}`).send(changes);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
    expect(GamesRepository.update).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 ao atualizar para um gênero inexistente", async () => {
    vi.mocked(GamesRepository.findById).mockResolvedValueOnce(game());
    vi.mocked(GamesRepository.update).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).put(`/games/${ID}`).send({ genre_id: OTHER_GENRE_ID });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O gênero informado não existe." });
    expect(vi.mocked(GamesRepository.update).mock.calls[0]?.[0].getGenreId()).toBe(OTHER_GENRE_ID);
  });

  it("deve retornar status 500 quando a atualização falhar", async () => {
    vi.mocked(GamesRepository.findById).mockResolvedValueOnce(game());
    vi.mocked(GamesRepository.update).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await request(app).put(`/games/${ID}`).send({ price: 89.9 });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro ao atualizar jogo." });
  });

  it("deve retornar status 200 ao remover um jogo", async () => {
    vi.mocked(GamesRepository.remove).mockResolvedValueOnce(game());

    const response = await request(app).delete(`/games/${ID}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Jogo removido com sucesso." });
    expect(GamesRepository.remove).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 404 ao remover um jogo que não existe", async () => {
    vi.mocked(GamesRepository.remove).mockRejectedValueOnce(new NotFoundError("Jogo não encontrado."));

    const response = await request(app).delete(`/games/${ID}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Jogo não encontrado." });
  });

  it("deve retornar status 409 ao remover jogo vinculado a pedido", async () => {
    const databaseError = Object.assign(new Error("Violação de chave estrangeira"), { code: "23503" });
    vi.mocked(GamesRepository.remove).mockRejectedValueOnce(databaseError);

    const response = await request(app).delete(`/games/${ID}`);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Não é possível remover este jogo, pois ele está vinculado a um pedido.",
    });
    expect(GamesRepository.remove).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 500 quando a remoção falhar", async () => {
    vi.mocked(GamesRepository.remove).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await request(app).delete(`/games/${ID}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro ao remover jogo." });
  });
});
