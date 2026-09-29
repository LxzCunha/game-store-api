import express from "express";
import Seller from "./models/Seller.js";
import Genres from "./models/Genres.js";
import Customer from "./models/Customer.js";
import OrdersRoutes from "./routes/Orders.Routes.js";       
import Orders from "./models/Orders.js";
import OrderItems from "./models/OrderItems.js";
import gamesRoutes from "./routes/Games.Routes.js";
import GenresRoutes from "./routes/GenresRoutes.js";
import CustomerRoutes from "./routes/CustomerRoutes.js";
const app = express();

app.use(express.json());

//CRUD GAMES
app.use("/games", gamesRoutes);


//CRUD VENDEDORES
app.get("/sellers", async (req, res) => {
    try {
        const sellers = await Seller.findAll();
        console.log(sellers)
        res.status(200).json(sellers);
    } catch(error) {
        console.error("Erro ao buscar vendedores: ", error);
        res.status(500).json({
           message: "Erro ao buscar vendedores"
        })
    }
});

app.get("/sellers/:id", async (req, res) => {
    try {
        const seller = await Seller.findById(req.params.id);

        if (!seller) {
            return res.status(404).json({ 
                message: "Vendedor não encontrado" 
            });
        }

        res.status(200).json(seller);
    } catch(error) {
        console.error("Erro ao buscar vendedor: ", error);
        res.status(500).json({
           message: "Erro ao buscar vendedor"
        })
    }
});

app.post("/sellers", async(req, res) => {
    try {
        const seller = await Seller.create(req.body)

        res.status(201).json(seller);
    } catch(error) {
        console.error("Erro ao adicionar vendedor: ", error)

        res.status(500).json({
            message: "Não foi possível adicionar o vendedor"
        })
    }
})

app.put("/sellers/:id", async (req, res) => {
    try {
        const seller = await Seller.update(req.params.id, req.body);

        if (!seller) {
            return res.status(404).json({ 
                message: "Vendedor não encontrado" 
            });
        }

        res.status(200).json(seller);
    } catch(error) {
        console.error("Erro ao alterar vendedor: ", error);
        res.status(500).json({
           message: "Erro ao alterar vendedor"
        })
    }
});
app.delete("/sellers/:id", async (req, res) => {
    try {
        const deleted = await Seller.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({ 
                message: "Vendedor não encontrado" 
            });
        }

        res.status(204).send();
    } catch(error) {
        console.error("Erro ao excluir vendedor: ", error);
        res.status(500).json({
           message: "Erro ao excluir vendedor"
        })
    }
});

//CRUD CATEGORIAS

app.use("/genres", GenresRoutes);

//CRUD CLIENTES

app.use("/customers", CustomerRoutes);

//CRUD PEDIDO DE VENDA
app.use("/Orders", OrdersRoutes);

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
