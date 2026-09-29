import { Router } from "express";
import SellerController from "../controllers/SellerController.js";

const router = Router();

router.get("/", SellerController.getAll);
router.get("/search/:keyword", SellerController.getByKeyword);
router.get("/:id", SellerController.getById);
router.post("/", SellerController.create);
router.put("/:id", SellerController.update);
router.delete("/:id", SellerController.remove);

export default router;