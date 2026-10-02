import { Router } from "express";
import GenresController from "../controllers/GenresController.js";

const router = Router();

router.get("/", GenresController.getAll);
router.get("/:id", GenresController.getById);
router.post("/", GenresController.create);
router.put("/:id", GenresController.update);
router.delete("/:id", GenresController.remove);

export default router;