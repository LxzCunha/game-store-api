import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: { from: mocks.from },
}));

import OrderItems from "../models/OrderItems.js";

const id = "item-1";
const newRecord = {
  order_id: "order-1",
  game_id: "game-1",
  quantity: 1,
  unit_price: 149.90,
};
const record = { id, ...newRecord };
const updatedRecord = { ...newRecord, quantity: 2, unit_price: 0 };
const filters = [
    ["pedido", "findByOrder", "order_id", "order-1"],
] as const;

describe("OrderItems - Testes Unitários", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each([
    { label: "registros cadastrados", data: [record] },
    { label: "nenhum registro", data: [] },
  ])("deve listar os itens do pedido com $label", async ({ data }) => {
    const select = vi.fn().mockResolvedValue({ data, error: null });
    mocks.from.mockReturnValueOnce({ select });

    await expect(OrderItems.findAll()).resolves.toEqual(data);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("order_items");
    expect(select).toHaveBeenCalledExactlyOnceWith("*");
  });

  it("deve propagar o erro ao listar os itens do pedido", async () => {
    const error = new Error("Falha na listagem");
    const select = vi.fn().mockResolvedValue({ data: null, error });
    mocks.from.mockReturnValueOnce({ select });

    await expect(OrderItems.findAll()).rejects.toBe(error);
  });

  it("deve buscar o item do pedido pelo ID", async () => {
    const single = vi.fn().mockResolvedValue({ data: record, error: null });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ select });

    await expect(OrderItems.findById(id)).resolves.toEqual(record);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("order_items");
    expect(select).toHaveBeenCalledExactlyOnceWith("*");
    expect(eq).toHaveBeenCalledExactlyOnceWith("id", id);
    expect(single).toHaveBeenCalledOnce();
  });

  it.each(filters)("deve listar os itens do pedido por %s", async (_, method, column, filterId) => {
    const eq = vi.fn().mockResolvedValue({ data: [record], error: null });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ select });

    await expect(OrderItems[method](filterId)).resolves.toEqual([record]);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("order_items");
    expect(select).toHaveBeenCalledExactlyOnceWith("*");
    expect(eq).toHaveBeenCalledExactlyOnceWith(column, filterId);
  });

  it.each(filters)("deve retornar uma lista vazia ao filtrar por %s sem resultados", async (_, method, column, filterId) => {
    const eq = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ select });

    await expect(OrderItems[method](filterId)).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledExactlyOnceWith(column, filterId);
  });

  it.each(filters)("deve propagar o erro ao filtrar por %s", async (_, method, column, filterId) => {
    const error = new Error("Falha na consulta por relacionamento");
    const eq = vi.fn().mockResolvedValue({ data: null, error });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ select });

    await expect(OrderItems[method](filterId)).rejects.toBe(error);

    expect(eq).toHaveBeenCalledExactlyOnceWith(column, filterId);
  });

  it("deve criar o item do pedido e retornar o registro inserido", async () => {
    const single = vi.fn().mockResolvedValue({ data: record, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValueOnce({ insert });

    await expect(OrderItems.create(newRecord)).resolves.toEqual(record);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("order_items");
    expect(insert).toHaveBeenCalledExactlyOnceWith(newRecord);
    expect(select).toHaveBeenCalledOnce();
    expect(single).toHaveBeenCalledOnce();
  });

  it("deve propagar o erro de chave estrangeira ao criar", async () => {
    const error = Object.assign(new Error("Violação de chave estrangeira"), { code: "23503" });
    const single = vi.fn().mockResolvedValue({ data: null, error });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValueOnce({ insert });

    await expect(OrderItems.create(newRecord)).rejects.toBe(error);
  });

  it("deve atualizar o item do pedido pelo ID preservando os valores do payload", async () => {
    const savedRecord = { id, ...updatedRecord };
    const single = vi.fn().mockResolvedValue({ data: savedRecord, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ update });

    await expect(OrderItems.update(id, updatedRecord)).resolves.toEqual(savedRecord);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("order_items");
    expect(update).toHaveBeenCalledExactlyOnceWith(updatedRecord);
    expect(eq).toHaveBeenCalledExactlyOnceWith("id", id);
    expect(select).toHaveBeenCalledOnce();
    expect(single).toHaveBeenCalledOnce();
  });

  it("deve excluir o item do pedido pelo ID e retornar o registro removido", async () => {
    const single = vi.fn().mockResolvedValue({ data: record, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const deleteMock = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ delete: deleteMock });

    await expect(OrderItems.remove(id)).resolves.toEqual(record);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("order_items");
    expect(deleteMock).toHaveBeenCalledOnce();
    expect(eq).toHaveBeenCalledExactlyOnceWith("id", id);
    expect(select).toHaveBeenCalledOnce();
    expect(single).toHaveBeenCalledOnce();
  });

  it("deve propagar o erro da consulta quando o ID não existir", async () => {
    const error = Object.assign(new Error("Nenhum registro encontrado"), { code: "PGRST116" });
    const single = vi.fn().mockResolvedValue({ data: null, error });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ select });

    await expect(OrderItems.findById(id)).rejects.toBe(error);
  });

  it.each([
    { method: "update", run: () => OrderItems.update(id, updatedRecord) },
    { method: "delete", run: () => OrderItems.remove(id) },
  ])("deve propagar o erro de $method quando o ID não existir", async ({ method, run }) => {
    const error = Object.assign(new Error("Nenhum registro encontrado"), { code: "PGRST116" });
    const single = vi.fn().mockResolvedValue({ data: null, error });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValueOnce({ [method]: vi.fn().mockReturnValue({ eq }) });

    await expect(run()).rejects.toBe(error);
  });
});
