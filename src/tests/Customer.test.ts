import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: { from: mocks.from },
}));

vi.mock("../models/Person.js", () => ({
  default: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import Customer from "../models/Customer.js";
import Person from "../models/Person.js";

const id = "customer-1";
const personId = "person-1";
const personData = {
  name: "Maria Souza",
  email: "customer@example.com",
  phone: "(11) 98888-7777",
  address: "Rua das Flores, 100",
};
const person = { id: personId, ...personData, role: "customer" };
const record = { id, person_id: personId, birth_date: "2000-04-15" };
const joinedRecord = { ...record, person };
const expected = { ...person, ...record };
const joinedColumns = "id, person_id, birth_date, person:people(*)";
const lookupOperations = [
  { operation: "findById", run: () => Customer.findById(id) },
  { operation: "update", run: () => Customer.update(id, {}) },
  { operation: "remove", run: () => Customer.remove(id) },
];

function mockLookup(data: typeof joinedRecord | null = joinedRecord, error: Error | null = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });

  mocks.from.mockReturnValueOnce({ select });

  return { select, eq, single };
}

describe("Customer - Testes Unitários", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("deve listar os clientes com os dados de pessoa em um único objeto", async () => {
    const select = vi.fn().mockResolvedValue({ data: [joinedRecord], error: null });
    mocks.from.mockReturnValueOnce({ select });

    await expect(Customer.findAll()).resolves.toEqual([expected]);

    expect(mocks.from).toHaveBeenCalledWith("customers");
    expect(select).toHaveBeenCalledWith(joinedColumns);
  });

  it("deve retornar uma lista vazia quando não houver clientes", async () => {
    const select = vi.fn().mockResolvedValue({ data: [], error: null });
    mocks.from.mockReturnValueOnce({ select });

    await expect(Customer.findAll()).resolves.toEqual([]);
  });

  it("deve propagar o erro ao listar os clientes", async () => {
    const error = new Error("Falha ao listar clientes");
    const select = vi.fn().mockResolvedValue({ data: null, error });
    mocks.from.mockReturnValueOnce({ select });

    await expect(Customer.findAll()).rejects.toBe(error);
  });

  it("deve buscar o cliente pelo ID e reunir os dados da pessoa", async () => {
    const { select, eq, single } = mockLookup();

    await expect(Customer.findById(id)).resolves.toEqual(expected);

    expect(mocks.from).toHaveBeenCalledWith("customers");
    expect(select).toHaveBeenCalledWith(joinedColumns);
    expect(eq).toHaveBeenCalledWith("id", id);
    expect(single).toHaveBeenCalledOnce();
  });

  it.each(lookupOperations)(
    "deve retornar null em $operation quando a consulta não trouxer um registro nem erro",
    async ({ run }) => {
      mockLookup(null);

      await expect(run()).resolves.toBeNull();

      expect(mocks.from).toHaveBeenCalledOnce();
      expect(Person.update).not.toHaveBeenCalled();
      expect(Person.remove).not.toHaveBeenCalled();
    },
  );

  it.each(lookupOperations)(
    "deve propagar o erro da busca inicial em $operation",
    async ({ run }) => {
      const error = Object.assign(new Error("Nenhum registro encontrado"), { code: "PGRST116" });
      mockLookup(null, error);

      await expect(run()).rejects.toBe(error);

      expect(mocks.from).toHaveBeenCalledOnce();
      expect(Person.update).not.toHaveBeenCalled();
      expect(Person.remove).not.toHaveBeenCalled();
    },
  );

  it("deve cadastrar a pessoa com o papel de cliente e vincular seu ID", async () => {
    vi.mocked(Person.create).mockResolvedValueOnce(person);
    const single = vi.fn().mockResolvedValue({ data: record, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValueOnce({ insert });

    await expect(Customer.create({
      ...personData,
      birth_date: record.birth_date,
    })).resolves.toEqual(expected);

    expect(Person.create).toHaveBeenCalledExactlyOnceWith({ ...personData, role: "customer" });
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("customers");
    expect(insert).toHaveBeenCalledExactlyOnceWith({
      person_id: personId,
      birth_date: record.birth_date,
    });
    expect(select).toHaveBeenCalledWith("id, person_id, birth_date");
    expect(single).toHaveBeenCalledOnce();
    expect(Person.remove).not.toHaveBeenCalled();
  });

  it("deve interromper o cadastro se a criação da pessoa falhar", async () => {
    const error = new Error("Falha ao cadastrar pessoa");
    vi.mocked(Person.create).mockRejectedValueOnce(error);

    await expect(Customer.create({
      ...personData,
      birth_date: record.birth_date,
    })).rejects.toBe(error);

    expect(mocks.from).not.toHaveBeenCalled();
    expect(Person.remove).not.toHaveBeenCalled();
  });

  it("deve remover a pessoa criada quando o cadastro de cliente falhar", async () => {
    const error = new Error("Falha ao cadastrar cliente");
    vi.mocked(Person.create).mockResolvedValueOnce(person);
    vi.mocked(Person.remove).mockResolvedValueOnce(person);
    const single = vi.fn().mockResolvedValue({ data: null, error });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mocks.from.mockReturnValueOnce({ insert });

    await expect(Customer.create({
      ...personData,
      birth_date: record.birth_date,
    })).rejects.toBe(error);

    expect(Person.remove).toHaveBeenCalledExactlyOnceWith(personId);
    expect(single).toHaveBeenCalledBefore(vi.mocked(Person.remove));
  });

  it("deve atualizar a data e os dados pessoais usando seus respectivos IDs", async () => {
    mockLookup();
    const name = "Maria Souza Silva";
    const birth_date = "2000-04-16";
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ update });
    vi.mocked(Person.update).mockResolvedValueOnce({ ...person, name });
    mockLookup({ ...joinedRecord, birth_date, person: { ...person, name } });

    await expect(Customer.update(id, { birth_date, name, role: "seller" }))
      .resolves.toEqual({ ...expected, birth_date, name });

    expect(mocks.from.mock.calls).toEqual([["customers"], ["customers"], ["customers"]]);
    expect(update).toHaveBeenCalledExactlyOnceWith({ birth_date });
    expect(eq).toHaveBeenCalledExactlyOnceWith("id", id);
    expect(Person.update).toHaveBeenCalledExactlyOnceWith(personId, { name });
  });

  it("deve atualizar apenas a data quando o payload não tiver dados pessoais", async () => {
    mockLookup();
    const birth_date = "2000-04-16";
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ update });
    mockLookup({ ...joinedRecord, birth_date });

    await expect(Customer.update(id, { birth_date }))
      .resolves.toEqual({ ...expected, birth_date });

    expect(update).toHaveBeenCalledExactlyOnceWith({ birth_date });
    expect(eq).toHaveBeenCalledExactlyOnceWith("id", id);
    expect(Person.update).not.toHaveBeenCalled();
  });

  it("deve atualizar apenas a pessoa quando o payload não tiver a data", async () => {
    mockLookup();
    const phone = "(11) 97777-6666";
    vi.mocked(Person.update).mockResolvedValueOnce({ ...person, phone });
    mockLookup({ ...joinedRecord, person: { ...person, phone } });

    await expect(Customer.update(id, { phone })).resolves.toEqual({ ...expected, phone });

    expect(Person.update).toHaveBeenCalledExactlyOnceWith(personId, { phone });
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it("deve manter o papel da pessoa quando apenas role for enviado", async () => {
    mockLookup();
    mockLookup();

    await expect(Customer.update(id, { role: "seller" })).resolves.toEqual(expected);

    expect(Person.update).not.toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it("deve interromper a atualização dos dados pessoais se a alteração da data falhar", async () => {
    mockLookup();
    const error = new Error("Falha ao atualizar birth_date");
    const eq = vi.fn().mockResolvedValue({ error });
    const update = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ update });

    await expect(Customer.update(id, { birth_date: "2000-04-16", name: "Maria Souza Silva" }))
      .rejects.toBe(error);

    expect(Person.update).not.toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it("deve propagar o erro da atualização da pessoa", async () => {
    mockLookup();
    const error = new Error("Falha ao atualizar pessoa");
    vi.mocked(Person.update).mockRejectedValueOnce(error);

    await expect(Customer.update(id, { name: "Maria Souza Silva" })).rejects.toBe(error);

    expect(mocks.from).toHaveBeenCalledOnce();
  });

  it("deve excluir o cliente antes da pessoa e retornar o registro removido", async () => {
    mockLookup();
    const eq = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ delete: deleteMock });
    vi.mocked(Person.remove).mockResolvedValueOnce(person);

    await expect(Customer.remove(id)).resolves.toEqual(expected);

    expect(mocks.from.mock.calls).toEqual([["customers"], ["customers"]]);
    expect(deleteMock).toHaveBeenCalledOnce();
    expect(eq).toHaveBeenCalledExactlyOnceWith("id", id);
    expect(Person.remove).toHaveBeenCalledExactlyOnceWith(personId);
    expect(eq).toHaveBeenCalledBefore(vi.mocked(Person.remove));
  });

  it("deve preservar a pessoa se houver um pedido vinculado ao cliente", async () => {
    mockLookup();
    const error = Object.assign(new Error("Violação de chave estrangeira"), { code: "23503" });
    const eq = vi.fn().mockResolvedValue({ error });
    const deleteMock = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValueOnce({ delete: deleteMock });

    await expect(Customer.remove(id)).rejects.toBe(error);

    expect(Person.remove).not.toHaveBeenCalled();
  });

  it("deve propagar o erro da remoção da pessoa", async () => {
    mockLookup();
    const eq = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValueOnce({ delete: vi.fn().mockReturnValue({ eq }) });
    const error = new Error("Falha ao remover pessoa");
    vi.mocked(Person.remove).mockRejectedValueOnce(error);

    await expect(Customer.remove(id)).rejects.toBe(error);

    expect(Person.remove).toHaveBeenCalledExactlyOnceWith(personId);
  });
});
