import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import CustomerRepository from "../repository/CustomerRepository.js";
import { Customer } from "../models/Customer.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../repository/CustomerRepository.js", () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import app from "../app.js";

const ID = "11111111-1111-4111-8111-111111111111";
const PERSON_ID = "22222222-2222-4222-8222-222222222222";
const CONFLICT = "Já existe um cadastro com o e-mail informado.";
const basePath = "/customers";
const recordPath = `${basePath}/${ID}`;
const newRecord = {
  name: "Maria Souza",
  email: "maria@example.com",
  phone: "(11) 98888-7777",
  address: "Rua das Flores, 100",
  birth_date: "2000-04-15",
};
const record = { id: ID, person_id: PERSON_ID, role: "customer", ...newRecord };
const changes = { phone: "(11) 97777-6666", birth_date: "2000-04-16" };
const customer = () => Customer.restore({ id: ID, person_id: PERSON_ID, ...newRecord });

// Simula o banco devolvendo o cliente recém-criado com os IDs gerados.
const persisted = (created: Customer) =>
  Customer.restore({
    id: ID,
    person_id: PERSON_ID,
    name: created.getName(),
    email: created.getEmail(),
    phone: created.getPhone(),
    address: created.getAddress(),
    birth_date: created.getBirthDate(),
  });

describe("Customer - Testes de Integração", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("deve retornar status 200 e listar os clientes", async () => {
    vi.mocked(CustomerRepository.findAll).mockResolvedValueOnce([customer()]);

    const response = await request(app).get(basePath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record]);
    expect(CustomerRepository.findAll).toHaveBeenCalledExactlyOnceWith();
  });

  it("deve retornar status 200 ao buscar um cliente pelo ID", async () => {
    vi.mocked(CustomerRepository.findById).mockResolvedValueOnce(customer());

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(CustomerRepository.findById).toHaveBeenCalledExactlyOnceWith(ID);
  });

  it("deve retornar status 404 quando a busca por ID não encontrar um cliente", async () => {
    vi.mocked(CustomerRepository.findById).mockRejectedValueOnce(new NotFoundError("Cliente não encontrado."));

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Cliente não encontrado." });
    expect(CustomerRepository.findById).toHaveBeenCalledExactlyOnceWith(ID);
  });

  it("deve retornar status 201 ao criar um cliente", async () => {
    vi.mocked(CustomerRepository.create).mockImplementationOnce(async (created) => persisted(created));

    const response = await request(app)
      .post(basePath)
      .send({ ...newRecord, name: "  Maria Souza ", email: " maria@example.com " });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(record);

    const created = vi.mocked(CustomerRepository.create).mock.calls[0]?.[0];
    expect(created).toBeInstanceOf(Customer);
    expect(created?.toJSON()).toEqual({ ...record, id: undefined, person_id: undefined });
  });

  it("deve ignorar o papel enviado no corpo ao criar um cliente", async () => {
    vi.mocked(CustomerRepository.create).mockImplementationOnce(async (created) => persisted(created));

    const response = await request(app).post(basePath).send({ ...newRecord, role: "seller" });

    expect(response.status).toBe(201);
    expect(response.body.role).toBe("customer");
    expect(vi.mocked(CustomerRepository.create).mock.calls[0]?.[0].getRole()).toBe("customer");
  });

  it.each([
    { caso: "o nome não for informado", body: { email: newRecord.email }, message: "O nome é obrigatório." },
    { caso: "o e-mail for inválido", body: { ...newRecord, email: "maria.example.com" }, message: "Informe um e-mail válido." },
    {
      caso: "a data de nascimento for inválida",
      body: { ...newRecord, birth_date: "15/04/2000" },
      message: "A data de nascimento deve estar no formato AAAA-MM-DD.",
    },
    { caso: "o telefone não for texto", body: { ...newRecord, phone: 11988887777 }, message: "O telefone deve ser um texto." },
  ])("deve retornar status 400 e não gravar quando $caso", async ({ body, message }) => {
    const response = await request(app).post(basePath).send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
    expect(CustomerRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o corpo não for enviado", async () => {
    const response = await request(app).post(basePath);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O nome é obrigatório." });
    expect(CustomerRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o JSON for malformado", async () => {
    const response = await request(app)
      .post(basePath)
      .set("Content-Type", "application/json")
      .send('{"name": ');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Requisição inválida." });
  });

  it("deve retornar status 409 ao criar um cliente com e-mail já cadastrado", async () => {
    vi.mocked(CustomerRepository.create).mockRejectedValueOnce(new ConflictError(CONFLICT));

    const response = await request(app).post(basePath).send(newRecord);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: CONFLICT });
  });

  it("deve retornar status 200 ao atualizar só os campos enviados", async () => {
    vi.mocked(CustomerRepository.findById).mockResolvedValueOnce(customer());
    vi.mocked(CustomerRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...record, ...changes });
    expect(CustomerRepository.findById).toHaveBeenCalledExactlyOnceWith(ID);
    expect(CustomerRepository.update).toHaveBeenCalledExactlyOnceWith(expect.any(Customer));
  });

  it("deve manter o papel customer quando apenas role for enviado na atualização", async () => {
    vi.mocked(CustomerRepository.findById).mockResolvedValueOnce(customer());
    vi.mocked(CustomerRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(recordPath).send({ role: "seller" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(vi.mocked(CustomerRepository.update).mock.calls[0]?.[0].getRole()).toBe("customer");
  });

  it("deve retornar status 404 ao atualizar um cliente que não existe", async () => {
    vi.mocked(CustomerRepository.findById).mockRejectedValueOnce(new NotFoundError("Cliente não encontrado."));

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Cliente não encontrado." });
    expect(CustomerRepository.update).not.toHaveBeenCalled();
  });

  it.each([
    { caso: "nome vazio", body: { name: "" }, message: "O nome é obrigatório." },
    { caso: "e-mail inválido", body: { email: "maria" }, message: "Informe um e-mail válido." },
    {
      caso: "data de nascimento inexistente",
      body: { birth_date: "2000-02-30" },
      message: "A data de nascimento deve estar no formato AAAA-MM-DD.",
    },
  ])("deve retornar status 400 e não gravar ao atualizar com $caso", async ({ body, message }) => {
    vi.mocked(CustomerRepository.findById).mockResolvedValueOnce(customer());

    const response = await request(app).put(recordPath).send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
    expect(CustomerRepository.update).not.toHaveBeenCalled();
  });

  it("deve retornar status 409 ao atualizar para um e-mail já cadastrado", async () => {
    vi.mocked(CustomerRepository.findById).mockResolvedValueOnce(customer());
    vi.mocked(CustomerRepository.update).mockRejectedValueOnce(new ConflictError(CONFLICT));

    const response = await request(app).put(recordPath).send({ email: "outra@example.com" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: CONFLICT });
  });

  it("deve retornar status 200 ao remover um cliente", async () => {
    vi.mocked(CustomerRepository.remove).mockResolvedValueOnce(customer());

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Cliente removido com sucesso." });
    expect(CustomerRepository.remove).toHaveBeenCalledExactlyOnceWith(ID);
  });

  it("deve retornar status 404 quando a remoção não encontrar um cliente", async () => {
    vi.mocked(CustomerRepository.remove).mockRejectedValueOnce(new NotFoundError("Cliente não encontrado."));

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Cliente não encontrado." });
    expect(CustomerRepository.remove).toHaveBeenCalledExactlyOnceWith(ID);
  });

  it("deve retornar status 409 quando existirem pedidos vinculados ao cliente", async () => {
    vi.mocked(CustomerRepository.remove).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Não é possível remover este cliente pois existem pedidos vinculados a ele.",
    });
    expect(CustomerRepository.remove).toHaveBeenCalledExactlyOnceWith(ID);
  });

  it.each([
    {
      operation: "listagem",
      method: "findAll",
      send: () => request(app).get(basePath),
      args: [],
      message: "Erro ao buscar clientes.",
    },
    {
      operation: "busca por ID",
      method: "findById",
      send: () => request(app).get(recordPath),
      args: [ID],
      message: "Erro ao buscar cliente.",
    },
    {
      operation: "criação",
      method: "create",
      send: () => request(app).post(basePath).send(newRecord),
      args: [expect.any(Customer)],
      message: "Erro ao criar cliente.",
    },
    {
      operation: "atualização",
      method: "update",
      send: () => {
        vi.mocked(CustomerRepository.findById).mockResolvedValueOnce(customer());
        return request(app).put(recordPath).send(changes);
      },
      args: [expect.any(Customer)],
      message: "Erro ao atualizar cliente.",
    },
    {
      operation: "remoção",
      method: "remove",
      send: () => request(app).delete(recordPath),
      args: [ID],
      message: "Erro ao remover cliente.",
    },
  ] as const)("deve retornar status 500 quando a $operation falhar", async ({ method, send, args, message }) => {
    vi.mocked(CustomerRepository[method]).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await send();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message });
    expect(CustomerRepository[method]).toHaveBeenCalledExactlyOnceWith(...args);
  });
});
