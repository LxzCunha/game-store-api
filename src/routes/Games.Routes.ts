import { Router } from "express";
import GamesController from "../controllers/GamesController.js"

const router = Router();

router.get("/", GamesController.getAll);
router.get("/search/:keyword", GamesController.getByKeyword);
router.get("/:id", GamesController.getById);
router.post("/", GamesController.create);
router.put("/:id", GamesController.update);
router.delete("/:id", GamesController.remove);

export default router;