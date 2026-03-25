import client from "./client";

export const listSupervisors = () =>
  client.get("/admin/supervisors").then((r) => r.data);

export const listAllWorkers = () =>
  client.get("/admin/workers").then((r) => r.data);

export const listDepartments = () =>
  client.get("/admin/departments").then((r) => r.data);

export const createDepartment = (name) =>
  client.post("/admin/departments", { name }).then((r) => r.data);

export const inviteSupervisor = (body) =>
  client.post("/admin/invite-supervisor", body).then((r) => r.data);

export const resendSupervisorInvite = (supervisorId) =>
  client.post(`/admin/supervisors/${supervisorId}/resend-invite`).then((r) => r.data);

export const deleteSupervisor = (supervisorId) =>
  client.delete(`/admin/supervisors/${supervisorId}`).then((r) => r.data);
