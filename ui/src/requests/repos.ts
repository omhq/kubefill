import { deleteRequest, getServerPort, parseOrThrowRequest, post, put } from "./utils";
import { Repo, RepoCreate } from "../types";
import { API_PATH, SERVER_HOSTNAME } from "../constants";

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;
const PROTOCOL = window.location.protocol;
const PORT = getServerPort();

const getBaseUrl = () => {
  return `${PROTOCOL}//${DOMAIN}${PORT ? `:${PORT}` : ""}/${API_PATH}`;
};

export const fetchRepos = async () => {
  const url = `${getBaseUrl()}/repos`;
  return (await parseOrThrowRequest(url)) as Promise<Repo[]>;
};

export const createRepo = async (values: RepoCreate) => {
  const url = `${getBaseUrl()}/repos`;
  return (await post(url, values)) as Promise<Repo>;
};

export const updateRepo = async (id: string, values: Partial<any>) => {
  const url = `${getBaseUrl()}/repos/${id}`;
  return (await put(url, values)) as Promise<any>;
};

export const fetchRepo = async (id: string) => {
  const url = `${getBaseUrl()}/repos/${id}`;
  return (await parseOrThrowRequest(url)) as Promise<Repo>;
};

export const syncRepo = async (id: string) => {
  const url = `${getBaseUrl()}/repos/${id}/sync`;
  return (await post(url, {})) as Promise<Repo>;
};

export const deleteRepo = async (id: string) => {
  const url = `${getBaseUrl()}/repos/${id}`;
  return (await deleteRequest(url, {})) as Promise<any>;
};
