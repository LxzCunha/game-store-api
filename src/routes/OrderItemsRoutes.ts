import { Router } from "express";
import OrderItems from "../controllers/OrderItemsController.js"

const router = Router();

router.get("/", OrderItems.getAll);
router.get("/:id", OrderItems.getById);
router.post("/", OrderItems.create);
router.put("/:id", OrderItems.update);
router.delete("/:id", OrderItems.remove);

export default router;