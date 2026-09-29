import { Router } from "express";
import CustomerController from "../controllers/CustomerController.js";

const router = Router();

router.get("/", CustomerController.getAll);
router.get("/search/:keyword", CustomerController.getByKeyword);
router.get("/:id", CustomerController.getById);
router.post("/", CustomerController.create);
router.put("/:id", CustomerController.update);
router.delete("/:id", CustomerController.remove);

export default router;