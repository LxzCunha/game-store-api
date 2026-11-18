import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import Orders from "../models/Orders.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../models/Orders.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCustomer: vi.fn(),
    findBySeller: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import app from "../app.js";

const id = "order-1";
const basePath = "/orders";
const recordPath = `${basePath}/${id}`;
const newRecord = {
  customer_id: "customer-1",
  seller_id: "seller-1",
  order_date: "2026-09-29",
  status: "pending",
  total: 149.90,
  active: true,
};
const record = { id, ...newRecord };
const changes = { ...newRecord, status: "cancelled", total: 0, active: false };

describe("Orders - Testes de Integração", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve retornar status 200 e listar os registros", async () => {
    vi.mocked(Orders.findAll).mockResolvedValueOnce([record]);

    const response = await request(app).get(basePath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record]);
    expect(Orders.findAll).toHaveBeenCalledExactlyOnceWith();
  });

  it("deve retornar status 200 ao buscar um registro pelo ID", async () => {
    vi.mocked(Orders.findById).mockResolvedValueOnce(record);

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(Orders.findById).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 404 quando a busca por ID não encontrar um registro", async () => {
    const error = Object.assign(new Error("Nenhum registro encontrado"), { code: "PGRST116" });
    vi.mocked(Orders.findById).mockRejectedValueOnce(error);

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Pedido não encontrado." });
    expect(Orders.findById).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 201 ao criar um registro", async () => {
    vi.mocked(Orders.create).mockResolvedValueOnce(record);

    const response = await request(app).post(basePath).send(newRecord);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(record);
    expect(Orders.create).toHaveBeenCalledExactlyOnceWith(newRecord);
  });

  it("deve retornar status 200 ao atualizar um registro", async () => {
    const savedRecord = { ...record, ...changes };
    vi.mocked(Orders.update).mockResolvedValueOnce(savedRecord);

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(savedRecord);
    expect(Orders.update).toHaveBeenCalledExactlyOnceWith(id, changes);
  });

  it("deve retornar status 200 ao remover um registro", async () => {
    vi.mocked(Orders.remove).mockResolvedValueOnce(record);

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Pedido removido com sucesso." });
    expect(Orders.remove).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 409 quando uma chave estrangeira impedir a remoção", async () => {
    const error = Object.assign(new Error("Violação de chave estrangeira"), { code: "23503" });
    vi.mocked(Orders.remove).mockRejectedValueOnce(error);

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Não é possível remover este pedido, pois ele está vinculado a um item pedido.",
    });
    expect(Orders.remove).toHaveBeenCalledExactlyOnceWith(id);
  });

  it.each([
    {
      operation: "listagem",
      method: "findAll",
      send: () => request(app).get(basePath),
      args: [],
      message: "Erro ao buscar pedidos.",
    },
    {
      operation: "criação",
      method: "create",
      send: () => request(app).post(basePath).send(newRecord),
      args: [newRecord],
      message: "Erro ao criar pedido.",
    },
    {
      operation: "atualização",
      method: "update",
      send: () => request(app).put(recordPath).send(changes),
      args: [id, changes],
      message: "Erro ao atualizar pedido.",
    },
    {
      operation: "remoção",
      method: "remove",
      send: () => request(app).delete(recordPath),
      args: [id],
      message: "Erro ao remover pedido.",
    },
  ] as const)("deve retornar status 500 quando a $operation falhar", async ({ method, send, args, message }) => {
    vi.mocked(Orders[method]).mockRejectedValueOnce(new Error("Falha no banco"));

    const response = await send();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message });
    expect(Orders[method]).toHaveBeenCalledExactlyOnceWith(...args);
  });

  describe.each([
    {
      label: "cliente",
      method: "findByCustomer",
      path: `${basePath}/customer/customer-1`,
      id: "customer-1",
      errorMessage: "Erro ao buscar pedidos do cliente.",
    },
    {
      label: "vendedor",
      method: "findBySeller",
      path: `${basePath}/seller/seller-1`,
      id: "seller-1",
      errorMessage: "Erro ao buscar pedidos do vendedor.",
    },
  ] as const)("Filtro por $label", ({ method, path, id, errorMessage }) => {
    it("deve retornar status 200 e listar os registros do relacionamento", async () => {
      vi.mocked(Orders[method]).mockResolvedValueOnce([record]);

      const response = await request(app).get(path);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([record]);
      expect(Orders[method]).toHaveBeenCalledExactlyOnceWith(id);
    });

    it("deve retornar status 200 e uma lista vazia se não houver resultados", async () => {
      vi.mocked(Orders[method]).mockResolvedValueOnce([]);

      const response = await request(app).get(path);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(Orders[method]).toHaveBeenCalledExactlyOnceWith(id);
    });

    it("deve retornar status 500 quando a consulta por relacionamento falhar", async () => {
      vi.mocked(Orders[method]).mockRejectedValueOnce(new Error("Falha na consulta"));

      const response = await request(app).get(path);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: errorMessage });
      expect(Orders[method]).toHaveBeenCalledExactlyOnceWith(id);
    });
  });
});
