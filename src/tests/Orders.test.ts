import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: { from: mocks.from },
}));

import Orders from "../models/Orders.js";

const id = "order-1";
const newRecord = {
  customer_id: "customer-1",
  seller_id: "seller-1",
  order_date: "2026-09-29",
  status: "pending",
  total: 149.90,
  active: true,
};
const record = { id, ...newRecord };
const updatedRecord = { ...newRecord, status: "cancelled", total: 0, active: false };
const filters = [
    ["cliente", "findByCustomer", "customer_id", "customer-1"],
    ["vendedor", "findBySeller", "seller_id", "seller-1"],
] as const;

describe("Orders - Testes Unitários", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each([
    { label: "registros cadastrados", data: [record] },
    { label: "nenhum registro", data: [] },
  ])("deve listar os pedidos com $label", async ({ data }) => {
    const select = vi.fn().mockResolvedValue({ data, error: null });
    mocks.from.mockReturnValueOnce({ select });

    await expect(Orders.findAll()).resolves.toEqual(data);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("orders");
    expect(select).toHaveBeenCalledExactlyOnceWith("*");
  });

  it("deve propagar o erro ao listar os pedidos", async () => {
    const error = new Error("Falha na listagem");
    const select = vi.fn().mockResolvedValue({ data: null, error });
    mocks.from.mockReturnValueOnce({ select });

    await expect(Orders.findAll()).rejects.toBe(error);
  });

  it("deve buscar o pedido pelo ID", async () => {
    const single = vi.fn().mockResolvedValue({ data: record, error: null });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ select });

    await expect(Orders.findById(id)).resolves.toEqual(record);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("orders");
    expect(select).toHaveBeenCalledExactlyOnceWith("*");
    expect(eq).toHaveBeenCalledExactlyOnceWith("id", id);
    expect(single).toHaveBeenCalledOnce();
  });

  it.each(filters)("deve listar os pedidos por %s", async (_, method, column, filterId) => {
    const eq = vi.fn().mockResolvedValue({ data: [record], error: null });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ select });

    await expect(Orders[method](filterId)).resolves.toEqual([record]);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("orders");
    expect(select).toHaveBeenCalledExactlyOnceWith("*");
    expect(eq).toHaveBeenCalledExactlyOnceWith(column, filterId);
  });

  it.each(filters)("deve retornar uma lista vazia ao filtrar por %s sem resultados", async (_, method, column, filterId) => {
    const eq = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ select });

    await expect(Orders[method](filterId)).resolves.toEqual([]);

    expect(eq).toHaveBeenCalledExactlyOnceWith(column, filterId);
  });

  it.each(filters)("deve propagar o erro ao filtrar por %s", async (_, method, column, filterId) => {
    const error = new Error("Falha na consulta por relacionamento");
    const eq = vi.fn().mockResolvedValue({ data: null, error });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ select });

    await expect(Orders[method](filterId)).rejects.toBe(error);

    expect(eq).toHaveBeenCalledExactlyOnceWith(column, filterId);
  });

  it("deve criar o pedido e retornar o registro inserido", async () => {
    const single = vi.fn().mockResolvedValue({ data: record, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValueOnce({ insert });

    await expect(Orders.create(newRecord)).resolves.toEqual(record);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("orders");
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

    await expect(Orders.create(newRecord)).rejects.toBe(error);
  });

  it("deve atualizar o pedido pelo ID preservando os valores do payload", async () => {
    const savedRecord = { id, ...updatedRecord };
    const single = vi.fn().mockResolvedValue({ data: savedRecord, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ update });

    await expect(Orders.update(id, updatedRecord)).resolves.toEqual(savedRecord);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("orders");
    expect(update).toHaveBeenCalledExactlyOnceWith(updatedRecord);
    expect(eq).toHaveBeenCalledExactlyOnceWith("id", id);
    expect(select).toHaveBeenCalledOnce();
    expect(single).toHaveBeenCalledOnce();
  });

  it("deve excluir o pedido pelo ID e retornar o registro removido", async () => {
    const single = vi.fn().mockResolvedValue({ data: record, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const deleteMock = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ delete: deleteMock });

    await expect(Orders.remove(id)).resolves.toEqual(record);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("orders");
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

    await expect(Orders.findById(id)).rejects.toBe(error);
  });

  it.each([
    { method: "update", run: () => Orders.update(id, updatedRecord) },
    { method: "delete", run: () => Orders.remove(id) },
  ])("deve propagar o erro de $method quando o ID não existir", async ({ method, run }) => {
    const error = Object.assign(new Error("Nenhum registro encontrado"), { code: "PGRST116" });
    const single = vi.fn().mockResolvedValue({ data: null, error });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValueOnce({ [method]: vi.fn().mockReturnValue({ eq }) });

    await expect(run()).rejects.toBe(error);
  });
});
