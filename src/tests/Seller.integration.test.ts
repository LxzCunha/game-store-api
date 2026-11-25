import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import SellerRepository from "../repository/SellerRepository.js";
import { Seller } from "../models/Seller.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

vi.mock("../config/supabase.js", () => ({
  default: {},
}));

vi.mock("../repository/SellerRepository.js", () => ({
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
const basePath = "/sellers";
const recordPath = `${basePath}/${ID}`;
const newRecord = {
  name: "João Lima",
  email: "joao@example.com",
  phone: "(11) 98888-7777",
  address: "Av. Central, 500",
  hire_date: "2024-02-01",
};
const record = { id: ID, person_id: PERSON_ID, role: "seller", ...newRecord };
const changes = { phone: "(11) 97777-6666", hire_date: "2024-02-02" };
const seller = () => Seller.restore({ id: ID, person_id: PERSON_ID, ...newRecord });

// Simula o banco devolvendo o vendedor recém-criado com os IDs gerados.
const persisted = (created: Seller) =>
  Seller.restore({
    id: ID,
    person_id: PERSON_ID,
    name: created.getName(),
    email: created.getEmail(),
    phone: created.getPhone(),
    address: created.getAddress(),
    hire_date: created.getHireDate(),
  });

describe("Seller - Testes de Integração", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("deve retornar status 200 e listar os vendedores", async () => {
    vi.mocked(SellerRepository.findAll).mockResolvedValueOnce([seller()]);

    const response = await request(app).get(basePath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([record]);
    expect(SellerRepository.findAll).toHaveBeenCalledExactlyOnceWith();
  });

  it("deve retornar status 200 ao buscar um vendedor pelo ID", async () => {
    vi.mocked(SellerRepository.findById).mockResolvedValueOnce(seller());

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(SellerRepository.findById).toHaveBeenCalledExactlyOnceWith(ID);
  });

  it("deve retornar status 404 quando a busca por ID não encontrar um vendedor", async () => {
    vi.mocked(SellerRepository.findById).mockRejectedValueOnce(new NotFoundError("Vendedor não encontrado."));

    const response = await request(app).get(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Vendedor não encontrado." });
    expect(SellerRepository.findById).toHaveBeenCalledExactlyOnceWith(ID);
  });

  it("deve retornar status 201 ao criar um vendedor", async () => {
    vi.mocked(SellerRepository.create).mockImplementationOnce(async (created) => persisted(created));

    const response = await request(app)
      .post(basePath)
      .send({ ...newRecord, name: "  João Lima ", email: " joao@example.com " });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(record);

    const created = vi.mocked(SellerRepository.create).mock.calls[0]?.[0];
    expect(created).toBeInstanceOf(Seller);
    expect(created?.toJSON()).toEqual({ ...record, id: undefined, person_id: undefined });
  });

  it("deve ignorar o papel enviado no corpo ao criar um vendedor", async () => {
    vi.mocked(SellerRepository.create).mockImplementationOnce(async (created) => persisted(created));

    const response = await request(app).post(basePath).send({ ...newRecord, role: "customer" });

    expect(response.status).toBe(201);
    expect(response.body.role).toBe("seller");
    expect(vi.mocked(SellerRepository.create).mock.calls[0]?.[0].getRole()).toBe("seller");
  });

  it.each([
    { caso: "o nome não for informado", body: { email: newRecord.email }, message: "O nome é obrigatório." },
    { caso: "o e-mail for inválido", body: { ...newRecord, email: "joao.example.com" }, message: "Informe um e-mail válido." },
    {
      caso: "a data de contratação for inválida",
      body: { ...newRecord, hire_date: "01/02/2024" },
      message: "A data de contratação deve estar no formato AAAA-MM-DD.",
    },
    { caso: "o telefone não for texto", body: { ...newRecord, phone: 11988887777 }, message: "O telefone deve ser um texto." },
  ])("deve retornar status 400 e não gravar quando $caso", async ({ body, message }) => {
    const response = await request(app).post(basePath).send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
    expect(SellerRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o corpo não for enviado", async () => {
    const response = await request(app).post(basePath);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "O nome é obrigatório." });
    expect(SellerRepository.create).not.toHaveBeenCalled();
  });

  it("deve retornar status 400 quando o JSON for malformado", async () => {
    const response = await request(app)
      .post(basePath)
      .set("Content-Type", "application/json")
      .send('{"name": ');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Requisição inválida." });
  });

  it("deve retornar status 409 ao criar um vendedor com e-mail já cadastrado", async () => {
    vi.mocked(SellerRepository.create).mockRejectedValueOnce(new ConflictError(CONFLICT));

    const response = await request(app).post(basePath).send(newRecord);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: CONFLICT });
  });

  it("deve retornar status 200 ao atualizar só os campos enviados", async () => {
    vi.mocked(SellerRepository.findById).mockResolvedValueOnce(seller());
    vi.mocked(SellerRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...record, ...changes });
    expect(SellerRepository.findById).toHaveBeenCalledExactlyOnceWith(ID);
    expect(SellerRepository.update).toHaveBeenCalledExactlyOnceWith(expect.any(Seller));
  });

  it("deve manter o papel seller quando apenas role for enviado na atualização", async () => {
    vi.mocked(SellerRepository.findById).mockResolvedValueOnce(seller());
    vi.mocked(SellerRepository.update).mockImplementationOnce(async (updated) => updated);

    const response = await request(app).put(recordPath).send({ role: "customer" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(record);
    expect(vi.mocked(SellerRepository.update).mock.calls[0]?.[0].getRole()).toBe("seller");
  });

  it("deve retornar status 404 ao atualizar um vendedor que não existe", async () => {
    vi.mocked(SellerRepository.findById).mockRejectedValueOnce(new NotFoundError("Vendedor não encontrado."));

    const response = await request(app).put(recordPath).send(changes);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Vendedor não encontrado." });
    expect(SellerRepository.update).not.toHaveBeenCalled();
  });

  it.each([
    { caso: "nome vazio", body: { name: "" }, message: "O nome é obrigatório." },
    { caso: "e-mail inválido", body: { email: "joao" }, message: "Informe um e-mail válido." },
    {
      caso: "data de contratação inexistente",
      body: { hire_date: "2023-02-29" },
      message: "A data de contratação deve estar no formato AAAA-MM-DD.",
    },
  ])("deve retornar status 400 e não gravar ao atualizar com $caso", async ({ body, message }) => {
    vi.mocked(SellerRepository.findById).mockResolvedValueOnce(seller());

    const response = await request(app).put(recordPath).send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
    expect(SellerRepository.update).not.toHaveBeenCalled();
  });

  it("deve retornar status 409 ao atualizar para um e-mail já cadastrado", async () => {
    vi.mocked(SellerRepository.findById).mockResolvedValueOnce(seller());
    vi.mocked(SellerRepository.update).mockRejectedValueOnce(new ConflictError(CONFLICT));

    const response = await request(app).put(recordPath).send({ email: "outro@example.com" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: CONFLICT });
  });

  it("deve retornar status 200 ao remover um vendedor", async () => {
    vi.mocked(SellerRepository.remove).mockResolvedValueOnce(seller());

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Vendedor removido com sucesso." });
    expect(SellerRepository.remove).toHaveBeenCalledExactlyOnceWith(ID);
  });

  it("deve retornar status 404 quando a remoção não encontrar um vendedor", async () => {
    vi.mocked(SellerRepository.remove).mockRejectedValueOnce(new NotFoundError("Vendedor não encontrado."));

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Vendedor não encontrado." });
    expect(SellerRepository.remove).toHaveBeenCalledExactlyOnceWith(ID);
  });

  it("deve retornar status 409 quando existirem pedidos vinculados ao vendedor", async () => {
    vi.mocked(SellerRepository.remove).mockRejectedValueOnce({ code: "23503", message: "foreign key" });

    const response = await request(app).delete(recordPath);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Não é possível remover este vendedor pois existem pedidos vinculados a ele.",
    });
    expect(SellerRepository.remove).toHaveBeenCalledExactlyOnceWith(ID);
  });

  it.each([
    {
      operation: "listagem",
      method: "findAll",
      send: () => request(app).get(basePath),
      args: [],
      message: "Erro ao buscar vendedores.",
    },
    {
      operation: "busca por ID",
      method: "findById",
      send: () => request(app).get(recordPath),
      args: [ID],
      message: "Erro ao buscar vendedor.",
    },
    {
      operation: "criação",
      method: "create",
      send: () => request(app).post(basePath).send(newRecord),
      args: [expect.any(Seller)],
      message: "Erro ao criar vendedor.",
    },
    {
      operation: "atualização",
      method: "update",
      send: () => {
        vi.mocked(SellerRepository.findById).mockResolvedValueOnce(seller());
        return request(app).put(recordPath).send(changes);
      },
      args: [expect.any(Seller)],
      message: "Erro ao atualizar vendedor.",
    },
    {
      operation: "remoção",
      method: "remove",
      send: () => request(app).delete(recordPath),
      args: [ID],
      message: "Erro ao remover vendedor.",
    },
  ] as const)("deve retornar status 500 quando a $operation falhar", async ({ method, send, args, message }) => {
    vi.mocked(SellerRepository[method]).mockRejectedValueOnce(new Error("Falha simulada no banco"));

    const response = await send();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message });
    expect(SellerRepository[method]).toHaveBeenCalledExactlyOnceWith(...args);
  });
});
