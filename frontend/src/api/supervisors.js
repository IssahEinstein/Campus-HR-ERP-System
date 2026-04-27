import client from "./client";

export const myProfile = () =>
  client.get("/supervisor/profile").then((r) => r.data);

export const myWorkers = () =>
  client.get("/supervisor/workers").then((r) => r.data);

export const inviteWorker = (body) =>
  client
    .post("/supervisor/invite-worker", body, { timeout: 30000 })
    .then((r) => r.data);

export const resendWorkerInvite = (workerId) =>
  client
    .post(`/supervisor/workers/${workerId}/resend-invite`, null, { timeout: 30000 })
    .then((r) => r.data);

export const deleteWorker = (workerId) =>
  client.delete(`/supervisor/workers/${workerId}`).then((r) => r.data);

export const listLocations = () =>
  client.get("/supervisor/locations").then((r) => r.data);

export const createLocation = (name) =>
  client.post("/supervisor/locations", { name }).then((r) => r.data);

export const deleteLocation = (locationId) =>
  client.delete(`/supervisor/locations/${locationId}`).then((r) => r.data);
