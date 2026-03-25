import client from "./client";

export const myProfile = () =>
  client.get("/supervisor/profile").then((r) => r.data);

export const myWorkers = () =>
  client.get("/supervisor/workers").then((r) => r.data);

export const inviteWorker = (body) =>
  client.post("/supervisor/invite-worker", body).then((r) => r.data);

export const resendWorkerInvite = (workerId) =>
  client.post(`/supervisor/workers/${workerId}/resend-invite`).then((r) => r.data);

export const deleteWorker = (workerId) =>
  client.delete(`/supervisor/workers/${workerId}`).then((r) => r.data);
