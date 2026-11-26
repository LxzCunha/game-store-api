import { Router } from "express";
import OrderItems from "../controllers/OrderItemsController.js"

const router = Router();

/**
 * @swagger
 * /order-items:
 *   get:
 *     summary: Lista os itens de pedido
 *     tags: [Itens do pedido]
 *     responses:
 *       200:
 *         description: Lista de itens.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderItem'
 *       500:
 *         description: Erro interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Adiciona um item ao pedido
 *     tags: [Itens do pedido]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderItemInput'
 *     responses:
 *       201:
 *         description: Item criado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderItem'
 *       400:
 *         description: Dados inválidos ou pedido/jogo inexistente.
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
 * /order-items/order/{orderId}:
 *   get:
 *     summary: Lista itens de um pedido
 *     tags: [Itens do pedido]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: UUID do pedido.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Itens do pedido (lista vazia quando não houver resultados).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderItem'
 *       500:
 *         description: Erro interno.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /order-items/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: UUID do item de pedido.
 *       schema:
 *         type: string
 *         format: uuid
 *   get:
 *     summary: Consulta um item de pedido
 *     tags: [Itens do pedido]
 *     responses:
 *       200:
 *         description: Item encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderItem'
 *       404:
 *         description: Item não encontrado.
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
 *     summary: Atualiza um item de pedido
 *     tags: [Itens do pedido]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderItemUpdate'
 *     responses:
 *       200:
 *         description: Item atualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderItem'
 *       400:
 *         description: Dados inválidos ou pedido/jogo inexistente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Item não encontrado.
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
 *     summary: Remove um item de pedido
 *     tags: [Itens do pedido]
 *     responses:
 *       200:
 *         description: Item removido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteResponse'
 *       404:
 *         description: Item não encontrado.
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
router.get("/", OrderItems.getAll);
router.get("/order/:orderId", OrderItems.getByOrder);
router.get("/:id", OrderItems.getById);
router.post("/", OrderItems.create);
router.put("/:id", OrderItems.update);
router.delete("/:id", OrderItems.remove);

export default router;