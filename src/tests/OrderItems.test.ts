import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: {
    from: mocks.from,
  },
}));

import { OrderItem } from "../models/OrderItems.js";
import OrderItemsRepository from "../repository/OrderItemsRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ValidationError } from "../errors/ValidationError.js";

const ID = "11111111-1111-4111-8111-111111111111";
const ORDER_ID = "22222222-2222-4222-8222-222222222222";
const GAME_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_ID = "44444444-4444-4444-8444-444444444444";

const data = {
  order_id: ORDER_ID,
  game_id: GAME_ID,
  quantity: 1,
  unit_price: 149.9,
};

const row = { id: ID, ...data };

describe("OrderItem - Entidade", () => {
  it("deve criar um item do pedido sem ID com os dados informados", () => {
    const orderItem = new OrderItem(data);

    expect(orderItem.getId()).toBeUndefined();
    expect(orderItem.getOrderId()).toBe(ORDER_ID);
    expect(orderItem.getGameId()).toBe(GAME_ID);
    expect(orderItem.getQuantity()).toBe(1);
    expect(orderItem.getUnitPrice()).toBe(149.9);
  });

  it("deve aceitar preço unitário igual a zero", () => {
    expect(new OrderItem({ ...data, unit_price: 0 }).getUnitPrice()).toBe(0);
  });

  it.each([undefined, "", "order-1", 123])("deve rejeitar o order_id %j", (orderId) => {
    expect(() => new OrderItem({ ...data, order_id: orderId as string })).toThrow(
      new ValidationError("O pedido do item (order_id) deve ser um UUID válido.")
    );
  });

  it.each([undefined, "", "game-1", 123])("deve rejeitar o game_id %j", (gameId) => {
    expect(() => new OrderItem({ ...data, game_id: gameId as string })).toThrow(
      new ValidationError("O jogo do item (game_id) deve ser um UUID válido.")
    );
  });

  it.each([
    { label: "ausente", quantity: undefined },
    { label: "zero", quantity: 0 },
    { label: "negativa", quantity: -1 },
    { label: "fracionária", quantity: 1.5 },
    { label: "NaN", quantity: NaN },
    { label: "em texto", quantity: "2" },
  ])("deve rejeitar a quantidade $label", ({ quantity }) => {
    expect(() => new OrderItem({ ...data, quantity: quantity as number })).toThrow(
      new ValidationError("A quantidade deve ser um número inteiro maior que zero.")
    );
  });

  it.each([
    { label: "ausente", unitPrice: undefined },
    { label: "negativo", unitPrice: -0.01 },
    { label: "NaN", unitPrice: NaN },
    { label: "infinito", unitPrice: Infinity },
    { label: "em texto", unitPrice: "149.90" },
    { label: "nulo", unitPrice: null },
  ])("deve rejeitar o preço unitário $label", ({ unitPrice }) => {
    expect(() => new OrderItem({ ...data, unit_price: unitPrice as number })).toThrow(
      new ValidationError("O preço unitário deve ser um número maior ou igual a zero.")
    );
  });

  it("deve alterar pedido, jogo, quantidade e preço unitário", () => {
    const orderItem = new OrderItem(data);

    orderItem.changeOrder(OTHER_ID);
    orderItem.changeGame(OTHER_ID);
    orderItem.changeQuantity(3);
    orderItem.changeUnitPrice(0);

    expect(orderItem.getOrderId()).toBe(OTHER_ID);
    expect(orderItem.getGameId()).toBe(OTHER_ID);
    expect(orderItem.getQuantity()).toBe(3);
    expect(orderItem.getUnitPrice()).toBe(0);
  });

  it("deve manter os valores anteriores quando uma alteração for rejeitada", () => {
    const orderItem = new OrderItem(data);

    expect(() => orderItem.changeQuantity(0)).toThrow(ValidationError);
    expect(() => orderItem.changeUnitPrice(-1)).toThrow(ValidationError);

    expect(orderItem.getQuantity()).toBe(1);
    expect(orderItem.getUnitPrice()).toBe(149.9);
  });

  it("deve restaurar um item do pedido do banco com ID", () => {
    const orderItem = OrderItem.restore(row);

    expect(orderItem.getId()).toBe(ID);
    expect(orderItem.toJSON()).toEqual(row);
  });

  it("deve serializar um item do pedido novo sem ID", () => {
    expect(new OrderItem(data).toJSON()).toStrictEqual({ id: undefined, ...data });
  });
});

describe("OrderItemsRepository - Testes Unitários", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    { label: "registros cadastrados", rows: [row] },
    { label: "nenhum registro", rows: [] },
  ])("deve listar os itens do pedido com $label como entidades", async ({ rows }) => {
    const select = vi.fn().mockResolvedValue({ data: rows, error: null });
    mocks.from.mockReturnValue({ select });

    const result = await OrderItemsRepository.findAll();

    expect(mocks.from).toHaveBeenCalledWith("order_items");
    expect(select).toHaveBeenCalledWith("*");
    result.forEach((orderItem) => expect(orderItem).toBeInstanceOf(OrderItem));
    expect(result.map((orderItem) => orderItem.toJSON())).toEqual(rows);
  });

  it("deve propagar o erro ao listar os itens do pedido", async () => {
    const error = new Error("Falha na listagem");
    const select = vi.fn().mockResolvedValue({ data: null, error });
    mocks.from.mockReturnValue({ select });

    await expect(OrderItemsRepository.findAll()).rejects.toBe(error);
  });

  it("deve buscar um item do pedido pelo ID", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    const result = await OrderItemsRepository.findById(ID);

    expect(mocks.from).toHaveBeenCalledWith("order_items");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(maybeSingle).toHaveBeenCalledOnce();
    expect(result).toBeInstanceOf(OrderItem);
    expect(result.toJSON()).toEqual(row);
  });

  it("deve lançar NotFoundError quando o item do pedido não existir", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrderItemsRepository.findById(ID)).rejects.toThrow(new NotFoundError("Item do pedido não encontrado."));
  });

  it("deve lançar NotFoundError quando o ID não for um UUID (erro 22P02)", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrderItemsRepository.findById("abc")).rejects.toThrow(NotFoundError);
  });

  it("deve propagar outros erros ao buscar um item do pedido pelo ID", async () => {
    const error = { code: "XX000", message: "Falha no banco" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrderItemsRepository.findById(ID)).rejects.toBe(error);
  });

  it("deve listar os itens por pedido", async () => {
    const eq = vi.fn().mockResolvedValue({ data: [row], error: null });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    const result = await OrderItemsRepository.findByOrder(ORDER_ID);

    expect(mocks.from).toHaveBeenCalledWith("order_items");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("order_id", ORDER_ID);
    expect(result[0]).toBeInstanceOf(OrderItem);
    expect(result.map((orderItem) => orderItem.toJSON())).toEqual([row]);
  });

  it("deve retornar uma lista vazia ao filtrar por pedido sem resultados", async () => {
    const eq = vi.fn().mockResolvedValue({ data: [], error: null });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrderItemsRepository.findByOrder(ORDER_ID)).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledWith("order_id", ORDER_ID);
  });

  it("deve retornar uma lista vazia ao filtrar por pedido com ID que não é UUID (erro 22P02)", async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrderItemsRepository.findByOrder("abc")).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledWith("order_id", "abc");
  });

  it("deve propagar o erro ao filtrar por pedido", async () => {
    const error = new Error("Falha na consulta por relacionamento");
    const eq = vi.fn().mockResolvedValue({ data: null, error });
    mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    await expect(OrderItemsRepository.findByOrder(ORDER_ID)).rejects.toBe(error);

    expect(eq).toHaveBeenCalledWith("order_id", ORDER_ID);
  });

  it("deve criar um item do pedido gravando os dados da entidade", async () => {
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValue({ insert });

    const result = await OrderItemsRepository.create(new OrderItem(data));

    expect(mocks.from).toHaveBeenCalledWith("order_items");
    expect(insert).toHaveBeenCalledWith(data);
    expect(select).toHaveBeenCalledOnce();
    expect(single).toHaveBeenCalledOnce();
    expect(result).toBeInstanceOf(OrderItem);
    expect(result.getId()).toBe(ID);
    expect(result.toJSON()).toEqual(row);
  });

  it("deve propagar o erro de chave estrangeira ao criar", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    const single = vi.fn().mockResolvedValue({ data: null, error: foreignKeyError });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    mocks.from.mockReturnValue({ insert });

    await expect(OrderItemsRepository.create(new OrderItem(data))).rejects.toBe(foreignKeyError);
  });

  it("deve atualizar um item do pedido pelo ID da entidade", async () => {
    const saved = { ...row, quantity: 2, unit_price: 0 };
    const maybeSingle = vi.fn().mockResolvedValue({ data: saved, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ update });

    const orderItem = OrderItem.restore(row);
    orderItem.changeQuantity(2);
    orderItem.changeUnitPrice(0);

    const result = await OrderItemsRepository.update(orderItem);

    expect(mocks.from).toHaveBeenCalledWith("order_items");
    expect(update).toHaveBeenCalledWith({ ...data, quantity: 2, unit_price: 0 });
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(maybeSingle).toHaveBeenCalledOnce();
    expect(result.toJSON()).toEqual(saved);
  });

  it("deve recusar atualizar um item do pedido sem ID", async () => {
    await expect(OrderItemsRepository.update(new OrderItem(data))).rejects.toThrow(
      "Item do pedido sem ID não pode ser atualizado."
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("deve propagar o erro de chave estrangeira ao atualizar", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: foreignKeyError });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) });

    await expect(OrderItemsRepository.update(OrderItem.restore(row))).rejects.toBe(foreignKeyError);
  });

  it("deve remover um item do pedido e devolver o registro removido", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const deleteMock = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ delete: deleteMock });

    const result = await OrderItemsRepository.remove(ID);

    expect(mocks.from).toHaveBeenCalledWith("order_items");
    expect(deleteMock).toHaveBeenCalledOnce();
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(maybeSingle).toHaveBeenCalledOnce();
    expect(result.toJSON()).toEqual(row);
  });

  it("deve propagar outros erros ao remover", async () => {
    const error = { code: "XX000", message: "Falha no banco" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error });
    const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
    mocks.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) });

    await expect(OrderItemsRepository.remove(ID)).rejects.toBe(error);
  });

  describe.each([
    { method: "update", run: () => OrderItemsRepository.update(OrderItem.restore(row)) },
    { method: "delete", run: () => OrderItemsRepository.remove(ID) },
  ])("$method de um item do pedido inexistente", ({ method, run }) => {
    it.each([
      { label: "nenhum registro for afetado", error: null },
      { label: "o ID não for um UUID (erro 22P02)", error: { code: "22P02", message: "invalid input syntax for type uuid" } },
    ])("deve lançar NotFoundError quando $label", async ({ error }) => {
      const maybeSingle = vi.fn().mockResolvedValue({ data: null, error });
      const eq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) });
      mocks.from.mockReturnValue({ [method]: vi.fn().mockReturnValue({ eq }) });

      await expect(run()).rejects.toThrow(new NotFoundError("Item do pedido não encontrado."));
    });
  });
});
