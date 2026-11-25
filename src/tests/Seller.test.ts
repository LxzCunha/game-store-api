import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("../config/supabase.js", () => ({
  default: {
    from: mocks.from,
  },
}));

import { Seller, type SellerData } from "../models/Seller.js";
import SellerRepository from "../repository/SellerRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ValidationError } from "../errors/ValidationError.js";
import { ConflictError } from "../errors/ConflictError.js";

const ID = "11111111-1111-4111-8111-111111111111";
const PERSON_ID = "22222222-2222-4222-8222-222222222222";
const SELECT = "id, person_id, hire_date, person:people(name, email, phone, address)";
const CONFLICT = "Já existe um cadastro com o e-mail informado.";
const DATE_MESSAGE = "A data de contratação deve estar no formato AAAA-MM-DD.";

const personData = {
  name: "João Lima",
  email: "joao@example.com",
  phone: "(11) 98888-7777",
  address: "Av. Central, 500",
};
const data = { ...personData, hire_date: "2024-02-01" };
// Linha como o Supabase devolve: dados da pessoa embutidos em "person".
const row = { id: ID, person_id: PERSON_ID, hire_date: data.hire_date, person: personData };
// Linha gravada em "people".
const personRow = { ...personData, role: "seller" };
// Formato plano exposto por toJSON.
const record = { id: ID, person_id: PERSON_ID, ...personData, role: "seller", hire_date: data.hire_date };
const restored = () => Seller.restore({ id: ID, person_id: PERSON_ID, ...data });

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

describe("Seller - Entidade", () => {
  it("deve criar um vendedor sem IDs, com o papel seller e com nome e e-mail sem espaços nas pontas", () => {
    const seller = new Seller({ ...data, name: "  João Lima  ", email: " joao@example.com " });

    expect(seller.getId()).toBeUndefined();
    expect(seller.getPersonId()).toBeUndefined();
    expect(seller.getRole()).toBe("seller");
    expect(seller.getName()).toBe("João Lima");
    expect(seller.getEmail()).toBe("joao@example.com");
    expect(seller.getPhone()).toBe(data.phone);
    expect(seller.getAddress()).toBe(data.address);
    expect(seller.getHireDate()).toBe(data.hire_date);
  });

  it("deve usar telefone, endereço e data de contratação nulos quando não forem informados", () => {
    const seller = new Seller({ name: "João Lima", email: "joao@example.com" });

    expect(seller.getPhone()).toBeNull();
    expect(seller.getAddress()).toBeNull();
    expect(seller.getHireDate()).toBeNull();
  });

  it("deve aceitar telefone, endereço e data de contratação nulos", () => {
    const seller = new Seller({ ...data, phone: null, address: null, hire_date: null });

    expect(seller.getPhone()).toBeNull();
    expect(seller.getAddress()).toBeNull();
    expect(seller.getHireDate()).toBeNull();
  });

  it.each([undefined, "", "   ", 123])("deve rejeitar o nome %j", (name) => {
    expect(() => new Seller({ ...data, name: name as string })).toThrow(
      new ValidationError("O nome é obrigatório.")
    );
  });

  it.each([undefined, "", "joao", "joao@", "joao@example", "joao @example.com", 123])(
    "deve rejeitar o e-mail %j",
    (email) => {
      expect(() => new Seller({ ...data, email: email as string })).toThrow(
        new ValidationError("Informe um e-mail válido.")
      );
    }
  );

  it("deve rejeitar um telefone que não seja texto", () => {
    expect(() => new Seller({ ...data, phone: 11988887777 as unknown as string })).toThrow(
      new ValidationError("O telefone deve ser um texto.")
    );
  });

  it("deve rejeitar um endereço que não seja texto", () => {
    expect(() => new Seller({ ...data, address: 100 as unknown as string })).toThrow(
      new ValidationError("O endereço deve ser um texto.")
    );
  });

  it.each(["01/02/2024", "2024-2-1", "2023-02-29", "2024-13-01", "", 20240201])(
    "deve rejeitar a data de contratação %j",
    (hireDate) => {
      expect(() => new Seller({ ...data, hire_date: hireDate as string })).toThrow(
        new ValidationError(DATE_MESSAGE)
      );
    }
  );

  it("deve ter sempre o papel seller, ignorando um papel informado nos dados", () => {
    const seller = new Seller({ ...data, role: "customer" } as SellerData);

    expect(seller.getRole()).toBe("seller");
    expect(seller.toJSON().role).toBe("seller");
  });

  it("deve alterar os dados validando e ajustando os novos valores", () => {
    const seller = new Seller(data);

    seller.rename("  João Lima Silva ");
    seller.changeEmail(" joao.silva@example.com ");
    seller.changePhone(null);
    seller.changeAddress(null);
    seller.changeHireDate(null);

    expect(seller.getName()).toBe("João Lima Silva");
    expect(seller.getEmail()).toBe("joao.silva@example.com");
    expect(seller.getPhone()).toBeNull();
    expect(seller.getAddress()).toBeNull();
    expect(seller.getHireDate()).toBeNull();
  });

  it("deve manter os dados anteriores quando uma alteração for rejeitada", () => {
    const seller = restored();

    expect(() => seller.rename("")).toThrow(ValidationError);
    expect(() => seller.changeEmail("joao")).toThrow(ValidationError);
    expect(() => seller.changeHireDate("2023-02-29")).toThrow(ValidationError);

    expect(seller.toJSON()).toEqual(record);
  });

  it("deve restaurar um vendedor do banco com o ID e o ID da pessoa, expondo um JSON plano", () => {
    const seller = restored();

    expect(seller.getId()).toBe(ID);
    expect(seller.getPersonId()).toBe(PERSON_ID);
    expect(seller.toJSON()).toEqual(record);
  });
});

describe("SellerRepository - Testes Unitários", () => {
  beforeEach(() => {
    // resetAllMocks também descarta os retornos enfileirados com mockReturnValueOnce.
    vi.resetAllMocks();
  });

  it("deve listar os vendedores reunindo os dados da pessoa em um único objeto", async () => {
    const { select } = mockFindAll([row]);

    const result = await SellerRepository.findAll();

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("sellers");
    expect(select).toHaveBeenCalledWith(SELECT);
    expect(result[0]).toBeInstanceOf(Seller);
    expect(result.map((seller) => seller.toJSON())).toEqual([record]);
  });

  it("deve retornar uma lista vazia quando não houver vendedores", async () => {
    mockFindAll([]);

    await expect(SellerRepository.findAll()).resolves.toEqual([]);
  });

  it("deve propagar o erro ao listar os vendedores", async () => {
    const error = { code: "XX000", message: "Falha ao listar vendedores" };
    mockFindAll(null, error);

    await expect(SellerRepository.findAll()).rejects.toBe(error);
  });

  it("deve buscar o vendedor pelo ID e reunir os dados da pessoa", async () => {
    const { select, eq, maybeSingle } = mockFindById();

    const result = await SellerRepository.findById(ID);

    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("sellers");
    expect(select).toHaveBeenCalledWith(SELECT);
    expect(eq).toHaveBeenCalledWith("id", ID);
    expect(maybeSingle).toHaveBeenCalledOnce();
    expect(result).toBeInstanceOf(Seller);
    expect(result.toJSON()).toEqual(record);
  });

  // findById e remove começam pela mesma busca; nenhuma outra tabela pode ser tocada se ela falhar.
  const lookups = [
    { operation: "findById", run: (id: string) => SellerRepository.findById(id) },
    { operation: "remove", run: (id: string) => SellerRepository.remove(id) },
  ];

  it.each(lookups)("deve lançar NotFoundError em $operation quando o vendedor não existir", async ({ run }) => {
    mockFindById(null);

    await expect(run(ID)).rejects.toThrow(new NotFoundError("Vendedor não encontrado."));
    expect(mocks.from).toHaveBeenCalledOnce();
  });

  it.each(lookups)(
    "deve lançar NotFoundError em $operation quando o ID não for um UUID (erro 22P02)",
    async ({ run }) => {
      mockFindById(null, { code: "22P02", message: "invalid input syntax for type uuid" });

      await expect(run("abc")).rejects.toThrow(new NotFoundError("Vendedor não encontrado."));
      expect(mocks.from).toHaveBeenCalledOnce();
    }
  );

  it.each(lookups)("deve propagar os demais erros da busca inicial em $operation", async ({ run }) => {
    const error = { code: "XX000", message: "Falha no banco" };
    mockFindById(null, error);

    await expect(run(ID)).rejects.toBe(error);
    expect(mocks.from).toHaveBeenCalledOnce();
  });

  it("deve cadastrar a pessoa com o papel seller, vincular seu ID ao vendedor e reler o registro", async () => {
    const people = mockInsert({ id: PERSON_ID });
    const sellers = mockInsert({ id: ID });
    const lookup = mockFindById();

    const result = await SellerRepository.create(new Seller(data));

    expect(mocks.from.mock.calls).toEqual([["people"], ["sellers"], ["sellers"]]);
    expect(people.insert).toHaveBeenCalledExactlyOnceWith(personRow);
    expect(people.select).toHaveBeenCalledWith("id");
    expect(sellers.insert).toHaveBeenCalledExactlyOnceWith({ person_id: PERSON_ID, hire_date: data.hire_date });
    expect(sellers.select).toHaveBeenCalledWith("id");
    expect(lookup.eq).toHaveBeenCalledWith("id", ID);
    expect(result).toBeInstanceOf(Seller);
    expect(result.toJSON()).toEqual(record);
  });

  it("deve interromper o cadastro se a criação da pessoa falhar", async () => {
    const error = { code: "XX000", message: "Falha ao cadastrar pessoa" };
    mockInsert(null, error);

    await expect(SellerRepository.create(new Seller(data))).rejects.toBe(error);
    expect(mocks.from.mock.calls).toEqual([["people"]]);
  });

  it("deve lançar ConflictError ao cadastrar um e-mail já existente (erro 23505)", async () => {
    mockInsert(null, { code: "23505", message: "duplicate key value violates unique constraint" });

    await expect(SellerRepository.create(new Seller(data))).rejects.toThrow(new ConflictError(CONFLICT));
    expect(mocks.from.mock.calls).toEqual([["people"]]);
  });

  it("deve remover a pessoa criada e propagar o erro quando o cadastro do vendedor falhar", async () => {
    const error = { code: "XX000", message: "Falha ao cadastrar vendedor" };
    mockInsert({ id: PERSON_ID });
    const sellers = mockInsert(null, error);
    const rollback = mockDelete();

    await expect(SellerRepository.create(new Seller(data))).rejects.toBe(error);

    expect(mocks.from.mock.calls).toEqual([["people"], ["sellers"], ["people"]]);
    expect(rollback.deleteMock).toHaveBeenCalledOnce();
    expect(rollback.eq).toHaveBeenCalledExactlyOnceWith("id", PERSON_ID);
    expect(sellers.single).toHaveBeenCalledBefore(rollback.deleteMock);
  });

  it("deve atualizar a pessoa (mantendo o papel seller) e a data usando seus respectivos IDs", async () => {
    const people = mockUpdate();
    const sellers = mockUpdate();
    mockFindById({ ...row, hire_date: "2024-02-02", person: { ...personData, name: "João Lima Silva" } });

    const seller = restored();
    seller.rename("João Lima Silva");
    seller.changeHireDate("2024-02-02");

    const result = await SellerRepository.update(seller);

    expect(mocks.from.mock.calls).toEqual([["people"], ["sellers"], ["sellers"]]);
    expect(people.update).toHaveBeenCalledExactlyOnceWith({ ...personRow, name: "João Lima Silva" });
    expect(people.eq).toHaveBeenCalledExactlyOnceWith("id", PERSON_ID);
    expect(sellers.update).toHaveBeenCalledExactlyOnceWith({ hire_date: "2024-02-02" });
    expect(sellers.eq).toHaveBeenCalledExactlyOnceWith("id", ID);
    expect(people.eq).toHaveBeenCalledBefore(sellers.update);
    expect(result.toJSON()).toEqual({ ...record, name: "João Lima Silva", hire_date: "2024-02-02" });
  });

  it("deve regravar os dados pessoais atuais quando só a data mudar", async () => {
    const people = mockUpdate();
    const sellers = mockUpdate();
    mockFindById({ ...row, hire_date: "2024-02-02" });

    const seller = restored();
    seller.changeHireDate("2024-02-02");

    const result = await SellerRepository.update(seller);

    expect(people.update).toHaveBeenCalledExactlyOnceWith(personRow);
    expect(sellers.update).toHaveBeenCalledExactlyOnceWith({ hire_date: "2024-02-02" });
    expect(result.toJSON()).toEqual({ ...record, hire_date: "2024-02-02" });
  });

  it("deve regravar a data atual quando só os dados pessoais mudarem", async () => {
    const phone = "(11) 97777-6666";
    const people = mockUpdate();
    const sellers = mockUpdate();
    mockFindById({ ...row, person: { ...personData, phone } });

    const seller = restored();
    seller.changePhone(phone);

    const result = await SellerRepository.update(seller);

    expect(people.update).toHaveBeenCalledExactlyOnceWith({ ...personRow, phone });
    expect(sellers.update).toHaveBeenCalledExactlyOnceWith({ hire_date: data.hire_date });
    expect(result.toJSON()).toEqual({ ...record, phone });
  });

  it("deve interromper a atualização se a gravação da pessoa falhar", async () => {
    const error = { code: "XX000", message: "Falha ao atualizar pessoa" };
    mockUpdate(error);

    await expect(SellerRepository.update(restored())).rejects.toBe(error);
    expect(mocks.from.mock.calls).toEqual([["people"]]);
  });

  it("deve lançar ConflictError ao atualizar para um e-mail já existente (erro 23505)", async () => {
    mockUpdate({ code: "23505", message: "duplicate key value violates unique constraint" });

    const seller = restored();
    seller.changeEmail("outro@example.com");

    await expect(SellerRepository.update(seller)).rejects.toThrow(new ConflictError(CONFLICT));
    expect(mocks.from.mock.calls).toEqual([["people"]]);
  });

  it("deve propagar o erro e não reler o vendedor se a gravação da data falhar", async () => {
    const error = { code: "XX000", message: "Falha ao atualizar hire_date" };
    mockUpdate();
    mockUpdate(error);

    await expect(SellerRepository.update(restored())).rejects.toBe(error);
    expect(mocks.from.mock.calls).toEqual([["people"], ["sellers"]]);
  });

  it("deve recusar atualizar um vendedor sem ID", async () => {
    await expect(SellerRepository.update(new Seller(data))).rejects.toThrow(
      "Vendedor sem ID não pode ser atualizado."
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("deve excluir o vendedor antes da pessoa e devolver o registro removido", async () => {
    const lookup = mockFindById();
    const sellers = mockDelete();
    const people = mockDelete();

    const result = await SellerRepository.remove(ID);

    expect(mocks.from.mock.calls).toEqual([["sellers"], ["sellers"], ["people"]]);
    expect(lookup.eq).toHaveBeenCalledWith("id", ID);
    expect(sellers.deleteMock).toHaveBeenCalledOnce();
    expect(sellers.eq).toHaveBeenCalledExactlyOnceWith("id", ID);
    expect(people.eq).toHaveBeenCalledExactlyOnceWith("id", PERSON_ID);
    expect(sellers.eq).toHaveBeenCalledBefore(people.deleteMock);
    expect(result).toBeInstanceOf(Seller);
    expect(result.toJSON()).toEqual(record);
  });

  it("deve preservar a pessoa se houver um pedido vinculado ao vendedor (erro 23503)", async () => {
    const foreignKeyError = { code: "23503", message: "violates foreign key constraint" };
    mockFindById();
    mockDelete(foreignKeyError);

    await expect(SellerRepository.remove(ID)).rejects.toBe(foreignKeyError);
    expect(mocks.from.mock.calls).toEqual([["sellers"], ["sellers"]]);
  });

  it("deve propagar o erro da remoção da pessoa", async () => {
    const error = { code: "XX000", message: "Falha ao remover pessoa" };
    mockFindById();
    mockDelete();
    const people = mockDelete(error);

    await expect(SellerRepository.remove(ID)).rejects.toBe(error);
    expect(people.eq).toHaveBeenCalledExactlyOnceWith("id", PERSON_ID);
  });
});
