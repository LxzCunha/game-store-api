import express from "express";
import Games from "./models/Games.js";
import Seller from "./models/Seller.js";
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



//CRUD CLIENTES


//CRUD PEDIDO DE VENDA


export default app
