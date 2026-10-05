const express = require("express");
const { randomUUID } = require("crypto");

const router = express.Router();

let books = [...require("../data/books")];

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - author
 *         - genre
 *         - publishedYear
 *         - pages
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор книги
 *           example: b1
 *         title:
 *           type: string
 *           description: Название книги
 *           example: Мастер и Маргарита
 *         author:
 *           type: string
 *           description: Автор
 *           example: Михаил Булгаков
 *         genre:
 *           type: string
 *           description: Жанр
 *           example: Роман
 *         publishedYear:
 *           type: integer
 *           description: Год издания
 *           example: 1967
 *         pages:
 *           type: integer
 *           description: Число страниц
 *           example: 480
 *     BookInput:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - genre
 *         - publishedYear
 *         - pages
 *       properties:
 *         title:
 *           type: string
 *           example: Песнь льда и пламени
 *         author:
 *           type: string
 *           example: Джордж Мартин
 *         genre:
 *           type: string
 *           example: Фэнтези
 *         publishedYear:
 *           type: integer
 *           example: 1996
 *         pages:
 *           type: integer
 *           example: 768
 *     BookPatch:
 *       type: object
 *       description: Любое подмножество полей книги. Нужно передать хотя бы одно поле.
 *       properties:
 *         title:
 *           type: string
 *         author:
 *           type: string
 *         genre:
 *           type: string
 *         publishedYear:
 *           type: integer
 *         pages:
 *           type: integer
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Book not found
 */

function findById(id) {
  return books.find((book) => book.id === id) || null;
}

function readText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${field} is required (non-empty string)` };
  }
  return { value: value.trim() };
}

function readYear(value) {
  const year = Number(value);
  const maxYear = new Date().getFullYear() + 1;
  if (!Number.isInteger(year) || year < 1000 || year > maxYear) {
    return { error: `publishedYear must be an integer from 1000 to ${maxYear}` };
  }
  return { value: year };
}

function readPages(value) {
  const pages = Number(value);
  if (!Number.isInteger(pages) || pages < 1 || pages > 10000) {
    return { error: "pages must be an integer from 1 to 10000" };
  }
  return { value: pages };
}

/**
 * Проверяет тело запроса.
 * partial=false — создание: все поля обязательны.
 * partial=true — изменение: проверяются только переданные поля.
 */
function validateBook(body, { partial }) {
  const source = body && typeof body === "object" ? body : {};
  const errors = [];
  const data = {};
  const fields = [
    ["title", readText],
    ["author", readText],
    ["genre", readText],
    ["publishedYear", readYear],
    ["pages", readPages],
  ];

  if (partial && fields.every(([name]) => source[name] === undefined)) {
    errors.push("at least one of title, author, genre, publishedYear, pages is required");
  }

  for (const [name, read] of fields) {
    if (partial && source[name] === undefined) continue;
    const result = name === "title" || name === "author" || name === "genre"
      ? read(source[name], name)
      : read(source[name]);
    if (result.error) errors.push(result.error);
    else data[name] = result.value;
  }

  return { errors, data };
}

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Список книг
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: Каталог книг
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */
router.get("/", (req, res) => {
  res.json(books);
});

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Книга по идентификатору
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Идентификатор книги
 *     responses:
 *       200:
 *         description: Найденная книга
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Книга не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", (req, res) => {
  const book = findById(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Добавить книгу
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookInput'
 *     responses:
 *       201:
 *         description: Книга создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Некорректные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", (req, res) => {
  const { errors, data } = validateBook(req.body, { partial: false });
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  const book = { id: randomUUID().slice(0, 8), ...data };
  books.push(book);
  res.status(201).json(book);
});

/**
 * @swagger
 * /api/books/{id}:
 *   patch:
 *     summary: Изменить книгу
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookPatch'
 *     responses:
 *       200:
 *         description: Обновлённая книга
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Некорректные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Книга не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:id", (req, res) => {
  const book = findById(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });

  const { errors, data } = validateBook(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  Object.assign(book, data);
  res.json(book);
});

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Удалить книгу
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Книга удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Книга не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", (req, res) => {
  const before = books.length;
  books = books.filter((book) => book.id !== req.params.id);
  if (books.length === before) {
    return res.status(404).json({ error: "Book not found" });
  }
  res.json({ ok: true });
});

module.exports = router;
