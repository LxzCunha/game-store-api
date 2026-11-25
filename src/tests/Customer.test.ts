import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: {
    from: mocks.from,
  },
}));

import { Customer, type CustomerData } from "../models/Customer.js";
import CustomerRepository from "../repository/CustomerRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ValidationError } from "../errors/ValidationError.js";
import { ConflictError } from "../errors/ConflictError.js";

const ID = "11111111-1111-4111-8111-111111111111";
const PERSON_ID = "22222222-2222-4222-8222-222222222222";
const SELECT = "id, person_id, birth_date, person:people(name, email, phone, address)";
const CONFLICT = "Já existe um cadastro com o e-mail informado.";
const DATE_MESSAGE = "A data de nascimento deve estar no formato AAAA-MM-DD.";

const personData = {
  name: "Maria Souza",
  email: "maria@example.com",
  phone: "(11) 98888-7777",
  address: "Rua das Flores, 100",
};
const data = { ...personData, birth_date: "2000-04-15" };
// Linha como o Supabase devolve: dados da pessoa embutidos em "person".
const row = { id: ID, person_id: PERSON_ID, birth_date: data.birth_date, person: personData };
// Linha gravada em "people".
const personRow = { ...personData, role: "customer" };
// Formato plano exposto por toJSON.
const record = { id: ID, person_id: PERSON_ID, ...personData, role: "customer", birth_date: data.birth_date };
const restored = () => Customer.restore({ id: ID, person_id: PERSON_ID, ...data });

// Cada helper enfileira a próxima chamada a supabase.from(), na ordem em que o repositório a faz.
function mockFindAll(data: unknown, error: unknown = null) {
  const overrideTypes = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn().mockReturnValue({ overrideTypes });
  mocks.from.mockReturnValueOnce({ select });

  return { select };
}

function mockFindById(data: unknown = row, error: unknown = null) {
  const overrideTypes = vi.fn().mockResolvedValue({ data, error });
  const maybeSingle = vi.fn().mockReturnValue({ overrideTypes });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  mocks.from.mockReturnValueOnce({ select });

  return { select, eq, maybeSingle };
}

function mockInsert(data: unknown, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  mocks.from.mockReturnValueOnce({ insert });

  return { insert, select, single };
}

function mockUpdate(error: unknown = null) {
  const eq = vi.fn().mockResolvedValue({ error });
  const update = vi.fn().mockReturnValue({ eq });
  mocks.from.mockReturnValueOnce({ update });

  return { update, eq };
}

function mockDelete(error: unknown = null) {
  const eq = vi.fn().mockResolvedValue({ error });
  const deleteMock = vi.fn().mockReturnValue({ eq });
  mocks.from.mockReturnValueOnce({ delete: deleteMock });

  return { deleteMock, eq };
}

describe("Customer - Entidade", () => {
  it("deve criar um cliente sem IDs, com o papel customer e com nome e e-mail sem espaços nas pontas", () => {
    const customer = new Customer({ ...data, name: "  Maria Souza  ", email: " maria@example.com " });

    expect(customer.getId()).toBeUndefined();
    expect(customer.getPersonId()).toBeUndefined();
    expect(customer.getRole()).toBe("customer");
    expect(customer.getName()).toBe("Maria Souza");
    expect(customer.getEmail()).toBe("maria@example.com");
    expect(customer.getPhone()).toBe(data.phone);
    expect(customer.getAddress()).toBe(data.address);
    expect(customer.getBirthDate()).toBe(data.birth_date);
  });

  it("deve usar telefone, endereço e data de nascimento nulos quando não forem informados", () => {
    const customer = new Customer({ name: "Maria Souza", email: "maria@example.com" });

    expect(customer.getPhone()).toBeNull();
    expect(customer.getAddress()).toBeNull();
    expect(customer.getBirthDate()).toBeNull();
  });

  it("deve aceitar telefone, endereço e data de nascimento nulos", () => {
    const customer = new Customer({ ...data, phone: null, address: null, birth_date: null });

    expect(customer.getPhone()).toBeNull();
    expect(customer.getAddress()).toBeNull();
    expect(customer.getBirthDate()).toBeNull();
  });

  it.each([undefined, "", "   ", 123])("deve rejeitar o nome %j", (name) => {
    expect(() => new Customer({ ...data, name: name as string })).toThrow(
      new ValidationError("O nome é obrigatório.")
    );
  });

  it.each([undefined, "", "maria", "maria@", "maria@example", "maria @example.com", 123])(
    "deve rejeitar o e-mail %j",
    (email) => {
      expect(() => new Customer({ ...data, email: email as string })).toThrow(
        new ValidationError("Informe um e-mail válido.")
      );
    }
  );

  it("deve rejeitar um telefone que não seja texto", () => {
    expect(() => new Customer({ ...data, phone: 11988887777 as unknown as string })).toThrow(
      new ValidationError("O telefone deve ser um texto.")
    );
  });

  it("deve rejeitar um endereço que não seja texto", () => {
    expect(() => new Customer({ ...data, address: 100 as unknown as string })).toThrow(
      new ValidationError("O endereço deve ser um texto.")
    );
  });

  it.each(["15/04/2000", "2000-4-15", "2000-02-30", "2000-13-01", "", 20000415])(
    "deve rejeitar a data de nascimento %j",
    (birthDate) => {
      expect(() => new Customer({ ...data, birth_date: birthDate as string })).toThrow(
        new ValidationError(DATE_MESSAGE)
      );
    }
  );

  it("deve ter sempre o papel customer, ignorando um papel informado nos dados", () => {
    const customer = new Customer({ ...data, role: "seller" } as CustomerData);

    expect(customer.getRole()).toBe("customer");
    expect(customer.toJSON().role).toBe("customer");
  });

  it("deve alterar os dados validando e ajustando os novos valores", () => {
    const customer = new Customer(data);

    customer.rename("  Maria Souza Silva ");
    customer.changeEmail(" maria.silva@example.com ");
    customer.changePhone(null);
    customer.changeAddress(null);
    customer.changeBirthDate(null);

    expect(customer.getName()).toBe("Maria Souza Silva");
    expect(customer.getEmail()).toBe("maria.silva@example.com");
    expect(customer.getPhone()).toBeNull();
    expect(customer.getAddress()).toBeNull();
    expect(customer.getBirthDate()).toBeNull();
  });

  it("deve manter os dados anteriores quando uma alteração for rejeitada", () => {
    const customer = restored();

    expect(() => customer.rename("")).toThrow(ValidationError);
    expect(() => customer.changeEmail("maria")).toThrow(ValidationError);
    expect(() => customer.changeBirthDate("2000-02-30")).toThrow(ValidationError);

    expect(customer.toJSON()).toEqual(record);
  });

  it("deve restaurar um cliente do banco com o ID e o ID da pessoa, expondo um JSON plano", () => {
    const customer = restored();

    expect(customer.getId()).toBe(ID);
    expect(customer.getPersonId()).toBe(PERSON_ID);
    expect(customer.toJSON()).toEqual(record);
  });
});

describe("CustomerRepository - Testes Unitários", () => {
  beforeEach(() => {
    // resetAllMocks também descarta os retornos enfileirados com mockReturnValueOnce.
    vi.resetAllMocks();
  });

  it("deve listar os clientes reunindo os dados da pessoa em um único objeto", async () => {
    const { select } = mockFindAll([row]);

    const result = await CustomerRepository.findAll();

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("customers");
    expect(select).toHaveBeenCalledWith(SELECT);
    expect(result[0]).toBeInstanceOf(Customer);
    expect(result.map((customer) => customer.toJSON())).toEqual([record]);
  });

  it("deve retornar uma lista vazia quando não houver clientes", async () => {
    mockFindAll([]);

    await expect(CustomerRepository.findAll()).resolves.toEqual([]);
  });

  it("deve propagar o erro ao listar os clientes", async () => {
    const error = { code: "XX000", message: "Falha ao listar clientes" };
    mockFindAll(null, error);

    await expect(CustomerRepository.findAll()).rejects.toBe(error);
  });

  it("deve buscar o cliente pelo ID e reunir os dados da pessoa", async () => {
    const { select, eq, maybeSingle } = mockFindById();

    const result = await CustomerRepository.findById(ID);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("customers");
    expect(select).toHaveBeenCalledWith(SELECT);
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(maybeSingle).toHaveBeenCalledOnce();
    expect(result).toBeInstanceOf(Customer);
    expect(result.toJSON()).toEqual(record);
  });

  // findById e remove começam pela mesma busca; nenhuma outra tabela pode ser tocada se ela falhar.
  const lookups = [
    { operation: "findById", run: (id: string) => CustomerRepository.findById(id) },
    { operation: "remove", run: (id: string) => CustomerRepository.remove(id) },
  ];

  it.each(lookups)("deve lançar NotFoundError em $operation quando o cliente não existir", async ({ run }) => {
    mockFindById(null);

    await expect(run(ID)).rejects.toThrow(new NotFoundError("Cliente não encontrado."));
    expect(mocks.from).toHaveBeenCalledOnce();
  });

  it.each(lookups)(
    "deve lançar NotFoundError em $operation quando o ID não for um UUID (erro 22P02)",
    async ({ run }) => {
      mockFindById(null, { code: "22P02", message: "invalid input syntax for type uuid" });

      await expect(run("abc")).rejects.toThrow(new NotFoundError("Cliente não encontrado."));
      expect(mocks.from).toHaveBeenCalledOnce();
    }
  );

  it.each(lookups)("deve propagar os demais erros da busca inicial em $operation", async ({ run }) => {
    const error = { code: "XX000", message: "Falha no banco" };
    mockFindById(null, error);

    await expect(run(ID)).rejects.toBe(error);
    expect(mocks.from).toHaveBeenCalledOnce();
  });

  it("deve cadastrar a pessoa com o papel customer, vincular seu ID ao cliente e reler o registro", async () => {
    const people = mockInsert({ id: PERSON_ID });
    const customers = mockInsert({ id: ID });
    const lookup = mockFindById();

    const result = await CustomerRepository.create(new Customer(data));

    expect(mocks.from.mock.calls).toEqual([["people"], ["customers"], ["customers"]]);
    expect(people.insert).toHaveBeenCalledExactlyOnceWith(personRow);
    expect(people.select).toHaveBeenCalledWith("id");
    expect(customers.insert).toHaveBeenCalledExactlyOnceWith({ person_id: PERSON_ID, birth_date: data.birth_date });
    expect(customers.select).toHaveBeenCalledWith("id");
    expect(lookup.eq).toHaveBeenCalledWith("id", ID);
    expect(result).toBeInstanceOf(Customer);
    expect(result.toJSON()).toEqual(record);
  });

  it("deve interromper o cadastro se a criação da pessoa falhar", async () => {
    const error = { code: "XX000", message: "Falha ao cadastrar pessoa" };
    mockInsert(null, error);

    await expect(CustomerRepository.create(new Customer(data))).rejects.toBe(error);
    expect(mocks.from.mock.calls).toEqual([["people"]]);
  });

  it("deve lançar ConflictError ao cadastrar um e-mail já existente (erro 23505)", async () => {
    mockInsert(null, { code: "23505", message: "duplicate key value violates unique constraint" });

    await expect(CustomerRepository.create(new Customer(data))).rejects.toThrow(new ConflictError(CONFLICT));
    expect(mocks.from.mock.calls).toEqual([["people"]]);
  });

  it("deve remover a pessoa criada e propagar o erro quando o cadastro do cliente falhar", async () => {
    const error = { code: "XX000", message: "Falha ao cadastrar cliente" };
    mockInsert({ id: PERSON_ID });
    const customers = mockInsert(null, error);
    const rollback = mockDelete();

    await expect(CustomerRepository.create(new Customer(data))).rejects.toBe(error);

    expect(mocks.from.mock.calls).toEqual([["people"], ["customers"], ["people"]]);
    expect(rollback.deleteMock).toHaveBeenCalledOnce();
    expect(rollback.eq).toHaveBeenCalledExactlyOnceWith("id", PERSON_ID);
    expect(customers.single).toHaveBeenCalledBefore(rollback.deleteMock);
  });

  it("deve atualizar a pessoa (mantendo o papel customer) e a data usando seus respectivos IDs", async () => {
    const people = mockUpdate();
    const customers = mockUpdate();
    mockFindById({ ...row, birth_date: "2000-04-16", person: { ...personData, name: "Maria Souza Silva" } });

    const customer = restored();
    customer.rename("Maria Souza Silva");
    customer.changeBirthDate("2000-04-16");

    const result = await CustomerRepository.update(customer);

    expect(mocks.from.mock.calls).toEqual([["people"], ["customers"], ["customers"]]);
    expect(people.update).toHaveBeenCalledExactlyOnceWith({ ...personRow, name: "Maria Souza Silva" });
    expect(people.eq).toHaveBeenCalledExactlyOnceWith("id", PERSON_ID);
    expect(customers.update).toHaveBeenCalledExactlyOnceWith({ birth_date: "2000-04-16" });
    expect(customers.eq).toHaveBeenCalledExactlyOnceWith("id", ID);
    expect(people.eq).toHaveBeenCalledBefore(customers.update);
    expect(result.toJSON()).toEqual({ ...record, name: "Maria Souza Silva", birth_date: "2000-04-16" });
  });

  it("deve regravar os dados pessoais atuais quando só a data mudar", async () => {
    const people = mockUpdate();
    const customers = mockUpdate();
    mockFindById({ ...row, birth_date: "2000-04-16" });

    const customer = restored();
    customer.changeBirthDate("2000-04-16");

    const result = await CustomerRepository.update(customer);

    expect(people.update).toHaveBeenCalledExactlyOnceWith(personRow);
    expect(customers.update).toHaveBeenCalledExactlyOnceWith({ birth_date: "2000-04-16" });
    expect(result.toJSON()).toEqual({ ...record, birth_date: "2000-04-16" });
  });

  it("deve regravar a data atual quando só os dados pessoais mudarem", async () => {
    const phone = "(11) 97777-6666";
    const people = mockUpdate();
    const customers = mockUpdate();
    mockFindById({ ...row, person: { ...personData, phone } });

    const customer = restored();
    customer.changePhone(phone);

    const result = await CustomerRepository.update(customer);

    expect(people.update).toHaveBeenCalledExactlyOnceWith({ ...personRow, phone });
    expect(customers.update).toHaveBeenCalledExactlyOnceWith({ birth_date: data.birth_date });
    expect(result.toJSON()).toEqual({ ...record, phone });
  });

  it("deve interromper a atualização se a gravação da pessoa falhar", async () => {
    const error = { code: "XX000", message: "Falha ao atualizar pessoa" };
    mockUpdate(error);

    await expect(CustomerRepository.update(restored())).rejects.toBe(error);
    expect(mocks.from.mock.calls).toEqual([["people"]]);
  });

  it("deve lançar ConflictError ao atualizar para um e-mail já existente (erro 23505)", async () => {
    mockUpdate({ code: "23505", message: "duplicate key value violates unique constraint" });

    const customer = restored();
    customer.changeEmail("outra@example.com");

    await expect(CustomerRepository.update(customer)).rejects.toThrow(new ConflictError(CONFLICT));
    expect(mocks.from.mock.calls).toEqual([["people"]]);
  });

  it("deve propagar o erro e não reler o cliente se a gravação da data falhar", async () => {
    const error = { code: "XX000", message: "Falha ao atualizar birth_date" };
    mockUpdate();
    mockUpdate(error);

    await expect(CustomerRepository.update(restored())).rejects.toBe(error);
    expect(mocks.from.mock.calls).toEqual([["people"], ["customers"]]);
  });

  it("deve recusar atualizar um cliente sem ID", async () => {
    await expect(CustomerRepository.update(new Customer(data))).rejects.toThrow(
      "Cliente sem ID não pode ser atualizado."
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("deve excluir o cliente antes da pessoa e devolver o registro removido", async () => {
    const lookup = mockFindById();
    const customers = mockDelete();
    const people = mockDelete();

    const result = await CustomerRepository.remove(ID);

    expect(mocks.from.mock.calls).toEqual([["customers"], ["customers"], ["people"]]);
    expect(lookup.eq).toHaveBeenCalledWith("id", ID);
    expect(customers.deleteMock).toHaveBeenCalledOnce();
    expect(customers.eq).toHaveBeenCalledExactlyOnceWith("id", ID);
    expect(people.eq).toHaveBeenCalledExactlyOnceWith("id", PERSON_ID);
    expect(customers.eq).toHaveBeenCalledBefore(people.deleteMock);
    expect(result).toBeInstanceOf(Customer);
    expect(result.toJSON()).toEqual(record);
  });

  it("deve preservar a pessoa se houver um pedido vinculado ao cliente (erro 23503)", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    mockFindById();
    mockDelete(foreignKeyError);

    await expect(CustomerRepository.remove(ID)).rejects.toBe(foreignKeyError);
    expect(mocks.from.mock.calls).toEqual([["customers"], ["customers"]]);
  });

  it("deve propagar o erro da remoção da pessoa", async () => {
    const error = { code: "XX000", message: "Falha ao remover pessoa" };
    mockFindById();
    mockDelete();
    const people = mockDelete(error);

    await expect(CustomerRepository.remove(ID)).rejects.toBe(error);
    expect(people.eq).toHaveBeenCalledExactlyOnceWith("id", PERSON_ID);
  });
});
