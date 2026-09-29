import express from "express";
import Games from "./models/Games.js";
import Orders from "./models/Orders.js";
import OrderItems from "./models/OrderItems.js";
import GenresRoutes from "./routes/GenresRoutes.js";
import CustomerRoutes from "./routes/CustomerRoutes.js";
import SellerRoutes from "./routes/SellerRoutes.js";
const app = express();

app.use(express.json());


//CRUD GAMES
app.get("/games", async (req, res) => {
    try {
        const games = await Games.findAll();
        console.log(games)
        res.status(200).json(games);
    } catch(error) {
        console.error("Erro ao buscar produtos: ", error);
        res.status(500).json({
           message: "Erro ao buscar produtos"
        })
    }
});

app.get("/games/:id", async (req, res) => {
    try {
        const game = await Games.findById(req.params.id);

        if (!game) {
            return res.status(404).json({ 
                message: "Jogo não encontrado" 
            });
        }

        res.status(200).json(game);
    } catch(error) {
        console.error("Erro ao buscar jogo: ", error);
        res.status(500).json({
           message: "Erro ao buscar jogo"
        })
    }
});

app.post("/games", async(req, res) => {
    try {
        const game = await Games.create(req.body)

        res.status(201).json(game);
    } catch(error) {
        console.error("Erro ao adicionar jogo: ", error)

        res.status(500).json({
            message: "Não foi possível adicionar o jogo"
        })
    }
})

app.put("/games/:id", async (req, res) => {
    try {
        const game = await Games.update(req.params.id, req.body);

        if (!game) {
            return res.status(404).json({ 
                message: "Jogo não encontrado" 
            });
        }

        res.status(200).json(game);
    } catch(error) {
        console.error("Erro ao alterar jogo: ", error);
        res.status(500).json({
           message: "Erro ao alterar jogo"
        })
    }
});
app.delete("/games/:id", async (req, res) => {
    try {
        const deleted = await Games.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({ 
                message: "Jogo não encontrado" 
            });
        }

        res.status(204).send();
    } catch(error) {
        console.error("Erro ao excluir jogo: ", error);
        res.status(500).json({
           message: "Erro ao excluir jogo"
        })
    }
});

//CRUD VENDEDORES

app.use("/sellers", SellerRoutes);

//CRUD CATEGORIAS

app.use("/genres", GenresRoutes);

//CRUD CLIENTES

app.use("/customers", CustomerRoutes);

//CRUD PEDIDO DE VENDA
app.get("/orders", async (req, res) => {
    try {
        const orders = await Orders.findAll();
        console.log(orders)
        res.status(200).json(orders);
    } catch(error) {
        console.error("Erro ao buscar pedidos: ", error);
        res.status(500).json({
           message: "Erro ao buscar pedidos"
        })
    }
});

app.get("/orders/:id", async (req, res) => {
    try {
        const order = await Orders.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Pedido não encontrado"
            });
        }

        res.status(200).json(order);
    } catch(error) {
        console.error("Erro ao buscar pedido: ", error);
        res.status(500).json({
           message: "Erro ao buscar pedido"
        })
    }
});

app.post("/orders", async(req, res) => {
    try {
        const order = await Orders.create(req.body)

        res.status(201).json(order);
    } catch(error) {
        console.error("Erro ao adicionar pedido: ", error)

        res.status(500).json({
            message: "Não foi possível adicionar o pedido"
        })
    }
})

app.put("/orders/:id", async (req, res) => {
    try {
        const order = await Orders.update(req.params.id, req.body);

        if (!order) {
            return res.status(404).json({
                message: "Pedido não encontrado"
            });
        }

        res.status(200).json(order);
    } catch(error) {
        console.error("Erro ao alterar pedido: ", error);
        res.status(500).json({
           message: "Erro ao alterar pedido"
        })
    }
});
app.delete("/orders/:id", async (req, res) => {
    try {
        const deleted = await Orders.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                message: "Pedido não encontrado"
            });
        }

        res.status(204).send();
    } catch(error) {
        console.error("Erro ao excluir pedido: ", error);
        res.status(500).json({
           message: "Erro ao excluir pedido"
        })
    }
});

//CRUD ITENS DO PEDIDO
app.get("/order-items", async (req, res) => {
    try {
        const orderItems = await OrderItems.findAll();
        console.log(orderItems)
        res.status(200).json(orderItems);
    } catch(error) {
        console.error("Erro ao buscar itens do pedido: ", error);
        res.status(500).json({
           message: "Erro ao buscar itens do pedido"
        })
    }
});

app.get("/order-items/:id", async (req, res) => {
    try {
        const orderItem = await OrderItems.findById(req.params.id);

        if (!orderItem) {
            return res.status(404).json({
                message: "Item do pedido não encontrado"
            });
        }

        res.status(200).json(orderItem);
    } catch(error) {
        console.error("Erro ao buscar item do pedido: ", error);
        res.status(500).json({
           message: "Erro ao buscar item do pedido"
        })
    }
});

app.post("/order-items", async(req, res) => {
    try {
        const orderItem = await OrderItems.create(req.body)

        res.status(201).json(orderItem);
    } catch(error) {
        console.error("Erro ao adicionar item do pedido: ", error)

        res.status(500).json({
            message: "Não foi possível adicionar o item do pedido"
        })
    }
})

app.put("/order-items/:id", async (req, res) => {
    try {
        const orderItem = await OrderItems.update(req.params.id, req.body);

        if (!orderItem) {
            return res.status(404).json({
                message: "Item do pedido não encontrado"
            });
        }

        res.status(200).json(orderItem);
    } catch(error) {
        console.error("Erro ao alterar item do pedido: ", error);
        res.status(500).json({
           message: "Erro ao alterar item do pedido"
        })
    }
});
app.delete("/order-items/:id", async (req, res) => {
    try {
        const deleted = await OrderItems.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                message: "Item do pedido não encontrado"
            });
        }

        res.status(204).send();
    } catch(error) {
        console.error("Erro ao excluir item do pedido: ", error);
        res.status(500).json({
           message: "Erro ao excluir item do pedido"
        })
    }
});

export default app
