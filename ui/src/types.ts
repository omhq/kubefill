import { RJSFSchema } from "@rjsf/utils";

type Schema = {
  [key: string]: string | string[] | Schema;
};

export type FormData = Record<string, any>;

export type Application = {
  id: number;
  name: string;
  repo_id: string;
  branch: string;
  manifest_path: any;
  created_at: string;
  updated_at: string;
  deleted_at: string;
};

export type ApplicationFull = {
  app: Application;
  manifests: {
    data: FormData;
    schema: RJSFSchema;
    ui_schema: Schema;
  };
};

export type Repo = {
  id: number;
  url: string;
  branch: string;
  commit: string;
  hash: string;
};

export type RepoCreate = {
  url: string;
  branch: string;
  ssh_private_key: string;
};

export type Secret = {
  id: number;
  name: string;
};

export type SecretCreate = {
  name: string;
  value: string;
};

export type RunStatus = any;
