import {
  deleteRequest,
  getLocalStorageJWTKeys,
  getServerPort,
  parseOrThrowRequest,
  post,
  put,
} from "./utils";
import { Repo, RepoCreate } from "../types";
import { API_PATH, SERVER_HOSTNAME } from "../constants";

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;
const PROTOCOL = window.location.protocol;
const PORT = getServerPort();

const getBaseUrl = () => {
  return `${PROTOCOL}//${DOMAIN}${PORT ? `:${PORT}` : ""}/${API_PATH}`;
};

export const fetchRepos = async () => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/repos`;
  return (await parseOrThrowRequest(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<Repo[]>;
};

export const createRepo = async (values: RepoCreate) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/repos`;
  return (await post(url, values, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<Repo>;
};

export const updateRepo = async (id: string, values: Partial<any>) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/repos/${id}`;
  return (await put(url, values, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<any>;
};

export const fetchRepo = async (id: string) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/repos/${id}`;
  return (await parseOrThrowRequest(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<Repo>;
};

export const syncRepo = async (id: string) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/repos/${id}/sync`;
  return (await post(
    url,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtKeys.token}`,
      },
    }
  )) as Promise<Repo>;
};

export const deleteRepo = async (id: string) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/repos/${id}`;
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
