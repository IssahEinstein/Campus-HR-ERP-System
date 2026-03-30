import client from "./client";

// ── Worker: my assignments (includes nested shift object) ──
export const myAssignments = () =>
  client.get("/shifts/my-assignments").then((r) => r.data);

// ── Supervisor / Admin: list shifts ──
export const listShifts = () =>
  client.get("/shifts").then((r) => r.data);

export const getShift = (id) =>
  client.get(`/shifts/${id}`).then((r) => r.data);

export const createShift = (body) =>
  client.post("/shifts", body).then((r) => r.data);

export const updateShift = (id, body) =>
  client.put(`/shifts/${id}`, body).then((r) => r.data);

export const deleteShift = (id) =>
  client.delete(`/shifts/${id}`);

export const assignWorker = (shiftId, workerId, applyToSeries = false) =>
  client
    .post(`/shifts/${shiftId}/assign`, {
      worker_id: workerId,
      apply_to_series: applyToSeries,
    })
    .then((r) => r.data);
