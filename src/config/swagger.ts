import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Game Store API",
      version: "1.0.0",
      description: "API REST para gerenciamento de uma loja de jogos eletrônicos.",
    },
    tags: [
      { name: "Gêneros", description: "Gerenciamento dos gêneros de jogos." },
      { name: "Jogos", description: "Gerenciamento do catálogo de jogos." },
      { name: "Clientes", description: "Gerenciamento dos clientes." },
      { name: "Vendedores", description: "Gerenciamento dos vendedores." },
      { name: "Pedidos", description: "Gerenciamento dos pedidos de venda." },
      { name: "Itens do pedido", description: "Gerenciamento dos itens dos pedidos." },
    ],
    servers: [
      {
        url: "http://localhost:3030",
        description: "Servidor local",
      },
    ],
    components: {
      schemas: {
        ErrorResponse: {
          type: "object",
          required: ["message"],
          properties: { message: { type: "string", example: "Recurso não encontrado." } },
        },
        DeleteResponse: {
          type: "object",
          required: ["message"],
          properties: { message: { type: "string", example: "Registro removido com sucesso." } },
        },
        Genre: {
          type: "object",
          required: ["id", "name", "description", "active"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "RPG" },
            description: { type: "string", nullable: true, example: "Jogos de interpretação de papéis" },
            active: { type: "boolean", example: true },
          },
        },
        GenreInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "RPG" },
            description: { type: "string", nullable: true },
            active: { type: "boolean", default: true },
          },
        },
        GenreUpdate: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string", nullable: true },
            active: { type: "boolean" },
          },
        },
        Game: {
          type: "object",
          required: ["id", "genre_id", "title", "description", "price", "stock_quantity", "release_date", "developer", "image", "active"],
          properties: {
            id: { type: "string", format: "uuid" },
            genre_id: { type: "string", format: "uuid" },
            title: { type: "string", example: "The Legend of Zelda: Tears of the Kingdom" },
            description: { type: "string", nullable: true },
            price: { type: "number", minimum: 0, example: 349.9 },
            stock_quantity: { type: "integer", minimum: 0, example: 15 },
            release_date: { type: "string", format: "date", nullable: true },
            developer: { type: "string", nullable: true, example: "Nintendo" },
            image: { type: "string", nullable: true },
            active: { type: "boolean" },
          },
        },
        GameInput: {
          type: "object",
          required: ["genre_id", "title", "price"],
          properties: {
            genre_id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            price: { type: "number", minimum: 0 },
            stock_quantity: { type: "integer", minimum: 0, default: 0 },
            release_date: { type: "string", format: "date", nullable: true },
            developer: { type: "string", nullable: true },
            image: { type: "string", nullable: true },
            active: { type: "boolean", default: true },
          },
        },
        GameUpdate: {
          type: "object",
          properties: {
            genre_id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            price: { type: "number", minimum: 0 },
            stock_quantity: { type: "integer", minimum: 0 },
            release_date: { type: "string", format: "date", nullable: true },
            developer: { type: "string", nullable: true },
            image: { type: "string", nullable: true },
            active: { type: "boolean" },
          },
        },
        Customer: {
          type: "object",
          required: ["id", "person_id", "name", "email", "role", "phone", "address", "birth_date"],
          properties: {
            id: { type: "string", format: "uuid" },
            person_id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["customer"] },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            birth_date: { type: "string", format: "date", nullable: true },
          },
        },
        CustomerInput: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            birth_date: { type: "string", format: "date", nullable: true },
          },
        },
        CustomerUpdate: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            birth_date: { type: "string", format: "date", nullable: true },
          },
        },
        Seller: {
          type: "object",
          required: ["id", "person_id", "name", "email", "role", "phone", "address", "hire_date"],
          properties: {
            id: { type: "string", format: "uuid" },
            person_id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["seller"] },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            hire_date: { type: "string", format: "date", nullable: true },
          },
        },
        SellerInput: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            hire_date: { type: "string", format: "date", nullable: true },
          },
        },
        SellerUpdate: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            hire_date: { type: "string", format: "date", nullable: true },
          },
        },
        Order: {
          type: "object",
          required: ["id", "customer_id", "seller_id", "status", "total", "active"],
          properties: {
            id: { type: "string", format: "uuid" },
            customer_id: { type: "string", format: "uuid" },
            seller_id: { type: "string", format: "uuid" },
            order_date: { type: "string", format: "date" },
            status: { type: "string", example: "pending" },
            total: { type: "number", minimum: 0, example: 349.9 },
            active: { type: "boolean" },
          },
        },
        OrderInput: {
          type: "object",
          required: ["customer_id", "seller_id"],
          properties: {
            customer_id: { type: "string", format: "uuid" },
            seller_id: { type: "string", format: "uuid" },
            order_date: { type: "string", format: "date" },
            status: { type: "string", default: "pending" },
            total: { type: "number", minimum: 0, default: 0 },
            active: { type: "boolean", default: true },
          },
        },
        OrderUpdate: {
          type: "object",
          properties: {
            customer_id: { type: "string", format: "uuid" },
            seller_id: { type: "string", format: "uuid" },
            order_date: { type: "string", format: "date" },
            status: { type: "string" },
            total: { type: "number", minimum: 0 },
            active: { type: "boolean" },
          },
        },
        OrderItem: {
          type: "object",
          required: ["id", "order_id", "game_id", "quantity", "unit_price"],
          properties: {
            id: { type: "string", format: "uuid" },
            order_id: { type: "string", format: "uuid" },
            game_id: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
            unit_price: { type: "number", minimum: 0 },
          },
        },
        OrderItemInput: {
          type: "object",
          required: ["order_id", "game_id", "quantity", "unit_price"],
          properties: {
            order_id: { type: "string", format: "uuid" },
            game_id: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
            unit_price: { type: "number", minimum: 0 },
          },
        },
        OrderItemUpdate: {
          type: "object",
          properties: {
            order_id: { type: "string", format: "uuid" },
            game_id: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1 },
            unit_price: { type: "number", minimum: 0 },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
