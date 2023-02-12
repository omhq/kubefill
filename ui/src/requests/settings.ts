import { parseOrThrowRequest } from "./utils";
import { API_PATH, SERVER_HOSTNAME, SERVER_PORT } from "../constants";

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;
const PROTOCOL = window.location.protocol;

const getBaseUrl = () => {
  return `${PROTOCOL}//${DOMAIN}${SERVER_PORT ? `:${SERVER_PORT}` : ""}/${API_PATH}`;
};

export const fetchSettings = async () => {
  const url = `${getBaseUrl()}/settings`;
  return (await parseOrThrowRequest(url)) as Promise<Record<string, string>>;
};
