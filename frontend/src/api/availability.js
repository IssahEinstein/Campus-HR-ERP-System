import client from "./client";

export const myAvailability = () =>
  client.get("/availability/my").then((r) => r.data);

export const workerAvailability = (workerId) =>
  client.get(`/availability/worker/${workerId}`).then((r) => r.data);

export const createAvailability = (body) =>
  client.post("/availability", body).then((r) => r.data);

export const updateAvailability = (id, body) =>
  client.put(`/availability/${id}`, body).then((r) => r.data);

export const deleteAvailability = (id) =>
  client.delete(`/availability/${id}`);
