# Game Store API

API REST para o gerenciamento de uma **loja de jogos eletrônicos**, desenvolvida como Atividade Prática Supervisionada (APS) da disciplina de Desenvolvimento Back-end da UniSenai-PR.

**Problema que resolve:** lojas de jogos precisam controlar o catálogo de produtos, os clientes, os vendedores e as vendas realizadas. Quando esse controle é feito em planilhas ou no papel, surgem erros de estoque, cadastros duplicados e pouca rastreabilidade das vendas.

**Domínio escolhido:** loja de jogos (Game Store).

**Objetivo da API:** disponibilizar endpoints REST, com persistência no Supabase/PostgreSQL, para cadastrar, consultar, atualizar e remover gêneros, jogos, clientes, vendedores, pedidos de venda e itens de pedido.

---

## 👥 Integrantes da equipe

| Nome completo |
|---|
| Alexandre Cunha |
| Matheus Grisard |
| Leonardo Michaki |

---

## Tecnologias utilizadas

- **Node.js** — ambiente de execução JavaScript
- **TypeScript** — tipagem estática para o JavaScript
- **Express 5** — framework para construção da API
- **Supabase** (`@supabase/supabase-js`) — cliente de acesso ao banco de dados
- **PostgreSQL** — banco de dados relacional hospedado no Supabase
- **tsx** — execução de arquivos TypeScript em modo de desenvolvimento
- **Git e GitHub** — versionamento e hospedagem do código

---

## Entidades e relacionamentos

**Gênero** (`genres`)
- id
- nome
- descrição
- ativo

**Jogo** (`games`)
- id
- gênero
- título
- descrição
- preço
- quantidade em estoque
- data de lançamento
- desenvolvedora
- imagem
- ativo

**Pessoa** (`people`) — guarda os dados comuns a clientes e vendedores
- id
- nome
- e-mail
- papel (`customer` ou `seller`)
- telefone
- endereço

**Cliente** (`customers`)
- id
- pessoa
- data de nascimento

**Vendedor** (`sellers`)
- id
- pessoa
- data de contratação

**Pedido** (`orders`)
- id
- cliente
- vendedor
- data do pedido
- status
- total
- ativo

**Item do pedido** (`order_items`)
- id
- pedido
- jogo
- quantidade
- preço unitário

### Relacionamentos

- Um **Gênero** pode possuir vários **Jogos**, e cada **Jogo** pertence a um **Gênero** (1:N).
- Cada **Cliente** e cada **Vendedor** está ligado a exatamente uma **Pessoa** (1:1). Ao cadastrar um cliente ou vendedor pela API, a pessoa correspondente é criada automaticamente.
- Um **Cliente** pode realizar vários **Pedidos**, e cada **Pedido** pertence a um **Cliente** (1:N).
- Um **Vendedor** pode registrar vários **Pedidos**, e cada **Pedido** é registrado por um **Vendedor** (1:N).
- Um **Pedido** possui vários **Itens do pedido**, e cada item referencia um **Jogo**. Dessa forma, pedidos e jogos têm uma relação N:N por meio da tabela `order_items`.

```
genres 1 ──── N games 1 ──── N order_items N ──── 1 orders
                                                   │     │
                                  customers 1 ─── N┘     └N ─── 1 sellers
                                      │ 1:1                        │ 1:1
                                      └────────── people ──────────┘
```

---

## Estrutura do projeto

```
game-store-api/
├── src/
│   ├── config/
│   │   └── supabase.ts     # conexão com o Supabase usando as variáveis de ambiente
│   ├── controllers/        # recebem as requisições, validam os dados e definem as respostas HTTP
│   ├── models/             # realizam as consultas e alterações no banco (Supabase)
│   ├── routes/             # associam cada método HTTP e rota ao controller correspondente
│   ├── app.ts              # configuração do Express e registro das rotas
│   └── server.ts           # inicialização do servidor
├── .env.example            # modelo das variáveis de ambiente
├── .gitignore
├── package.json
├── tsconfig.json
├── game-store-api.postman_collection.json  # collection do Postman com todos os endpoints
└── README.md
```

**Fluxo de uma requisição:** `routes` → `controllers` → `models` → Supabase → resposta em JSON.

---

## Configuração e execução

**Pré-requisitos:** Node.js 22 ou superior e uma conta no [Supabase](https://supabase.com).

**1. Clonar o repositório**

```bash
git clone https://github.com/LxzCunha/game-store-api.git
cd game-store-api
```

**2. Instalar as dependências**

```bash
npm install
```

**3. Criar as tabelas no banco**

No painel do Supabase, acesse **SQL Editor → New query**, cole o script da seção [Banco de dados](#️-banco-de-dados) e clique em **Run**.

**4. Configurar as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto a partir do modelo:

```bash
cp .env.example .env
```

Depois, preencha o `.env` com os dados do seu projeto Supabase.

**5. Iniciar a aplicação**

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3030`.

**6. Testar com o Postman (opcional)**

No Postman, clique em **Import** e selecione o arquivo `game-store-api.postman_collection.json`, na raiz do projeto. A collection traz todos os endpoints já com corpos de exemplo. Os IDs ficam em variáveis da collection (`genreId`, `gameId`, `customerId`, `sellerId`, `orderId`, `orderItemId`): ao cadastrar um registro pelo `POST`, o ID retornado é salvo automaticamente na variável correspondente.

---

## Variáveis de ambiente

| Variável | Descrição | Onde encontrar |
|---|---|---|
| `SUPABASE_URL` | URL do projeto Supabase | Supabase → Project Settings → API |
| `SUPABASE_SECRET_KEY` | Chave secreta de acesso ao projeto | Supabase → Project Settings → API |

Conteúdo do arquivo `.env.example`, disponível no repositório apenas com valores de exemplo:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sua-chave-secreta-aqui
```

> **Importante:** o arquivo `.env` com as credenciais reais está listado no `.gitignore` e **não deve ser enviado ao repositório**.

---

## Banco de dados

Todas as tabelas utilizam **UUID** como chave primária, gerado automaticamente pelo banco com `gen_random_uuid()`. Os relacionamentos entre as tabelas são feitos por **chaves estrangeiras (Foreign Keys)**.

| Tabela | Chave primária | Chaves estrangeiras |
|---|---|---|
| `genres` | `id` (uuid) | — |
| `games` | `id` (uuid) | `genre_id` → `genres.id` |
| `people` | `id` (uuid) | — |
| `customers` | `id` (uuid) | `person_id` → `people.id` |
| `sellers` | `id` (uuid) | `person_id` → `people.id` |
| `orders` | `id` (uuid) | `customer_id` → `customers.id`, `seller_id` → `sellers.id` |
| `order_items` | `id` (uuid) | `order_id` → `orders.id`, `game_id` → `games.id` |

Um registro que ainda é referenciado por outro não pode ser excluído. Por exemplo, não é possível remover um gênero que possui jogos cadastrados, nem um cliente que possui pedidos.

### Script de criação das tabelas

```sql
create table genres (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    description text,
    active      boolean not null default true
);

create table games (
    id             uuid primary key default gen_random_uuid(),
    genre_id       uuid not null references genres (id),
    title          text not null,
    description    text,
    price          numeric(10, 2) not null,
    stock_quantity integer not null default 0,
    release_date   date,
    developer      text,
    image          text,
    active         boolean not null default true
);

create table people (
    id      uuid primary key default gen_random_uuid(),
    name    text not null,
    email   text not null unique,
    role    text not null,
    phone   text,
    address text
);

create table customers (
    id         uuid primary key default gen_random_uuid(),
    person_id  uuid not null references people (id) on delete cascade,
    birth_date date
);

create table sellers (
    id        uuid primary key default gen_random_uuid(),
    person_id uuid not null references people (id) on delete cascade,
    hire_date date
);

create table orders (
    id          uuid primary key default gen_random_uuid(),
    customer_id uuid not null references customers (id),
    seller_id   uuid not null references sellers (id),
    order_date  date not null default current_date,
    status      text not null default 'pending',
    total       numeric(10, 2) not null default 0,
    active      boolean not null default true
);

create table order_items (
    id         uuid primary key default gen_random_uuid(),
    order_id   uuid not null references orders (id),
    game_id    uuid not null references games (id),
    quantity   integer not null,
    unit_price numeric(10, 2) not null
);
```

---

## Documentação dos endpoints

Todas as requisições e respostas utilizam **JSON**. Nas rotas com `:id`, `:genreId`, `:customerId`, `:sellerId` e `:orderId`, o identificador deve ser um **UUID**. As rotas de listagem por relacionamento retornam uma lista vazia (`[]`) quando não há registros. Os corpos das requisições de criação e atualização estão na seção [Exemplos de requisições](#-exemplos-de-requisições).

### Gêneros

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/genres` | Lista todos os gêneros | — |
| GET | `/genres/:id` | Consulta um gênero pelo ID | `id` na URL |
| POST | `/genres` | Cadastra um novo gênero | JSON do gênero no corpo |
| PUT | `/genres/:id` | Atualiza um gênero | `id` na URL e JSON do gênero no corpo |
| DELETE | `/genres/:id` | Remove um gênero | `id` na URL |

### Jogos

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/games` | Lista todos os jogos | — |
| GET | `/games/:id` | Consulta um jogo pelo ID | `id` na URL |
| GET | `/games/genre/:genreId` | Lista todos os jogos de um gênero | `genreId` na URL |
| POST | `/games` | Cadastra um novo jogo | JSON do jogo no corpo |
| PUT | `/games/:id` | Atualiza um jogo | `id` na URL e JSON do jogo no corpo |
| DELETE | `/games/:id` | Remove um jogo | `id` na URL |

### Clientes

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/customers` | Lista todos os clientes | — |
| GET | `/customers/:id` | Consulta um cliente pelo ID | `id` na URL |
| POST | `/customers` | Cadastra um novo cliente | JSON do cliente no corpo |
| PUT | `/customers/:id` | Atualiza um cliente | `id` na URL e JSON do cliente no corpo |
| DELETE | `/customers/:id` | Remove um cliente | `id` na URL |

### Vendedores

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/sellers` | Lista todos os vendedores | — |
| GET | `/sellers/:id` | Consulta um vendedor pelo ID | `id` na URL |
| POST | `/sellers` | Cadastra um novo vendedor | JSON do vendedor no corpo |
| PUT | `/sellers/:id` | Atualiza um vendedor | `id` na URL e JSON do vendedor no corpo |
| DELETE | `/sellers/:id` | Remove um vendedor | `id` na URL |

### Pedidos

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/orders` | Lista todos os pedidos | — |
| GET | `/orders/:id` | Consulta um pedido pelo ID | `id` na URL |
| GET | `/orders/customer/:customerId` | Lista todos os pedidos de um cliente | `customerId` na URL |
| GET | `/orders/seller/:sellerId` | Lista todos os pedidos de um vendedor | `sellerId` na URL |
| POST | `/orders` | Cadastra um novo pedido | JSON do pedido no corpo |
| PUT | `/orders/:id` | Atualiza um pedido | `id` na URL e JSON do pedido no corpo |
| DELETE | `/orders/:id` | Remove um pedido | `id` na URL |

### Itens do pedido

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/order-items` | Lista todos os itens de pedido | — |
| GET | `/order-items/:id` | Consulta um item pelo ID | `id` na URL |
| GET | `/order-items/order/:orderId` | Lista todos os itens de um pedido | `orderId` na URL |
| POST | `/order-items` | Adiciona um item a um pedido | JSON do item no corpo |
| PUT | `/order-items/:id` | Atualiza um item | `id` na URL e JSON do item no corpo |
| DELETE | `/order-items/:id` | Remove um item | `id` na URL |

---

## Exemplos de requisições

Envie o corpo das requisições `POST` e `PUT` em JSON, com o cabeçalho `Content-Type: application/json`. Os IDs usados nos exemplos são ilustrativos; utilize os IDs retornados pela sua própria API.

### Gênero — `POST /genres` e `PUT /genres/:id`

```json
{
  "name": "RPG",
  "description": "Jogos de interpretação de papéis",
  "active": true
}
```

### Jogo — `POST /games` e `PUT /games/:id`

```json
{
  "genre_id": "8f6c2b1e-3d4a-4c5b-9e7f-1a2b3c4d5e6f",
  "title": "The Legend of Zelda: Tears of the Kingdom",
  "description": "Aventura em mundo aberto",
  "price": 349.90,
  "stock_quantity": 15,
  "release_date": "2023-05-12",
  "developer": "Nintendo",
  "image": "https://exemplo.com/zelda.jpg",
  "active": true
}
```

### Cliente — `POST /customers` e `PUT /customers/:id`

```json
{
  "name": "Maria Souza",
  "email": "maria@email.com",
  "phone": "(11) 98888-7777",
  "address": "Rua das Flores, 100",
  "birth_date": "2000-04-15"
}
```

### Vendedor — `POST /sellers` e `PUT /sellers/:id`

```json
{
  "name": "João Lima",
  "email": "joao@gamestore.com",
  "phone": "(11) 97777-6666",
  "address": "Av. Central, 500",
  "hire_date": "2024-02-01"
}
```

### Pedido — `POST /orders` e `PUT /orders/:id`

```json
{
  "customer_id": "2b7e9c4a-1f3d-4e8b-a6c5-9d0e1f2a3b4c",
  "seller_id": "5c8d1e2f-3a4b-4c6d-8e9f-0a1b2c3d4e5f",
  "order_date": "2026-09-29",
  "status": "pending",
  "total": 349.90,
  "active": true
}
```

### Item do pedido — `POST /order-items` e `PUT /order-items/:id`

```json
{
  "order_id": "7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  "game_id": "3e4f5a6b-7c8d-4e9f-a0b1-c2d3e4f5a6b7",
  "quantity": 1,
  "unit_price": 349.90
}
```
