import { useEffect, useMemo, useState } from "react";
import { createBook, deleteBook, getBooks, updateBook } from "./api/booksApi";

const emptyForm = {
  title: "",
  author: "",
  genre: "",
  publishedYear: "",
  pages: "",
};

function errorText(error) {
  if (error?.response?.data?.error) return error.response.data.error;
  const message = error?.message || String(error);
  if (!error?.response) {
    return `${message}. Проверьте, что сервер запущен на порту 3000.`;
  }
  return message;
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim() !== "" &&
      form.author.trim() !== "" &&
      form.genre.trim() !== "" &&
      form.publishedYear !== "" &&
      form.pages !== ""
    );
  }, [form]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function load() {
    setError("");
    setLoading(true);
    try {
      setBooks(await getBooks());
    } catch (error) {
      setError(errorText(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    if (!canSubmit || saving) return;

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      genre: form.genre.trim(),
      publishedYear: Number(form.publishedYear),
      pages: Number(form.pages),
    };

    setError("");
    setSaving(true);
    try {
      if (editingId) await updateBook(editingId, payload);
      else await createBook(payload);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setSaving(false);
    }
  }

  function onEdit(book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      publishedYear: String(book.publishedYear),
      pages: String(book.pages),
    });
    setError("");
  }

  function onCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onDelete(id) {
    if (!window.confirm("Удалить эту книгу из каталога?")) return;
    setError("");
    try {
      await deleteBook(id);
      if (editingId === id) onCancelEdit();
      await load();
    } catch (error) {
      setError(errorText(error));
    }
  }

  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">Контрольное задание №1</p>
        <h1>Каталог книг</h1>
        <p className="lead">
          Клиент на React читает и меняет книги через REST API на Express.
          Документация API открыта в Swagger UI.
        </p>
        <a href="http://localhost:3000/api-docs" target="_blank" rel="noreferrer">
          Открыть Swagger UI
        </a>
      </header>

      <section className="card">
        <h2>{editingId ? "Изменить книгу" : "Добавить книгу"}</h2>
        <form onSubmit={onSubmit} className="form">
          <label>
            Название
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Название"
            />
          </label>
          <label>
            Автор
            <input
              value={form.author}
              onChange={(event) => updateField("author", event.target.value)}
              placeholder="Автор"
            />
          </label>
          <label>
            Жанр
            <input
              value={form.genre}
              onChange={(event) => updateField("genre", event.target.value)}
              placeholder="Роман, фэнтези..."
            />
          </label>
          <label>
            Год издания
            <input
              value={form.publishedYear}
              onChange={(event) => updateField("publishedYear", event.target.value)}
              type="number"
              min="1000"
              placeholder="1967"
            />
          </label>
          <label>
            Страниц
            <input
              value={form.pages}
              onChange={(event) => updateField("pages", event.target.value)}
              type="number"
              min="1"
              placeholder="480"
            />
          </label>
          <div className="actions">
            <button type="submit" disabled={!canSubmit || saving}>
              {editingId ? "Сохранить" : "Добавить"}
            </button>
            {editingId && (
              <button type="button" className="secondary" onClick={onCancelEdit}>
                Отмена
              </button>
            )}
            <button type="button" className="secondary" onClick={load}>
              Обновить список
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Книги</h2>
          <span>{books.length}</span>
        </div>

        {loading && <p>Загрузка...</p>}
        {error && <p className="error">Ошибка: {error}</p>}

        {!loading && books.length === 0 && !error && <p>В каталоге пока нет книг.</p>}

        {books.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Автор</th>
                  <th>Жанр</th>
                  <th>Год</th>
                  <th>Страниц</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id} className={book.id === editingId ? "active" : undefined}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.genre}</td>
                    <td>{book.publishedYear}</td>
                    <td>{book.pages}</td>
                    <td className="row-actions">
                      <button type="button" onClick={() => onEdit(book)}>
                        Изменить
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete(book.id)}>
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
