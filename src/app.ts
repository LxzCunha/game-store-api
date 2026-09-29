import express from "express";
import OrderItemsRoutes from "./routes/OrderItemsRoutes.js";
import OrdersRoutes from "./routes/OrdersRoutes.js";       
import gamesRoutes from "./routes/GamesRoutes.js";
import GenresRoutes from "./routes/GenresRoutes.js";
import CustomerRoutes from "./routes/CustomerRoutes.js";
import SellerRoutes from "./routes/SellerRoutes.js";
const app = express();

app.use(express.json());
//CRUD GAMES
app.use("/games", gamesRoutes);


//CRUD VENDEDORES

app.use("/sellers", SellerRoutes);

//CRUD CATEGORIAS

app.use("/genres", GenresRoutes);

//CRUD CLIENTES

app.use("/customers", CustomerRoutes);

//CRUD PEDIDO DE VENDA
app.use("/orders", OrdersRoutes);

//CRUD ITENS DO PEDIDO
app.use("/order-items", OrderItemsRoutes);  
export default app  
