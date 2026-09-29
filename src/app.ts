import express from "express";
import Games from "./models/Games.js";
import Seller from "./models/Seller.js";
import Genres from "./models/Genres.js";
import Customer from "./models/Customer.js";
import OrdersRoutes from "./routes/OrdersRoutes.js";       
import OrderItemsRoutes from "./routes/OrderItemsRoutes.js";
import gamesRoutes from "./routes/GamesRoutes.js";
import OrdersRoutes from "./routes/Orders.Routes.js";       
import Orders from "./models/Orders.js";
import OrderItems from "./models/OrderItems.js";
import gamesRoutes from "./routes/Games.Routes.js";
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
app.use("/Orders", OrdersRoutes);

//CRUD ITENS DO PEDIDO
app.use("/Order-Items", OrderItemsRoutes);  
export default app  
