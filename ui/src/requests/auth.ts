import { getLocalStorageJWTKeys, parseOrThrowRequest, post } from "./utils";
import { Application } from "../types";
import { getServerPort } from "./utils";
import { API_PATH, SERVER_HOSTNAME } from "../constants";

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;
const PROTOCOL = window.location.protocol;
const PORT = getServerPort();

const getBaseUrl = () => {
  return `${PROTOCOL}//${DOMAIN}${PORT ? `:${PORT}` : ""}/${API_PATH}`;
};

export const login = async (username: string, password: string) => {
  const url = `${getBaseUrl()}/auth/login`;
  return (await post(url, { username, password })) as Promise<any>;
};

export const getSelf = async () => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/auth/self`;
  return (await parseOrThrowRequest(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<Application[]>;
};
