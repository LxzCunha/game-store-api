import { Router } from "express";
import GamesController from "../controllers/GamesController.js"

const router = Router();

/**
 * @swagger
 * /games:
 *   get:
 *     summary: Lista os jogos
 *     tags: [Jogos]
 *     responses:
 *       200:
 *         description: Lista de jogos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Game'
 *       500:
 *         description: Erro interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Cadastra um jogo
 *     tags: [Jogos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameInput'
 *     responses:
 *       201:
 *         description: Jogo criado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 *       400:
 *         description: Dados inválidos ou gênero inexistente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /games/genre/{genreId}:
 *   get:
 *     summary: Lista jogos por gênero
 *     tags: [Jogos]
 *     parameters:
 *       - in: path
 *         name: genreId
 *         required: true
 *         description: UUID do gênero.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Jogos do gênero (lista vazia quando não houver resultados).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Game'
 *       500:
 *         description: Erro interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /games/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: UUID do jogo.
 *       schema:
 *         type: string
 *         format: uuid
 *   get:
 *     summary: Consulta um jogo
 *     tags: [Jogos]
 *     responses:
 *       200:
 *         description: Jogo encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 *       404:
 *         description: Jogo não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Atualiza um jogo
 *     tags: [Jogos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameUpdate'
 *     responses:
 *       200:
 *         description: Jogo atualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 *       400:
 *         description: Dados inválidos ou gênero inexistente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Jogo não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Remove um jogo
 *     tags: [Jogos]
 *     responses:
 *       200:
 *         description: Jogo removido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteResponse'
 *       404:
 *         description: Jogo não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Jogo vinculado a um pedido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", GamesController.getAll);
router.get("/genre/:genreId", GamesController.getByGenre);
router.get("/:id", GamesController.getById);
router.post("/", GamesController.create);
router.put("/:id", GamesController.update);
router.delete("/:id", GamesController.remove);

export default router;