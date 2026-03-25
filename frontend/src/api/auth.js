import client from "./client";

export const login = (email, password) =>
  client.post("/auth/login", { email, password }).then((r) => r.data);

export const logout = () => client.post("/auth/logout");

export const logoutAll = () => client.post("/auth/logout-all");

export const refresh = () => client.post("/auth/refresh").then((r) => r.data);

export const me = () => client.get("/auth/me").then((r) => r.data);

export const myProfile = () =>
  client.get("/auth/profile").then((r) => r.data);

export const updateProfile = (body) =>
  client.put("/auth/profile", body).then((r) => r.data);

export const changePassword = (body) =>
  client.post("/auth/change-password", body).then((r) => r.data);

export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append("file", file);
  return client.post("/auth/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

export const removeAvatar = () =>
  client.delete("/auth/avatar").then((r) => r.data);

export const acceptSupervisorInvite = (token, password) =>
  client.post("/invites/accept-supervisor", { token, password }).then((r) => r.data);

export const acceptWorkerInvite = (token, password) =>
  client.post("/invites/accept-worker", { token, password }).then((r) => r.data);
