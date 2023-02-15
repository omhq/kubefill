import { deleteRequest, getLocalStorageJWTKeys, parseOrThrowRequest, post, put } from "./utils";
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
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications`;
  return (await post(url, values, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<any>;
};

export const updateApplication = async (id: string, values: Partial<any>) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications/${id}`;
  return (await put(url, values, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<any>;
};

export const deleteApplication = async (id: string) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications/${id}`;
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

export const fetchApplications = async () => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications`;
  return (await parseOrThrowRequest(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<Application[]>;
};

export const fetchApplication = async (id: number) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications/${id}`;
  return (await parseOrThrowRequest(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<ApplicationFull>;
};

export const fetchApplicationJobs = async (id: number) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications/${id}/jobs`;
  return (await parseOrThrowRequest(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<Application[]>;
};

export const startJob = async (id: number, data: FormData) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications/${id}/jobs`;
  return (await post(url, data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<RunStatus>;
};

export const fetchApplicationSecrets = async (applicationId: string) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications/${applicationId}/secrets`;
  return (await parseOrThrowRequest(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<Secret[]>;
};

export const createApplicationSecret = async (applicationId: string, values: SecretCreate) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications/${applicationId}/secrets`;
  return (await post(url, values, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<Secret>;
};

export const updateApplicationSecret = async (
  applicationId: string,
  id: string,
  values: Partial<any>
) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications/${applicationId}/secrets/${id}`;
  return (await put(url, values, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<any>;
};

export const fetchApplicationSecret = async (applicationId: string, id: string) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications/${applicationId}/secrets/${id}`;
  return (await parseOrThrowRequest(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtKeys.token}`,
    },
  })) as Promise<Secret>;
};

export const deleteApplicationSecret = async (applicationId: string, id: string) => {
  const jwtKeys = getLocalStorageJWTKeys();
  const url = `${getBaseUrl()}/applications/${applicationId}/secrets/${id}`;
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
