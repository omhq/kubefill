import { deleteRequest, getLocalStorageJWTKeys, getServerPort, parseOrThrowRequest } from "./utils";
import { API_PATH, SERVER_HOSTNAME } from "../constants";

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;
const PROTOCOL = window.location.protocol;
const PORT = getServerPort();

const getBaseUrl = () => {
  return `${PROTOCOL}//${DOMAIN}${PORT ? `:${PORT}` : ""}/${API_PATH}`;
};

export const fetchJob = async (id: number) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/jobs/${id}`;
  return (await parseOrThrowRequest(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<any>;
};

export const deleteJob = async (id: string) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/jobs/${id}`;
  return (await deleteRequest(
    url,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtKeys.token}`,
      },
    }
  )) as Promise<any>;
};
