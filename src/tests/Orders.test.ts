import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: {
    from: mocks.from,
  },
}));

import { Order } from "../models/Orders.js";
import OrdersRepository from "../repository/OrdersRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ValidationError } from "../errors/ValidationError.js";

const ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const SELLER_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_ID = "44444444-4444-4444-8444-444444444444";

const data = {
  customer_id: CUSTOMER_ID,
  seller_id: SELLER_ID,
  order_date: "2026-09-29",
  status: "pending",
  total: 149.9,
};

const row = { id: ID, ...data, active: true };

const filters = [
  ["cliente", "findByCustomer", "customer_id", CUSTOMER_ID],
  ["vendedor", "findBySeller", "seller_id", SELLER_ID],
] as const;

describe("Order - Entidade", () => {
  it("deve criar um pedido ativo, sem ID, com status pending, total zero e sem data (padrão do banco)", () => {
    const order = new Order({ customer_id: CUSTOMER_ID, seller_id: SELLER_ID });

    expect(order.getId()).toBeUndefined();
    expect(order.getCustomerId()).toBe(CUSTOMER_ID);
    expect(order.getSellerId()).toBe(SELLER_ID);
    expect(order.getOrderDate()).toBeUndefined();
    expect(order.getStatus()).toBe("pending");
    expect(order.getTotal()).toBe(0);
    expect(order.isActive()).toBe(true);
  });

  it("deve aceitar data, status e total informados, com o status sem espaços nas pontas", () => {
    const order = new Order({ ...data, status: "  shipped  ", total: 0 });

    expect(order.getOrderDate()).toBe("2026-09-29");
    expect(order.getStatus()).toBe("shipped");
    expect(order.getTotal()).toBe(0);
  });

  it.each([undefined, "", "customer-1", 123])("deve rejeitar o customer_id %j", (customerId) => {
    expect(() => new Order({ ...data, customer_id: customerId as string })).toThrow(
      new ValidationError("O cliente do pedido (customer_id) deve ser um UUID válido.")
    );
  });

  it.each([undefined, "", "seller-1", 123])("deve rejeitar o seller_id %j", (sellerId) => {
    expect(() => new Order({ ...data, seller_id: sellerId as string })).toThrow(
      new ValidationError("O vendedor do pedido (seller_id) deve ser um UUID válido.")
    );
  });

  it.each(["29/09/2026", "2026-9-29", "2026-13-01", "2026-02-30", "2026-09-29T10:00:00Z", "", null, 20260929])(
    "deve rejeitar a data do pedido %j",
    (orderDate) => {
      expect(() => new Order({ ...data, order_date: orderDate as string })).toThrow(
        new ValidationError("A data do pedido deve estar no formato AAAA-MM-DD.")
      );
    }
  );

  it.each(["", "   ", null, 10])("deve rejeitar o status %j", (status) => {
    expect(() => new Order({ ...data, status: status as string })).toThrow(
      new ValidationError("O status do pedido é obrigatório.")
    );
  });

  it.each([
    { label: "negativo", total: -0.01 },
    { label: "NaN", total: NaN },
    { label: "infinito", total: Infinity },
    { label: "em texto", total: "149.90" },
    { label: "nulo", total: null },
  ])("deve rejeitar o total $label", ({ total }) => {
    expect(() => new Order({ ...data, total: total as number })).toThrow(
      new ValidationError("O total do pedido deve ser um número maior ou igual a zero.")
    );
  });

  it("deve alterar cliente, vendedor, data, status e total", () => {
    const order = new Order(data);

    order.changeCustomer(OTHER_ID);
    order.changeSeller(OTHER_ID);
    order.changeOrderDate("2024-02-29");
    order.changeStatus(" cancelled ");
    order.changeTotal(10);

    expect(order.getCustomerId()).toBe(OTHER_ID);
    expect(order.getSellerId()).toBe(OTHER_ID);
    expect(order.getOrderDate()).toBe("2024-02-29");
    expect(order.getStatus()).toBe("cancelled");
    expect(order.getTotal()).toBe(10);
  });

  it("deve manter os valores anteriores quando uma alteração for rejeitada", () => {
    const order = new Order(data);

    expect(() => order.changeTotal(-1)).toThrow(ValidationError);
    expect(() => order.changeStatus("")).toThrow(ValidationError);

    expect(order.getTotal()).toBe(149.9);
    expect(order.getStatus()).toBe("pending");
  });

  it("deve ativar e desativar o pedido", () => {
    const order = new Order(data);

    order.deactivate();
    expect(order.isActive()).toBe(false);

    order.activate();
    expect(order.isActive()).toBe(true);
  });

  it("deve restaurar um pedido do banco com ID e status", () => {
    const order = Order.restore({ ...row, active: false });

    expect(order.getId()).toBe(ID);
    expect(order.isActive()).toBe(false);
    expect(order.toJSON()).toEqual({ ...row, active: false });
  });

  it("deve serializar um pedido novo sem ID e sem data", () => {
    const order = new Order({ customer_id: CUSTOMER_ID, seller_id: SELLER_ID });

    expect(order.toJSON()).toStrictEqual({
      id: undefined,
      customer_id: CUSTOMER_ID,
      seller_id: SELLER_ID,
      order_date: undefined,
      status: "pending",
      total: 0,
      active: true,
    });
  });
});

describe("OrdersRepository - Testes Unitários", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    { label: "registros cadastrados", rows: [row] },
    { label: "nenhum registro", rows: [] },
  ])("deve listar os pedidos com $label como entidades", async ({ rows }) => {
    const select = vi.fn().mockResolvedValue({ data: rows, error: null });
    mocks.from.mockReturnValue({ select });

    const result = await OrdersRepository.findAll();

    expect(mocks.from).toHaveBeenCalledWith("orders");
    expect(select).toHaveBeenCalledWith("*");
    result.forEach((order) => expect(order).toBeInstanceOf(Order));
    expect(result.map((order) => order.toJSON())).toEqual(rows);
  });

  it("deve propagar o erro ao listar os pedidos", async () => {
    const error = new Error("Falha na listagem");
    const select = vi.fn().mockResolvedValue({ data: null, error });
    mocks.from.mockReturnValue({ select });

    await expect(OrdersRepository.findAll()).rejects.toBe(error);
  });

  it("deve buscar um pedido pelo ID", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    const result = await OrdersRepository.findById(ID);

    expect(mocks.from).toHaveBeenCalledWith("orders");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(maybeSingle).toHaveBeenCalledOnce();
    expect(result).toBeInstanceOf(Order);
    expect(result.toJSON()).toEqual(row);
  });

  it("deve lançar NotFoundError quando o pedido não existir", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrdersRepository.findById(ID)).rejects.toThrow(new NotFoundError("Pedido não encontrado."));
  });

  it("deve lançar NotFoundError quando o ID não for um UUID (erro 22P02)", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrdersRepository.findById("abc")).rejects.toThrow(NotFoundError);
  });

  it("deve propagar outros erros ao buscar um pedido pelo ID", async () => {
    const error = { code: "XX000", message: "Falha no banco" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrdersRepository.findById(ID)).rejects.toBe(error);
  });

  it.each(filters)("deve listar os pedidos por %s", async (_, method, column, filterId) => {
    const eq = vi.fn().mockResolvedValue({ data: [row], error: null });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    const result = await OrdersRepository[method](filterId);

    expect(mocks.from).toHaveBeenCalledWith("orders");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith(column, filterId);
    expect(result[0]).toBeInstanceOf(Order);
    expect(result.map((order) => order.toJSON())).toEqual([row]);
  });

  it.each(filters)("deve retornar uma lista vazia ao filtrar por %s sem resultados", async (_, method, column, filterId) => {
    const eq = vi.fn().mockResolvedValue({ data: [], error: null });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrdersRepository[method](filterId)).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledWith(column, filterId);
  });

  it.each(filters)("deve retornar uma lista vazia ao filtrar por %s com ID que não é UUID (erro 22P02)", async (_, method, column) => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrdersRepository[method]("abc")).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledWith(column, "abc");
  });

  it.each(filters)("deve propagar o erro ao filtrar por %s", async (_, method, column, filterId) => {
    const error = new Error("Falha na consulta por relacionamento");
    const eq = vi.fn().mockResolvedValue({ data: null, error });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrdersRepository[method](filterId)).rejects.toBe(error);

    expect(eq).toHaveBeenCalledWith(column, filterId);
  });

  it("deve criar um pedido gravando os dados da entidade", async () => {
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValue({ insert });

    const result = await OrdersRepository.create(new Order(data));

    expect(mocks.from).toHaveBeenCalledWith("orders");
    expect(insert).toHaveBeenCalledWith({ ...data, active: true });
    expect(select).toHaveBeenCalledOnce();
    expect(single).toHaveBeenCalledOnce();
    expect(result).toBeInstanceOf(Order);
    expect(result.getId()).toBe(ID);
    expect(result.toJSON()).toEqual(row);
  });

  it("deve deixar a data do pedido para o padrão do banco quando ela não for informada", async () => {
    const saved = { ...row, order_date: "2026-11-25", total: 0 };
    const single = vi.fn().mockResolvedValue({ data: saved, error: null });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    mocks.from.mockReturnValue({ insert });

    const result = await OrdersRepository.create(new Order({ customer_id: CUSTOMER_ID, seller_id: SELLER_ID }));

    const payload = insert.mock.calls[0]?.[0];
    expect(payload).toStrictEqual({
      customer_id: CUSTOMER_ID,
      seller_id: SELLER_ID,
      order_date: undefined,
      status: "pending",
      total: 0,
      active: true,
    });
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty("order_date");
    expect(result.getOrderDate()).toBe("2026-11-25");
  });

  it("deve propagar o erro de chave estrangeira ao criar", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    const single = vi.fn().mockResolvedValue({ data: null, error: foreignKeyError });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    mocks.from.mockReturnValue({ insert });

    await expect(OrdersRepository.create(new Order(data))).rejects.toBe(foreignKeyError);
  });

  it("deve atualizar um pedido pelo ID da entidade", async () => {
    const saved = { ...row, status: "cancelled", total: 0, active: false };
    const maybeSingle = vi.fn().mockResolvedValue({ data: saved, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ update });

    const order = Order.restore(row);
    order.changeStatus("cancelled");
    order.changeTotal(0);
    order.deactivate();

    const result = await OrdersRepository.update(order);

    expect(mocks.from).toHaveBeenCalledWith("orders");
    expect(update).toHaveBeenCalledWith({ ...data, status: "cancelled", total: 0, active: false });
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(maybeSingle).toHaveBeenCalledOnce();
    expect(result.toJSON()).toEqual(saved);
  });

  it("deve recusar atualizar um pedido sem ID", async () => {
    await expect(OrdersRepository.update(new Order(data))).rejects.toThrow(
      "Pedido sem ID não pode ser atualizado."
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("deve propagar o erro de chave estrangeira ao atualizar", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: foreignKeyError });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) });

    await expect(OrdersRepository.update(Order.restore(row))).rejects.toBe(foreignKeyError);
  });

  it("deve remover um pedido e devolver o registro removido", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const deleteMock = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ delete: deleteMock });

    const result = await OrdersRepository.remove(ID);

    expect(mocks.from).toHaveBeenCalledWith("orders");
    expect(deleteMock).toHaveBeenCalledOnce();
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(maybeSingle).toHaveBeenCalledOnce();
    expect(result.toJSON()).toEqual(row);
  });

  it("deve propagar a violação de chave estrangeira ao remover", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: foreignKeyError });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) });

    await expect(OrdersRepository.remove(ID)).rejects.toBe(foreignKeyError);
  });

  describe.each([
    { method: "update", run: () => OrdersRepository.update(Order.restore(row)) },
    { method: "delete", run: () => OrdersRepository.remove(ID) },
  ])("$method de um pedido inexistente", ({ method, run }) => {
    it.each([
      { label: "nenhum registro for afetado", error: null },
      { label: "o ID não for um UUID (erro 22P02)", error: { code: "22P02", message: "invalid input syntax for type uuid" } },
    ])("deve lançar NotFoundError quando $label", async ({ error }) => {
      const maybeSingle = vi.fn().mockResolvedValue({ data: null, error });
      const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
      mocks.from.mockReturnValue({ [method]: vi.fn().mockReturnValue({ eq }) });

      await expect(run()).rejects.toThrow(new NotFoundError("Pedido não encontrado."));
    });
  });
});
