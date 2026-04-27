import client from "./client";

export const submitTimeOff = (body) =>
  client.post("/timeoff", body).then((r) => r.data);

export const cancelTimeOff = (id) =>
  client.post(`/timeoff/${id}/cancel`).then((r) => r.data);

export const myTimeOff = () =>
  client.get("/timeoff/my").then((r) => r.data);

export const pendingTimeOff = () =>
  client.get("/timeoff/pending").then((r) => r.data);

export const workerTimeOff = (workerId) =>
  client.get(`/timeoff/worker/${workerId}`).then((r) => r.data);

export const reviewTimeOff = (id, status, notes) =>
  client.post(`/timeoff/${id}/review`, { status, approval_notes: notes }).then((r) => r.data);
