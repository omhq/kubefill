import { deleteRequest, parseOrThrowRequest } from "./utils";
import { API_PATH, SERVER_HOSTNAME, SERVER_PORT } from "../constants";

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;
const PROTOCOL = window.location.protocol;

const getBaseUrl = () => {
  return `${PROTOCOL}//${DOMAIN}${SERVER_PORT ? `:${SERVER_PORT}` : ""}/${API_PATH}`;
};

export const fetchJob = async (id: number) => {
  const url = `${getBaseUrl()}/jobs/${id}`;
  return (await parseOrThrowRequest(url)) as Promise<any>;
};

export const deleteJob = async (id: string) => {
  const url = `${getBaseUrl()}/jobs/${id}`;
  return (await deleteRequest(url, {})) as Promise<any>;
};
