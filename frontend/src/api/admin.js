import client from "./client";

export const listSupervisors = () =>
  client.get("/admin/supervisors").then((r) => r.data);

export const listAdmins = () =>
  client.get("/admin/admins").then((r) => r.data);

export const listAllWorkers = () =>
  client.get("/admin/workers").then((r) => r.data);

export const listDepartments = () =>
  client.get("/admin/departments").then((r) => r.data);

export const createDepartment = (name) =>
  client.post("/admin/departments", { name }).then((r) => r.data);

export const renameDepartment = (departmentId, name) =>
  client.patch(`/admin/departments/${departmentId}`, { name }).then((r) => r.data);

export const deleteDepartment = (departmentId) =>
  client.delete(`/admin/departments/${departmentId}`).then((r) => r.data);

export const inviteSupervisor = (body) =>
  client.post("/admin/invite-supervisor", body).then((r) => r.data);

export const inviteAdmin = (body) =>
  client.post("/admin/invite-admin", body).then((r) => r.data);

export const resendSupervisorInvite = (supervisorId) =>
  client.post(`/admin/supervisors/${supervisorId}/resend-invite`).then((r) => r.data);

export const resendAdminInvite = (adminProfileId) =>
  client.post(`/admin/admins/${adminProfileId}/resend-invite`).then((r) => r.data);

export const deleteSupervisor = (supervisorId) =>
  client.delete(`/admin/supervisors/${supervisorId}`).then((r) => r.data);
