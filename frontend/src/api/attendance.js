import client from "./client";

export const checkIn = (assignmentId) =>
  client.post("/attendance/check-in", { shift_assignment_id: assignmentId }).then((r) => r.data);

export const checkOut = (recordId) =>
  client.post(`/attendance/check-out/${recordId}`).then((r) => r.data);

export const myAttendance = () =>
  client.get("/attendance/my").then((r) => r.data);

export const workerAttendance = (workerId) =>
  client.get(`/attendance/worker/${workerId}`).then((r) => r.data);
