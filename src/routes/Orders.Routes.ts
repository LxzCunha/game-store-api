import { Router } from "express";
import OrdersController from "../controllers/OrdersController.js"

const router = Router();

router.get("/", OrdersController.getAll);
router.get("/:id", OrdersController.getById);
router.post("/", OrdersController.create);
router.put("/:id", OrdersController.update);
router.delete("/:id", OrdersController.remove);

export default router;