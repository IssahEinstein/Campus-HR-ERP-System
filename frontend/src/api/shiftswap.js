import client from "./client";

export const submitSwap = (body) =>
  client.post("/shiftswap", body).then((r) => r.data);

export const cancelSwap = (id) =>
  client.post(`/shiftswap/${id}/cancel`).then((r) => r.data);

export const mySwaps = () =>
  client.get("/shiftswap/my").then((r) => r.data);

export const pendingSwaps = () =>
  client.get("/shiftswap/pending").then((r) => r.data);

export const reviewSwap = (id, status, notes) =>
  client.post(`/shiftswap/${id}/review`, { status, approval_notes: notes }).then((r) => r.data);
