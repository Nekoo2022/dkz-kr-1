const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const logger = require("./middleware/logger");
const booksRouter = require("./routes/books");

const app = express();
const PORT = process.env.PORT || 3000;

// Запросы с React dev-сервера (порт 3001) разрешены явно.
app.use(
  cors({
    origin: "http://localhost:3001",
  })
);

app.use(express.json());
app.use(logger);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Books API",
      version: "1.0.0",
      description:
        "REST API каталога книг. Сущность Book: название, автор, жанр, год издания и число страниц.",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Локальный сервер",
      },
    ],
  },
  apis: [path.join(__dirname, "routes", "*.js")],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.send("Books API is running. Try /api/books or /api-docs");
});

app.use("/api/books", booksRouter);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});
