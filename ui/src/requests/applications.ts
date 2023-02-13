import { deleteRequest, parseOrThrowRequest, post, put } from "./utils";
import { Application, RunStatus, FormData, ApplicationFull, Secret, SecretCreate } from "../types";
import { getServerPort } from "./utils";
import { API_PATH, SERVER_HOSTNAME } from "../constants";

const DOMAIN = SERVER_HOSTNAME || window.location.hostname;
const PROTOCOL = window.location.protocol;
const PORT = getServerPort();

const getBaseUrl = () => {
  return `${PROTOCOL}//${DOMAIN}${PORT ? `:${PORT}` : ""}/${API_PATH}`;
};

export const createApplication = async (values: Partial<any>) => {
  const url = `${getBaseUrl()}/applications`;
  return (await post(url, values)) as Promise<any>;
};

export const updateApplication = async (id: string, values: Partial<any>) => {
  const url = `${getBaseUrl()}/applications/${id}`;
  return (await put(url, values)) as Promise<any>;
};

export const deleteApplication = async (id: string) => {
  const url = `${getBaseUrl()}/applications/${id}`;
  return (await deleteRequest(url, {})) as Promise<any>;
};

export const fetchApplications = async () => {
  const url = `${getBaseUrl()}/applications`;
  return (await parseOrThrowRequest(url)) as Promise<Application[]>;
};

export const fetchApplication = async (id: number) => {
  const url = `${getBaseUrl()}/applications/${id}`;
  return (await parseOrThrowRequest(url)) as Promise<ApplicationFull>;
};

export const fetchApplicationJobs = async (id: number) => {
  const url = `${getBaseUrl()}/applications/${id}/jobs`;
  return (await parseOrThrowRequest(url)) as Promise<Application[]>;
};

export const startJob = async (id: number, data: FormData) => {
  const url = `${getBaseUrl()}/applications/${id}/jobs`;
  return (await post(url, data)) as Promise<RunStatus>;
};

export const fetchApplicationSecrets = async (applicationId: string) => {
  const url = `${getBaseUrl()}/applications/${applicationId}/secrets`;
  return (await parseOrThrowRequest(url)) as Promise<Secret[]>;
};

export const createApplicationSecret = async (applicationId: string, values: SecretCreate) => {
  const url = `${getBaseUrl()}/applications/${applicationId}/secrets`;
  return (await post(url, values)) as Promise<Secret>;
};

export const updateApplicationSecret = async (
  applicationId: string,
  id: string,
  values: Partial<any>
) => {
  const url = `${getBaseUrl()}/applications/${applicationId}/secrets/${id}`;
  return (await put(url, values)) as Promise<any>;
};

export const fetchApplicationSecret = async (applicationId: string, id: string) => {
  const url = `${getBaseUrl()}/applications/${applicationId}/secrets/${id}`;
  return (await parseOrThrowRequest(url)) as Promise<Secret>;
};

export const deleteApplicationSecret = async (applicationId: string, id: string) => {
  const url = `${getBaseUrl()}/applications/${applicationId}/secrets/${id}`;
  return (await deleteRequest(url, {})) as Promise<any>;
};
