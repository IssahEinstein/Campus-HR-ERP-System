import client from "./client";

export const myPayStubs = () =>
  client.get("/payroll/my").then((r) => r.data);

export const allPayStubs = () =>
  client.get("/payroll/all").then((r) => r.data);

export const workerPayStubs = (workerId) =>
  client.get(`/payroll/worker/${workerId}`).then((r) => r.data);

export const generatePayStub = (body) =>
  client.post("/payroll/generate", body).then((r) => r.data);

export const updatePayStubStatus = (id, status) =>
  client.put(`/payroll/${id}/status`, { status }).then((r) => r.data);
