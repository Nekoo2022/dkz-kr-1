import { api } from "./apiClient";

export async function getBooks() {
  return (await api.get("/books")).data;
}

export async function getBook(id) {
  return (await api.get(`/books/${id}`)).data;
}

export async function createBook(payload) {
  return (await api.post("/books", payload)).data;
}

export async function updateBook(id, patch) {
  return (await api.patch(`/books/${id}`, patch)).data;
}

export async function deleteBook(id) {
  return (await api.delete(`/books/${id}`)).data;
}
