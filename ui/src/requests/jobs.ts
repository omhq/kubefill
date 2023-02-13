import { deleteRequest, getServerPort, parseOrThrowRequest } from "./utils";
import { API_PATH, SERVER_HOSTNAME } from "../constants";

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;
const PROTOCOL = window.location.protocol;
const PORT = getServerPort();

const getBaseUrl = () => {
  return `${PROTOCOL}//${DOMAIN}${PORT ? `:${PORT}` : ""}/${API_PATH}`;
};

export const fetchJob = async (id: number) => {
  const url = `${getBaseUrl()}/jobs/${id}`;
  return (await parseOrThrowRequest(url)) as Promise<any>;
};

export const deleteJob = async (id: string) => {
  const url = `${getBaseUrl()}/jobs/${id}`;
  return (await deleteRequest(url, {})) as Promise<any>;
};
