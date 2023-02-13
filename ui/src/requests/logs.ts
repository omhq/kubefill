import { getServerPort, parseOrThrowRequest } from "./utils";
import { API_PATH, SERVER_HOSTNAME } from "../constants";

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;
const PROTOCOL = window.location.protocol;
const PORT = getServerPort();

const getBaseUrl = () => {
  return `${PROTOCOL}//${DOMAIN}${PORT ? `:${PORT}` : ""}/${API_PATH}`;
};

export const fetchLogs = async (id: number) => {
  const url = `${getBaseUrl()}/jobs/${id}/logs`;
  return (await parseOrThrowRequest(url)) as Promise<any>;
};
