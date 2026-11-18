import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import Customer from "../models/Customer.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../models/Customer.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import app from "../app.js";

const id = "customer-1";
const basePath = "/customers";
const recordPath = `${basePath}/${id}`;
const newRecord = {
  name: "Maria Souza",
  email: "maria@example.com",
  phone: "(11) 98888-7777",
  address: "Rua das Flores, 100",
  birth_date: "2000-04-15",
};
const record = { id, person_id: "person-1", role: "customer", ...newRecord };
const changes = { phone: "(11) 97777-6666", birth_date: "2000-04-16" };

describe("Customer - Testes de Integração", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve retornar status 200 e listar os registros", async () => {
    vi.mocked(Customer.findAll).mockResolvedValueOnce([record]);

    const response = await request(app).get(basePath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record]);
    expect(Customer.findAll).toHaveBeenCalledExactlyOnceWith();
  });

  it("deve retornar status 200 ao buscar um registro pelo ID", async () => {
    vi.mocked(Customer.findById).mockResolvedValueOnce(record);

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(Customer.findById).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 404 quando a busca por ID não encontrar um registro", async () => {
    const error = Object.assign(new Error("Nenhum registro encontrado"), { code: "PGRST116" });
    vi.mocked(Customer.findById).mockRejectedValueOnce(error);

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Cliente não encontrado." });
    expect(Customer.findById).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 201 ao criar um registro", async () => {
    vi.mocked(Customer.create).mockResolvedValueOnce(record);

    const response = await request(app).post(basePath).send(newRecord);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(record);
    expect(Customer.create).toHaveBeenCalledExactlyOnceWith(newRecord);
  });

  it("deve retornar status 200 ao atualizar um registro", async () => {
    const savedRecord = { ...record, ...changes };
    vi.mocked(Customer.update).mockResolvedValueOnce(savedRecord);

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(savedRecord);
    expect(Customer.update).toHaveBeenCalledExactlyOnceWith(id, changes);
  });

  it("deve retornar status 200 ao remover um registro", async () => {
    vi.mocked(Customer.remove).mockResolvedValueOnce(record);

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Cliente removido com sucesso." });
    expect(Customer.remove).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 404 quando a remoção não encontrar um registro", async () => {
    vi.mocked(Customer.remove).mockResolvedValueOnce(null);

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Cliente não encontrado para remoção." });
    expect(Customer.remove).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 409 quando uma chave estrangeira impedir a remoção", async () => {
    const error = Object.assign(new Error("Violação de chave estrangeira"), { code: "23503" });
    vi.mocked(Customer.remove).mockRejectedValueOnce(error);

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Não é possível remover este cliente pois existem pedidos vinculados a ele.",
    });
    expect(Customer.remove).toHaveBeenCalledExactlyOnceWith(id);
  });

  it.each([
    {
      operation: "listagem",
      method: "findAll",
      send: () => request(app).get(basePath),
      args: [],
      message: "Erro ao buscar cliente.",
    },
    {
      operation: "criação",
      method: "create",
      send: () => request(app).post(basePath).send(newRecord),
      args: [newRecord],
      message: "Erro ao criar cliente.",
    },
    {
      operation: "atualização",
      method: "update",
      send: () => request(app).put(recordPath).send(changes),
      args: [id, changes],
      message: "Erro ao atualizar cliente.",
    },
    {
      operation: "remoção",
      method: "remove",
      send: () => request(app).delete(recordPath),
      args: [id],
      message: "Erro ao remover cliente.",
    },
  ] as const)("deve retornar status 500 quando a $operation falhar", async ({ method, send, args, message }) => {
    vi.mocked(Customer[method]).mockRejectedValueOnce(new Error("Falha no banco"));

    const response = await send();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message });
    expect(Customer[method]).toHaveBeenCalledExactlyOnceWith(...args);
  });
});
