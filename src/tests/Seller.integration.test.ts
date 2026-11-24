import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import Seller from "../models/Seller.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../models/Seller.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import app from "../app.js";

const id = "seller-1";
const basePath = "/sellers";
const recordPath = `${basePath}/${id}`;
const newRecord = {
  name: "João Lima",
  email: "joao@example.com",
  phone: "(11) 98888-7777",
  address: "Av. Central, 500",
  hire_date: "2024-02-01",
};
const record = { id, person_id: "person-1", role: "seller", ...newRecord };
const changes = { phone: "(11) 97777-6666", hire_date: "2024-02-02" };

describe("Seller - Testes de Integração", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve retornar status 200 e listar os registros", async () => {
    vi.mocked(Seller.findAll).mockResolvedValueOnce([record]);

    const response = await request(app).get(basePath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record]);
    expect(Seller.findAll).toHaveBeenCalledExactlyOnceWith();
  });

  it("deve retornar status 200 ao buscar um registro pelo ID", async () => {
    vi.mocked(Seller.findById).mockResolvedValueOnce(record);

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(Seller.findById).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 404 quando a busca por ID não encontrar um registro", async () => {
    const error = Object.assign(new Error("Nenhum registro encontrado"), { code: "PGRST116" });
    vi.mocked(Seller.findById).mockRejectedValueOnce(error);

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Vendedor não encontrado." });
    expect(Seller.findById).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 201 ao criar um registro", async () => {
    vi.mocked(Seller.create).mockResolvedValueOnce(record);

    const response = await request(app).post(basePath).send(newRecord);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(record);
    expect(Seller.create).toHaveBeenCalledExactlyOnceWith(newRecord);
  });

  it("deve retornar status 200 ao atualizar um registro", async () => {
    const savedRecord = { ...record, ...changes };
    vi.mocked(Seller.update).mockResolvedValueOnce(savedRecord);

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(savedRecord);
    expect(Seller.update).toHaveBeenCalledExactlyOnceWith(id, changes);
  });

  it("deve retornar status 200 ao remover um registro", async () => {
    vi.mocked(Seller.remove).mockResolvedValueOnce(record);

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Vendedor removido com sucesso." });
    expect(Seller.remove).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 404 quando a remoção não encontrar um registro", async () => {
    vi.mocked(Seller.remove).mockResolvedValueOnce(null);

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Vendedor não encontrado para remoção." });
    expect(Seller.remove).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 409 quando uma chave estrangeira impedir a remoção", async () => {
    const error = Object.assign(new Error("Violação de chave estrangeira"), { code: "23503" });
    vi.mocked(Seller.remove).mockRejectedValueOnce(error);

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Não é possível remover este vendedor pois existem pedidos vinculados a ele.",
    });
    expect(Seller.remove).toHaveBeenCalledExactlyOnceWith(id);
  });

  it.each([
    {
      operation: "listagem",
      method: "findAll",
      send: () => request(app).get(basePath),
      args: [],
      message: "Erro ao buscar vendedor.",
    },
    {
      operation: "criação",
      method: "create",
      send: () => request(app).post(basePath).send(newRecord),
      args: [newRecord],
      message: "Erro ao criar vendedor.",
    },
    {
      operation: "atualização",
      method: "update",
      send: () => request(app).put(recordPath).send(changes),
      args: [id, changes],
      message: "Erro ao atualizar vendedor.",
    },
    {
      operation: "remoção",
      method: "remove",
      send: () => request(app).delete(recordPath),
      args: [id],
      message: "Erro ao remover vendedor.",
    },
  ] as const)("deve retornar status 500 quando a $operation falhar", async ({ method, send, args, message }) => {
    vi.mocked(Seller[method]).mockRejectedValueOnce(new Error("Falha no banco"));

    const response = await send();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message });
    expect(Seller[method]).toHaveBeenCalledExactlyOnceWith(...args);
  });
});
