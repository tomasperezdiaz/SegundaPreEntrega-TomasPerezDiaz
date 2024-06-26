import express from "express";
import { Server, Socket } from "socket.io";
import { engine } from "express-handlebars";

import productsRouter from "./routers/products.router.js";
import cartsRouter from "./routers/carts.router.js";
import views from "./routers/views.js";
import __dirname from "./utils.js";
import { dbConecction } from "./dataBase/config.js";
import { messageModel } from "./dao/models/messages.js";
import {
  addProductService,
  getProductsService,
} from "./services/productsManager.js";

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");

app.use("/", views);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

await dbConecction();

const expressServer = app.listen(PORT, () => {
  console.log(`Corriendo aplicacion en el puerto ${PORT}`);
});
const io = new Server(expressServer);

io.on("connection", async (socket) => {
  const { payload } = await getProductsService({});
  const product = payload;
  socket.emit("product", payload);

  socket.on("agregarProducto", async (products) => {
    const newProduct = await addProductService({ ...products });
    console.log({ products });
    if (newProduct) {
      product.push(newProduct);
      socket.emit("product", product);
    }
  });

  const messages = await messageModel.find();
  socket.emit("message", messages);

  socket.on("message", async (data) => {
    const newMessage = await messageModel.create({ ...data });
    if (newMessage) {
      const messages = await messageModel.find();
      io.emit("messageLogs", messages);
    }
  });

  socket.broadcast.emit("nuevo_user");
});
