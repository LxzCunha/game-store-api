import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import OrdersRepository from "../repository/OrdersRepository.js";
import { Order } from "../models/Orders.js";
import { NotFoundError } from "../errors/NotFoundError.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../repository/OrdersRepository.js", () => ({
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

const ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const SELLER_ID = "33333333-3333-4333-8333-333333333333";
const TODAY = "2026-11-25";

const basePath = "/orders";
const recordPath = `${basePath}/${ID}`;
const newRecord = {
  customer_id: CUSTOMER_ID,
  seller_id: SELLER_ID,
  order_date: "2026-09-29",
  status: "pending",
  total: 149.9,
  active: true,
};
const record = { id: ID, ...newRecord };
const changes = { ...newRecord, status: "cancelled", total: 0, active: false };
const order = () => Order.restore(record);

// Simula o banco: atribui o ID e, se a data não foi informada, usa o padrão (current_date).
const saved = async (created: Order) =>
  Order.restore({
    id: ID,
    customer_id: created.getCustomerId(),
    seller_id: created.getSellerId(),
    order_date: created.getOrderDate() ?? TODAY,
    status: created.getStatus(),
    total: created.getTotal(),
    active: created.isActive(),
  });

const validationCases = [
  { label: "o customer_id não for informado", body: { customer_id: undefined }, message: "O cliente do pedido (customer_id) deve ser um UUID válido." },
  { label: "o customer_id não for um UUID", body: { customer_id: "customer-1" }, message: "O cliente do pedido (customer_id) deve ser um UUID válido." },
  { label: "o seller_id não for informado", body: { seller_id: undefined }, message: "O vendedor do pedido (seller_id) deve ser um UUID válido." },
  { label: "o seller_id não for um UUID", body: { seller_id: "seller-1" }, message: "O vendedor do pedido (seller_id) deve ser um UUID válido." },
  { label: "a data não estiver no formato AAAA-MM-DD", body: { order_date: "29/09/2026" }, message: "A data do pedido deve estar no formato AAAA-MM-DD." },
  { label: "a data não existir no calendário", body: { order_date: "2026-02-30" }, message: "A data do pedido deve estar no formato AAAA-MM-DD." },
  { label: "o status for vazio", body: { status: "   " }, message: "O status do pedido é obrigatório." },
  { label: "o total for negativo", body: { total: -1 }, message: "O total do pedido deve ser um número maior ou igual a zero." },
  { label: "o total não for numérico", body: { total: "149.90" }, message: "O total do pedido deve ser um número maior ou igual a zero." },
  { label: "active não for booleano", body: { active: "sim" }, message: "O campo active deve ser true ou false." },
];

describe("Orders - Testes de Integração", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("deve retornar status 200 e listar os pedidos", async () => {
    vi.mocked(OrdersRepository.findAll).mockResolvedValueOnce([order()]);

    const response = await request(app).get(basePath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record]);
    expect(OrdersRepository.findAll).toHaveBeenCalledOnce();
  });

  it("deve retornar status 200 ao buscar um pedido pelo ID", async () => {
    vi.mocked(OrdersRepository.findById).mockResolvedValueOnce(order());

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(OrdersRepository.findById).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 404 quando o pedido não existir", async () => {
    vi.mocked(OrdersRepository.findById).mockRejectedValueOnce(new NotFoundError("Pedido não encontrado."));

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Pedido não encontrado." });
    expect(OrdersRepository.findById).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 201 ao criar um pedido", async () => {
    vi.mocked(OrdersRepository.create).mockImplementationOnce(saved);

    const response = await request(app).post(basePath).send({ ...newRecord, status: "  pending " });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(record);

    const created = vi.mocked(OrdersRepository.create).mock.calls[0]?.[0];
    expect(created).toBeInstanceOf(Order);
    expect(created?.toJSON()).toEqual({ id: undefined, ...newRecord });
  });

  it("deve retornar status 201 e aplicar os valores padrão quando só cliente e vendedor forem enviados", async () => {
    vi.mocked(OrdersRepository.create).mockImplementationOnce(saved);

    const response = await request(app).post(basePath).send({ customer_id: CUSTOMER_ID, seller_id: SELLER_ID });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: ID,
      customer_id: CUSTOMER_ID,
      seller_id: SELLER_ID,
      order_date: TODAY,
      status: "pending",
      total: 0,
      active: true,
    });

    const created = vi.mocked(OrdersRepository.create).mock.calls[0]?.[0];
    expect(created?.getOrderDate()).toBeUndefined();
  });

  it.each(validationCases)("deve retornar status 400 e não gravar quando $label", async ({ body, message }) => {
    const response = await request(app).post(basePath).send({ ...newRecord, ...body });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
    expect(OrdersRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o corpo da requisição for vazio", async () => {
    const response = await request(app).post(basePath);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O cliente do pedido (customer_id) deve ser um UUID válido." });
    expect(OrdersRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o JSON for malformado", async () => {
    const response = await request(app)
      .post(basePath)
      .set("Content-Type", "application/json")
      .send('{"customer_id": ');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Requisição inválida." });
  });

  it("deve retornar status 400 quando o cliente ou o vendedor não existir ao criar", async () => {
    vi.mocked(OrdersRepository.create).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).post(basePath).send(newRecord);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O cliente ou o vendedor informado não existe." });
  });

  it("deve retornar status 200 ao atualizar um pedido", async () => {
    vi.mocked(OrdersRepository.findById).mockResolvedValueOnce(order());
    vi.mocked(OrdersRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...record, ...changes });
    expect(OrdersRepository.findById).toHaveBeenCalledWith(ID);
    expect(vi.mocked(OrdersRepository.update).mock.calls[0]?.[0].toJSON()).toEqual({ ...record, ...changes });
  });

  it("deve retornar status 200 ao atualizar só os campos enviados", async () => {
    vi.mocked(OrdersRepository.findById).mockResolvedValueOnce(order());
    vi.mocked(OrdersRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(recordPath).send({ status: "shipped" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...record, status: "shipped" });
  });

  it("deve retornar status 200 e reativar o pedido quando active for true", async () => {
    vi.mocked(OrdersRepository.findById).mockResolvedValueOnce(Order.restore({ ...record, active: false }));
    vi.mocked(OrdersRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(recordPath).send({ active: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
  });

  it("deve retornar status 404 ao atualizar um pedido que não existe", async () => {
    vi.mocked(OrdersRepository.findById).mockRejectedValueOnce(new NotFoundError("Pedido não encontrado."));

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Pedido não encontrado." });
    expect(OrdersRepository.update).not.toHaveBeenCalled();
  });

  it.each(
    validationCases.filter(({ body }) => Object.values(body).every((value) => value !== undefined))
  )("deve retornar status 400 e não gravar a atualização quando $label", async ({ body, message }) => {
    vi.mocked(OrdersRepository.findById).mockResolvedValueOnce(order());

    const response = await request(app).put(recordPath).send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
    expect(OrdersRepository.update).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o cliente ou o vendedor não existir ao atualizar", async () => {
    vi.mocked(OrdersRepository.findById).mockResolvedValueOnce(order());
    vi.mocked(OrdersRepository.update).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).put(recordPath).send({ customer_id: "44444444-4444-4444-8444-444444444444" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O cliente ou o vendedor informado não existe." });
  });

  it("deve retornar status 200 ao remover um pedido", async () => {
    vi.mocked(OrdersRepository.remove).mockResolvedValueOnce(order());

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Pedido removido com sucesso." });
    expect(OrdersRepository.remove).toHaveBeenCalledWith(ID);
  });

  it("deve retornar status 404 ao remover um pedido que não existe", async () => {
    vi.mocked(OrdersRepository.remove).mockRejectedValueOnce(new NotFoundError("Pedido não encontrado."));

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Pedido não encontrado." });
  });

  it("deve retornar status 409 quando existirem itens vinculados ao pedido", async () => {
    vi.mocked(OrdersRepository.remove).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Não é possível remover este pedido, pois ele está vinculado a um item pedido.",
    });
    expect(OrdersRepository.remove).toHaveBeenCalledWith(ID);
  });

  it.each([
    {
      operation: "listagem",
      method: "findAll",
      send: () => request(app).get(basePath),
      message: "Erro ao buscar pedidos.",
    },
    {
      operation: "busca por ID",
      method: "findById",
      send: () => request(app).get(recordPath),
      message: "Erro ao buscar pedido.",
    },
    {
      operation: "criação",
      method: "create",
      send: () => request(app).post(basePath).send(newRecord),
      message: "Erro ao criar pedido.",
    },
    {
      operation: "atualização",
      method: "update",
      send: () => {
        vi.mocked(OrdersRepository.findById).mockResolvedValueOnce(order());
        return request(app).put(recordPath).send(changes);
      },
      message: "Erro ao atualizar pedido.",
    },
    {
      operation: "remoção",
      method: "remove",
      send: () => request(app).delete(recordPath),
      message: "Erro ao remover pedido.",
    },
  ] as const)("deve retornar status 500 quando a $operation falhar", async ({ method, send, message }) => {
    vi.mocked(OrdersRepository[method]).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await send();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message });
    expect(OrdersRepository[method]).toHaveBeenCalledOnce();
  });

  describe.each([
    {
      label: "cliente",
      method: "findByCustomer",
      path: `${basePath}/customer/${CUSTOMER_ID}`,
      id: CUSTOMER_ID,
      errorMessage: "Erro ao buscar pedidos do cliente.",
    },
    {
      label: "vendedor",
      method: "findBySeller",
      path: `${basePath}/seller/${SELLER_ID}`,
      id: SELLER_ID,
      errorMessage: "Erro ao buscar pedidos do vendedor.",
    },
  ] as const)("Filtro por $label", ({ method, path, id, errorMessage }) => {
    it("deve retornar status 200 e listar os pedidos do relacionamento", async () => {
      vi.mocked(OrdersRepository[method]).mockResolvedValueOnce([order()]);

      const response = await request(app).get(path);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([record]);
      expect(OrdersRepository[method]).toHaveBeenCalledWith(id);
      expect(OrdersRepository.findById).not.toHaveBeenCalled();
    });

    it("deve retornar status 200 e uma lista vazia se não houver resultados", async () => {
      vi.mocked(OrdersRepository[method]).mockResolvedValueOnce([]);

      const response = await request(app).get(path);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(OrdersRepository[method]).toHaveBeenCalledWith(id);
    });

    it("deve retornar status 500 quando a consulta por relacionamento falhar", async () => {
      vi.mocked(OrdersRepository[method]).mockRejectedValueOnce(new Error("Falha simulada no banco"));

      const response = await request(app).get(path);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: errorMessage });
      expect(OrdersRepository[method]).toHaveBeenCalledWith(id);
    });
  });
});
