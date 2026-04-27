import client from "./client";

export const createWorkerFeedback = (workerId, body) =>
  client.post(`/feedback/workers/${workerId}`, body).then((r) => r.data);

export const myFeedback = () =>
  client.get("/feedback/my").then((r) => r.data);
