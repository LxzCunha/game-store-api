import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import OrderItems from "../models/OrderItems.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../models/OrderItems.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByOrder: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import app from "../app.js";

const id = "item-1";
const basePath = "/order-items";
const recordPath = `${basePath}/${id}`;
const newRecord = {
  order_id: "order-1",
  game_id: "game-1",
  quantity: 1,
  unit_price: 149.90,
};
const record = { id, ...newRecord };
const changes = { ...newRecord, quantity: 2, unit_price: 0 };

describe("OrderItems - Testes de Integração", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve retornar status 200 e listar os registros", async () => {
    vi.mocked(OrderItems.findAll).mockResolvedValueOnce([record]);

    const response = await request(app).get(basePath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record]);
    expect(OrderItems.findAll).toHaveBeenCalledExactlyOnceWith();
  });

  it("deve retornar status 200 ao buscar um registro pelo ID", async () => {
    vi.mocked(OrderItems.findById).mockResolvedValueOnce(record);

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(OrderItems.findById).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 404 quando a busca por ID não encontrar um registro", async () => {
    const error = Object.assign(new Error("Nenhum registro encontrado"), { code: "PGRST116" });
    vi.mocked(OrderItems.findById).mockRejectedValueOnce(error);

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Item do pedido não encontrado." });
    expect(OrderItems.findById).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 201 ao criar um registro", async () => {
    vi.mocked(OrderItems.create).mockResolvedValueOnce(record);

    const response = await request(app).post(basePath).send(newRecord);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(record);
    expect(OrderItems.create).toHaveBeenCalledExactlyOnceWith(newRecord);
  });

  it("deve retornar status 200 ao atualizar um registro", async () => {
    const savedRecord = { ...record, ...changes };
    vi.mocked(OrderItems.update).mockResolvedValueOnce(savedRecord);

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(savedRecord);
    expect(OrderItems.update).toHaveBeenCalledExactlyOnceWith(id, changes);
  });

  it("deve retornar status 200 ao remover um registro", async () => {
    vi.mocked(OrderItems.remove).mockResolvedValueOnce(record);

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Item do pedido removido com sucesso." });
    expect(OrderItems.remove).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("deve retornar status 409 quando uma chave estrangeira impedir a remoção", async () => {
    const error = Object.assign(new Error("Violação de chave estrangeira"), { code: "23503" });
    vi.mocked(OrderItems.remove).mockRejectedValueOnce(error);

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Não é possível remover este item do pedido, pois ele está vinculado a um pedido.",
    });
    expect(OrderItems.remove).toHaveBeenCalledExactlyOnceWith(id);
  });

  it.each([
    {
      operation: "listagem",
      method: "findAll",
      send: () => request(app).get(basePath),
      args: [],
      message: "Erro ao buscar itens do pedido.",
    },
    {
      operation: "criação",
      method: "create",
      send: () => request(app).post(basePath).send(newRecord),
      args: [newRecord],
      message: "Erro ao criar item do pedido.",
    },
    {
      operation: "atualização",
      method: "update",
      send: () => request(app).put(recordPath).send(changes),
      args: [id, changes],
      message: "Erro ao atualizar item do pedido.",
    },
    {
      operation: "remoção",
      method: "remove",
      send: () => request(app).delete(recordPath),
      args: [id],
      message: "Erro ao remover item do pedido.",
    },
  ] as const)("deve retornar status 500 quando a $operation falhar", async ({ method, send, args, message }) => {
    vi.mocked(OrderItems[method]).mockRejectedValueOnce(new Error("Falha no banco"));

    const response = await send();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message });
    expect(OrderItems[method]).toHaveBeenCalledExactlyOnceWith(...args);
  });

  describe.each([
    {
      label: "pedido",
      method: "findByOrder",
      path: `${basePath}/order/order-1`,
      id: "order-1",
      errorMessage: "Erro ao buscar itens do pedido.",
    },
  ] as const)("Filtro por $label", ({ method, path, id, errorMessage }) => {
    it("deve retornar status 200 e listar os registros do relacionamento", async () => {
      vi.mocked(OrderItems[method]).mockResolvedValueOnce([record]);

      const response = await request(app).get(path);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([record]);
      expect(OrderItems[method]).toHaveBeenCalledExactlyOnceWith(id);
    });

    it("deve retornar status 200 e uma lista vazia se não houver resultados", async () => {
      vi.mocked(OrderItems[method]).mockResolvedValueOnce([]);

      const response = await request(app).get(path);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(OrderItems[method]).toHaveBeenCalledExactlyOnceWith(id);
    });

    it("deve retornar status 500 quando a consulta por relacionamento falhar", async () => {
      vi.mocked(OrderItems[method]).mockRejectedValueOnce(new Error("Falha na consulta"));

      const response = await request(app).get(path);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: errorMessage });
      expect(OrderItems[method]).toHaveBeenCalledExactlyOnceWith(id);
    });
  });
});
