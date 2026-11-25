import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import OrderItemsRepository from "../repository/OrderItemsRepository.js";
import { OrderItem } from "../models/OrderItems.js";
import { NotFoundError } from "../errors/NotFoundError.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../repository/OrderItemsRepository.js", () => ({
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

const ID = "11111111-1111-4111-8111-111111111111";
const ORDER_ID = "22222222-2222-4222-8222-222222222222";
const GAME_ID = "33333333-3333-4333-8333-333333333333";

const basePath = "/order-items";
const recordPath = `${basePath}/${ID}`;
const newRecord = {
  order_id: ORDER_ID,
  game_id: GAME_ID,
  quantity: 1,
  unit_price: 149.9,
};
const record = { id: ID, ...newRecord };
const changes = { ...newRecord, quantity: 2, unit_price: 0 };
const orderItem = () => OrderItem.restore(record);

const validationCases = [
  { label: "o order_id não for informado", body: { order_id: undefined }, message: "O pedido do item (order_id) deve ser um UUID válido." },
  { label: "o order_id não for um UUID", body: { order_id: "order-1" }, message: "O pedido do item (order_id) deve ser um UUID válido." },
  { label: "o game_id não for informado", body: { game_id: undefined }, message: "O jogo do item (game_id) deve ser um UUID válido." },
  { label: "o game_id não for um UUID", body: { game_id: "game-1" }, message: "O jogo do item (game_id) deve ser um UUID válido." },
  { label: "a quantidade não for informada", body: { quantity: undefined }, message: "A quantidade deve ser um número inteiro maior que zero." },
  { label: "a quantidade for zero", body: { quantity: 0 }, message: "A quantidade deve ser um número inteiro maior que zero." },
  { label: "a quantidade for fracionária", body: { quantity: 1.5 }, message: "A quantidade deve ser um número inteiro maior que zero." },
  { label: "a quantidade não for numérica", body: { quantity: "2" }, message: "A quantidade deve ser um número inteiro maior que zero." },
  { label: "o preço unitário não for informado", body: { unit_price: undefined }, message: "O preço unitário deve ser um número maior ou igual a zero." },
  { label: "o preço unitário for negativo", body: { unit_price: -1 }, message: "O preço unitário deve ser um número maior ou igual a zero." },
  { label: "o preço unitário não for numérico", body: { unit_price: "149.90" }, message: "O preço unitário deve ser um número maior ou igual a zero." },
];

describe("OrderItems - Testes de Integração", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("deve retornar status 200 e listar os itens do pedido", async () => {
    vi.mocked(OrderItemsRepository.findAll).mockResolvedValueOnce([orderItem()]);

    const response = await request(app).get(basePath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record]);
    expect(OrderItemsRepository.findAll).toHaveBeenCalledOnce();
  });

  it("deve retornar status 200 ao buscar um item do pedido pelo ID", async () => {
    vi.mocked(OrderItemsRepository.findById).mockResolvedValueOnce(orderItem());

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(OrderItemsRepository.findById).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 404 quando o item do pedido não existir", async () => {
    vi.mocked(OrderItemsRepository.findById).mockRejectedValueOnce(new NotFoundError("Item do pedido não encontrado."));

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Item do pedido não encontrado." });
    expect(OrderItemsRepository.findById).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 201 ao criar um item do pedido", async () => {
    vi.mocked(OrderItemsRepository.create).mockImplementationOnce(async (created) =>
      OrderItem.restore({
        id: ID,
        order_id: created.getOrderId(),
        game_id: created.getGameId(),
        quantity: created.getQuantity(),
        unit_price: created.getUnitPrice(),
      })
    );

    const response = await request(app).post(basePath).send(newRecord);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(record);

    const created = vi.mocked(OrderItemsRepository.create).mock.calls[0]?.[0];
    expect(created).toBeInstanceOf(OrderItem);
    expect(created?.toJSON()).toEqual({ id: undefined, ...newRecord });
  });

  it.each(validationCases)("deve retornar status 400 e não gravar quando $label", async ({ body, message }) => {
    const response = await request(app).post(basePath).send({ ...newRecord, ...body });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
    expect(OrderItemsRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o corpo da requisição for vazio", async () => {
    const response = await request(app).post(basePath);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O pedido do item (order_id) deve ser um UUID válido." });
    expect(OrderItemsRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o JSON for malformado", async () => {
    const response = await request(app)
      .post(basePath)
      .set("Content-Type", "application/json")
      .send('{"order_id": ');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Requisição inválida." });
  });

  it("deve retornar status 400 quando o pedido ou o jogo não existir ao criar", async () => {
    vi.mocked(OrderItemsRepository.create).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).post(basePath).send(newRecord);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O pedido ou o jogo informado não existe." });
  });

  it("deve retornar status 200 ao atualizar um item do pedido", async () => {
    vi.mocked(OrderItemsRepository.findById).mockResolvedValueOnce(orderItem());
    vi.mocked(OrderItemsRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...record, ...changes });
    expect(OrderItemsRepository.findById).toHaveBeenCalledWith(ID);
    expect(vi.mocked(OrderItemsRepository.update).mock.calls[0]?.[0].toJSON()).toEqual({ ...record, ...changes });
  });

  it("deve retornar status 200 ao atualizar só os campos enviados", async () => {
    vi.mocked(OrderItemsRepository.findById).mockResolvedValueOnce(orderItem());
    vi.mocked(OrderItemsRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(recordPath).send({ quantity: 3 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...record, quantity: 3 });
  });

  it("deve retornar status 404 ao atualizar um item do pedido que não existe", async () => {
    vi.mocked(OrderItemsRepository.findById).mockRejectedValueOnce(new NotFoundError("Item do pedido não encontrado."));

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Item do pedido não encontrado." });
    expect(OrderItemsRepository.update).not.toHaveBeenCalled();
  });

  it.each(
    validationCases.filter(({ body }) => Object.values(body).every((value) => value !== undefined))
  )("deve retornar status 400 e não gravar a atualização quando $label", async ({ body, message }) => {
    vi.mocked(OrderItemsRepository.findById).mockResolvedValueOnce(orderItem());

    const response = await request(app).put(recordPath).send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
    expect(OrderItemsRepository.update).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o pedido ou o jogo não existir ao atualizar", async () => {
    vi.mocked(OrderItemsRepository.findById).mockResolvedValueOnce(orderItem());
    vi.mocked(OrderItemsRepository.update).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).put(recordPath).send({ game_id: "44444444-4444-4444-8444-444444444444" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O pedido ou o jogo informado não existe." });
  });

  it("deve retornar status 200 ao remover um item do pedido", async () => {
    vi.mocked(OrderItemsRepository.remove).mockResolvedValueOnce(orderItem());

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Item do pedido removido com sucesso." });
    expect(OrderItemsRepository.remove).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 404 ao remover um item do pedido que não existe", async () => {
    vi.mocked(OrderItemsRepository.remove).mockRejectedValueOnce(new NotFoundError("Item do pedido não encontrado."));

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Item do pedido não encontrado." });
  });

  // Nenhuma tabela referencia order_items, então a remoção não trata o erro 23503:
  // se ele ocorrer, é uma falha inesperada e vira 500.
  it("deve retornar status 500 quando a remoção falhar por chave estrangeira", async () => {
    vi.mocked(OrderItemsRepository.remove).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro ao remover item do pedido." });
    expect(OrderItemsRepository.remove).toHaveBeenCalledWith(ID);
  });

  it.each([
    {
      operation: "listagem",
      method: "findAll",
      send: () => request(app).get(basePath),
      message: "Erro ao buscar itens do pedido.",
    },
    {
      operation: "busca por ID",
      method: "findById",
      send: () => request(app).get(recordPath),
      message: "Erro ao buscar item do pedido.",
    },
    {
      operation: "criação",
      method: "create",
      send: () => request(app).post(basePath).send(newRecord),
      message: "Erro ao criar item do pedido.",
    },
    {
      operation: "atualização",
      method: "update",
      send: () => {
        vi.mocked(OrderItemsRepository.findById).mockResolvedValueOnce(orderItem());
        return request(app).put(recordPath).send(changes);
      },
      message: "Erro ao atualizar item do pedido.",
    },
    {
      operation: "remoção",
      method: "remove",
      send: () => request(app).delete(recordPath),
      message: "Erro ao remover item do pedido.",
    },
  ] as const)("deve retornar status 500 quando a $operation falhar", async ({ method, send, message }) => {
    vi.mocked(OrderItemsRepository[method]).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await send();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message });
    expect(OrderItemsRepository[method]).toHaveBeenCalledOnce();
  });

  describe("Filtro por pedido", () => {
    const path = `${basePath}/order/${ORDER_ID}`;

    it("deve retornar status 200 e listar os itens do pedido", async () => {
      vi.mocked(OrderItemsRepository.findByOrder).mockResolvedValueOnce([orderItem()]);

      const response = await request(app).get(path);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([record]);
      expect(OrderItemsRepository.findByOrder).toHaveBeenCalledWith(ORDER_ID);
      expect(OrderItemsRepository.findById).not.toHaveBeenCalled();
    });

    it("deve retornar status 200 e uma lista vazia se não houver resultados", async () => {
      vi.mocked(OrderItemsRepository.findByOrder).mockResolvedValueOnce([]);

      const response = await request(app).get(path);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(OrderItemsRepository.findByOrder).toHaveBeenCalledWith(ORDER_ID);
    });

    it("deve retornar status 500 quando a consulta por pedido falhar", async () => {
      vi.mocked(OrderItemsRepository.findByOrder).mockRejectedValueOnce(new Error("Falha simulada no banco"));

      const response = await request(app).get(path);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Erro ao buscar itens do pedido." });
      expect(OrderItemsRepository.findByOrder).toHaveBeenCalledWith(ORDER_ID);
    });
  });
});
